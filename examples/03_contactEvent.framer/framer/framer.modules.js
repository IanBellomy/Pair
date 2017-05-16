require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Pair":[function(require,module,exports){

/*

	Pair module

	See readme.md

	— Ian Bellomy, 2017
 */
var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

exports.Pair = (function(superClass) {
  extend(Pair, superClass);

  Pair.draggedItems = [];

  function Pair(_floater, _anchor) {
    this._floater = _floater;
    this._anchor = _anchor;
    this.loopListener = bind(this.loopListener, this);
    if (!(this._floater instanceof Framer.Layer)) {
      print("ERROR - Pair module:Pair:constructor,  first argument must be a Layer.");
      return;
    }
    if (!(this._anchor instanceof Framer.Layer)) {
      print("ERROR - Pair module:Pair:constructor,  second argument must be a Layer.");
      return;
    }
    if (this._floater.parent !== this._anchor.parent) {
      print("ERROR - Pair module:Pair:constructor,  first and second arguments must have the same parent.");
      return;
    }
    this._dragAndDropEnabled = false;
    this._anchorPreviouslyIgnoredEvents = this._anchor.ignoreEvents;
    this._hoveredNode = void 0;
    this._isOverAnchor = false;
    this._dragging = false;
    this._validDragTarget = false;
    this._previousCursor = this._floater.style.cursor;
    this._previousDraggability = false;
    this._rangeListeners = [];
    this._collisionListeners = [];
    this._tempRange = void 0;
    this._contained = false;
    this._tempListener = {};
    this._dSquared = this.getDistanceSquared();
    this._floatMouseDown = (function(_this) {
      return function(event, layer) {
        _this._pauseEvent(event);
        return _this._floater.style.cursor = "-webkit-grabbing";
      };
    })(this);
    this._floatMouseUp = (function(_this) {
      return function(event, layer) {
        _this._pauseEvent(event);
        return _this._floater.style.cursor = "-webkit-grab";
      };
    })(this);
    this._floatOver = (function(_this) {
      return function(event, layer) {
        return _this._pauseEvent(event);
      };
    })(this);
    this._dragStartHandler = (function(_this) {
      return function(event, layer) {
        _this._pauseEvent(event);
        _this._validDragTarget = false;
        _this._dragging = true;
        Pair.draggedItems.push(_this._floater);
        _this._floater.visible = false;
        _this._hoveredNode = document.elementFromPoint(event.clientX, event.clientY);
        _this._isOverAnchor = _this._anchor._element.contains(_this._hoveredNode);
        _this._floater.visible = true;
        return _this.emit("dragStart", _this._floater);
      };
    })(this);
    this._dragHandler = (function(_this) {
      return function(event) {
        var isNowOverAnchor, nodeUnderneath;
        _this._pauseEvent(event);
        _this._floater.visible = false;
        nodeUnderneath = document.elementFromPoint(event.clientX, event.clientY);
        _this._floater.visible = true;
        isNowOverAnchor = _this._anchor._element.contains(nodeUnderneath);
        if (isNowOverAnchor && !_this._isOverAnchor) {
          _this._validDragTarget = true;
          _this._isOverAnchor = true;
          _this._hoveredNode = nodeUnderneath;
          return _this.emit("dragEnter", _this._floater, _this._anchor);
        } else if (!isNowOverAnchor && _this._isOverAnchor) {
          _this._validDragTarget = false;
          _this._hoveredNode = nodeUnderneath;
          _this._isOverAnchor = false;
          return _this.emit("dragLeave", _this._floater, _this._anchor);
        } else if (isNowOverAnchor && _this._isOverAnchor && _this._validDragTarget) {
          return _this.emit("dragOver", _this._floater, _this._anchor);
        }
      };
    })(this);
    this._dragEndHandler = (function(_this) {
      return function(event, layer) {
        var index;
        _this._dragging = false;
        index = Pair.draggedItems.indexOf(_this._floater);
        Pair.draggedItems.splice(index, 1);
        if (_this._validDragTarget) {
          _this.emit("drop", _this._floater, _this._anchor);
          _this._validDragTarget = false;
        } else {
          _this.emit("invalidDrop", _this._floater);
        }
        if (_this.hitTest()) {
          return _this.emit("contactDrop", _this._floater, _this._anchor);
        } else {
          return _this.emit("invalidContactDrop", _this._floater);
        }
      };
    })(this);
    this._floatMoveHandler = (function(_this) {
      return function(event, layer) {
        return _this._pauseEvent(event);
      };
    })(this);
    this.wake();
  }

  Pair.prototype._pauseEvent = function(event) {
    event.stopPropagation();
    event.preventDefault();
    event.cancelBubble = true;
    return event.returnValue = false;
  };

  Pair.prototype.loopListener = function() {
    var i, j, k, len, len1, len2, ref, ref1, ref2, ref3, results, results1;
    this._dSquared = this.getDistanceSquared();
    ref = this._rangeListeners;
    for (i = 0, len = ref.length; i < len; i++) {
      this._tempRange = ref[i];
      this._contained = (this._tempRange.minSquared <= (ref1 = this._dSquared) && ref1 <= this._tempRange.maxSquared);
      if (this._contained && !this._tempRange.entered) {
        this._tempRange.entered = true;
        this._tempRange.enterCallback.apply(this);
      } else if (!this._contained && this._tempRange.entered) {
        this._tempRange.entered = false;
        this._tempRange.exitCallback.apply(this);
      }
    }
    if (this.hitTest()) {
      ref2 = this._collisionListeners;
      results = [];
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        this._tempListener = ref2[j];
        results.push(this._tempListener.contact++ || this._tempListener.contactStart(this._floater, this._anchor));
      }
      return results;
    } else {
      ref3 = this._collisionListeners;
      results1 = [];
      for (k = 0, len2 = ref3.length; k < len2; k++) {
        this._tempListener = ref3[k];
        if (this._tempListener.contact) {
          this._tempListener.contact = false;
          results1.push(this._tempListener.contactEnd(this._floater, this._anchor));
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }
  };

  Pair.prototype.getDistance = function() {
    return Math.sqrt(Math.pow(this._floater.midX - this._anchor.midX, 2) + Math.pow(this._floater.midY - this._anchor.midY, 2));
  };

  Pair.prototype.getDistanceSquared = function() {
    return Math.pow(this._floater.midX - this._anchor.midX, 2) + Math.pow(this._floater.midY - this._anchor.midY, 2);
  };

  Pair.prototype.setDistance = function(newDistance) {
    var distanceDiffRatio, newXOffset, newYOffset, oldXOffset, oldYOffset;
    distanceDiffRatio = newDistance / Math.sqrt(this._dSquared);
    oldXOffset = this._floater.midX - this._anchor.midX;
    newXOffset = oldXOffset * distanceDiffRatio;
    this._floater.midX = this._anchor.midX + newXOffset;
    oldYOffset = this._floater.midY - this._anchor.midY;
    newYOffset = oldYOffset * distanceDiffRatio;
    return this._floater.midY = this._anchor.midY + newYOffset;
  };

  Pair.prototype.midpoint = function() {
    return [(this._anchor.midX + this._floater.midX) / 2.0, (this._anchor.midY + this._floater.midY) / 2.0];
  };

  Pair.prototype.hitTest = function() {
    var r1, r2;
    r1 = this._anchor;
    r2 = this._floater;
    return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
  };

  Pair.prototype.enableDragAndDrop = function() {
    this._dragAndDropEnabled = true;
    this._previousDraggability = this._floater.draggable.enabled;
    this._floater.draggable.enabled = true;
    this._previousCursor = this._floater.style.cursor;
    this._floater.style.cursor = "-webkit-grab";
    this._hoveredNode = void 0;
    this._anchorPreviouslyIgnoredEvents = this._anchor.ignoreEvents;
    this._anchor.ignoreEvents = false;
    this._floater.on(Events.MouseDown, this._floatMouseDown);
    this._floater.on(Events.MouseUp, this._floatMouseUp);
    this._floater.on(Events.MouseMove, this._floatMoveHandler);
    this._floater.on(Events.MouseOver, this._floatOver);
    this._floater.on(Events.DragStart, this._dragStartHandler);
    this._floater.on(Events.DragMove, this._dragHandler);
    return this._floater.on(Events.DragEnd, this._dragEndHandler);
  };

  Pair.prototype.disableDragAndDrop = function() {
    this._dragging = false;
    this._dragAndDropEnabled = false;
    this._floater.draggable.enabled = false;
    this._floater.style.cursor = this._previousCursor;
    this._anchor.ignoreEvents = this._anchorPreviouslyIgnoredEvents;
    this._floater.off(Events.MouseDown, this._floatMouseDown);
    this._floater.off(Events.MouseUp, this._floatMouseUp);
    this._floater.off(Events.MouseMove, this._floatMoveHandler);
    this._floater.off(Events.MouseOver, this._floatOver);
    this._floater.off(Events.DragStart, this._dragStartHandler);
    this._floater.off(Events.DragMove, this._dragHandler);
    return this._floater.off(Events.DragEnd, this._dragEndHandler);
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
    count = this._rangeListeners.push({
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
    return this._rangeListeners[index] = null;
  };

  Pair.prototype.onContactChange = function(startFn, endFn) {
    var count;
    if (endFn == null) {
      endFn = function() {};
    }
    count = (this._collisionListeners.push({
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
    return this._collisionListeners[index] = null;
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


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2lhbmJlbGxvbXkvR2l0SHViL1BhaXIvZXhhbXBsZXMvMDNfY29udGFjdEV2ZW50LXVwZGF0ZS5mcmFtZXIvbW9kdWxlcy9QYWlyLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIyMjXG5cblx0UGFpciBtb2R1bGVcblxuXHRTZWUgcmVhZG1lLm1kXG5cblx04oCUIElhbiBCZWxsb215LCAyMDE3XG5cdFxuIyMjXG5cbmNsYXNzIGV4cG9ydHMuUGFpciBleHRlbmRzIEZyYW1lci5FdmVudEVtaXR0ZXJcblxuXHQjIHN0YXRpYyBwcm9wZXJ0aWVzXG5cblx0QGRyYWdnZWRJdGVtczpbXVx0XHRcblx0XG5cblx0Y29uc3RydWN0b3I6IChAX2Zsb2F0ZXIsIEBfYW5jaG9yKSAtPlx0XHRcblxuXHRcdCMgdmFsaWRhdGVcblx0XHRpZiAhKEBfZmxvYXRlciBpbnN0YW5jZW9mIEZyYW1lci5MYXllcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIExheWVyLlwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdGlmICEoQF9hbmNob3IgaW5zdGFuY2VvZiBGcmFtZXIuTGF5ZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIHNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGEgTGF5ZXIuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0aWYgQF9mbG9hdGVyLnBhcmVudCAhPSBAX2FuY2hvci5wYXJlbnRcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgZmlyc3QgYW5kIHNlY29uZCBhcmd1bWVudHMgbXVzdCBoYXZlIHRoZSBzYW1lIHBhcmVudC5cIlxuXHRcdFx0cmV0dXJuXG5cblx0XHQjICdwcml2YXRlJyBwcm9wZXJ0aWVzXHRcdFxuXHRcdEBfZHJhZ0FuZERyb3BFbmFibGVkIFx0ID0gZmFsc2Vcblx0XHRAX2FuY2hvclByZXZpb3VzbHlJZ25vcmVkRXZlbnRzID0gQF9hbmNob3IuaWdub3JlRXZlbnRzXG5cdFx0QF9ob3ZlcmVkTm9kZSBcdFx0XHQ9IHVuZGVmaW5lZFxuXHRcdEBfaXNPdmVyQW5jaG9yXHRcdFx0PSBmYWxzZVx0XHRcdCMgYXJlIHdlIG92ZXIgdGhpcyBhbmNob3Jcblx0XHRAX2RyYWdnaW5nIFx0XHRcdFx0PSBmYWxzZVxuXHRcdEBfdmFsaWREcmFnVGFyZ2V0IFx0XHQ9IGZhbHNlXHRcdFx0IyBhcmUgd2Ugb3ZlciBhbnkgdmFsaWQgYW5jaG9yIC8gZHJvcCB0YXJnZXRcblx0XHRAX3ByZXZpb3VzQ3Vyc29yIFx0XHQ9IEBfZmxvYXRlci5zdHlsZS5jdXJzb3Jcblx0XHRAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5IFx0PSBmYWxzZVxuXHRcdEBfcmFuZ2VMaXN0ZW5lcnMgXHRcdD0gW11cdFx0XG5cdFx0QF9jb2xsaXNpb25MaXN0ZW5lcnMgXHQ9IFtdXHRcblx0XHRAX3RlbXBSYW5nZSBcdFx0XHQ9IHVuZGVmaW5lZFxuXHRcdEBfY29udGFpbmVkIFx0XHRcdD0gZmFsc2Vcblx0XHRAX3RlbXBMaXN0ZW5lciBcdFx0XHQ9IHt9XHRcdFxuXHRcdEBfZFNxdWFyZWQgPSBAZ2V0RGlzdGFuY2VTcXVhcmVkKClcblx0XHRcblx0XHQjIFdlIHdhbnQgdGhlc2UgZXZlbnQgaGFuZGxlciBtZXRob2RzIHRvIGJlIHNjb3BlZCB0byB0aGUgUGFpciBpbnN0YW5jZSB3aGVuIHRoZXkgcnVuLCBzbyB0aGV5J3JlIGhlcmVcblx0XHRAX2Zsb2F0TW91c2VEb3duID0gKGV2ZW50LGxheWVyKT0+XG5cdFx0XHRAX3BhdXNlRXZlbnQoZXZlbnQpXG5cdFx0XHRAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCItd2Via2l0LWdyYWJiaW5nXCJcblx0XHRcblx0XHRAX2Zsb2F0TW91c2VVcCA9IChldmVudCxsYXllcik9PlxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFx0QF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiXCJcblx0XHRcdFxuXHRcdEBfZmxvYXRPdmVyID0gKGV2ZW50LGxheWVyKSA9Plx0XHRcdFxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFxuXHRcdEBfZHJhZ1N0YXJ0SGFuZGxlcj0gKGV2ZW50LGxheWVyKSA9Plx0XHRcdFxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVx0XHRcdFxuXHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVx0XHRcdFxuXHRcdFx0QF9kcmFnZ2luZyA9IHRydWVcblx0XHRcdFBhaXIuZHJhZ2dlZEl0ZW1zLnB1c2ggQF9mbG9hdGVyXG5cdFx0XHQjIEBfZmxvYXRlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCJcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gZmFsc2Vcblx0XHRcdEBfaG92ZXJlZE5vZGUgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXHRcdFx0XG5cdFx0XHRAX2lzT3ZlckFuY2hvciA9IEBfYW5jaG9yLl9lbGVtZW50LmNvbnRhaW5zKEBfaG92ZXJlZE5vZGUpXG5cdFx0XHRAX2Zsb2F0ZXIudmlzaWJsZSA9IHRydWVcblx0XHRcdEBlbWl0IFwiZHJhZ1N0YXJ0XCIsIEBfZmxvYXRlclxuXHRcblx0XHRAX2RyYWdIYW5kbGVyPShldmVudCkgPT5cblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcdFx0XHRcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gZmFsc2Vcblx0XHRcdG5vZGVVbmRlcm5lYXRoID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKVxuXHRcdFx0QF9mbG9hdGVyLnZpc2libGUgPSB0cnVlXG5cdFx0XHRpc05vd092ZXJBbmNob3IgPSBAX2FuY2hvci5fZWxlbWVudC5jb250YWlucyhub2RlVW5kZXJuZWF0aClcdFx0XHRcblx0XHRcdGlmIGlzTm93T3ZlckFuY2hvciBhbmQgbm90IEBfaXNPdmVyQW5jaG9yXG5cdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gdHJ1ZVx0XHRcdFx0XHRcblx0XHRcdFx0QF9pc092ZXJBbmNob3IgPSB0cnVlXG5cdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFx0XHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiZHJhZ0VudGVyXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdGVsc2UgaWYgbm90IGlzTm93T3ZlckFuY2hvciBhbmQgQF9pc092ZXJBbmNob3Jcblx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVx0XHRcdFx0XG5cdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFxuXHRcdFx0XHRAX2lzT3ZlckFuY2hvciA9IGZhbHNlXG5cdFx0XHRcdEBlbWl0IFwiZHJhZ0xlYXZlXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdGVsc2UgaWYgaXNOb3dPdmVyQW5jaG9yIGFuZCBAX2lzT3ZlckFuY2hvciBhbmQgQF92YWxpZERyYWdUYXJnZXRcblx0XHRcdFx0QGVtaXQgXCJkcmFnT3ZlclwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFxuXHRcdEBfZHJhZ0VuZEhhbmRsZXI9KGV2ZW50LCBsYXllcikgPT5cblx0XHRcdEBfZHJhZ2dpbmcgPSBmYWxzZVx0XHRcdFxuXHRcdFx0aW5kZXggPSBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIEBfZmxvYXRlclxuXHRcdFx0UGFpci5kcmFnZ2VkSXRlbXMuc3BsaWNlKGluZGV4LDEpXG5cdFx0XHRpZiBAX3ZhbGlkRHJhZ1RhcmdldFx0XHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiZHJvcFwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gZmFsc2Vcblx0XHRcdGVsc2VcdFx0XHRcblx0XHRcdFx0QGVtaXQgXCJpbnZhbGlkRHJvcFwiLCBAX2Zsb2F0ZXJcblx0XG5cdFx0XHRpZiBAaGl0VGVzdCgpXG5cdFx0XHRcdEBlbWl0IFwiY29udGFjdERyb3BcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXHRcdFx0ZWxzZSBcblx0XHRcdFx0QGVtaXQgXCJpbnZhbGlkQ29udGFjdERyb3BcIiwgQF9mbG9hdGVyXG5cdFx0XHRcdFxuXHRcdEBfZmxvYXRNb3ZlSGFuZGxlciA9IChldmVudCxsYXllcikgPT5cblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcblx0XHRcdFxuIyBcdFx0QF9hbmNob3JNb3VzZU92ZXI9KGV2ZW50LGxheWVyKT0+XG4jIFx0XHRcdGlmIEBfZHJhZ2dpbmcgIFxuIyBcdFx0XHRcdG5vZGVVbmRlcm5lYXRoID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKVxuIyBcdFx0XHRcdGlmIFBhaXIuZHJhZ2dlZEl0ZW1zLmluZGV4T2YgQF9mbG9hdGVyIGlzbnQgLTEgYW5kIEBfaG92ZXJlZE5vZGUgIT0gbm9kZVVuZGVybmVhdGhcbiMgXHRcdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gdHJ1ZVxuIyBcdFx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IG5vZGVVbmRlcm5lYXRoXG4jIFx0XHRcdFx0XHRwcmludCBcIm5ldyBub2RlP1wiXG4jIFx0XHRcdFx0XHRwcmludCBAX2hvdmVyZWROb2RlID09IG5vZGVVbmRlcm5lYXRoXG4jIFx0XHRcdFx0XHRAZW1pdCBcImRyYWdFbnRlclwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG4jIFx0XHRcdFx0XHRcbiMgXHRcbiMgXHRcdEBfYW5jaG9yTW91c2VPdXQ9KGV2ZW50LGxheWVyKT0+XHRcdFxuIyBcdFx0XHRAX3BhdXNlRXZlbnQoZXZlbnQpXG4jIFx0XHRcdGlmIEBfZHJhZ2dpbmcgXG4jIFx0XHRcdFx0aWYgUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBAX2Zsb2F0ZXIgaXNudCAtMVxuIyBcdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuIyBcdFx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcbiMgXHRcdFx0XHRcdEBlbWl0IFwiZHJhZ0xlYXZlXCIsIEBfZmxvYXRlciwgQF9hbmNob3JcblxuXHRcdFxuXHRcdCMgcmVhZHkhXG5cdFx0QHdha2UoKVxuXHRcdFxuXHRcdCNcblx0XHQjIGVuZCBjb25zdHJ1Y3RvclxuXHRcdCNcblx0XG5cblx0X3BhdXNlRXZlbnQ6KGV2ZW50KS0+XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0ZXZlbnQuY2FuY2VsQnViYmxlPXRydWVcblx0XHRldmVudC5yZXR1cm5WYWx1ZT1mYWxzZVxuXHRcdFxuXHQjc2hvdWxkIG11bHRpcGxlIFBhaXJzIGJlIGhhbmRsZWQgaW4gdGhlIHNhbWUgbGlzdGVuZXI/XG5cdGxvb3BMaXN0ZW5lcjogPT5cblx0XHRAX2RTcXVhcmVkID0gQGdldERpc3RhbmNlU3F1YXJlZCgpXG5cdFx0Zm9yIEBfdGVtcFJhbmdlIGluIEBfcmFuZ2VMaXN0ZW5lcnMgIFxuXHRcdFx0QF9jb250YWluZWQgPSBAX3RlbXBSYW5nZS5taW5TcXVhcmVkIDw9IEBfZFNxdWFyZWQgPD0gQF90ZW1wUmFuZ2UubWF4U3F1YXJlZCBcblx0XHRcdGlmIEBfY29udGFpbmVkIGFuZCBub3QgQF90ZW1wUmFuZ2UuZW50ZXJlZCBcblx0XHRcdFx0QF90ZW1wUmFuZ2UuZW50ZXJlZCA9IHRydWVcblx0XHRcdFx0QF90ZW1wUmFuZ2UuZW50ZXJDYWxsYmFjay5hcHBseSBAXG5cdFx0XHRcdFxuXHRcdFx0ZWxzZSBpZiBub3QgQF9jb250YWluZWQgYW5kIEBfdGVtcFJhbmdlLmVudGVyZWRcblx0XHRcdFx0QF90ZW1wUmFuZ2UuZW50ZXJlZCA9IGZhbHNlXG5cdFx0XHRcdEBfdGVtcFJhbmdlLmV4aXRDYWxsYmFjay5hcHBseSBAXHRcdFx0XG5cblx0XHRpZiBAaGl0VGVzdCgpXG5cdFx0XHRmb3IgQF90ZW1wTGlzdGVuZXIgaW4gQF9jb2xsaXNpb25MaXN0ZW5lcnNcblx0XHRcdFx0QF90ZW1wTGlzdGVuZXIuY29udGFjdCsrIHx8IEBfdGVtcExpc3RlbmVyLmNvbnRhY3RTdGFydChAX2Zsb2F0ZXIsQF9hbmNob3IpXG5cdFx0XHRcdFxuXHRcdGVsc2Vcblx0XHRcdGZvciBAX3RlbXBMaXN0ZW5lciBpbiBAX2NvbGxpc2lvbkxpc3RlbmVyc1xuXHRcdFx0XHRpZihAX3RlbXBMaXN0ZW5lci5jb250YWN0KVxuXHRcdFx0XHRcdEBfdGVtcExpc3RlbmVyLmNvbnRhY3QgPSBmYWxzZVxuXHRcdFx0XHRcdEBfdGVtcExpc3RlbmVyLmNvbnRhY3RFbmQoQF9mbG9hdGVyLEBfYW5jaG9yKVxuXG5cdFx0XHRcblx0XG5cdGdldERpc3RhbmNlOiAtPlxuXHRcdHJldHVybiBNYXRoLnNxcnQoKEBfZmxvYXRlci5taWRYLUBfYW5jaG9yLm1pZFgpKioyICsgKEBfZmxvYXRlci5taWRZLUBfYW5jaG9yLm1pZFkpKioyKVxuXHRcblx0Z2V0RGlzdGFuY2VTcXVhcmVkOiAtPlxuXHRcdHJldHVybiAoQF9mbG9hdGVyLm1pZFgtQF9hbmNob3IubWlkWCkqKjIgKyAoQF9mbG9hdGVyLm1pZFktQF9hbmNob3IubWlkWSkqKjJcblx0XG5cdHNldERpc3RhbmNlOihuZXdEaXN0YW5jZSktPlxuXHRcdGRpc3RhbmNlRGlmZlJhdGlvID0gbmV3RGlzdGFuY2UvIE1hdGguc3FydChAX2RTcXVhcmVkKVxuXG5cdFx0b2xkWE9mZnNldCA9IEBfZmxvYXRlci5taWRYIC0gQF9hbmNob3IubWlkWFxuXHRcdG5ld1hPZmZzZXQgPSBvbGRYT2Zmc2V0ICogZGlzdGFuY2VEaWZmUmF0aW9cblx0XHRAX2Zsb2F0ZXIubWlkWCA9IEBfYW5jaG9yLm1pZFggKyBuZXdYT2Zmc2V0XG5cblx0XHRvbGRZT2Zmc2V0ID0gQF9mbG9hdGVyLm1pZFkgLSBAX2FuY2hvci5taWRZXG5cdFx0bmV3WU9mZnNldCA9IG9sZFlPZmZzZXQgKiBkaXN0YW5jZURpZmZSYXRpb1xuXHRcdEBfZmxvYXRlci5taWRZID0gQF9hbmNob3IubWlkWSArIG5ld1lPZmZzZXRcblxuXHRcblx0IyB0aGUgY28tb3JkaW5hdGVzIGJldHdlZW4gdGhlIGFuY2hvciBhbmQgZmxvYXRlclxuXHRtaWRwb2ludDogLT5cblx0XHRyZXR1cm4gWyhAX2FuY2hvci5taWRYICsgQF9mbG9hdGVyLm1pZFgpLzIuMCwoQF9hbmNob3IubWlkWSArIEBfZmxvYXRlci5taWRZKS8yLjBdXG5cdFxuXHQjcmV0dXJucyB0cnVlIGlmIHRoZSBhbmNob3IgYW5kIGZsb2F0ZXIgZnJhbWVzIHRvdWNoXHRcdFxuXHRoaXRUZXN0Oi0+XG5cdFx0cjEgPSBAX2FuY2hvclxuXHRcdHIyID0gQF9mbG9hdGVyXG5cdFx0cmV0dXJuICEoIHIyLnggPiByMS54ICsgcjEud2lkdGggb3IgcjIueCArIHIyLndpZHRoIDwgcjEueCBvciByMi55ID4gcjEueSArIHIxLmhlaWdodCBvciByMi55ICsgcjIuaGVpZ2h0IDwgcjEueSlcblxuXHRlbmFibGVEcmFnQW5kRHJvcDotPlx0XHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IHRydWVcdFx0XG5cdFx0QF9wcmV2aW91c0RyYWdnYWJpbGl0eSA9IEBfZmxvYXRlci5kcmFnZ2FibGUuZW5hYmxlZCAjIEZJWE1FOiBCdWcgaW4gZnJhbWVyIG1ha2VzIHRoaXMgcmV0dXJuIHRydWUgaWYgYWNjZXNzZWQhXG5cdFx0QF9mbG9hdGVyLmRyYWdnYWJsZS5lbmFibGVkID0gdHJ1ZVxuXHRcdEBfcHJldmlvdXNDdXJzb3IgPSBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yXG5cdFx0QF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiXCJcblx0XHRAX2hvdmVyZWROb2RlID0gdW5kZWZpbmVkXG5cdFx0QF9hbmNob3JQcmV2aW91c2x5SWdub3JlZEV2ZW50cyA9IEBfYW5jaG9yLmlnbm9yZUV2ZW50c1xuXHRcdEBfYW5jaG9yLmlnbm9yZUV2ZW50cyA9IGZhbHNlXG5cdFx0XG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZURvd24sIEBfZmxvYXRNb3VzZURvd25cblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlVXAsIEBfZmxvYXRNb3VzZVVwXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZU1vdmUsIEBfZmxvYXRNb3ZlSGFuZGxlclx0XHRcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlT3ZlciwgQF9mbG9hdE92ZXJcdFxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuRHJhZ1N0YXJ0LCBAX2RyYWdTdGFydEhhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLkRyYWdNb3ZlLCBAX2RyYWdIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5EcmFnRW5kLCBAX2RyYWdFbmRIYW5kbGVyXHRcdFxuXG5cdGRpc2FibGVEcmFnQW5kRHJvcDotPlx0XG5cdFx0QF9kcmFnZ2luZyA9IGZhbHNlXHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IGZhbHNlXHRcdFxuXHRcdEBfZmxvYXRlci5kcmFnZ2FibGUuZW5hYmxlZCA9IGZhbHNlICMgQF9wcmV2aW91c0RyYWdnYWJpbGl0eSAjIERvZXNuJ3Qgd29yayBiZWNhdXNlIGJ1ZyBpbiBmcmFtZXJcblx0XHRAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gQF9wcmV2aW91c0N1cnNvclxuXHRcdEBfYW5jaG9yLmlnbm9yZUV2ZW50cyA9IEBfYW5jaG9yUHJldmlvdXNseUlnbm9yZWRFdmVudHNcblxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLk1vdXNlRG93biwgQF9mbG9hdE1vdXNlRG93blxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLk1vdXNlVXAsIEBfZmxvYXRNb3VzZVVwXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuTW91c2VNb3ZlLCBAX2Zsb2F0TW92ZUhhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5Nb3VzZU92ZXIsIEBfZmxvYXRPdmVyXHRcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnU3RhcnQsIEBfZHJhZ1N0YXJ0SGFuZGxlclxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLkRyYWdNb3ZlLCBAX2RyYWdIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuRHJhZ0VuZCwgQF9kcmFnRW5kSGFuZGxlclx0XHRcblx0XHRcblxuXHRzbGVlcDotPlxuXHRcdEZyYW1lci5Mb29wLm9mZiBcInVwZGF0ZVwiLCBAbG9vcExpc3RlbmVyXG5cdFx0IyBkaXNhYmxlIGRyYWcgYW5kIGRyb3AsIHJlbWVtYmVyIHdoYXQgdGhlIHN0YXRlIHdhc1xuXG5cdHdha2U6LT5cblx0XHRGcmFtZXIuTG9vcC5vbiBcInVwZGF0ZVwiLCBAbG9vcExpc3RlbmVyXG5cdFx0IyB1cGRhdGUgY29udGFjdCBwcm9wZXJ0aWVzIG9mIGxpc3RlbmVycz9cblx0XHQjIGVuYWJsZWQgZHJhZyBhbmQgZHJvcCBpZiB0aGlzIHdhcyBhY3RpdmUgYmVmb3JlXG5cblx0ZGVzdHJveTotPlxuXHRcdEBkaXNhYmxlRHJhZ0FuZERyb3AoKVxuXHRcdEBzbGVlcCgpXG5cdFx0IyB0aGF0J3MgaXQhIEkgdGhpbmsuLi5cblxuXG5cdCNcblx0I1x0RXZlbnQgSGFuZGxpbmdcblx0I1xuXG5cdCNyZXR1cm5zIGFuIGluZGV4XG5cdG9uUmFuZ2VDaGFuZ2U6IChtaW4sbWF4LGVudGVyRm4sZXhpdEZuID0gLT4pIC0+XG5cdFx0Y291bnQgPSBAX3JhbmdlTGlzdGVuZXJzLnB1c2hcblx0XHRcdG1pbjptaW5cblx0XHRcdG1heDptYXhcblx0XHRcdG1pblNxdWFyZWQ6IG1pbioqMlxuXHRcdFx0bWF4U3F1YXJlZDogbWF4KioyXG5cdFx0XHRlbnRlckNhbGxiYWNrOiBlbnRlckZuXG5cdFx0XHRleGl0Q2FsbGJhY2s6IGV4aXRGblxuXHRcdFx0ZW50ZXJlZDpmYWxzZVxuXHRcdFxuXHRcdHJldHVybiBjb3VudCAtIDFcblxuXG5cdG9mZlJhbmdlQ2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0aWYgIShpbmRleCBpbnN0YW5jZW9mIE51bWJlcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyOm9mZlJhbmdlQ2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdEBfcmFuZ2VMaXN0ZW5lcnNbaW5kZXhdID0gbnVsbFxuXG5cblx0IyBSZXR1cm5zIGluZGV4XG5cdG9uQ29udGFjdENoYW5nZTogKHN0YXJ0Rm4sZW5kRm49LT4pIC0+XHRcdFxuXHRcdGNvdW50ID0gKEBfY29sbGlzaW9uTGlzdGVuZXJzLnB1c2ggXG5cdFx0XHRjb250YWN0U3RhcnQ6c3RhcnRGblxuXHRcdFx0Y29udGFjdEVuZDplbmRGblxuXHRcdFx0Y29udGFjdDpmYWxzZSkgLSAxXHRcblxuXHRcdHJldHVybiBjb3VudFxuXG5cblx0b2ZmQ29udGFjdENoYW5nZTogKGluZGV4KSAtPlxuXHRcdGlmICEoaW5kZXggaW5zdGFuY2VvZiBOdW1iZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpcjpvZmZDb250YWN0Q2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdEBfY29sbGlzaW9uTGlzdGVuZXJzW2luZGV4XSA9IG51bGwgXHRcblxuXHQjXHRcblx0I1x0RXZlbnQgaGFuZGxpbmcgY29udmVuaWVuY2UgZnVuY3Rpb25zXG5cdCNcblxuXHRvbkRyYWdTdGFydDogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ1N0YXJ0XCIsIGZuXG5cblx0b25EcmFnRW50ZXI6IChmbiktPlxuXHRcdEBvbiBcImRyYWdFbnRlclwiLCBmblxuXG5cdG9uRHJhZ092ZXI6IChmbiktPlxuXHRcdEBvbiBcImRyYWdPdmVyXCIsIGZuXG5cblx0b25EcmFnTGVhdmU6IChmbiktPlxuXHRcdEBvbiBcImRyYWdMZWF2ZVwiLCBmblxuXG5cdG9uSW52YWxpZERyb3A6IChmbiktPlxuXHRcdEBvbiBcImludmFsaWREcm9wXCIsIGZuXG5cblx0b25Ecm9wOiAoZm4pLT5cblx0XHRAb24gXCJkcm9wXCIsIGZuXG5cblx0b25Db250YWN0RHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiY29udGFjdERyb3BcIiwgZm5cblxuXHRvbkludmFsaWRDb250YWN0RHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiaW52YWxpZENvbnRhY3REcm9wXCIsIGZuXG4iLCIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUNBQTs7QURBQTs7Ozs7Ozs7QUFBQSxJQUFBOzs7O0FBVU0sT0FBTyxDQUFDOzs7RUFJYixJQUFDLENBQUEsWUFBRCxHQUFjOztFQUdELGNBQUMsUUFBRCxFQUFZLE9BQVo7SUFBQyxJQUFDLENBQUEsV0FBRDtJQUFX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
