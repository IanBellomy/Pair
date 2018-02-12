###	

	https://github.com/IanBellomy/Pair
	
	— Ian Bellomy
	
###

PairModule = require "Pair"

bg = new Layer
	width: Screen.width
	height: Screen.height
	backgroundColor: "white"
	
blockTarget = new Layer
	width: 50
	height: 50	
	y:200
	backgroundColor: "#ff9900"	

floatBlock = new Layer
	width: 50
	height: 50	
	y:200
	backgroundColor: "black"

blockTarget.center()
floatBlock.centerX()

bg.onMouseDown (event)->
	floatBlock.animate
		properties:
			midX:event.contextPoint.x
			midY:event.contextPoint.y
	

pair = new PairModule.Pair(floatBlock,blockTarget)

contactStartHandler = (floater,anchor)->
	floater.animate
		time:0.35
		properties:
			backgroundColor:anchor.backgroundColor
	
	anchor.animate
		time:0.35
		properties:
			backgroundColor:floater.backgroundColor
			
			
contactEndHandler = (floater,anchor)->	
	floater.animate
		time:0.35
		properties:
			rotation:floater.rotation + 90
	
# 	anchor.animate
# 		time:0.35
# 		properties:
# 			backgroundColor:"black"		

pair.onContactChange contactStartHandler, contactEndHandler

