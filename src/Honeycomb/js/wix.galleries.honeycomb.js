//var props, items, slots2;
var HoneycombController = function (element, config) {
	var self = this;
	self.resize = _.debounce(_.bind(self._resize, self), 50);
	self.items = []
	self.props = {}
	// NOTE: calling super (parent) constructor
	HoneycombController.super_.apply(self, arguments)
}
utils.inherits(HoneycombController, SimpleAppProto);

HoneycombController.prototype.updatePixelRatio = function(){
	// Calculate canvas size for hi ppi rate devices to prevent pixelated pictures
	var self = this,
    viewportSize = self.getViewportSize();
	
	const canvasContext = self.canvas.getContext('2d');
	if (canvasContext) {
		const devicePixelRatio = Math.ceil(window.devicePixelRatio);

		self.canvas.width *= devicePixelRatio;
		self.canvas.height *= devicePixelRatio;

		self.canvas.style.width = self.canvas.width + 'px';
		self.canvas.style.height = self.canvas.height + 'px';

		canvasContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
	}
}

HoneycombController.prototype.createDom = function(config){
  //	console.log('createDom')
  var self = this,
    viewportSize = self.getViewportSize();

  self.canvas = document.createElement('canvas');

  self.canvas.width = viewportSize.width;
  self.canvas.height = viewportSize.height;

  self.updatePixelRatio()

  self.canvas.setAttribute('hidpi', 'off');
  self.quality = (config || {}).quality || {};

  var maxPotentialShapeWidth = Math.ceil(
    window.screen.width / (self.props.numOfColumns + 0.5)
  );

  _.each(self.items, function (item, index) {
    var ratio = item.width / maxPotentialShapeWidth;
    item.canvasURI = utils.getResizedImageUrl(
      item.uri,
      maxPotentialShapeWidth,
      Math.ceil(item.height / ratio),
      {
        siteQuality: self.quality,
        maxWidth: item.width,
        maxHeight: item.height
      }
    );
  });

  self.el.append(self.canvas);
  paper.setup(self.canvas);
  paper.project.activeLayer.remove();
}

HoneycombController.prototype.calcViewportOffset = function(){
	return this.shapeSideMargin()
}

HoneycombController.prototype.gridOutline = function(cells){
	var self = this
		, outlineLayer = self.outlineLayer()
		, cellDim = self.gridCellDim(self.sides)

	var gridPath = new paper.CompoundPath({children:[
		new paper.Path.Rectangle([0,0], [0.1, 0.1])
	]})

	var trail = []
	for (var i=0; i<self.layout.length; i++){
		var cellData = self.layout[i]
			, inverted = cellData.rotated
			, pos = cellData.position
			, cell
			, lastCell = (i == self.items.length-1)

		if (self.sides == 6){
			cell = new paper.Path.RegularPolygon(pos, 6, cellDim.radius)
		}

		if (self.sides == 4){
			cell = new paper.Path.RegularPolygon(pos, 4, cellDim.radius)
			cell.rotate(45)
		}

		if (self.sides == 3){
			cell = new paper.Path.RegularPolygon(pos, 3, cellDim.radius)
			cell.rotate(inverted ? 90 : -90)
//			cell.rotate(!inverted ? 60 : -120)
		}

		cell.invertedShape = cellData.rotated
		drill = cell.clone();
		cell.scale(cellData.outlineScaleFactor)
		cell.position = pos
		drill.position = pos;

		if (cellData.outlineCorrection){
			cell.position.x += cellData.outlineCorrection
		}
		cell.isGridCell = true
		gridPath.addChild(cell);

		if (self.sides==3 && lastCell && (self.items.length % self.props.numOfColumns != 0)){
			if (cellData.rotated){
				var tmpIndex = i - (self.props.numOfColumns-1)
					, tmpData = self.layout[tmpIndex]
	//				, tmpCellScale = (cellDim.width+self.props.margin*Math.sqrt(3)*2)/(cellDim.width+self.props.margin)
					, tmpCell = cell.clone(false)

				tmpCell.position = tmpData.position;
				tmpCell.isTrailCell = true
				tmpCell.position.y += self.props.margin*Math.sqrt(3) / ((cellData.col==0)?3:2) //((self.props.numOfColumns <= 4) ? 3 : 2)
//				tmpCell.position.x -= self.props.margin*.25
				trail.push(tmpCell)
			} else {
				var tmpCell = cell.clone(false)
				tmpCell.rotate(180)
				tmpCell.position.x = cell.bounds.center.x+cell.bounds.width
				tmpCell.position.y = cell.position.y
				var clip = new paper.Path.Rectangle([tmpCell.bounds.topLeft.x+self.props.margin/2, 0], tmpCell.bounds.bottomRight);
				var zhopa = tmpCell.subtract(clip)
				clip.remove()
				tmpCell.remove()
				zhopa.isTrailCell = true
				trail.push(zhopa)
			}
		}
	}

	if (trail.length){
		gridPath.addChildren(trail)
	}

	gridPath.fillColor = self.props.holesColor
	gridPath.fillColor.alpha = self.props.alphaHolesColor;
	outlineLayer.addChild(gridPath);
}

HoneycombController.prototype.gridCellDim = function(sides){
	var self = this
		, viewportWidth = self.getViewportSize().width - (self.shapeSideMargin()*(self.props.numOfColumns+1))
		, height, width, radius, side, bw, bh;
	switch (sides){
		case 6:
			viewportWidth -= self.shapeSideMargin()*0.5
			height = viewportWidth / (this.props.numOfColumns)//+.5)
			radius = height / Math.sqrt(3)
			width = 2 * radius;
			side = radius;
			bw = height;
			bh = width;
			break;
		case 3:
			height = viewportWidth / this.props.numOfColumns
			side = 2 * height / Math.sqrt(3)
			width = Math.sqrt(3) * side / 2
			radius = side / Math.sqrt(3);
			bh = side;
			bw = width;
			break;
		case 4:
			radius = viewportWidth / (this.props.numOfColumns) / 2;
			width = side = height = radius / Math.sqrt(2);
			bh = bw = 2 * radius;
			break;
		default:
			radius = viewportWidth / this.props.numOfColumns;
			bh = bw = 2 * radius;
			break;
	}

	return {
		height: height
		, width: width
		, radius: radius
		, side: side
		, bounds:{
			width: bw,
			height: bh
		}
	}
}

HoneycombController.prototype.serviceLayer = function(){
	if (!this._serviceLayer){
		this._serviceLayer = new paper.Layer();
		this._serviceLayer.visible=false;
	}
	this._serviceLayer.nam = 'service'
	return this._serviceLayer
}

HoneycombController.prototype.gridLayer = function(){
	if (!this._gridLayer){
		this._gridLayer = new paper.Layer();
	}
	this._gridLayer.nam = 'grid'
	return this._gridLayer
}

HoneycombController.prototype.displayLayer = function(){
	var self = this
		, startTime
		, transDuration = 0.2
		, finalAlpha = self.props.alphaBackgroundMouseoverColor;

	if (!self._displayLayer){
		self._displayLayer = new paper.Layer({});
		self._displayLayer.addChild(new paper.Shape.Rectangle(paper.view.bounds.topLeft, paper.view.bounds.bottomRight))
		self._displayLayer.firstChild.fillColor = 'red';
		self._displayLayer.firstChild.fillColor.alpha = 0;
		self._displayLayer.onClick = function(e){
			var p = e.point;
			var cells = _.rest(self._displayLayer.children)
			for (var i = 0; i < cells.length; i++) {
				if (cells[i].contains(p)){
//					console.log('click', i)
					return self.itemClick(self.items[i], i, {}, e);
				}
			}
		}

		self._displayLayer.onFrame = function(e){
//			console.log('onframe')
			var diff;
			if (self.activeShape){
				if (!self.activeShape.fillColor){
					self.activeShape.fillColor = self.props.backgroundMouseoverColor
					self.activeShape.fillColor.alpha = 0
				}
//				if (!startTime || self.activeShape.fillColor.alpha == 0){
//					startTime = e.time;
//					diff = 0.01;
//				} else {
//					diff = e.time - startTime
//				}
//				if (self.activeShape.fillColor.alpha < finalAlpha){
//					self.activeShape.fillColor.alpha = Math.min(finalAlpha * (diff / transDuration), finalAlpha)
//					if (self.prevActiveShape && self.prevActiveShape!==self.activeShape && self.prevActiveShape.fillColor.alpha > 0){
//						self.prevActiveShape.fillColor.alpha = finalAlpha - self.activeShape.fillColor.alpha
//					}
//				} else {
//					self.prevActiveShape = self.activeShape
//					startTime = e.time;
//				}
			} else if (self.prevActiveShape){
				diff = e.time - startTime;
				self.prevActiveShape.fillColor = self.props.backgroundMouseoverColor;
				self.prevActiveShape.fillColor.alpha = Math.max(finalAlpha - finalAlpha * (diff / transDuration), 0)
			}
		}


		self._displayLayer.onMouseMove = function(e){
//			console.log('move')
			var p = e.point;
			var inShape = false;
			var focusNodes = self._displayLayer.children;

			for (var i=1; i<focusNodes.length; i++){
				var holder = focusNodes[i];
				if (holder.visible && holder.contains(p)){
//					console.log('inshape' ,self.activeShape, holder)
					self.activeShape = holder;
					self.activeShape.fillColor = self.props.backgroundMouseoverColor
					self.activeShape.fillColor.alpha = self.props.alphaBackgroundMouseoverColor;
//					self.activeShape = holder;
					inShape = true;
					if (self.activeShape && self.activeShape !== holder){
						self.activeShape.fillColor = self.props.backgroundMouseoverColor
						self.activeShape.fillColor.alpha = 0;
					}
					self.activeShape = holder
					if (self.props.galleryImageOnClickAction != "disabled") {
						self.el.addClass('in-shape');
					}
				} else {
					holder.fillColor  = self.props.backgroundMouseoverColor
					holder.fillColor.alpha = 0
				}
			}

			if (!inShape) {
				self.activeShape = null
				self.el.removeClass('in-shape');
			}
		}
	}
	self._displayLayer.firstChild.onitve = self._displayLayer.onMouseMove
//	self._displayLayer.nam = 'display'
	return self._displayLayer
}


HoneycombController.prototype.outlineLayer = function(){
	var self = this
	if (!self._outlineLayer){
		self._outlineLayer = new paper.Layer();
	}
//	self._outlineLayer.nam = 'outline'
	return self._outlineLayer
}

HoneycombController.prototype.createCellShape = function(dim){
	var shape = new paper.Path.RegularPolygon({x:-10000, y:-10000}, this.sides, dim.radius);
	this.serviceLayer().addChild(shape);
//	console.log(shape)
	switch (this.sides){
		case 6:
			shape.rotate(0);
			break;
		case 3:
//			shape.rotate(-60);
			shape.rotate(-90);
			break;
		case 4:
			shape.rotate(45);
			break;
	}
	return shape
}

HoneycombController.prototype.calcGrid = function(){
//	console.log('calcGrid')
	var self = this
		, outlineLayer = self.outlineLayer()
		, layer = self.gridLayer()
		, cellDim = self.gridCellDim(self.sides)
		, cellShape = self.createCellShape(cellDim)
//	console.log(cellShape)
	self.cells = self.drawGrid(layer, cellShape)

	self.gridOutline(self.cells);
	self.serviceLayer().visible = false;
	paper.view.draw();
}

HoneycombController.prototype.updateCanvasSize = function(){
//	console.log('updateCanvasSize')
	var self = this
		, cellDim = self.gridCellDim(self.sides)
		, cellRadius = cellDim.radius
		, cellMargin = self.shapeSideMargin()
		, cellsNum = self.items.length
		, colsNum = self.props.numOfColumns
		, viewportSize = self.getViewportSize()
		, size = {
			height : self.canvas.height,
			width : viewportSize.width,
			oldHeight: self.canvas.height,
			oldWidth: self.canvas.width,
			cols: colsNum,
			rows : Math.ceil(cellsNum / colsNum)
		}

	if (self.sides != 3){
		// NOTE: Squares rotated by 45deg have one less figure on even rows, so we need to add the "missing" cells
		cellsNum += Math.ceil(cellsNum / colsNum/2)
		size.rows = Math.ceil(cellsNum / colsNum)
	}

	switch (self.sides){
		case 6:
			size.height = (1.5*cellRadius+cellMargin) *  size.rows + (cellRadius/2)
			break;
		case 3:
			size.height = (cellDim.bounds.height+cellMargin*2) * (size.rows/2 +0.5)
			break;
		case 4:
			size.height = (cellDim.bounds.height+cellMargin) * (size.rows/2 +0.5)
			break;
	}

	size.height += (self.shapeSideMargin()*2)

	//self.el.height(size.height)
	self.canvas.height = size.height
	self.canvas.width = size.width
	if (paper.view) paper.view.viewSize = [size.width, size.height]
	self.updatePixelRatio();
	Wix.setHeight(size.height);
	return size
}
HoneycombController.prototype.shapeSideMargin = function(){
	var margin = this.props.margin

	switch (this.sides){
		case 3:
			return margin//(margin * Math.sqrt(2))
		case 4:
			// Squares have side margin not equal to one on the edge, correcting margin between shapes
			return margin * Math.sqrt(2)
		case 6:
			return margin
	}
}
HoneycombController.prototype.calculateGridLayout = function(gridColumns, gridRows){
	var self = this
		, cells = []

		, cellDim = self.gridCellDim(self.sides)

		, shapeWidth = cellDim.bounds.width
		, shapeHeight = cellDim.bounds.height
		, cellMargin = self.shapeSideMargin()

		, cellHeight = shapeHeight
		, cellWidth = shapeWidth

		, layerOffset = self.calcViewportOffset()
		, cellIndex = 0

		, scaleFactor = 1//(cellDim.radius - cellMargin/2)/cellDim.radius
		, outlineCorrection
		, outlineScaleFactor

		, cellsLimit = self.items.length

	for (var row=0; row < gridRows; row++){
		if (cellIndex >= cellsLimit) break
		var oddRow = (row % 2 == 0)

		for (var col=0; col < gridColumns; col++){
			if (cellIndex >= cellsLimit) break;
			var oddCell = (col % 2 == 0)
				, x
				, y
				, shapeCenter
				, isShapeRotated = false

			if (self.sides != 3 && !oddRow && col == gridColumns-1){
				// NOTE: skip edge squares and hexagons on every even row
				gridRows++
				continue;
			}

			// On even rows for Square and Hexagon cells should be shifted to the right
			switch (self.sides){
				case 6:
					x = (cellWidth)/2 + (cellWidth+cellMargin)*col
					if (!oddRow) x += (cellWidth+cellMargin)/2

					y = 2+cellDim.bounds.height/2 + (cellHeight+cellMargin-(cellWidth+cellMargin)/Math.sqrt(3)/2)*row

					outlineScaleFactor = (cellDim.radius+cellMargin)/cellDim.radius
					break;
				case 3:
					x = (cellWidth)/2 + (cellWidth+cellMargin)*col
					y = (cellHeight+cellMargin*2)/2 + (cellHeight/2+cellMargin)*row
//
					if ((oddCell && !oddRow) || (!oddCell && oddRow)){
//						x-=cellMargin
						isShapeRotated = true
					}

					if (!(isShapeRotated && col==0) && !(!isShapeRotated && col == self.props.numOfColumns-1)) {
						outlineScaleFactor = (cellDim.bounds.width+cellMargin*2.5)/cellDim.bounds.width
						outlineCorrection = isShapeRotated ? cellMargin*0.75 : -cellMargin*0.75
					} else {
						outlineScaleFactor = (cellDim.bounds.width+cellMargin*3)/cellDim.bounds.width
						outlineCorrection = isShapeRotated ? cellMargin*0.25 : -cellMargin*0.25
					}
					break;
				case 4:
					x = cellDim.radius + (cellWidth+cellMargin)*col
					if (!oddRow) x += (cellWidth+cellMargin)/2

					y = cellDim.radius + (cellHeight+cellMargin)/2*row

					outlineScaleFactor = (cellDim.radius+cellMargin)/cellDim.radius
					break;
			}
			shapeCenter = {x: x+layerOffset, y: y+layerOffset}

			cells.push({
				scaleFactor: scaleFactor,
				outlineScaleFactor: outlineScaleFactor,
				outlineCorrection: outlineCorrection,
				position: shapeCenter,
				rotated: isShapeRotated,
				row: row,
				col: col,
				dim: cellDim,
				isEmpty: (cellIndex >= cellsLimit)
			});
			cellIndex++
		}
	}
	self.layout = cells;
	return cells;
}

HoneycombController.prototype.scaleOutline = function(){

}
HoneycombController.prototype.scaleGrid = function(){
//	console.log('scaleGrid')
	var self = this
		, canvasSize = self.updateCanvasSize()
		, layoutCells = self.calculateGridLayout(canvasSize.cols, canvasSize.rows)
		, outlineCells

	var outlineLayer = self.outlineLayer();
	var displayLayer = self.displayLayer();
	var focusCells = _.rest(displayLayer.children)

	if (outlineLayer.firstChild.children == null){
		this.updateLayout()
	}
	outlineCells = outlineLayer.firstChild.children;

	_.each(layoutCells, function(cell, index){
		var gridCell = self.cells[index];
		var cellRootShape = gridCell.firstChild
		cellRootShape.position = cell.position;

		var imageClipGroup = cellRootShape.nextSibling
		var cellMask = imageClipGroup.firstChild
		var image = imageClipGroup.lastChild
		var cellZoom = cell.dim.bounds.width/cellRootShape.bounds.width

		cellRootShape.scale(cellZoom)

		cellMask.fitBounds(cellRootShape.bounds);
//		cellMask.scale(cell.scaleFactor)
		if (focusCells[index]){
			focusCells[index].scale(cellZoom, cell.position)
			focusCells[index].position = cell.position
		}

		outlineCells[index+1].fitBounds(cellRootShape.bounds)
		outlineCells[index+1].position = cell.position;
		outlineCells[index+1].scale(cell.outlineScaleFactor)

		if (cell.outlineCorrection){
			outlineCells[index+1].position.x += cell.outlineCorrection
		}

		image.fitBounds(cellRootShape.bounds, true)
	})

	var trailCell = outlineCells[outlineCells.length-1]
	if (self.sides == 3 && trailCell.isTrailCell){
		var tmpData = layoutCells[layoutCells.length-1]
		if (tmpData.rotated){
			var shiftCell = self.cells[self.cells.length-self.props.numOfColumns].firstChild;

			trailCell.fitBounds(shiftCell.bounds)
			trailCell.position = shiftCell.position;
			trailCell.scale(tmpData.outlineScaleFactor)

			trailCell.position.y += self.props.margin*Math.sqrt(3) / ((tmpData.col==0)?3:2)
		} else {
			var shiftCell = outlineCells[outlineCells.length-2]

			var tmpCell = shiftCell.clone(false)
			tmpCell.rotate(180)
			tmpCell.position.x = shiftCell.position.x+shiftCell.bounds.width
			tmpCell.position.y = shiftCell.position.y

			var clip = new paper.Path.Rectangle([tmpCell.bounds.topLeft.x+self.props.margin/2, 0], tmpCell.bounds.bottomRight);
			var replacement = tmpCell.subtract(clip)
			clip.remove()
			replacement.isTrailCell = true

			trailCell.parent.addChild(replacement)
			trailCell.remove();
//			trail.push(zhopa)
		}
	}
	paper.view.draw();
}

HoneycombController.prototype.drawGrid = function(layer, shape){

//	console.log('drawGrid')
	var self = this
		, cells = []
		, canvasSize = self.updateCanvasSize()

	Wix.setHeight(canvasSize.height);

	var layoutCells = self.calculateGridLayout(canvasSize.cols, canvasSize.rows);
	_.each(layoutCells, function(cell, index){
		var cellRootShape = shape.clone()
			, slot = new paper.Group([cellRootShape])

		if (cell.rotated){
			cellRootShape.rotate(-180)
			cellRootShape.invertedShape = true
		}

		cellRootShape.position = cell.position

		var cellMask = cellRootShape.clone(false).scale(cell.scaleFactor);
		var image = new paper.Raster();
		var imageClipGroup = new paper.Group([cellMask, image]);
		cellRootShape.fillColor = 'white';
		cellRootShape.fillColor.alpha = 0.4
		image.visible = false;
		image.onLoad = function(){
			cellRootShape.fillColor = 'transparent';
			cellRootShape.fillColor.alpha = 0
			this.fitBounds(cellRootShape.bounds, true)
			this.visible=true;
		}
		imageClipGroup.clipped = true
		slot.addChild(imageClipGroup)
		cells.push(slot);
	})

	layer.addChildren(cells);
	return cells;
}

function mark(x, y){
	var dot = new paper.Path.RegularPolygon(new paper.Point(x, y), 3, 5);
	dot.fillColor = 'yellow';
	dot.strokeColor= 'red'
	dot.opacity = 0.5;
	return dot;
}


HoneycombController.prototype.fillShapes = function(cells, callback){
//	return
	var self = this
		, idx = -1

//	console.log('fill')

	var loadIndex = cells.length;
	var responderFired = false
	var responder = function(){
		if (responderFired) return
		if (loadIndex==0 && _.isFunction(callback)){
			callback();
			responderFired = true;
		}
	}

	_.each(cells, function(group, groupIndex){
		if(!group) return;
		var imageClipGroup = group.children[1]
			, item
			, image = imageClipGroup.lastChild
			, cellRootShape = group.firstChild

		if (!imageClipGroup) {
			loadIndex--;
			return;
		}
		idx++;
		item = self.items[idx];

		if (!item) {
			loadIndex--
//			group.visible = false;
			return;
		}

		if (image.source!=item.canvasURI){
			image.source = item.canvasURI
		} else {
			image.fitBounds(group.bounds)
			loadIndex--;
		}

		image.onLoad = function(){
			loadIndex--;
			this.fitBounds(cellRootShape.bounds, true)
			responder();
		}
	});
	responder();

//	var displayLayer = self.displayLayer();

	$('#viewport').on('mouseout', function(){
		var holder = self.activeShape//group.lastChild;
		if(holder){
			self.activeShape = null
			holder.fillColor = self.props.backgroundMouseoverColor
			holder.fillColor.alpha = 0
			paper.view.draw()
//		console.log('OUT')
		}
	})
}

HoneycombController.prototype.updateLayout = function(){
//	console.log('updateLayout')
	var self = this
		, displayLayer = self.displayLayer()
		, viewportSize = self.getViewportSize()

	if (self.inUpdate) return

	self.inUpdate = true;
	self.canvas.width = viewportSize.width;


	if (!self.cells) {
		self.calcGrid();
	} else if (displayLayer.children.length == 1) {
		_.each(self.cells, function(cell, index){
			if (self.layout[index].isEmpty) return
			var focusCell = cell.firstChild.clone(false);
			focusCell.fillColor.alpha = 0
			displayLayer.addChild(focusCell);
		})
	}

	self.fillShapes(self.cells, function(){
		self.inUpdate = false;
	});
}

HoneycombController.prototype.destroy = function(dropDomElement){
	var self = this;
	delete self._serviceLayer;
	delete self._gridLayer;
	delete self.cells;
	delete self._outlineLayer;
	if (self._displayLayer){
		self._displayLayer.onFrame = null;
		self._displayLayer.onClick = null;
		self._displayLayer.onMouseMove = null;
		delete self._displayLayer;
	}
	if (paper && paper.project && paper.view){
		paper.project.clear();
		paper.view.draw();
	}
	if (dropDomElement!==false) self.el.html('')
}

HoneycombController.prototype.updateSettings = function(config){
//	console.log('updateSetting')
	var self = this;
	self.mainPageId = config.mainPageId;
	if (!config || !config.items || !config.props) return;

	var layoutRedrawTriggeringProperties = ['imageShape', 'numOfColumns'];

	var isPropsOrItemsChanged = self.propsChanged(config.props) || self.didItemsChange(self.items, config.items);

	var isLayoutChanged = !self.props || !self.props.imageShape || self.propsChanged(config.props, layoutRedrawTriggeringProperties) || self.didItemsChange(self.items, config.items);

	if (!isLayoutChanged && self.itemsChanged(config.items, [])){
		isLayoutChanged = true;
	}

	if (!utils.isEqualQuality(self.quality, config.quality)) {
		isLayoutChanged = true;
		self.quality = config.quality;
	}

	if (isLayoutChanged){
		self.destroy();
		self.props = config.props || {}
		self.items = config.items || []

		switch (self.props.imageShape.toLowerCase()){
			case 'hexagon':
				self.sides = 6;
				break;
			case 'triangle':
				self.sides = 3;
				break;
			case 'square':
				self.sides = 4;
				break;
			default:
				self.sides = 4;
		}

		self.createDom();
		self.calcGrid()
//		return 'suka'
		self.updateLayout();
	} else if (isPropsOrItemsChanged) {
		_.extend(self.props, config.props)
		for (var i=0; i<this.items.length; i++){
			_.extend(self.items[i], config.items[i])
		}

		self.outlineLayer().fillColor = self.props.holesColor
		self.outlineLayer().fillColor.alpha = self.props.alphaHolesColor
		self.scaleGrid()
	}
}

HoneycombController.prototype._resize = function () {
	var self = this
		, viewportSize = self.getViewportSize()

	var minWidth = self.props.numOfColumns*(20+self.props.margin);
	if (viewportSize.width < minWidth){
		return Wix.setHeight(minWidth);
	}

	if (paper.view)
		paper.view.viewSize = [self.canvas.width, self.canvas.height]


	if (self.inUpdate !== true){
		self.scaleGrid()
		self.scaleOutline()

	} else {
		// resize triggered by updateLayout, no need to recall...
		//console.log('skip-resize', viewportSize.height, self.canvas.height)
	}
}

HoneycombController.prototype.scaleDisplay = function(){
	var self = this
		, viewportSize = this.getViewportSize()
		, ratio = viewportSize.width/self.canvas.width

	paper.view.viewSize = [self.canvas.width * ratio, self.canvas.height * ratio];
	self.el.height(paper.view.viewSize.height).width(paper.view.viewSize.width);
}

HoneycombController.prototype._reset = _.debounce(function(){
	this.destroy(false);
	paper.setup(this.canvas)
	this.updateLayout();
}, 500);

HoneycombController.prototype.itemClick = function(item, index, sourceElement, e){
	switch(this.props.galleryImageOnClickAction) {
		default:
		case "zoomMode":
			Wix.pushState(JSON.stringify({cmd:'zoom', args:[index]}));
			break;
		case 'disabled':
            Wix.pushState(JSON.stringify({cmd: 'itemClicked', args: [index]}));
			break;
//		default:
		case "goToLink":
			this.openLink(item.href, item.target, item.linkType, e,item["data-anchor"],this.mainPageId, item.link);
			break;
	}
	return false;
}


HoneycombController.prototype.getViewportSize = function(){
	var html = document.documentElement;
	return {
		width: html.clientWidth,
		height: html.clientHeight
	}
}

HoneycombController.prototype.didItemsChange = function (oldItems, newItems) {

	var oldIds = _.pluck(oldItems, 'id');
	var newIds = _.pluck(newItems, 'id');

	var idChanged = !_.every(oldIds, function (id, index) {
		return newIds[index] === id;
	});

	var oldUris = _.pluck(oldItems, 'uri');
	var newUris = _.pluck(newItems, 'uri');
	var uriChanged = !_.every(oldUris, function (id, index) {
		return newUris[index] === id;
	});

	return idChanged || uriChanged;
}
