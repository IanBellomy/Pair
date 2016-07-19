require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Pair":[function(require,module,exports){

/*

	Pair module

	See readme.md

	— Ian Bellomy, 2016
 */
var makePairs,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

exports.Pair = (function(superClass) {
  var _dragAndDropEnabled, _dragging, _hoveredNode, _previousDraggability, _previousPointerEvents, _validDragTarget;

  extend(Pair, superClass);

  Pair.draggedItems = [];

  _dragAndDropEnabled = false;

  _hoveredNode = void 0;

  _dragging = false;

  _validDragTarget = false;

  _previousPointerEvents = "auto";

  _previousDraggability = false;

  Pair.prototype.rangeListeners = [];

  Pair.prototype.angleListeners = [];

  Pair.prototype.collisionListeners = [];

  Pair.prototype.tempRange = void 0;

  Pair.prototype.dSquared = 0;

  Pair.prototype.contained = false;

  Pair.prototype.tempListener = {};

  function Pair(floater, anchor1) {
    var dSquared;
    this.floater = floater;
    this.anchor = anchor1;
    this.loopListener = bind(this.loopListener, this);
    if (this.floater.parent !== this.anchor.parent) {
      print("ERROR:Pair.coffee:Pair:constructor,  @floater and @anchor must have the same parent.");
      return;
    }
    dSquared = this.getDistanceSquared();
    this.wake();
    this.dragStartHandler = (function(_this) {
      return function(event, layer) {
        _this._validDragTarget = false;
        _this._previousPointerEvents = _this.floater.style.pointerEvents;
        _this._dragging = true;
        Pair.draggedItems.push(_this.floater);
        _this.floater.visible = false;
        _this._hoveredNode = document.elementFromPoint(event.clientX, event.clientY);
        _this.floater.visible = true;
        return _this.emit("dragStart", _this.floater);
      };
    })(this);
    this.dragHandler = (function(_this) {
      return function(event) {
        var nodeUnderneath;
        _this.floater.visible = false;
        nodeUnderneath = document.elementFromPoint(event.clientX, event.clientY);
        _this.floater.visible = true;
        if (nodeUnderneath !== _this._hoveredNode) {
          if (_this.anchor._element === nodeUnderneath) {
            _this._validDragTarget = true;
            _this._hoveredNode = nodeUnderneath;
            return _this.emit("dragEnter", _this.floater, _this.anchor);
          } else if (_this._hoveredNode === _this.anchor._element) {
            _this._validDragTarget = false;
            _this._hoveredNode = nodeUnderneath;
            return _this.emit("dragLeave", _this.floater, _this.anchor);
          }
        } else if (_this._validDragTarget) {
          return _this.emit("dragOver", _this.floater, _this.anchor);
        }
      };
    })(this);
    this.dragEndHandler = (function(_this) {
      return function(event, layer) {
        var index;
        _this._dragging = false;
        index = Pair.draggedItems.indexOf(_this.floater);
        Pair.draggedItems.splice(index, 1);
        if (_this._validDragTarget) {
          _this.emit("drop", _this.floater, _this.anchor);
          return _this._validDragTarget = false;
        } else {
          return _this.emit("invalidDrop", _this.floater);
        }
      };
    })(this);
    this.anchorMouseOver = (function(_this) {
      return function(event, layer) {
        if (_this._dragging) {
          if (Pair.draggedItems.indexOf(_this.floater !== -1)) {
            _this._validDragTarget = true;
            return _this.emit("dragEnter", _this.floater, _this.anchor);
          }
        }
      };
    })(this);
    this.anchorMouseOut = (function(_this) {
      return function(event, layer) {
        if (_this._dragging) {
          if (Pair.draggedItems.indexOf(_this.floater !== -1)) {
            _this._validDragTarget = false;
            return _this.emit("dragLeave", _this.floater, _this.anchor);
          }
        }
      };
    })(this);
  }

  Pair.prototype.loopListener = function() {
    var i, j, k, len, len1, len2, ref, ref1, ref2, ref3, results, results1;
    this.dSquared = this.getDistanceSquared();
    ref = this.rangeListeners;
    for (i = 0, len = ref.length; i < len; i++) {
      this.tempRange = ref[i];
      this.contained = (this.tempRange.minSquared <= (ref1 = this.dSquared) && ref1 <= this.tempRange.maxSquared);
      if (this.contained && !this.tempRange.entered) {
        this.tempRange.entered = true;
        this.tempRange.enterCallback.apply(this);
      } else if (!this.contained && this.tempRange.entered) {
        this.tempRange.entered = false;
        this.tempRange.exitCallback.apply(this);
      }
    }
    if (this.hitTest()) {
      ref2 = this.collisionListeners;
      results = [];
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        this.tempListener = ref2[j];
        results.push(this.tempListener.contact++ || this.tempListener.contactStart(this.anchor, this.floater));
      }
      return results;
    } else {
      ref3 = this.collisionListeners;
      results1 = [];
      for (k = 0, len2 = ref3.length; k < len2; k++) {
        this.tempListener = ref3[k];
        if (this.tempListener.contact) {
          this.tempListener.contact = false;
          results1.push(this.tempListener.contactEnd(this.anchor, this.floater));
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    }
  };

  Pair.prototype.onRangeChange = function(min, max, enterFn, exitFn) {
    var count;
    if (exitFn == null) {
      exitFn = function() {};
    }
    count = this.rangeListeners.push({
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
    return this.rangeListeners[index] = null;
  };

  Pair.prototype.onContactChange = function(startFn, endFn) {
    var count;
    if (endFn == null) {
      endFn = function() {};
    }
    count = (this.collisionListeners.push({
      contactStart: startFn,
      contactEnd: endFn,
      contact: false
    })) - 1;
    return count;
  };

  Pair.prototype.offContactChange = function(index) {
    return this.collisionListeners[index] = null;
  };

  Pair.prototype.getDistance = function() {
    return Math.sqrt(Math.pow(this.floater.midX - this.anchor.midX, 2) + Math.pow(this.floater.midY - this.anchor.midY, 2));
  };

  Pair.prototype.getDistanceSquared = function() {
    return Math.pow(this.floater.midX - this.anchor.midX, 2) + Math.pow(this.floater.midY - this.anchor.midY, 2);
  };

  Pair.prototype.setDistance = function(newDistance) {
    var distanceDiffRatio, newXOffset, newYOffset, oldXOffset, oldYOffset;
    distanceDiffRatio = newDistance / Math.sqrt(this.dSquared);
    oldXOffset = this.floater.midX - this.anchor.midX;
    newXOffset = oldXOffset * distanceDiffRatio;
    this.floater.midX = this.anchor.midX + newXOffset;
    oldYOffset = this.floater.midY - this.anchor.midY;
    newYOffset = oldYOffset * distanceDiffRatio;
    return this.floater.midY = this.anchor.midY + newYOffset;
  };

  Pair.prototype.midpoint = function() {
    return [(this.anchor.midX + this.floater.midX) / 2.0, (this.anchor.midY + this.floater.midY) / 2.0];
  };

  Pair.prototype.hitTest = function() {
    var r1, r2;
    r1 = this.anchor;
    r2 = this.floater;
    return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
  };

  Pair.prototype.enableDragAndDrop = function() {
    this._dragAndDropEnabled = true;
    this._previousDraggability = this.floater.draggable;
    this.floater.draggable = true;
    this._hoveredNode = void 0;
    this.floater.on(Events.DragStart, this.dragStartHandler);
    this.floater.on(Events.DragMove, this.dragHandler);
    this.floater.on(Events.DragEnd, this.dragEndHandler);
    this.anchor.on(Events.MouseOver, this.anchorMouseOver);
    return this.anchor.on(Events.MouseOut, this.anchorMouseOut);
  };

  Pair.prototype.disableDragAndDrop = function() {
    this._dragging = false;
    this._dragAndDropEnabled = false;
    this.floater.draggable = this._previousDraggability;
    print(this._previousDraggability);
    this.floater.off(Events.DragStart, this.dragStartHandler);
    this.floater.off(Events.DragMove, this.dragHandler);
    this.floater.off(Events.DragEnd, this.dragEndHandler);
    this.anchor.off(Events.MouseOver, this.anchorMouseOver);
    return this.anchor.off(Events.MouseOut, this.anchorMouseOut);
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

  return Pair;

})(Framer.EventEmitter);

makePairs = function(float, anchors) {
  var anchor, i, len, p, pairs;
  pairs = [];
  for (i = 0, len = anchors.length; i < len; i++) {
    anchor = anchors[i];
    p = new Pair(float, anchor);
  }
  return pairs;
};


/* 

TODO:

	Cursor issue: Text carrot while dragging... 
		not resolvable

	Animating distance?
 */


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaWFuYmVsbG9teS9EZXNrdG9wL1BhaXJUZXN0LmZyYW1lci9tb2R1bGVzL1BhaXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOzs7Ozs7OztBQUFBLElBQUEsU0FBQTtFQUFBOzs7O0FBVU0sT0FBTyxDQUFDO0FBR2IsTUFBQTs7OztFQUFBLElBQUMsQ0FBQSxZQUFELEdBQWM7O0VBR2QsbUJBQUEsR0FBc0I7O0VBQ3RCLFlBQUEsR0FBZTs7RUFDZixTQUFBLEdBQVk7O0VBQ1osZ0JBQUEsR0FBbUI7O0VBQ25CLHNCQUFBLEdBQXlCOztFQUN6QixxQkFBQSxHQUF3Qjs7aUJBR3hCLGNBQUEsR0FBZ0I7O2lCQUNoQixjQUFBLEdBQWdCOztpQkFDaEIsa0JBQUEsR0FBb0I7O2lCQUNwQixTQUFBLEdBQVc7O2lCQUNYLFFBQUEsR0FBVTs7aUJBQ1YsU0FBQSxHQUFXOztpQkFDWCxZQUFBLEdBQWM7O0VBRUQsY0FBQyxPQUFELEVBQVcsT0FBWDtBQUNaLFFBQUE7SUFEYSxJQUFDLENBQUEsVUFBRDtJQUFVLElBQUMsQ0FBQSxTQUFEOztJQUN2QixJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxLQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQTlCO01BQ0MsS0FBQSxDQUFNLHNGQUFOO0FBQ0EsYUFGRDs7SUFJQSxRQUFBLEdBQVcsSUFBQyxDQUFBLGtCQUFELENBQUE7SUFDWCxJQUFDLENBQUEsSUFBRCxDQUFBO0lBR0EsSUFBQyxDQUFBLGdCQUFELEdBQW9CLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQyxLQUFELEVBQU8sS0FBUDtRQUNuQixLQUFDLENBQUEsZ0JBQUQsR0FBb0I7UUFDcEIsS0FBQyxDQUFBLHNCQUFELEdBQTBCLEtBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3pDLEtBQUMsQ0FBQSxTQUFELEdBQWE7UUFD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QixRQUFoQixFQUEwQixJQUFDLENBQUEsWUFBM0I7RUFESzs7aUJBSU4sSUFBQSxHQUFLLFNBQUE7V0FDSixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQVosQ0FBZSxRQUFmLEVBQXlCLElBQUMsQ0FBQSxZQUExQjtFQURJOztpQkFLTCxPQUFBLEdBQVEsU0FBQTtJQUNQLElBQUMsQ0FBQSxrQkFBRCxDQUFBO1dBQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBQTtFQUZPOzs7O0dBck5rQixNQUFNLENBQUM7O0FBMk5sQyxTQUFBLEdBQVksU0FBQyxLQUFELEVBQU8sT0FBUDtBQUNYLE1BQUE7RUFBQSxLQUFBLEdBQVE7QUFDUixPQUFBLHlDQUFBOztJQUNDLENBQUEsR0FBUSxJQUFBLElBQUEsQ0FBSyxLQUFMLEVBQVksTUFBWjtBQURUO0FBR0EsU0FBTztBQUxJOzs7QUFRWiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIjIyNcblxuXHRQYWlyIG1vZHVsZVxuXG5cdFNlZSByZWFkbWUubWRcblxuXHTigJQgSWFuIEJlbGxvbXksIDIwMTZcblx0XG4jIyNcblxuY2xhc3MgZXhwb3J0cy5QYWlyIGV4dGVuZHMgRnJhbWVyLkV2ZW50RW1pdHRlclxuXG5cdCMgc3RhdGUgcHJvcGVydGllc1xuXHRAZHJhZ2dlZEl0ZW1zOltdXHRcblx0XG5cdCMgcHJpdmF0ZSBwcm9wZXJ0aWVzXG5cdF9kcmFnQW5kRHJvcEVuYWJsZWQgPSBmYWxzZVxuXHRfaG92ZXJlZE5vZGUgPSB1bmRlZmluZWRcblx0X2RyYWdnaW5nID0gZmFsc2Vcblx0X3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXG5cdF9wcmV2aW91c1BvaW50ZXJFdmVudHMgPSBcImF1dG9cIlxuXHRfcHJldmlvdXNEcmFnZ2FiaWxpdHkgPSBmYWxzZVxuXG5cdCNzaG91bGQtYmUgcHJpdmF0ZSBwcm9wZXJ0aWVzXG5cdHJhbmdlTGlzdGVuZXJzOiBbXVx0XG5cdGFuZ2xlTGlzdGVuZXJzOiBbXVx0XHRcdFxuXHRjb2xsaXNpb25MaXN0ZW5lcnM6IFtdXHRcblx0dGVtcFJhbmdlOiB1bmRlZmluZWRcblx0ZFNxdWFyZWQ6IDBcblx0Y29udGFpbmVkOiBmYWxzZVxuXHR0ZW1wTGlzdGVuZXI6IHt9XG5cblx0Y29uc3RydWN0b3I6IChAZmxvYXRlciwgQGFuY2hvcikgLT5cblx0XHRpZiBAZmxvYXRlci5wYXJlbnQgIT0gQGFuY2hvci5wYXJlbnRcblx0XHRcdHByaW50IFwiRVJST1I6UGFpci5jb2ZmZWU6UGFpcjpjb25zdHJ1Y3RvciwgIEBmbG9hdGVyIGFuZCBAYW5jaG9yIG11c3QgaGF2ZSB0aGUgc2FtZSBwYXJlbnQuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0ZFNxdWFyZWQgPSBAZ2V0RGlzdGFuY2VTcXVhcmVkKClcdFx0XG5cdFx0QHdha2UoKVxuXG5cdFx0I3ByaXZhdGUgbWV0aG9kc1xuXHRcdEBkcmFnU3RhcnRIYW5kbGVyID0gKGV2ZW50LGxheWVyKSA9PlxuXHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuXHRcdFx0QF9wcmV2aW91c1BvaW50ZXJFdmVudHMgPSBAZmxvYXRlci5zdHlsZS5wb2ludGVyRXZlbnRzXG5cdFx0XHRAX2RyYWdnaW5nID0gdHJ1ZVxuXHRcdFx0UGFpci5kcmFnZ2VkSXRlbXMucHVzaCBAZmxvYXRlclxuXHRcdFx0IyBAZmxvYXRlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCJcblx0XHRcdEBmbG9hdGVyLnZpc2libGUgPSBmYWxzZVxuXHRcdFx0QF9ob3ZlcmVkTm9kZSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcblx0XHRcdEBmbG9hdGVyLnZpc2libGUgPSB0cnVlXG5cdFx0XHRAZW1pdCBcImRyYWdTdGFydFwiLCBAZmxvYXRlclxuXG5cdFx0QGRyYWdIYW5kbGVyID0gKGV2ZW50KSA9Plx0XHRcdFxuXHRcdFx0QGZsb2F0ZXIudmlzaWJsZSA9IGZhbHNlXG5cdFx0XHRub2RlVW5kZXJuZWF0aCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcblx0XHRcdEBmbG9hdGVyLnZpc2libGUgPSB0cnVlXG5cdFx0XHRpZiBub2RlVW5kZXJuZWF0aCAhPSBAX2hvdmVyZWROb2RlICMgdG91Y2hlZCBzb21ldGhpbmcgbmV3Li4uXHRcdFx0XHRcblx0XHRcdFx0aWYgQGFuY2hvci5fZWxlbWVudCA9PSBub2RlVW5kZXJuZWF0aCAjIHRvdWNoZWQgYW5jaG9yP1xuXHRcdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gdHJ1ZVx0XHRcdFx0XHRcblx0XHRcdFx0XHRAX2hvdmVyZWROb2RlID0gbm9kZVVuZGVybmVhdGhcblx0XHRcdFx0XHRAZW1pdCBcImRyYWdFbnRlclwiLCBAZmxvYXRlciwgQGFuY2hvclxuXHRcdFx0XHRlbHNlIGlmIEBfaG92ZXJlZE5vZGUgPT0gQGFuY2hvci5fZWxlbWVudCAjbGVmdCBhbmNob3I/XG5cdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVx0XHRcdFx0XG5cdFx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IG5vZGVVbmRlcm5lYXRoXG5cdFx0XHRcdFx0QGVtaXQgXCJkcmFnTGVhdmVcIiwgQGZsb2F0ZXIsIEBhbmNob3Jcblx0XHRcdGVsc2UgaWYgQF92YWxpZERyYWdUYXJnZXRcblx0XHRcdFx0QGVtaXQgXCJkcmFnT3ZlclwiLCBAZmxvYXRlciwgQGFuY2hvclxuXG5cdFx0QGRyYWdFbmRIYW5kbGVyID0gKGV2ZW50LCBsYXllcikgPT5cblx0XHRcdEBfZHJhZ2dpbmcgPSBmYWxzZVxuXHRcdFx0IyBAZmxvYXRlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gQF9wcmV2aW91c1BvaW50ZXJFdmVudHNcblx0XHRcdGluZGV4ID0gUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBAZmxvYXRlclxuXHRcdFx0UGFpci5kcmFnZ2VkSXRlbXMuc3BsaWNlKGluZGV4LDEpXG5cdFx0XHRpZiBAX3ZhbGlkRHJhZ1RhcmdldFx0XHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiZHJvcFwiLCBAZmxvYXRlciwgQGFuY2hvclxuXHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXG5cdFx0XHRlbHNlXHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiaW52YWxpZERyb3BcIiwgQGZsb2F0ZXJcblxuXHRcdEBhbmNob3JNb3VzZU92ZXIgPSAoZXZlbnQsbGF5ZXIpPT5cblx0XHRcdGlmIEBfZHJhZ2dpbmcgIFxuXHRcdFx0XHRpZiBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIEBmbG9hdGVyIGlzbnQgLTFcblx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IHRydWVcblx0XHRcdFx0XHRAZW1pdCBcImRyYWdFbnRlclwiLCBAZmxvYXRlciwgQGFuY2hvclxuXG5cdFx0QGFuY2hvck1vdXNlT3V0ID0gKGV2ZW50LGxheWVyKT0+XG5cdFx0XHRpZiBAX2RyYWdnaW5nIFxuXHRcdFx0XHRpZiBQYWlyLmRyYWdnZWRJdGVtcy5pbmRleE9mIEBmbG9hdGVyIGlzbnQgLTFcblx0XHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXG5cdFx0XHRcdFx0QGVtaXQgXCJkcmFnTGVhdmVcIiwgQGZsb2F0ZXIsIEBhbmNob3Jcblx0XHQjZW5kIHByaXZhdGUgbWV0aG9kc1xuXG5cblx0I3Nob3VsZCBtdWx0aXBsZSBQYWlycyBiZSBoYW5kbGVkIGluIHRoZSBzYW1lIGxpc3RlbmVyP1xuXHRsb29wTGlzdGVuZXI6ID0+XG5cdFx0QGRTcXVhcmVkID0gQGdldERpc3RhbmNlU3F1YXJlZCgpXG5cdFx0Zm9yIEB0ZW1wUmFuZ2UgaW4gQHJhbmdlTGlzdGVuZXJzICBcblx0XHRcdEBjb250YWluZWQgPSBAdGVtcFJhbmdlLm1pblNxdWFyZWQgPD0gQGRTcXVhcmVkIDw9IEB0ZW1wUmFuZ2UubWF4U3F1YXJlZCBcblx0XHRcdGlmIEBjb250YWluZWQgYW5kIG5vdCBAdGVtcFJhbmdlLmVudGVyZWQgXG5cdFx0XHRcdEB0ZW1wUmFuZ2UuZW50ZXJlZCA9IHRydWVcblx0XHRcdFx0QHRlbXBSYW5nZS5lbnRlckNhbGxiYWNrLmFwcGx5IEBcblx0XHRcdFx0XG5cdFx0XHRlbHNlIGlmIG5vdCBAY29udGFpbmVkIGFuZCBAdGVtcFJhbmdlLmVudGVyZWRcblx0XHRcdFx0QHRlbXBSYW5nZS5lbnRlcmVkID0gZmFsc2Vcblx0XHRcdFx0QHRlbXBSYW5nZS5leGl0Q2FsbGJhY2suYXBwbHkgQFx0XHRcdFxuXHRcdGlmIEBoaXRUZXN0KClcblx0XHRcdGZvciBAdGVtcExpc3RlbmVyIGluIEBjb2xsaXNpb25MaXN0ZW5lcnNcblx0XHRcdFx0QHRlbXBMaXN0ZW5lci5jb250YWN0KysgfHwgQHRlbXBMaXN0ZW5lci5jb250YWN0U3RhcnQoQGFuY2hvcixAZmxvYXRlcilcblx0XHRcdFx0XG5cdFx0ZWxzZVxuXHRcdFx0Zm9yIEB0ZW1wTGlzdGVuZXIgaW4gQGNvbGxpc2lvbkxpc3RlbmVyc1xuXHRcdFx0XHRpZihAdGVtcExpc3RlbmVyLmNvbnRhY3QpXG5cdFx0XHRcdFx0QHRlbXBMaXN0ZW5lci5jb250YWN0ID0gZmFsc2Vcblx0XHRcdFx0XHRAdGVtcExpc3RlbmVyLmNvbnRhY3RFbmQoQGFuY2hvcixAZmxvYXRlcilcblxuXG5cdFxuXHQjcmV0dXJucyBhbiBpbmRleFxuXHRvblJhbmdlQ2hhbmdlOiAobWluLG1heCxlbnRlckZuLGV4aXRGbiA9IC0+KSAtPlxuXHRcdGNvdW50ID0gQHJhbmdlTGlzdGVuZXJzLnB1c2hcblx0XHRcdG1pbjptaW5cblx0XHRcdG1heDptYXhcblx0XHRcdG1pblNxdWFyZWQ6IG1pbioqMlxuXHRcdFx0bWF4U3F1YXJlZDogbWF4KioyXG5cdFx0XHRlbnRlckNhbGxiYWNrOiBlbnRlckZuXG5cdFx0XHRleGl0Q2FsbGJhY2s6IGV4aXRGblxuXHRcdFx0ZW50ZXJlZDpmYWxzZVxuXHRcdFxuXHRcdHJldHVybiBjb3VudCAtIDFcblxuXG5cdG9mZlJhbmdlQ2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0QHJhbmdlTGlzdGVuZXJzW2luZGV4XSA9IG51bGxcblxuXHQjcmV0dXJucyBpbmRleFxuXHRvbkNvbnRhY3RDaGFuZ2U6IChzdGFydEZuLGVuZEZuPS0+KSAtPlxuXHRcdGNvdW50ID0gKEBjb2xsaXNpb25MaXN0ZW5lcnMucHVzaCBcblx0XHRcdGNvbnRhY3RTdGFydDpzdGFydEZuXG5cdFx0XHRjb250YWN0RW5kOmVuZEZuXG5cdFx0XHRjb250YWN0OmZhbHNlKSAtIDFcdFxuXG5cdFx0cmV0dXJuIGNvdW50XG5cblxuXHRvZmZDb250YWN0Q2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0QGNvbGxpc2lvbkxpc3RlbmVyc1tpbmRleF0gPSBudWxsIFx0XHRcdFxuXG5cblx0XG5cdGdldERpc3RhbmNlOiAtPlxuXHRcdHJldHVybiBNYXRoLnNxcnQoKEBmbG9hdGVyLm1pZFgtQGFuY2hvci5taWRYKSoqMiArIChAZmxvYXRlci5taWRZLUBhbmNob3IubWlkWSkqKjIpXG5cdFxuXHRnZXREaXN0YW5jZVNxdWFyZWQ6IC0+XG5cdFx0cmV0dXJuIChAZmxvYXRlci5taWRYLUBhbmNob3IubWlkWCkqKjIgKyAoQGZsb2F0ZXIubWlkWS1AYW5jaG9yLm1pZFkpKioyXG5cdFxuXHRzZXREaXN0YW5jZToobmV3RGlzdGFuY2UpLT5cblx0XHRkaXN0YW5jZURpZmZSYXRpbyA9IG5ld0Rpc3RhbmNlLyBNYXRoLnNxcnQoQGRTcXVhcmVkKVxuXG5cdFx0b2xkWE9mZnNldCA9IEBmbG9hdGVyLm1pZFggLSBAYW5jaG9yLm1pZFhcblx0XHRuZXdYT2Zmc2V0ID0gb2xkWE9mZnNldCAqIGRpc3RhbmNlRGlmZlJhdGlvXG5cdFx0QGZsb2F0ZXIubWlkWCA9IEBhbmNob3IubWlkWCArIG5ld1hPZmZzZXRcblxuXHRcdG9sZFlPZmZzZXQgPSBAZmxvYXRlci5taWRZIC0gQGFuY2hvci5taWRZXG5cdFx0bmV3WU9mZnNldCA9IG9sZFlPZmZzZXQgKiBkaXN0YW5jZURpZmZSYXRpb1xuXHRcdEBmbG9hdGVyLm1pZFkgPSBAYW5jaG9yLm1pZFkgKyBuZXdZT2Zmc2V0XG5cblx0XHQjIGdldCB4LHkgY29tcG9uZW50c1xuXHRcdCMgY2FsY3VsYXRlIG9mZnNldFxuXG5cdFxuXHQjIHRoZSBjby1vcmRpbmF0ZXMgYmV0d2VlbiB0aGUgYW5jaG9yIGFuZCBmbG9hdGVyXG5cdCMgRklYTUUhISBJbiB3aGF0IHNwYWNlPyBBc3N1bWluZyB0aGV5IGhhdmUgdGhlIHNhbWUgcGFyZW50IVx0XG5cdG1pZHBvaW50OiAtPlxuXHRcdHJldHVybiBbKEBhbmNob3IubWlkWCArIEBmbG9hdGVyLm1pZFgpLzIuMCwoQGFuY2hvci5taWRZICsgQGZsb2F0ZXIubWlkWSkvMi4wXVxuXHRcblx0I3JldHVybnMgdHJ1ZSBpZiB0aGUgYW5jaG9yIGFuZCBmbG9hdGVyIGZyYW1lcyB0b3VjaFx0XHRcblx0aGl0VGVzdDotPlxuXHRcdHIxID0gQGFuY2hvclxuXHRcdHIyID0gQGZsb2F0ZXJcblx0XHRyZXR1cm4gbm90KCByMi54ID4gcjEueCArIHIxLndpZHRoIG9yIHIyLnggKyByMi53aWR0aCA8IHIxLnggb3IgcjIueSA+IHIxLnkgKyByMS5oZWlnaHQgb3IgcjIueSArIHIyLmhlaWdodCA8IHIxLnkpO1xuXG5cdCMgd2hhdCBoYXBwZW5zIHdoZW4gdGhlcmUgYXJlIG90aGVyIGJ1dHRvbnM/XG5cdCMgdGhlIGN1cnNvciBzaG91bGQgcmVhbGx5IGJlIGNhcHR1cmVkIHNvbWVob3cuXG5cdCMgKGluc2VydCBhIGJsb2NraW5nIGxheWVyIGJlbG93IHRoZSBAZmxvYXRlcj8pXG5cdCMgZG9uJ3QgdXNlIHRoZSBvcmlnaW5hbCBlbGVtZW50IC8gY2xvbmUgdGhlIGZsb2F0ZXIgYW5kIHBhc3MgdGhhdD9cblx0IyBob3cgdG8gZ2V0IHJpZCBvZiB0aGF0IHN0dXBpZCB0ZXh0IGN1cnNvciE/IVx0XG5cblx0ZW5hYmxlRHJhZ0FuZERyb3A6LT5cblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IHRydWVcblx0XHRAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5ID0gQGZsb2F0ZXIuZHJhZ2dhYmxlXG5cdFx0QGZsb2F0ZXIuZHJhZ2dhYmxlID0gdHJ1ZVxuXHRcdCMgQGZsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCItd2Via2l0LWdyYWJcIlxuXHRcdEBfaG92ZXJlZE5vZGUgPSB1bmRlZmluZWRcblxuXHRcdEBmbG9hdGVyLm9uIEV2ZW50cy5EcmFnU3RhcnQsIEBkcmFnU3RhcnRIYW5kbGVyXG5cdFx0QGZsb2F0ZXIub24gRXZlbnRzLkRyYWdNb3ZlLCBAZHJhZ0hhbmRsZXJcblx0XHRAZmxvYXRlci5vbiBFdmVudHMuRHJhZ0VuZCwgQGRyYWdFbmRIYW5kbGVyXHRcdFxuXHRcdEBhbmNob3Iub24gRXZlbnRzLk1vdXNlT3ZlciwgQGFuY2hvck1vdXNlT3ZlclxuXHRcdEBhbmNob3Iub24gRXZlbnRzLk1vdXNlT3V0LCBAYW5jaG9yTW91c2VPdXRcblxuXG5cdGRpc2FibGVEcmFnQW5kRHJvcDotPlx0XG5cdFx0QF9kcmFnZ2luZyA9IGZhbHNlXHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IGZhbHNlXG5cdFx0QGZsb2F0ZXIuZHJhZ2dhYmxlID0gQF9wcmV2aW91c0RyYWdnYWJpbGl0eVxuXG5cdFx0cHJpbnQgQF9wcmV2aW91c0RyYWdnYWJpbGl0eVxuXG5cdFx0QGZsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnU3RhcnQsIEBkcmFnU3RhcnRIYW5kbGVyXG5cdFx0QGZsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnTW92ZSwgQGRyYWdIYW5kbGVyXG5cdFx0QGZsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnRW5kLCBAZHJhZ0VuZEhhbmRsZXJcdFx0XG5cdFx0QGFuY2hvci5vZmYgRXZlbnRzLk1vdXNlT3ZlciwgQGFuY2hvck1vdXNlT3ZlclxuXHRcdEBhbmNob3Iub2ZmIEV2ZW50cy5Nb3VzZU91dCwgQGFuY2hvck1vdXNlT3V0XG5cblx0c2xlZXA6LT5cblx0XHRGcmFtZXIuTG9vcC5vZmYgXCJ1cGRhdGVcIiwgQGxvb3BMaXN0ZW5lclxuXHRcdCMgZGlzYWJsZSBkcmFnIGFuZCBkcm9wLCByZW1lbWJlciB3aGF0IHRoZSBzdGF0ZSB3YXNcblxuXHR3YWtlOi0+XG5cdFx0RnJhbWVyLkxvb3Aub24gXCJ1cGRhdGVcIiwgQGxvb3BMaXN0ZW5lclxuXHRcdCMgdXBkYXRlIGNvbnRhY3QgcHJvcGVydGllcyBvZiBsaXN0ZW5lcnM/XG5cdFx0IyBlbmFibGVkIGRyYWcgYW5kIGRyb3AgaWYgdGhpcyB3YXMgYWN0aXZlIGJlZm9yZVxuXG5cdGRlc3Ryb3k6LT5cblx0XHRAZGlzYWJsZURyYWdBbmREcm9wKClcblx0XHRAc2xlZXAoKVxuXHRcdCMgdGhhdCdzIGl0ISBJIHRoaW5rLi4uXG5cblxubWFrZVBhaXJzID0gKGZsb2F0LGFuY2hvcnMpLT5cblx0cGFpcnMgPSBbXVxuXHRmb3IgYW5jaG9yIGluIGFuY2hvcnNcblx0XHRwID0gbmV3IFBhaXIgZmxvYXQsIGFuY2hvclxuXG5cdHJldHVybiBwYWlyc1xuXG5cbiMjIyBcblxuVE9ETzpcblxuXHRDdXJzb3IgaXNzdWU6IFRleHQgY2Fycm90IHdoaWxlIGRyYWdnaW5nLi4uIFxuXHRcdG5vdCByZXNvbHZhYmxlXG5cblx0QW5pbWF0aW5nIGRpc3RhbmNlP1xuXG4jIyMiXX0=
