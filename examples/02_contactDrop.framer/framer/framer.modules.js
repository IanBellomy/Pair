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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2lhbmJlbGxvbXkvR2l0SHViL1BhaXIvZXhhbXBsZXMvMDJhX2NvbnRhY3REcm9wLmZyYW1lci9tb2R1bGVzL1BhaXIuY29mZmVlIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcblxuXHRQYWlyIG1vZHVsZVxuXG5cdFNlZSByZWFkbWUubWRcblxuXHTigJQgSWFuIEJlbGxvbXksIDIwMTdcblx0XG4jIyNcblxuY2xhc3MgZXhwb3J0cy5QYWlyIGV4dGVuZHMgRnJhbWVyLkV2ZW50RW1pdHRlclxuXG5cdCMgc3RhdGljIHByb3BlcnRpZXNcblxuXHRAZHJhZ2dlZEl0ZW1zOltdXHRcdFx0XG5cblx0Y29uc3RydWN0b3I6IChAX2Zsb2F0ZXIsIEBfYW5jaG9yKSAtPlx0XHRcblxuXHRcdCMgdmFsaWRhdGVcblx0XHRpZiAhKEBfZmxvYXRlciBpbnN0YW5jZW9mIEZyYW1lci5MYXllcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIExheWVyLlwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdGlmICEoQF9hbmNob3IgaW5zdGFuY2VvZiBGcmFtZXIuTGF5ZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIHNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGEgTGF5ZXIuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0aWYgQF9mbG9hdGVyLnBhcmVudCAhPSBAX2FuY2hvci5wYXJlbnRcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgZmlyc3QgYW5kIHNlY29uZCBhcmd1bWVudHMgbXVzdCBoYXZlIHRoZSBzYW1lIHBhcmVudC5cIlxuXHRcdFx0cmV0dXJuXG5cblx0XHQjICdwcml2YXRlJyBwcm9wZXJ0aWVzXHRcdFxuXHRcdEBfZHJhZ0FuZERyb3BFbmFibGVkIFx0ID0gZmFsc2Vcblx0XHRAX2FuY2hvclByZXZpb3VzbHlJZ25vcmVkRXZlbnRzID0gQF9hbmNob3IuaWdub3JlRXZlbnRzXG5cdFx0QF9ob3ZlcmVkTm9kZSBcdFx0XHQ9IHVuZGVmaW5lZFxuXHRcdEBfaXNPdmVyQW5jaG9yXHRcdFx0PSBmYWxzZVx0XHRcdCMgYXJlIHdlIG92ZXIgdGhpcyBhbmNob3Jcblx0XHRAX2RyYWdnaW5nIFx0XHRcdFx0PSBmYWxzZVxuXHRcdEBfdmFsaWREcmFnVGFyZ2V0IFx0XHQ9IGZhbHNlXHRcdFx0IyBhcmUgd2Ugb3ZlciBhbnkgdmFsaWQgYW5jaG9yIC8gZHJvcCB0YXJnZXRcblx0XHRAX3ByZXZpb3VzQ3Vyc29yIFx0XHQ9IEBfZmxvYXRlci5zdHlsZS5jdXJzb3Jcblx0XHRAdXNlSGFuZEN1cnNvclx0XHRcdD0gdHJ1ZVxuXHRcdEBfcHJldmlvdXNEcmFnZ2FiaWxpdHkgXHQ9IGZhbHNlXG5cdFx0QF9yYW5nZUxpc3RlbmVycyBcdFx0PSBbXVx0XHRcblx0XHRAX2NvbGxpc2lvbkxpc3RlbmVycyBcdD0gW11cdFxuXHRcdEBfdGVtcFJhbmdlIFx0XHRcdD0gdW5kZWZpbmVkXG5cdFx0QF9jb250YWluZWQgXHRcdFx0PSBmYWxzZVxuXHRcdEBfdGVtcExpc3RlbmVyIFx0XHRcdD0ge31cdFx0XG5cdFx0QF9weFx0XHRcdFx0XHQ9IDBcblx0XHRAX3B5IFx0XHRcdFx0XHQ9IDBcblx0XHRAX2RTcXVhcmVkID0gQGdldERpc3RhbmNlU3F1YXJlZCgpXG5cdFx0XG5cdFx0IyBXZSB3YW50IHRoZXNlIGV2ZW50IGhhbmRsZXIgbWV0aG9kcyB0byBiZSBzY29wZWQgdG8gdGhlIFBhaXIgaW5zdGFuY2Ugd2hlbiB0aGV5IHJ1biwgc28gdGhleSdyZSBoZXJlXG5cdFx0QF9mbG9hdE1vdXNlRG93biA9IChldmVudCxsYXllcik9PlxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFx0aWYgQHVzZUhhbmRDdXJzb3IgdGhlbiBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCItd2Via2l0LWdyYWJiaW5nXCJcblx0XHRcblx0XHRAX2Zsb2F0TW91c2VVcCA9IChldmVudCxsYXllcik9Plx0XHRcdFxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFx0aWYgQHVzZUhhbmRDdXJzb3IgdGhlbiBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCItd2Via2l0LWdyYWJcIlxuXHRcdFx0XG5cdFx0QF9mbG9hdE92ZXIgPSAoZXZlbnQsbGF5ZXIpID0+XHRcdFx0XG5cdFx0XHRAX3BhdXNlRXZlbnQoZXZlbnQpXG5cdFx0XG5cdFx0QF9kcmFnU3RhcnRIYW5kbGVyPSAoZXZlbnQsbGF5ZXIpID0+XHRcdFx0XG5cdFx0XHRAX3BhdXNlRXZlbnQoZXZlbnQpXHRcdFx0XG5cdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXHRcdFx0XG5cdFx0XHRAX2RyYWdnaW5nID0gdHJ1ZVxuXHRcdFx0UGFpci5kcmFnZ2VkSXRlbXMucHVzaCBAX2Zsb2F0ZXJcblx0XHRcdCMgQF9mbG9hdGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIlxuXHRcdFx0QF9mbG9hdGVyLnZpc2libGUgPSBmYWxzZVxuXHRcdFx0QF9ob3ZlcmVkTm9kZSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcdFx0XHRcblx0XHRcdEBfaXNPdmVyQW5jaG9yID0gQF9hbmNob3IuX2VsZW1lbnQuY29udGFpbnMoQF9ob3ZlcmVkTm9kZSlcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gdHJ1ZVxuXHRcdFx0QGVtaXQgXCJkcmFnU3RhcnRcIiwgQF9mbG9hdGVyXG5cdFxuXHRcdEBfZHJhZ0hhbmRsZXI9KGV2ZW50KSA9PlxuXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVx0XHRcdFxuXHRcdFx0QF9mbG9hdGVyLnZpc2libGUgPSBmYWxzZVxuXHRcdFx0QF9weCA9IGV2ZW50LmNsaWVudFhcblx0XHRcdEBfcHkgPSBldmVudC5jbGllbnRZXG5cdFx0XHRub2RlVW5kZXJuZWF0aCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gdHJ1ZVxuXHRcdFx0aXNOb3dPdmVyQW5jaG9yID0gQF9hbmNob3IuX2VsZW1lbnQuY29udGFpbnMobm9kZVVuZGVybmVhdGgpXHRcdFx0XG5cdFx0XHRpZiBpc05vd092ZXJBbmNob3IgYW5kIG5vdCBAX2lzT3ZlckFuY2hvclxuXHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IHRydWVcdFx0XHRcdFx0XG5cdFx0XHRcdEBfaXNPdmVyQW5jaG9yID0gdHJ1ZVxuXHRcdFx0XHRAX2hvdmVyZWROb2RlID0gbm9kZVVuZGVybmVhdGhcdFx0XHRcdFxuXHRcdFx0XHRAZW1pdCBcImRyYWdFbnRlclwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFx0XHRlbHNlIGlmIG5vdCBpc05vd092ZXJBbmNob3IgYW5kIEBfaXNPdmVyQW5jaG9yXG5cdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gZmFsc2VcdFx0XHRcdFxuXHRcdFx0XHRAX2hvdmVyZWROb2RlID0gbm9kZVVuZGVybmVhdGhcblx0XHRcdFx0QF9pc092ZXJBbmNob3IgPSBmYWxzZVxuXHRcdFx0XHRAZW1pdCBcImRyYWdMZWF2ZVwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFx0XHRlbHNlIGlmIGlzTm93T3ZlckFuY2hvciBhbmQgQF9pc092ZXJBbmNob3IgYW5kIEBfdmFsaWREcmFnVGFyZ2V0XG5cdFx0XHRcdEBlbWl0IFwiZHJhZ092ZXJcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXHRcblx0XHRAX2RyYWdFbmRIYW5kbGVyPShldmVudCwgbGF5ZXIpID0+XG5cdFx0XHRAX2RyYWdnaW5nID0gZmFsc2VcdFx0XHRcblx0XHRcdGluZGV4ID0gUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBAX2Zsb2F0ZXJcblx0XHRcdFBhaXIuZHJhZ2dlZEl0ZW1zLnNwbGljZShpbmRleCwxKVxuXHRcdFx0aWYgQHVzZUhhbmRDdXJzb3IgdGhlbiBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCItd2Via2l0LWdyYWJcIlxuXHRcdFx0aWYgQF92YWxpZERyYWdUYXJnZXRcdFx0XHRcdFxuXHRcdFx0XHRAZW1pdCBcImRyb3BcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuXHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXG5cdFx0XHRlbHNlXHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiaW52YWxpZERyb3BcIiwgQF9mbG9hdGVyXG5cdFxuXHRcdFx0aWYgQGhpdFRlc3QoKVxuXHRcdFx0XHRAZW1pdCBcImNvbnRhY3REcm9wXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdGVsc2UgXG5cdFx0XHRcdEBlbWl0IFwiaW52YWxpZENvbnRhY3REcm9wXCIsIEBfZmxvYXRlclxuXHRcdFx0XHRcblx0XHRAX2Zsb2F0TW92ZUhhbmRsZXIgPSAoZXZlbnQsbGF5ZXIpID0+XG5cdFx0XHRAX3BhdXNlRXZlbnQoZXZlbnQpXG5cdFx0XHRcbiMgXHRcdEBfYW5jaG9yTW91c2VPdmVyPShldmVudCxsYXllcik9PlxuIyBcdFx0XHRpZiBAX2RyYWdnaW5nICBcbiMgXHRcdFx0XHRub2RlVW5kZXJuZWF0aCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcbiMgXHRcdFx0XHRpZiBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIEBfZmxvYXRlciBpc250IC0xIGFuZCBAX2hvdmVyZWROb2RlICE9IG5vZGVVbmRlcm5lYXRoXG4jIFx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IHRydWVcbiMgXHRcdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFxuIyBcdFx0XHRcdFx0cHJpbnQgXCJuZXcgbm9kZT9cIlxuIyBcdFx0XHRcdFx0cHJpbnQgQF9ob3ZlcmVkTm9kZSA9PSBub2RlVW5kZXJuZWF0aFxuIyBcdFx0XHRcdFx0QGVtaXQgXCJkcmFnRW50ZXJcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuIyBcdFx0XHRcdFx0XG4jIFx0XG4jIFx0XHRAX2FuY2hvck1vdXNlT3V0PShldmVudCxsYXllcik9Plx0XHRcbiMgXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuIyBcdFx0XHRpZiBAX2RyYWdnaW5nIFxuIyBcdFx0XHRcdGlmIFBhaXIuZHJhZ2dlZEl0ZW1zLmluZGV4T2YgQF9mbG9hdGVyIGlzbnQgLTFcbiMgXHRcdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gZmFsc2VcbiMgXHRcdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXG4jIFx0XHRcdFx0XHRAZW1pdCBcImRyYWdMZWF2ZVwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cblx0XHRcblx0XHQjIHJlYWR5IVxuXHRcdEB3YWtlKClcblx0XHRcblx0XHQjXG5cdFx0IyBlbmQgY29uc3RydWN0b3Jcblx0XHQjXG5cdFxuXG5cdF9wYXVzZUV2ZW50OihldmVudCktPlxuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdGV2ZW50LmNhbmNlbEJ1YmJsZT10cnVlXG5cdFx0ZXZlbnQucmV0dXJuVmFsdWU9ZmFsc2Vcblx0XHRcblx0I3Nob3VsZCBtdWx0aXBsZSBQYWlycyBiZSBoYW5kbGVkIGluIHRoZSBzYW1lIGxpc3RlbmVyP1xuXHRsb29wTGlzdGVuZXI6ID0+XG5cdFx0QF9kU3F1YXJlZCA9IEBnZXREaXN0YW5jZVNxdWFyZWQoKVxuXHRcdGZvciBAX3RlbXBSYW5nZSBpbiBAX3JhbmdlTGlzdGVuZXJzICBcblx0XHRcdEBfY29udGFpbmVkID0gQF90ZW1wUmFuZ2UubWluU3F1YXJlZCA8PSBAX2RTcXVhcmVkIDw9IEBfdGVtcFJhbmdlLm1heFNxdWFyZWQgXG5cdFx0XHRpZiBAX2NvbnRhaW5lZCBhbmQgbm90IEBfdGVtcFJhbmdlLmVudGVyZWQgXG5cdFx0XHRcdEBfdGVtcFJhbmdlLmVudGVyZWQgPSB0cnVlXG5cdFx0XHRcdEBfdGVtcFJhbmdlLmVudGVyQ2FsbGJhY2suYXBwbHkgQFxuXHRcdFx0XHRcblx0XHRcdGVsc2UgaWYgbm90IEBfY29udGFpbmVkIGFuZCBAX3RlbXBSYW5nZS5lbnRlcmVkXG5cdFx0XHRcdEBfdGVtcFJhbmdlLmVudGVyZWQgPSBmYWxzZVxuXHRcdFx0XHRAX3RlbXBSYW5nZS5leGl0Q2FsbGJhY2suYXBwbHkgQFx0XHRcdFxuXG5cdFx0aWYgQGhpdFRlc3QoKVxuXHRcdFx0Zm9yIEBfdGVtcExpc3RlbmVyIGluIEBfY29sbGlzaW9uTGlzdGVuZXJzXG5cdFx0XHRcdEBfdGVtcExpc3RlbmVyLmNvbnRhY3QrKyB8fCBAX3RlbXBMaXN0ZW5lci5jb250YWN0U3RhcnQoQF9mbG9hdGVyLEBfYW5jaG9yKVxuXHRcdFx0XHRcblx0XHRlbHNlXG5cdFx0XHRmb3IgQF90ZW1wTGlzdGVuZXIgaW4gQF9jb2xsaXNpb25MaXN0ZW5lcnNcblx0XHRcdFx0aWYoQF90ZW1wTGlzdGVuZXIuY29udGFjdClcblx0XHRcdFx0XHRAX3RlbXBMaXN0ZW5lci5jb250YWN0ID0gZmFsc2Vcblx0XHRcdFx0XHRAX3RlbXBMaXN0ZW5lci5jb250YWN0RW5kKEBfZmxvYXRlcixAX2FuY2hvcilcblx0XHRcblx0XHRcblx0XHQjIHJlcXVlc3RBbmltYXRpb25GcmFtZShAbG9vcExpc3RlbmVyKVxuXHRcblx0Z2V0RGlzdGFuY2U6IC0+XG5cdFx0cmV0dXJuIE1hdGguc3FydCgoQF9mbG9hdGVyLm1pZFgtQF9hbmNob3IubWlkWCkqKjIgKyAoQF9mbG9hdGVyLm1pZFktQF9hbmNob3IubWlkWSkqKjIpXG5cdFxuXHRnZXREaXN0YW5jZVNxdWFyZWQ6IC0+XG5cdFx0cmV0dXJuIChAX2Zsb2F0ZXIubWlkWC1AX2FuY2hvci5taWRYKSoqMiArIChAX2Zsb2F0ZXIubWlkWS1AX2FuY2hvci5taWRZKSoqMlxuXHRcblx0c2V0RGlzdGFuY2U6KG5ld0Rpc3RhbmNlKS0+XG5cdFx0ZGlzdGFuY2VEaWZmUmF0aW8gPSBuZXdEaXN0YW5jZS8gTWF0aC5zcXJ0KEBfZFNxdWFyZWQpXG5cblx0XHRvbGRYT2Zmc2V0ID0gQF9mbG9hdGVyLm1pZFggLSBAX2FuY2hvci5taWRYXG5cdFx0bmV3WE9mZnNldCA9IG9sZFhPZmZzZXQgKiBkaXN0YW5jZURpZmZSYXRpb1xuXHRcdEBfZmxvYXRlci5taWRYID0gQF9hbmNob3IubWlkWCArIG5ld1hPZmZzZXRcblxuXHRcdG9sZFlPZmZzZXQgPSBAX2Zsb2F0ZXIubWlkWSAtIEBfYW5jaG9yLm1pZFlcblx0XHRuZXdZT2Zmc2V0ID0gb2xkWU9mZnNldCAqIGRpc3RhbmNlRGlmZlJhdGlvXG5cdFx0QF9mbG9hdGVyLm1pZFkgPSBAX2FuY2hvci5taWRZICsgbmV3WU9mZnNldFxuXG5cdFxuXHQjIHRoZSBjby1vcmRpbmF0ZXMgYmV0d2VlbiB0aGUgYW5jaG9yIGFuZCBmbG9hdGVyXG5cdG1pZHBvaW50OiAtPlxuXHRcdHJldHVybiBbKEBfYW5jaG9yLm1pZFggKyBAX2Zsb2F0ZXIubWlkWCkvMi4wLChAX2FuY2hvci5taWRZICsgQF9mbG9hdGVyLm1pZFkpLzIuMF1cblx0XG5cdCNyZXR1cm5zIHRydWUgaWYgdGhlIGFuY2hvciBhbmQgZmxvYXRlciBmcmFtZXMgdG91Y2hcdFx0XG5cdGhpdFRlc3Q6LT5cblx0XHRyMSA9IEBfYW5jaG9yXG5cdFx0cjIgPSBAX2Zsb2F0ZXJcblx0XHRyZXR1cm4gISggcjIueCA+IHIxLnggKyByMS53aWR0aCBvciByMi54ICsgcjIud2lkdGggPCByMS54IG9yIHIyLnkgPiByMS55ICsgcjEuaGVpZ2h0IG9yIHIyLnkgKyByMi5oZWlnaHQgPCByMS55KVxuXG5cdGVuYWJsZURyYWdBbmREcm9wOi0+XHRcdFxuXHRcdEBfZHJhZ0FuZERyb3BFbmFibGVkID0gdHJ1ZVx0XHRcblx0XHRAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5ID0gQF9mbG9hdGVyLmRyYWdnYWJsZS5lbmFibGVkICMgRklYTUU6IEJ1ZyBpbiBmcmFtZXIgbWFrZXMgdGhpcyByZXR1cm4gdHJ1ZSBpZiBhY2Nlc3NlZCFcblx0XHRAX2Zsb2F0ZXIuZHJhZ2dhYmxlLmVuYWJsZWQgPSB0cnVlXG5cdFx0QF9wcmV2aW91c0N1cnNvciA9IEBfZmxvYXRlci5zdHlsZS5jdXJzb3Jcblx0XHRpZiBAdXNlSGFuZEN1cnNvciB0aGVuIEBfZmxvYXRlci5zdHlsZS5jdXJzb3IgPSBcIi13ZWJraXQtZ3JhYlwiXG5cdFx0QF9ob3ZlcmVkTm9kZSA9IHVuZGVmaW5lZFxuXHRcdEBfYW5jaG9yUHJldmlvdXNseUlnbm9yZWRFdmVudHMgPSBAX2FuY2hvci5pZ25vcmVFdmVudHNcblx0XHRAX2FuY2hvci5pZ25vcmVFdmVudHMgPSBmYWxzZVxuXHRcdFxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuTW91c2VEb3duLCBAX2Zsb2F0TW91c2VEb3duXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZVVwLCBAX2Zsb2F0TW91c2VVcFxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuTW91c2VNb3ZlLCBAX2Zsb2F0TW92ZUhhbmRsZXJcdFx0XG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZU92ZXIsIEBfZmxvYXRPdmVyXHRcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLkRyYWdTdGFydCwgQF9kcmFnU3RhcnRIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5EcmFnTW92ZSwgQF9kcmFnSGFuZGxlclxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuRHJhZ0VuZCwgQF9kcmFnRW5kSGFuZGxlclx0XHRcblxuXHRkaXNhYmxlRHJhZ0FuZERyb3A6LT5cdFxuXHRcdEBfZHJhZ2dpbmcgPSBmYWxzZVx0XG5cdFx0QF9kcmFnQW5kRHJvcEVuYWJsZWQgPSBmYWxzZVx0XHRcblx0XHRAX2Zsb2F0ZXIuZHJhZ2dhYmxlLmVuYWJsZWQgPSBmYWxzZSAjIEBfcHJldmlvdXNEcmFnZ2FiaWxpdHkgIyBEb2Vzbid0IHdvcmsgYmVjYXVzZSBidWcgaW4gZnJhbWVyXG5cdFx0aWYgQHVzZUhhbmRDdXJzb3IgdGhlbiBAX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gQF9wcmV2aW91c0N1cnNvclxuXHRcdEBfYW5jaG9yLmlnbm9yZUV2ZW50cyA9IEBfYW5jaG9yUHJldmlvdXNseUlnbm9yZWRFdmVudHNcblxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLk1vdXNlRG93biwgQF9mbG9hdE1vdXNlRG93blxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLk1vdXNlVXAsIEBfZmxvYXRNb3VzZVVwXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuTW91c2VNb3ZlLCBAX2Zsb2F0TW92ZUhhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5Nb3VzZU92ZXIsIEBfZmxvYXRPdmVyXHRcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnU3RhcnQsIEBfZHJhZ1N0YXJ0SGFuZGxlclxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLkRyYWdNb3ZlLCBAX2RyYWdIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuRHJhZ0VuZCwgQF9kcmFnRW5kSGFuZGxlclx0XHRcblx0XHRcblxuXHRzbGVlcDotPlxuXHRcdEZyYW1lci5Mb29wLm9mZiBcInVwZGF0ZVwiLCBAbG9vcExpc3RlbmVyXG5cdFx0IyBkaXNhYmxlIGRyYWcgYW5kIGRyb3AsIHJlbWVtYmVyIHdoYXQgdGhlIHN0YXRlIHdhc1xuXG5cdHdha2U6LT5cblx0XHQjIHJlcXVlc3RBbmltYXRpb25GcmFtZShAbG9vcExpc3RlbmVyKVxuXG5cdFx0RnJhbWVyLkxvb3Aub24gXCJ1cGRhdGVcIiwgQGxvb3BMaXN0ZW5lclxuXG5cdFx0IyB1cGRhdGUgY29udGFjdCBwcm9wZXJ0aWVzIG9mIGxpc3RlbmVycz9cblx0XHQjIGVuYWJsZWQgZHJhZyBhbmQgZHJvcCBpZiB0aGlzIHdhcyBhY3RpdmUgYmVmb3JlXG5cblx0ZGVzdHJveTotPlxuXHRcdEBkaXNhYmxlRHJhZ0FuZERyb3AoKVxuXHRcdEBzbGVlcCgpXG5cdFx0IyB0aGF0J3MgaXQhIEkgdGhpbmsuLi5cblxuXG5cdCNcblx0I1x0RXZlbnQgSGFuZGxpbmdcblx0I1xuXG5cdCNyZXR1cm5zIGFuIGluZGV4XG5cdG9uUmFuZ2VDaGFuZ2U6IChtaW4sbWF4LGVudGVyRm4sZXhpdEZuID0gLT4pIC0+XG5cdFx0Y291bnQgPSBAX3JhbmdlTGlzdGVuZXJzLnB1c2hcblx0XHRcdG1pbjptaW5cblx0XHRcdG1heDptYXhcblx0XHRcdG1pblNxdWFyZWQ6IG1pbioqMlxuXHRcdFx0bWF4U3F1YXJlZDogbWF4KioyXG5cdFx0XHRlbnRlckNhbGxiYWNrOiBlbnRlckZuXG5cdFx0XHRleGl0Q2FsbGJhY2s6IGV4aXRGblxuXHRcdFx0ZW50ZXJlZDpmYWxzZVxuXHRcdFxuXHRcdHJldHVybiBjb3VudCAtIDFcblxuXG5cdG9mZlJhbmdlQ2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0aWYgIShpbmRleCBpbnN0YW5jZW9mIE51bWJlcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyOm9mZlJhbmdlQ2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdEBfcmFuZ2VMaXN0ZW5lcnNbaW5kZXhdID0gbnVsbFxuXG5cblx0IyBSZXR1cm5zIGluZGV4XG5cdG9uQ29udGFjdENoYW5nZTogKHN0YXJ0Rm4sZW5kRm49LT4pIC0+XHRcdFxuXHRcdGNvdW50ID0gKEBfY29sbGlzaW9uTGlzdGVuZXJzLnB1c2ggXG5cdFx0XHRjb250YWN0U3RhcnQ6c3RhcnRGblxuXHRcdFx0Y29udGFjdEVuZDplbmRGblxuXHRcdFx0Y29udGFjdDpmYWxzZSkgLSAxXHRcblxuXHRcdHJldHVybiBjb3VudFxuXG5cblx0b2ZmQ29udGFjdENoYW5nZTogKGluZGV4KSAtPlxuXHRcdGlmICEoaW5kZXggaW5zdGFuY2VvZiBOdW1iZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpcjpvZmZDb250YWN0Q2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdEBfY29sbGlzaW9uTGlzdGVuZXJzW2luZGV4XSA9IG51bGwgXHRcblxuXHQjXHRcblx0I1x0RXZlbnQgaGFuZGxpbmcgY29udmVuaWVuY2UgZnVuY3Rpb25zXG5cdCNcblxuXHRvbkRyYWdTdGFydDogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ1N0YXJ0XCIsIGZuXG5cblx0b25EcmFnRW50ZXI6IChmbiktPlxuXHRcdEBvbiBcImRyYWdFbnRlclwiLCBmblxuXG5cdG9uRHJhZ092ZXI6IChmbiktPlxuXHRcdEBvbiBcImRyYWdPdmVyXCIsIGZuXG5cblx0b25EcmFnTGVhdmU6IChmbiktPlxuXHRcdEBvbiBcImRyYWdMZWF2ZVwiLCBmblxuXG5cdG9uSW52YWxpZERyb3A6IChmbiktPlxuXHRcdEBvbiBcImludmFsaWREcm9wXCIsIGZuXG5cblx0b25Ecm9wOiAoZm4pLT5cblx0XHRAb24gXCJkcm9wXCIsIGZuXG5cblx0b25Db250YWN0RHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiY29udGFjdERyb3BcIiwgZm5cblxuXHRvbkludmFsaWRDb250YWN0RHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiaW52YWxpZENvbnRhY3REcm9wXCIsIGZuXG4iLCIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUNBQTs7QURBQTs7Ozs7Ozs7QUFBQSxJQUFBOzs7O0FBVU0sT0FBTyxDQUFDOzs7RUFJYixJQUFDLENBQUEsWUFBRCxHQUFjOztFQUVELGNBQUMsUUFBRCxFQUFZLE9BQVo7SUFBQyxJQUFDLENBQUEsV0FBRDtJQUFXLElBQUMsQ0FBQSxVQUFEOztJQUd4QixJQUFHLENBQUMsQ0FBQyxJQUFDLENBQUEsUUFBRCxZQUFxQixNQUFNLENBQUMsS0FBN0IsQ0FBSjtNQUNDLEtBQUEsQ0FBTSx3RUFBTjtBQUNBLGFBRkQ7O0lBSUEsSUFBRyxDQUFDLENBQUMsSUFBQyxDQUFBLE9BQUQsWUFBb0IsTUFBTSxDQUFDLEtBQTVCLENBQUo7TUFDQyxLQUFBLENBQU0seUVBQU47QUFDQSxhQUZEOztJQUlBLElBQUcsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEtBQW9CLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBaEM7TUFDQyxLQUFBLENBQU0sOEZBQU47QUFDQSxhQUZEOztJQUtBLElBQUMsQ0FBQSxtQkFBRCxHQUF5QjtJQUN6QixJQUFDLENBQUEsOEJBQUQsR0FBa0MsSUFBQyxDQUFBLE9BQU8sQ0FBQztJQUMzQyxJQUFDLENBQUEsWUFBRCxHQUFtQjtJQUNuQixJQUFDLENBQUEsYUFBRCxHQUFtQjtJQUNuQixJQUFDLENBQUEsU0FBRCxHQUFpQjtJQUNqQixJQUFDLENBQUEsZ0JBQUQsR0FBc0I7SUFDdEIsSUFBQyxDQUFBLGVBQUQs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
