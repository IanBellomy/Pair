###	

	https://github.com/IanBellomy/Pair
	
	— Ian Bellomy
	
###

document.body.style.cursor = "default"
PairModule = require "Pair"

blockTarget = new Layer
	width: 50
	height: 50	
	y:200
	backgroundColor: "#ddd"	

floatBlock = new Layer
	width: 50
	height: 50	
	backgroundColor: "gray"
	y:400

floatBlock.centerX()
blockTarget.centerX()

pair = new PairModule.Pair(floatBlock,blockTarget)

pair.enableDragAndDrop()

floatBlock.onMouseOver ->
	@animate
		time:0.25
		properties: 
			backgroundColor:"#ff9900"

floatBlock.onMouseOut ->	
	# this should need to be here but... webtech, ¯\_(ツ)_/¯
	return if floatBlock.ignoreEvents 		 
	
	@animate
		time:0.25
		properties:
			backgroundColor:"gray"

floatBlock.onMouseDown ->
	@animate
		time:0.25
		properties:
			backgroundColor: "#ff9900"
			
	blockTarget.animate
		time:0.45
		properties:
			backgroundColor:"black"

floatBlock.onMouseUp ->
	@animate
		time:0.5
		properties:
			backgroundColor: "gray"

	blockTarget.animate
		time:0.45
		properties:
			backgroundColor:"#ddd"

pair.onDragStart (dragged)->
	dragged._startX = floatBlock.x
	dragged._startY = floatBlock.y

contactStartHandler = (floater,anchor)->
	floater.animate
		time:0.35
		properties:
			backgroundColor:"black"
	
	anchor.animate
		time:0.35
		properties:
			backgroundColor:"#ff9900"
			
			
contactEndHandler = (floater,anchor)->	
	floater.animate
		time:0.35
		properties:
			backgroundColor:"#ff9900"
	
	anchor.animate
		time:0.35
		properties:
			backgroundColor:"black"		

pair.onContactChange contactStartHandler, contactEndHandler

pair.onInvalidContactDrop (dropped)->	
	dropped.animate
		time:0.35
		properties:
			x:dropped._startX
			y:dropped._startY
	
	blockTarget.animate
		time:0.35
		properties:
			backgroundColor:"#ddd"
	
pair.onContactDrop (dropped,dropTarget)->
	dropTarget.ignoreEvents = true
	dropped.ignoreEvents = true	
		
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
			borderColor: "black"
			backgroundColor: "#ff9900"
			scale:1
			
	
