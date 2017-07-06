###

	Pair module

	See readme.md

	— Ian Bellomy, 2017
	
###



class exports.Pair extends Framer.EventEmitter

	# static properties

	@draggedItems:[]			

	constructor: (@_floater, @_anchor) ->		
		
		if Framer.Version.date < 1499243282	
			throw new TypeError("Pair Module requires Framer Library update")

		# validate
		if !(@_floater instanceof Framer.Layer)
			print "ERROR - Pair module:Pair:constructor,  first argument must be a Layer."
			return

		if !(@_anchor instanceof Framer.Layer)
			print "ERROR - Pair module:Pair:constructor,  second argument must be a Layer."
			return

		if @_floater.parent != @_anchor.parent
			print "ERROR - Pair module:Pair:constructor,  first and second arguments must have the same parent."
			return

		# 'private' properties		
		@_dragAndDropEnabled 	 = false
		@_anchorPreviouslyIgnoredEvents = @_anchor.ignoreEvents
		@_hoveredNode 			= undefined
		@_isOverAnchor			= false			# are we over this anchor
		@_dragging 				= false
		@_validDragTarget 		= false			# are we over any valid anchor / drop target
		@_previousCursor 		= @_floater.style.cursor
		@useHandCursor			= true
		@_previousDraggability 	= false
		@_rangeListeners 		= []		
		@_collisionListeners 	= []	
		@_tempRange 			= undefined
		@_contained 			= false
		@_tempListener 			= {}		
		@_px					= 0
		@_py 					= 0
		@_dSquared = @getDistanceSquared()
		
		# We want these event handler methods to be scoped to the Pair instance when they run, so they're here
		@_floatMouseDown = (event,layer)=>
			@_pauseEvent(event)
			if @useHandCursor then @_floater.style.cursor = "-webkit-grabbing"
		
		@_floatMouseUp = (event,layer)=>			
			@_pauseEvent(event)
			if @useHandCursor then @_floater.style.cursor = "-webkit-grab"
			
		@_floatOver = (event,layer) =>			
			@_pauseEvent(event)
		
		@_dragStartHandler= (event,layer) =>			
			@_pauseEvent(event)			
			@_validDragTarget = false			
			@_dragging = true
			Pair.draggedItems.push @_floater
			# @_floater.style.pointerEvents = "none"
			@_floater.visible = false			
			@_hoveredNode = document.elementFromPoint(event.contextPoint.x, event.contextPoint.y)
			@_isOverAnchor = @_anchor._element.contains(@_hoveredNode)
			@_floater.visible = true
			@emit "dragStart", @_floater
	
		@_dragHandler=(event) =>
			@_pauseEvent(event)			
			@_floater.visible = false			
			@_px = event.contextPoint.x
			@_py = event.contextPoint.y
			nodeUnderneath = document.elementFromPoint(event.contextPoint.x, event.contextPoint.y)
			@_floater.visible = true
			isNowOverAnchor = @_anchor._element.contains(nodeUnderneath)			
			if isNowOverAnchor and not @_isOverAnchor
				@_validDragTarget = true					
				@_isOverAnchor = true
				@_hoveredNode = nodeUnderneath				
				@emit "dragEnter", @_floater, @_anchor
			else if not isNowOverAnchor and @_isOverAnchor
				@_validDragTarget = false				
				@_hoveredNode = nodeUnderneath
				@_isOverAnchor = false
				@emit "dragLeave", @_floater, @_anchor
			else if isNowOverAnchor and @_isOverAnchor and @_validDragTarget
				@emit "dragOver", @_floater, @_anchor
	
		@_dragEndHandler=(event, layer) =>
			@_dragging = false			
			index = Pair.draggedItems.indexOf @_floater
			Pair.draggedItems.splice(index,1)
			if @useHandCursor then @_floater.style.cursor = "-webkit-grab"
			if @_validDragTarget				
				@emit "drop", @_floater, @_anchor
				@_validDragTarget = false
			else			
				@emit "invalidDrop", @_floater
	
			if @hitTest()
				@emit "contactDrop", @_floater, @_anchor
			else 
				@emit "invalidContactDrop", @_floater
				
		@_floatMoveHandler = (event,layer) =>
			@_pauseEvent(event)
			
# 		@_anchorMouseOver=(event,layer)=>
# 			if @_dragging  
# 				nodeUnderneath = document.elementFromPoint(event.clientX, event.clientY)
# 				if Pair.draggedItems.indexOf @_floater isnt -1 and @_hoveredNode != nodeUnderneath
# 					@_validDragTarget = true
# 					@_hoveredNode = nodeUnderneath
# 					print "new node?"
# 					print @_hoveredNode == nodeUnderneath
# 					@emit "dragEnter", @_floater, @_anchor
# 					
# 	
# 		@_anchorMouseOut=(event,layer)=>		
# 			@_pauseEvent(event)
# 			if @_dragging 
# 				if Pair.draggedItems.indexOf @_floater isnt -1
# 					@_validDragTarget = false
# 					@_hoveredNode = document.elementFromPoint(event.clientX, event.clientY)
# 					@emit "dragLeave", @_floater, @_anchor

		
		# ready!
		@wake()
		
		#
		# end constructor
		#
	

	_pauseEvent:(event)->
		event.stopPropagation()
		event.preventDefault()
		event.cancelBubble=true
		event.returnValue=false
		
	#should multiple Pairs be handled in the same listener?
	loopListener: =>
		@_dSquared = @getDistanceSquared()
		for @_tempRange in @_rangeListeners  
			@_contained = @_tempRange.minSquared <= @_dSquared <= @_tempRange.maxSquared 
			if @_contained and not @_tempRange.entered 
				@_tempRange.entered = true
				@_tempRange.enterCallback.apply @
				
			else if not @_contained and @_tempRange.entered
				@_tempRange.entered = false
				@_tempRange.exitCallback.apply @			

		if @hitTest()
			for @_tempListener in @_collisionListeners
				@_tempListener.contact++ || @_tempListener.contactStart(@_floater,@_anchor)
				
		else
			for @_tempListener in @_collisionListeners
				if(@_tempListener.contact)
					@_tempListener.contact = false
					@_tempListener.contactEnd(@_floater,@_anchor)
		
		
		# requestAnimationFrame(@loopListener)
	
	getDistance: ->
		return Math.sqrt((@_floater.midX-@_anchor.midX)**2 + (@_floater.midY-@_anchor.midY)**2)
	
	getDistanceSquared: ->
		return (@_floater.midX-@_anchor.midX)**2 + (@_floater.midY-@_anchor.midY)**2
	
	setDistance:(newDistance)->
		distanceDiffRatio = newDistance/ Math.sqrt(@_dSquared)

		oldXOffset = @_floater.midX - @_anchor.midX
		newXOffset = oldXOffset * distanceDiffRatio
		@_floater.midX = @_anchor.midX + newXOffset

		oldYOffset = @_floater.midY - @_anchor.midY
		newYOffset = oldYOffset * distanceDiffRatio
		@_floater.midY = @_anchor.midY + newYOffset

	
	# the co-ordinates between the anchor and floater
	midpoint: ->
		return [(@_anchor.midX + @_floater.midX)/2.0,(@_anchor.midY + @_floater.midY)/2.0]
	
	#returns true if the anchor and floater frames touch		
	hitTest:->
		r1 = @_anchor
		r2 = @_floater
		return !( r2.x > r1.x + r1.width or r2.x + r2.width < r1.x or r2.y > r1.y + r1.height or r2.y + r2.height < r1.y)

	enableDragAndDrop:->		
		@_dragAndDropEnabled = true		
		@_previousDraggability = @_floater.draggable.enabled # FIXME: Bug in framer makes this return true if accessed!
		@_floater.draggable.enabled = true
		@_previousCursor = @_floater.style.cursor
		if @useHandCursor then @_floater.style.cursor = "-webkit-grab"
		@_hoveredNode = undefined
		@_anchorPreviouslyIgnoredEvents = @_anchor.ignoreEvents
		@_anchor.ignoreEvents = false
		
		@_floater.on Events.MouseDown, @_floatMouseDown
		@_floater.on Events.MouseUp, @_floatMouseUp
		@_floater.on Events.MouseMove, @_floatMoveHandler		
		@_floater.on Events.MouseOver, @_floatOver	
		@_floater.on Events.DragStart, @_dragStartHandler
		@_floater.on Events.DragMove, @_dragHandler
		@_floater.on Events.DragEnd, @_dragEndHandler		

	disableDragAndDrop:->	
		@_dragging = false	
		@_dragAndDropEnabled = false		
		@_floater.draggable.enabled = false # @_previousDraggability # Doesn't work because bug in framer
		if @useHandCursor then @_floater.style.cursor = @_previousCursor
		@_anchor.ignoreEvents = @_anchorPreviouslyIgnoredEvents

		@_floater.off Events.MouseDown, @_floatMouseDown
		@_floater.off Events.MouseUp, @_floatMouseUp
		@_floater.off Events.MouseMove, @_floatMoveHandler
		@_floater.off Events.MouseOver, @_floatOver	
		@_floater.off Events.DragStart, @_dragStartHandler
		@_floater.off Events.DragMove, @_dragHandler
		@_floater.off Events.DragEnd, @_dragEndHandler		
		

	sleep:->
		Framer.Loop.off "update", @loopListener
		# disable drag and drop, remember what the state was

	wake:->
		# requestAnimationFrame(@loopListener)

		Framer.Loop.on "update", @loopListener

		# update contact properties of listeners?
		# enabled drag and drop if this was active before

	destroy:->
		@disableDragAndDrop()
		@sleep()
		# that's it! I think...


	#
	#	Event Handling
	#

	#returns an index
	onRangeChange: (min,max,enterFn,exitFn = ->) ->
		count = @_rangeListeners.push
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

		@_rangeListeners[index] = null


	# Returns index
	onContactChange: (startFn,endFn=->) ->		
		count = (@_collisionListeners.push 
			contactStart:startFn
			contactEnd:endFn
			contact:false) - 1	

		return count


	offContactChange: (index) ->
		if !(index instanceof Number)
			print "ERROR - Pair:offContactChange(index), index must be a Number"
			return

		@_collisionListeners[index] = null 	

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

	onContactDrop: (fn)->
		@on "contactDrop", fn

	onInvalidContactDrop: (fn)->
		@on "invalidContactDrop", fn
