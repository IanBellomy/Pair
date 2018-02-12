###	

	https://github.com/IanBellomy/Pair
	
	— Ian Bellomy
	
###

document.body.style.cursor = "default" 
PairModule = require "Pair"

dotTarget = new Layer
	width: 50
	height: 50
	borderRadius: 76
	backgroundColor: "black"
	y: 80
	x: 67
	scale:0.25

largeDot = new Layer
	width: 50
	height: 50
	y: 231
	x: 72
	borderRadius: 100	
	borderWidth: 5
	borderColor: "black"
	backgroundColor: "gray"

largeDot.centerX()
dotTarget.centerX()

pair = new PairModule.Pair(largeDot,dotTarget)

pair.enableDragAndDrop()

largeDot.onMouseOver ->
	@animate
		options:
			time:0.25
		scale:1.2

largeDot.onMouseOut ->	

	# this shouldn't need to be here but... webtech, ¯\_(ツ)_/¯
	return if largeDot.ignoreEvents 
	
	@animate
		options:
			time:0.25		
		scale:1		

largeDot.onMouseDown ->
	@animate
		options:
			time:0.25		
		backgroundColor: "#ff9900"
			
	dotTarget.animate
		options:
			time:0.45	
		scale: 1.0

largeDot.onMouseUp ->
	@animate
		options:
			time:0.5	
		backgroundColor: "gray"

	dotTarget.animate
		options:
			time:0.45	
		scale: 0.25

dotTarget.onMouseOver ->
	largeDot.animate
		options:
			time:0.35	
		borderWidth:10
	
dotTarget.onMouseOut ->
	largeDot.animate
		options:
			time:0.35	
		borderWidth:5

pair.onDragStart (dragged)->
	dragged._startX = dragged.x
	dragged._startY = dragged.y

pair.onDragEnter (dragged,dropTarget)->
	dragged.animate
		options:
			time:0.25
		scale:0.8
		borderWidth:10
			
	dropTarget.animate
		options:
			time:0.35
		borderWidth:5
		borderColor:dragged.backgroundColor
		scale:1.2

pair.onDragOver ->
	# ¯\_(ツ)_/¯
	
pair.onDragLeave (dragged,formerDropTarget)->
	dragged.animate
		options:
			time:0.25		
		scale:1.1
		opacity:1.0
		borderWidth:5
		
	formerDropTarget.animate
		options:
			time:0.35		
		borderWidth:0
		scale:1
	
	
pair.onInvalidDrop (dropped)->	
	dropped.animate
		options:
			time:0.35		
		x:dropped._startX
		y:dropped._startY
	
	dotTarget.animate
		options:
			time:1		
		scale:0.25
	
pair.onDrop (dropped,dropTarget)->
	dropTarget.ignoreEvents = true
	dropped.ignoreEvents = true	
		
	dropped.animate
		options:
			time:0.25		
		scale: 0
		midX:dropTarget.midX
		midY:dropTarget.midY
		opacity:0
			
	dropTarget.animate
		options:
			time:0.35		
		borderWidth: 5
		borderColor: "black"
		backgroundColor: "#ff9900"
		scale:1
			
	
