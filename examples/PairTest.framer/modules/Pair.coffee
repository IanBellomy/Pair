###

	Pair module

	See readme.md

	— Ian Bellomy, 2016
	
###

class exports.Pair extends Framer.EventEmitter

	# static properties

	@draggedItems:[]		

	# private properties
	_floater				= {}
	_anchor					= {}
	_dragAndDropEnabled 	= false
	_hoveredNode 			= undefined
	_dragging 				= false
	_validDragTarget 		= false
	_previousPointerEvents 	= "auto"
	_previousDraggability 	= false
	_rangeListeners 		= []		
	_collisionListeners 	= []	
	_tempRange 				= undefined
	_dSquared 				= 0
	_contained 				= false
	_tempListener 			= {}

	constructor: (floater, anchor) ->		

		if !(floater instanceof Framer.Layer)
			print "ERROR - Pair module:Pair:constructor,  first argument must be a Layer."
			return

		if !(anchor instanceof Framer.Layer)
			print "ERROR - Pair module:Pair:constructor,  second argument must be a Layer."
			return

		if floater.parent != anchor.parent
			print "ERROR - Pair module:Pair:constructor,  first and second arguments must have the same parent."
			return

		_dSquared = @getDistanceSquared()		

		_floater = floater
		_anchor	= anchor

		@wake()

		# These private methods will be event handlers attached to the floater and anchor layers.
		# They should stay scoped to the Pair instance when called. 

		@dragStartHandler = (event,layer) =>			
			_validDragTarget = false
			_previousPointerEvents = _floater.style.pointerEvents
			_dragging = true
			Pair.draggedItems.push _floater
			# _floater.style.pointerEvents = "none"
			_floater.visible = false
			_hoveredNode = document.elementFromPoint(event.clientX, event.clientY)
			_floater.visible = true
			@emit "dragStart", _floater

		@dragHandler = (event) =>			
			_floater.visible = false
			nodeUnderneath = document.elementFromPoint(event.clientX, event.clientY)
			_floater.visible = true
			if nodeUnderneath != @_hoveredNode # touched something new...				
				if _anchor._element == nodeUnderneath # touched anchor?
					@_validDragTarget = true					
					@_hoveredNode = nodeUnderneath
					@emit "dragEnter", _floater, _anchor
				else if @_hoveredNode == _anchor._element #left anchor?
					@_validDragTarget = false				
					@_hoveredNode = nodeUnderneath
					@emit "dragLeave", _floater, _anchor
			else if @_validDragTarget
				@emit "dragOver", _floater, _anchor

		@dragEndHandler = (event, layer) =>
			@_dragging = false
			# _floater.style.pointerEvents = @_previousPointerEvents
			index = Pair.draggedItems.indexOf _floater
			Pair.draggedItems.splice(index,1)
			if @_validDragTarget				
				@emit "drop", _floater, _anchor
				@_validDragTarget = false
			else			
				@emit "invalidDrop", _floater

		@anchorMouseOver = (event,layer)=>
			if @_dragging  
				if Pair.draggedItems.indexOf _floater isnt -1
					@_validDragTarget = true
					@emit "dragEnter", _floater, _anchor

		@anchorMouseOut = (event,layer)=>
			if @_dragging 
				if Pair.draggedItems.indexOf _floater isnt -1
					@_validDragTarget = false
					@emit "dragLeave", _floater, _anchor
				
		#end private methods


	#should multiple Pairs be handled in the same listener?
	loopListener: =>
		_dSquared = @getDistanceSquared()
		for _tempRange in _rangeListeners  
			_contained = _tempRange.minSquared <= _dSquared <= _tempRange.maxSquared 
			if _contained and not _tempRange.entered 
				_tempRange.entered = true
				_tempRange.enterCallback.apply @
				
			else if not _contained and _tempRange.entered
				_tempRange.entered = false
				_tempRange.exitCallback.apply @			

		if @hitTest()
			for _tempListener in _collisionListeners
				_tempListener.contact++ || _tempListener.contactStart(_anchor,_floater)
				
		else
			for _tempListener in _collisionListeners
				if(_tempListener.contact)
					_tempListener.contact = false
					_tempListener.contactEnd(_anchor,_floater)


			


	
	getDistance: ->
		return Math.sqrt((_floater.midX-_anchor.midX)**2 + (_floater.midY-_anchor.midY)**2)
	
	getDistanceSquared: ->
		return (_floater.midX-_anchor.midX)**2 + (_floater.midY-_anchor.midY)**2
	
	setDistance:(newDistance)->
		distanceDiffRatio = newDistance/ Math.sqrt(_dSquared)

		oldXOffset = _floater.midX - _anchor.midX
		newXOffset = oldXOffset * distanceDiffRatio
		_floater.midX = _anchor.midX + newXOffset

		oldYOffset = _floater.midY - _anchor.midY
		newYOffset = oldYOffset * distanceDiffRatio
		_floater.midY = _anchor.midY + newYOffset

	
	# the co-ordinates between the anchor and floater
	# FIXME!! In what space? Assuming they have the same parent!	
	midpoint: ->
		return [(_anchor.midX + _floater.midX)/2.0,(_anchor.midY + _floater.midY)/2.0]
	
	#returns true if the anchor and floater frames touch		
	hitTest:->
		r1 = _anchor
		r2 = _floater
		return not( r2.x > r1.x + r1.width or r2.x + r2.width < r1.x or r2.y > r1.y + r1.height or r2.y + r2.height < r1.y);


	# what happens when there are other buttons?
	# the cursor should really be captured somehow.
	# (insert a blocking layer below the _floater?)
	# don't use the original element / clone the floater and pass that?
	# how to get rid of that stupid text cursor!?!	

	enableDragAndDrop:->
		@_dragAndDropEnabled = true
		@_previousDraggability = _floater.draggable
		_floater.draggable = true
		# _floater.style.cursor = "-webkit-grab"
		@_hoveredNode = undefined

		_floater.on Events.DragStart, @dragStartHandler
		_floater.on Events.DragMove, @dragHandler
		_floater.on Events.DragEnd, @dragEndHandler		
		_anchor.on Events.MouseOver, @anchorMouseOver
		_anchor.on Events.MouseOut, @anchorMouseOut


	disableDragAndDrop:->	
		@_dragging = false	
		@_dragAndDropEnabled = false
		_floater.draggable = @_previousDraggability

		print @_previousDraggability

		_floater.off Events.DragStart, @dragStartHandler
		_floater.off Events.DragMove, @dragHandler
		_floater.off Events.DragEnd, @dragEndHandler		
		_anchor.off Events.MouseOver, @anchorMouseOver
		_anchor.off Events.MouseOut, @anchorMouseOut

	sleep:->
		Framer.Loop.off "update", @loopListener
		# disable drag and drop, remember what the state was

	wake:->
		Framer.Loop.on "update", @loopListener
		# update contact properties of listeners?
		# enabled drag and drop if this was active before

	destroy:->
		@disableDragAndDrop()
		@sleep()
		# that's it! I think...


	#
	#	Event Handler 
	#

	#returns an index
	onRangeChange: (min,max,enterFn,exitFn = ->) ->
		count = _rangeListeners.push
			min:min
			max:max
			minSquared: min**2
			maxSquared: max**2
			enterCallback: enterFn
			exitCallback: exitFn
			entered:false
		
		return count - 1


	offRangeChange: (index) ->
		if !(index instanceof Number)
			print "ERROR - Pair:offRangeChange(index), index must be a Number"
			return

		_rangeListeners[index] = null


	# Returns index
	onContactChange: (startFn,endFn=->) ->
		count = (_collisionListeners.push 
			contactStart:startFn
			contactEnd:endFn
			contact:false) - 1	

		return count


	offContactChange: (index) ->
		if !(index instanceof Number)
			print "ERROR - Pair:offContactChange(index), index must be a Number"
			return

		_collisionListeners[index] = null 	

	#	
	#	Event handling convenience functions
	#

	onDragStart: (fn)->
		@on "dragStart", fn

	onDragEnter: (fn)->
		@on "dragEnter", fn

	onDragOver: (fn)->
		@on "dragOver", fn

	onDragLeave: (fn)->
		@on "dragLeave", fn

	onInvalidDrop: (fn)->
		@on "invalidDrop", fn

	onDrop: (fn)->
		@on "drop", fn


### 

	Convenience function for making multiple pairs. 
	
### 

exports.makePairs = (float,anchors)->
	pairs = []
	for anchor in anchors
		p = new Pair float, anchor

	return pairs


### 

TODO:

	Cursor issue: Text carrot while dragging... 
		not resolvable

	Animating distance?

###