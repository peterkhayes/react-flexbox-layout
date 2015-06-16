import _ from 'lodash';
import React from 'react';
import HLayoutItemIE9 from './horizontal_item_ie9';
import {HLayoutPropTypes, HLayoutDefaultPropTypes} from './prop_types';
import {getHGutterSizes, mapNonEmpty, countNonEmpty, sumSizes, addTo, getSizeCalc} from './util';
import {register, deregister, requestAsyncUpdate} from './update_engine_ie9';

export default class HLayoutIE9 extends React.Component {

  componentWillMount() {
    register(this);
  }

  componentDidMount() {
    this.node = React.findDOMNode(this);
    requestAsyncUpdate();
  }

  componentWillUnmount() {
    deregister(this);
  }

  componentDidUpdate() {
    requestAsyncUpdate();
  }

  render() {
    this.itemsRefs = [];
    this.gutterSizes = getHGutterSizes(this.props.children, this.props.gutter);

    let children = mapNonEmpty(this.props.children, (child, index) => {
      return this._buildChild(child, index, this.gutterSizes);
    });

    return (
      <div ref="horizontal"
        data-display-name="HLayout"
        style={this._getLayoutStyles()}
      >
        {children}
      </div>
    );
  }

  // Construct the Layout Item by either wrapping the raw
  // child with a Layout Item or cloning the child if its already a
  // Layout Item.
  _buildChild(child, index, gutterSizes) {
    let props = {};

    if (index === 0) {
      props._gutterLeft = gutterSizes[0];
    }
    props._gutterRight = gutterSizes[index + 1];

    let ref = `item_${index}`;
    this.itemsRefs.push(ref);

    props.align = child.props.align || this.props.alignItems;
    props.ref = ref;

    if (child.type === HLayoutItemIE9) {
      return React.cloneElement(child, props);
    } else {
      return (
        <HLayoutItemIE9 {...props}>{child}</HLayoutItemIE9>
      );
    }
  }

  _unsetLayoutStyles() {
    const style = this.node.style;

    if (!this.props.height) {
      style.height = '';
    }
    style.whiteSpace = '';
    style.textAlign = '';

    _.range(countNonEmpty(this.props.children)).forEach((i) => {

      this.refs[`item_${i}`]._unsetLayoutStyles();
    }, this);
  }

  _measureInheritedStyles() {
    const computedStyle = window.getComputedStyle(this.node);
    this._inheritedWhiteSpace = computedStyle.whiteSpace;
    this._inheritedTextAlign = computedStyle.textAlign;
    this._inheritedLineHeight = computedStyle.lineHeight;
  }

  _measureWidths() {
    this._measuredWidths = _.range(countNonEmpty(this.props.children)).map((i) => {
      const item = this.refs[`item_${i}`];
      if (item.props.width || item.props.flexGrow) {
        return 0;
      }
      return item._measureWidth();
    });
  }

  _applyInheritedStyles() {
    const style = this.node.style;
    style.whiteSpace = 'nowrap';
    style.textAlign = this.props.justifyItems;

    const items = this.itemsRefs.map(ref => this.refs[ref]);
    _.invoke(items, '_applyInheritedStyles', this._inheritedWhiteSpace, this._inheritedTextAlign, this._inheritedLineHeight);
  }

  _applyWidths() {
    const items = this.itemsRefs.map(ref => this.refs[ref]);

    const totalFlexGrow = _(items)
      .filter(item => item.props.flexGrow)
      .map(item => item.props.flexGrow === true ? 1 : item.props.flexGrow)
      .sum();

    // sum widths used up by elements
    const usedSpace = sumSizes('width', items);

    // add computed widths
    addTo(usedSpace, 'px', _.sum(this._measuredWidths));

    // add gutters
    addTo(usedSpace, 'rem', _.sum(this.gutterSizes));

    _.range(countNonEmpty(this.props.children)).forEach((i) => {
      const item = this.refs[`item_${i}`];
      if (item.props.flexGrow) {
        return item._applyWidth(getSizeCalc(usedSpace, item.props.flexGrow, totalFlexGrow));
      }
    });
  }

  _measureItemHeights() {}
  _applyFlexHeights() {}

  _setContainerHeights() {
    const height = `${this.node.offsetHeight}px`;
    const style = this.node.style;

    style.height = height;

    const items = this.itemsRefs.map(ref => this.refs[ref]);
    _.invoke(items, '_setContainerHeight', height);
  }

  _getLayoutStyles () {
    let styles = {
      display: 'block',
      width: this.props.width,
      height: this.props.height
    };

    return styles;
  }
}


HLayoutIE9.displayName = 'HLayoutIE9';
HLayoutIE9.propTypes = HLayoutPropTypes;
HLayoutIE9.defaultProps = HLayoutDefaultPropTypes;