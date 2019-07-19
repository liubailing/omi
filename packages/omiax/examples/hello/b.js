(function () {
  'use strict';

  // https://github.com/facebook/css-layout

  /**
   * Copyright (c) 2014, Facebook, Inc.
   * All rights reserved.
   *
   * This source code is licensed under the BSD-style license found in the
   * LICENSE file in the root directory of this source tree. An additional grant
   * of patent rights can be found in the PATENTS file in the same directory.
   */

  var computeLayout = function () {

    function capitalizeFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function getSpacing(node, type, suffix, location) {
      var key = type + capitalizeFirst(location) + suffix;
      if (key in node.style) {
        return node.style[key];
      }

      key = type + suffix;
      if (key in node.style) {
        return node.style[key];
      }

      return 0;
    }

    function getPositiveSpacing(node, type, suffix, location) {
      var key = type + capitalizeFirst(location) + suffix;
      if (key in node.style && node.style[key] >= 0) {
        return node.style[key];
      }

      key = type + suffix;
      if (key in node.style && node.style[key] >= 0) {
        return node.style[key];
      }

      return 0;
    }

    function isUndefined(value) {
      return value === undefined;
    }

    function getMargin(node, location) {
      return getSpacing(node, 'margin', '', location);
    }

    function getPadding(node, location) {
      return getPositiveSpacing(node, 'padding', '', location);
    }

    function getBorder(node, location) {
      return getPositiveSpacing(node, 'border', 'Width', location);
    }

    function getPaddingAndBorder(node, location) {
      return getPadding(node, location) + getBorder(node, location);
    }

    function getMarginAxis(node, axis) {
      return getMargin(node, leading[axis]) + getMargin(node, trailing[axis]);
    }

    function getPaddingAndBorderAxis(node, axis) {
      return getPaddingAndBorder(node, leading[axis]) + getPaddingAndBorder(node, trailing[axis]);
    }

    function getJustifyContent(node) {
      if ('justifyContent' in node.style) {
        return node.style.justifyContent;
      }
      return 'flex-start';
    }

    function getAlignItem(node, child) {
      if ('alignSelf' in child.style) {
        return child.style.alignSelf;
      }
      if ('alignItems' in node.style) {
        return node.style.alignItems;
      }
      return 'stretch';
    }

    function getFlexDirection(node) {
      if ('flexDirection' in node.style) {
        return node.style.flexDirection;
      }
      return 'column';
    }

    function getPositionType(node) {
      if ('position' in node.style) {
        return node.style.position;
      }
      return 'relative';
    }

    function getFlex(node) {
      return node.style.flex;
    }

    function isFlex(node) {
      return getPositionType(node) === CSS_POSITION_RELATIVE && getFlex(node) > 0;
    }

    function isFlexWrap(node) {
      return node.style.flexWrap === 'wrap';
    }

    function getDimWithMargin(node, axis) {
      return node.layout[dim[axis]] + getMarginAxis(node, axis);
    }

    function isDimDefined(node, axis) {
      return !isUndefined(node.style[dim[axis]]) && node.style[dim[axis]] >= 0;
    }

    function isPosDefined(node, pos) {
      return !isUndefined(node.style[pos]);
    }

    function isMeasureDefined(node) {
      return 'measure' in node.style;
    }

    function getPosition(node, pos) {
      if (pos in node.style) {
        return node.style[pos];
      }
      return 0;
    }

    // When the user specifically sets a value for width or height
    function setDimensionFromStyle(node, axis) {
      // The parent already computed us a width or height. We just skip it
      if (!isUndefined(node.layout[dim[axis]])) {
        return;
      }
      // We only run if there's a width or height defined
      if (!isDimDefined(node, axis)) {
        return;
      }

      // The dimensions can never be smaller than the padding and border
      node.layout[dim[axis]] = fmaxf(node.style[dim[axis]], getPaddingAndBorderAxis(node, axis));
    }

    // If both left and right are defined, then use left. Otherwise return
    // +left or -right depending on which is defined.
    function getRelativePosition(node, axis) {
      if (leading[axis] in node.style) {
        return getPosition(node, leading[axis]);
      }
      return -getPosition(node, trailing[axis]);
    }

    var leading = {
      row: 'left',
      column: 'top'
    };
    var trailing = {
      row: 'right',
      column: 'bottom'
    };
    var pos = {
      row: 'left',
      column: 'top'
    };
    var dim = {
      row: 'width',
      column: 'height'
    };

    function fmaxf(a, b) {
      if (a > b) {
        return a;
      }
      return b;
    }

    var CSS_UNDEFINED = undefined;

    var CSS_FLEX_DIRECTION_ROW = 'row';
    var CSS_FLEX_DIRECTION_COLUMN = 'column';

    var CSS_JUSTIFY_FLEX_START = 'flex-start';
    var CSS_JUSTIFY_CENTER = 'center';
    var CSS_JUSTIFY_FLEX_END = 'flex-end';
    var CSS_JUSTIFY_SPACE_BETWEEN = 'space-between';
    var CSS_JUSTIFY_SPACE_AROUND = 'space-around';

    var CSS_ALIGN_FLEX_START = 'flex-start';
    var CSS_ALIGN_CENTER = 'center';
    var CSS_ALIGN_STRETCH = 'stretch';

    var CSS_POSITION_RELATIVE = 'relative';
    var CSS_POSITION_ABSOLUTE = 'absolute';

    return function layoutNode(node, parentMaxWidth) {
      var /*css_flex_direction_t*/mainAxis = getFlexDirection(node);
      var /*css_flex_direction_t*/crossAxis = mainAxis === CSS_FLEX_DIRECTION_ROW ? CSS_FLEX_DIRECTION_COLUMN : CSS_FLEX_DIRECTION_ROW;

      // Handle width and height style attributes
      setDimensionFromStyle(node, mainAxis);
      setDimensionFromStyle(node, crossAxis);

      // The position is set by the parent, but we need to complete it with a
      // delta composed of the margin and left/top/right/bottom
      node.layout[leading[mainAxis]] += getMargin(node, leading[mainAxis]) + getRelativePosition(node, mainAxis);
      node.layout[leading[crossAxis]] += getMargin(node, leading[crossAxis]) + getRelativePosition(node, crossAxis);

      if (isMeasureDefined(node)) {
        var /*float*/width = CSS_UNDEFINED;
        if (isDimDefined(node, CSS_FLEX_DIRECTION_ROW)) {
          width = node.style.width;
        } else if (!isUndefined(node.layout[dim[CSS_FLEX_DIRECTION_ROW]])) {
          width = node.layout[dim[CSS_FLEX_DIRECTION_ROW]];
        } else {
          width = parentMaxWidth - getMarginAxis(node, CSS_FLEX_DIRECTION_ROW);
        }
        width -= getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);

        // We only need to give a dimension for the text if we haven't got any
        // for it computed yet. It can either be from the style attribute or because
        // the element is flexible.
        var /*bool*/isRowUndefined = !isDimDefined(node, CSS_FLEX_DIRECTION_ROW) && isUndefined(node.layout[dim[CSS_FLEX_DIRECTION_ROW]]);
        var /*bool*/isColumnUndefined = !isDimDefined(node, CSS_FLEX_DIRECTION_COLUMN) && isUndefined(node.layout[dim[CSS_FLEX_DIRECTION_COLUMN]]);

        // Let's not measure the text if we already know both dimensions
        if (isRowUndefined || isColumnUndefined) {
          var /*css_dim_t*/measure_dim = node.style.measure(
          /*(c)!node->context,*/
          width);
          if (isRowUndefined) {
            node.layout.width = measure_dim.width + getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
          }
          if (isColumnUndefined) {
            node.layout.height = measure_dim.height + getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_COLUMN);
          }
        }
        return;
      }

      // Pre-fill some dimensions straight from the parent
      for (var /*int*/i = 0; i < node.children.length; ++i) {
        var /*css_node_t**/child = node.children[i];
        // Pre-fill cross axis dimensions when the child is using stretch before
        // we call the recursive layout pass
        if (getAlignItem(node, child) === CSS_ALIGN_STRETCH && getPositionType(child) === CSS_POSITION_RELATIVE && !isUndefined(node.layout[dim[crossAxis]]) && !isDimDefined(child, crossAxis)) {
          child.layout[dim[crossAxis]] = fmaxf(node.layout[dim[crossAxis]] - getPaddingAndBorderAxis(node, crossAxis) - getMarginAxis(child, crossAxis),
          // You never want to go smaller than padding
          getPaddingAndBorderAxis(child, crossAxis));
        } else if (getPositionType(child) == CSS_POSITION_ABSOLUTE) {
          // Pre-fill dimensions when using absolute position and both offsets for the axis are defined (either both
          // left and right or top and bottom).
          for (var /*int*/ii = 0; ii < 2; ii++) {
            var /*css_flex_direction_t*/axis = ii != 0 ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
            if (!isUndefined(node.layout[dim[axis]]) && !isDimDefined(child, axis) && isPosDefined(child, leading[axis]) && isPosDefined(child, trailing[axis])) {
              child.layout[dim[axis]] = fmaxf(node.layout[dim[axis]] - getPaddingAndBorderAxis(node, axis) - getMarginAxis(child, axis) - getPosition(child, leading[axis]) - getPosition(child, trailing[axis]),
              // You never want to go smaller than padding
              getPaddingAndBorderAxis(child, axis));
            }
          }
        }
      }

      var /*float*/definedMainDim = CSS_UNDEFINED;
      if (!isUndefined(node.layout[dim[mainAxis]])) {
        definedMainDim = node.layout[dim[mainAxis]] - getPaddingAndBorderAxis(node, mainAxis);
      }

      // We want to execute the next two loops one per line with flex-wrap
      var /*int*/startLine = 0;
      var /*int*/endLine = 0;
      var /*int*/alreadyComputedNextLayout = 0;
      // We aggregate the total dimensions of the container in those two variables
      var /*float*/linesCrossDim = 0;
      var /*float*/linesMainDim = 0;
      while (endLine < node.children.length) {
        // <Loop A> Layout non flexible children and count children by type

        // mainContentDim is accumulation of the dimensions and margin of all the
        // non flexible children. This will be used in order to either set the
        // dimensions of the node if none already exist, or to compute the
        // remaining space left for the flexible children.
        var /*float*/mainContentDim = 0;

        // There are three kind of children, non flexible, flexible and absolute.
        // We need to know how many there are in order to distribute the space.
        var /*int*/flexibleChildrenCount = 0;
        var /*float*/totalFlexible = 0;
        var /*int*/nonFlexibleChildrenCount = 0;
        for (var /*int*/i = startLine; i < node.children.length; ++i) {
          var /*css_node_t**/child = node.children[i];
          var /*float*/nextContentDim = 0;

          // It only makes sense to consider a child flexible if we have a computed
          // dimension for the node.
          if (!isUndefined(node.layout[dim[mainAxis]]) && isFlex(child)) {
            flexibleChildrenCount++;
            totalFlexible += getFlex(child);

            // Even if we don't know its exact size yet, we already know the padding,
            // border and margin. We'll use this partial information to compute the
            // remaining space.
            nextContentDim = getPaddingAndBorderAxis(child, mainAxis) + getMarginAxis(child, mainAxis);
          } else {
            var /*float*/maxWidth = CSS_UNDEFINED;
            if (mainAxis === CSS_FLEX_DIRECTION_ROW) {
              // do nothing
            } else if (isDimDefined(node, CSS_FLEX_DIRECTION_ROW)) {
              maxWidth = node.layout[dim[CSS_FLEX_DIRECTION_ROW]] - getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
            } else {
              maxWidth = parentMaxWidth - getMarginAxis(node, CSS_FLEX_DIRECTION_ROW) - getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
            }

            // This is the main recursive call. We layout non flexible children.
            if (alreadyComputedNextLayout === 0) {
              layoutNode(child, maxWidth);
            }

            // Absolute positioned elements do not take part of the layout, so we
            // don't use them to compute mainContentDim
            if (getPositionType(child) === CSS_POSITION_RELATIVE) {
              nonFlexibleChildrenCount++;
              // At this point we know the final size and margin of the element.
              nextContentDim = getDimWithMargin(child, mainAxis);
            }
          }

          // The element we are about to add would make us go to the next line
          if (isFlexWrap(node) && !isUndefined(node.layout[dim[mainAxis]]) && mainContentDim + nextContentDim > definedMainDim &&
          // If there's only one element, then it's bigger than the content
          // and needs its own line
          i !== startLine) {
            alreadyComputedNextLayout = 1;
            break;
          }
          alreadyComputedNextLayout = 0;
          mainContentDim += nextContentDim;
          endLine = i + 1;
        }

        // <Loop B> Layout flexible children and allocate empty space

        // In order to position the elements in the main axis, we have two
        // controls. The space between the beginning and the first element
        // and the space between each two elements.
        var /*float*/leadingMainDim = 0;
        var /*float*/betweenMainDim = 0;

        // The remaining available space that needs to be allocated
        var /*float*/remainingMainDim = 0;
        if (!isUndefined(node.layout[dim[mainAxis]])) {
          remainingMainDim = definedMainDim - mainContentDim;
        } else {
          remainingMainDim = fmaxf(mainContentDim, 0) - mainContentDim;
        }

        // If there are flexible children in the mix, they are going to fill the
        // remaining space
        if (flexibleChildrenCount !== 0) {
          var /*float*/flexibleMainDim = remainingMainDim / totalFlexible;

          // The non flexible children can overflow the container, in this case
          // we should just assume that there is no space available.
          if (flexibleMainDim < 0) {
            flexibleMainDim = 0;
          }
          // We iterate over the full array and only apply the action on flexible
          // children. This is faster than actually allocating a new array that
          // contains only flexible children.
          for (var /*int*/i = startLine; i < endLine; ++i) {
            var /*css_node_t**/child = node.children[i];
            if (isFlex(child)) {
              // At this point we know the final size of the element in the main
              // dimension
              child.layout[dim[mainAxis]] = flexibleMainDim * getFlex(child) + getPaddingAndBorderAxis(child, mainAxis);

              var /*float*/maxWidth = CSS_UNDEFINED;
              if (mainAxis === CSS_FLEX_DIRECTION_ROW) {
                // do nothing
              } else if (isDimDefined(node, CSS_FLEX_DIRECTION_ROW)) {
                maxWidth = node.layout[dim[CSS_FLEX_DIRECTION_ROW]] - getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
              } else {
                maxWidth = parentMaxWidth - getMarginAxis(node, CSS_FLEX_DIRECTION_ROW) - getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
              }

              // And we recursively call the layout algorithm for this child
              layoutNode(child, maxWidth);
            }
          }

          // We use justifyContent to figure out how to allocate the remaining
          // space available
        } else {
          var /*css_justify_t*/justifyContent = getJustifyContent(node);
          if (justifyContent === CSS_JUSTIFY_FLEX_START) {
            // Do nothing
          } else if (justifyContent === CSS_JUSTIFY_CENTER) {
            leadingMainDim = remainingMainDim / 2;
          } else if (justifyContent === CSS_JUSTIFY_FLEX_END) {
            leadingMainDim = remainingMainDim;
          } else if (justifyContent === CSS_JUSTIFY_SPACE_BETWEEN) {
            remainingMainDim = fmaxf(remainingMainDim, 0);
            if (flexibleChildrenCount + nonFlexibleChildrenCount - 1 !== 0) {
              betweenMainDim = remainingMainDim / (flexibleChildrenCount + nonFlexibleChildrenCount - 1);
            } else {
              betweenMainDim = 0;
            }
          } else if (justifyContent === CSS_JUSTIFY_SPACE_AROUND) {
            // Space on the edges is half of the space between elements
            betweenMainDim = remainingMainDim / (flexibleChildrenCount + nonFlexibleChildrenCount);
            leadingMainDim = betweenMainDim / 2;
          }
        }

        // <Loop C> Position elements in the main axis and compute dimensions

        // At this point, all the children have their dimensions set. We need to
        // find their position. In order to do that, we accumulate data in
        // variables that are also useful to compute the total dimensions of the
        // container!
        var /*float*/crossDim = 0;
        var /*float*/mainDim = leadingMainDim + getPaddingAndBorder(node, leading[mainAxis]);

        for (var /*int*/i = startLine; i < endLine; ++i) {
          var /*css_node_t**/child = node.children[i];

          if (getPositionType(child) === CSS_POSITION_ABSOLUTE && isPosDefined(child, leading[mainAxis])) {
            // In case the child is position absolute and has left/top being
            // defined, we override the position to whatever the user said
            // (and margin/border).
            child.layout[pos[mainAxis]] = getPosition(child, leading[mainAxis]) + getBorder(node, leading[mainAxis]) + getMargin(child, leading[mainAxis]);
          } else {
            // If the child is position absolute (without top/left) or relative,
            // we put it at the current accumulated offset.
            child.layout[pos[mainAxis]] += mainDim;
          }

          // Now that we placed the element, we need to update the variables
          // We only need to do that for relative elements. Absolute elements
          // do not take part in that phase.
          if (getPositionType(child) === CSS_POSITION_RELATIVE) {
            // The main dimension is the sum of all the elements dimension plus
            // the spacing.
            mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);
            // The cross dimension is the max of the elements dimension since there
            // can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, getDimWithMargin(child, crossAxis));
          }
        }

        var /*float*/containerMainAxis = node.layout[dim[mainAxis]];
        // If the user didn't specify a width or height, and it has not been set
        // by the container, then we set it via the children.
        if (isUndefined(node.layout[dim[mainAxis]])) {
          containerMainAxis = fmaxf(
          // We're missing the last padding at this point to get the final
          // dimension
          mainDim + getPaddingAndBorder(node, trailing[mainAxis]),
          // We can never assign a width smaller than the padding and borders
          getPaddingAndBorderAxis(node, mainAxis));
        }

        var /*float*/containerCrossAxis = node.layout[dim[crossAxis]];
        if (isUndefined(node.layout[dim[crossAxis]])) {
          containerCrossAxis = fmaxf(
          // For the cross dim, we add both sides at the end because the value
          // is aggregate via a max function. Intermediate negative values
          // can mess this computation otherwise
          crossDim + getPaddingAndBorderAxis(node, crossAxis), getPaddingAndBorderAxis(node, crossAxis));
        }

        // <Loop D> Position elements in the cross axis

        for (var /*int*/i = startLine; i < endLine; ++i) {
          var /*css_node_t**/child = node.children[i];

          if (getPositionType(child) === CSS_POSITION_ABSOLUTE && isPosDefined(child, leading[crossAxis])) {
            // In case the child is absolutely positionned and has a
            // top/left/bottom/right being set, we override all the previously
            // computed positions to set it correctly.
            child.layout[pos[crossAxis]] = getPosition(child, leading[crossAxis]) + getBorder(node, leading[crossAxis]) + getMargin(child, leading[crossAxis]);
          } else {
            var /*float*/leadingCrossDim = getPaddingAndBorder(node, leading[crossAxis]);

            // For a relative children, we're either using alignItems (parent) or
            // alignSelf (child) in order to determine the position in the cross axis
            if (getPositionType(child) === CSS_POSITION_RELATIVE) {
              var /*css_align_t*/alignItem = getAlignItem(node, child);
              if (alignItem === CSS_ALIGN_FLEX_START) {
                // Do nothing
              } else if (alignItem === CSS_ALIGN_STRETCH) {
                // You can only stretch if the dimension has not already been set
                // previously.
                if (!isDimDefined(child, crossAxis)) {
                  child.layout[dim[crossAxis]] = fmaxf(containerCrossAxis - getPaddingAndBorderAxis(node, crossAxis) - getMarginAxis(child, crossAxis),
                  // You never want to go smaller than padding
                  getPaddingAndBorderAxis(child, crossAxis));
                }
              } else {
                // The remaining space between the parent dimensions+padding and child
                // dimensions+margin.
                var /*float*/remainingCrossDim = containerCrossAxis - getPaddingAndBorderAxis(node, crossAxis) - getDimWithMargin(child, crossAxis);

                if (alignItem === CSS_ALIGN_CENTER) {
                  leadingCrossDim += remainingCrossDim / 2;
                } else {
                  // CSS_ALIGN_FLEX_END
                  leadingCrossDim += remainingCrossDim;
                }
              }
            }

            // And we apply the position
            child.layout[pos[crossAxis]] += linesCrossDim + leadingCrossDim;
          }
        }

        linesCrossDim += crossDim;
        linesMainDim = fmaxf(linesMainDim, mainDim);
        startLine = endLine;
      }

      // If the user didn't specify a width or height, and it has not been set
      // by the container, then we set it via the children.
      if (isUndefined(node.layout[dim[mainAxis]])) {
        node.layout[dim[mainAxis]] = fmaxf(
        // We're missing the last padding at this point to get the final
        // dimension
        linesMainDim + getPaddingAndBorder(node, trailing[mainAxis]),
        // We can never assign a width smaller than the padding and borders
        getPaddingAndBorderAxis(node, mainAxis));
      }

      if (isUndefined(node.layout[dim[crossAxis]])) {
        node.layout[dim[crossAxis]] = fmaxf(
        // For the cross dim, we add both sides at the end because the value
        // is aggregate via a max function. Intermediate negative values
        // can mess this computation otherwise
        linesCrossDim + getPaddingAndBorderAxis(node, crossAxis), getPaddingAndBorderAxis(node, crossAxis));
      }

      // <Loop E> Calculate dimensions for absolutely positioned elements

      for (var /*int*/i = 0; i < node.children.length; ++i) {
        var /*css_node_t**/child = node.children[i];
        if (getPositionType(child) == CSS_POSITION_ABSOLUTE) {
          // Pre-fill dimensions when using absolute position and both offsets for the axis are defined (either both
          // left and right or top and bottom).
          for (var /*int*/ii = 0; ii < 2; ii++) {
            var /*css_flex_direction_t*/axis = ii !== 0 ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
            if (!isUndefined(node.layout[dim[axis]]) && !isDimDefined(child, axis) && isPosDefined(child, leading[axis]) && isPosDefined(child, trailing[axis])) {
              child.layout[dim[axis]] = fmaxf(node.layout[dim[axis]] - getPaddingAndBorderAxis(node, axis) - getMarginAxis(child, axis) - getPosition(child, leading[axis]) - getPosition(child, trailing[axis]),
              // You never want to go smaller than padding
              getPaddingAndBorderAxis(child, axis));
            }
          }
          for (var /*int*/ii = 0; ii < 2; ii++) {
            var /*css_flex_direction_t*/axis = ii !== 0 ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
            if (isPosDefined(child, trailing[axis]) && !isPosDefined(child, leading[axis])) {
              child.layout[leading[axis]] = node.layout[dim[axis]] - child.layout[dim[axis]] - getPosition(child, trailing[axis]);
            }
          }
        }
      }
    };
  }();

  // https://github.com/Flipboard/react-canvas

  /**
   * This computes the CSS layout for a RenderLayer tree and mutates the frame
   * objects at each node.
   *
   * @param {Renderlayer} root
   * @return {Object}
   */
  function layoutNode(root) {
    var rootNode = createNode(root);
    computeLayout(rootNode);
    walkNode(rootNode);
    return rootNode;
  }

  function createNode(layer) {
    return {
      layer: layer,
      layout: {
        width: undefined, // computeLayout will mutate
        height: undefined, // computeLayout will mutate
        top: 0,
        left: 0
      },
      style: layer.attributes && layer.attributes.style || {},
      children: (layer.children || []).map(createNode)
    };
  }

  function walkNode(node, parentLeft, parentTop) {
    node.layer.frame.x = node.layout.left + (parentLeft || 0);
    node.layer.frame.y = node.layout.top + (parentTop || 0);
    node.layer.frame.width = node.layout.width;
    node.layer.frame.height = node.layout.height;
    if (node.children && node.children.length > 0) {
      node.children.forEach(function (child) {
        walkNode(child, node.layer.frame.x, node.layer.frame.y);
      });
    }
  }

  var stack = [];

  /**
   * JSX/hyperscript reviver.
   * @see http://jasonformat.com/wtf-is-jsx
   * Benchmarks: https://esbench.com/bench/57ee8f8e330ab09900a1a1a0
   *
   * Note: this is exported as both `h()` and `createElement()` for compatibility reasons.
   *
   * Creates a VNode (virtual DOM element). A tree of VNodes can be used as a lightweight representation
   * of the structure of a DOM tree. This structure can be realized by recursively comparing it against
   * the current _actual_ DOM structure, and applying only the differences.
   *
   * `h()`/`createElement()` accepts an element name, a list of attributes/props,
   * and optionally children to append to the element.
   *
   * @example The following DOM tree
   *
   * `<div id="foo" name="bar">Hello!</div>`
   *
   * can be constructed using this function as:
   *
   * `h('div', { id: 'foo', name : 'bar' }, 'Hello!');`
   *
   * @param {string} nodeName	An element name. Ex: `div`, `a`, `span`, etc.
   * @param {Object} attributes	Any attributes/props to set on the created element.
   * @param rest			Additional arguments are taken to be children to append. Can be infinitely nested Arrays.
   *
   * @public
   */
  function h(type, attributes) {
    var children = [],
        lastSimple = void 0,
        child = void 0,
        simple = void 0,
        i = void 0;
    for (i = arguments.length; i-- > 2;) {
      stack.push(arguments[i]);
    }
    if (attributes && attributes.children != null) {
      if (!stack.length) stack.push(attributes.children);
      delete attributes.children;
    }

    var p = {};
    if (type !== 'text') {
      while (stack.length) {
        if ((child = stack.pop()) && child.pop !== undefined) {
          for (i = child.length; i--;) {
            stack.push(child[i]);
          }
        } else {
          if (typeof child === 'boolean') child = null;

          if (simple = typeof type !== 'function') {
            if (child == null) child = '';else if (typeof child === 'number') child = String(child);else if (typeof child !== 'string') simple = false;
          }

          if (simple && lastSimple) {
            children[children.length - 1] += child;
          } else if (children.length === 0) {
            children = [child];
          } else {
            children.push(child);
          }

          lastSimple = simple;
        }
      }
    } else {
      p.value = stack.pop();
    }

    p.type = type;
    p.frame = {
      "x": 0,
      "y": 0,
      "width": 0,
      "height": 0
    };
    p.children = children;
    p.attributes = attributes == null ? undefined : attributes;
    p.key = attributes == null ? undefined : attributes.key;

    return p;
  }

  // render modes

  var NO_RENDER = 0;
  var SYNC_RENDER = 1;
  var FORCE_RENDER = 2;
  var ASYNC_RENDER = 3;

  var ATTR_KEY = '__omiattr_';

  // DOM properties that should NOT have "px" added when numeric
  var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

  var nodeId = 1;
  function uniqueId() {
    return nodeId++;
  }

  var docMap = {};

  function addDoc(id, doc) {
    docMap[id] = doc;
  }

  function getDoc(id) {
    return docMap[id];
  }

  function removeDoc(id) {
    delete docMap[id];
  }

  function insertIndex(target, list, newIndex) {
    if (newIndex < 0) {
      newIndex = 0;
    }
    var before = list[newIndex - 1];
    var after = list[newIndex];
    list.splice(newIndex, 0, target);

    before && (before.nextSibling = target);
    target.previousSibling = before;
    target.nextSibling = after;
    after && (after.previousSibling = target);

    return newIndex;
  }

  function moveIndex(target, list, newIndex) {
    var index = list.indexOf(target);

    if (index < 0) {
      return -1;
    }

    var before = list[index - 1];
    var after = list[index + 1];
    before && (before.nextSibling = after);
    after && (after.previousSibling = before);

    list.splice(index, 1);
    var newIndexAfter = newIndex;
    if (index <= newIndex) {
      newIndexAfter = newIndex - 1;
    }
    var beforeNew = list[newIndexAfter - 1];
    var afterNew = list[newIndexAfter];
    list.splice(newIndexAfter, 0, target);

    beforeNew && (beforeNew.nextSibling = target);
    target.previousSibling = beforeNew;
    target.nextSibling = afterNew;
    afterNew && (afterNew.previousSibling = target);

    if (index === newIndexAfter) {
      return -1;
    }
    return newIndex;
  }

  function removeIndex(target, list, changeSibling) {
    var index = list.indexOf(target);

    if (index < 0) {
      return;
    }
    if (changeSibling) {
      var before = list[index - 1];
      var after = list[index + 1];
      before && (before.nextSibling = after);
      after && (after.previousSibling = before);
    }
    list.splice(index, 1);
  }

  function linkParent(node, parent) {
    node.parentNode = parent;
    if (parent.docId) {
      node.docId = parent.docId;
      node.ownerDocument = parent.ownerDocument;
      node.ownerDocument.nodeMap[node.nodeId] = node;
      node.depth = parent.depth + 1;
    }

    node.childNodes && node.childNodes.forEach(function (child) {
      linkParent(child, node);
    });
  }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var displayMap = {
  	div: 'block',
  	span: 'inline-block'
  };

  function registerNode(docId, node) {
  	var doc = getDoc(docId);
  	doc.nodeMap[node.nodeId] = node;
  }

  var Element$1 = function () {
  	function Element(type) {
  		_classCallCheck(this, Element);

  		this.nodeType = 1;
  		this.nodeId = uniqueId();
  		this.ref = this.nodeId;
  		this.type = type;
  		this.attributes = {};
  		this.style = {
  			display: displayMap[type]
  		};
  		this.classStyle = {};
  		this.event = {};
  		this.childNodes = [];

  		this.nodeName = this.type;

  		this.parentNode = null;
  		this.nextSibling = null;
  		this.previousSibling = null;
  		this.firstChild = null;
  	}

  	Element.prototype.appendChild = function appendChild(node) {
  		if (!node.parentNode) {
  			linkParent(node, this);
  			insertIndex(node, this.childNodes, this.childNodes.length, true);

  			if (this.docId != undefined) {
  				registerNode(this.docId, node);
  			}

  			//this.ownerDocument.addElement(this.ref, node.toJSON(), -1)
  		} else {
  			node.parentNode.removeChild(node);

  			this.appendChild(node);

  			return;
  		}

  		this.firstChild = this.childNodes[0];
  	};

  	Element.prototype.insertBefore = function insertBefore(node, before) {
  		if (!node.parentNode) {
  			linkParent(node, this);
  			var index = insertIndex(node, this.childNodes, this.childNodes.indexOf(before), true);
  			if (this.docId != undefined) {
  				registerNode(this.docId, node);
  			}

  			//this.ownerDocument.addElement(this.ref, node.toJSON(), index)
  		} else {
  			node.parentNode.removeChild(node);
  			this.insertBefore(node, before);
  			return;
  		}

  		this.firstChild = this.childNodes[0];
  	};

  	Element.prototype.insertAfter = function insertAfter(node, after) {
  		if (node.parentNode && node.parentNode !== this) {
  			return;
  		}
  		if (node === after || node.previousSibling && node.previousSibling === after) {
  			return;
  		}
  		if (!node.parentNode) {
  			linkParent(node, this);
  			var index = insertIndex(node, this.childNodes, this.childNodes.indexOf(after) + 1, true);

  			if (this.docId != undefined) {
  				registerNode(this.docId, node);
  			}

  			//this.ownerDocument.addElement(this.ref, node.toJSON(), index)
  		} else {
  			var _index = moveIndex(node, this.childNodes, this.childNodes.indexOf(after) + 1);

  			//this.ownerDocument.moveElement(node.ref, this.ref, index)
  		}

  		this.firstChild = this.childNodes[0];
  	};

  	Element.prototype.removeChild = function removeChild(node) {
  		if (node.parentNode) {
  			removeIndex(node, this.childNodes, true);

  			this.ownerDocument.removeElement(node.ref);
  		}

  		node.parentNode = null;

  		this.firstChild = this.childNodes[0];
  	};

  	Element.prototype.setAttribute = function setAttribute(key, value, silent) {
  		if (this.attributes[key] === value && silent !== false) {
  			return;
  		}
  		this.attributes[key] = value;
  		if (!silent) {
  			var result = {};
  			result[key] = value;

  			this.ownerDocument.setAttr(this.ref, result);
  		}
  	};

  	Element.prototype.removeAttribute = function removeAttribute(key) {
  		if (this.attributes[key]) {
  			delete this.attributes[key];
  		}
  	};

  	Element.prototype.setStyle = function setStyle(key, value, silent) {
  		if (this.style[key] === value && silent !== false) {
  			return;
  		}
  		this.style[key] = value;
  		if (!silent && this.ownerDocument) {
  			var result = {};
  			result[key] = value;

  			this.ownerDocument.setStyles(this.ref, result);
  		}
  	};

  	Element.prototype.setStyles = function setStyles(styles) {
  		Object.assign(this.style, styles);
  		if (this.ownerDocument) {

  			this.ownerDocument.setStyles(this.ref, styles);
  		}
  	};

  	Element.prototype.setClassStyle = function setClassStyle(classStyle) {
  		for (var key in this.classStyle) {
  			this.classStyle[key] = '';
  		}

  		Object.assign(this.classStyle, classStyle);

  		this.ownerDocument.setStyles(this.ref, this.toStyle());
  	};

  	Element.prototype.addEventListener = function addEventListener(type, handler) {
  		if (!this.event[type]) {
  			this.event[type] = handler;

  			//this.ownerDocument.addEvent(this.ref, type)
  		}
  	};

  	Element.prototype.removeEventListener = function removeEventListener(type) {
  		if (this.event[type]) {
  			delete this.event[type];
  			var doc = getDoc(this.docId);
  			doc.nodeMap[this.ref] && doc.nodeMap[this.ref].event && doc.nodeMap[this.ref].event[type] ? doc.nodeMap[this.ref].event[type] = null : '';

  			this.ownerDocument.removeEvent(this.ref, type);
  		}
  	};

  	Element.prototype.fireEvent = function fireEvent(type, e) {
  		var handler = this.event[type];
  		if (handler) {
  			return handler.call(this, e);
  		}
  	};

  	Element.prototype.toStyle = function toStyle() {
  		return Object.assign({}, this.classStyle, this.style);
  	};

  	Element.prototype.getComputedStyle = function getComputedStyle() {};

  	Element.prototype.toJSON = function toJSON() {
  		var result = {
  			id: this.ref,
  			type: this.type,
  			docId: this.docId || -10000,
  			attributes: this.attributes ? this.attributes : {}
  		};
  		result.attributes.style = this.toStyle();

  		var event = Object.keys(this.event);
  		if (event.length) {
  			result.event = event;
  		}

  		if (this.childNodes.length) {
  			result.children = this.childNodes.map(function (child) {
  				return child.toJSON();
  			});
  		}
  		return result;
  	};

  	Element.prototype.replaceChild = function replaceChild(newChild, oldChild) {
  		this.insertBefore(newChild, oldChild);
  		this.removeChild(oldChild);
  	};

  	Element.prototype.destroy = function destroy() {
  		var doc = getDoc(this.docId);

  		if (doc) {
  			delete doc.nodeMap[this.nodeId];
  		}

  		this.parentNode = null;
  		this.childNodes.forEach(function (child) {
  			child.destroy();
  		});
  	};

  	return Element;
  }();

  function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var TextNode = function () {
  	function TextNode(nodeValue) {
  		_classCallCheck$1(this, TextNode);

  		this.nodeType = 3;
  		this.nodeId = uniqueId();
  		this.ref = this.nodeId;
  		this.attributes = {};
  		this.style = {
  			display: 'inline'
  		};
  		this.classStyle = {};
  		this.event = {};
  		this.nodeValue = nodeValue;
  		this.parentNode = null;
  		this.nextSibling = null;
  		this.previousSibling = null;
  		this.firstChild = null;
  		this.type = 'text';
  	}

  	TextNode.prototype.setAttribute = function setAttribute(key, value, silent) {
  		if (this.attributes[key] === value && silent !== false) {
  			return;
  		}
  		this.attributes[key] = value;
  		if (!silent) {
  			var result = {};
  			result[key] = value;

  			this.ownerDocument.setAttr(this.ref, result);
  		}
  	};

  	TextNode.prototype.removeAttribute = function removeAttribute(key) {
  		if (this.attributes[key]) {
  			delete this.attributes[key];
  		}
  	};

  	TextNode.prototype.toStyle = function toStyle() {
  		return Object.assign({}, this.classStyle, this.style);
  	};

  	TextNode.prototype.splitText = function splitText() {};

  	TextNode.prototype.getComputedStyle = function getComputedStyle() {};

  	TextNode.prototype.toJSON = function toJSON() {
  		var result = {
  			id: this.ref,
  			type: this.type,
  			docId: this.docId || -10000,
  			attributes: this.attributes ? this.attributes : {}
  		};
  		result.attributes.style = this.toStyle();

  		var event = Object.keys(this.event);
  		if (event.length) {
  			result.event = event;
  		}

  		return result;
  	};

  	TextNode.prototype.destroy = function destroy() {
  		var doc = getDoc(this.docId);

  		if (doc) {
  			delete doc.nodeMap[this.nodeId];
  		}

  		this.parentNode = null;
  	};

  	return TextNode;
  }();

  function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var Document = function () {
    function Document(id) {
      _classCallCheck$2(this, Document);

      this.id = id;
      addDoc(id, this);
      this.nodeMap = {};
      this._isMockDocument = true;
    }

    // createBody(type, props) {
    //   if (!this.body) {
    //     const el = new Element(type, props)
    //     el.didMount = true
    //     el.ownerDocument = this
    //     el.docId = this.id
    //     el.style.alignItems = 'flex-start'
    //     this.body = el
    //   }

    //   return this.body
    // }

    Document.prototype.createElement = function createElement(tagName, props) {
      var el = new Element$1(tagName, props);
      el.ownerDocument = this;
      el.docId = this.id;
      return el;
    };

    Document.prototype.createTextNode = function createTextNode(txt) {
      var node = new TextNode(txt);
      node.docId = this.id;
      return node;
    };

    Document.prototype.destroy = function destroy() {
      delete this.listener;
      delete this.nodeMap;
      removeDoc(this.id);
    };

    Document.prototype.addEventListener = function addEventListener(ref, type) {
      //document.addEvent(this.id, ref, type)
    };

    Document.prototype.removeEventListener = function removeEventListener(ref, type) {
      //document.removeEvent(this.id, ref, type)
    };

    Document.prototype.scrollTo = function scrollTo(ref, x, y, animated) {
      document.scrollTo(this.id, ref, x, y, animated);
    };

    return Document;
  }();

  var mock = {
  	document: new Document(0)
  };

  function getGlobal() {
    if (typeof global !== 'object' || !global || global.Math !== Math || global.Array !== Array) {
      if (typeof self !== 'undefined') {
        return self;
      } else if (typeof window !== 'undefined') {
        return window;
      } else if (typeof global !== 'undefined') {
        return global;
      }
      return function () {
        return this;
      }();
    }
    return global;
  }

  /** Global options
   *	@public
   *	@namespace options {Object}
   */
  var options = {
    scopedStyle: true,
    mapping: {},
    isWeb: true,
    staticStyleMapping: {},
    doc: mock.document,
    //doc: typeof document === 'object' ? document : null,
    root: getGlobal(),
    //styleCache :[{ctor:ctor,ctorName:ctorName,style:style}]
    styleCache: []
    //componentChange(component, element) { },
    /** If `true`, `prop` changes trigger synchronous component updates.
     *	@name syncComponentUpdates
     *	@type Boolean
     *	@default true
     */
    //syncComponentUpdates: true,

    /** Processes all created VNodes.
     *	@param {VNode} vnode	A newly-created VNode to normalize/process
     */
    //vnode(vnode) { }

    /** Hook invoked after a component is mounted. */
    //afterMount(component) { },

    /** Hook invoked after the DOM is updated with a component's latest render. */
    //afterUpdate(component) { }

    /** Hook invoked immediately before a component is unmounted. */
    // beforeUnmount(component) { }
  };

  /* eslint-disable no-unused-vars */

  var getOwnPropertySymbols = Object.getOwnPropertySymbols;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var propIsEnumerable = Object.prototype.propertyIsEnumerable;

  function toObject(val) {
    if (val === null || val === undefined) {
      throw new TypeError('Object.assign cannot be called with null or undefined');
    }

    return Object(val);
  }

  function assign(target, source) {
    var from;
    var to = toObject(target);
    var symbols;

    for (var s = 1; s < arguments.length; s++) {
      from = Object(arguments[s]);

      for (var key in from) {
        if (hasOwnProperty.call(from, key)) {
          to[key] = from[key];
        }
      }

      if (getOwnPropertySymbols) {
        symbols = getOwnPropertySymbols(from);
        for (var i = 0; i < symbols.length; i++) {
          if (propIsEnumerable.call(from, symbols[i])) {
            to[symbols[i]] = from[symbols[i]];
          }
        }
      }
    }

    return to;
  }

  if (typeof Element !== 'undefined' && !Element.prototype.addEventListener) {
    var runListeners = function runListeners(oEvent) {
      if (!oEvent) {
        oEvent = window.event;
      }
      for (var iLstId = 0, iElId = 0, oEvtListeners = oListeners[oEvent.type]; iElId < oEvtListeners.aEls.length; iElId++) {
        if (oEvtListeners.aEls[iElId] === this) {
          for (iLstId; iLstId < oEvtListeners.aEvts[iElId].length; iLstId++) {
            oEvtListeners.aEvts[iElId][iLstId].call(this, oEvent);
          }
          break;
        }
      }
    };

    var oListeners = {};

    Element.prototype.addEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
      if (oListeners.hasOwnProperty(sEventType)) {
        var oEvtListeners = oListeners[sEventType];
        for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
          if (oEvtListeners.aEls[iElId] === this) {
            nElIdx = iElId;break;
          }
        }
        if (nElIdx === -1) {
          oEvtListeners.aEls.push(this);
          oEvtListeners.aEvts.push([fListener]);
          this["on" + sEventType] = runListeners;
        } else {
          var aElListeners = oEvtListeners.aEvts[nElIdx];
          if (this["on" + sEventType] !== runListeners) {
            aElListeners.splice(0);
            this["on" + sEventType] = runListeners;
          }
          for (var iLstId = 0; iLstId < aElListeners.length; iLstId++) {
            if (aElListeners[iLstId] === fListener) {
              return;
            }
          }
          aElListeners.push(fListener);
        }
      } else {
        oListeners[sEventType] = { aEls: [this], aEvts: [[fListener]] };
        this["on" + sEventType] = runListeners;
      }
    };
    Element.prototype.removeEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
      if (!oListeners.hasOwnProperty(sEventType)) {
        return;
      }
      var oEvtListeners = oListeners[sEventType];
      for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
        if (oEvtListeners.aEls[iElId] === this) {
          nElIdx = iElId;break;
        }
      }
      if (nElIdx === -1) {
        return;
      }
      for (var iLstId = 0, aElListeners = oEvtListeners.aEvts[nElIdx]; iLstId < aElListeners.length; iLstId++) {
        if (aElListeners[iLstId] === fListener) {
          aElListeners.splice(iLstId, 1);
        }
      }
    };
  }

  if (typeof Object.create !== 'function') {
    Object.create = function (proto, propertiesObject) {
      if (typeof proto !== 'object' && typeof proto !== 'function') {
        throw new TypeError('Object prototype may only be an Object: ' + proto);
      } else if (proto === null) {
        throw new Error("This browser's implementation of Object.create is a shim and doesn't support 'null' as the first argument.");
      }

      // if (typeof propertiesObject != 'undefined') {
      //     throw new Error("This browser's implementation of Object.create is a shim and doesn't support a second argument.");
      // }

      function F() {}
      F.prototype = proto;

      return new F();
    };
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
  }

  /**
   *  Copy all properties from `props` onto `obj`.
   *  @param {Object} obj		Object onto which properties should be copied.
   *  @param {Object} props	Object from which to copy properties.
   *  @returns obj
   *  @private
   */
  function extend(obj, props) {
    for (var i in props) {
      obj[i] = props[i];
    }return obj;
  }

  /** Invoke or update a ref, depending on whether it is a function or object ref.
   *  @param {object|function} [ref=null]
   *  @param {any} [value]
   */
  function applyRef(ref, value) {
    if (ref) {
      if (typeof ref == 'function') ref(value);else ref.current = value;
    }
  }

  /**
   * Call a function asynchronously, as soon as possible. Makes
   * use of HTML Promise to schedule the callback if available,
   * otherwise falling back to `setTimeout` (mainly for IE<11).
   *
   * @param {Function} callback
   */

  var usePromise = typeof Promise == 'function';

  // for native
  if (typeof document !== 'object' && typeof global !== 'undefined' && global.__config__) {
    if (global.__config__.platform === 'android') {
      usePromise = true;
    } else {
      var systemVersion = global.__config__.systemVersion && global.__config__.systemVersion.split('.')[0] || 0;
      if (systemVersion > 8) {
        usePromise = true;
      }
    }
  }

  var defer = usePromise ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function nProps(props) {
    if (!props || isArray(props)) return {};
    var result = {};
    Object.keys(props).forEach(function (key) {
      result[key] = props[key].value;
    });
    return result;
  }

  function getUse(data, paths) {
    var obj = [];
    paths.forEach(function (path, index) {
      var isPath = typeof path === 'string';
      if (isPath) {
        obj[index] = getTargetByPath(data, path);
      } else {
        var key = Object.keys(path)[0];
        var value = path[key];
        if (typeof value === 'string') {
          obj[index] = getTargetByPath(data, value);
        } else {
          var tempPath = value[0];
          if (typeof tempPath === 'string') {
            var tempVal = getTargetByPath(data, tempPath);
            obj[index] = value[1] ? value[1](tempVal) : tempVal;
          } else {
            var args = [];
            tempPath.forEach(function (path) {
              args.push(getTargetByPath(data, path));
            });
            obj[index] = value[1].apply(null, args);
          }
        }
        obj[key] = obj[index];
      }
    });
    return obj;
  }

  function getTargetByPath(origin, path) {
    var arr = path.replace(/]/g, '').replace(/\[/g, '.').split('.');
    var current = origin;
    for (var i = 0, len = arr.length; i < len; i++) {
      current = current[arr[i]];
    }
    return current;
  }

  /** Managed queue of dirty components to be re-rendered */

  var items = [];

  function enqueueRender(component) {
    if (items.push(component) == 1) {
  (options.debounceRendering || defer)(rerender);
    }
  }

  /** Rerender all enqueued dirty components */
  function rerender() {
    var p = void 0;
    while (p = items.pop()) {
      renderComponent(p);
    }
  }

  var mapping = options.mapping;
  /**
   * Check if two nodes are equivalent.
   *
   * @param {Node} node			DOM Node to compare
   * @param {VNode} vnode			Virtual DOM node to compare
   * @param {boolean} [hydrating=false]	If true, ignores component constructors when comparing.
   * @private
   */
  function isSameNodeType(node, vnode, hydrating) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return node.splitText !== undefined;
    }
    if (typeof vnode.nodeName === 'string') {
      var ctor = mapping[vnode.nodeName];
      if (ctor) {
        return hydrating || node._componentConstructor === ctor;
      }
      return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
    }
    return hydrating || node._componentConstructor === vnode.nodeName;
  }

  /**
   * Check if an Element has a given nodeName, case-insensitively.
   *
   * @param {Element} node	A DOM Element to inspect the name of.
   * @param {String} nodeName	Unnormalized name to compare against.
   */
  function isNamedNode(node, nodeName) {
    return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
  }

  /**
   * Reconstruct Component-style `props` from a VNode.
   * Ensures default/fallback values from `defaultProps`:
   * Own-properties of `defaultProps` not present in `vnode.attributes` are added.
   *
   * @param {VNode} vnode
   * @returns {Object} props
   */
  function getNodeProps(vnode) {
    var props = extend({}, vnode.attributes);
    props.children = vnode.children;

    var defaultProps = vnode.nodeName.defaultProps;
    if (defaultProps !== undefined) {
      for (var i in defaultProps) {
        if (props[i] === undefined) {
          props[i] = defaultProps[i];
        }
      }
    }

    return props;
  }

  /** Create an element with the given nodeName.
   *	@param {String} nodeName
   *	@param {Boolean} [isSvg=false]	If `true`, creates an element within the SVG namespace.
   *	@returns {Element} node
   */
  function createNode$1(nodeName, isSvg) {
    var node = isSvg ? options.doc.createElementNS('http://www.w3.org/2000/svg', nodeName) : options.doc.createElement(nodeName);
    node.normalizedNodeName = nodeName;
    return node;
  }

  function parseCSSText(cssText) {
    var cssTxt = cssText.replace(/\/\*(.|\s)*?\*\//g, ' ').replace(/\s+/g, ' ');
    var style = {},
        _ref = cssTxt.match(/ ?(.*?) ?{([^}]*)}/) || [a, b, cssTxt],
        a = _ref[0],
        b = _ref[1],
        rule = _ref[2];

    var cssToJs = function cssToJs(s) {
      return s.replace(/\W+\w/g, function (match) {
        return match.slice(-1).toUpperCase();
      });
    };
    var properties = rule.split(';').map(function (o) {
      return o.split(':').map(function (x) {
        return x && x.trim();
      });
    });
    for (var _iterator = properties, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref3 = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref3 = _i.value;
      }

      var _ref2 = _ref3;
      var property = _ref2[0];
      var value = _ref2[1];
      style[cssToJs(property)] = value;
    }return style;
  }

  /** Remove a child node from its parent if attached.
   *	@param {Element} node		The node to remove
   */
  function removeNode(node) {
    var parentNode = node.parentNode;
    if (parentNode) parentNode.removeChild(node);
  }

  /** Set a named attribute on the given Node, with special behavior for some names and event handlers.
   *	If `value` is `null`, the attribute/handler will be removed.
   *	@param {Element} node	An element to mutate
   *	@param {string} name	The name/key to set, such as an event or attribute name
   *	@param {any} old	The last value that was set for this name/node pair
   *	@param {any} value	An attribute value, such as a function to be used as an event handler
   *	@param {Boolean} isSvg	Are we currently diffing inside an svg?
   *	@private
   */
  function setAccessor(node, name, old, value, isSvg) {
    if (name === 'className') name = 'class';

    if (name === 'key') {
      // ignore
    } else if (name === 'ref') {
      applyRef(old, null);
      applyRef(value, node);
    } else if (name === 'class' && !isSvg) {
      node.className = value || '';
    } else if (name === 'style') {
      if (options.isWeb) {
        if (!value || typeof value === 'string' || typeof old === 'string') {
          node.style.cssText = value || '';
        }
        if (value && typeof value === 'object') {
          if (typeof old !== 'string') {
            for (var i in old) {
              if (!(i in value)) node.style[i] = '';
            }
          }
          for (var _i2 in value) {
            node.style[_i2] = typeof value[_i2] === 'number' && IS_NON_DIMENSIONAL.test(_i2) === false ? value[_i2] + 'px' : value[_i2];
          }
        }
      } else {
        var oldJson = old,
            currentJson = value;
        if (typeof old === 'string') {
          oldJson = parseCSSText(old);
        }
        if (typeof value == 'string') {
          currentJson = parseCSSText(value);
        }

        var result = {},
            changed = false;

        if (oldJson) {
          for (var key in oldJson) {
            if (typeof currentJson == 'object' && !(key in currentJson)) {
              result[key] = '';
              changed = true;
            }
          }

          for (var ckey in currentJson) {
            if (currentJson[ckey] !== oldJson[ckey]) {
              result[ckey] = currentJson[ckey];
              changed = true;
            }
          }

          if (changed) {
            node.setStyles(result);
          }
        } else {
          node.setStyles(currentJson);
        }
      }
    } else if (name === 'dangerouslySetInnerHTML') {
      if (value) node.innerHTML = value.__html || '';
    } else if (name[0] == 'o' && name[1] == 'n') {
      var useCapture = name !== (name = name.replace(/Capture$/, ''));
      name = name.toLowerCase().substring(2);
      if (value) {
        if (!old) {
          node.addEventListener(name, eventProxy, useCapture);
          if (name == 'tap') {
            node.addEventListener('touchstart', touchStart, useCapture);
            node.addEventListener('touchend', touchEnd, useCapture);
          }
        }
      } else {
        node.removeEventListener(name, eventProxy, useCapture);
        if (name == 'tap') {
          node.removeEventListener('touchstart', touchStart, useCapture);
          node.removeEventListener('touchend', touchEnd, useCapture);
        }
      }
  (node._listeners || (node._listeners = {}))[name] = value;
    } else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
      setProperty(node, name, value == null ? '' : value);
      if (value == null || value === false) node.removeAttribute(name);
    } else {
      var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));
      if (value == null || value === false) {
        if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase());else node.removeAttribute(name);
      } else if (typeof value !== 'function') {
        if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value);else node.setAttribute(name, value);
      }
    }
  }

  /** Attempt to set a DOM property to the given value.
   *	IE & FF throw for certain property-value combinations.
   */
  function setProperty(node, name, value) {
    try {
      node[name] = value;
    } catch (e) {}
  }

  /** Proxy an event to hooked event handlers
   *	@private
   */
  function eventProxy(e) {
    return this._listeners[e.type](options.event && options.event(e) || e);
  }

  function touchStart(e) {
    this.___touchX = e.touches[0].pageX;
    this.___touchY = e.touches[0].pageY;
    this.___scrollTop = document.body.scrollTop;
  }

  function touchEnd(e) {
    if (Math.abs(e.changedTouches[0].pageX - this.___touchX) < 30 && Math.abs(e.changedTouches[0].pageY - this.___touchY) < 30 && Math.abs(document.body.scrollTop - this.___scrollTop) < 30) {
      this.dispatchEvent(new CustomEvent('tap', { detail: e }));
    }
  }

  function draw(res) {
    console.log(res);
    return document.createElement('canvas');
  }

  /** Queue of components that have been mounted and are awaiting componentDidMount */
  var mounts = [];

  /** Diff recursion count, used to track the end of the diff cycle. */
  var diffLevel = 0;

  /** Global flag indicating if the diff is currently within an SVG */
  var isSvgMode = false;

  /** Global flag indicating if the diff is performing hydration */
  var hydrating = false;

  /** Invoke queued componentDidMount lifecycle methods */
  function flushMounts() {
    var c = void 0;
    while (c = mounts.pop()) {
      if (options.afterMount) options.afterMount(c);
      if (c.installed) c.installed();
    }
  }

  /** Apply differences in a given vnode (and it's deep children) to a real DOM Node.
   *	@param {Element} [dom=null]		A DOM node to mutate into the shape of the `vnode`
   *	@param {VNode} vnode			A VNode (with descendants forming a tree) representing the desired DOM structure
   *	@returns {Element} dom			The created/mutated element
   *	@private
   */
  function diff(dom, vnode, context, mountAll, parent, componentRoot, fromRender) {
    // diffLevel having been 0 here indicates initial entry into the diff (not a subdiff)
    if (!diffLevel++) {
      // when first starting the diff, check if we're diffing an SVG or within an SVG
      isSvgMode = parent != null && parent.ownerSVGElement !== undefined;

      // hydration is indicated by the existing element to be diffed not having a prop cache
      hydrating = dom != null && !(ATTR_KEY in dom);
    }
    var ret = void 0;

    if (isArray(vnode)) {
      vnode = {
        nodeName: 'span',
        children: vnode
      };
    }

    ret = idiff(dom, vnode, context, mountAll, componentRoot);
    // append the element if its a new parent
    if (parent && ret.parentNode !== parent) {
      if (fromRender) {
        parent.appendChild(draw(ret));
      } else {
        parent.appendChild(ret);
      }
    }

    // diffLevel being reduced to 0 means we're exiting the diff
    if (! --diffLevel) {
      hydrating = false;
      // invoke queued componentDidMount lifecycle methods
      if (!componentRoot) flushMounts();
    }

    return ret;
  }

  /** Internals of `diff()`, separated to allow bypassing diffLevel / mount flushing. */
  function idiff(dom, vnode, context, mountAll, componentRoot) {
    var out = dom,
        prevSvgMode = isSvgMode;

    // empty values (null, undefined, booleans) render as empty Text nodes
    if (vnode == null || typeof vnode === 'boolean') vnode = '';

    // If the VNode represents a Component, perform a component diff:
    var vnodeName = vnode.nodeName;
    if (options.mapping[vnodeName]) {
      vnode.nodeName = options.mapping[vnodeName];
      return buildComponentFromVNode(dom, vnode, context, mountAll);
    }
    if (typeof vnodeName == 'function') {
      return buildComponentFromVNode(dom, vnode, context, mountAll);
    }

    // Fast case: Strings & Numbers create/update Text nodes.
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      // update if it's already a Text node:
      if (dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
        /* istanbul ignore if */ /* Browser quirk that can't be covered: https://github.com/developit/preact/commit/fd4f21f5c45dfd75151bd27b4c217d8003aa5eb9 */
        if (dom.nodeValue != vnode) {
          dom.nodeValue = vnode;
        }
      } else {
        // it wasn't a Text node: replace it with one and recycle the old Element
        out = options.doc.createTextNode(vnode);
        if (dom) {
          if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
          recollectNodeTree(dom, true);
        }
      }

      //ie8 error
      try {
        out[ATTR_KEY] = true;
      } catch (e) {}

      return out;
    }

    // Tracks entering and exiting SVG namespace when descending through the tree.
    isSvgMode = vnodeName === 'svg' ? true : vnodeName === 'foreignObject' ? false : isSvgMode;

    // If there's no existing element or it's the wrong type, create a new one:
    vnodeName = String(vnodeName);
    if (!dom || !isNamedNode(dom, vnodeName)) {
      out = createNode$1(vnodeName, isSvgMode);

      if (dom) {
        // move children into the replacement node
        while (dom.firstChild) {
          out.appendChild(dom.firstChild);
        } // if the previous Element was mounted into the DOM, replace it inline
        if (dom.parentNode) dom.parentNode.replaceChild(out, dom);

        // recycle the old element (skips non-Element node types)
        recollectNodeTree(dom, true);
      }
    }

    var fc = out.firstChild,
        props = out[ATTR_KEY],
        vchildren = vnode.children;

    if (props == null) {
      props = out[ATTR_KEY] = {};
      for (var a = out.attributes, i = a.length; i--;) {
        props[a[i].name] = a[i].value;
      }
    }

    // Optimization: fast-path for elements containing a single TextNode:
    if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText !== undefined && fc.nextSibling == null) {
      if (fc.nodeValue != vchildren[0]) {
        fc.nodeValue = vchildren[0];
        //update rendering obj
        fc._renderText.text = fc.nodeValue;
      }
    }
    // otherwise, if there are existing or new children, diff them:
    else if (vchildren && vchildren.length || fc != null) {
        innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
      }

    // Apply attributes/props from VNode to the DOM Element:
    diffAttributes(out, vnode.attributes, props);

    // restore previous SVG mode: (in case we're exiting an SVG namespace)
    isSvgMode = prevSvgMode;

    return out;
  }

  /** Apply child and attribute changes between a VNode and a DOM Node to the DOM.
   *	@param {Element} dom			Element whose children should be compared & mutated
   *	@param {Array} vchildren		Array of VNodes to compare to `dom.childNodes`
   *	@param {Object} context			Implicitly descendant context object (from most recent `getChildContext()`)
   *	@param {Boolean} mountAll
   *	@param {Boolean} isHydrating	If `true`, consumes externally created elements similar to hydration
   */
  function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
    var originalChildren = dom.childNodes,
        children = [],
        keyed = {},
        keyedLen = 0,
        min = 0,
        len = originalChildren.length,
        childrenLen = 0,
        vlen = vchildren ? vchildren.length : 0,
        j = void 0,
        c = void 0,
        f = void 0,
        vchild = void 0,
        child = void 0;

    // Build up a map of keyed children and an Array of unkeyed children:
    if (len !== 0) {
      for (var i = 0; i < len; i++) {
        var _child = originalChildren[i],
            props = _child[ATTR_KEY],
            key = vlen && props ? _child._component ? _child._component.__key : props.key : null;
        if (key != null) {
          keyedLen++;
          keyed[key] = _child;
        } else if (props || (_child.splitText !== undefined ? isHydrating ? _child.nodeValue.trim() : true : isHydrating)) {
          children[childrenLen++] = _child;
        }
      }
    }

    if (vlen !== 0) {
      for (var _i = 0; _i < vlen; _i++) {
        vchild = vchildren[_i];
        child = null;

        // attempt to find a node based on key matching
        var _key = vchild.key;
        if (_key != null) {
          if (keyedLen && keyed[_key] !== undefined) {
            child = keyed[_key];
            keyed[_key] = undefined;
            keyedLen--;
          }
        }
        // attempt to pluck a node of the same type from the existing children
        else if (!child && min < childrenLen) {
            for (j = min; j < childrenLen; j++) {
              if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
                child = c;
                children[j] = undefined;
                if (j === childrenLen - 1) childrenLen--;
                if (j === min) min++;
                break;
              }
            }
          }

        // morph the matched/found/created DOM child to match vchild (deep)
        child = idiff(child, vchild, context, mountAll);

        f = originalChildren[_i];
        if (child && child !== dom && child !== f) {
          if (f == null) {
            dom.appendChild(child);
          } else if (child === f.nextSibling) {
            removeNode(f);
          } else {
            dom.insertBefore(child, f);
          }
        }
      }
    }

    // remove unused keyed children:
    if (keyedLen) {
      for (var _i2 in keyed) {
        if (keyed[_i2] !== undefined) recollectNodeTree(keyed[_i2], false);
      }
    }

    // remove orphaned unkeyed children:
    while (min <= childrenLen) {
      if ((child = children[childrenLen--]) !== undefined) recollectNodeTree(child, false);
    }
  }

  /** Recursively recycle (or just unmount) a node and its descendants.
   *	@param {Node} node						DOM node to start unmount/removal from
   *	@param {Boolean} [unmountOnly=false]	If `true`, only triggers unmount lifecycle, skips removal
   */
  function recollectNodeTree(node, unmountOnly) {
    var component = node._component;
    if (component) {
      // if node is owned by a Component, unmount that component (ends up recursing back here)
      unmountComponent(component);
    } else {
      // If the node's VNode had a ref function, invoke it with null here.
      // (this is part of the React spec, and smart for unsetting references)
      if (node[ATTR_KEY] != null) applyRef(node[ATTR_KEY].ref, null);

      if (unmountOnly === false || node[ATTR_KEY] == null) {
        removeNode(node);
      }

      removeChildren(node);
    }
  }

  /** Recollect/unmount all children.
   *	- we use .lastChild here because it causes less reflow than .firstChild
   *	- it's also cheaper than accessing the .childNodes Live NodeList
   */
  function removeChildren(node) {
    node = node.lastChild;
    while (node) {
      var next = node.previousSibling;
      recollectNodeTree(node, true);
      node = next;
    }
  }

  /** Apply differences in attributes from a VNode to the given DOM Element.
   *	@param {Element} dom		Element with attributes to diff `attrs` against
   *	@param {Object} attrs		The desired end-state key-value attribute pairs
   *	@param {Object} old			Current/previous attributes (from previous VNode or element's prop cache)
   */
  function diffAttributes(dom, attrs, old) {
    var name = void 0;

    // remove attributes no longer present on the vnode by setting them to undefined
    for (name in old) {
      if (!(attrs && attrs[name] != null) && old[name] != null) {
        setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
      }
    }

    // add new & update changed attributes
    for (name in attrs) {
      if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
        setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
      }
    }
  }

  var OBJECTTYPE = '[object Object]';
  var ARRAYTYPE = '[object Array]';

  function define(name, ctor) {
    options.mapping[name] = ctor;
    if (ctor.use) {
      ctor.updatePath = getPath(ctor.use);
    } else if (ctor.data) {
      //Compatible with older versions
      ctor.updatePath = getUpdatePath(ctor.data);
    }
  }

  function getPath(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
      var result = {};
      obj.forEach(function (item) {
        if (typeof item === 'string') {
          result[item] = true;
        } else {
          var tempPath = item[Object.keys(item)[0]];
          if (typeof tempPath === 'string') {
            result[tempPath] = true;
          } else {
            if (typeof tempPath[0] === 'string') {
              result[tempPath[0]] = true;
            } else {
              tempPath[0].forEach(function (path) {
                return result[path] = true;
              });
            }
          }
        }
      });
      return result;
    } else {
      return getUpdatePath(obj);
    }
  }

  function getUpdatePath(data) {
    var result = {};
    dataToPath(data, result);
    return result;
  }

  function dataToPath(data, result) {
    Object.keys(data).forEach(function (key) {
      result[key] = true;
      var type = Object.prototype.toString.call(data[key]);
      if (type === OBJECTTYPE) {
        _objToPath(data[key], key, result);
      } else if (type === ARRAYTYPE) {
        _arrayToPath(data[key], key, result);
      }
    });
  }

  function _objToPath(data, path, result) {
    Object.keys(data).forEach(function (key) {
      result[path + '.' + key] = true;
      delete result[path];
      var type = Object.prototype.toString.call(data[key]);
      if (type === OBJECTTYPE) {
        _objToPath(data[key], path + '.' + key, result);
      } else if (type === ARRAYTYPE) {
        _arrayToPath(data[key], path + '.' + key, result);
      }
    });
  }

  function _arrayToPath(data, path, result) {
    data.forEach(function (item, index) {
      result[path + '[' + index + ']'] = true;
      delete result[path];
      var type = Object.prototype.toString.call(item);
      if (type === OBJECTTYPE) {
        _objToPath(item, path + '[' + index + ']', result);
      } else if (type === ARRAYTYPE) {
        _arrayToPath(item, path + '[' + index + ']', result);
      }
    });
  }

  /** Retains a pool of Components for re-use, keyed on component name.
   *	Note: since component names are not unique or even necessarily available, these are primarily a form of sharding.
   *	@private
   */
  var components = {};

  /** Reclaim a component for later re-use by the recycler. */
  function collectComponent(component) {
    var name = component.constructor.name;(components[name] || (components[name] = [])).push(component);
  }

  /** Create a component. Normalizes differences between PFC's and classful Components. */
  function createComponent(Ctor, props, context, vnode) {
    var list = components[Ctor.name],
        inst = void 0;

    if (Ctor.prototype && Ctor.prototype.render) {
      inst = new Ctor(props, context);
      Component.call(inst, props, context);
    } else {
      inst = new Component(props, context);
      inst.constructor = Ctor;
      inst.render = doRender;
    }
    vnode && (inst.scopedCssAttr = vnode.css);

    if (inst.store && inst.store.data) {
      if (inst.constructor.use) {
        inst.use = getUse(inst.store.data, inst.constructor.use);
        inst.store.instances.push(inst);
      } else if (inst.initUse) {
        var use = inst.initUse();
        inst._updatePath = getPath(use);
        inst.use = getUse(inst.store.data, use);
        inst.store.instances.push(inst);
      }
    }

    if (list) {
      for (var i = list.length; i--;) {
        if (list[i].constructor === Ctor) {
          inst.nextBase = list[i].nextBase;
          list.splice(i, 1);
          break;
        }
      }
    }
    return inst;
  }

  /** The `.render()` method for a PFC backing instance. */
  function doRender(props, data, context) {
    return this.constructor(props, context);
  }

  var styleId = 0;

  function getCtorName(ctor) {
    for (var i = 0, len = options.styleCache.length; i < len; i++) {
      var item = options.styleCache[i];

      if (item.ctor === ctor) {
        return item.attrName;
      }
    }

    var attrName = 's' + styleId;
    options.styleCache.push({ ctor: ctor, attrName: attrName });
    styleId++;

    return attrName;
  }

  function addScopedAttrStatic(vdom, attr) {
    if (options.scopedStyle) {
      scopeVdom(attr, vdom);
    }
  }

  function scopeVdom(attr, vdom) {
    if (typeof vdom === 'object') {
      vdom.attributes = vdom.attributes || {};
      vdom.attributes[attr] = '';
      vdom.css = vdom.css || {};
      vdom.css[attr] = '';
      vdom.children.forEach(function (child) {
        return scopeVdom(attr, child);
      });
    }
  }

  function scopeHost(vdom, css) {
    if (typeof vdom === 'object' && css) {
      vdom.attributes = vdom.attributes || {};
      for (var key in css) {
        vdom.attributes[key] = '';
      }
    }
  }

  /* obaa 1.0.0
   * By dntzhang
   * Github: https://github.com/Tencent/omi
   * MIT Licensed.
   */

  var obaa = function obaa(target, arr, callback) {
    var _observe = function _observe(target, arr, callback) {
      if (!target.$observer) target.$observer = this;
      var $observer = target.$observer;
      var eventPropArr = [];
      if (obaa.isArray(target)) {
        if (target.length === 0) {
          target.$observeProps = {};
          target.$observeProps.$observerPath = '#';
        }
        $observer.mock(target);
      }
      for (var prop in target) {
        if (target.hasOwnProperty(prop)) {
          if (callback) {
            if (obaa.isArray(arr) && obaa.isInArray(arr, prop)) {
              eventPropArr.push(prop);
              $observer.watch(target, prop);
            } else if (obaa.isString(arr) && prop == arr) {
              eventPropArr.push(prop);
              $observer.watch(target, prop);
            }
          } else {
            eventPropArr.push(prop);
            $observer.watch(target, prop);
          }
        }
      }
      $observer.target = target;
      if (!$observer.propertyChangedHandler) $observer.propertyChangedHandler = [];
      var propChanged = callback ? callback : arr;
      $observer.propertyChangedHandler.push({
        all: !callback,
        propChanged: propChanged,
        eventPropArr: eventPropArr
      });
    };
    _observe.prototype = {
      onPropertyChanged: function onPropertyChanged(prop, value, oldValue, target, path) {
        if (value !== oldValue && this.propertyChangedHandler) {
          var rootName = obaa._getRootName(prop, path);
          for (var i = 0, len = this.propertyChangedHandler.length; i < len; i++) {
            var handler = this.propertyChangedHandler[i];
            if (handler.all || obaa.isInArray(handler.eventPropArr, rootName) || rootName.indexOf('Array-') === 0) {
              handler.propChanged.call(this.target, prop, value, oldValue, path);
            }
          }
        }
        if (prop.indexOf('Array-') !== 0 && typeof value === 'object') {
          this.watch(target, prop, target.$observeProps.$observerPath);
        }
      },
      mock: function mock(target) {
        var self = this;
        obaa.methods.forEach(function (item) {
          target[item] = function () {
            var old = Array.prototype.slice.call(this, 0);
            var result = Array.prototype[item].apply(this, Array.prototype.slice.call(arguments));
            if (new RegExp('\\b' + item + '\\b').test(obaa.triggerStr)) {
              for (var cprop in this) {
                if (this.hasOwnProperty(cprop) && !obaa.isFunction(this[cprop])) {
                  self.watch(this, cprop, this.$observeProps.$observerPath);
                }
              }
              //todo
              self.onPropertyChanged('Array-' + item, this, old, this, this.$observeProps.$observerPath);
            }
            return result;
          };
          target['pure' + item.substring(0, 1).toUpperCase() + item.substring(1)] = function () {
            return Array.prototype[item].apply(this, Array.prototype.slice.call(arguments));
          };
        });
      },
      watch: function watch(target, prop, path) {
        if (prop === '$observeProps' || prop === '$observer') return;
        if (obaa.isFunction(target[prop])) return;
        if (!target.$observeProps) target.$observeProps = {};
        if (path !== undefined) {
          target.$observeProps.$observerPath = path;
        } else {
          target.$observeProps.$observerPath = '#';
        }
        var self = this;
        var currentValue = target.$observeProps[prop] = target[prop];
        Object.defineProperty(target, prop, {
          get: function get() {
            return this.$observeProps[prop];
          },
          set: function set(value) {
            var old = this.$observeProps[prop];
            this.$observeProps[prop] = value;
            self.onPropertyChanged(prop, value, old, this, target.$observeProps.$observerPath);
          }
        });
        if (typeof currentValue == 'object') {
          if (obaa.isArray(currentValue)) {
            this.mock(currentValue);
            if (currentValue.length === 0) {
              if (!currentValue.$observeProps) currentValue.$observeProps = {};
              if (path !== undefined) {
                currentValue.$observeProps.$observerPath = path;
              } else {
                currentValue.$observeProps.$observerPath = '#';
              }
            }
          }
          for (var cprop in currentValue) {
            if (currentValue.hasOwnProperty(cprop)) {
              this.watch(currentValue, cprop, target.$observeProps.$observerPath + '-' + prop);
            }
          }
        }
      }
    };
    return new _observe(target, arr, callback);
  };

  obaa.methods = ['concat', 'copyWithin', 'entries', 'every', 'fill', 'filter', 'find', 'findIndex', 'forEach', 'includes', 'indexOf', 'join', 'keys', 'lastIndexOf', 'map', 'pop', 'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'some', 'sort', 'splice', 'toLocaleString', 'toString', 'unshift', 'values', 'size'];
  obaa.triggerStr = ['concat', 'copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'size'].join(',');

  obaa.isArray = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  obaa.isString = function (obj) {
    return typeof obj === 'string';
  };

  obaa.isInArray = function (arr, item) {
    for (var i = arr.length; --i > -1;) {
      if (item === arr[i]) return true;
    }
    return false;
  };

  obaa.isFunction = function (obj) {
    return Object.prototype.toString.call(obj) == '[object Function]';
  };

  obaa._getRootName = function (prop, path) {
    if (path === '#') {
      return prop;
    }
    return path.split('-')[1];
  };

  obaa.add = function (obj, prop) {
    var $observer = obj.$observer;
    $observer.watch(obj, prop);
  };

  obaa.set = function (obj, prop, value, exec) {
    if (!exec) {
      obj[prop] = value;
    }
    var $observer = obj.$observer;
    $observer.watch(obj, prop);
    if (exec) {
      obj[prop] = value;
    }
  };

  Array.prototype.size = function (length) {
    this.length = length;
  };

  var callbacks = [];
  var nextTickCallback = [];

  function fireTick() {
    callbacks.forEach(function (item) {
      item.fn.call(item.scope);
    });

    nextTickCallback.forEach(function (nextItem) {
      nextItem.fn.call(nextItem.scope);
    });
    nextTickCallback.length = 0;
  }

  function proxyUpdate(ele) {
    var timeout = null;
    obaa(ele.data, function () {
      if (ele._willUpdate) {
        return;
      }
      if (ele.constructor.mergeUpdate) {
        clearTimeout(timeout);

        timeout = setTimeout(function () {
          ele.update();
          fireTick();
        }, 0);
      } else {
        ele.update();
        fireTick();
      }
    });
  }

  /** Set a component's `props` (generally derived from JSX attributes).
   *	@param {Object} props
   *	@param {Object} [opts]
   *	@param {boolean} [opts.renderSync=false]	If `true` and {@link options.syncComponentUpdates} is `true`, triggers synchronous rendering.
   *	@param {boolean} [opts.render=true]			If `false`, no render will be triggered.
   */
  function setComponentProps(component, props, opts, context, mountAll) {
    if (component._disable) return;
    component._disable = true;

    if (component.__ref = props.ref) delete props.ref;
    if (component.__key = props.key) delete props.key;

    if (!component.base || mountAll) {
      if (component.beforeInstall) component.beforeInstall();
      if (component.install) component.install();
      if (component.constructor.observe) {
        proxyUpdate(component);
      }
    }

    if (context && context !== component.context) {
      if (!component.prevContext) component.prevContext = component.context;
      component.context = context;
    }

    if (!component.prevProps) component.prevProps = component.props;
    component.props = props;

    component._disable = false;

    if (opts !== NO_RENDER) {
      if (opts === SYNC_RENDER || options.syncComponentUpdates !== false || !component.base) {
        renderComponent(component, SYNC_RENDER, mountAll);
      } else {
        enqueueRender(component);
      }
    }

    applyRef(component.__ref, component);
  }

  function shallowComparison(old, attrs) {
    var name = void 0;

    for (name in old) {
      if (attrs[name] == null && old[name] != null) {
        return true;
      }
    }

    if (old.children.length > 0 || attrs.children.length > 0) {
      return true;
    }

    for (name in attrs) {
      if (name != 'children') {
        var type = typeof attrs[name];
        if (type == 'function' || type == 'object') {
          return true;
        } else if (attrs[name] != old[name]) {
          return true;
        }
      }
    }
  }

  /** Render a Component, triggering necessary lifecycle events and taking High-Order Components into account.
   *	@param {Component} component
   *	@param {Object} [opts]
   *	@param {boolean} [opts.build=false]		If `true`, component will build and store a DOM node if not already associated with one.
   *	@private
   */
  function renderComponent(component, opts, mountAll, isChild) {
    if (component._disable) return;

    var props = component.props,
        data = component.data,
        context = component.context,
        previousProps = component.prevProps || props,
        previousState = component.prevState || data,
        previousContext = component.prevContext || context,
        isUpdate = component.base,
        nextBase = component.nextBase,
        initialBase = isUpdate || nextBase,
        initialChildComponent = component._component,
        skip = false,
        rendered = void 0,
        inst = void 0,
        cbase = void 0;

    // if updating
    if (isUpdate) {
      component.props = previousProps;
      component.data = previousState;
      component.context = previousContext;
      if (component.store || opts == FORCE_RENDER || shallowComparison(previousProps, props)) {
        var receiveResult = true;
        if (component.receiveProps) {
          receiveResult = component.receiveProps(props, previousProps);
        }
        if (receiveResult !== false) {
          skip = false;
          if (component.beforeUpdate) {
            component.beforeUpdate(props, data, context);
          }
        } else {
          skip = true;
        }
      } else {
        skip = true;
      }
      component.props = props;
      component.data = data;
      component.context = context;
    }

    component.prevProps = component.prevState = component.prevContext = component.nextBase = null;

    if (!skip) {
      component.beforeRender && component.beforeRender();
      rendered = component.render(props, data, context);

      //don't rerender
      if (component.constructor.css || component.css) {
        addScopedAttrStatic(rendered, '_s' + getCtorName(component.constructor));
      }

      scopeHost(rendered, component.scopedCssAttr);

      // context to pass to the child, can be updated via (grand-)parent component
      if (component.getChildContext) {
        context = extend(extend({}, context), component.getChildContext());
      }

      var childComponent = rendered && rendered.nodeName,
          toUnmount = void 0,
          base = void 0,
          ctor = options.mapping[childComponent];

      if (ctor) {
        // set up high order component link

        var childProps = getNodeProps(rendered);
        inst = initialChildComponent;

        if (inst && inst.constructor === ctor && childProps.key == inst.__key) {
          setComponentProps(inst, childProps, SYNC_RENDER, context, false);
        } else {
          toUnmount = inst;

          component._component = inst = createComponent(ctor, childProps, context);
          inst.nextBase = inst.nextBase || nextBase;
          inst._parentComponent = component;
          setComponentProps(inst, childProps, NO_RENDER, context, false);
          renderComponent(inst, SYNC_RENDER, mountAll, true);
        }

        base = inst.base;
      } else {
        cbase = initialBase;

        // destroy high order component link
        toUnmount = initialChildComponent;
        if (toUnmount) {
          cbase = component._component = null;
        }

        if (initialBase || opts === SYNC_RENDER) {
          if (cbase) cbase._component = null;
          base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
        }
      }

      if (initialBase && base !== initialBase && inst !== initialChildComponent) {
        var baseParent = initialBase.parentNode;
        if (baseParent && base !== baseParent) {
          baseParent.replaceChild(base, initialBase);

          if (!toUnmount) {
            initialBase._component = null;
            recollectNodeTree(initialBase, false);
          }
        }
      }

      if (toUnmount) {
        unmountComponent(toUnmount);
      }

      component.base = base;
      if (base && !isChild) {
        var componentRef = component,
            t = component;
        while (t = t._parentComponent) {
  (componentRef = t).base = base;
        }
        base._component = componentRef;
        base._componentConstructor = componentRef.constructor;
      }
    }

    if (!isUpdate || mountAll) {
      mounts.unshift(component);
    } else if (!skip) {
      // Ensure that pending componentDidMount() hooks of child components
      // are called before the componentDidUpdate() hook in the parent.
      // Note: disabled as it causes duplicate hooks, see https://github.com/developit/preact/issues/750
      // flushMounts();

      if (component.afterUpdate) {
        //deprecated
        component.afterUpdate(previousProps, previousState, previousContext);
      }
      if (component.updated) {
        component.updated(previousProps, previousState, previousContext);
      }
      if (options.afterUpdate) options.afterUpdate(component);
    }

    if (component._renderCallbacks != null) {
      while (component._renderCallbacks.length) {
        component._renderCallbacks.pop().call(component);
      }
    }

    if (!diffLevel && !isChild) flushMounts();
  }

  /** Apply the Component referenced by a VNode to the DOM.
   *	@param {Element} dom	The DOM node to mutate
   *	@param {VNode} vnode	A Component-referencing VNode
   *	@returns {Element} dom	The created/mutated element
   *	@private
   */
  function buildComponentFromVNode(dom, vnode, context, mountAll) {
    var c = dom && dom._component,
        originalComponent = c,
        oldDom = dom,
        isDirectOwner = c && dom._componentConstructor === vnode.nodeName,
        isOwner = isDirectOwner,
        props = getNodeProps(vnode);
    while (c && !isOwner && (c = c._parentComponent)) {
      isOwner = c.constructor === vnode.nodeName;
    }

    if (c && isOwner && (!mountAll || c._component)) {
      setComponentProps(c, props, ASYNC_RENDER, context, mountAll);
      dom = c.base;
    } else {
      if (originalComponent && !isDirectOwner) {
        unmountComponent(originalComponent);
        dom = oldDom = null;
      }

      c = createComponent(vnode.nodeName, props, context, vnode);
      if (dom && !c.nextBase) {
        c.nextBase = dom;
        // passing dom/oldDom as nextBase will recycle it if unused, so bypass recycling on L229:
        oldDom = null;
      }
      setComponentProps(c, props, SYNC_RENDER, context, mountAll);
      dom = c.base;

      if (oldDom && dom !== oldDom) {
        oldDom._component = null;
        recollectNodeTree(oldDom, false);
      }
    }

    return dom;
  }

  /** Remove a component from the DOM and recycle it.
   *	@param {Component} component	The Component instance to unmount
   *	@private
   */
  function unmountComponent(component) {
    if (options.beforeUnmount) options.beforeUnmount(component);

    var base = component.base;

    component._disable = true;

    if (component.uninstall) component.uninstall();

    if (component.store && component.store.instances) {
      for (var i = 0, len = component.store.instances.length; i < len; i++) {
        if (component.store.instances[i] === component) {
          component.store.instances.splice(i, 1);
          break;
        }
      }
    }

    component.base = null;

    // recursively tear down & recollect high-order component children:
    var inner = component._component;
    if (inner) {
      unmountComponent(inner);
    } else if (base) {
      if (base[ATTR_KEY] != null) applyRef(base[ATTR_KEY].ref, null);

      component.nextBase = base;

      removeNode(base);
      collectComponent(component);

      removeChildren(base);
    }

    applyRef(component.__ref, null);
  }

  var _class, _temp;

  function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var id = 0;

  var Component = (_temp = _class = function () {
    function Component(props, store) {
      _classCallCheck$3(this, Component);

      this.props = assign(nProps(this.constructor.props), this.constructor.defaultProps, props);
      this.elementId = id++;
      this.data = this.constructor.data || this.data || {};

      this._preCss = null;

      this.store = store;
    }

    Component.prototype.update = function update(callback) {
      this._willUpdate = true;
      if (callback) (this._renderCallbacks = this._renderCallbacks || []).push(callback);
      renderComponent(this, FORCE_RENDER);
      if (options.componentChange) options.componentChange(this, this.base);
      this._willUpdate = false;
    };

    Component.prototype.fire = function fire(type, data) {
      var _this = this;

      Object.keys(this.props).every(function (key) {
        if ('on' + type.toLowerCase() === key.toLowerCase()) {
          _this.props[key]({ detail: data });
          return false;
        }
        return true;
      });
    };

    Component.prototype.render = function render() {};

    return Component;
  }(), _class.is = 'WeElement', _temp);

  /** Render JSX into a `parent` Element.
   *	@param {VNode} vnode		A (JSX) VNode to render
   *	@param {Element} parent		DOM element to render into
   *	@param {object} [store]
   *	@public
   */
  function render(vnode, parent, store, empty, merge) {
    parent = typeof parent === 'string' ? document.querySelector(parent) : parent;

    if (empty) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
    }

    if (merge) {
      merge = typeof merge === 'string' ? document.querySelector(merge) : merge;
    }

    return diff(merge, vnode, store, false, parent, false, true);
  }

  function tag(name) {
    return function (target) {
      define(name, target);
    };
  }

  var WeElement = Component;
  var root = getGlobal$1();
  var omiax = {
    h: h,
    tag: tag,
    define: define,
    Component: Component,
    render: render,
    WeElement: WeElement,
    options: options
  };

  root.Omi = omiax;
  root.omi = omiax;
  root.omiax = omiax;
  root.omiax.version = '0.0.0';

  function getGlobal$1() {
    if (typeof global !== 'object' || !global || global.Math !== Math || global.Array !== Array) {
      if (typeof self !== 'undefined') {
        return self;
      } else if (typeof window !== 'undefined') {
        return window;
      } else if (typeof global !== 'undefined') {
        return global;
      }
      return function () {
        return this;
      }();
    }
    return global;
  }

  var size = getSize();

  var vnode = Omi.h(
    'surface',
    { top: 0, left: 0, width: size.width, height: size.height, enableCSSLayout: true },
    Omi.h(
      'group',
      { style: getPageStyle() },
      Omi.h(
        'text',
        { style: getTitleStyle() },
        'Professor PuddinPop'
      ),
      Omi.h(
        'group',
        { style: getImageGroupStyle() },
        Omi.h('image', { src: 'https://placekitten.com/720/840', style: getImageStyle(), fadeIn: true })
      ),
      Omi.h(
        'text',
        { style: getExcerptStyle() },
        'With these words the Witch fell down in a brown, melted, shapeless mass and began to spread over the clean boards of the kitchen floor.  Seeing that she had really melted away to nothing, Dorothy drew another bucket of water and threw it over the mess.  She then swept it all out the door.  After picking out the silver shoe, which was all that was left of the old woman, she cleaned and dried it with a cloth, and put it on her foot again.  Then, being at last free to do as she chose, she ran out to the courtyard to tell the Lion that the Wicked Witch of the West had come to an end, and that they were no longer prisoners in a strange land.'
      )
    )
  );

  console.log(layoutNode(vnode));

  function getSize() {
    return {
      left: 0,
      top: 0,
      width: 420,
      height: 740
    };
  }

  function getPageStyle() {

    return {
      position: 'relative',
      padding: 14,
      width: size.width,
      height: size.height,
      backgroundColor: '#f7f7f7',
      flexDirection: 'column'
    };
  }

  function getImageGroupStyle() {
    return {
      position: 'relative',
      flex: 1,
      backgroundColor: '#eee'
    };
  }

  function getImageStyle() {
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };
  }

  function getTitleStyle() {
    return {
      fontFace: FontFace('Georgia'),
      fontSize: 22,
      lineHeight: 28,
      height: 28,
      marginBottom: 10,
      color: '#333',
      textAlign: 'center'
    };
  }

  function getExcerptStyle() {
    return {
      fontFace: FontFace('Georgia'),
      fontSize: 17,
      lineHeight: 25,
      marginTop: 15,
      flex: 1,
      color: '#333'
    };
  }

  function FontFace() {}

}());
//# sourceMappingURL=b.js.map