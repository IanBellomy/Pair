require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Pair":[function(require,module,exports){

/*

	Pair module

	See readme.md

	— Ian Bellomy, 2016
 */
var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

exports.Pair = (function(superClass) {
  var _anchor, _collisionListeners, _contained, _dSquared, _dragAndDropEnabled, _dragging, _floater, _hoveredNode, _previousDraggability, _previousPointerEvents, _rangeListeners, _tempListener, _tempRange, _validDragTarget;

  extend(Pair, superClass);

  Pair.draggedItems = [];

  _floater = {};

  _anchor = {};

  _dragAndDropEnabled = false;

  _hoveredNode = void 0;

  _dragging = false;

  _validDragTarget = false;

  _previousPointerEvents = "auto";

  _previousDraggability = false;

  _rangeListeners = [];

  _collisionListeners = [];

  _tempRange = void 0;

  _dSquared = 0;

  _contained = false;

  _tempListener = {};

  function Pair(floater, anchor) {
    this.loopListener = bind(this.loopListener, this);
    if (!(floater instanceof Framer.Layer)) {
      print("ERROR - Pair module:Pair:constructor,  first argument must be a Layer.");
      return;
    }
    if (!(anchor instanceof Framer.Layer)) {
      print("ERROR - Pair module:Pair:constructor,  second argument must be a Layer.");
      return;
    }
    if (floater.parent !== anchor.parent) {
      print("ERROR - Pair module:Pair:constructor,  first and second arguments must have the same parent.");
      return;
    }
    _dSquared = this.getDistanceSquared();
    _floater = floater;
    _anchor = anchor;
    this.wake();
    this.dragStartHandler = (function(_this) {
      return function(event, layer) {
        _validDragTarget = false;
        _previousPointerEvents = _floater.style.pointerEvents;
        _dragging = true;
        Pair.draggedItems.push(_floater);
        _floater.visible = false;
        _hoveredNode = document.elementFromPoint(event.clientX, event.clientY);
        _floater.visible = true;
        return _this.emit("dragStart", _floater);
      };
    })(this);
    this.dragHandler = (function(_this) {
      return function(event) {
        var nodeUnderneath;
        _floater.visible = false;
        nodeUnderneath = document.elementFromPoint(event.clientX, event.clientY);
        _floater.visible = true;
        if (nodeUnderneath !== _this._hoveredNode) {
          if (_anchor._element === nodeUnderneath) {
            _this._validDragTarget = true;
            _this._hoveredNode = nodeUnderneath;
            return _this.emit("dragEnter", _floater, _anchor);
          } else if (_this._hoveredNode === _anchor._element) {
            _this._validDragTarget = false;
            _this._hoveredNode = nodeUnderneath;
            return _this.emit("dragLeave", _floater, _anchor);
          }
        } else if (_this._validDragTarget) {
          return _this.emit("dragOver", _floater, _anchor);
        }
      };
    })(this);
    this.dragEndHandler = (function(_this) {
      return function(event, layer) {
        var index;
        _this._dragging = false;
        index = Pair.draggedItems.indexOf(_floater);
        Pair.draggedItems.splice(index, 1);
        if (_this._validDragTarget) {
          _this.emit("drop", _floater, _anchor);
          _this._validDragTarget = false;
        } else {
          _this.emit("invalidDrop", _floater);
        }
        if (_this.hitTest()) {
          return _this.emit("contactDrop", _floater, _anchor);
        } else {
          return _this.emit("invalidContactDrop", _floater);
        }
      };
    })(this);
    this.anchorMouseOver = (function(_this) {
      return function(event, layer) {
        if (_this._dragging) {
          if (Pair.draggedItems.indexOf(_floater !== -1)) {
            _this._validDragTarget = true;
            return _this.emit("dragEnter", _floater, _anchor);
          }
        }
      };
    })(this);
    this.anchorMouseOut = (function(_this) {
      return function(event, layer) {
        if (_this._dragging) {
          if (Pair.draggedItems.indexOf(_floater !== -1)) {
            _this._validDragTarget = false;
            return _this.emit("dragLeave", _floater, _anchor);
          }
        }
      };
    })(this);
  }

  Pair.prototype.loopListener = function() {
    var i, j, k, len, len1, len2, results, results1;
    _dSquared = this.getDistanceSquared();
    for (i = 0, len = _rangeListeners.length; i < len; i++) {
      _tempRange = _rangeListeners[i];
      _contained = (_tempRange.minSquared <= _dSquared && _dSquared <= _tempRange.maxSquared);
      if (_contained && !_tempRange.entered) {
        _tempRange.entered = true;
        _tempRange.enterCallback.apply(this);
      } else if (!_contained && _tempRange.entered) {
        _tempRange.entered = false;
        _tempRange.exitCallback.apply(this);
      }
    }
    if (this.hitTest()) {
      results = [];
      for (j = 0, len1 = _collisionListeners.length; j < len1; j++) {
        _tempListener = _collisionListeners[j];
        results.push(_tempListener.contact++ || _tempListener.contactStart(_anchor, _floater));
      }
      return results;
    } else {
      results1 = [];
      for (k = 0, len2 = _collisionListeners.length; k < len2; k++) {
        _tempListener = _collisionListeners[k];
        if (_tempListener.contact) {
          _tempListener.contact = false;
          results1.push(_tempListener.contactEnd(_anchor, _floater));
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }
  };

  Pair.prototype.getDistance = function() {
    return Math.sqrt(Math.pow(_floater.midX - _anchor.midX, 2) + Math.pow(_floater.midY - _anchor.midY, 2));
  };

  Pair.prototype.getDistanceSquared = function() {
    return Math.pow(_floater.midX - _anchor.midX, 2) + Math.pow(_floater.midY - _anchor.midY, 2);
  };

  Pair.prototype.setDistance = function(newDistance) {
    var distanceDiffRatio, newXOffset, newYOffset, oldXOffset, oldYOffset;
    distanceDiffRatio = newDistance / Math.sqrt(_dSquared);
    oldXOffset = _floater.midX - _anchor.midX;
    newXOffset = oldXOffset * distanceDiffRatio;
    _floater.midX = _anchor.midX + newXOffset;
    oldYOffset = _floater.midY - _anchor.midY;
    newYOffset = oldYOffset * distanceDiffRatio;
    return _floater.midY = _anchor.midY + newYOffset;
  };

  Pair.prototype.midpoint = function() {
    return [(_anchor.midX + _floater.midX) / 2.0, (_anchor.midY + _floater.midY) / 2.0];
  };

  Pair.prototype.hitTest = function() {
    var r1, r2;
    r1 = _anchor;
    r2 = _floater;
    return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
  };

  Pair.prototype.enableDragAndDrop = function() {
    this._dragAndDropEnabled = true;
    this._previousDraggability = _floater.draggable;
    _floater.draggable = true;
    this._hoveredNode = void 0;
    _floater.on(Events.DragStart, this.dragStartHandler);
    _floater.on(Events.DragMove, this.dragHandler);
    _floater.on(Events.DragEnd, this.dragEndHandler);
    _anchor.on(Events.MouseOver, this.anchorMouseOver);
    return _anchor.on(Events.MouseOut, this.anchorMouseOut);
  };

  Pair.prototype.disableDragAndDrop = function() {
    this._dragging = false;
    this._dragAndDropEnabled = false;
    _floater.draggable = this._previousDraggability;
    print(this._previousDraggability);
    _floater.off(Events.DragStart, this.dragStartHandler);
    _floater.off(Events.DragMove, this.dragHandler);
    _floater.off(Events.DragEnd, this.dragEndHandler);
    _anchor.off(Events.MouseOver, this.anchorMouseOver);
    return _anchor.off(Events.MouseOut, this.anchorMouseOut);
  };

  Pair.prototype.sleep = function() {
    return Framer.Loop.off("update", this.loopListener);
  };

  Pair.prototype.wake = function() {
    return Framer.Loop.on("update", this.loopListener);
  };

  Pair.prototype.destroy = function() {
    this.disableDragAndDrop();
    return this.sleep();
  };

  Pair.prototype.onRangeChange = function(min, max, enterFn, exitFn) {
    var count;
    if (exitFn == null) {
      exitFn = function() {};
    }
    count = _rangeListeners.push({
      min: min,
      max: max,
      minSquared: Math.pow(min, 2),
      maxSquared: Math.pow(max, 2),
      enterCallback: enterFn,
      exitCallback: exitFn,
      entered: false
    });
    return count - 1;
  };

  Pair.prototype.offRangeChange = function(index) {
    if (!(index instanceof Number)) {
      print("ERROR - Pair:offRangeChange(index), index must be a Number");
      return;
    }
    return _rangeListeners[index] = null;
  };

  Pair.prototype.onContactChange = function(startFn, endFn) {
    var count;
    if (endFn == null) {
      endFn = function() {};
    }
    count = (_collisionListeners.push({
      contactStart: startFn,
      contactEnd: endFn,
      contact: false
    })) - 1;
    return count;
  };

  Pair.prototype.offContactChange = function(index) {
    if (!(index instanceof Number)) {
      print("ERROR - Pair:offContactChange(index), index must be a Number");
      return;
    }
    return _collisionListeners[index] = null;
  };

  Pair.prototype.onDragStart = function(fn) {
    return this.on("dragStart", fn);
  };

  Pair.prototype.onDragEnter = function(fn) {
    return this.on("dragEnter", fn);
  };

  Pair.prototype.onDragOver = function(fn) {
    return this.on("dragOver", fn);
  };

  Pair.prototype.onDragLeave = function(fn) {
    return this.on("dragLeave", fn);
  };

  Pair.prototype.onInvalidDrop = function(fn) {
    return this.on("invalidDrop", fn);
  };

  Pair.prototype.onDrop = function(fn) {
    return this.on("drop", fn);
  };

  Pair.prototype.onContactDrop = function(fn) {
    return this.on("contactDrop", fn);
  };

  Pair.prototype.onInvalidContactDrop = function(fn) {
    return this.on("invalidContactDrop", fn);
  };

  return Pair;

})(Framer.EventEmitter);


/* 

	Convenience function for making multiple pairs.
 */

exports.makePairs = function(float, anchors) {
  var anchor, i, len, p, pairs;
  pairs = [];
  for (i = 0, len = anchors.length; i < len; i++) {
    anchor = anchors[i];
    p = new Pair(float, anchor);
  }
  return pairs;
};


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaWFuYmVsbG9teS9HaXRIdWIvUGFpci9leGFtcGxlcy8wMl9jb250YWN0RHJvcC5mcmFtZXIvbW9kdWxlcy9QYWlyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTs7Ozs7Ozs7QUFBQSxJQUFBOzs7O0FBVU0sT0FBTyxDQUFDO0FBSWIsTUFBQTs7OztFQUFBLElBQUMsQ0FBQSxZQUFELEdBQWM7O0VBR2QsUUFBQSxHQUFjOztFQUNkLE9BQUEsR0FBYzs7RUFDZCxtQkFBQSxHQUF1Qjs7RUFDdkIsWUFBQSxHQUFrQjs7RUFDbEIsU0FBQSxHQUFnQjs7RUFDaEIsZ0JBQUEsR0FBcUI7O0VBQ3JCLHNCQUFBLEdBQTBCOztFQUMxQixxQkFBQSxHQUF5Qjs7RUFDekIsZUFBQSxHQUFvQjs7RUFDcEIsbUJBQUEsR0FBdUI7O0VBQ3ZCLFVBQUEsR0FBaUI7O0VBQ2pCLFNBQUEsR0FBZ0I7O0VBQ2hCLFVBQUEsR0FBaUI7O0VBQ2pCLGFBQUEsR0FBbUI7O0VBRU4sY0FBQyxPQUFELEVBQVUsTUFBVjs7SUFFWixJQUFHLENBQUMsQ0FBQyxPQUFBLFlBQW1CLE1BQU0sQ0FBQyxLQUEzQixDQUFKO01BQ0MsS0FBQSxDQUFNLHdFQUFOO0FBQ0EsYUFGRDs7SUFJQSxJQUFHLENBQUMsQ0FBQyxNQUFBLFlBQWtCLE1BQU0sQ0FBQyxLQUExQixDQUFKO01BQ0MsS0FBQSxDQUFNLHlFQUFOO0FBQ0EsYUFGRDs7SUFJQSxJQUFHLE9BQU8sQ0FBQyxNQUFSLEtBQWtCLE1BQU0sQ0FBQyxNQUE1QjtNQUNDLEtBQUEsQ0FBTSw4RkFBTjtBQUNBLGFBRkQ7O0lBSUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxrQkFBRCxDQUFBO0lBRVosUUFBQSxHQUFXO0lBQ1gsT0FBQSxHQUFVO0lBRVYsSUFBQyxDQUFBLElBQUQsQ0FBQTtJQUtBLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixD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QUFBLEdBQWUsU0FBQyxFQUFEO1dBQ2QsSUFBQyxDQUFBLEVBQUQsQ0FBSSxhQUFKLEVBQW1CLEVBQW5CO0VBRGM7O2lCQUdmLE1BQUEsR0FBUSxTQUFDLEVBQUQ7V0FDUCxJQUFDLENBQUEsRUFBRCxDQUFJLE1BQUosRUFBWSxFQUFaO0VBRE87O2lCQUdSLGFBQUEsR0FBZSxTQUFDLEVBQUQ7V0FDZCxJQUFDLENBQUEsRUFBRCxDQUFJLGFBQUosRUFBbUIsRUFBbkI7RUFEYzs7aUJBR2Ysb0JBQUEsR0FBc0IsU0FBQyxFQUFEO1dBQ3JCLElBQUMsQ0FBQSxFQUFELENBQUksb0JBQUosRUFBMEIsRUFBMUI7RUFEcUI7Ozs7R0F0UkksTUFBTSxDQUFDOzs7QUF5UmxDOzs7OztBQU1BLE9BQU8sQ0FBQyxTQUFSLEdBQW9CLFNBQUMsS0FBRCxFQUFPLE9BQVA7QUFDbkIsTUFBQTtFQUFBLEtBQUEsR0FBUTtBQUNSLE9BQUEseUNBQUE7O0lBQ0MsQ0FBQSxHQUFRLElBQUEsSUFBQSxDQUFLLEtBQUwsRUFBWSxNQUFaO0FBRFQ7QUFHQSxTQUFPO0FBTFkiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIyMjXG5cblx0UGFpciBtb2R1bGVcblxuXHRTZWUgcmVhZG1lLm1kXG5cblx04oCUIElhbiBCZWxsb215LCAyMDE2XG5cdFxuIyMjXG5cbmNsYXNzIGV4cG9ydHMuUGFpciBleHRlbmRzIEZyYW1lci5FdmVudEVtaXR0ZXJcblxuXHQjIHN0YXRpYyBwcm9wZXJ0aWVzXG5cblx0QGRyYWdnZWRJdGVtczpbXVx0XHRcblxuXHQjIHByaXZhdGUgcHJvcGVydGllc1xuXHRfZmxvYXRlclx0XHRcdFx0PSB7fVxuXHRfYW5jaG9yXHRcdFx0XHRcdD0ge31cblx0X2RyYWdBbmREcm9wRW5hYmxlZCBcdD0gZmFsc2Vcblx0X2hvdmVyZWROb2RlIFx0XHRcdD0gdW5kZWZpbmVkXG5cdF9kcmFnZ2luZyBcdFx0XHRcdD0gZmFsc2Vcblx0X3ZhbGlkRHJhZ1RhcmdldCBcdFx0PSBmYWxzZVxuXHRfcHJldmlvdXNQb2ludGVyRXZlbnRzIFx0PSBcImF1dG9cIlxuXHRfcHJldmlvdXNEcmFnZ2FiaWxpdHkgXHQ9IGZhbHNlXG5cdF9yYW5nZUxpc3RlbmVycyBcdFx0PSBbXVx0XHRcblx0X2NvbGxpc2lvbkxpc3RlbmVycyBcdD0gW11cdFxuXHRfdGVtcFJhbmdlIFx0XHRcdFx0PSB1bmRlZmluZWRcblx0X2RTcXVhcmVkIFx0XHRcdFx0PSAwXG5cdF9jb250YWluZWQgXHRcdFx0XHQ9IGZhbHNlXG5cdF90ZW1wTGlzdGVuZXIgXHRcdFx0PSB7fVxuXG5cdGNvbnN0cnVjdG9yOiAoZmxvYXRlciwgYW5jaG9yKSAtPlx0XHRcblxuXHRcdGlmICEoZmxvYXRlciBpbnN0YW5jZW9mIEZyYW1lci5MYXllcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIExheWVyLlwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdGlmICEoYW5jaG9yIGluc3RhbmNlb2YgRnJhbWVyLkxheWVyKVxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXIgbW9kdWxlOlBhaXI6Y29uc3RydWN0b3IsICBzZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBhIExheWVyLlwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdGlmIGZsb2F0ZXIucGFyZW50ICE9IGFuY2hvci5wYXJlbnRcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgZmlyc3QgYW5kIHNlY29uZCBhcmd1bWVudHMgbXVzdCBoYXZlIHRoZSBzYW1lIHBhcmVudC5cIlxuXHRcdFx0cmV0dXJuXG5cblx0XHRfZFNxdWFyZWQgPSBAZ2V0RGlzdGFuY2VTcXVhcmVkKClcdFx0XG5cblx0XHRfZmxvYXRlciA9IGZsb2F0ZXJcblx0XHRfYW5jaG9yXHQ9IGFuY2hvclxuXG5cdFx0QHdha2UoKVxuXG5cdFx0IyBUaGVzZSBwcml2YXRlIG1ldGhvZHMgd2lsbCBiZSBldmVudCBoYW5kbGVycyBhdHRhY2hlZCB0byB0aGUgZmxvYXRlciBhbmQgYW5jaG9yIGxheWVycy5cblx0XHQjIFRoZXkgc2hvdWxkIHN0YXkgc2NvcGVkIHRvIHRoZSBQYWlyIGluc3RhbmNlIHdoZW4gY2FsbGVkLiBcblxuXHRcdEBkcmFnU3RhcnRIYW5kbGVyID0gKGV2ZW50LGxheWVyKSA9Plx0XHRcdFxuXHRcdFx0X3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXG5cdFx0XHRfcHJldmlvdXNQb2ludGVyRXZlbnRzID0gX2Zsb2F0ZXIuc3R5bGUucG9pbnRlckV2ZW50c1xuXHRcdFx0X2RyYWdnaW5nID0gdHJ1ZVxuXHRcdFx0UGFpci5kcmFnZ2VkSXRlbXMucHVzaCBfZmxvYXRlclxuXHRcdFx0IyBfZmxvYXRlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCJcblx0XHRcdF9mbG9hdGVyLnZpc2libGUgPSBmYWxzZVxuXHRcdFx0X2hvdmVyZWROb2RlID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKVxuXHRcdFx0X2Zsb2F0ZXIudmlzaWJsZSA9IHRydWVcblx0XHRcdEBlbWl0IFwiZHJhZ1N0YXJ0XCIsIF9mbG9hdGVyXG5cblx0XHRAZHJhZ0hhbmRsZXIgPSAoZXZlbnQpID0+XHRcdFx0XG5cdFx0XHRfZmxvYXRlci52aXNpYmxlID0gZmFsc2Vcblx0XHRcdG5vZGVVbmRlcm5lYXRoID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKVxuXHRcdFx0X2Zsb2F0ZXIudmlzaWJsZSA9IHRydWVcblx0XHRcdGlmIG5vZGVVbmRlcm5lYXRoICE9IEBfaG92ZXJlZE5vZGUgIyB0b3VjaGVkIHNvbWV0aGluZyBuZXcuLi5cdFx0XHRcdFxuXHRcdFx0XHRpZiBfYW5jaG9yLl9lbGVtZW50ID09IG5vZGVVbmRlcm5lYXRoICMgdG91Y2hlZCBhbmNob3I/XG5cdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSB0cnVlXHRcdFx0XHRcdFxuXHRcdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFxuXHRcdFx0XHRcdEBlbWl0IFwiZHJhZ0VudGVyXCIsIF9mbG9hdGVyLCBfYW5jaG9yXG5cdFx0XHRcdGVsc2UgaWYgQF9ob3ZlcmVkTm9kZSA9PSBfYW5jaG9yLl9lbGVtZW50ICNsZWZ0IGFuY2hvcj9cblx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXHRcdFx0XHRcblx0XHRcdFx0XHRAX2hvdmVyZWROb2RlID0gbm9kZVVuZGVybmVhdGhcblx0XHRcdFx0XHRAZW1pdCBcImRyYWdMZWF2ZVwiLCBfZmxvYXRlciwgX2FuY2hvclxuXHRcdFx0ZWxzZSBpZiBAX3ZhbGlkRHJhZ1RhcmdldFxuXHRcdFx0XHRAZW1pdCBcImRyYWdPdmVyXCIsIF9mbG9hdGVyLCBfYW5jaG9yXG5cblx0XHRAZHJhZ0VuZEhhbmRsZXIgPSAoZXZlbnQsIGxheWVyKSA9PlxuXHRcdFx0QF9kcmFnZ2luZyA9IGZhbHNlXG5cdFx0XHQjIF9mbG9hdGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBAX3ByZXZpb3VzUG9pbnRlckV2ZW50c1xuXHRcdFx0aW5kZXggPSBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIF9mbG9hdGVyXG5cdFx0XHRQYWlyLmRyYWdnZWRJdGVtcy5zcGxpY2UoaW5kZXgsMSlcblx0XHRcdGlmIEBfdmFsaWREcmFnVGFyZ2V0XHRcdFx0XHRcblx0XHRcdFx0QGVtaXQgXCJkcm9wXCIsIF9mbG9hdGVyLCBfYW5jaG9yXG5cdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gZmFsc2Vcblx0XHRcdGVsc2VcdFx0XHRcblx0XHRcdFx0QGVtaXQgXCJpbnZhbGlkRHJvcFwiLCBfZmxvYXRlclxuXG5cdFx0XHRpZiBAaGl0VGVzdCgpXG5cdFx0XHRcdEBlbWl0IFwiY29udGFjdERyb3BcIiwgX2Zsb2F0ZXIsIF9hbmNob3Jcblx0XHRcdGVsc2UgXG5cdFx0XHRcdEBlbWl0IFwiaW52YWxpZENvbnRhY3REcm9wXCIsIF9mbG9hdGVyXG5cblxuXHRcdEBhbmNob3JNb3VzZU92ZXIgPSAoZXZlbnQsbGF5ZXIpPT5cblx0XHRcdGlmIEBfZHJhZ2dpbmcgIFxuXHRcdFx0XHRpZiBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIF9mbG9hdGVyIGlzbnQgLTFcblx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IHRydWVcblx0XHRcdFx0XHRAZW1pdCBcImRyYWdFbnRlclwiLCBfZmxvYXRlciwgX2FuY2hvclxuXG5cdFx0QGFuY2hvck1vdXNlT3V0ID0gKGV2ZW50LGxheWVyKT0+XG5cdFx0XHRpZiBAX2RyYWdnaW5nIFxuXHRcdFx0XHRpZiBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIF9mbG9hdGVyIGlzbnQgLTFcblx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXG5cdFx0XHRcdFx0QGVtaXQgXCJkcmFnTGVhdmVcIiwgX2Zsb2F0ZXIsIF9hbmNob3Jcblx0XHRcdFx0XG5cdFx0I2VuZCBwcml2YXRlIG1ldGhvZHNcblxuXG5cdCNzaG91bGQgbXVsdGlwbGUgUGFpcnMgYmUgaGFuZGxlZCBpbiB0aGUgc2FtZSBsaXN0ZW5lcj9cblx0bG9vcExpc3RlbmVyOiA9PlxuXHRcdF9kU3F1YXJlZCA9IEBnZXREaXN0YW5jZVNxdWFyZWQoKVxuXHRcdGZvciBfdGVtcFJhbmdlIGluIF9yYW5nZUxpc3RlbmVycyAgXG5cdFx0XHRfY29udGFpbmVkID0gX3RlbXBSYW5nZS5taW5TcXVhcmVkIDw9IF9kU3F1YXJlZCA8PSBfdGVtcFJhbmdlLm1heFNxdWFyZWQgXG5cdFx0XHRpZiBfY29udGFpbmVkIGFuZCBub3QgX3RlbXBSYW5nZS5lbnRlcmVkIFxuXHRcdFx0XHRfdGVtcFJhbmdlLmVudGVyZWQgPSB0cnVlXG5cdFx0XHRcdF90ZW1wUmFuZ2UuZW50ZXJDYWxsYmFjay5hcHBseSBAXG5cdFx0XHRcdFxuXHRcdFx0ZWxzZSBpZiBub3QgX2NvbnRhaW5lZCBhbmQgX3RlbXBSYW5nZS5lbnRlcmVkXG5cdFx0XHRcdF90ZW1wUmFuZ2UuZW50ZXJlZCA9IGZhbHNlXG5cdFx0XHRcdF90ZW1wUmFuZ2UuZXhpdENhbGxiYWNrLmFwcGx5IEBcdFx0XHRcblxuXHRcdGlmIEBoaXRUZXN0KClcblx0XHRcdGZvciBfdGVtcExpc3RlbmVyIGluIF9jb2xsaXNpb25MaXN0ZW5lcnNcblx0XHRcdFx0X3RlbXBMaXN0ZW5lci5jb250YWN0KysgfHwgX3RlbXBMaXN0ZW5lci5jb250YWN0U3RhcnQoX2FuY2hvcixfZmxvYXRlcilcblx0XHRcdFx0XG5cdFx0ZWxzZVxuXHRcdFx0Zm9yIF90ZW1wTGlzdGVuZXIgaW4gX2NvbGxpc2lvbkxpc3RlbmVyc1xuXHRcdFx0XHRpZihfdGVtcExpc3RlbmVyLmNvbnRhY3QpXG5cdFx0XHRcdFx0X3RlbXBMaXN0ZW5lci5jb250YWN0ID0gZmFsc2Vcblx0XHRcdFx0XHRfdGVtcExpc3RlbmVyLmNvbnRhY3RFbmQoX2FuY2hvcixfZmxvYXRlcilcblxuXG5cdFx0XHRcblxuXG5cdFxuXHRnZXREaXN0YW5jZTogLT5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KChfZmxvYXRlci5taWRYLV9hbmNob3IubWlkWCkqKjIgKyAoX2Zsb2F0ZXIubWlkWS1fYW5jaG9yLm1pZFkpKioyKVxuXHRcblx0Z2V0RGlzdGFuY2VTcXVhcmVkOiAtPlxuXHRcdHJldHVybiAoX2Zsb2F0ZXIubWlkWC1fYW5jaG9yLm1pZFgpKioyICsgKF9mbG9hdGVyLm1pZFktX2FuY2hvci5taWRZKSoqMlxuXHRcblx0c2V0RGlzdGFuY2U6KG5ld0Rpc3RhbmNlKS0+XG5cdFx0ZGlzdGFuY2VEaWZmUmF0aW8gPSBuZXdEaXN0YW5jZS8gTWF0aC5zcXJ0KF9kU3F1YXJlZClcblxuXHRcdG9sZFhPZmZzZXQgPSBfZmxvYXRlci5taWRYIC0gX2FuY2hvci5taWRYXG5cdFx0bmV3WE9mZnNldCA9IG9sZFhPZmZzZXQgKiBkaXN0YW5jZURpZmZSYXRpb1xuXHRcdF9mbG9hdGVyLm1pZFggPSBfYW5jaG9yLm1pZFggKyBuZXdYT2Zmc2V0XG5cblx0XHRvbGRZT2Zmc2V0ID0gX2Zsb2F0ZXIubWlkWSAtIF9hbmNob3IubWlkWVxuXHRcdG5ld1lPZmZzZXQgPSBvbGRZT2Zmc2V0ICogZGlzdGFuY2VEaWZmUmF0aW9cblx0XHRfZmxvYXRlci5taWRZID0gX2FuY2hvci5taWRZICsgbmV3WU9mZnNldFxuXG5cdFxuXHQjIHRoZSBjby1vcmRpbmF0ZXMgYmV0d2VlbiB0aGUgYW5jaG9yIGFuZCBmbG9hdGVyXG5cdG1pZHBvaW50OiAtPlxuXHRcdHJldHVybiBbKF9hbmNob3IubWlkWCArIF9mbG9hdGVyLm1pZFgpLzIuMCwoX2FuY2hvci5taWRZICsgX2Zsb2F0ZXIubWlkWSkvMi4wXVxuXHRcblx0I3JldHVybnMgdHJ1ZSBpZiB0aGUgYW5jaG9yIGFuZCBmbG9hdGVyIGZyYW1lcyB0b3VjaFx0XHRcblx0aGl0VGVzdDotPlxuXHRcdHIxID0gX2FuY2hvclxuXHRcdHIyID0gX2Zsb2F0ZXJcblx0XHRyZXR1cm4gISggcjIueCA+IHIxLnggKyByMS53aWR0aCBvciByMi54ICsgcjIud2lkdGggPCByMS54IG9yIHIyLnkgPiByMS55ICsgcjEuaGVpZ2h0IG9yIHIyLnkgKyByMi5oZWlnaHQgPCByMS55KVxuXG5cblx0IyB3aGF0IGhhcHBlbnMgd2hlbiB0aGVyZSBhcmUgb3RoZXIgYnV0dG9ucz9cblx0IyB0aGUgY3Vyc29yIHNob3VsZCByZWFsbHkgYmUgY2FwdHVyZWQgc29tZWhvdy5cblx0IyAoaW5zZXJ0IGEgYmxvY2tpbmcgbGF5ZXIgYmVsb3cgdGhlIF9mbG9hdGVyPylcblx0IyBkb24ndCB1c2UgdGhlIG9yaWdpbmFsIGVsZW1lbnQgLyBjbG9uZSB0aGUgZmxvYXRlciBhbmQgcGFzcyB0aGF0P1xuXHQjIGhvdyB0byBnZXQgcmlkIG9mIHRoYXQgc3R1cGlkIHRleHQgY3Vyc29yIT8hXHRcblxuXHRlbmFibGVEcmFnQW5kRHJvcDotPlxuXHRcdEBfZHJhZ0FuZERyb3BFbmFibGVkID0gdHJ1ZVxuXHRcdEBfcHJldmlvdXNEcmFnZ2FiaWxpdHkgPSBfZmxvYXRlci5kcmFnZ2FibGVcblx0XHRfZmxvYXRlci5kcmFnZ2FibGUgPSB0cnVlXG5cdFx0IyBfZmxvYXRlci5zdHlsZS5jdXJzb3IgPSBcIi13ZWJraXQtZ3JhYlwiXG5cdFx0QF9ob3ZlcmVkTm9kZSA9IHVuZGVmaW5lZFxuXG5cdFx0X2Zsb2F0ZXIub24gRXZlbnRzLkRyYWdTdGFydCwgQGRyYWdTdGFydEhhbmRsZXJcblx0XHRfZmxvYXRlci5vbiBFdmVudHMuRHJhZ01vdmUsIEBkcmFnSGFuZGxlclxuXHRcdF9mbG9hdGVyLm9uIEV2ZW50cy5EcmFnRW5kLCBAZHJhZ0VuZEhhbmRsZXJcdFx0XG5cdFx0X2FuY2hvci5vbiBFdmVudHMuTW91c2VPdmVyLCBAYW5jaG9yTW91c2VPdmVyXG5cdFx0X2FuY2hvci5vbiBFdmVudHMuTW91c2VPdXQsIEBhbmNob3JNb3VzZU91dFxuXG5cblx0ZGlzYWJsZURyYWdBbmREcm9wOi0+XHRcblx0XHRAX2RyYWdnaW5nID0gZmFsc2VcdFxuXHRcdEBfZHJhZ0FuZERyb3BFbmFibGVkID0gZmFsc2Vcblx0XHRfZmxvYXRlci5kcmFnZ2FibGUgPSBAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5XG5cblx0XHRwcmludCBAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5XG5cblx0XHRfZmxvYXRlci5vZmYgRXZlbnRzLkRyYWdTdGFydCwgQGRyYWdTdGFydEhhbmRsZXJcblx0XHRfZmxvYXRlci5vZmYgRXZlbnRzLkRyYWdNb3ZlLCBAZHJhZ0hhbmRsZXJcblx0XHRfZmxvYXRlci5vZmYgRXZlbnRzLkRyYWdFbmQsIEBkcmFnRW5kSGFuZGxlclx0XHRcblx0XHRfYW5jaG9yLm9mZiBFdmVudHMuTW91c2VPdmVyLCBAYW5jaG9yTW91c2VPdmVyXG5cdFx0X2FuY2hvci5vZmYgRXZlbnRzLk1vdXNlT3V0LCBAYW5jaG9yTW91c2VPdXRcblxuXHRzbGVlcDotPlxuXHRcdEZyYW1lci5Mb29wLm9mZiBcInVwZGF0ZVwiLCBAbG9vcExpc3RlbmVyXG5cdFx0IyBkaXNhYmxlIGRyYWcgYW5kIGRyb3AsIHJlbWVtYmVyIHdoYXQgdGhlIHN0YXRlIHdhc1xuXG5cdHdha2U6LT5cblx0XHRGcmFtZXIuTG9vcC5vbiBcInVwZGF0ZVwiLCBAbG9vcExpc3RlbmVyXG5cdFx0IyB1cGRhdGUgY29udGFjdCBwcm9wZXJ0aWVzIG9mIGxpc3RlbmVycz9cblx0XHQjIGVuYWJsZWQgZHJhZyBhbmQgZHJvcCBpZiB0aGlzIHdhcyBhY3RpdmUgYmVmb3JlXG5cblx0ZGVzdHJveTotPlxuXHRcdEBkaXNhYmxlRHJhZ0FuZERyb3AoKVxuXHRcdEBzbGVlcCgpXG5cdFx0IyB0aGF0J3MgaXQhIEkgdGhpbmsuLi5cblxuXG5cdCNcblx0I1x0RXZlbnQgSGFuZGxpbmdcblx0I1xuXG5cdCNyZXR1cm5zIGFuIGluZGV4XG5cdG9uUmFuZ2VDaGFuZ2U6IChtaW4sbWF4LGVudGVyRm4sZXhpdEZuID0gLT4pIC0+XG5cdFx0Y291bnQgPSBfcmFuZ2VMaXN0ZW5lcnMucHVzaFxuXHRcdFx0bWluOm1pblxuXHRcdFx0bWF4Om1heFxuXHRcdFx0bWluU3F1YXJlZDogbWluKioyXG5cdFx0XHRtYXhTcXVhcmVkOiBtYXgqKjJcblx0XHRcdGVudGVyQ2FsbGJhY2s6IGVudGVyRm5cblx0XHRcdGV4aXRDYWxsYmFjazogZXhpdEZuXG5cdFx0XHRlbnRlcmVkOmZhbHNlXG5cdFx0XG5cdFx0cmV0dXJuIGNvdW50IC0gMVxuXG5cblx0b2ZmUmFuZ2VDaGFuZ2U6IChpbmRleCkgLT5cblx0XHRpZiAhKGluZGV4IGluc3RhbmNlb2YgTnVtYmVyKVxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXI6b2ZmUmFuZ2VDaGFuZ2UoaW5kZXgpLCBpbmRleCBtdXN0IGJlIGEgTnVtYmVyXCJcblx0XHRcdHJldHVyblxuXG5cdFx0X3JhbmdlTGlzdGVuZXJzW2luZGV4XSA9IG51bGxcblxuXG5cdCMgUmV0dXJucyBpbmRleFxuXHRvbkNvbnRhY3RDaGFuZ2U6IChzdGFydEZuLGVuZEZuPS0+KSAtPlxuXHRcdGNvdW50ID0gKF9jb2xsaXNpb25MaXN0ZW5lcnMucHVzaCBcblx0XHRcdGNvbnRhY3RTdGFydDpzdGFydEZuXG5cdFx0XHRjb250YWN0RW5kOmVuZEZuXG5cdFx0XHRjb250YWN0OmZhbHNlKSAtIDFcdFxuXG5cdFx0cmV0dXJuIGNvdW50XG5cblxuXHRvZmZDb250YWN0Q2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0aWYgIShpbmRleCBpbnN0YW5jZW9mIE51bWJlcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyOm9mZkNvbnRhY3RDaGFuZ2UoaW5kZXgpLCBpbmRleCBtdXN0IGJlIGEgTnVtYmVyXCJcblx0XHRcdHJldHVyblxuXG5cdFx0X2NvbGxpc2lvbkxpc3RlbmVyc1tpbmRleF0gPSBudWxsIFx0XG5cblx0I1x0XG5cdCNcdEV2ZW50IGhhbmRsaW5nIGNvbnZlbmllbmNlIGZ1bmN0aW9uc1xuXHQjXG5cblx0b25EcmFnU3RhcnQ6IChmbiktPlxuXHRcdEBvbiBcImRyYWdTdGFydFwiLCBmblxuXG5cdG9uRHJhZ0VudGVyOiAoZm4pLT5cblx0XHRAb24gXCJkcmFnRW50ZXJcIiwgZm5cblxuXHRvbkRyYWdPdmVyOiAoZm4pLT5cblx0XHRAb24gXCJkcmFnT3ZlclwiLCBmblxuXG5cdG9uRHJhZ0xlYXZlOiAoZm4pLT5cblx0XHRAb24gXCJkcmFnTGVhdmVcIiwgZm5cblxuXHRvbkludmFsaWREcm9wOiAoZm4pLT5cblx0XHRAb24gXCJpbnZhbGlkRHJvcFwiLCBmblxuXG5cdG9uRHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiZHJvcFwiLCBmblxuXG5cdG9uQ29udGFjdERyb3A6IChmbiktPlxuXHRcdEBvbiBcImNvbnRhY3REcm9wXCIsIGZuXG5cblx0b25JbnZhbGlkQ29udGFjdERyb3A6IChmbiktPlxuXHRcdEBvbiBcImludmFsaWRDb250YWN0RHJvcFwiLCBmblxuXG4jIyMgXG5cblx0Q29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIG1ha2luZyBtdWx0aXBsZSBwYWlycy4gXG5cdFxuIyMjIFxuXG5leHBvcnRzLm1ha2VQYWlycyA9IChmbG9hdCxhbmNob3JzKS0+XG5cdHBhaXJzID0gW11cblx0Zm9yIGFuY2hvciBpbiBhbmNob3JzXG5cdFx0cCA9IG5ldyBQYWlyIGZsb2F0LCBhbmNob3JcblxuXHRyZXR1cm4gcGFpcnNcblxuIl19
