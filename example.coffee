dragLayer 	= new Layer
targetLayer = new Layer
myPair 		= new PairModule.Pair(dragLayer,targetLayer)
myPair.enableDragAndDrop()
myPair.onDrop ->
	print "dragLayer dropped on targetLayer"

# See examples for more: https://github.com/IanBellomy/Pair
