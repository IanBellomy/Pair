# Pair.coffee

##### Drag and drop layers.

Cursor-based:

<img src="https://github.com/IanBellomy/Pair/blob/master/examples/DragAndDropFramer.gif" wid=308 height=260">

Frame-based:

<img src="https://github.com/IanBellomy/Pair/blob/master/examples/contactDrop.gif" width=276 height=334">

Frame-based contact events without dragging:

<img src="https://github.com/IanBellomy/Pair/blob/master/examples/contactEvent.gif" width=229 height=381">


## Usage

Place the Pair.coffee file in the modules folder of your project.
In your file, write:

````coffeescript
PairModule = require "Pair"
````

Create a pair and enable drag and drop

````coffeescript
dragLayer = new Layer
targetLayer = new Layer
myPair = PairModule.Pair(dragLayer,targetLayer)
myPair.enableDragAndDrop()
````

`dragLayer` and `targetLayer` must be Layers with the same parent. `dragLayer` will be the draggable layer, `targetLayer` will be the drag target.



## Methods
In order of importance. 


````coffeescript
enableDragAndDrop()
````

Once called, the `dragLayer` will become draggable, and the pair will emit the following events: 

- `"dragStart"`
- `"dragEnter"`
- `"dragLeave"` 
- `"dragOver"`
- `"drop"`
- `"invalidDrop"`

The handlers will be scoped to the Pair object. (i.e. `this` will refer to the Pair.)

---
##### event handling
````coffeeScript
onDragStart( (dragged)-\>  )
````
When the mouse moves after pressing down on the `dragged`.<br>


````coffeeScript
onDragEnter( (dragged,dropTarget)-\>  )
````
When the cursor enters `dropTarget` while `dragged` is being dragged.


````coffeeScript
onDragOver( (dragged,dropTarget)-\>  )
````
When the cursor moves within `dropTarget` while `dragged` is being dragged.


````coffeeScript
onDragLeave( (dragged,formerDropTarget)-\>  )
````
When the cursor leaves `formerDropTarget` while `dragged` is being dragged. 


````coffeeScript
onInvalidDrop( (dropped)-\>  )
````
When the mouse is released outside of the original `targetLayer` while `dropped` was being dragged.


````coffeeScript
onDrop( (dropped,dropTarget)-\>  )
````
When the mouse is released over `dropTarget` while `dropped` is being dragged.



````coffeeScript
onContactDrop( (dropped,dropTarget)-\>  )
````
When the mouse is released while the `dropTarget` frame overlaps the `dropped` frame.
This event is emitted _after_ "drop" and "invalidDrop"


````coffeeScript
onInvalidContactDrop( (dropped,dropTarget)-\>  )
````
When the mouse is released while the `dropTarget` frame does not overlap the `dropped` frame.
This event is emitted _after_ "drop" and "invalidDrop"


---
````coffeescript
disableDragAndDrop()
````
Once called, the `dragLayer` will not be draggable, and any drag event listeners will be not be called. 


---
````coffeescript
onContactChange(startFn,endFn=-\>)  : returns index
````
Add an event listener for when the layers' _frames_ contact starts or ends.
The function returns an index which can be used to remove the listener later.

*NOTE*: Handlers will be called regardless of whether drag and drop is enabled, and regardless of whether a layer is dragged.

*NOTE*: Layers' scale and rotation does NOT affect a layers' frame! (This module does not perform pixel-based collision detection or geometric box collision detection.)



---
````coffeescript
offContactChange(index)
````
Opposite of `onContactChange()` 


---
````coffeescript
onRangeChange(min,max,enterFn,exitFn=-\>)  : returns index
````
Add event handlers for when the distance between layers enters a specific range. The range is defined by `min` and `max`. The `enterFn` function is called when distance becomes `<= max`, or `>= min`. Vice versa for the `exitFn`.

Distance is measured from the layers' midpoints.

The function returns an index which can be used to remove the listener later.

*NOTE*: Handlers will be called regardless of whether drag and drop is enabled, and regardless of whether a layer is dragged

---
````coffeescript
offRangeChange(index)
````
Opposite of `onRangeChange()`


---
````coffeescript
getDistance()
````
Returns the distance between the midpoints of `dragLayer` and `targetLayer`.


---
````coffeescript
setDistance(value)
````

Sets the distance between the two midpoints of `dragLayer` and `targetLayer` by moving `targetLayer`. Maintains the angle between the two layers. 


---
````coffeescript
midPoint()  : returns [x,y]
````
Returns the midpoint between the mindpoints of the `dragLayer` and `targetLayer`.


---
````coffeescript
sleep()
````
No drag events, range events, or collision events will be emitted.


---
````coffeescript
wake()
````
Drag events, range events, and collision events will be emitted like normal.


---
````coffeescript
destroy()
````
Call this if the pair is no longer needed. It will go to sleep and all event listeners will be removed. 

## Contact
Twitter: @ianbellomy

