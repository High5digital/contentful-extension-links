import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Button, List, ListItem, TextLink, Paragraph, Typography, IconButton } from '@contentful/forma-36-react-components';
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
    entry: PropTypes.object.isRequired,
    i: PropTypes.number.isRequired,
    removeItem: PropTypes.func.isRequired
  };

  /* TODO better way to extract base url */
  baseUrl = 'https://app.contentful.com';

  getHref() {
    return `${this.baseUrl}/spaces/${this.props.entry.space}/entries/${this.props.entry.id}`
  }

  removeItem(item, i) {
    this.props.removeItem(item, i);
  }

  onButtonClick = async () => {
    const options = {
      title: 'Confirmation',
      message: 'Are you sure?',
      intent: "negative",
      confirmLabel: "Yes",
      cancelLabel: "No"
    };

    if (await this.props.sdk.dialogs.openConfirm(options)) {
      this.removeItem(this.props.entry, this.props.i);
    }
  };

  render() {
    return (
      <ListItem className="incoming-links__item">
        <TextLink
            linkType="primary"
            href={this.getHref()}
            className="no-underline incoming-links__link"
            target="_blank"
        >
          {this.props.entry.title}
        </TextLink>
        <IconButton
            buttonType="negative"
            onClick={this.onButtonClick}
            testId="open-dialog"
            className="btn-close"
            iconProps={{ icon: 'Close' }}
            label="unlink"
        />
      </ListItem>
    )
  }
}

export class ReferenceLinkList extends React.Component {
  static propTypes = {
    entries: PropTypes.array.isRequired,
    sdk: PropTypes.object.isRequired,
    removeItem: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { entries: [] };
    this.removeItem = this.removeItem.bind(this);
  }

  async componentDidMount() {
    const entries = await Promise.all(_.map(this.props.entries, async e => ({
      id: e.sys.id,
      title: await getTitle(this.props.sdk, e),
      space: e.sys.space.sys.id
    })));
    this.setState({entries: entries});
  }

  removeItem = (item, i) => {
    let entries = this.state.entries.slice();
    entries.splice(i, 1);
    this.setState({ entries });
    this.props.removeItem(item, i);
  };

  render() {
    return (
      <List className="incoming-links__list">
        {this.state.entries.map((item, i)  =>  (
           <ReferenceListItem
               key={item.id}
               sdk={this.props.sdk}
               entry={item}
               i={i}
               removeItem={this.removeItem}
           />
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
    this.removeItem = this.removeItem.bind(this);
  }

  async componentDidMount() {
    this.props.sdk.window.startAutoResizer();
    const entities = await getLinkedEntries(this.props.sdk);
    this.setState({entities: entities});
  }

  removeItem(item, i) {
    let entities = this.state.entities.slice();
    entities.splice(i, 1);
    this.setState({ entities });
  }

  render() {
    const n = _.size(this.state.entities);
    return (
      <Typography className="entity-sidebar__incoming-links">
        <Paragraph className="incoming-links__message">
          { n === 1 && "There is one other entry that links to this entry:" }
          { n > 1 && `There are ${ n } other entries that link to this entry:` }
          { n === 0 && 'No other entries link to this entry.' }
        </Paragraph>
        { n !== 0 &&
        <ReferenceLinkList
            removeItem={this.removeItem}
            sdk={this.props.sdk}
            entries={this.state.entities}
        />
        }
      </Typography>
    );
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
