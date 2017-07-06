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
    if (Framer.Version.date < 1499243282) {
      throw new TypeError("Pair Module requires Framer Library update");
    }
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
    this.useHandCursor = true;
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
        if (_this.useHandCursor) {
          return _this._floater.style.cursor = "-webkit-grabbing";
        }
      };
    })(this);
    this._floatMouseUp = (function(_this) {
      return function(event, layer) {
        _this._pauseEvent(event);
        if (_this.useHandCursor) {
          return _this._floater.style.cursor = "-webkit-grab";
        }
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
        _this._hoveredNode = document.elementFromPoint(event.contextPoint.x, event.contextPoint.y);
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
        _this._px = event.contextPoint.x;
        _this._py = event.contextPoint.y;
        nodeUnderneath = document.elementFromPoint(event.contextPoint.x, event.contextPoint.y);
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
        if (_this.useHandCursor) {
          _this._floater.style.cursor = "-webkit-grab";
        }
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
    if (this.useHandCursor) {
      this._floater.style.cursor = "-webkit-grab";
    }
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
    if (this.useHandCursor) {
      this._floater.style.cursor = this._previousCursor;
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2lhbmJlbGxvbXkvR2l0SHViL1BhaXIvZXhhbXBsZXMvMDFhX2RyYWdBbmREcm9wLmZyYW1lci9tb2R1bGVzL1BhaXIuY29mZmVlIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcblxuXHRQYWlyIG1vZHVsZVxuXG5cdFNlZSByZWFkbWUubWRcblxuXHTigJQgSWFuIEJlbGxvbXksIDIwMTdcblx0XG4jIyNcblxuXG5cbmNsYXNzIGV4cG9ydHMuUGFpciBleHRlbmRzIEZyYW1lci5FdmVudEVtaXR0ZXJcblxuXHQjIHN0YXRpYyBwcm9wZXJ0aWVzXG5cblx0QGRyYWdnZWRJdGVtczpbXVx0XHRcdFxuXG5cdGNvbnN0cnVjdG9yOiAoQF9mbG9hdGVyLCBAX2FuY2hvcikgLT5cdFx0XG5cdFx0XG5cdFx0aWYgRnJhbWVyLlZlcnNpb24uZGF0ZSA8IDE0OTkyNDMyODJcdFxuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihcIlBhaXIgTW9kdWxlIHJlcXVpcmVzIEZyYW1lciBMaWJyYXJ5IHVwZGF0ZVwiKVxuXG5cdFx0IyB2YWxpZGF0ZVxuXHRcdGlmICEoQF9mbG9hdGVyIGluc3RhbmNlb2YgRnJhbWVyLkxheWVyKVxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXIgbW9kdWxlOlBhaXI6Y29uc3RydWN0b3IsICBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgTGF5ZXIuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0aWYgIShAX2FuY2hvciBpbnN0YW5jZW9mIEZyYW1lci5MYXllcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgc2Vjb25kIGFyZ3VtZW50IG11c3QgYmUgYSBMYXllci5cIlxuXHRcdFx0cmV0dXJuXG5cblx0XHRpZiBAX2Zsb2F0ZXIucGFyZW50ICE9IEBfYW5jaG9yLnBhcmVudFxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXIgbW9kdWxlOlBhaXI6Y29uc3RydWN0b3IsICBmaXJzdCBhbmQgc2Vjb25kIGFyZ3VtZW50cyBtdXN0IGhhdmUgdGhlIHNhbWUgcGFyZW50LlwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdCMgJ3ByaXZhdGUnIHByb3BlcnRpZXNcdFx0XG5cdFx0QF9kcmFnQW5kRHJvcEVuYWJsZWQgXHQgPSBmYWxzZVxuXHRcdEBfYW5jaG9yUHJldmlvdXNseUlnbm9yZWRFdmVudHMgPSBAX2FuY2hvci5pZ25vcmVFdmVudHNcblx0XHRAX2hvdmVyZWROb2RlIFx0XHRcdD0gdW5kZWZpbmVkXG5cdFx0QF9pc092ZXJBbmNob3JcdFx0XHQ9IGZhbHNlXHRcdFx0IyBhcmUgd2Ugb3ZlciB0aGlzIGFuY2hvclxuXHRcdEBfZHJhZ2dpbmcgXHRcdFx0XHQ9IGZhbHNlXG5cdFx0QF92YWxpZERyYWdUYXJnZXQgXHRcdD0gZmFsc2VcdFx0XHQjIGFyZSB3ZSBvdmVyIGFueSB2YWxpZCBhbmNob3IgLyBkcm9wIHRhcmdldFxuXHRcdEBfcHJldmlvdXNDdXJzb3IgXHRcdD0gQF9mbG9hdGVyLnN0eWxlLmN1cnNvclxuXHRcdEB1c2VIYW5kQ3Vyc29yXHRcdFx0PSB0cnVlXG5cdFx0QF9wcmV2aW91c0RyYWdnYWJpbGl0eSBcdD0gZmFsc2Vcblx0XHRAX3JhbmdlTGlzdGVuZXJzIFx0XHQ9IFtdXHRcdFxuXHRcdEBfY29sbGlzaW9uTGlzdGVuZXJzIFx0PSBbXVx0XG5cdFx0QF90ZW1wUmFuZ2UgXHRcdFx0PSB1bmRlZmluZWRcblx0XHRAX2NvbnRhaW5lZCBcdFx0XHQ9IGZhbHNlXG5cdFx0QF90ZW1wTGlzdGVuZXIgXHRcdFx0PSB7fVx0XHRcblx0XHRAX3B4XHRcdFx0XHRcdD0gMFxuXHRcdEBfcHkgXHRcdFx0XHRcdD0gMFxuXHRcdEBfZFNxdWFyZWQgPSBAZ2V0RGlzdGFuY2VTcXVhcmVkKClcblx0XHRcblx0XHQjIFdlIHdhbnQgdGhlc2UgZXZlbnQgaGFuZGxlciBtZXRob2RzIHRvIGJlIHNjb3BlZCB0byB0aGUgUGFpciBpbnN0YW5jZSB3aGVuIHRoZXkgcnVuLCBzbyB0aGV5J3JlIGhlcmVcblx0XHRAX2Zsb2F0TW91c2VEb3duID0gKGV2ZW50LGxheWVyKT0+XG5cdFx0XHRAX3BhdXNlRXZlbnQoZXZlbnQpXG5cdFx0XHRpZiBAdXNlSGFuZEN1cnNvciB0aGVuIEBfZmxvYXRlci5zdHlsZS5jdXJzb3IgPSBcIi13ZWJraXQtZ3JhYmJpbmdcIlxuXHRcdFxuXHRcdEBfZmxvYXRNb3VzZVVwID0gKGV2ZW50LGxheWVyKT0+XHRcdFx0XG5cdFx0XHRAX3BhdXNlRXZlbnQoZXZlbnQpXG5cdFx0XHRpZiBAdXNlSGFuZEN1cnNvciB0aGVuIEBfZmxvYXRlci5zdHlsZS5jdXJzb3IgPSBcIi13ZWJraXQtZ3JhYlwiXG5cdFx0XHRcblx0XHRAX2Zsb2F0T3ZlciA9IChldmVudCxsYXllcikgPT5cdFx0XHRcblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcblx0XHRcblx0XHRAX2RyYWdTdGFydEhhbmRsZXI9IChldmVudCxsYXllcikgPT5cdFx0XHRcblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcdFx0XHRcblx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gZmFsc2VcdFx0XHRcblx0XHRcdEBfZHJhZ2dpbmcgPSB0cnVlXG5cdFx0XHRQYWlyLmRyYWdnZWRJdGVtcy5wdXNoIEBfZmxvYXRlclxuXHRcdFx0IyBAX2Zsb2F0ZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiXG5cdFx0XHRAX2Zsb2F0ZXIudmlzaWJsZSA9IGZhbHNlXHRcdFx0XG5cdFx0XHRAX2hvdmVyZWROb2RlID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudC5jb250ZXh0UG9pbnQueCwgZXZlbnQuY29udGV4dFBvaW50LnkpXG5cdFx0XHRAX2lzT3ZlckFuY2hvciA9IEBfYW5jaG9yLl9lbGVtZW50LmNvbnRhaW5zKEBfaG92ZXJlZE5vZGUpXG5cdFx0XHRAX2Zsb2F0ZXIudmlzaWJsZSA9IHRydWVcblx0XHRcdEBlbWl0IFwiZHJhZ1N0YXJ0XCIsIEBfZmxvYXRlclxuXHRcblx0XHRAX2RyYWdIYW5kbGVyPShldmVudCkgPT5cblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcdFx0XHRcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gZmFsc2VcdFx0XHRcblx0XHRcdEBfcHggPSBldmVudC5jb250ZXh0UG9pbnQueFxuXHRcdFx0QF9weSA9IGV2ZW50LmNvbnRleHRQb2ludC55XG5cdFx0XHRub2RlVW5kZXJuZWF0aCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY29udGV4dFBvaW50LngsIGV2ZW50LmNvbnRleHRQb2ludC55KVxuXHRcdFx0QF9mbG9hdGVyLnZpc2libGUgPSB0cnVlXG5cdFx0XHRpc05vd092ZXJBbmNob3IgPSBAX2FuY2hvci5fZWxlbWVudC5jb250YWlucyhub2RlVW5kZXJuZWF0aClcdFx0XHRcblx0XHRcdGlmIGlzTm93T3ZlckFuY2hvciBhbmQgbm90IEBfaXNPdmVyQW5jaG9yXG5cdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gdHJ1ZVx0XHRcdFx0XHRcblx0XHRcdFx0QF9pc092ZXJBbmNob3IgPSB0cnVlXG5cdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFx0XHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiZHJhZ0VudGVyXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdGVsc2UgaWYgbm90IGlzTm93T3ZlckFuY2hvciBhbmQgQF9pc092ZXJBbmNob3Jcblx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVx0XHRcdFx0XG5cdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFxuXHRcdFx0XHRAX2lzT3ZlckFuY2hvciA9IGZhbHNlXG5cdFx0XHRcdEBlbWl0IFwiZHJhZ0xlYXZlXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdGVsc2UgaWYgaXNOb3dPdmVyQW5jaG9yIGFuZCBAX2lzT3ZlckFuY2hvciBhbmQgQF92YWxpZERyYWdUYXJnZXRcblx0XHRcdFx0QGVtaXQgXCJkcmFnT3ZlclwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFxuXHRcdEBfZHJhZ0VuZEhhbmRsZXI9KGV2ZW50LCBsYXllcikgPT5cblx0XHRcdEBfZHJhZ2dpbmcgPSBmYWxzZVx0XHRcdFxuXHRcdFx0aW5kZXggPSBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIEBfZmxvYXRlclxuXHRcdFx0UGFpci5kcmFnZ2VkSXRlbXMuc3BsaWNlKGluZGV4LDEpXG5cdFx0XHRpZiBAdXNlSGFuZEN1cnNvciB0aGVuIEBfZmxvYXRlci5zdHlsZS5jdXJzb3IgPSBcIi13ZWJraXQtZ3JhYlwiXG5cdFx0XHRpZiBAX3ZhbGlkRHJhZ1RhcmdldFx0XHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiZHJvcFwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gZmFsc2Vcblx0XHRcdGVsc2VcdFx0XHRcblx0XHRcdFx0QGVtaXQgXCJpbnZhbGlkRHJvcFwiLCBAX2Zsb2F0ZXJcblx0XG5cdFx0XHRpZiBAaGl0VGVzdCgpXG5cdFx0XHRcdEBlbWl0IFwiY29udGFjdERyb3BcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXHRcdFx0ZWxzZSBcblx0XHRcdFx0QGVtaXQgXCJpbnZhbGlkQ29udGFjdERyb3BcIiwgQF9mbG9hdGVyXG5cdFx0XHRcdFxuXHRcdEBfZmxvYXRNb3ZlSGFuZGxlciA9IChldmVudCxsYXllcikgPT5cblx0XHRcdEBfcGF1c2VFdmVudChldmVudClcblx0XHRcdFxuIyBcdFx0QF9hbmNob3JNb3VzZU92ZXI9KGV2ZW50LGxheWVyKT0+XG4jIFx0XHRcdGlmIEBfZHJhZ2dpbmcgIFxuIyBcdFx0XHRcdG5vZGVVbmRlcm5lYXRoID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKVxuIyBcdFx0XHRcdGlmIFBhaXIuZHJhZ2dlZEl0ZW1zLmluZGV4T2YgQF9mbG9hdGVyIGlzbnQgLTEgYW5kIEBfaG92ZXJlZE5vZGUgIT0gbm9kZVVuZGVybmVhdGhcbiMgXHRcdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gdHJ1ZVxuIyBcdFx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IG5vZGVVbmRlcm5lYXRoXG4jIFx0XHRcdFx0XHRwcmludCBcIm5ldyBub2RlP1wiXG4jIFx0XHRcdFx0XHRwcmludCBAX2hvdmVyZWROb2RlID09IG5vZGVVbmRlcm5lYXRoXG4jIFx0XHRcdFx0XHRAZW1pdCBcImRyYWdFbnRlclwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG4jIFx0XHRcdFx0XHRcbiMgXHRcbiMgXHRcdEBfYW5jaG9yTW91c2VPdXQ9KGV2ZW50LGxheWVyKT0+XHRcdFxuIyBcdFx0XHRAX3BhdXNlRXZlbnQoZXZlbnQpXG4jIFx0XHRcdGlmIEBfZHJhZ2dpbmcgXG4jIFx0XHRcdFx0aWYgUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBAX2Zsb2F0ZXIgaXNudCAtMVxuIyBcdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuIyBcdFx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcbiMgXHRcdFx0XHRcdEBlbWl0IFwiZHJhZ0xlYXZlXCIsIEBfZmxvYXRlciwgQF9hbmNob3JcblxuXHRcdFxuXHRcdCMgcmVhZHkhXG5cdFx0QHdha2UoKVxuXHRcdFxuXHRcdCNcblx0XHQjIGVuZCBjb25zdHJ1Y3RvclxuXHRcdCNcblx0XG5cblx0X3BhdXNlRXZlbnQ6KGV2ZW50KS0+XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0ZXZlbnQuY2FuY2VsQnViYmxlPXRydWVcblx0XHRldmVudC5yZXR1cm5WYWx1ZT1mYWxzZVxuXHRcdFxuXHQjc2hvdWxkIG11bHRpcGxlIFBhaXJzIGJlIGhhbmRsZWQgaW4gdGhlIHNhbWUgbGlzdGVuZXI/XG5cdGxvb3BMaXN0ZW5lcjogPT5cblx0XHRAX2RTcXVhcmVkID0gQGdldERpc3RhbmNlU3F1YXJlZCgpXG5cdFx0Zm9yIEBfdGVtcFJhbmdlIGluIEBfcmFuZ2VMaXN0ZW5lcnMgIFxuXHRcdFx0QF9jb250YWluZWQgPSBAX3RlbXBSYW5nZS5taW5TcXVhcmVkIDw9IEBfZFNxdWFyZWQgPD0gQF90ZW1wUmFuZ2UubWF4U3F1YXJlZCBcblx0XHRcdGlmIEBfY29udGFpbmVkIGFuZCBub3QgQF90ZW1wUmFuZ2UuZW50ZXJlZCBcblx0XHRcdFx0QF90ZW1wUmFuZ2UuZW50ZXJlZCA9IHRydWVcblx0XHRcdFx0QF90ZW1wUmFuZ2UuZW50ZXJDYWxsYmFjay5hcHBseSBAXG5cdFx0XHRcdFxuXHRcdFx0ZWxzZSBpZiBub3QgQF9jb250YWluZWQgYW5kIEBfdGVtcFJhbmdlLmVudGVyZWRcblx0XHRcdFx0QF90ZW1wUmFuZ2UuZW50ZXJlZCA9IGZhbHNlXG5cdFx0XHRcdEBfdGVtcFJhbmdlLmV4aXRDYWxsYmFjay5hcHBseSBAXHRcdFx0XG5cblx0XHRpZiBAaGl0VGVzdCgpXG5cdFx0XHRmb3IgQF90ZW1wTGlzdGVuZXIgaW4gQF9jb2xsaXNpb25MaXN0ZW5lcnNcblx0XHRcdFx0QF90ZW1wTGlzdGVuZXIuY29udGFjdCsrIHx8IEBfdGVtcExpc3RlbmVyLmNvbnRhY3RTdGFydChAX2Zsb2F0ZXIsQF9hbmNob3IpXG5cdFx0XHRcdFxuXHRcdGVsc2Vcblx0XHRcdGZvciBAX3RlbXBMaXN0ZW5lciBpbiBAX2NvbGxpc2lvbkxpc3RlbmVyc1xuXHRcdFx0XHRpZihAX3RlbXBMaXN0ZW5lci5jb250YWN0KVxuXHRcdFx0XHRcdEBfdGVtcExpc3RlbmVyLmNvbnRhY3QgPSBmYWxzZVxuXHRcdFx0XHRcdEBfdGVtcExpc3RlbmVyLmNvbnRhY3RFbmQoQF9mbG9hdGVyLEBfYW5jaG9yKVxuXHRcdFxuXHRcdFxuXHRcdCMgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKEBsb29wTGlzdGVuZXIpXG5cdFxuXHRnZXREaXN0YW5jZTogLT5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KChAX2Zsb2F0ZXIubWlkWC1AX2FuY2hvci5taWRYKSoqMiArIChAX2Zsb2F0ZXIubWlkWS1AX2FuY2hvci5taWRZKSoqMilcblx0XG5cdGdldERpc3RhbmNlU3F1YXJlZDogLT5cblx0XHRyZXR1cm4gKEBfZmxvYXRlci5taWRYLUBfYW5jaG9yLm1pZFgpKioyICsgKEBfZmxvYXRlci5taWRZLUBfYW5jaG9yLm1pZFkpKioyXG5cdFxuXHRzZXREaXN0YW5jZToobmV3RGlzdGFuY2UpLT5cblx0XHRkaXN0YW5jZURpZmZSYXRpbyA9IG5ld0Rpc3RhbmNlLyBNYXRoLnNxcnQoQF9kU3F1YXJlZClcblxuXHRcdG9sZFhPZmZzZXQgPSBAX2Zsb2F0ZXIubWlkWCAtIEBfYW5jaG9yLm1pZFhcblx0XHRuZXdYT2Zmc2V0ID0gb2xkWE9mZnNldCAqIGRpc3RhbmNlRGlmZlJhdGlvXG5cdFx0QF9mbG9hdGVyLm1pZFggPSBAX2FuY2hvci5taWRYICsgbmV3WE9mZnNldFxuXG5cdFx0b2xkWU9mZnNldCA9IEBfZmxvYXRlci5taWRZIC0gQF9hbmNob3IubWlkWVxuXHRcdG5ld1lPZmZzZXQgPSBvbGRZT2Zmc2V0ICogZGlzdGFuY2VEaWZmUmF0aW9cblx0XHRAX2Zsb2F0ZXIubWlkWSA9IEBfYW5jaG9yLm1pZFkgKyBuZXdZT2Zmc2V0XG5cblx0XG5cdCMgdGhlIGNvLW9yZGluYXRlcyBiZXR3ZWVuIHRoZSBhbmNob3IgYW5kIGZsb2F0ZXJcblx0bWlkcG9pbnQ6IC0+XG5cdFx0cmV0dXJuIFsoQF9hbmNob3IubWlkWCArIEBfZmxvYXRlci5taWRYKS8yLjAsKEBfYW5jaG9yLm1pZFkgKyBAX2Zsb2F0ZXIubWlkWSkvMi4wXVxuXHRcblx0I3JldHVybnMgdHJ1ZSBpZiB0aGUgYW5jaG9yIGFuZCBmbG9hdGVyIGZyYW1lcyB0b3VjaFx0XHRcblx0aGl0VGVzdDotPlxuXHRcdHIxID0gQF9hbmNob3Jcblx0XHRyMiA9IEBfZmxvYXRlclxuXHRcdHJldHVybiAhKCByMi54ID4gcjEueCArIHIxLndpZHRoIG9yIHIyLnggKyByMi53aWR0aCA8IHIxLnggb3IgcjIueSA+IHIxLnkgKyByMS5oZWlnaHQgb3IgcjIueSArIHIyLmhlaWdodCA8IHIxLnkpXG5cblx0ZW5hYmxlRHJhZ0FuZERyb3A6LT5cdFx0XG5cdFx0QF9kcmFnQW5kRHJvcEVuYWJsZWQgPSB0cnVlXHRcdFxuXHRcdEBfcHJldmlvdXNEcmFnZ2FiaWxpdHkgPSBAX2Zsb2F0ZXIuZHJhZ2dhYmxlLmVuYWJsZWQgIyBGSVhNRTogQnVnIGluIGZyYW1lciBtYWtlcyB0aGlzIHJldHVybiB0cnVlIGlmIGFjY2Vzc2VkIVxuXHRcdEBfZmxvYXRlci5kcmFnZ2FibGUuZW5hYmxlZCA9IHRydWVcblx0XHRAX3ByZXZpb3VzQ3Vyc29yID0gQF9mbG9hdGVyLnN0eWxlLmN1cnNvclxuXHRcdGlmIEB1c2VIYW5kQ3Vyc29yIHRoZW4gQF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiXCJcblx0XHRAX2hvdmVyZWROb2RlID0gdW5kZWZpbmVkXG5cdFx0QF9hbmNob3JQcmV2aW91c2x5SWdub3JlZEV2ZW50cyA9IEBfYW5jaG9yLmlnbm9yZUV2ZW50c1xuXHRcdEBfYW5jaG9yLmlnbm9yZUV2ZW50cyA9IGZhbHNlXG5cdFx0XG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZURvd24sIEBfZmxvYXRNb3VzZURvd25cblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlVXAsIEBfZmxvYXRNb3VzZVVwXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZU1vdmUsIEBfZmxvYXRNb3ZlSGFuZGxlclx0XHRcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlT3ZlciwgQF9mbG9hdE92ZXJcdFxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuRHJhZ1N0YXJ0LCBAX2RyYWdTdGFydEhhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLkRyYWdNb3ZlLCBAX2RyYWdIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5EcmFnRW5kLCBAX2RyYWdFbmRIYW5kbGVyXHRcdFxuXG5cdGRpc2FibGVEcmFnQW5kRHJvcDotPlx0XG5cdFx0QF9kcmFnZ2luZyA9IGZhbHNlXHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IGZhbHNlXHRcdFxuXHRcdEBfZmxvYXRlci5kcmFnZ2FibGUuZW5hYmxlZCA9IGZhbHNlICMgQF9wcmV2aW91c0RyYWdnYWJpbGl0eSAjIERvZXNuJ3Qgd29yayBiZWNhdXNlIGJ1ZyBpbiBmcmFtZXJcblx0XHRpZiBAdXNlSGFuZEN1cnNvciB0aGVuIEBfZmxvYXRlci5zdHlsZS5jdXJzb3IgPSBAX3ByZXZpb3VzQ3Vyc29yXG5cdFx0QF9hbmNob3IuaWdub3JlRXZlbnRzID0gQF9hbmNob3JQcmV2aW91c2x5SWdub3JlZEV2ZW50c1xuXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuTW91c2VEb3duLCBAX2Zsb2F0TW91c2VEb3duXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuTW91c2VVcCwgQF9mbG9hdE1vdXNlVXBcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5Nb3VzZU1vdmUsIEBfZmxvYXRNb3ZlSGFuZGxlclxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLk1vdXNlT3ZlciwgQF9mbG9hdE92ZXJcdFxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLkRyYWdTdGFydCwgQF9kcmFnU3RhcnRIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuRHJhZ01vdmUsIEBfZHJhZ0hhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnRW5kLCBAX2RyYWdFbmRIYW5kbGVyXHRcdFxuXHRcdFxuXG5cdHNsZWVwOi0+XG5cdFx0RnJhbWVyLkxvb3Aub2ZmIFwidXBkYXRlXCIsIEBsb29wTGlzdGVuZXJcblx0XHQjIGRpc2FibGUgZHJhZyBhbmQgZHJvcCwgcmVtZW1iZXIgd2hhdCB0aGUgc3RhdGUgd2FzXG5cblx0d2FrZTotPlxuXHRcdCMgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKEBsb29wTGlzdGVuZXIpXG5cblx0XHRGcmFtZXIuTG9vcC5vbiBcInVwZGF0ZVwiLCBAbG9vcExpc3RlbmVyXG5cblx0XHQjIHVwZGF0ZSBjb250YWN0IHByb3BlcnRpZXMgb2YgbGlzdGVuZXJzP1xuXHRcdCMgZW5hYmxlZCBkcmFnIGFuZCBkcm9wIGlmIHRoaXMgd2FzIGFjdGl2ZSBiZWZvcmVcblxuXHRkZXN0cm95Oi0+XG5cdFx0QGRpc2FibGVEcmFnQW5kRHJvcCgpXG5cdFx0QHNsZWVwKClcblx0XHQjIHRoYXQncyBpdCEgSSB0aGluay4uLlxuXG5cblx0I1xuXHQjXHRFdmVudCBIYW5kbGluZ1xuXHQjXG5cblx0I3JldHVybnMgYW4gaW5kZXhcblx0b25SYW5nZUNoYW5nZTogKG1pbixtYXgsZW50ZXJGbixleGl0Rm4gPSAtPikgLT5cblx0XHRjb3VudCA9IEBfcmFuZ2VMaXN0ZW5lcnMucHVzaFxuXHRcdFx0bWluOm1pblxuXHRcdFx0bWF4Om1heFxuXHRcdFx0bWluU3F1YXJlZDogbWluKioyXG5cdFx0XHRtYXhTcXVhcmVkOiBtYXgqKjJcblx0XHRcdGVudGVyQ2FsbGJhY2s6IGVudGVyRm5cblx0XHRcdGV4aXRDYWxsYmFjazogZXhpdEZuXG5cdFx0XHRlbnRlcmVkOmZhbHNlXG5cdFx0XG5cdFx0cmV0dXJuIGNvdW50IC0gMVxuXG5cblx0b2ZmUmFuZ2VDaGFuZ2U6IChpbmRleCkgLT5cblx0XHRpZiAhKGluZGV4IGluc3RhbmNlb2YgTnVtYmVyKVxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXI6b2ZmUmFuZ2VDaGFuZ2UoaW5kZXgpLCBpbmRleCBtdXN0IGJlIGEgTnVtYmVyXCJcblx0XHRcdHJldHVyblxuXG5cdFx0QF9yYW5nZUxpc3RlbmVyc1tpbmRleF0gPSBudWxsXG5cblxuXHQjIFJldHVybnMgaW5kZXhcblx0b25Db250YWN0Q2hhbmdlOiAoc3RhcnRGbixlbmRGbj0tPikgLT5cdFx0XG5cdFx0Y291bnQgPSAoQF9jb2xsaXNpb25MaXN0ZW5lcnMucHVzaCBcblx0XHRcdGNvbnRhY3RTdGFydDpzdGFydEZuXG5cdFx0XHRjb250YWN0RW5kOmVuZEZuXG5cdFx0XHRjb250YWN0OmZhbHNlKSAtIDFcdFxuXG5cdFx0cmV0dXJuIGNvdW50XG5cblxuXHRvZmZDb250YWN0Q2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0aWYgIShpbmRleCBpbnN0YW5jZW9mIE51bWJlcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyOm9mZkNvbnRhY3RDaGFuZ2UoaW5kZXgpLCBpbmRleCBtdXN0IGJlIGEgTnVtYmVyXCJcblx0XHRcdHJldHVyblxuXG5cdFx0QF9jb2xsaXNpb25MaXN0ZW5lcnNbaW5kZXhdID0gbnVsbCBcdFxuXG5cdCNcdFxuXHQjXHRFdmVudCBoYW5kbGluZyBjb252ZW5pZW5jZSBmdW5jdGlvbnNcblx0I1xuXG5cdG9uRHJhZ1N0YXJ0OiAoZm4pLT5cblx0XHRAb24gXCJkcmFnU3RhcnRcIiwgZm5cblxuXHRvbkRyYWdFbnRlcjogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ0VudGVyXCIsIGZuXG5cblx0b25EcmFnT3ZlcjogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ092ZXJcIiwgZm5cblxuXHRvbkRyYWdMZWF2ZTogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ0xlYXZlXCIsIGZuXG5cblx0b25JbnZhbGlkRHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiaW52YWxpZERyb3BcIiwgZm5cblxuXHRvbkRyb3A6IChmbiktPlxuXHRcdEBvbiBcImRyb3BcIiwgZm5cblxuXHRvbkNvbnRhY3REcm9wOiAoZm4pLT5cblx0XHRAb24gXCJjb250YWN0RHJvcFwiLCBmblxuXG5cdG9uSW52YWxpZENvbnRhY3REcm9wOiAoZm4pLT5cblx0XHRAb24gXCJpbnZhbGlkQ29udGFjdERyb3BcIiwgZm5cbiIsIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQ0FBOztBREFBOzs7Ozs7OztBQUFBLElBQUE7Ozs7QUFZTSxPQUFPLENBQUM7OztFQUliLElBQUMsQ0FBQSxZQUFELEdBQWM7O0VBRUQsY0FBQyxRQUFELEVBQVksT0FBWjtJQUFDLElBQUMsQ0FBQSxXQUFEO0lBQVcsSUFBQyxDQUFBLFVBQUQ7O0lBRXhCLElBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFmLEdBQXNCLFVBQXpCO0FBQ0MsWUFBVSxJQUFBLFNBQUEsQ0FBVSw0Q0FBVixFQURYOztJQUlBLElBQUcsQ0FBQyxDQUFDLElBQUMsQ0FBQSxRQUFELFlBQXFCLE1BQU0sQ0FBQyxLQUE3QixDQUFKO01BQ0MsS0FBQSxDQUFNLHdFQUFOO0FBQ0EsYUFGRDs7SUFJQSxJQUFHLENBQUMsQ0FBQyxJQUFDLENBQUEsT0FBRCxZQUFvQixNQUFNLENBQUMsS0FBNUIsQ0FBSjtNQUNDLEtBQUEsQ0FBTSx5RUFBTjtBQUNBLGFBRkQ7O0lBSUEsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsS0FBb0IsSUFB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
