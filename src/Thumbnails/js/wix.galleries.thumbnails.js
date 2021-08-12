var ThumbnailsController = function (element, config) {
	var self = this;

	utils.capabilities.mask();
	self.resize = _.debounce(_.bind(self._resize, self), 200);

	// NOTE: calling super (parent) constructor
	ThumbnailsController.super_.apply(self, arguments);
	self.itemClass = 'item';
	self.itemSelector = '.'+self.itemClass;
	self.isMobile = (this.deviceType == 'mobile')
	self.items = []
	self.props = {}
	self.dimCache = {}
	self.afterCreate = false;
//	self.init(config);
}
utils.inherits(ThumbnailsController, SimpleAppProto);

ThumbnailsController.prototype.itemClick = function(item, index, sourceElement, e){
	switch(this.props.galleryImageOnClickAction) {
		case "zoomMode":
			Wix.pushState(JSON.stringify({cmd:'zoom', args:[index]}));
			this.autoplayPause()
			break;
		case 'disabled':
            Wix.pushState(JSON.stringify({cmd: 'itemClicked', args: [index]}));
			break;
		default:
		case "goToLink":
			this.openLink(item.href, item.target, item.linkType, e,item["data-anchor"],this.mainPageId, item.link);
			break;
	}
	return false;
}

ThumbnailsController.prototype.init = function(config){
	this.items = config.items || []
	this.props = config.props || {}

//	this.el.html('');

	this.createDom();
	this.createLayout();
	this._resize();
}

ThumbnailsController.prototype.zoomClosed = function () {
	this.autoplayResume()
}

ThumbnailsController.prototype.next = function () {
    var cycleNode = $('#displayCycle');
    cycleNode.cycle('next');
}

ThumbnailsController.prototype.previous = function () {
    var cycleNode = $('#displayCycle');
    cycleNode.cycle('prev');
}


ThumbnailsController.prototype._resize = function () {
//	this.calculateLayoutSizes();
	this.updateLayout();
//	Wix.reportHeightChange(this.el.height());
}

ThumbnailsController.prototype.destroy = function () {
	$('#displayCycle').cycle('destroy');
	this.el.html('');
}

ThumbnailsController.prototype.getSidesRatio = function(){
	var ratio;
	switch (this.props.componentScale){
		case "16:9":
			ratio = 16/9;
			break;
		case "4:3":
			ratio = 4/3;
			break;
		case "1:1":
			ratio = 1
			break;
		default:
			ratio = 1;
			break;
	}
	return ratio
}

ThumbnailsController.prototype.dimCrop = function(width, height){
	var scale = Math.max( this.containerWidth / width, this.containerHeight/height)
	return {
		height: Math.floor(height * scale),
		width: Math.floor(width * scale)
	}
}

ThumbnailsController.prototype.dimFit = function(width, height){
	var scale = Math.min( this.containerWidth / width, this.containerHeight/height)
	return {
		height: Math.floor(height * scale),
		width: Math.floor(width * scale)
	}
}

ThumbnailsController.prototype.calculateLayout = function () {
	var self = this
		, g = self.props.thumbnailsGravity
		, viewportSize = self.getViewportSize()
		, displayToThumbnailsStripSpacing = 8
		, activeThumbnailBorder = 2 /* top/bottom border of selected item thumbnail */
		, thumbnailSidesRatio = this.getSidesRatio()
		, thumbnailsOrientationHorizontal = (g == 'top' || g == 'bottom')
		, thumbnailsStripSize = (thumbnailsOrientationHorizontal || self.isMobile) ? 50 : 80
		, thumbnailsNodeWidth
		, thumbnailsNodeHeight
		, displayNodeWidth
		, displayNodeHeight

	var defs = {
		position:'absolute',
		top:0,
		left:0,
		right:0,
		bottom:0
	}

	var displayNode = $('#display')
		, thumbnailsHolder = $('#thumbnailsHolder')
		, thumbnailsNode = $('#thumbnails')
		, cycleNode = $('#displayCycle')
		, thumbnails = $('.thumb', thumbnailsNode)

	if (thumbnailsOrientationHorizontal){
		thumbnailsNodeHeight = thumbnailsStripSize
		thumbnailsNodeWidth = self.items.length * Math.floor(thumbnailsStripSize * thumbnailSidesRatio + self.props.margin) - self.props.margin;
		displayNodeWidth = viewportSize.width
		displayNodeHeight = viewportSize.height - thumbnailsStripSize - displayToThumbnailsStripSpacing - activeThumbnailBorder
		thumbnails.css('margin', 0).not(':last').css({'margin-right':self.props.margin+'px'})

		thumbnailsNode.css('margin', '1px auto');

		thumbnailsNodeHeight += activeThumbnailBorder
	} else {
		thumbnailsNodeWidth = thumbnailsStripSize
		thumbnailsNodeHeight = self.items.length * Math.floor(thumbnailsStripSize / thumbnailSidesRatio + self.props.margin) - self.props.margin;
		displayNodeWidth = viewportSize.width - thumbnailsStripSize - displayToThumbnailsStripSpacing - activeThumbnailBorder
		displayNodeHeight = viewportSize.height
		thumbnails.css('margin', 0).not(':last').css({'margin-bottom':self.props.margin+'px'})

		if (thumbnailsNodeHeight < viewportSize.height){
			thumbnailsNode.css('margin-top', Math.floor((viewportSize.height - thumbnailsNodeHeight)/2) + 'px')
		}

		thumbnailsNodeWidth += activeThumbnailBorder
	}

	thumbnailsNode.width(thumbnailsNodeWidth).height(thumbnailsNodeHeight);
	$('.cycle-slide, .filler', cycleNode).width(displayNodeWidth).height(displayNodeHeight);

	displayNode.add(cycleNode).width(displayNodeWidth).height(displayNodeHeight);
	self.containerWidth = viewportSize.width;
	self.containerHeight = displayNodeHeight;

	switch (self.props.thumbnailsGravity){
		case 'left':
			thumbnailsHolder.css(_.defaults({right:'auto'}, defs))
			displayNode.css(_.defaults({left:'auto'}, defs))
			break;
		case 'right':
			thumbnailsHolder.css(_.defaults({left:'auto'}, defs))
			displayNode.css(_.defaults({right:'auto'}, defs))
			break;
		case 'top':
			thumbnailsHolder.css(_.defaults({bottom:'auto'}, defs))
			displayNode.css(_.defaults({top:'auto'}, defs))
			break;
		case 'bottom':
		default:
			thumbnailsHolder.css(_.defaults({top:'auto'}, defs))
			displayNode.css(_.defaults({bottom:'auto'}, defs))
			break;
	}

	var nodeToClean = thumbnailsNode.closest('.hoverscroll');
	if (nodeToClean.length){
		thumbnailsNode.appendTo(thumbnailsHolder);
		nodeToClean.remove();
	}

	thumbnailsNode.hoverscroll({
		width:thumbnailsOrientationHorizontal?'100%':thumbnailsNodeWidth,
		height:thumbnailsOrientationHorizontal?thumbnailsNodeHeight:'100%',
		arrows:false,
		vertical:!thumbnailsOrientationHorizontal
	});
}

ThumbnailsController.prototype.updateLayout = function () {
	var self = this
	self.calculateLayout();

	var viewportSize = self.getViewportSize();

	this.el.css(_.extend({overflow:'hidden'}, viewportSize));

	var displayNode = $('#display');
	var thumbnailsHolder = $('#thumbnailsHolder');
	var thumbnailsNode = $('#thumbnails');

	var colors = self.colors();

	utils.loadGoogleFontIfNeeded(self.props.font);
	$('.cycle-overlay').css({
		backgroundColor: colors.background,
		fontFamily: utils.fontFamilyDegradation(self.props.font),
		textAlign :self.props.alignText
	});

	$('.cycle-overlay .desc').css({
		color: colors.description
	});

	$('.cycle-overlay .title').css({
		color: colors.text
	});

	//var cssRule = '#display.active .next, #viewport[data-mode="editor"] .next, #display.active .prev, #viewport[data-mode="editor"] .prev {opacity: '+this.props.alphaTextBackgroundColor+')'
	//var rule = utils.insertCssRule(self, cssRule);
	//rule.style.opacity = this.props.alphaTextBackgroundColor;
	//if (!$.support.opacity){
	//	rule.style['-ms-filter']="progid:DXImageTransform.Microsoft.Alpha(Opacity="+this.props.alphaTextBackgroundColor*100+")";
	//	rule.style['filter']="alpha(opacity="+this.props.alphaTextBackgroundColor*100+")";
	//}

	 $('.next,.prev', displayNode)
		 .css('background-color', self.props.textBackgroundColor)
		 .find('.inner')
		 .css('background-color', self.props.textColor);

	var cycleNode = $('#displayCycle');

	var resizeImages = self.afterCreate || utils.pyramid.isOverThresholdChange();
	$(self.itemSelector, cycleNode).each(function(){
		var dim, mode, item = $(this).data('item');
		if (self.props.cropAndFitStage == 'fit'){
			dim = self.dimFit(item.width, item.height)
			mode = 'contain'
		} else {
			dim = self.dimCrop(item.width, item.height)
			mode = 'cover'
		}
		$('.filler', this).css({
			cursor: item.href?'pointer':'auto'
		});

		if (resizeImages){
			$('.filler', this).css({
				backgroundImage: 'url('+utils.getResizedImageUrl(item.uri, dim.width, dim.height, {siteQuality: self.quality, maxWidth: item.width, maxHeight: item.height})+')',
				backgroundSize: mode
			})
		}
	});
}

ThumbnailsController.prototype.autoplayPause = function(){
	var cycleNode = $('#displayCycle');
	cycleNode.cycle('pause');
	this.isPlaying = false;
}

ThumbnailsController.prototype.autoplayResume = function(){
	if (this.editMode == 'editor') return;

	var cycleNode = $('#displayCycle');
	if (this.props.autoplay) cycleNode.cycle('resume');
	this.isPlaying = this.props.autoplay;
}

ThumbnailsController.prototype.changeEditMode = function(){
	var cycleNode = $('#displayCycle');

	if (this.editMode == 'editor'){
		this.autoplayPause();
	} else {
		this.autoplayResume();
	}
	cycleNode.cycle({'timeout':this.props.autoplayInterval*1000})
}

ThumbnailsController.prototype._randomTransition = function(){
	var transitions = ['fade', 'slide', 'scroll', 'zoom']; /*, 'tile', 'slice'*/
	this._fxRandomized = this._fxRandomized || _.shuffle(transitions);
	this._fxRandomIteration = this._fxRandomIteration || 0;

	var index = this._fxRandomIteration % this._fxRandomized.length;

	this._fxRandomIteration++;

	return this._fxFromTransition(this._fxRandomized[index]);
}

ThumbnailsController.prototype._fxFromTransition = function(transition){
	var data = {
		fx: transition,
		transition: transition,
		speed: (this.props.transDuration || 1) * 1000
	};

	switch (transition){
		case 'none':
			data.fxSpeed = data.speed;
			data.speed = 1;
			break;
		case 'zoom':
		case 'crossFade':
			data.fx = 'fadeout';
			break;
		case 'scroll':
			data.fx = 'scrollVert';
			break;
		case 'slide':
			data.fx = 'scrollHorz';
			break;
		case 'random':
			data.fx = 'random'
			break;
		 case 'tile':
		 data.fx = 'tileBlind';
		 break;
		 case 'slice':
		 data.fx = 'tileSlice';
		 break;
	}
	return data;
}



ThumbnailsController.prototype.createDom = function () {
	var self = this
		, thumbnailSidesRatio = self.getSidesRatio()
		, g = self.props.thumbnailsGravity
		, thumbnailsOrientationHorizontal = (g == 'top' || g == 'bottom')
		, thumbnailsStripSize = (thumbnailsOrientationHorizontal || self.isMobile) ? 50 : 80
		, thumbnailContainerHeight = thumbnailsOrientationHorizontal ? thumbnailsStripSize : Math.floor(thumbnailsStripSize / thumbnailSidesRatio)
		, thumbnailContainerWidth = thumbnailsOrientationHorizontal ? Math.floor(thumbnailsStripSize * thumbnailSidesRatio) : thumbnailsStripSize

	var viewportSize = self.getViewportSize()

	self.el.css(_.extend({overflow:'hidden'}, viewportSize));

	var displayNode = $('<div></div>').appendTo(self.el).attr('id', 'display');
	var thumbnailsHolder = $('<div></div>').appendTo(self.el).attr('id', 'thumbnailsHolder')
	var thumbnailsNode = $('<div></div>').appendTo(thumbnailsHolder).attr('id', 'thumbnails');

	if (self.props.arrowMode){
		var prev = $('<div><div class="inner"></div></div>').appendTo(displayNode).addClass('prev')
		var next = $('<div><div class="inner"></div></div>').appendTo(displayNode).addClass('next')
	}
	var cycleNode = $('<div></div>').attr('id', 'displayCycle').appendTo(displayNode);

	var transition = self.props.transition || 'none';
	var fxData = self._fxFromTransition(transition);

	self.initialSlideIndex = self.initialSlideIndex || 0;
	self.initialTransition = self.initialTransition || transition;
	var display = thumbnailsOrientationHorizontal ? 'inline-block' : 'block';

	var currentSlide;
	var thumbnailBackgroundSize = (self.props.cropAndFitStage == 'fit' ? 'contain' : 'cover');
  self.isPlaying = (self.props.autoplay && self.editMode != 'editor');
	cycleNode.attr({
		"data-cycle-slides": ">div",
		"data-cycle-timeout":self.props.autoplayInterval * 1000,
		"data-cycle-auto-height":false,
		"data-cycle-paused": !self.isPlaying,
		"data-cycle-fx": fxData.fx,
		"data-cycle-log": false,
		"data-cycle-speed":fxData.speed,
		"data-cycle-pager":"#thumbnails",
		"data-starting-slide": self.initialSlideIndex,
//		'data-cycle-pager-template':"<a href=#><img src='{{thumb}}' width={{thumb-width}} height={{thumb-height}}></a>"
		'data-cycle-pager-template':"<div class='thumb' style='display:" + display + "; width:{{thumbWidth}}px; height:{{thumbHeight}}px; background: url({{thumb}}) 50% no-repeat; background-size: "+ thumbnailBackgroundSize +";'><div class='overlay'></div></div>",
		"data-cycle-prev": "#display .prev",
		"data-cycle-next": "#display .next"
	}).on('cycle-before', function(event, optionHash, outgoingSlideEl, incomingSlideEl, forwardFlag){
		self.initialSlideIndex = $(incomingSlideEl).index();
		currentSlide = $('.overlay', thumbnailsNode).removeClass('current').eq(self.initialSlideIndex).addClass('current');
		if (self.isPlaying){
			var margin = self.props.margin;
			var spot = self.initialSlideIndex*(thumbnailContainerWidth+margin) - Math.round((self.containerWidth - thumbnailContainerWidth - margin)/2);
			if (!thumbnailsOrientationHorizontal) {
				spot = self.initialSlideIndex*(thumbnailContainerHeight+margin) - Math.round((self.containerHeight - thumbnailContainerHeight - margin)/2);
			}
			var scrollProps = {};
			var direction = thumbnailsOrientationHorizontal ? 'scrollLeft' : 'scrollTop';
			scrollProps[direction] = spot;
			$(thumbnailsNode).parent().animate(scrollProps, fxData.fxSpeed || fxData.speed, function(){
			});
		}
	}).on('cycle-post-initialize', function(el){
		$('.overlay', thumbnailsNode).removeClass('current').eq(self.initialSlideIndex).addClass('current');
	})
	.on('cycle-after', function(event, optionsHash, outgoingSlideEl, incomingSlideEl){
		var itemIndex = $(incomingSlideEl).index();
        Wix.pushState(JSON.stringify({cmd:'itemChanged', args:[itemIndex]}));
	});

	displayNode.on('click', this.itemSelector, function(e){
		var itemIndex = $(e.currentTarget).index();
		self.itemClick(self.items[itemIndex], itemIndex, e.target, e);
	});

	var tpl = _.template('<div class="item" data-thumb="<%=thumbnail%>" data-thumb-width="<%=thumbnailWidth%>" data-thumb-height="<%=thumbnailHeight%>"><div class="filler"></div><div class="cycle-overlay"><h3 class="title"><%=title%></h3><div class="desc"><%=description%></div></div></div>');
	_.each(this.items, function(item){
		var node;
		_.extend(item, {
			thumbnail: utils.getResizedImageUrl(item.uri, thumbnailContainerWidth, thumbnailContainerHeight, {siteQuality: self.quality, maxWidth: item.width, maxHeight: item.height}),
			thumbnailWidth: thumbnailContainerWidth,
			thumbnailHeight: thumbnailContainerHeight
		});
        if(!item.title){
            item.title = '';
        }
        if(!item.description){
            item.description = '';
        }
		node = $(tpl(item)).appendTo(cycleNode).data('item', item);

		if (fxData.fx == 'random'){
			var slideFxData = self._randomTransition();
			node.attr({
				'data-cycle-fx':slideFxData.fx,
				'data-cycle-speed':slideFxData.speed,
				'data-transition': slideFxData.transition
			});
		}

		if (_.isEmpty(item.title)){
			$('.title', node).remove();
		}
		if (_.isEmpty(item.description)){
			$('.desc', node).remove();
		}
		if (_.isEmpty(item.title) && _.isEmpty(item.description)){
			$('.cycle-overlay', node).remove();
		}
//		node.attr('data-cycle-pager-template',"<a href=#>{{ src }}</a>");
//		console.log(self.containerWidth, self.containerHeight, item);
	});
	switch(self.props.textMode)
	{
		case 'titleAndDescription':
			break;

		case 'titleOnly':
			$('.desc', displayNode).remove();
			break;

		case 'descriptionOnly':
			$('.title', displayNode).remove();
			break;

		case 'noText':
			$('.cycle-overlay', displayNode).remove();
			break;
	}
	cycleNode.cycle({})

//	$('.overlay', thumbnailsNode).removeClass('current').eq($('.cycle-slide-active').index()).addClass('current');

//	thumbnailsNode.on('click','.overlay', function(){
//		$('.overlay', thumbnailsNode).removeClass('current');
//		$(this).addClass('current');
//	}).find('.overlay:first').trigger('click')

	displayNode.hover(function(){
		displayNode.addClass('active');
	}, function(){
		displayNode.removeClass('active');

	});
	thumbnailsNode.hover(function(){
		self.autoplayPause();
	}, function(){
		self.autoplayResume();
	})
	/*
	$(prev).add(next).hover(function(){
		var colors = self.colors();
		$(this).css('background-color', colors.text).find('.inner').css('background-color', colors.background);
	}, function(){
		var colors = self.colors();
		$(this).css('background-color', colors.background).find('.inner').css('background-color', colors.text);
	})
	*/


	if (self.isMobile) {
		displayNode.hammer().on('swipeleft swipeup', function(){
			cycleNode.cycle('next');
		}).on('swiperight swipedown', function(){
			cycleNode.cycle('prev');
		});
		var dragStartPos = 0;
		thumbnailsNode.hammer().on('dragstart', function(e){
			dragStartPos = $('.listcontainer').get(0).scrollLeft;
		}).on('drag', function(e){
			var g = e.gesture;
			var el =  $('.listcontainer').get(0);
			el.scrollLeft = dragStartPos - g.deltaX;
				return false;
		});

        displayNode.css({touchAction: 'auto'});
	}
	this.afterCreate = true;
}

ThumbnailsController.prototype.colors = function(){
	return {
		text: utils.hexToRgba(this.props.textColor, this.props.alphaTextColor),
		description: utils.hexToRgba(this.props.descriptionColor, this.props.alphaDescriptionColor),
		background: utils.hexToRgba(this.props.textBackgroundColor, this.props.alphaTextBackgroundColor)
	}
}

ThumbnailsController.prototype.createLayout = function () {
	var self = this;
}

ThumbnailsController.prototype.updateSettings = function(config){
	var itemPropertiesChangingLayout = ['uri', 'title', 'description']
	var recreate = false;
    this.mainPageId = config.mainPageId;
	this.quality = config.quality || {}
	this.el.attr('data-text-mode', config.props.textMode);
	this.el.attr('data-animation', config.props.transition);

//
//	if (this.items.length != config.items.length){
//		recreate = true;
//	} else {
//		for (var i=0;i<this.items.length;i++){
//			if (utils.propertiesChanged(this.items[i], config.items[i], itemPropertiesChangingLayout)){
//				recreate = true;
//				break;
//			} else {
//				_.extend(this.items[i], config.items[i])
//			}
//		}
//	}
//
//	if (_.keys(utils.difference(this.props, config.props)).length){
//		recreate = true;
//	}

	this.props = config.props;

	recreate = true;

	if (!this.props.thumbnailsGravity){
		this.props.thumbnailsGravity = 'bottom';
	}

	if (recreate){
		this.destroy();
		this.init(config);
	} else {
		this.resize();
	}

	if (self.initialTransition && self.initialTransition != config.props.transition){
		self.initialTransition = config.props.transition;
		var cycleNode = $('#displayCycle');
		setTimeout(function(){
			cycleNode.cycle('next');
		}, 1000);
	}
}

ThumbnailsController.prototype.getViewportSize = function(){
	return {
		width: $(document.body).width(),
		height: $(document.body).height()
	}
}

/*
  App.override('animation', 'zoom');
*/
