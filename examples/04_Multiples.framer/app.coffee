###	

	https://github.com/IanBellomy/Pair
	
	— Ian Bellomy
	
###

PairModule = require "Pair"

dLayer = new Layer
	size:50
	backgroundColor: "black"
	
onDragBegin = ->
	dLayer.animate
		scale:1
		opacity:0.5
		options:
			time:0.35
	
	
onDragEnter = (dragged,dropTarget)->
	dropTarget.borderWidth = 6
	
onDragLeave = (dragged,dropTarget)->	
	dropTarget.borderWidth = 0

onDrop = (dragged,dropTarget)->
	dragged.animate
		x:dropTarget.x
		y:dropTarget.y
		scale:0.8
		opacity:1
		options:
			time:0.35
			
	
for n in [0...10]
	target = new Layer
		size:50
		y:200
		x:n*51
	target.sendToBack()
	
	p = new PairModule.Pair(dLayer,target)
	p.enableDragAndDrop()
	p.onDragStart onDragBegin
	p.onDragEnter onDragEnter
	p.onDragLeave onDragLeave
	p.onDrop onDrop