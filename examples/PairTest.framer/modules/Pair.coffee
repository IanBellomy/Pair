###

	Pair module

	See readme.md

	— Ian Bellomy, 2016
	
###

class exports.Pair extends Framer.EventEmitter

	# state properties
	@draggedItems:[]	
	
	# private properties
	_dragAndDropEnabled = false
	_hoveredNode = undefined
	_dragging = false
	_validDragTarget = false
	_previousPointerEvents = "auto"
	_previousDraggability = false

	#should-be private properties
	rangeListeners: []	
	angleListeners: []			
	collisionListeners: []	
	tempRange: undefined
	dSquared: 0
	contained: false
	tempListener: {}

	constructor: (@floater, @anchor) ->
		if @floater.parent != @anchor.parent
			print "ERROR:Pair.coffee:Pair:constructor,  @floater and @anchor must have the same parent."
			return

		dSquared = @getDistanceSquared()		
		@wake()

		#private methods
		@dragStartHandler = (event,layer) =>
			@_validDragTarget = false
			@_previousPointerEvents = @floater.style.pointerEvents
			@_dragging = true
			Pair.draggedItems.push @floater
			# @floater.style.pointerEvents = "none"
			@floater.visible = false
			@_hoveredNode = document.elementFromPoint(event.clientX, event.clientY)
			@floater.visible = true
			@emit "dragStart", @floater

		@dragHandler = (event) =>			
			@floater.visible = false
			nodeUnderneath = document.elementFromPoint(event.clientX, event.clientY)
			@floater.visible = true
			if nodeUnderneath != @_hoveredNode # touched something new...				
				if @anchor._element == nodeUnderneath # touched anchor?
					@_validDragTarget = true					
					@_hoveredNode = nodeUnderneath
					@emit "dragEnter", @floater, @anchor
				else if @_hoveredNode == @anchor._element #left anchor?
					@_validDragTarget = false				
					@_hoveredNode = nodeUnderneath
					@emit "dragLeave", @floater, @anchor
			else if @_validDragTarget
				@emit "dragOver", @floater, @anchor

		@dragEndHandler = (event, layer) =>
			@_dragging = false
			# @floater.style.pointerEvents = @_previousPointerEvents
			index = Pair.draggedItems.indexOf @floater
			Pair.draggedItems.splice(index,1)
			if @_validDragTarget				
				@emit "drop", @floater, @anchor
				@_validDragTarget = false
			else			
				@emit "invalidDrop", @floater

		@anchorMouseOver = (event,layer)=>
			if @_dragging  
				if Pair.draggedItems.indexOf @floater isnt -1
					@_validDragTarget = true
					@emit "dragEnter", @floater, @anchor

		@anchorMouseOut = (event,layer)=>
			if @_dragging 
				if Pair.draggedItems.indexOf @floater isnt -1
					@_validDragTarget = false
					@emit "dragLeave", @floater, @anchor
		#end private methods


	#should multiple Pairs be handled in the same listener?
	loopListener: =>
		@dSquared = @getDistanceSquared()
		for @tempRange in @rangeListeners  
			@contained = @tempRange.minSquared <= @dSquared <= @tempRange.maxSquared 
			if @contained and not @tempRange.entered 
				@tempRange.entered = true
				@tempRange.enterCallback.apply @
				
			else if not @contained and @tempRange.entered
				@tempRange.entered = false
				@tempRange.exitCallback.apply @			
		if @hitTest()
			for @tempListener in @collisionListeners
				@tempListener.contact++ || @tempListener.contactStart(@anchor,@floater)
				
		else
			for @tempListener in @collisionListeners
				if(@tempListener.contact)
					@tempListener.contact = false
					@tempListener.contactEnd(@anchor,@floater)


	
	#returns an index
	onRangeChange: (min,max,enterFn,exitFn = ->) ->
		count = @rangeListeners.push
			min:min
			max:max
			minSquared: min**2
			maxSquared: max**2
			enterCallback: enterFn
			exitCallback: exitFn
			entered:false
		
		return count - 1


	offRangeChange: (index) ->
		@rangeListeners[index] = null

	#returns index
	onContactChange: (startFn,endFn=->) ->
		count = (@collisionListeners.push 
			contactStart:startFn
			contactEnd:endFn
			contact:false) - 1	

		return count


	offContactChange: (index) ->
		@collisionListeners[index] = null 			


	
	getDistance: ->
		return Math.sqrt((@floater.midX-@anchor.midX)**2 + (@floater.midY-@anchor.midY)**2)
	
	getDistanceSquared: ->
		return (@floater.midX-@anchor.midX)**2 + (@floater.midY-@anchor.midY)**2
	
	setDistance:(newDistance)->
		distanceDiffRatio = newDistance/ Math.sqrt(@dSquared)

		oldXOffset = @floater.midX - @anchor.midX
		newXOffset = oldXOffset * distanceDiffRatio
		@floater.midX = @anchor.midX + newXOffset

		oldYOffset = @floater.midY - @anchor.midY
		newYOffset = oldYOffset * distanceDiffRatio
		@floater.midY = @anchor.midY + newYOffset

		# get x,y components
		# calculate offset

	
	# the co-ordinates between the anchor and floater
	# FIXME!! In what space? Assuming they have the same parent!	
	midpoint: ->
		return [(@anchor.midX + @floater.midX)/2.0,(@anchor.midY + @floater.midY)/2.0]
	
	#returns true if the anchor and floater frames touch		
	hitTest:->
		r1 = @anchor
		r2 = @floater
		return not( r2.x > r1.x + r1.width or r2.x + r2.width < r1.x or r2.y > r1.y + r1.height or r2.y + r2.height < r1.y);

	# what happens when there are other buttons?
	# the cursor should really be captured somehow.
	# (insert a blocking layer below the @floater?)
	# don't use the original element / clone the floater and pass that?
	# how to get rid of that stupid text cursor!?!	

	enableDragAndDrop:->
		@_dragAndDropEnabled = true
		@_previousDraggability = @floater.draggable
		@floater.draggable = true
		# @floater.style.cursor = "-webkit-grab"
		@_hoveredNode = undefined

		@floater.on Events.DragStart, @dragStartHandler
		@floater.on Events.DragMove, @dragHandler
		@floater.on Events.DragEnd, @dragEndHandler		
		@anchor.on Events.MouseOver, @anchorMouseOver
		@anchor.on Events.MouseOut, @anchorMouseOut


	disableDragAndDrop:->	
		@_dragging = false	
		@_dragAndDropEnabled = false
		@floater.draggable = @_previousDraggability

		print @_previousDraggability

		@floater.off Events.DragStart, @dragStartHandler
		@floater.off Events.DragMove, @dragHandler
		@floater.off Events.DragEnd, @dragEndHandler		
		@anchor.off Events.MouseOver, @anchorMouseOver
		@anchor.off Events.MouseOut, @anchorMouseOut

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


makePairs = (float,anchors)->
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