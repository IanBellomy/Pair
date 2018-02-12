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
      return function(event, layer) {};
    })(this);
    this._floatMouseUp = (function(_this) {
      return function(event, layer) {};
    })(this);
    this._floatOver = (function(_this) {
      return function(event, layer) {};
    })(this);
    this._dragStartHandler = (function(_this) {
      return function(event, layer) {
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
      return function(event, layer) {};
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2lhbmJlbGxvbXkvU2l0ZXMvdGVzdC8wMV9kcmFnQW5kRHJvcC5mcmFtZXIvbW9kdWxlcy9QYWlyLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIyMjXG5cblx0UGFpciBtb2R1bGVcblxuXHRTZWUgcmVhZG1lLm1kXG5cblx04oCUIElhbiBCZWxsb215LCAyMDE3XG5cdFxuIyMjXG5cblxuXG5jbGFzcyBleHBvcnRzLlBhaXIgZXh0ZW5kcyBGcmFtZXIuRXZlbnRFbWl0dGVyXG5cblx0IyBzdGF0aWMgcHJvcGVydGllc1xuXG5cdEBkcmFnZ2VkSXRlbXM6W11cdFx0XHRcblxuXHRjb25zdHJ1Y3RvcjogKEBfZmxvYXRlciwgQF9hbmNob3IpIC0+XHRcdFxuXHRcdFxuXHRcdGlmIEZyYW1lci5WZXJzaW9uLmRhdGUgPCAxNDk5MjQzMjgyXHRcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJQYWlyIE1vZHVsZSByZXF1aXJlcyBGcmFtZXIgTGlicmFyeSB1cGRhdGVcIilcblxuXHRcdCMgdmFsaWRhdGVcblx0XHRpZiAhKEBfZmxvYXRlciBpbnN0YW5jZW9mIEZyYW1lci5MYXllcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIExheWVyLlwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdGlmICEoQF9hbmNob3IgaW5zdGFuY2VvZiBGcmFtZXIuTGF5ZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIHNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGEgTGF5ZXIuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0aWYgQF9mbG9hdGVyLnBhcmVudCAhPSBAX2FuY2hvci5wYXJlbnRcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgZmlyc3QgYW5kIHNlY29uZCBhcmd1bWVudHMgbXVzdCBoYXZlIHRoZSBzYW1lIHBhcmVudC5cIlxuXHRcdFx0cmV0dXJuXG5cblx0XHQjICdwcml2YXRlJyBwcm9wZXJ0aWVzXHRcdFxuXHRcdEBfZHJhZ0FuZERyb3BFbmFibGVkIFx0ID0gZmFsc2Vcblx0XHRAX2FuY2hvclByZXZpb3VzbHlJZ25vcmVkRXZlbnRzID0gQF9hbmNob3IuaWdub3JlRXZlbnRzXG5cdFx0QF9ob3ZlcmVkTm9kZSBcdFx0XHQ9IHVuZGVmaW5lZFxuXHRcdEBfaXNPdmVyQW5jaG9yXHRcdFx0PSBmYWxzZVx0XHRcdCMgYXJlIHdlIG92ZXIgdGhpcyBhbmNob3Jcblx0XHRAX2RyYWdnaW5nIFx0XHRcdFx0PSBmYWxzZVxuXHRcdEBfdmFsaWREcmFnVGFyZ2V0IFx0XHQ9IGZhbHNlXHRcdFx0IyBhcmUgd2Ugb3ZlciBhbnkgdmFsaWQgYW5jaG9yIC8gZHJvcCB0YXJnZXRcblx0XHRAX3ByZXZpb3VzQ3Vyc29yIFx0XHQ9IEBfZmxvYXRlci5zdHlsZS5jdXJzb3Jcblx0XHRAdXNlSGFuZEN1cnNvclx0XHRcdD0gdHJ1ZVxuXHRcdEBfcHJldmlvdXNEcmFnZ2FiaWxpdHkgXHQ9IGZhbHNlXG5cdFx0QF9yYW5nZUxpc3RlbmVycyBcdFx0PSBbXVx0XHRcblx0XHRAX2NvbGxpc2lvbkxpc3RlbmVycyBcdD0gW11cdFxuXHRcdEBfdGVtcFJhbmdlIFx0XHRcdD0gdW5kZWZpbmVkXG5cdFx0QF9jb250YWluZWQgXHRcdFx0PSBmYWxzZVxuXHRcdEBfdGVtcExpc3RlbmVyIFx0XHRcdD0ge31cdFx0XG5cdFx0QF9weFx0XHRcdFx0XHQ9IDBcblx0XHRAX3B5IFx0XHRcdFx0XHQ9IDBcblx0XHRAX2RTcXVhcmVkID0gQGdldERpc3RhbmNlU3F1YXJlZCgpXG5cdFx0XG5cdFx0IyBXZSB3YW50IHRoZXNlIGV2ZW50IGhhbmRsZXIgbWV0aG9kcyB0byBiZSBzY29wZWQgdG8gdGhlIFBhaXIgaW5zdGFuY2Ugd2hlbiB0aGV5IHJ1biwgc28gdGhleSdyZSBoZXJlXG5cdFx0QF9mbG9hdE1vdXNlRG93biA9IChldmVudCxsYXllcik9PlxuXHRcdFx0IyBAX3BhdXNlRXZlbnQoZXZlbnQpXG5cdFx0XHQjIGlmIEB1c2VIYW5kQ3Vyc29yIHRoZW4gQF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiYmluZ1wiXG5cdFx0XG5cdFx0QF9mbG9hdE1vdXNlVXAgPSAoZXZlbnQsbGF5ZXIpPT5cdFx0XHRcblx0XHRcdCMgQF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFx0IyBpZiBAdXNlSGFuZEN1cnNvciB0aGVuIEBfZmxvYXRlci5zdHlsZS5jdXJzb3IgPSBcIi13ZWJraXQtZ3JhYlwiXG5cdFx0XHRcblx0XHRAX2Zsb2F0T3ZlciA9IChldmVudCxsYXllcikgPT5cdFx0XHRcblx0XHRcdCMgQF9wYXVzZUV2ZW50KGV2ZW50KVxuXHRcdFxuXHRcdEBfZHJhZ1N0YXJ0SGFuZGxlcj0gKGV2ZW50LGxheWVyKSA9Plx0XHRcdFxuXHRcdFx0IyBAX3BhdXNlRXZlbnQoZXZlbnQpXHRcdFx0XG5cdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXHRcdFx0XG5cdFx0XHRAX2RyYWdnaW5nID0gdHJ1ZVxuXHRcdFx0UGFpci5kcmFnZ2VkSXRlbXMucHVzaCBAX2Zsb2F0ZXJcblx0XHRcdCMgQF9mbG9hdGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIlxuXHRcdFx0QF9mbG9hdGVyLnZpc2libGUgPSBmYWxzZVx0XHRcdFxuXHRcdFx0QF9ob3ZlcmVkTm9kZSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY29udGV4dFBvaW50LngsIGV2ZW50LmNvbnRleHRQb2ludC55KVxuXHRcdFx0QF9pc092ZXJBbmNob3IgPSBAX2FuY2hvci5fZWxlbWVudC5jb250YWlucyhAX2hvdmVyZWROb2RlKVxuXHRcdFx0QF9mbG9hdGVyLnZpc2libGUgPSB0cnVlXG5cdFx0XHRAZW1pdCBcImRyYWdTdGFydFwiLCBAX2Zsb2F0ZXJcblx0XG5cdFx0QF9kcmFnSGFuZGxlcj0oZXZlbnQpID0+XG5cdFx0XHQjIEBfcGF1c2VFdmVudChldmVudClcdFx0XHRcblx0XHRcdEBfZmxvYXRlci52aXNpYmxlID0gZmFsc2VcdFx0XHRcblx0XHRcdEBfcHggPSBldmVudC5jb250ZXh0UG9pbnQueFxuXHRcdFx0QF9weSA9IGV2ZW50LmNvbnRleHRQb2ludC55XG5cdFx0XHRub2RlVW5kZXJuZWF0aCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY29udGV4dFBvaW50LngsIGV2ZW50LmNvbnRleHRQb2ludC55KVxuXHRcdFx0QF9mbG9hdGVyLnZpc2libGUgPSB0cnVlXG5cdFx0XHRpc05vd092ZXJBbmNob3IgPSBAX2FuY2hvci5fZWxlbWVudC5jb250YWlucyhub2RlVW5kZXJuZWF0aClcdFx0XHRcblx0XHRcdGlmIGlzTm93T3ZlckFuY2hvciBhbmQgbm90IEBfaXNPdmVyQW5jaG9yXG5cdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gdHJ1ZVx0XHRcdFx0XHRcblx0XHRcdFx0QF9pc092ZXJBbmNob3IgPSB0cnVlXG5cdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFx0XHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiZHJhZ0VudGVyXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdGVsc2UgaWYgbm90IGlzTm93T3ZlckFuY2hvciBhbmQgQF9pc092ZXJBbmNob3Jcblx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVx0XHRcdFx0XG5cdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFxuXHRcdFx0XHRAX2lzT3ZlckFuY2hvciA9IGZhbHNlXG5cdFx0XHRcdEBlbWl0IFwiZHJhZ0xlYXZlXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdGVsc2UgaWYgaXNOb3dPdmVyQW5jaG9yIGFuZCBAX2lzT3ZlckFuY2hvciBhbmQgQF92YWxpZERyYWdUYXJnZXRcblx0XHRcdFx0QGVtaXQgXCJkcmFnT3ZlclwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFxuXHRcdEBfZHJhZ0VuZEhhbmRsZXI9KGV2ZW50LCBsYXllcikgPT5cblx0XHRcdEBfZHJhZ2dpbmcgPSBmYWxzZVx0XHRcdFxuXHRcdFx0aW5kZXggPSBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIEBfZmxvYXRlclxuXHRcdFx0UGFpci5kcmFnZ2VkSXRlbXMuc3BsaWNlKGluZGV4LDEpXG5cdFx0XHQjIGlmIEB1c2VIYW5kQ3Vyc29yIHRoZW4gQF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiXCJcblx0XHRcdGlmIEBfdmFsaWREcmFnVGFyZ2V0XHRcdFx0XHRcblx0XHRcdFx0QGVtaXQgXCJkcm9wXCIsIEBfZmxvYXRlciwgQF9hbmNob3Jcblx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuXHRcdFx0ZWxzZVx0XHRcdFxuXHRcdFx0XHRAZW1pdCBcImludmFsaWREcm9wXCIsIEBfZmxvYXRlclxuXHRcblx0XHRcdGlmIEBoaXRUZXN0KClcblx0XHRcdFx0QGVtaXQgXCJjb250YWN0RHJvcFwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cdFx0XHRlbHNlIFxuXHRcdFx0XHRAZW1pdCBcImludmFsaWRDb250YWN0RHJvcFwiLCBAX2Zsb2F0ZXJcblx0XHRcdFx0XG5cdFx0QF9mbG9hdE1vdmVIYW5kbGVyID0gKGV2ZW50LGxheWVyKSA9PlxuXHRcdFx0IyBAX3BhdXNlRXZlbnQoZXZlbnQpXG5cdFx0XHRcbiMgXHRcdEBfYW5jaG9yTW91c2VPdmVyPShldmVudCxsYXllcik9PlxuIyBcdFx0XHRpZiBAX2RyYWdnaW5nICBcbiMgXHRcdFx0XHRub2RlVW5kZXJuZWF0aCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcbiMgXHRcdFx0XHRpZiBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIEBfZmxvYXRlciBpc250IC0xIGFuZCBAX2hvdmVyZWROb2RlICE9IG5vZGVVbmRlcm5lYXRoXG4jIFx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IHRydWVcbiMgXHRcdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBub2RlVW5kZXJuZWF0aFxuIyBcdFx0XHRcdFx0cHJpbnQgXCJuZXcgbm9kZT9cIlxuIyBcdFx0XHRcdFx0cHJpbnQgQF9ob3ZlcmVkTm9kZSA9PSBub2RlVW5kZXJuZWF0aFxuIyBcdFx0XHRcdFx0QGVtaXQgXCJkcmFnRW50ZXJcIiwgQF9mbG9hdGVyLCBAX2FuY2hvclxuIyBcdFx0XHRcdFx0XG4jIFx0XG4jIFx0XHRAX2FuY2hvck1vdXNlT3V0PShldmVudCxsYXllcik9Plx0XHRcbiMgXHRcdFx0QF9wYXVzZUV2ZW50KGV2ZW50KVxuIyBcdFx0XHRpZiBAX2RyYWdnaW5nIFxuIyBcdFx0XHRcdGlmIFBhaXIuZHJhZ2dlZEl0ZW1zLmluZGV4T2YgQF9mbG9hdGVyIGlzbnQgLTFcbiMgXHRcdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gZmFsc2VcbiMgXHRcdFx0XHRcdEBfaG92ZXJlZE5vZGUgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpXG4jIFx0XHRcdFx0XHRAZW1pdCBcImRyYWdMZWF2ZVwiLCBAX2Zsb2F0ZXIsIEBfYW5jaG9yXG5cblx0XHRcblx0XHQjIHJlYWR5IVxuXHRcdEB3YWtlKClcblx0XHRcblx0XHQjXG5cdFx0IyBlbmQgY29uc3RydWN0b3Jcblx0XHQjXG5cdFxuXG5cdF9wYXVzZUV2ZW50OihldmVudCktPlxuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdGV2ZW50LmNhbmNlbEJ1YmJsZT10cnVlXG5cdFx0ZXZlbnQucmV0dXJuVmFsdWU9ZmFsc2Vcblx0XHRcblx0I3Nob3VsZCBtdWx0aXBsZSBQYWlycyBiZSBoYW5kbGVkIGluIHRoZSBzYW1lIGxpc3RlbmVyP1xuXHRsb29wTGlzdGVuZXI6ID0+XG5cdFx0QF9kU3F1YXJlZCA9IEBnZXREaXN0YW5jZVNxdWFyZWQoKVxuXHRcdGZvciBAX3RlbXBSYW5nZSBpbiBAX3JhbmdlTGlzdGVuZXJzICBcblx0XHRcdEBfY29udGFpbmVkID0gQF90ZW1wUmFuZ2UubWluU3F1YXJlZCA8PSBAX2RTcXVhcmVkIDw9IEBfdGVtcFJhbmdlLm1heFNxdWFyZWQgXG5cdFx0XHRpZiBAX2NvbnRhaW5lZCBhbmQgbm90IEBfdGVtcFJhbmdlLmVudGVyZWQgXG5cdFx0XHRcdEBfdGVtcFJhbmdlLmVudGVyZWQgPSB0cnVlXG5cdFx0XHRcdEBfdGVtcFJhbmdlLmVudGVyQ2FsbGJhY2suYXBwbHkgQFxuXHRcdFx0XHRcblx0XHRcdGVsc2UgaWYgbm90IEBfY29udGFpbmVkIGFuZCBAX3RlbXBSYW5nZS5lbnRlcmVkXG5cdFx0XHRcdEBfdGVtcFJhbmdlLmVudGVyZWQgPSBmYWxzZVxuXHRcdFx0XHRAX3RlbXBSYW5nZS5leGl0Q2FsbGJhY2suYXBwbHkgQFx0XHRcdFxuXG5cdFx0aWYgQGhpdFRlc3QoKVxuXHRcdFx0Zm9yIEBfdGVtcExpc3RlbmVyIGluIEBfY29sbGlzaW9uTGlzdGVuZXJzXG5cdFx0XHRcdEBfdGVtcExpc3RlbmVyLmNvbnRhY3QrKyB8fCBAX3RlbXBMaXN0ZW5lci5jb250YWN0U3RhcnQoQF9mbG9hdGVyLEBfYW5jaG9yKVxuXHRcdFx0XHRcblx0XHRlbHNlXG5cdFx0XHRmb3IgQF90ZW1wTGlzdGVuZXIgaW4gQF9jb2xsaXNpb25MaXN0ZW5lcnNcblx0XHRcdFx0aWYoQF90ZW1wTGlzdGVuZXIuY29udGFjdClcblx0XHRcdFx0XHRAX3RlbXBMaXN0ZW5lci5jb250YWN0ID0gZmFsc2Vcblx0XHRcdFx0XHRAX3RlbXBMaXN0ZW5lci5jb250YWN0RW5kKEBfZmxvYXRlcixAX2FuY2hvcilcblx0XHRcblx0XHRcblx0XHQjIHJlcXVlc3RBbmltYXRpb25GcmFtZShAbG9vcExpc3RlbmVyKVxuXHRcblx0Z2V0RGlzdGFuY2U6IC0+XG5cdFx0cmV0dXJuIE1hdGguc3FydCgoQF9mbG9hdGVyLm1pZFgtQF9hbmNob3IubWlkWCkqKjIgKyAoQF9mbG9hdGVyLm1pZFktQF9hbmNob3IubWlkWSkqKjIpXG5cdFxuXHRnZXREaXN0YW5jZVNxdWFyZWQ6IC0+XG5cdFx0cmV0dXJuIChAX2Zsb2F0ZXIubWlkWC1AX2FuY2hvci5taWRYKSoqMiArIChAX2Zsb2F0ZXIubWlkWS1AX2FuY2hvci5taWRZKSoqMlxuXHRcblx0c2V0RGlzdGFuY2U6KG5ld0Rpc3RhbmNlKS0+XG5cdFx0ZGlzdGFuY2VEaWZmUmF0aW8gPSBuZXdEaXN0YW5jZS8gTWF0aC5zcXJ0KEBfZFNxdWFyZWQpXG5cblx0XHRvbGRYT2Zmc2V0ID0gQF9mbG9hdGVyLm1pZFggLSBAX2FuY2hvci5taWRYXG5cdFx0bmV3WE9mZnNldCA9IG9sZFhPZmZzZXQgKiBkaXN0YW5jZURpZmZSYXRpb1xuXHRcdEBfZmxvYXRlci5taWRYID0gQF9hbmNob3IubWlkWCArIG5ld1hPZmZzZXRcblxuXHRcdG9sZFlPZmZzZXQgPSBAX2Zsb2F0ZXIubWlkWSAtIEBfYW5jaG9yLm1pZFlcblx0XHRuZXdZT2Zmc2V0ID0gb2xkWU9mZnNldCAqIGRpc3RhbmNlRGlmZlJhdGlvXG5cdFx0QF9mbG9hdGVyLm1pZFkgPSBAX2FuY2hvci5taWRZICsgbmV3WU9mZnNldFxuXG5cdFxuXHQjIHRoZSBjby1vcmRpbmF0ZXMgYmV0d2VlbiB0aGUgYW5jaG9yIGFuZCBmbG9hdGVyXG5cdG1pZHBvaW50OiAtPlxuXHRcdHJldHVybiBbKEBfYW5jaG9yLm1pZFggKyBAX2Zsb2F0ZXIubWlkWCkvMi4wLChAX2FuY2hvci5taWRZICsgQF9mbG9hdGVyLm1pZFkpLzIuMF1cblx0XG5cdCNyZXR1cm5zIHRydWUgaWYgdGhlIGFuY2hvciBhbmQgZmxvYXRlciBmcmFtZXMgdG91Y2hcdFx0XG5cdGhpdFRlc3Q6LT5cblx0XHRyMSA9IEBfYW5jaG9yXG5cdFx0cjIgPSBAX2Zsb2F0ZXJcblx0XHRyZXR1cm4gISggcjIueCA+IHIxLnggKyByMS53aWR0aCBvciByMi54ICsgcjIud2lkdGggPCByMS54IG9yIHIyLnkgPiByMS55ICsgcjEuaGVpZ2h0IG9yIHIyLnkgKyByMi5oZWlnaHQgPCByMS55KVxuXG5cdGVuYWJsZURyYWdBbmREcm9wOi0+XHRcdFxuXHRcdEBfZHJhZ0FuZERyb3BFbmFibGVkID0gdHJ1ZVx0XHRcblx0XHRAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5ID0gQF9mbG9hdGVyLmRyYWdnYWJsZS5lbmFibGVkICMgRklYTUU6IEJ1ZyBpbiBmcmFtZXIgbWFrZXMgdGhpcyByZXR1cm4gdHJ1ZSBpZiBhY2Nlc3NlZCFcblx0XHRAX2Zsb2F0ZXIuZHJhZ2dhYmxlLmVuYWJsZWQgPSB0cnVlXG5cdFx0QF9wcmV2aW91c0N1cnNvciA9IEBfZmxvYXRlci5zdHlsZS5jdXJzb3Jcblx0XHQjIGlmIEB1c2VIYW5kQ3Vyc29yIHRoZW4gQF9mbG9hdGVyLnN0eWxlLmN1cnNvciA9IFwiLXdlYmtpdC1ncmFiXCJcblx0XHRAX2hvdmVyZWROb2RlID0gdW5kZWZpbmVkXG5cdFx0QF9hbmNob3JQcmV2aW91c2x5SWdub3JlZEV2ZW50cyA9IEBfYW5jaG9yLmlnbm9yZUV2ZW50c1xuXHRcdEBfYW5jaG9yLmlnbm9yZUV2ZW50cyA9IGZhbHNlXG5cdFx0XG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZURvd24sIEBfZmxvYXRNb3VzZURvd25cblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlVXAsIEBfZmxvYXRNb3VzZVVwXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5Nb3VzZU1vdmUsIEBfZmxvYXRNb3ZlSGFuZGxlclx0XHRcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLk1vdXNlT3ZlciwgQF9mbG9hdE92ZXJcdFxuXHRcdEBfZmxvYXRlci5vbiBFdmVudHMuRHJhZ1N0YXJ0LCBAX2RyYWdTdGFydEhhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub24gRXZlbnRzLkRyYWdNb3ZlLCBAX2RyYWdIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9uIEV2ZW50cy5EcmFnRW5kLCBAX2RyYWdFbmRIYW5kbGVyXHRcdFxuXG5cdGRpc2FibGVEcmFnQW5kRHJvcDotPlx0XG5cdFx0QF9kcmFnZ2luZyA9IGZhbHNlXHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IGZhbHNlXHRcdFxuXHRcdEBfZmxvYXRlci5kcmFnZ2FibGUuZW5hYmxlZCA9IGZhbHNlICMgQF9wcmV2aW91c0RyYWdnYWJpbGl0eSAjIERvZXNuJ3Qgd29yayBiZWNhdXNlIGJ1ZyBpbiBmcmFtZXJcblx0XHRpZiBAdXNlSGFuZEN1cnNvciB0aGVuIEBfZmxvYXRlci5zdHlsZS5jdXJzb3IgPSBAX3ByZXZpb3VzQ3Vyc29yXG5cdFx0QF9hbmNob3IuaWdub3JlRXZlbnRzID0gQF9hbmNob3JQcmV2aW91c2x5SWdub3JlZEV2ZW50c1xuXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuTW91c2VEb3duLCBAX2Zsb2F0TW91c2VEb3duXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuTW91c2VVcCwgQF9mbG9hdE1vdXNlVXBcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5Nb3VzZU1vdmUsIEBfZmxvYXRNb3ZlSGFuZGxlclxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLk1vdXNlT3ZlciwgQF9mbG9hdE92ZXJcdFxuXHRcdEBfZmxvYXRlci5vZmYgRXZlbnRzLkRyYWdTdGFydCwgQF9kcmFnU3RhcnRIYW5kbGVyXG5cdFx0QF9mbG9hdGVyLm9mZiBFdmVudHMuRHJhZ01vdmUsIEBfZHJhZ0hhbmRsZXJcblx0XHRAX2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnRW5kLCBAX2RyYWdFbmRIYW5kbGVyXHRcdFxuXHRcdFxuXG5cdHNsZWVwOi0+XG5cdFx0RnJhbWVyLkxvb3Aub2ZmIFwidXBkYXRlXCIsIEBsb29wTGlzdGVuZXJcblx0XHQjIGRpc2FibGUgZHJhZyBhbmQgZHJvcCwgcmVtZW1iZXIgd2hhdCB0aGUgc3RhdGUgd2FzXG5cblx0d2FrZTotPlxuXHRcdCMgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKEBsb29wTGlzdGVuZXIpXG5cblx0XHRGcmFtZXIuTG9vcC5vbiBcInVwZGF0ZVwiLCBAbG9vcExpc3RlbmVyXG5cblx0XHQjIHVwZGF0ZSBjb250YWN0IHByb3BlcnRpZXMgb2YgbGlzdGVuZXJzP1xuXHRcdCMgZW5hYmxlZCBkcmFnIGFuZCBkcm9wIGlmIHRoaXMgd2FzIGFjdGl2ZSBiZWZvcmVcblxuXHRkZXN0cm95Oi0+XG5cdFx0QGRpc2FibGVEcmFnQW5kRHJvcCgpXG5cdFx0QHNsZWVwKClcblx0XHQjIHRoYXQncyBpdCEgSSB0aGluay4uLlxuXG5cblx0I1xuXHQjXHRFdmVudCBIYW5kbGluZ1xuXHQjXG5cblx0I3JldHVybnMgYW4gaW5kZXhcblx0b25SYW5nZUNoYW5nZTogKG1pbixtYXgsZW50ZXJGbixleGl0Rm4gPSAtPikgLT5cblx0XHRjb3VudCA9IEBfcmFuZ2VMaXN0ZW5lcnMucHVzaFxuXHRcdFx0bWluOm1pblxuXHRcdFx0bWF4Om1heFxuXHRcdFx0bWluU3F1YXJlZDogbWluKioyXG5cdFx0XHRtYXhTcXVhcmVkOiBtYXgqKjJcblx0XHRcdGVudGVyQ2FsbGJhY2s6IGVudGVyRm5cblx0XHRcdGV4aXRDYWxsYmFjazogZXhpdEZuXG5cdFx0XHRlbnRlcmVkOmZhbHNlXG5cdFx0XG5cdFx0cmV0dXJuIGNvdW50IC0gMVxuXG5cblx0b2ZmUmFuZ2VDaGFuZ2U6IChpbmRleCkgLT5cblx0XHRpZiAhKGluZGV4IGluc3RhbmNlb2YgTnVtYmVyKVxuXHRcdFx0cHJpbnQgXCJFUlJPUiAtIFBhaXI6b2ZmUmFuZ2VDaGFuZ2UoaW5kZXgpLCBpbmRleCBtdXN0IGJlIGEgTnVtYmVyXCJcblx0XHRcdHJldHVyblxuXG5cdFx0QF9yYW5nZUxpc3RlbmVyc1tpbmRleF0gPSBudWxsXG5cblxuXHQjIFJldHVybnMgaW5kZXhcblx0b25Db250YWN0Q2hhbmdlOiAoc3RhcnRGbixlbmRGbj0tPikgLT5cdFx0XG5cdFx0Y291bnQgPSAoQF9jb2xsaXNpb25MaXN0ZW5lcnMucHVzaCBcblx0XHRcdGNvbnRhY3RTdGFydDpzdGFydEZuXG5cdFx0XHRjb250YWN0RW5kOmVuZEZuXG5cdFx0XHRjb250YWN0OmZhbHNlKSAtIDFcdFxuXG5cdFx0cmV0dXJuIGNvdW50XG5cblxuXHRvZmZDb250YWN0Q2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0aWYgIShpbmRleCBpbnN0YW5jZW9mIE51bWJlcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyOm9mZkNvbnRhY3RDaGFuZ2UoaW5kZXgpLCBpbmRleCBtdXN0IGJlIGEgTnVtYmVyXCJcblx0XHRcdHJldHVyblxuXG5cdFx0QF9jb2xsaXNpb25MaXN0ZW5lcnNbaW5kZXhdID0gbnVsbCBcdFxuXG5cdCNcdFxuXHQjXHRFdmVudCBoYW5kbGluZyBjb252ZW5pZW5jZSBmdW5jdGlvbnNcblx0I1xuXG5cdG9uRHJhZ1N0YXJ0OiAoZm4pLT5cblx0XHRAb24gXCJkcmFnU3RhcnRcIiwgZm5cblxuXHRvbkRyYWdFbnRlcjogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ0VudGVyXCIsIGZuXG5cblx0b25EcmFnT3ZlcjogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ092ZXJcIiwgZm5cblxuXHRvbkRyYWdMZWF2ZTogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ0xlYXZlXCIsIGZuXG5cblx0b25JbnZhbGlkRHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiaW52YWxpZERyb3BcIiwgZm5cblxuXHRvbkRyb3A6IChmbiktPlxuXHRcdEBvbiBcImRyb3BcIiwgZm5cblxuXHRvbkNvbnRhY3REcm9wOiAoZm4pLT5cblx0XHRAb24gXCJjb250YWN0RHJvcFwiLCBmblxuXG5cdG9uSW52YWxpZENvbnRhY3REcm9wOiAoZm4pLT5cblx0XHRAb24gXCJpbnZhbGlkQ29udGFjdERyb3BcIiwgZm5cbiIsIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQ0FBOztBREFBOzs7Ozs7OztBQUFBLElBQUE7Ozs7QUFZTSxPQUFPLENBQUM7OztFQUliLElBQUMsQ0FBQSxZQUFELEdBQWM7O0VBRUQsY0FBQyxRQUFELEVBQVksT0FBWjtJQUFDLElBQUMsQ0FBQSxXQUFEO0lBQVcsSUFBQyxDQUFBLFVBQUQ7O0lBRXhCLElBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFmLEdBQXNCLFVBQXpCO0FBQ0MsWUFBVSxJQUFBLFNBQUEsQ0FBVSw0Q0FBVixFQURYOztJQUlBLElBQUcsQ0FBQyxDQUFDLElBQUMsQ0FBQSxRQUFELFlBQXFCLE1BQU0sQ0FBQyxLQUE3QixDQUFKO01BQ0MsS0FBQSxDQUFNLHdFQUFOO0FBQ0EsYUFGRDs7SUFJQSxJQUFHLENBQUMsQ0FBQyxJQUFDLENBQUEsT0FBRCxZQUFvQixNQUFNLENBQUMsS0FBNUIsQ0FBSjtNQUNDLEtBQUEsQ0FBTSx5RUFBTjtBQUNBLGFBRkQ7O0lBSUEsSUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYs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
