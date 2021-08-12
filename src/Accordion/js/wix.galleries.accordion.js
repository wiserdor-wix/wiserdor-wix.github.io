/*globals $,utils,_,Wix,SimpleAppProto*/
/*eslint strict:0*/
/*eslint comma-style:0*/
var AccordionController = function (element, config) {
    var self = this;
    self.itemClass = 'item';
    self.itemSelector = '.' + self.itemClass;

    self.items = [];
    self.props = {};
    self.dimCache = {};

    self.resize = _.debounce(_.bind(self._resize, self), 200);
    self.activateSlide = _.debounce(function (el) { self._activateSlide(el); }, 50);
    self.deactivateSlide = _.debounce(_.bind(self._deactivateSlide, self), 300);

    self.activeSlideMouseOverlapDistance = 10;
    self.minimumSliceWidth = 30;
    self.problematicMinimumSliceWidth = 0;

    // NOTE: calling super (parent) constructor
    AccordionController.super_.apply(self, arguments);
};
utils.inherits(AccordionController, SimpleAppProto);

AccordionController.prototype.createDom = function(){
	var self = this,
        displayNode = $('<div></div>').appendTo(self.el).addClass('elems'),
        itemNode,
        itemFiller,
        itemInfo;

    if (self.isMobile) {
        self.el.addClass('mobile');
    }

	self.displayNode = displayNode;
    _.forEach(self.items, function (item) {
        itemNode = $('<div></div>').appendTo(displayNode);
        $('<div></div>').appendTo(itemNode).addClass('overlay');
        itemFiller = $('<div></div>').appendTo(itemNode).addClass('filler');
        itemNode.data('item', item).addClass(self.itemClass);

        var tm = self.props.textMode;
        if (tm !== 'noText') {
            itemInfo = $('<div></div>').appendTo(itemFiller).addClass('details');

            if (tm === 'titleOnly' || tm === 'titleAndDescription') {
                $('<h3></h3>').appendTo(itemInfo).addClass('title').html(item.title);
            }
            if (tm === 'descriptionOnly' || tm === 'titleAndDescription') {
                $('<div></div>').appendTo(itemInfo).addClass('desc').html(item.description);
            }
        }
    });

	var dragStartPos = 0;
	if (self.isMobile){
        displayNode.hammer().on('drag', self.itemSelector, function (e) {
            $(self.itemSelector, self.el).removeClass('active');

            displayNode.hammer().on('dragstart', function (e) {
                dragStartPos = $(self.el).get(0).scrollLeft;
            }).on('drag', function (e) {
                var g = e.gesture;
                var el = self.el.get(0);
                el.scrollLeft = dragStartPos - g.deltaX;
                return false;
            });
        });
		displayNode.hammer().on('tap', self.itemSelector, function(e){
			var el = $(this);
			self.itemClick(el.data('item'), el.index(), e);
		});
	} else {
		displayNode.on('mousemove mouseover mouseenter', self.itemSelector, function(e){
			self.mouseX = e.pageX;
			self.activateSlide(this);
		});

		displayNode.on('mouseleave', self.el, self.deactivateSlide);

		displayNode.on('click', self.itemSelector, function(e){
			var el = $(this);
			self.itemClick(el.data('item'), el.index(), e);
		});
	}
};

AccordionController.prototype.itemClick = function (item, index, e) {
    switch (this.props.galleryImageOnClickAction) {
        case 'zoomMode':
            Wix.pushState(JSON.stringify({cmd: 'zoom', args: [index]}));
            break;
        case 'disabled':
            Wix.pushState(JSON.stringify({cmd: 'itemClicked', args: [index]}));
            break;
            case 'goToLink':
            this.openLink(item.href, item.target, item.linkType, e, item['data-anchor'], this.mainPageId, item.link);
            break;
        default:
            this.deactivateSlide();
            Wix.pushState(JSON.stringify({cmd: 'itemClicked', args: [index]}));
            break;
    }
};

AccordionController.prototype.updateLayout = function (animate) {
	var self = this,
        viewportSize = self.getViewportSize(),
        itemsCount = self.items.length,
        sliceWidth = Math.floor(viewportSize.width / itemsCount),
        trail = viewportSize.width - (sliceWidth) * itemsCount + 1,
        animate = (animate === true),
        left = 0;

	$(self.el)
		.width(viewportSize.width)
		.height(viewportSize.height);

    if (self.isMobile) {
        $('.details').addClass('hide');
        sliceWidth = Math.floor((viewportSize.width) / Math.min(itemsCount, 4.5));
        trail = 0;
        $(self.displayNode).css({'overflow': 'hidden', 'position': 'relative'}).width(sliceWidth * itemsCount);
        $(self.displayNode).css({touchAction: 'auto'});
    }

	self.sliceWidth = sliceWidth;
	self.trail = trail;
	var smallestImageWidth = 0;
	var items = $(self.itemSelector, self.el);
	items.each(function () {
		var el = $(this)
			, item = el.data('item')
            , ratio = Math.min(viewportSize.height / item.height, 2)
			, itemImageWidth = Math.floor(item.width * ratio)
			, imageUri
			, maxDim = self.dimCache[item.uri] || {width: 0, height: 0};

		if (viewportSize.height > maxDim.height && itemImageWidth > maxDim.width){
			maxDim = {width: itemImageWidth, height: viewportSize.height};
		}
		if (smallestImageWidth === 0 || smallestImageWidth > maxDim.width) {
			smallestImageWidth = maxDim.width;
		}
		self.dimCache[item.uri] = maxDim;//Math.max(self.dimCache[mode+item.uri]^0, dim.height)
		imageUri = utils.getResizedImageUrl(item.uri, maxDim.width, maxDim.height, {siteQuality: self.quality, maxWidth: item.width, maxHeight: item.height});
        if (trail) {
            sliceWidth = self.sliceWidth + 1;
            trail--;
        }
        $('.filler', el).css({backgroundImage: 'url(' + imageUri + ')', backgroundSize: 'cover'}).height(viewportSize.height);
        if (animate) {
			var animProps = {left: left, width: sliceWidth};
            if (self.isMobile) {
                delete animProps.left;
            }
			el.stop().animate(animProps, self.props.transitionDuration, self.props.easing);
		} else {
			el.width(sliceWidth).offset({left: left});
			$('.filler', el).width(sliceWidth);
		}
        left += sliceWidth;
	}).height(viewportSize.height);

	var minSliceWidth = (viewportSize.width - smallestImageWidth) / (items.length - 1);
	if (minSliceWidth !== this.problematicMinimumSliceWidth) {
		this.problematicMinimumSliceWidth = minSliceWidth;
	}

    if (animate) {
        $('.filler', self.itemSelector).stop().animate({width: self.sliceWidth + 1}, self.props.transitionDuration, self.props.easing, function () {
            var el = $(this);
            if (self.trail && el.index() < self.trail) {
                $(this).width(self.sliceWidth + 1);
            }
        });
    }

	$(self.el).css('text-align', self.props.alignText);

    if (self.props.alignText === 'left') {
        $('.details', self.el).css({
            'margin-left': 0,
            'margin-right': '10%'
        });
    } else if (self.props.alignText === 'right') {
        $('.details', self.el).css({
            'margin-left': '10%',
            'margin-right': 0
        });
    } else {
        $('.details', self.el).css({
            'margin-left': '10%',
            'margin-right': '10%'
        });
    }

    var detailsColor, borderColor, borderProp;

    if ($.support.opacity) {
        borderColor = utils.hexToRgba(self.props.borderColor, self.props.alphaBorderColor);
        detailsColor = utils.hexToRgba(self.props.textBackgroundColor, self.props.alphaTextBackgroundColor);
    } else {
        borderColor = self.props.borderColor;
        detailsColor = self.props.textBackgroundColor;
    }
    borderProp = self.props.borderWidth + 'px solid ' + borderColor;

	$(self.itemSelector, self.el).find('.details').css({
		backgroundColor: detailsColor
	}).stop().fadeTo(0, 0);
	utils.loadGoogleFontIfNeeded(self.props.font);
	$(self.itemSelector, self.el).find('.title').css({
		fontFamily: utils.fontFamilyDegradation(self.props.font),
		color: self.props.textColor
	}).fadeTo(0, self.props.alphaTextColor);
	$(self.itemSelector, self.el).find('.desc').css({
		fontFamily: utils.fontFamilyDegradation(self.props.font),
		color: self.props.descriptionColor
	}).fadeTo(0, self.props.alphaDescriptionColor);

	if (!animate){
		$(self.itemSelector, self.el).css({borderRight: borderProp});
		$(self.itemSelector, self.el).css({width: self.sliceWidth + (self.isMobile ? 0 : 1)});
		$(self.itemSelector, self.el).last().css({borderRight: 0});
	}
};

AccordionController.prototype.destroy = function(){
	$(this.el).html('');
};

AccordionController.prototype.updateSettings = function(config){
    var recreate = false;
    this.mainPageId = config.mainPageId;

	if ((this.itemsChanged(config.items, ['uri', 'title', 'description'])) || (this.propsChanged(config.props, ['textMode']))) {
		recreate = true;
	}

    if (recreate) {
        this.destroy();
        this.items = config.items || [];
        this.props = config.props || {};
        this.createDom();
    } else {
        _.assign(this.props, config.props);
    }
	this.quality = config.quality || {};

    this.props.borderWidth ^= 0;
    if (!this.props.transitionDuration) {
        this.props.transitionDuration = 600;
    }
    if (!this.props.easing) {
        this.props.easing = 'easeOutQuad';
    }

	this.updateLayout();
};

AccordionController.prototype._resize = function () {
    var activeSlide = $(this.itemSelector + '.active', this.el)
		, viewportSize = this.getViewportSize();

    if (activeSlide.length) {
        $(this.el)
            .width(viewportSize.width)
            .height(viewportSize.height);

        $(this.itemSelector + ' .filler, ' + this.itemSelector, this.el).height(viewportSize.height);

        activeSlide.removeClass('active');
        this.activateSlide(activeSlide.get(0));
    } else {
        this.updateLayout();
    }
};

AccordionController.prototype._activateSlide = function(slide){
	var self = this
		, slideEl = $(slide)
		, item = slideEl.data('item')
		, viewportSize = self.getViewportSize()
		, viewportWidth = viewportSize.width + self.props.borderWidth
		, slideIndex = slideEl.index()
        , isEdgeSlide = (slideIndex === 0 || slideIndex === self.items.length - 1)
        , ratio = viewportSize.height / item.height
        , itemImageWidth = Math.floor(item.width * ratio)
		, bigSlice = itemImageWidth
        , smallSlice = Math.floor((viewportWidth - bigSlice) / (self.items.length - 1))
		, trail
		, left;

    if (slideEl.is('.active')) {
        return;
    }

    if (!isEdgeSlide) {
        $('.overlay', slideEl).css({backgroundColor: '#000000'});
        if (self.mouseX < (smallSlice * slideIndex)) {
            smallSlice = Math.floor((self.mouseX - self.activeSlideMouseOverlapDistance) / slideIndex);
            bigSlice = viewportWidth - (smallSlice * (self.items.length - 1));
        } else if (self.mouseX > (smallSlice * slideIndex + itemImageWidth)) {
            smallSlice = Math.floor((viewportWidth - self.mouseX - self.activeSlideMouseOverlapDistance) / (self.items.length - slideIndex - 1));
            bigSlice = viewportWidth - (smallSlice * (self.items.length - 1));
        } else if (self.mouseX > (smallSlice * slideIndex) && self.mouseX < (smallSlice * slideIndex + itemImageWidth)) {
            // On the spot
        }
    }

    if (smallSlice < self.minimumSliceWidth) {
        smallSlice = self.minimumSliceWidth;
        bigSlice = viewportWidth - (smallSlice * (self.items.length - 1));
    }

    trail = viewportWidth - bigSlice - (smallSlice * (self.items.length - 1));
    left = 0;

    if (bigSlice > itemImageWidth) {
        smallSlice = this.problematicMinimumSliceWidth;
        bigSlice = viewportWidth - (smallSlice * (self.items.length - 1));
    }

	$('.details:visible', self.itemSelector).stop().fadeTo(0, 0);
    $(self.itemSelector, self.el).each(function () {
		var el = $(this)
			, current = this === slide
            , currentSlideWidth = current ? bigSlice : smallSlice
            , currentFillerWidth = current ? Math.min(itemImageWidth, bigSlice) : smallSlice;
        if (trail && !current) {
            currentSlideWidth++;
            currentFillerWidth++;
            trail--;
        }
		$('.filler', el).stop().animate({width:currentFillerWidth}, self.props.transitionDuration, self.props.easing);

        el.stop().animate({left: left, width: currentSlideWidth}, self.props.transitionDuration, self.props.easing, current ? function () {
            $('.details', this).fadeTo(700, 1);
        } : undefined);

		left += currentSlideWidth;
	}).removeClass('active');

	slideEl.addClass('active');
};

AccordionController.prototype._deactivateSlide = function () {
    $(this.itemSelector, this.el).removeClass('active');
    return this.updateLayout(true);
};

AccordionController.prototype.getViewportSize = function () {
    var html = document.documentElement;

    return {
        width: html.clientWidth,
        height: html.clientHeight
    };
};
