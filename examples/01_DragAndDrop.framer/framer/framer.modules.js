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
    this._px = 0;
    this._py = 0;
    this._dSquared = this.getDistanceSquared();
    this._floatMouseDown = (function(_this) {
      return function(event, layer) {
        _this._pauseEvent(event);
        return _this._floater.style.cursor = "-webkit-grabbing";
      };
    })(this);
    this._floatMouseUp = (function(_this) {
      return function(event, layer) {
        return _this._pauseEvent(event);
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
        _this._px = event.clientX;
        _this._py = event.clientY;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2lhbmJlbGxvbXkvR2l0SHViL1BhaXIvZXhhbXBsZXMvMDFfZHJhZ0FuZERyb3AuZnJhbWVyL21vZHVsZXMvUGFpci5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiMjI1xuXG5cdFBhaXIgbW9kdWxlXG5cblx0U2VlIHJlYWRtZS5tZFxuXG5cdOKAlCBJYW4gQmVsbG9teSwgMjAxN1xuXHRcbiMjI1xuXG5jbGFzcyBleHBvcnRzLlBhaXIgZXh0ZW5kcyBGcmFtZXIuRXZlbnRFbWl0dGVyXG5cblx0IyBzdGF0aWMgcHJvcGVydGllc1xuXG5cdEBkcmFnZ2VkSXRlbXM6W11cdFx0XG5cdFxuXG5cdGNvbnN0cnVjdG9yOiAoQF9mbG9hdGVyLCBAX2FuY2hvcikgLT5cdFx0XG5cblx0XHQjIHZhbGlkYXRlXG5cdFx0aWYgIShAX2Zsb2F0ZXIgaW5zdGFuY2VvZiBGcmFtZXIuTGF5ZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBMYXllci5cIlxuXHRcdFx0cmV0dXJuXG5cblx0XHRpZiAhKEBfYW5jaG9yIGluc3RhbmNlb2YgRnJhbWVyLkxheWVyKVxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXIgbW9kdWxlOlBhaXI6Y29uc3RydWN0b3IsICBzZWNvbmQgYXJndW1lbnQgbXVzdCBiZSBhIExheWVyLlwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdGlmIEBfZmxvYXRlci5wYXJlbnQgIT0gQF9hbmNob3IucGFyZW50XG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIGZpcnN0IGFuZCBzZWNvbmQgYXJndW1lbnRzIG11c3QgaGF2ZSB0aGUgc2FtZSBwYXJlbnQuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0IyAncHJpdmF0ZScgcHJvcGVydGllc1x0XHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCBcdCA9IGZhbHNlXG5cdFx0QF9hbmNob3JQcmV2aW91c2x5SWdub3JlZEV2ZW50cyA9IEBfYW5jaG9yLmlnbm9yZUV2ZW50c1xuXHRcdEBfaG92ZXJlZE5vZGUgXHRcdFx0PSB1bmRlZmluZWRcblx0XHRAX2lzT3ZlckFuY2hvclx0XHRcdD0gZmFsc2VcdFx0XHQjIGFyZSB3ZSBvdmVyIHRoaXMgYW5jaG9yXG5cdFx0QF9kcmFnZ2luZyBcdFx0XHRcdD0gZmFsc2Vcblx0XHRAX3ZhbGlkRHJhZ1RhcmdldCBcdFx0PSBmYWxzZVx0XHRcdCMgYXJlIHdlIG92ZXIgYW55IHZhbGlkIGFuY2hvciAvIGRyb3AgdGFyZ2V0XG5cdFx0QF9wcmV2aW91c0N1cnNvciBcdFx0PSBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yXG5cdFx0QF9wcmV2aW91c0RyYWdnYWJpbGl0eSBcdD0gZmFsc2Vcblx0XHRAX3JhbmdlTGlzdGVuZXJzIFx0XHQ9IFtdXHRcdFxuXHRcdEBfY29sbGlzaW9uTGlzdGVuZXJzIFx0PSBbXVx0XG5cdFx0QF90ZW1wUmFuZ2UgXHRcdFx0PSB1bmRlZmluZWRcblx0XHRAX2NvbnRhaW5lZCBcdFx0XHQ9IGZhbHNlXG5cdFx0QF90ZW1wTGlzdGVuZXIgXHRcdFx0PSB7fVx0XHRcblx0XHRAX3B4XHRcdFx0XHRcdD0gMFxuXHRcdEBfcHkgXHRcdFx0XHRcdD0gMFxuXHRcdEBfZFNxdWFyZWQgPSBAZ2V0RGlzdGFuY2VTcXVhcmVkKClcblx0XHRcblx0XHQjIFdlIHdhbnQgdGhlc2UgZXZlbnQgaGFuZGxlciBtZXRob2RzIHRvIGJlIHNjb3BlZCB0byB0aGUgUGFpciBpbnN0YW5jZSB3aGVuIHRoZXkgcnVuLCBzbyB0aGV5J3JlIGhlcmVcblx0XHRAX2Zsb2F0TW91c2VEb3duID0gKGV2ZW50LGxheWVyKT0+XG5cdFx0XHRAX3BhdXNlRXZlbnQoZXZlbnQpXG5cdFx0XHRAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCItd2Via2l0LWdyYWJiaW5nXCJcblx0XHRcblx0XHRAX2Zsb2F0TW91c2VVcCA9IChldmVudCxsYXllcik9Plx0XHRcdFxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFx0IyBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCJ3YWl0XCJcblx0XHRcdCMgQF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiXCJcblx0XHRcdFxuXHRcdEBfZmxvYXRPdmVyID0gKGV2ZW50LGxheWVyKSA9Plx0XHRcdFxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFxuXHRcdEBfZHJhZ1N0YXJ0SGFuZGxlcj0gKGV2ZW50LGxheWVyKSA9Plx0XHRcdFxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVx0XHRcdFxuXHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVx0XHRcdFxuXHRcdFx0QF9kcmFnZ2luZyA9IHRydWVcblx0XHRcdFBhaXIuZHJhZ2dlZEl0ZW1zLnB1c2ggQF9mbG9hdGVyXG5cdFx0XHQjIEBfZmxvYXRlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCJcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gZmFsc2Vcblx0XHRcdEBfaG92ZXJlZE5vZGUgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXHRcdFx0XG5cdFx0XHRAX2lzT3ZlckFuY2hvciA9IEBfYW5jaG9yLl9lbGVtZW50LmNvbnRhaW5zKEBfaG92ZXJlZE5vZGUpXG5cdFx0XHRAX2Zsb2F0ZXIudmlzaWJsZSA9IHRydWVcblx0XHRcdEBlbWl0IFwiZHJhZ1N0YXJ0XCIsIEBfZmxvYXRlclxuXHRcblx0XHRAX2RyYWdIYW5kbGVyPShldmVudCkgPT5cblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcdFx0XHRcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gZmFsc2Vcblx0XHRcdEBfcHggPSBldmVudC5jbGllbnRYXG5cdFx0XHRAX3B5ID0gZXZlbnQuY2xpZW50WVxuXHRcdFx0bm9kZVVuZGVybmVhdGggPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXG5cdFx0XHRAX2Zsb2F0ZXIudmlzaWJsZSA9IHRydWVcblx0XHRcdGlzTm93T3ZlckFuY2hvciA9IEBfYW5jaG9yLl9lbGVtZW50LmNvbnRhaW5zKG5vZGVVbmRlcm5lYXRoKVx0XHRcdFxuXHRcdFx0aWYgaXNOb3dPdmVyQW5jaG9yIGFuZCBub3QgQF9pc092ZXJBbmNob3Jcblx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSB0cnVlXHRcdFx0XHRcdFxuXHRcdFx0XHRAX2lzT3ZlckFuY2hvciA9IHRydWVcblx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IG5vZGVVbmRlcm5lYXRoXHRcdFx0XHRcblx0XHRcdFx0QGVtaXQgXCJkcmFnRW50ZXJcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXHRcdFx0ZWxzZSBpZiBub3QgaXNOb3dPdmVyQW5jaG9yIGFuZCBAX2lzT3ZlckFuY2hvclxuXHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXHRcdFx0XHRcblx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IG5vZGVVbmRlcm5lYXRoXG5cdFx0XHRcdEBfaXNPdmVyQW5jaG9yID0gZmFsc2Vcblx0XHRcdFx0QGVtaXQgXCJkcmFnTGVhdmVcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXHRcdFx0ZWxzZSBpZiBpc05vd092ZXJBbmNob3IgYW5kIEBfaXNPdmVyQW5jaG9yIGFuZCBAX3ZhbGlkRHJhZ1RhcmdldFxuXHRcdFx0XHRAZW1pdCBcImRyYWdPdmVyXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XG5cdFx0QF9kcmFnRW5kSGFuZGxlcj0oZXZlbnQsIGxheWVyKSA9PlxuXHRcdFx0QF9kcmFnZ2luZyA9IGZhbHNlXHRcdFx0XG5cdFx0XHRpbmRleCA9IFBhaXIuZHJhZ2dlZEl0ZW1zLmluZGV4T2YgQF9mbG9hdGVyXG5cdFx0XHRQYWlyLmRyYWdnZWRJdGVtcy5zcGxpY2UoaW5kZXgsMSlcblx0XHRcdGlmIEBfdmFsaWREcmFnVGFyZ2V0XHRcdFx0XHRcblx0XHRcdFx0QGVtaXQgXCJkcm9wXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuXHRcdFx0ZWxzZVx0XHRcdFxuXHRcdFx0XHRAZW1pdCBcImludmFsaWREcm9wXCIsIEBfZmxvYXRlclxuXHRcblx0XHRcdGlmIEBoaXRUZXN0KClcblx0XHRcdFx0QGVtaXQgXCJjb250YWN0RHJvcFwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFx0XHRlbHNlIFxuXHRcdFx0XHRAZW1pdCBcImludmFsaWRDb250YWN0RHJvcFwiLCBAX2Zsb2F0ZXJcblx0XHRcdFx0XG5cdFx0QF9mbG9hdE1vdmVIYW5kbGVyID0gKGV2ZW50LGxheWVyKSA9PlxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFx0XG4jIFx0XHRAX2FuY2hvck1vdXNlT3Zlcj0oZXZlbnQsbGF5ZXIpPT5cbiMgXHRcdFx0aWYgQF9kcmFnZ2luZyAgXG4jIFx0XHRcdFx0bm9kZVVuZGVybmVhdGggPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXG4jIFx0XHRcdFx0aWYgUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBAX2Zsb2F0ZXIgaXNudCAtMSBhbmQgQF9ob3ZlcmVkTm9kZSAhPSBub2RlVW5kZXJuZWF0aFxuIyBcdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSB0cnVlXG4jIFx0XHRcdFx0XHRAX2hvdmVyZWROb2RlID0gbm9kZVVuZGVybmVhdGhcbiMgXHRcdFx0XHRcdHByaW50IFwibmV3IG5vZGU/XCJcbiMgXHRcdFx0XHRcdHByaW50IEBfaG92ZXJlZE5vZGUgPT0gbm9kZVVuZGVybmVhdGhcbiMgXHRcdFx0XHRcdEBlbWl0IFwiZHJhZ0VudGVyXCIsIEBfZmxvYXRlciwgQF9hbmNob3JcbiMgXHRcdFx0XHRcdFxuIyBcdFxuIyBcdFx0QF9hbmNob3JNb3VzZU91dD0oZXZlbnQsbGF5ZXIpPT5cdFx0XG4jIFx0XHRcdEBfcGF1c2VFdmVudChldmVudClcbiMgXHRcdFx0aWYgQF9kcmFnZ2luZyBcbiMgXHRcdFx0XHRpZiBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIEBfZmxvYXRlciBpc250IC0xXG4jIFx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXG4jIFx0XHRcdFx0XHRAX2hvdmVyZWROb2RlID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKVxuIyBcdFx0XHRcdFx0QGVtaXQgXCJkcmFnTGVhdmVcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXG5cdFx0XG5cdFx0IyByZWFkeSFcblx0XHRAd2FrZSgpXG5cdFx0XG5cdFx0I1xuXHRcdCMgZW5kIGNvbnN0cnVjdG9yXG5cdFx0I1xuXHRcblxuXHRfcGF1c2VFdmVudDooZXZlbnQpLT5cblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRldmVudC5jYW5jZWxCdWJibGU9dHJ1ZVxuXHRcdGV2ZW50LnJldHVyblZhbHVlPWZhbHNlXG5cdFx0XG5cdCNzaG91bGQgbXVsdGlwbGUgUGFpcnMgYmUgaGFuZGxlZCBpbiB0aGUgc2FtZSBsaXN0ZW5lcj9cblx0bG9vcExpc3RlbmVyOiA9PlxuXHRcdEBfZFNxdWFyZWQgPSBAZ2V0RGlzdGFuY2VTcXVhcmVkKClcblx0XHRmb3IgQF90ZW1wUmFuZ2UgaW4gQF9yYW5nZUxpc3RlbmVycyAgXG5cdFx0XHRAX2NvbnRhaW5lZCA9IEBfdGVtcFJhbmdlLm1pblNxdWFyZWQgPD0gQF9kU3F1YXJlZCA8PSBAX3RlbXBSYW5nZS5tYXhTcXVhcmVkIFxuXHRcdFx0aWYgQF9jb250YWluZWQgYW5kIG5vdCBAX3RlbXBSYW5nZS5lbnRlcmVkIFxuXHRcdFx0XHRAX3RlbXBSYW5nZS5lbnRlcmVkID0gdHJ1ZVxuXHRcdFx0XHRAX3RlbXBSYW5nZS5lbnRlckNhbGxiYWNrLmFwcGx5IEBcblx0XHRcdFx0XG5cdFx0XHRlbHNlIGlmIG5vdCBAX2NvbnRhaW5lZCBhbmQgQF90ZW1wUmFuZ2UuZW50ZXJlZFxuXHRcdFx0XHRAX3RlbXBSYW5nZS5lbnRlcmVkID0gZmFsc2Vcblx0XHRcdFx0QF90ZW1wUmFuZ2UuZXhpdENhbGxiYWNrLmFwcGx5IEBcdFx0XHRcblxuXHRcdGlmIEBoaXRUZXN0KClcblx0XHRcdGZvciBAX3RlbXBMaXN0ZW5lciBpbiBAX2NvbGxpc2lvbkxpc3RlbmVyc1xuXHRcdFx0XHRAX3RlbXBMaXN0ZW5lci5jb250YWN0KysgfHwgQF90ZW1wTGlzdGVuZXIuY29udGFjdFN0YXJ0KEBfZmxvYXRlcixAX2FuY2hvcilcblx0XHRcdFx0XG5cdFx0ZWxzZVxuXHRcdFx0Zm9yIEBfdGVtcExpc3RlbmVyIGluIEBfY29sbGlzaW9uTGlzdGVuZXJzXG5cdFx0XHRcdGlmKEBfdGVtcExpc3RlbmVyLmNvbnRhY3QpXG5cdFx0XHRcdFx0QF90ZW1wTGlzdGVuZXIuY29udGFjdCA9IGZhbHNlXG5cdFx0XHRcdFx0QF90ZW1wTGlzdGVuZXIuY29udGFjdEVuZChAX2Zsb2F0ZXIsQF9hbmNob3IpXG5cdFx0XG5cdFx0IyBub2RlVW5kZXJuZWF0aCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoQF9weCwgQF9weSlcblx0XHQjIGlmICFAX2Zsb2F0ZXIuX2VsZW1lbnQuY29udGFpbnMobm9kZVVuZGVybmVhdGgpIGFuZCBAX2RyYWdnaW5nXG5cdFx0IyBcdHByaW50IEBfZHJhZ2dpbmdcblx0XHRcdFxuXHRcdCMgXHQjIEZyYW1lci5EZXZpY2Uuc2NyZWVuLnN0eWxlLmN1cnNvciA9IFwid2FpdFwiXG5cdFx0IyBcdHByaW50IFwib3V0XCJcblx0XHQjIGVsc2Vcblx0XHQjIFx0cHJpbnQgXCJpblwiXHRcdFx0XG5cdFx0IyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoQGxvb3BMaXN0ZW5lcilcblx0XG5cdGdldERpc3RhbmNlOiAtPlxuXHRcdHJldHVybiBNYXRoLnNxcnQoKEBfZmxvYXRlci5taWRYLUBfYW5jaG9yLm1pZFgpKioyICsgKEBfZmxvYXRlci5taWRZLUBfYW5jaG9yLm1pZFkpKioyKVxuXHRcblx0Z2V0RGlzdGFuY2VTcXVhcmVkOiAtPlxuXHRcdHJldHVybiAoQF9mbG9hdGVyLm1pZFgtQF9hbmNob3IubWlkWCkqKjIgKyAoQF9mbG9hdGVyLm1pZFktQF9hbmNob3IubWlkWSkqKjJcblx0XG5cdHNldERpc3RhbmNlOihuZXdEaXN0YW5jZSktPlxuXHRcdGRpc3RhbmNlRGlmZlJhdGlvID0gbmV3RGlzdGFuY2UvIE1hdGguc3FydChAX2RTcXVhcmVkKVxuXG5cdFx0b2xkWE9mZnNldCA9IEBfZmxvYXRlci5taWRYIC0gQF9hbmNob3IubWlkWFxuXHRcdG5ld1hPZmZzZXQgPSBvbGRYT2Zmc2V0ICogZGlzdGFuY2VEaWZmUmF0aW9cblx0XHRAX2Zsb2F0ZXIubWlkWCA9IEBfYW5jaG9yLm1pZFggKyBuZXdYT2Zmc2V0XG5cblx0XHRvbGRZT2Zmc2V0ID0gQF9mbG9hdGVyLm1pZFkgLSBAX2FuY2hvci5taWRZXG5cdFx0bmV3WU9mZnNldCA9IG9sZFlPZmZzZXQgKiBkaXN0YW5jZURpZmZSYXRpb1xuXHRcdEBfZmxvYXRlci5taWRZID0gQF9hbmNob3IubWlkWSArIG5ld1lPZmZzZXRcblxuXHRcblx0IyB0aGUgY28tb3JkaW5hdGVzIGJldHdlZW4gdGhlIGFuY2hvciBhbmQgZmxvYXRlclxuXHRtaWRwb2ludDogLT5cblx0XHRyZXR1cm4gWyhAX2FuY2hvci5taWRYICsgQF9mbG9hdGVyLm1pZFgpLzIuMCwoQF9hbmNob3IubWlkWSArIEBfZmxvYXRlci5taWRZKS8yLjBdXG5cdFxuXHQjcmV0dXJucyB0cnVlIGlmIHRoZSBhbmNob3IgYW5kIGZsb2F0ZXIgZnJhbWVzIHRvdWNoXHRcdFxuXHRoaXRUZXN0Oi0+XG5cdFx0cjEgPSBAX2FuY2hvclxuXHRcdHIyID0gQF9mbG9hdGVyXG5cdFx0cmV0dXJuICEoIHIyLnggPiByMS54ICsgcjEud2lkdGggb3IgcjIueCArIHIyLndpZHRoIDwgcjEueCBvciByMi55ID4gcjEueSArIHIxLmhlaWdodCBvciByMi55ICsgcjIuaGVpZ2h0IDwgcjEueSlcblxuXHRlbmFibGVEcmFnQW5kRHJvcDotPlx0XHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IHRydWVcdFx0XG5cdFx0QF9wcmV2aW91c0RyYWdnYWJpbGl0eSA9IEBfZmxvYXRlci5kcmFnZ2FibGUuZW5hYmxlZCAjIEZJWE1FOiBCdWcgaW4gZnJhbWVyIG1ha2VzIHRoaXMgcmV0dXJuIHRydWUgaWYgYWNjZXNzZWQhXG5cdFx0QF9mbG9hdGVyLmRyYWdnYWJsZS5lbmFibGVkID0gdHJ1ZVxuXHRcdEBfcHJldmlvdXNDdXJzb3IgPSBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yXG5cdFx0QF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiXCJcblx0XHRAX2hvdmVyZWROb2RlID0gdW5kZWZpbmVkXG5cdFx0QF9hbmNob3JQcmV2aW91c2x5SWdub3JlZEV2ZW50cyA9IEBfYW5jaG9yLmlnbm9yZUV2ZW50c1xuXHRcdEBfYW5jaG9yLmlnbm9yZUV2ZW50cyA9IGZhbHNlXG5cdFx0XG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZURvd24sIEBfZmxvYXRNb3VzZURvd25cblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlVXAsIEBfZmxvYXRNb3VzZVVwXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZU1vdmUsIEBfZmxvYXRNb3ZlSGFuZGxlclx0XHRcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlT3ZlciwgQF9mbG9hdE92ZXJcdFxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuRHJhZ1N0YXJ0LCBAX2RyYWdTdGFydEhhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLkRyYWdNb3ZlLCBAX2RyYWdIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5EcmFnRW5kLCBAX2RyYWdFbmRIYW5kbGVyXHRcdFxuXG5cdGRpc2FibGVEcmFnQW5kRHJvcDotPlx0XG5cdFx0QF9kcmFnZ2luZyA9IGZhbHNlXHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IGZhbHNlXHRcdFxuXHRcdEBfZmxvYXRlci5kcmFnZ2FibGUuZW5hYmxlZCA9IGZhbHNlICMgQF9wcmV2aW91c0RyYWdnYWJpbGl0eSAjIERvZXNuJ3Qgd29yayBiZWNhdXNlIGJ1ZyBpbiBmcmFtZXJcblx0XHRAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gQF9wcmV2aW91c0N1cnNvclxuXHRcdEBfYW5jaG9yLmlnbm9yZUV2ZW50cyA9IEBfYW5jaG9yUHJldmlvdXNseUlnbm9yZWRFdmVudHNcblxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLk1vdXNlRG93biwgQF9mbG9hdE1vdXNlRG93blxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLk1vdXNlVXAsIEBfZmxvYXRNb3VzZVVwXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuTW91c2VNb3ZlLCBAX2Zsb2F0TW92ZUhhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5Nb3VzZU92ZXIsIEBfZmxvYXRPdmVyXHRcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnU3RhcnQsIEBfZHJhZ1N0YXJ0SGFuZGxlclxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLkRyYWdNb3ZlLCBAX2RyYWdIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuRHJhZ0VuZCwgQF9kcmFnRW5kSGFuZGxlclx0XHRcblx0XHRcblxuXHRzbGVlcDotPlxuXHRcdEZyYW1lci5Mb29wLm9mZiBcInVwZGF0ZVwiLCBAbG9vcExpc3RlbmVyXG5cdFx0IyBkaXNhYmxlIGRyYWcgYW5kIGRyb3AsIHJlbWVtYmVyIHdoYXQgdGhlIHN0YXRlIHdhc1xuXG5cdHdha2U6LT5cblx0XHQjIHJlcXVlc3RBbmltYXRpb25GcmFtZShAbG9vcExpc3RlbmVyKVxuXG5cdFx0RnJhbWVyLkxvb3Aub24gXCJ1cGRhdGVcIiwgQGxvb3BMaXN0ZW5lclxuXG5cdFx0IyB1cGRhdGUgY29udGFjdCBwcm9wZXJ0aWVzIG9mIGxpc3RlbmVycz9cblx0XHQjIGVuYWJsZWQgZHJhZyBhbmQgZHJvcCBpZiB0aGlzIHdhcyBhY3RpdmUgYmVmb3JlXG5cblx0ZGVzdHJveTotPlxuXHRcdEBkaXNhYmxlRHJhZ0FuZERyb3AoKVxuXHRcdEBzbGVlcCgpXG5cdFx0IyB0aGF0J3MgaXQhIEkgdGhpbmsuLi5cblxuXG5cdCNcblx0I1x0RXZlbnQgSGFuZGxpbmdcblx0I1xuXG5cdCNyZXR1cm5zIGFuIGluZGV4XG5cdG9uUmFuZ2VDaGFuZ2U6IChtaW4sbWF4LGVudGVyRm4sZXhpdEZuID0gLT4pIC0+XG5cdFx0Y291bnQgPSBAX3JhbmdlTGlzdGVuZXJzLnB1c2hcblx0XHRcdG1pbjptaW5cblx0XHRcdG1heDptYXhcblx0XHRcdG1pblNxdWFyZWQ6IG1pbioqMlxuXHRcdFx0bWF4U3F1YXJlZDogbWF4KioyXG5cdFx0XHRlbnRlckNhbGxiYWNrOiBlbnRlckZuXG5cdFx0XHRleGl0Q2FsbGJhY2s6IGV4aXRGblxuXHRcdFx0ZW50ZXJlZDpmYWxzZVxuXHRcdFxuXHRcdHJldHVybiBjb3VudCAtIDFcblxuXG5cdG9mZlJhbmdlQ2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0aWYgIShpbmRleCBpbnN0YW5jZW9mIE51bWJlcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyOm9mZlJhbmdlQ2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdEBfcmFuZ2VMaXN0ZW5lcnNbaW5kZXhdID0gbnVsbFxuXG5cblx0IyBSZXR1cm5zIGluZGV4XG5cdG9uQ29udGFjdENoYW5nZTogKHN0YXJ0Rm4sZW5kRm49LT4pIC0+XHRcdFxuXHRcdGNvdW50ID0gKEBfY29sbGlzaW9uTGlzdGVuZXJzLnB1c2ggXG5cdFx0XHRjb250YWN0U3RhcnQ6c3RhcnRGblxuXHRcdFx0Y29udGFjdEVuZDplbmRGblxuXHRcdFx0Y29udGFjdDpmYWxzZSkgLSAxXHRcblxuXHRcdHJldHVybiBjb3VudFxuXG5cblx0b2ZmQ29udGFjdENoYW5nZTogKGluZGV4KSAtPlxuXHRcdGlmICEoaW5kZXggaW5zdGFuY2VvZiBOdW1iZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpcjpvZmZDb250YWN0Q2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdEBfY29sbGlzaW9uTGlzdGVuZXJzW2luZGV4XSA9IG51bGwgXHRcblxuXHQjXHRcblx0I1x0RXZlbnQgaGFuZGxpbmcgY29udmVuaWVuY2UgZnVuY3Rpb25zXG5cdCNcblxuXHRvbkRyYWdTdGFydDogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ1N0YXJ0XCIsIGZuXG5cblx0b25EcmFnRW50ZXI6IChmbiktPlxuXHRcdEBvbiBcImRyYWdFbnRlclwiLCBmblxuXG5cdG9uRHJhZ092ZXI6IChmbiktPlxuXHRcdEBvbiBcImRyYWdPdmVyXCIsIGZuXG5cblx0b25EcmFnTGVhdmU6IChmbiktPlxuXHRcdEBvbiBcImRyYWdMZWF2ZVwiLCBmblxuXG5cdG9uSW52YWxpZERyb3A6IChmbiktPlxuXHRcdEBvbiBcImludmFsaWREcm9wXCIsIGZuXG5cblx0b25Ecm9wOiAoZm4pLT5cblx0XHRAb24gXCJkcm9wXCIsIGZuXG5cblx0b25Db250YWN0RHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiY29udGFjdERyb3BcIiwgZm5cblxuXHRvbkludmFsaWRDb250YWN0RHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiaW52YWxpZENvbnRhY3REcm9wXCIsIGZuXG4iLCIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUNBQTs7QURBQTs7Ozs7Ozs7QUFBQSxJQUFBOzs7O0FBVU0sT0FBTyxDQUFDOzs7RUFJYixJQUFDLENBQUEsWUFBRCxHQUFjOztFQUdELGNBQUMsUUFBRCxFQUFZLE9BQVo7SUFBQyxJQUFDLENBQUEsV0FBRDtJQUFXLElBQUMsQ0FBQSxVQUFEOztJQUd4QixJQUFHLENBQUMsQ0FBQyxJQUFDLENBQUEsUUFBRCxZQUFxQixNQUFNLENBQUMsS0FBN0IsQ0FBSjtNQUNDLEtBQUEsQ0FBTSx3RUFBTjtBQUNBLGFBRkQ7O0lBSUEsSUFBRyxDQUFDLENBQUMsSUFBQyxDQUFBLE9BQUQsWUFBb0IsTUFBTSxDQUFDLEtBQTVCLENBQUo7TUFDQyxLQUFBLENBQU0seUVBQU47QUFDQSxhQUZEOztJQUlBLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEtBQW9CLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBaEM7TUFDQyxLQUFBLENBQU0sOEZBQU47QUFDQSxhQUZEOztJQUtBLElBQUMsQ0FBQSxtQkFBRCxHQUF5QjtJQUN6QixJQUFDLENBQUEsOEJBQUQsR0FBa0MsSUFBQyxDQUFBLE9BQU8sQ0FBQztJ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
