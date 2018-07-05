targetLayer = new Layer	
dragLayer 	= new Layer
	html:"Drag me up"
dragLayer.y += 201
myPair 		= new PairModule.Pair(dragLayer,targetLayer)
myPair.enableDragAndDrop()
myPair.onDrop ->
	print "dragLayer dropped on targetLayer"

# See examples for more: https://github.com/IanBellomy/Pair