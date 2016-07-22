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
        results.push(_tempListener.contact++ || _tempListener.contactStart(_floater, _anchor));
      }
      return results;
    } else {
      results1 = [];
      for (k = 0, len2 = _collisionListeners.length; k < len2; k++) {
        _tempListener = _collisionListeners[k];
        if (_tempListener.contact) {
          _tempListener.contact = false;
          results1.push(_tempListener.contactEnd(_floater, _anchor));
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaWFuYmVsbG9teS9HaXRIdWIvUGFpci9leGFtcGxlcy8wM19jb250YWN0RXZlbnQuZnJhbWVyL21vZHVsZXMvUGFpci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7Ozs7Ozs7O0FBQUEsSUFBQTs7OztBQVVNLE9BQU8sQ0FBQztBQUliLE1BQUE7Ozs7RUFBQSxJQUFDLENBQUEsWUFBRCxHQUFjOztFQUdkLFFBQUEsR0FBYzs7RUFDZCxPQUFBLEdBQWM7O0VBQ2QsbUJBQUEsR0FBdUI7O0VBQ3ZCLFlBQUEsR0FBa0I7O0VBQ2xCLFNBQUEsR0FBZ0I7O0VBQ2hCLGdCQUFBLEdBQXFCOztFQUNyQixzQkFBQSxHQUEwQjs7RUFDMUIscUJBQUEsR0FBeUI7O0VBQ3pCLGVBQUEsR0FBb0I7O0VBQ3BCLG1CQUFBLEdBQXVCOztFQUN2QixVQUFBLEdBQWlCOztFQUNqQixTQUFBLEdBQWdCOztFQUNoQixVQUFBLEdBQWlCOztFQUNqQixhQUFBLEdBQW1COztFQUVOLGNBQUMsT0FBRCxFQUFVLE1BQVY7O0lBRVosSUFBRyxDQUFDLENBQUMsT0FBQSxZQUFtQixNQUFNLENBQUMsS0FBM0IsQ0FBSjtNQUNDLEtBQUEsQ0FBTSx3RUFBTjtBQUNBLGFBRkQ7O0lBSUEsSUFBRyxDQUFDLENBQUMsTUFBQSxZQUFrQixNQUFNLENBQUMsS0FBMUIsQ0FBSjtNQUNDLEtBQUEsQ0FBTSx5RUFBTjtBQUNBLGFBRkQ7O0lBSUEsSUFBRyxPQUFPLENBQUMsTUFBUixLQUFrQixNQUFNLENBQUMsTUFBNUI7TUFDQyxLQUFBLENBQU0sOEZBQU47QUFDQSxhQUZEOztJQUlBLFNBQUEsR0FBWSxJQUFDLENBQUEsa0JBQUQsQ0FBQTtJQUVaLFFBQUEsR0FBVztJQUNYLE9BQUEsR0FBVTtJQUVWLElBQUMsQ0FBQSxJQUFELENBQUE7SUFLQSxJQUFDLENBQUEsZ0JBQUQsR0FBb0Is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YUFBQSxHQUFlLFNBQUMsRUFBRDtXQUNkLElBQUMsQ0FBQSxFQUFELENBQUksYUFBSixFQUFtQixFQUFuQjtFQURjOztpQkFHZixNQUFBLEdBQVEsU0FBQyxFQUFEO1dBQ1AsSUFBQyxDQUFBLEVBQUQsQ0FBSSxNQUFKLEVBQVksRUFBWjtFQURPOztpQkFHUixhQUFBLEdBQWUsU0FBQyxFQUFEO1dBQ2QsSUFBQyxDQUFBLEVBQUQsQ0FBSSxhQUFKLEVBQW1CLEVBQW5CO0VBRGM7O2lCQUdmLG9CQUFBLEdBQXNCLFNBQUMsRUFBRDtXQUNyQixJQUFDLENBQUEsRUFBRCxDQUFJLG9CQUFKLEVBQTBCLEVBQTFCO0VBRHFCOzs7O0dBdFJJLE1BQU0sQ0FBQzs7O0FBeVJsQzs7Ozs7QUFNQSxPQUFPLENBQUMsU0FBUixHQUFvQixTQUFDLEtBQUQsRUFBTyxPQUFQO0FBQ25CLE1BQUE7RUFBQSxLQUFBLEdBQVE7QUFDUixPQUFBLHlDQUFBOztJQUNDLENBQUEsR0FBUSxJQUFBLElBQUEsQ0FBSyxLQUFMLEVBQVksTUFBWjtBQURUO0FBR0EsU0FBTztBQUxZIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiMjI1xuXG5cdFBhaXIgbW9kdWxlXG5cblx0U2VlIHJlYWRtZS5tZFxuXG5cdOKAlCBJYW4gQmVsbG9teSwgMjAxNlxuXHRcbiMjI1xuXG5jbGFzcyBleHBvcnRzLlBhaXIgZXh0ZW5kcyBGcmFtZXIuRXZlbnRFbWl0dGVyXG5cblx0IyBzdGF0aWMgcHJvcGVydGllc1xuXG5cdEBkcmFnZ2VkSXRlbXM6W11cdFx0XG5cblx0IyBwcml2YXRlIHByb3BlcnRpZXNcblx0X2Zsb2F0ZXJcdFx0XHRcdD0ge31cblx0X2FuY2hvclx0XHRcdFx0XHQ9IHt9XG5cdF9kcmFnQW5kRHJvcEVuYWJsZWQgXHQ9IGZhbHNlXG5cdF9ob3ZlcmVkTm9kZSBcdFx0XHQ9IHVuZGVmaW5lZFxuXHRfZHJhZ2dpbmcgXHRcdFx0XHQ9IGZhbHNlXG5cdF92YWxpZERyYWdUYXJnZXQgXHRcdD0gZmFsc2Vcblx0X3ByZXZpb3VzUG9pbnRlckV2ZW50cyBcdD0gXCJhdXRvXCJcblx0X3ByZXZpb3VzRHJhZ2dhYmlsaXR5IFx0PSBmYWxzZVxuXHRfcmFuZ2VMaXN0ZW5lcnMgXHRcdD0gW11cdFx0XG5cdF9jb2xsaXNpb25MaXN0ZW5lcnMgXHQ9IFtdXHRcblx0X3RlbXBSYW5nZSBcdFx0XHRcdD0gdW5kZWZpbmVkXG5cdF9kU3F1YXJlZCBcdFx0XHRcdD0gMFxuXHRfY29udGFpbmVkIFx0XHRcdFx0PSBmYWxzZVxuXHRfdGVtcExpc3RlbmVyIFx0XHRcdD0ge31cblxuXHRjb25zdHJ1Y3RvcjogKGZsb2F0ZXIsIGFuY2hvcikgLT5cdFx0XG5cblx0XHRpZiAhKGZsb2F0ZXIgaW5zdGFuY2VvZiBGcmFtZXIuTGF5ZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSBMYXllci5cIlxuXHRcdFx0cmV0dXJuXG5cblx0XHRpZiAhKGFuY2hvciBpbnN0YW5jZW9mIEZyYW1lci5MYXllcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyIG1vZHVsZTpQYWlyOmNvbnN0cnVjdG9yLCAgc2Vjb25kIGFyZ3VtZW50IG11c3QgYmUgYSBMYXllci5cIlxuXHRcdFx0cmV0dXJuXG5cblx0XHRpZiBmbG9hdGVyLnBhcmVudCAhPSBhbmNob3IucGFyZW50XG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpciBtb2R1bGU6UGFpcjpjb25zdHJ1Y3RvciwgIGZpcnN0IGFuZCBzZWNvbmQgYXJndW1lbnRzIG11c3QgaGF2ZSB0aGUgc2FtZSBwYXJlbnQuXCJcblx0XHRcdHJldHVyblxuXG5cdFx0X2RTcXVhcmVkID0gQGdldERpc3RhbmNlU3F1YXJlZCgpXHRcdFxuXG5cdFx0X2Zsb2F0ZXIgPSBmbG9hdGVyXG5cdFx0X2FuY2hvclx0PSBhbmNob3JcblxuXHRcdEB3YWtlKClcblxuXHRcdCMgVGhlc2UgcHJpdmF0ZSBtZXRob2RzIHdpbGwgYmUgZXZlbnQgaGFuZGxlcnMgYXR0YWNoZWQgdG8gdGhlIGZsb2F0ZXIgYW5kIGFuY2hvciBsYXllcnMuXG5cdFx0IyBUaGV5IHNob3VsZCBzdGF5IHNjb3BlZCB0byB0aGUgUGFpciBpbnN0YW5jZSB3aGVuIGNhbGxlZC4gXG5cblx0XHRAZHJhZ1N0YXJ0SGFuZGxlciA9IChldmVudCxsYXllcikgPT5cdFx0XHRcblx0XHRcdF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuXHRcdFx0X3ByZXZpb3VzUG9pbnRlckV2ZW50cyA9IF9mbG9hdGVyLnN0eWxlLnBvaW50ZXJFdmVudHNcblx0XHRcdF9kcmFnZ2luZyA9IHRydWVcblx0XHRcdFBhaXIuZHJhZ2dlZEl0ZW1zLnB1c2ggX2Zsb2F0ZXJcblx0XHRcdCMgX2Zsb2F0ZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiXG5cdFx0XHRfZmxvYXRlci52aXNpYmxlID0gZmFsc2Vcblx0XHRcdF9ob3ZlcmVkTm9kZSA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcblx0XHRcdF9mbG9hdGVyLnZpc2libGUgPSB0cnVlXG5cdFx0XHRAZW1pdCBcImRyYWdTdGFydFwiLCBfZmxvYXRlclxuXG5cdFx0QGRyYWdIYW5kbGVyID0gKGV2ZW50KSA9Plx0XHRcdFxuXHRcdFx0X2Zsb2F0ZXIudmlzaWJsZSA9IGZhbHNlXG5cdFx0XHRub2RlVW5kZXJuZWF0aCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSlcblx0XHRcdF9mbG9hdGVyLnZpc2libGUgPSB0cnVlXG5cdFx0XHRpZiBub2RlVW5kZXJuZWF0aCAhPSBAX2hvdmVyZWROb2RlICMgdG91Y2hlZCBzb21ldGhpbmcgbmV3Li4uXHRcdFx0XHRcblx0XHRcdFx0aWYgX2FuY2hvci5fZWxlbWVudCA9PSBub2RlVW5kZXJuZWF0aCAjIHRvdWNoZWQgYW5jaG9yP1xuXHRcdFx0XHRcdEBfdmFsaWREcmFnVGFyZ2V0ID0gdHJ1ZVx0XHRcdFx0XHRcblx0XHRcdFx0XHRAX2hvdmVyZWROb2RlID0gbm9kZVVuZGVybmVhdGhcblx0XHRcdFx0XHRAZW1pdCBcImRyYWdFbnRlclwiLCBfZmxvYXRlciwgX2FuY2hvclxuXHRcdFx0XHRlbHNlIGlmIEBfaG92ZXJlZE5vZGUgPT0gX2FuY2hvci5fZWxlbWVudCAjbGVmdCBhbmNob3I/XG5cdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVx0XHRcdFx0XG5cdFx0XHRcdFx0QF9ob3ZlcmVkTm9kZSA9IG5vZGVVbmRlcm5lYXRoXG5cdFx0XHRcdFx0QGVtaXQgXCJkcmFnTGVhdmVcIiwgX2Zsb2F0ZXIsIF9hbmNob3Jcblx0XHRcdGVsc2UgaWYgQF92YWxpZERyYWdUYXJnZXRcblx0XHRcdFx0QGVtaXQgXCJkcmFnT3ZlclwiLCBfZmxvYXRlciwgX2FuY2hvclxuXG5cdFx0QGRyYWdFbmRIYW5kbGVyID0gKGV2ZW50LCBsYXllcikgPT5cblx0XHRcdEBfZHJhZ2dpbmcgPSBmYWxzZVxuXHRcdFx0IyBfZmxvYXRlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gQF9wcmV2aW91c1BvaW50ZXJFdmVudHNcblx0XHRcdGluZGV4ID0gUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBfZmxvYXRlclxuXHRcdFx0UGFpci5kcmFnZ2VkSXRlbXMuc3BsaWNlKGluZGV4LDEpXG5cdFx0XHRpZiBAX3ZhbGlkRHJhZ1RhcmdldFx0XHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiZHJvcFwiLCBfZmxvYXRlciwgX2FuY2hvclxuXHRcdFx0XHRAX3ZhbGlkRHJhZ1RhcmdldCA9IGZhbHNlXG5cdFx0XHRlbHNlXHRcdFx0XG5cdFx0XHRcdEBlbWl0IFwiaW52YWxpZERyb3BcIiwgX2Zsb2F0ZXJcblxuXHRcdFx0aWYgQGhpdFRlc3QoKVxuXHRcdFx0XHRAZW1pdCBcImNvbnRhY3REcm9wXCIsIF9mbG9hdGVyLCBfYW5jaG9yXG5cdFx0XHRlbHNlIFxuXHRcdFx0XHRAZW1pdCBcImludmFsaWRDb250YWN0RHJvcFwiLCBfZmxvYXRlclxuXG5cblx0XHRAYW5jaG9yTW91c2VPdmVyID0gKGV2ZW50LGxheWVyKT0+XG5cdFx0XHRpZiBAX2RyYWdnaW5nICBcblx0XHRcdFx0aWYgUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBfZmxvYXRlciBpc250IC0xXG5cdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSB0cnVlXG5cdFx0XHRcdFx0QGVtaXQgXCJkcmFnRW50ZXJcIiwgX2Zsb2F0ZXIsIF9hbmNob3JcblxuXHRcdEBhbmNob3JNb3VzZU91dCA9IChldmVudCxsYXllcik9PlxuXHRcdFx0aWYgQF9kcmFnZ2luZyBcblx0XHRcdFx0aWYgUGFpci5kcmFnZ2VkSXRlbXMuaW5kZXhPZiBfZmxvYXRlciBpc250IC0xXG5cdFx0XHRcdFx0QF92YWxpZERyYWdUYXJnZXQgPSBmYWxzZVxuXHRcdFx0XHRcdEBlbWl0IFwiZHJhZ0xlYXZlXCIsIF9mbG9hdGVyLCBfYW5jaG9yXG5cdFx0XHRcdFxuXHRcdCNlbmQgcHJpdmF0ZSBtZXRob2RzXG5cblxuXHQjc2hvdWxkIG11bHRpcGxlIFBhaXJzIGJlIGhhbmRsZWQgaW4gdGhlIHNhbWUgbGlzdGVuZXI/XG5cdGxvb3BMaXN0ZW5lcjogPT5cblx0XHRfZFNxdWFyZWQgPSBAZ2V0RGlzdGFuY2VTcXVhcmVkKClcblx0XHRmb3IgX3RlbXBSYW5nZSBpbiBfcmFuZ2VMaXN0ZW5lcnMgIFxuXHRcdFx0X2NvbnRhaW5lZCA9IF90ZW1wUmFuZ2UubWluU3F1YXJlZCA8PSBfZFNxdWFyZWQgPD0gX3RlbXBSYW5nZS5tYXhTcXVhcmVkIFxuXHRcdFx0aWYgX2NvbnRhaW5lZCBhbmQgbm90IF90ZW1wUmFuZ2UuZW50ZXJlZCBcblx0XHRcdFx0X3RlbXBSYW5nZS5lbnRlcmVkID0gdHJ1ZVxuXHRcdFx0XHRfdGVtcFJhbmdlLmVudGVyQ2FsbGJhY2suYXBwbHkgQFxuXHRcdFx0XHRcblx0XHRcdGVsc2UgaWYgbm90IF9jb250YWluZWQgYW5kIF90ZW1wUmFuZ2UuZW50ZXJlZFxuXHRcdFx0XHRfdGVtcFJhbmdlLmVudGVyZWQgPSBmYWxzZVxuXHRcdFx0XHRfdGVtcFJhbmdlLmV4aXRDYWxsYmFjay5hcHBseSBAXHRcdFx0XG5cblx0XHRpZiBAaGl0VGVzdCgpXG5cdFx0XHRmb3IgX3RlbXBMaXN0ZW5lciBpbiBfY29sbGlzaW9uTGlzdGVuZXJzXG5cdFx0XHRcdF90ZW1wTGlzdGVuZXIuY29udGFjdCsrIHx8IF90ZW1wTGlzdGVuZXIuY29udGFjdFN0YXJ0KF9mbG9hdGVyLF9hbmNob3IpXG5cdFx0XHRcdFxuXHRcdGVsc2Vcblx0XHRcdGZvciBfdGVtcExpc3RlbmVyIGluIF9jb2xsaXNpb25MaXN0ZW5lcnNcblx0XHRcdFx0aWYoX3RlbXBMaXN0ZW5lci5jb250YWN0KVxuXHRcdFx0XHRcdF90ZW1wTGlzdGVuZXIuY29udGFjdCA9IGZhbHNlXG5cdFx0XHRcdFx0X3RlbXBMaXN0ZW5lci5jb250YWN0RW5kKF9mbG9hdGVyLF9hbmNob3IpXG5cblxuXHRcdFx0XG5cblxuXHRcblx0Z2V0RGlzdGFuY2U6IC0+XG5cdFx0cmV0dXJuIE1hdGguc3FydCgoX2Zsb2F0ZXIubWlkWC1fYW5jaG9yLm1pZFgpKioyICsgKF9mbG9hdGVyLm1pZFktX2FuY2hvci5taWRZKSoqMilcblx0XG5cdGdldERpc3RhbmNlU3F1YXJlZDogLT5cblx0XHRyZXR1cm4gKF9mbG9hdGVyLm1pZFgtX2FuY2hvci5taWRYKSoqMiArIChfZmxvYXRlci5taWRZLV9hbmNob3IubWlkWSkqKjJcblx0XG5cdHNldERpc3RhbmNlOihuZXdEaXN0YW5jZSktPlxuXHRcdGRpc3RhbmNlRGlmZlJhdGlvID0gbmV3RGlzdGFuY2UvIE1hdGguc3FydChfZFNxdWFyZWQpXG5cblx0XHRvbGRYT2Zmc2V0ID0gX2Zsb2F0ZXIubWlkWCAtIF9hbmNob3IubWlkWFxuXHRcdG5ld1hPZmZzZXQgPSBvbGRYT2Zmc2V0ICogZGlzdGFuY2VEaWZmUmF0aW9cblx0XHRfZmxvYXRlci5taWRYID0gX2FuY2hvci5taWRYICsgbmV3WE9mZnNldFxuXG5cdFx0b2xkWU9mZnNldCA9IF9mbG9hdGVyLm1pZFkgLSBfYW5jaG9yLm1pZFlcblx0XHRuZXdZT2Zmc2V0ID0gb2xkWU9mZnNldCAqIGRpc3RhbmNlRGlmZlJhdGlvXG5cdFx0X2Zsb2F0ZXIubWlkWSA9IF9hbmNob3IubWlkWSArIG5ld1lPZmZzZXRcblxuXHRcblx0IyB0aGUgY28tb3JkaW5hdGVzIGJldHdlZW4gdGhlIGFuY2hvciBhbmQgZmxvYXRlclxuXHRtaWRwb2ludDogLT5cblx0XHRyZXR1cm4gWyhfYW5jaG9yLm1pZFggKyBfZmxvYXRlci5taWRYKS8yLjAsKF9hbmNob3IubWlkWSArIF9mbG9hdGVyLm1pZFkpLzIuMF1cblx0XG5cdCNyZXR1cm5zIHRydWUgaWYgdGhlIGFuY2hvciBhbmQgZmxvYXRlciBmcmFtZXMgdG91Y2hcdFx0XG5cdGhpdFRlc3Q6LT5cblx0XHRyMSA9IF9hbmNob3Jcblx0XHRyMiA9IF9mbG9hdGVyXG5cdFx0cmV0dXJuICEoIHIyLnggPiByMS54ICsgcjEud2lkdGggb3IgcjIueCArIHIyLndpZHRoIDwgcjEueCBvciByMi55ID4gcjEueSArIHIxLmhlaWdodCBvciByMi55ICsgcjIuaGVpZ2h0IDwgcjEueSlcblxuXG5cdCMgd2hhdCBoYXBwZW5zIHdoZW4gdGhlcmUgYXJlIG90aGVyIGJ1dHRvbnM/XG5cdCMgdGhlIGN1cnNvciBzaG91bGQgcmVhbGx5IGJlIGNhcHR1cmVkIHNvbWVob3cuXG5cdCMgKGluc2VydCBhIGJsb2NraW5nIGxheWVyIGJlbG93IHRoZSBfZmxvYXRlcj8pXG5cdCMgZG9uJ3QgdXNlIHRoZSBvcmlnaW5hbCBlbGVtZW50IC8gY2xvbmUgdGhlIGZsb2F0ZXIgYW5kIHBhc3MgdGhhdD9cblx0IyBob3cgdG8gZ2V0IHJpZCBvZiB0aGF0IHN0dXBpZCB0ZXh0IGN1cnNvciE/IVx0XG5cblx0ZW5hYmxlRHJhZ0FuZERyb3A6LT5cblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IHRydWVcblx0XHRAX3ByZXZpb3VzRHJhZ2dhYmlsaXR5ID0gX2Zsb2F0ZXIuZHJhZ2dhYmxlXG5cdFx0X2Zsb2F0ZXIuZHJhZ2dhYmxlID0gdHJ1ZVxuXHRcdCMgX2Zsb2F0ZXIuc3R5bGUuY3Vyc29yID0gXCItd2Via2l0LWdyYWJcIlxuXHRcdEBfaG92ZXJlZE5vZGUgPSB1bmRlZmluZWRcblxuXHRcdF9mbG9hdGVyLm9uIEV2ZW50cy5EcmFnU3RhcnQsIEBkcmFnU3RhcnRIYW5kbGVyXG5cdFx0X2Zsb2F0ZXIub24gRXZlbnRzLkRyYWdNb3ZlLCBAZHJhZ0hhbmRsZXJcblx0XHRfZmxvYXRlci5vbiBFdmVudHMuRHJhZ0VuZCwgQGRyYWdFbmRIYW5kbGVyXHRcdFxuXHRcdF9hbmNob3Iub24gRXZlbnRzLk1vdXNlT3ZlciwgQGFuY2hvck1vdXNlT3ZlclxuXHRcdF9hbmNob3Iub24gRXZlbnRzLk1vdXNlT3V0LCBAYW5jaG9yTW91c2VPdXRcblxuXG5cdGRpc2FibGVEcmFnQW5kRHJvcDotPlx0XG5cdFx0QF9kcmFnZ2luZyA9IGZhbHNlXHRcblx0XHRAX2RyYWdBbmREcm9wRW5hYmxlZCA9IGZhbHNlXG5cdFx0X2Zsb2F0ZXIuZHJhZ2dhYmxlID0gQF9wcmV2aW91c0RyYWdnYWJpbGl0eVxuXG5cdFx0cHJpbnQgQF9wcmV2aW91c0RyYWdnYWJpbGl0eVxuXG5cdFx0X2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnU3RhcnQsIEBkcmFnU3RhcnRIYW5kbGVyXG5cdFx0X2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnTW92ZSwgQGRyYWdIYW5kbGVyXG5cdFx0X2Zsb2F0ZXIub2ZmIEV2ZW50cy5EcmFnRW5kLCBAZHJhZ0VuZEhhbmRsZXJcdFx0XG5cdFx0X2FuY2hvci5vZmYgRXZlbnRzLk1vdXNlT3ZlciwgQGFuY2hvck1vdXNlT3ZlclxuXHRcdF9hbmNob3Iub2ZmIEV2ZW50cy5Nb3VzZU91dCwgQGFuY2hvck1vdXNlT3V0XG5cblx0c2xlZXA6LT5cblx0XHRGcmFtZXIuTG9vcC5vZmYgXCJ1cGRhdGVcIiwgQGxvb3BMaXN0ZW5lclxuXHRcdCMgZGlzYWJsZSBkcmFnIGFuZCBkcm9wLCByZW1lbWJlciB3aGF0IHRoZSBzdGF0ZSB3YXNcblxuXHR3YWtlOi0+XG5cdFx0RnJhbWVyLkxvb3Aub24gXCJ1cGRhdGVcIiwgQGxvb3BMaXN0ZW5lclxuXHRcdCMgdXBkYXRlIGNvbnRhY3QgcHJvcGVydGllcyBvZiBsaXN0ZW5lcnM/XG5cdFx0IyBlbmFibGVkIGRyYWcgYW5kIGRyb3AgaWYgdGhpcyB3YXMgYWN0aXZlIGJlZm9yZVxuXG5cdGRlc3Ryb3k6LT5cblx0XHRAZGlzYWJsZURyYWdBbmREcm9wKClcblx0XHRAc2xlZXAoKVxuXHRcdCMgdGhhdCdzIGl0ISBJIHRoaW5rLi4uXG5cblxuXHQjXG5cdCNcdEV2ZW50IEhhbmRsaW5nXG5cdCNcblxuXHQjcmV0dXJucyBhbiBpbmRleFxuXHRvblJhbmdlQ2hhbmdlOiAobWluLG1heCxlbnRlckZuLGV4aXRGbiA9IC0+KSAtPlxuXHRcdGNvdW50ID0gX3JhbmdlTGlzdGVuZXJzLnB1c2hcblx0XHRcdG1pbjptaW5cblx0XHRcdG1heDptYXhcblx0XHRcdG1pblNxdWFyZWQ6IG1pbioqMlxuXHRcdFx0bWF4U3F1YXJlZDogbWF4KioyXG5cdFx0XHRlbnRlckNhbGxiYWNrOiBlbnRlckZuXG5cdFx0XHRleGl0Q2FsbGJhY2s6IGV4aXRGblxuXHRcdFx0ZW50ZXJlZDpmYWxzZVxuXHRcdFxuXHRcdHJldHVybiBjb3VudCAtIDFcblxuXG5cdG9mZlJhbmdlQ2hhbmdlOiAoaW5kZXgpIC0+XG5cdFx0aWYgIShpbmRleCBpbnN0YW5jZW9mIE51bWJlcilcblx0XHRcdHByaW50IFwiRVJST1IgLSBQYWlyOm9mZlJhbmdlQ2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdF9yYW5nZUxpc3RlbmVyc1tpbmRleF0gPSBudWxsXG5cblxuXHQjIFJldHVybnMgaW5kZXhcblx0b25Db250YWN0Q2hhbmdlOiAoc3RhcnRGbixlbmRGbj0tPikgLT5cblx0XHRjb3VudCA9IChfY29sbGlzaW9uTGlzdGVuZXJzLnB1c2ggXG5cdFx0XHRjb250YWN0U3RhcnQ6c3RhcnRGblxuXHRcdFx0Y29udGFjdEVuZDplbmRGblxuXHRcdFx0Y29udGFjdDpmYWxzZSkgLSAxXHRcblxuXHRcdHJldHVybiBjb3VudFxuXG5cblx0b2ZmQ29udGFjdENoYW5nZTogKGluZGV4KSAtPlxuXHRcdGlmICEoaW5kZXggaW5zdGFuY2VvZiBOdW1iZXIpXG5cdFx0XHRwcmludCBcIkVSUk9SIC0gUGFpcjpvZmZDb250YWN0Q2hhbmdlKGluZGV4KSwgaW5kZXggbXVzdCBiZSBhIE51bWJlclwiXG5cdFx0XHRyZXR1cm5cblxuXHRcdF9jb2xsaXNpb25MaXN0ZW5lcnNbaW5kZXhdID0gbnVsbCBcdFxuXG5cdCNcdFxuXHQjXHRFdmVudCBoYW5kbGluZyBjb252ZW5pZW5jZSBmdW5jdGlvbnNcblx0I1xuXG5cdG9uRHJhZ1N0YXJ0OiAoZm4pLT5cblx0XHRAb24gXCJkcmFnU3RhcnRcIiwgZm5cblxuXHRvbkRyYWdFbnRlcjogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ0VudGVyXCIsIGZuXG5cblx0b25EcmFnT3ZlcjogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ092ZXJcIiwgZm5cblxuXHRvbkRyYWdMZWF2ZTogKGZuKS0+XG5cdFx0QG9uIFwiZHJhZ0xlYXZlXCIsIGZuXG5cblx0b25JbnZhbGlkRHJvcDogKGZuKS0+XG5cdFx0QG9uIFwiaW52YWxpZERyb3BcIiwgZm5cblxuXHRvbkRyb3A6IChmbiktPlxuXHRcdEBvbiBcImRyb3BcIiwgZm5cblxuXHRvbkNvbnRhY3REcm9wOiAoZm4pLT5cblx0XHRAb24gXCJjb250YWN0RHJvcFwiLCBmblxuXG5cdG9uSW52YWxpZENvbnRhY3REcm9wOiAoZm4pLT5cblx0XHRAb24gXCJpbnZhbGlkQ29udGFjdERyb3BcIiwgZm5cblxuIyMjIFxuXG5cdENvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBtYWtpbmcgbXVsdGlwbGUgcGFpcnMuIFxuXHRcbiMjIyBcblxuZXhwb3J0cy5tYWtlUGFpcnMgPSAoZmxvYXQsYW5jaG9ycyktPlxuXHRwYWlycyA9IFtdXG5cdGZvciBhbmNob3IgaW4gYW5jaG9yc1xuXHRcdHAgPSBuZXcgUGFpciBmbG9hdCwgYW5jaG9yXG5cblx0cmV0dXJuIHBhaXJzXG5cbiJdfQ==
