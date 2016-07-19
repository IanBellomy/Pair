document.body.style.cursor = "default"
PairModule = require "Pair"

dotTarget = new Layer
	width: 50
	height: 50
	borderRadius: 76
	backgroundColor: "black"
	y: 231
	x: 67
	scale:0.25

largeDot = new Layer
	width: 50
	height: 50
	y: 80
	x: 72
	borderRadius: 100	
	borderWidth: 5
	borderColor: "black"
	backgroundColor: "gray"

pair = new PairModule.Pair(largeDot,dotTarget)

pair.enableDragAndDrop()

largeDot.onMouseOver ->
	@animate
		time:0.25
		properties:
			scale:1.2
			borderWidth:2

largeDot.onMouseOut ->
	@animate
		time:0.25
		properties:
			scale:1		
			borderWidth:5

largeDot.onMouseDown ->
	@animate
		time:0.25
		properties:
			backgroundColor: "#ff9900"
			
	dotTarget.animate
		time:0.45
		properties:
			scale: 1.0

largeDot.onMouseUp ->
	@animate
		time:0.5
		properties:
			backgroundColor: "gray"

	dotTarget.animate
		time:0.45
		properties:
			scale: 0.25

dotTarget.onMouseOver ->
	largeDot.animate
		time:0.35
		properties:
			borderWidth:10
	
dotTarget.onMouseOut ->
	largeDot.animate
		time:0.35
		properties:
			borderWidth:5

pair.on "dragStart", (dragged)->
	dragged._startX = largeDot.x
	dragged._startY = largeDot.y

pair.on "dragEnter", (dragged,formerDropTarget)->
	dragged.animate
		time:0.25
		properties:
			scale:0.8
			
	formerDropTarget.animate
		time:0.35
		properties:
			backgroundColor:dragged.backgroundColor
			scale:1.1

pair.on "dragOver", ->
	# nothing.
	
pair.on "dragLeave", (dragged,formerDropTarget)->
	dragged.animate
		time:0.25
		properties:
			scale:1.1
			opacity:1.0
		
	formerDropTarget.animate
		time:0.35
		properties:
			backgroundColor:"black"
			scale:1.0
	
	
pair.on "invalidDrop", (dropped)->	
	dropped.animate
		time:0.35
		properties:
			x:@floater._startX
			y:@floater._startY
	
	@anchor.animate
		time:1
		properties:
			scale:0.25
	
pair.on "drop", (dropped,dropTarget)->
	dropped.animate
		time:0.25
		properties:
			scale: 0
			midX:dropTarget.midX
			midY:dropTarget.midY
			opacity:0
			
	dropTarget.animate
		time:0.35
		properties:
			borderWidth: 5
			borderColor: "#ff9900"
			backgroundColor: "gray"
			scale:1.0
			
	dropTarget.style.pointerEvents = "none"
	dropped.style.pointerEvents = "none"
