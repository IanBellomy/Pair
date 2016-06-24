# Pair.coffee

Drag and drop layers and other things. 


## Use

Place the Pair.coffee file in the modules folder of your project.
In your file, write:

	PairModule = require "Pair"


## Create a pair

	myPair = PairModule.Pair(LAYER1,LAYER2)


LAYER1 and LAYER2 are Framer Layers. LAYER1 will be the anchorLayer. LAYER2 will be the floatLayer. This order important for methods like enabledDragAndDrop() and setDistance(), which effect the two layers differently. 


## Methods
In order of importance. 

---

	enableDragAndDrop()

Once called, the floatLayer will become draggable, and the pair will emit the following events: 

	"dragEnter", when the cursor enters the anchorLayer while the float is being dragged.
	"dragLeave", when the cursor leaves the anchorLayer while the float is being dragged. 
	"dragOver", when the cursor moves within the anchorLayer while the float is being dragged.
	"drop", when the mouse is released over the anchorLayer while the float is being dragged.
	"invalidDrop", when the mouse is released outside of the anchorLayer while the float is being dragged.

You can listen for events by using

	on(eventName, eventFunction)


---

	disableDragAndDrop()

Once called, the floatLayer will not be draggable, and any drag event listeners will be not be called. (The listeners will remain in the event that enableDragAndDrop() is called. )


---

	onContactChange(startFn,endFn=->)  : returns index

Add an event listener for when the layers come into contact or leave contact.
The function returns an index which can be used to remove the listeners later.


---

	offCollisionChange(index)

Add an event listener for when the layers come into contact or leave contact.
The function returns an index which can be used to remove the listeners later.


---

	onRangeChange(min,max,enterFn,exitFn=->)  : returns index


Add an event handlers for when the distance between the layers enters a specific range. The range is defined by min and max. The enterFn is called when distance becomes \<= max, or \>= min. Vice versa for the exitFn.

The function returns an index which can be used to remove the listeners later.


---

	offRangeChange(index)

Remove a range listener identified by an index


---

	getDistance()

Returns the distance between the two midpoints of the anchorLayer and floatLayer


---

	setDistance(value)

Sets the distance between the two midpoints of the anchorLayer and floatLayer by moving the float layer. Maintains the angle between the two layers. 


---

	midPoint()  : returns [x,y]

Returns the midpoint between the mindpoints of the anchorLayer and floatLayer.


---

	sleep()

No drag events, range events, or collision events will be emitted.


---

	wake()

Drag events, range events, and collision events will be emitted like normal.


---

	destroy()

Call this if the pair is no longer needed. It will go to sleep and all event listeners will be removed. 



