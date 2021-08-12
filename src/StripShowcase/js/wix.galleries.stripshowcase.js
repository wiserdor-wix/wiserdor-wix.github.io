/**
 * TODO:
 *
 * Fix swipe responsiveness...
 *
 */

var StripShowcaseController = function (el) {
	var self = this;

	utils.capabilities.mask();
	self.resize = _.debounce(_.bind(self._resize, self), 200);

	// NOTE: calling super (parent) constructor
	StripShowcaseController.super_.apply(self, arguments);
	self.itemClass = 'item';
	self.itemSelector = '.'+self.itemClass;
	self.items = [];
	self.props = {};
	self.dimCache = {};
	self.inactiveElementOpacity = 0.25;
	self.activeElementOpacity = 0;
}
utils.inherits(StripShowcaseController, SimpleAppProto);

StripShowcaseController.prototype.getPageWidth = function(){
	var self = this;
	return Math.min(self.isMobile ? 320 : 980, self.viewportSize.width);
}

StripShowcaseController.prototype.itemClick = function(item, index, sourceElement, e){
    switch(this.props.galleryImageOnClickAction)
    {
        case "zoomMode":
            Wix.pushState(JSON.stringify({cmd:'zoom', args:[index]}));
            this.autoplayPause()
            break;
        case "goToLink":
            this.openLink(item.href, item.target, item.linkType, e,item["data-anchor"],this.mainPageId, item.link);
            break;
		default:
            Wix.pushState(JSON.stringify({cmd: 'itemClicked', args: [index]}));
            break;
    }

    return false;
}

StripShowcaseController.prototype.init = function(config){
	this.items = config.items || [];
	this.props = config.props || {};
    this.marketingLandingPage = config.marketingLandingPage;
    if (this.marketingLandingPage) {
        this.inactiveElementOpacity = 0.5;
        $(this.el).addClass('marketingLandingPage');
    }

//	this.el.html('');
  this.props.transition = 'carousel';
	this.createDom();
	this.updateLayout();
}

StripShowcaseController.prototype._resize = function () {
    this.destroy();
    this.init({items: this.items, props: this.props});
    // return;
    // this.updateLayout();
}

StripShowcaseController.prototype.destroy = function () {
    try {
        $('#displayCycle').cycle('destroy');
    } catch (ignore) { //eslint-disable-line no-empty
    }
    this.el.html('');
}

StripShowcaseController.prototype.getSidesRatio = function(scale){
	var ratio;
	switch (scale){
		case "16:9":
			ratio = 16/9;
			break;
		case "4:3":
			ratio = 4/3;
			break;
		case "1:1":
			ratio = 1;
			break;
		case "3:4":
			ratio = 3/4;
			break;
		case "9:16":
			ratio = 9/16;
			break;
		default:
			ratio = 1;
			break;
	}
	return ratio
}

StripShowcaseController.prototype.dimCrop = function (width, height) {
    var scale = this.getSidesRatio(this.props.imageScale);

    return {
        height: this.containerHeight,
        width: Math.floor(this.containerHeight * scale)
    }
}

StripShowcaseController.prototype.dimFit = function (width, height) {
    var scale = this.containerHeight / height;
    return {
        height: this.containerHeight,
        width: Math.floor(width * scale)
    }
}

StripShowcaseController.prototype.updateLayout = function () {
	var self = this
		, displayNode = $('#display')
		, thumbnailsNode = $('#thumbnails')
		, thumbnailImageHeight = 50
		, thumbnailSidesRatio = this.getSidesRatio(this.props.thumbsScale)
		, thumbnailContainerHeight = thumbnailImageHeight
		, thumbnailContainerWidth = Math.floor(thumbnailImageHeight * thumbnailSidesRatio)
		, thumbnailsNodeWidth = self.getPageWidth() - (self.isMobile? 20 : 2)
		, displayToThumbnailsSpacing = 8
    this.props.autoplayInterval = this.props.autoplayInterval ? this.props.autoplayInterval : 01;
    if (self.props.showThumbnails) {
        thumbnailsNode
            .width(thumbnailsNodeWidth)
            .height(thumbnailContainerHeight - 2)
            .css('padding', '0 1px')
    } else {
        thumbnailContainerHeight = 0;
        displayToThumbnailsSpacing = 0;
    }

    this.el.css(_.extend({overflow: 'hidden'}, self.viewportSize));
    this.containerWidth = self.viewportSize.width;
    this.containerHeight = self.viewportSize.height - thumbnailContainerHeight - displayToThumbnailsSpacing;

    if (this.containerHeight < 0) {
        return;
    }


    displayNode
        .width(this.containerWidth)
        .height(this.containerHeight)
        .css({
            marginBottom: (displayToThumbnailsSpacing - 2) + 'px',
            overflow: 'hidden'
        });

    $('#displayCycle').width(this.containerWidth).height(this.containerHeight);

//	var colors = self.colors();
//
//	$('.cycle-overlay').css({
//		backgroundColor: colors.background,
//		fontFamily: utils.fontFamilyDegradation(self.props.font),
//		textAlign :self.props.alignText
//	});
//
//	$('.cycle-overlay .desc').css({
//		color: colors.description
//	});
//
//	$('.cycle-overlay .title').css({
//		color: colors.text
//	});

    $('.next,.prev', displayNode)
        .css('background-color', 'white')
        .find('.inner')
        .css('background-color', 'black');

    $('.thumb:not(:last)', '#thumbnails').css({
        marginRight: self.props.thumbsMargin + 'px'
    });

    var cycleNode = $('#displayCycle');

    var resizeImages = utils.pyramid.isOverThresholdChange();
    $('.item', cycleNode).each(function () {
        var dim, mode, item = self.items[$(this).attr('index')];

        if (self.props.cropAndFitStage == 'fit') {
            dim = self.dimFit(item.width, item.height)
            mode = 'contain'
        } else {
            dim = self.dimCrop(item.width, item.height)
            mode = 'cover'
        }
        $(this).css({
            width: dim.width,
            height: dim.height
        });

        var props = {
            width: dim.width,
            height: dim.height,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '50%'
        }

        $('.filler', this).css(props);
        $('.overlay', this).css(props);

        if (resizeImages) {
            $('.filler', this).css({
                backgroundImage: 'url(' + utils.getResizedImageUrl(item.uri, dim.width, dim.height, {
                    siteQuality: self.quality,
                    maxWidth: item.width,
                    maxHeight: item.height
                }) + ')',
                backgroundSize: mode
            })
        }
    });

	if (self.props.showThumbnails){
		var nodeToClean = $('#thumbnails').closest('.hoverscroll');
		$('#thumbnails').appendTo(nodeToClean.parent()).hoverscroll({width:thumbnailsNodeWidth, height:thumbnailContainerHeight+2 ,arrows:false});
		nodeToClean.remove();
		$('.overlay', thumbnailsNode).removeClass('current').eq(self.initialSlideIndex).addClass('current');
	}
}

StripShowcaseController.prototype.autoplayPause = function(){
	var cycleNode = $('#displayCycle');
	cycleNode.cycle('pause');
	this.isPlaying = false;
}

StripShowcaseController.prototype.autoplayResume = function(){
	if (this.editMode == 'editor') return;

	var cycleNode = $('#displayCycle');
	if (this.props.autoplay) cycleNode.cycle('resume');
	this.isPlaying = this.props.autoplay;
}

StripShowcaseController.prototype.getViewportSize = function(){
    var body = document.body;
    var html = document.documentElement;

    this.viewportSize = {
        width: html.clientWidth,
        height: html.clientHeight
    }
    return this.viewportSize;
}

StripShowcaseController.prototype.zoomClosed = function () {
    this.autoplayResume()
}

StripShowcaseController.prototype.next = function () {
    var cycleNode = $('#displayCycle');
    cycleNode.cycle('next');
}

StripShowcaseController.prototype.previous = function () {
    var cycleNode = $('#displayCycle');
    cycleNode.cycle('prev');
}

StripShowcaseController.prototype.changeEditMode = function(){
	var cycleNode = $('#displayCycle');

	if (this.editMode == 'editor'){
		this.autoplayPause();
	} else {
		this.autoplayResume();
	}
	cycleNode.cycle({'timeout':this.props.autoplayInterval*1000})
}

StripShowcaseController.prototype._randomTransition = function(){
	var transitions = ['fade', 'slide', 'scroll', 'zoom'];
	this._fxRandomized = this._fxRandomized || _.shuffle(transitions);
	this._fxRandomIteration = this._fxRandomIteration || 0;

	var index = this._fxRandomIteration % this._fxRandomized.length;

	this._fxRandomIteration++;

	return this._fxFromTransition(this._fxRandomized[index]);
}

StripShowcaseController.prototype._fxFromTransition = function(transition){
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

StripShowcaseController.prototype.createDom = function () {
    this.getViewportSize();
    this.slideMargin = this.props.imageMargin;

	var displayNode = $('<div></div>').appendTo(this.el).attr('id', 'display');
	var thumbnailsNode = $('<div></div>').appendTo(this.el).attr('id', 'thumbnails');

	var self = this
		, thumbnailImageHeight = 50
		, thumbnailSidesRatio = this.getSidesRatio(this.props.thumbsScale)
		, imageSidesRatio = this.getSidesRatio(this.props.imageScale)
		, thumbnailContainerHeight = thumbnailImageHeight
		, thumbnailContainerWidth = Math.floor(thumbnailImageHeight * thumbnailSidesRatio)
		, thumbnailsNodeWidth = self.getPageWidth() - (self.isMobile? 20 : 2)
		, displayToThumbnailsSpacing = 8

	if (self.props.showThumbnails) {
		thumbnailsNode
			.width(thumbnailsNodeWidth)
			.height(thumbnailContainerHeight-2)
			.css('padding', '0 1px');
	} else {
		thumbnailContainerHeight = 0;
		displayToThumbnailsSpacing = 0;
		thumbnailsNode.remove();
	}

	this.el.css(_.extend({overflow:'hidden'}, self.viewportSize));
	this.thumbnailsHovered = false;
	this.containerWidth = self.viewportSize.width;
	this.containerHeight = self.viewportSize.height - thumbnailContainerHeight - displayToThumbnailsSpacing;

	displayNode
		.width(this.containerWidth)
		.height(this.containerHeight)
		.css({
			marginBottom: (displayToThumbnailsSpacing-2)+'px',
			overflow: 'hidden'
		});

	if (self.props.arrowMode){
		var prev = $('<div><div class="inner"></div></div>').appendTo(displayNode).addClass('prev')
		var next = $('<div><div class="inner"></div></div>').appendTo(displayNode).addClass('next')
	}
	var cycleNode = $('<div></div>').attr('id', 'displayCycle').appendTo(displayNode);

	var transition = self.props.transition || 'none';
	var fxData = self._fxFromTransition(transition);

	self.initialSlideIndex = self.initialSlideIndex || 0;
	self.initialTransition = self.initialTransition || transition;
	if (!self.items[self.initialSlideIndex]) self.initialSlideIndex = 0

//	var currentSlide;
	this.props.autoplayInterval = (this.props.autoplayInterval)?(this.props.autoplayInterval):01;
  self.isPlaying = (self.props.autoplay && self.editMode != 'editor');

    var slideWidth = this.containerHeight * imageSidesRatio;
    if (self.props.cropAndFitStage == 'fit'){
		if (this.items.length > 0) {
			var initialItem = this.items[self.initialSlideIndex];
			var initialSlideDim = self.dimFit(initialItem.width, initialItem.height);
			slideWidth = initialSlideDim.width;
		}
    }
    slideWidth += this.slideMargin;
		var offset = ((this.isMobile && self.props.thumbsScale == "4:3" && this.editMode != 'editor')? self.props.imageMargin : 0)
    var slides_offset = Math.floor(this.containerWidth / 2 - slideWidth/2 + offset);
//		console.log('offset', slides_offset, this.getViewportSize().width, this.containerWidth);
//		console.log(this.isMobile)

    var CYCLE_PAGER_TEMPLATE = "<div class='thumb' style='display:inline-block; width:{{thumbWidth}}px; height:{{thumbHeight}}px; background: url({{thumb}}) 50% no-repeat'>" + (!this.marketingLandingPage ? "<div class='overlay'></div>" : '') + "</div>";
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
		'data-cycle-pager-template': CYCLE_PAGER_TEMPLATE,
		"data-cycle-prev": "#display .prev",
		"data-cycle-next": "#display .next",
    "data-allow-wrap": true,
    "data-cycle-carousel-offset": slides_offset,
		"data-cycle-easing": 'easeOutQuart'
    }).on('cycle-before', function (event, optionHash, outgoingSlideEl, incomingSlideEl, forwardFlag) {
        if (self.marketingLandingPage) {
            var incomingObj = $(incomingSlideEl);
            $('.cycle-slide').removeClass('active-slide-inner')
            $('.cycle-slide').removeClass('init-cycle-slide');
            incomingObj.addClass('active-slide-inner');
        }

        self.inTransition = true;
        self.initialSlideIndex = $(incomingSlideEl).attr('index') % self.items.length;
        var currentThumbOverlay = $('.overlay', thumbnailsNode).removeClass('current').eq(self.initialSlideIndex).addClass('current');
        var otherThumbsOverlay = $('.overlay', thumbnailsNode).not(currentThumbOverlay);
        var delay = Math.min(150, self.props.autoplayInterval * 500);

        // Fix last-to-first and first-to-last movement highlighting
        var nextIndex = $(incomingSlideEl).attr('index');
        var prevIndex = $(outgoingSlideEl).attr('index');

        var next_slide = $(outgoingSlideEl).siblings('[index=' + nextIndex + ']').not(incomingSlideEl);
        if (self.marketingLandingPage) {
            next_slide.addClass('active-slide-inner');
        }
//    if (optionHash.hardHops){
//	    if (Math.abs(optionHash.hardHops) <= self.items.length-1){
//		    console.log('no')
//		    next_slide = '.asd';
//	    } else {
//		    if (optionHash.hardHops < 0){
//			    next_slide = $(outgoingSlideEl).prevAll('[index='+nextIndex+']').not(incomingSlideEl).eq(0);
//		    } else {
//			    next_slide = $(outgoingSlideEl).nextAll('[index='+nextIndex+']').not(incomingSlideEl).eq(0);
//		    }
//	    }
//		}

		var prev_slide = $('[index='+prevIndex+']', self.el);
    $('.overlay', next_slide).fadeTo(1.5*delay + fxData.fxSpeed || fxData.speed, self.activeElementOpacity, function(){
      $(next_slide).add(prev_slide).find('.overlay').fadeTo(0, self.inactiveElementOpacity);
    });

    $('.overlay', incomingSlideEl).add(currentThumbOverlay).fadeTo(1.5*delay + fxData.fxSpeed || fxData.speed, self.activeElementOpacity);
    $('.overlay', outgoingSlideEl).add(otherThumbsOverlay).fadeTo(delay + fxData.fxSpeed || fxData.speed, self.inactiveElementOpacity);

		if (self.isPlaying || self.thumbnailsHovered === false){
			var spot = self.initialSlideIndex*thumbnailContainerWidth - Math.round((thumbnailsNodeWidth/2)  - thumbnailContainerWidth);
			$(thumbnailsNode).parent().stop().animate({scrollLeft: spot}, fxData.fxSpeed || fxData.speed, function(){});
		}

		var activeCursor = (self.props.galleryImageOnClickAction=='zoomMode' || (self.props.galleryImageOnClickAction!='disabled' &&self.items[nextIndex].href))
		$(self.itemSelector+' .filler, '+self.itemSelector+' .overlay', cycleNode).css({cursor: 'pointer'});
    $('.filler,.overlay', incomingSlideEl).css({cursor: activeCursor?'pointer':'auto'});

  }).on('cycle-post-initialize', function(el){
    $(self.itemSelector+' .filler,'+self.itemSelector+' .overlay', cycleNode).css({cursor: 'pointer'});
		var activeCursor = (self.props.galleryImageOnClickAction=='zoomMode' || (self.props.galleryImageOnClickAction!='disabled' && self.items[self.initialSlideIndex] && self.items[self.initialSlideIndex].href))
		$('.filler,.overlay', '.cycle-slide-active').css({cursor: activeCursor?'pointer':'auto'});
		var activeSlide = $('.cycle-slide-active');
		$(self.itemSelector, self.el).not(activeSlide).find('.overlay').fadeTo(0, self.inactiveElementOpacity);
	}).on('cycle-after', function(event, optionsHash){
		 self.inTransition = false;
        Wix.pushState(JSON.stringify({cmd:'itemChanged', args:[optionsHash.nextSlide]}));
	}).on('cycle-bootstrap', function(e, opts, API){
		    var tx = $.fn.cycle.transitions[opts.fx];
		    var oldPostInit = tx.postInit;
		    tx.postInit = function(){
			    var ret = oldPostInit.apply(this, arguments);
			    $('.cycle-slide-active .overlay').fadeTo(0, self.activeElementOpacity);
			    return ret;
		    }
		 //
  });

	displayNode.on('click', self.itemSelector, function(e){
		var el = $(e.currentTarget);
		var activeSlide = $('.cycle-slide-active', self.el);
		var itemIndex = el.attr('index')^0;
		var activeIndex = activeSlide.attr('index')^0;
		if (el.is('.cycle-slide-active')){
			self.itemClick(self.items[itemIndex], itemIndex, e.target, e);
			return;
		}
		if (self.inTransition || itemIndex == activeIndex) {
			return;
		}
		self.inTransition = true;
		cycleNode.cycle('goto', itemIndex, el.index() - activeSlide.index());
	});

    var THUMBNAIL_TEMPLATE = '<div data-thumb="<%=thumbnail%>" data-thumb-width="<%=thumbnailWidth%>" data-thumb-height="<%=thumbnailHeight%>"><div class="filler"></div>' + (!this.marketingLandingPage ? '<div class="overlay"></div>' : '') + '</div>';
	var tpl = _.template(THUMBNAIL_TEMPLATE);
	_.each(this.items, function(item, index){
		var originalImageRatio = item.width/item.height,
			thumbnailImageWidth = Math.floor(thumbnailImageHeight*originalImageRatio)


		_.extend(item, {
			thumbnail: utils.getResizedImageUrl(item.uri, thumbnailContainerWidth, thumbnailImageHeight, {siteQuality: self.quality, maxWidth: item.width, maxHeight: item.height}),
			thumbnailWidth: thumbnailContainerWidth,
			thumbnailHeight: thumbnailContainerHeight
		})

		var dim, mode, node;
		if (self.props.cropAndFitStage == 'fit'){
			dim = self.dimFit(item.width, item.height)
			mode = 'contain'
		} else {
			dim = self.dimCrop(item.width, item.height)
			mode = 'cover'
		}

		node = $(tpl(item)).appendTo(cycleNode).css({
			width: dim.width,
			height: dim.height,
      marginRight: (self.slideMargin /2)+"px",
      marginLeft: (self.slideMargin /2)+"px"
    }).attr('index', index).addClass(self.itemClass);

		if (fxData.fx == 'random'){
			var slideFxData = self._randomTransition();
			node.attr({
				'data-cycle-fx':slideFxData.fx,
				'data-cycle-speed':slideFxData.speed,
				'data-transition': slideFxData.transition
			});
		}

		var maxDimPart = mode+item.uri+self.props.imageScale;
		var maxDim = self.dimCache[maxDimPart] || {width: dim.width, height: dim.height};
		if (dim.height > maxDim.height && dim.width > maxDim.width){
			maxDim = dim;
		}
		self.dimCache[maxDimPart] = maxDim;//Math.max(self.dimCache[mode+item.uri]^0, dim.height)


		$('.filler', node).css({
			width: dim.width+'px',
			height: dim.height+'px',
			background: 'url('+utils.getResizedImageUrl(item.uri, maxDim.width, maxDim.height, {siteQuality: self.quality, maxWidth: item.width, maxHeight: item.height})+')',
			backgroundRepeat: 'no-repeat',
			backgroundPosition: '50%',
			backgroundSize: mode
		});
		$('.overlay', node).css({
			width: dim.width+'px',
			height: dim.height+'px'
		});
//
//		if (_.isEmpty(item.title)){
//			$('.title', node).remove();
//		}
//		if (_.isEmpty(item.description)){
//			$('.desc', node).remove();
//		}
//		if (_.isEmpty(item.title) && _.isEmpty(item.description)){
//			$('.cycle-overlay', node).remove();
//		}
//		node.attr('data-cycle-pager-template',"<a href=#>{{ src }}</a>");
//		console.log(self.containerWidth, self.containerHeight, item);
	});
//	switch(self.props.textMode)
//	{
//		case 'titleAndDescription':
//			break;
//
//		case 'titleOnly':
//			$('.desc', displayNode).remove();
//			break;
//
//		case 'descriptionOnly':
//			$('.title', displayNode).remove();
//			break;
//
//		case 'noText':
//			$('.cycle-overlay', displayNode).remove();
//			break;
//	}
	cycleNode.cycle({})

	if (self.props.showThumbnails){
		thumbnailsNode.hoverscroll({width:thumbnailsNodeWidth, height:thumbnailContainerHeight+2 ,arrows:false});
		thumbnailsNode.hover(function(){
			self.thumbnailsHovered = true;
			self.autoplayPause();
		}, function(){
			self.thumbnailsHovered = false;
			self.autoplayResume();
		})
	}

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

	if (self.isMobile) {
		$('html').addClass('mobile-view')
		displayNode.hammer().on('swipeleft swipeup', function(){
			console.log('swipe left/down', self.inTransition);
			if (!self.inTransition) cycleNode.cycle('next');
		}).on('swiperight swipedown', function(){
				console.log('swipe right/up', self.inTransition);
			if (!self.inTransition) cycleNode.cycle('prev');
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
	} else {
		$('html').removeClass('mobile-view');
	}

	/*
	$(prev).add(next).hover(function(){
		var colors = self.colors();
		$(this).css('background-color', colors.text).find('.inner').css('background-color', colors.background);
	}, function(){
		var colors = self.colors();
		$(this).css('background-color', colors.background).find('.inner').css('background-color', colors.text);
	})
	*/
}

//StripShowcaseController.prototype.colors = function(){
//	return {
//		text: utils.hexToRgba(this.props.textColor, this.props.alphaTextColor),
//		description: utils.hexToRgba(this.props.descriptionColor, this.props.alphaDescriptionColor),
//		background: utils.hexToRgba(this.props.textBackgroundColor, this.props.alphaTextBackgroundColor)
//	}
//}

StripShowcaseController.prototype.updateSettings = function(config){
	var h = document.body.clientHeight;
    this.mainPageId = config.mainPageId;

	this.quality = config.quality || {};
    this.marketingLandingPage = config.marketingLandingPage;

    if (config.props.showThumbnails === false && this.props.showThumbnails === true){
		this.props = config.props;
		this.items = config.items;
		Wix.setHeight(h - 58);
		return;
	} else if (config.props.showThumbnails === true && this.props.showThumbnails === false){
		this.props = config.props;
		this.items = config.items;
		Wix.setHeight(h + 58);
		return;
	}

	var itemPropertiesChangingLayout = ['uri']
	var recreate = false;

	this.el.attr('data-text-mode', config.props.textMode);
	this.el.attr('data-animation', config.props.transition);
    if (config.props.cropAndFitStage == 'fit'){
        config.props.imageScale = "1:1";
    }

	if (this.items.length != config.items.length){
		recreate = true;
	} else {
		for (var i=0; i<this.items.length; i++){
			if (utils.propertiesChanged(this.items[i], config.items[i], itemPropertiesChangingLayout)){
				recreate = true;
				break;
			} else {
				_.extend(this.items[i], config.items[i])
			}
		}
	}

	if (_.keys(utils.difference(this.props, config.props)).length){
		recreate = true;
	}

	this.props = config.props;

	recreate = true;

	if (recreate) {
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

/*
  App.override('animation', 'zoom');
*/
