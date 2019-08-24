import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Button, List, ListItem, TextLink } from '@contentful/forma-36-react-components';
import { init, locations } from 'contentful-ui-extensions-sdk';
import tokens from '@contentful/forma-36-tokens';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';
import { unlink, getLinkedEntries, getTitle, printE } from './unlink.js'
import _ from 'lodash'

export class DialogExtension extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  render() {
    return (
      <div style={{ margin: tokens.spacingM }}>
        <Button
          testId="close-dialog"
          buttonType="muted"
          onClick={() => {
            this.props.sdk.close('data from modal dialog');
          }}
        >
          Close modal
        </Button>
      </div>
    );
  }
}

export class ReferenceListItem extends React.Component{
  static propTypes = {
    sdk: PropTypes.object.isRequired,
    entry: PropTypes.string.isRequired,
    space: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  };

  getHref() {
    return `https://app.contentful.com/spaces/${this.props.space}/entries/${this.props.entry}`
  }

  onButtonClick = async () => {
    const result = await this.props.sdk.dialogs.openExtension({
      width: 800,
      title: 'The same extension rendered in modal window'
    });
    console.log(result);
  };

  render() {
    return (
      <ListItem>
        <TextLink
            linkType="primary"
            href={this.getHref()}
        >
          {this.props.title}
        </TextLink>
        <Button
            buttonType="negative"
            onClick={this.onButtonClick}
            isFullWidth={false}
            testId="open-dialog"
        >
          X
        </Button>
      </ListItem>
    )
  }
}

export class ReferenceLinkList extends React.Component {
  static propTypes = {
    entries: PropTypes.array.isRequired,
    sdk: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { entries: [] };
  }

  async componentDidMount() {
    const entries = await Promise.all(_.map(this.props.entries, async e => ({
        id: e.sys.id,
        title: await getTitle(this.props.sdk, e),
        space: e.sys.space.sys.id
    })));
    this.setState({entries: entries});
  }

  render() {
    return (
      <List>
        {this.state.entries.map((item, key)  =>  (
           <ReferenceListItem key={item.id} sdk={this.props.sdk} entry={item.id} space={item.space} title={item.title}/>
          ))}
      </List>
    );
  }
}

export class SidebarExtension extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { entities: [] };
  }

  async componentDidMount() {
    this.props.sdk.window.startAutoResizer();
    const entities = await getLinkedEntries(this.props.sdk);
    this.setState({entities: entities});
  }

  onButtonClick = async () => {
    const result = await this.props.sdk.dialogs.openExtension({
      width: 800,
      title: 'The same extension rendered in modal window'
    });
    console.log(result);
  };

  render() {
    if (_.isEmpty(this.state.entities)) {
      return <p>No other entries link to this entry.</p>;
    } else {
      return (
        <div>
          <p>There is entries that links to this entry:</p>
          <ReferenceLinkList sdk={this.props.sdk} entries={this.state.entities}/>
        </div>
      );
    }
  }
}

export const initialize = async sdk => {
  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    ReactDOM.render(<DialogExtension sdk={sdk} />, document.getElementById('root'));
  } else if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    ReactDOM.render(<SidebarExtension sdk={sdk} />, document.getElementById('root'));
  }
  await unlink(sdk);
};

init(initialize);

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
