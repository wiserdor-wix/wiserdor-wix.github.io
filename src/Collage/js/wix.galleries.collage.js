/*globals $,utils,_,Wix,Packery,SimpleAppProto*/
var CollageController = function (element, config) {
	var self = this;
	self.itemClass = 'item';
    self.itemSelector = '.' + self.itemClass;

	self.items = [];
    self.props = {};
    utils.capabilities.mask();

	this.resize = _.debounce(_.bind(this._resize, this), 200);

	// NOTE: calling super (parent) constructor
	CollageController.super_.apply(this, arguments)

    $(this.el).on('click', '.'+this.itemClass, function(e){
        var itemIndex = $(e.currentTarget).index();
        self.itemClick(self.items[itemIndex], itemIndex, e);
    });

    self.viewportOriginalHeight = self.getViewportSize().height
}
utils.inherits(CollageController, SimpleAppProto);

CollageController.prototype.changeEditMode = function(){
//    CollageController.super_.prototype.changeEditMode.apply(this, arguments);
    var self = this
    if (self.editMode !== 'editor'){
        $('.details').fadeOut().addClass('hide');
//        console.log('preview mode')
    }
    else {
//        console.log('editor mode')
    }
}

CollageController.prototype.itemClick = function(item, index, e){
    var self = this;
    switch (self.props.galleryImageOnClickAction){
        case "goToLink":
            self.openLink(item.href, item.target, item.linkType, e,item["data-anchor"],self.mainPageId, item.link);
            break;
        case "zoomMode":
            Wix.pushState(JSON.stringify({cmd:'zoom', args:[index]}));
            break;
        case 'disabled':
        default:
            Wix.pushState(JSON.stringify({cmd: 'itemClicked', args: [index]}));
            break;
    }
}

CollageController.prototype.createDom = function(){
	var self = this
		, viewportSize = self.getViewportSize()
		, cellsOnGridAxis = self.props.numOfCells

	self.el.html('');
	self.displayNode = $('<div id="packery"></div>').appendTo(this.el);

    var scroller = {
        timer: 0,
        direction:'+',
        start: function (e) {
            if (e && e.target){
                if ($(this).is('.prev') || $(this).is('.alternativePrev')){
                    scroller.direction = '-'
                } else {
                    scroller.direction = '+'
                }
            }
            scroller.stop();
            self.el.stop().animate({scrollLeft: scroller.direction+'=' + Math.floor(self.el.width() * 0.2) + 'px'}, 1000, 'linear')
            scroller.timer = setTimeout(scroller.start, 900)
        },
        stop: function () {
            self.el.stop()
            clearTimeout(scroller.timer)
        }
    }

    var prev = $('<div><div class="inner"></div></div>').appendTo(self.el).addClass('prev')
        .hover(scroller.start, scroller.stop).hide().click(function(){
            scroller.stop();
            self.el.animate({scrollLeft: '-='+Math.floor(self.el.width() *0.5)+'px'}, 500, 'easeOutSine', function(){
                scroller.start()
            });
        }).hide();
    var intervalId = 0
    var next = $('<div><div class="inner"></div></div>').appendTo(self.el).addClass('next')
        .hover(scroller.start, scroller.stop).hide().click(function(){
            scroller.stop();
            self.el.animate({scrollLeft: '+='+Math.floor(self.el.width() *0.5)+'px'}, 500, 'easeOutSine', function(){
                scroller.start()
            });
        }).hide();

    var alternativePrev = $('<div class="alternativePrev"></div>').appendTo(self.el).hover(scroller.start, scroller.stop)
    var alternativeNext = $('<div class="alternativeNext"></div>').appendTo(self.el).hover(scroller.start, scroller.stop)


	_.each(this.items, function(item, index){
        itemNode = $('<div></div>').appendTo(self.displayNode);
		itemNode.data('item', item).addClass(self.itemClass);

		$('<div></div>').appendTo(itemNode).addClass('filler');

//		var itemInfo = $('<div></div>').appendTo(itemNode).addClass('details').fadeOut().addClass('hide');
		var itemInfo = $('<div></div>').appendTo(itemNode).addClass('details');
        $('<div></div>').appendTo(itemNode).addClass('overlay');
		$('<h3></h3>').appendTo(itemInfo).addClass('title').html(item.title)

		$('<div></div>').appendTo(itemInfo).addClass('desc').html(item.description);

	});

    var packeryProps = {
        itemSelector: self.itemSelector,
        containerStyle: {position: 'relative', height: viewportSize.height + 'px'}
    };
    if (self.props.orientation == 'horizontal') {
        self.cellDimension = Math.floor(viewportSize.height / cellsOnGridAxis);
        packeryProps.layoutMode = 'horizontal';
    } else {
        self.cellDimension = Math.floor(viewportSize.width / cellsOnGridAxis);
        packeryProps.layoutMode = 'vertical';
    }

    if (self.isMobile) {
        var dragStartPos = 0;
        $('.details').addClass('hide');

        self.displayNode.hammer({
            stop_browser_behavior: {
                userSelect: 'none',
                touchAction: 'auto',
                touchCallout: 'none',
                contentZooming: 'none',
                userDrag: 'none',
                tapHighlightColor: 'rgba(0,0,0,0)'
            }
        })

            .on('dragstart', function(e){
                if (self.props.orientation == 'horizontal'){
                    dragStartPos = self.el[0].scrollLeft;
                    e.gesture.preventDefault();
                    e.preventDefault();
                    return false;
                }
            })
            .on('drag', function(e){
                var g = e.gesture
                var speedFactor = 1.7;
                if (self.props.orientation == 'horizontal'){
                    self.el[0].scrollLeft = dragStartPos - Math.floor(g.deltaX * speedFactor)
                    e.gesture.preventDefault();
                    return false;
                }
            });
    }

	self.pckry = new Packery( self.displayNode[0], packeryProps);
}

CollageController.prototype.updateLayout = function(){
    var self           = this
        , viewportSize = self.getViewportSize();
    var sizes = self.distributeCellSizes();
    var displayNode = $('#packery');
    var disableImageAction = (self.props.galleryImageOnClickAction === 'disabled');
    var goToLinkAction = (self.props.galleryImageOnClickAction === 'goToLink');
    var expandModeAction = (self.props.galleryImageOnClickAction === 'zoomMode');

    if (self.props.orientation == 'horizontal' && self.prevOrientation != self.props.orientation) {
        viewportSize.height = self.viewportOriginalHeight
        self.el.height(viewportSize.height);
        Wix.setHeight(viewportSize.height);
    }

    if (self.editMode == 'site') {
        $('.details').fadeOut().addClass('hide');
    }

    $('.next,.prev')
        .css('background-color', 'white')
        .find('.inner')
        .css('background-color', 'black');

    $(self.itemSelector, self.el).each(function(index){
		var el = $(this)
			, item = el.data('item')
			, cellSize = sizes[index]
            , sizeInCells = self.getSizeInCells(item, cellSize)         // translates distributed cellsizes into terms of cells, i.e. 3 => 3x2 or 3x3 or 2x3 cells
            , itemImageHeight = (self.props.orientation == 'horizontal') ? self.cellDimension * sizeInCells.height : Math.floor(self.cellDimension * 3/4) * sizeInCells.height
            , itemImageWidth = (self.props.orientation == 'horizontal') ? Math.floor(self.cellDimension * 4/3) * sizeInCells.width : self.cellDimension * sizeInCells.width
      , imageUri = utils.getResizedImageUrl(item.uri, itemImageWidth, itemImageHeight, {maxWidth: item.width, maxHeight: item.height, siteQuality: self.quality})
            , ratio = item.width/item.height
            , detailsPosition = Math.floor((itemImageHeight - $('.title', el).height() - $('.desc', el).height())/2);

        var textSizes = self.getTextSizeInCell(itemImageWidth);


        if (textSizes.titleSize) {
            $('.title', el).html(item.title).css('font-size', textSizes.titleSize + 'px');
        } else {
            $('.title', el).html('');
        }

        if (textSizes.descSize) {
            $('.desc', el).html(item.description).css('font-size', textSizes.descSize + 'px');
        } else {
            $('.desc', el).html('');
        }

        switch (self.props.textMode) {
            case "titleAndDescription":
                detailsPosition = ( (itemImageWidth < 170) || !item.description ) ? Math.floor((itemImageHeight - 35) / 2) : Math.floor((itemImageHeight - 60) / 2);

                break;
            case "titleOnly":
                detailsPosition = Math.floor((itemImageHeight - 35) / 2);
                break;

            case "noText":
                break;
        }

        if (textSizes.titleSize && !textSizes.descSize) { //no place for description
            detailsPosition = Math.floor((itemImageHeight - 35)/2);
        }

		    el.height(itemImageHeight).width(itemImageWidth);
        var halfMargin = Math.floor(self.props.margin/2) + 'px'
//            , overlayMargin = Math.floor(self.props.margin/2)+15+'px'
            , detailsMargin = Math.floor(self.props.margin/2)+26 + 'px'
//	      var enableHoverOverlay = (disableImageAction || (goToLinkAction && _.isEmpty(item.href)))


	    var cursorPointer = (expandModeAction || (goToLinkAction && !_.isEmpty(item.href)))
	    var enableHoverOverlay = true;


        $('.filler', el).css({
            backgroundImage: 'url('+ imageUri +')',
            backgroundSize: 'cover',
            top: halfMargin,
            left: halfMargin,
            right: halfMargin,
            bottom: halfMargin
        });

        $('.details', el).css({
            left: detailsMargin,
            right: detailsMargin,
            top: detailsPosition
        });

        $('.overlay', el).css({
            top: halfMargin,
            left: halfMargin,
            right: halfMargin,
            bottom: halfMargin,
            display:'block'
//            cursor:cursorPointer ? 'normal' : 'normal'
        })

       var detailsTimer;
       el.hover(function(){
           clearTimeout(detailsTimer)
            switch (self.props.textMode){
                case "titleAndDescription":
                    if((itemImageWidth < 170)){
                        $('.title,.details', el).removeClass('hide').fadeIn(1000);
                        $('.desc', el).addClass('hide')
                    }
                    else {
                        $('.title,.desc,.details', el).removeClass('hide').fadeIn(1000);
                    }
                    break;
                case "titleOnly":
                    $('.title,.details', el).removeClass('hide').fadeIn(1000);
                    $('.desc', el).addClass('hide');
                    break;
                case "noText":
                    $('.title,.desc,.details', el).addClass('hide');
                    break;
            }
        }, function(){
//            $('.details', el).addClass('hide');
            $('.details', el).stop().fadeOut(1000);
           detailsTimer = setTimeout(function(){$('.details', el).addClass('hide')}, 1000)
       })


//        $('.next,.prev', self.el)
//             .find('.inner')
//             .css('background-color', self.props.textColor);
	});

    if($('#viewport').attr('data-mode') == 'editor'){
        switch (self.props.textMode){
            case "titleAndDescription":
                $('.title,.desc,.details').removeClass('hide');
                break;
            case "titleOnly":
                $('.title,.details').removeClass('hide');
                $('.desc').addClass('hide');
                break;
            case "noText":
                $('.title,.desc,.details').addClass('hide');
                break;
        }
    }

    $('.' + this.itemClass, this.el).each(function () {
        var item = $(this).data('item');
        if (!item) return;
        var overlay = $('.overlay', this);
        overlay.show();

//        if (disableImageAction || (goToLinkAction && _.isEmpty(item.href))){
        if (disableImageAction || (goToLinkAction && _.isEmpty(item.href))){
//            overlay.hide();
            $(this).css('cursor', '');
        } else {
//            overlay.show();
            $(this).css('cursor', 'pointer');
        }
    });

    if (this.props.backgroundMouseoverColor){
        var ruleSelector = '#viewport '+self.itemSelector+':hover .overlay';
        var overlayColor = this.props.backgroundMouseoverColor;

        if (typeof this.props.alphaBackgroundMouseoverColor !== 'undefined' && $.support.opacity) {
            overlayColor = utils.hexToRgba(this.props.backgroundMouseoverColor, this.props.alphaBackgroundMouseoverColor);
        }
        var rule = utils.insertCssRule(self, ruleSelector+' { background-color: '+overlayColor+'!important; }')
        rule.style.backgroundColor = overlayColor;
        if (!$.support.opacity){
            rule.style['-ms-filter']="progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
            rule.style.filter="alpha(opacity=50)";
            rule.style.opacity = 0.5;
        }
    }

    self.pckry.layout();
    if ((self.props.showNavButtons === true) &&
        (self.props.orientation == 'horizontal') && (displayNode.width() > self.el.width()) && (!self.isMobile)) {
        self.el.find('.prev, .next').show();
        self.el.find('.alternativePrev, .alternativeNext').hide();
    } else if ((self.props.showNavButtons === false) &&
        (self.props.orientation == 'horizontal') && (displayNode.width() > self.el.width()) && (!self.isMobile)) {
        self.el.find('.prev,.next').hide();
        self.el.find('.alternativePrev, .alternativeNext').show();
    } else {
        self.el.find('.prev,.next,.alternativePrev,.alternativeNext').hide();
    }
    if (self.props.orientation == 'vertical') {
        Wix.setHeight(self.displayNode.height());
    }
}

CollageController.prototype.distributeCellSizes = function(){
	var self = this
		, result = []
		, size = self.items.length;

	Math.seedrandom('layout-seed-'+self.props.layoutSeed);

	for (var i = 0; i < size; i++) {
		var min = self.props.minImageSize;
		var max = self.props.maxImageSize;
        var mid = Math.floor((max + min)/2);
        var distThreshold = Math.random();
        if(distThreshold < 0.8){
            var value = Math.floor(Math.random() * (mid - min + 1)) + min;
        }
        else {
            var value = Math.ceil(Math.random() * (max - mid)) + mid;
        }
        result.push(value)
	}

	return result;
}

CollageController.prototype.updateSettings = function(config){

    var self = this
        , recreate = false;
    self.mainPageId = config.mainPageId;
    self.quality = config.quality || {}

    if (self.itemsChanged(config.items, ['uri'])){
        recreate = true;
    }
    else if (self.propsChanged(config.props, ['minImageSize','maxImageSize','avergeImageSize','numOfCells', 'orientation','layoutSeed'])){
        recreate = true;
    }
    if(self.propsChanged(config.props, ['textMode'])){
//        $(self.itemSelector, self.el).find('.details, .title, .desc').removeClass('hide');
        $(self.itemSelector, self.el).find('.details').removeClass('hide');
    }

    self.prevOrientation = self.props.orientation

    if (recreate){
        self.destroy();
        self.items = config.items || []
        self.props = config.props || {}
        self.createDom();
    } else {
        _.extend(self.props, config.props);
    }

//    console.log(JSON.stringify(config.props,2,2));

    $(self.el).css('text-align', self.props.alignText);

    if (self.isMobile) self.props.textMode = 'noText';

    utils.loadGoogleFontIfNeeded(this.props.font);

    $(self.itemSelector, self.el).find('.title').css({
        fontFamily: utils.fontFamilyDegradation(self.props.font),
        color: utils.hexToRgba(self.props.textColor, self.props.alphaTextColor)
    });

    $(self.itemSelector, self.el).find('.desc').css({
        fontFamily: utils.fontFamilyDegradation(self.props.font),
        color: utils.hexToRgba(self.props.descriptionColor, self.props.alphaDescriptionColor)
    });
	  self.updateLayout();
};

CollageController.prototype.destroy = function(){
	this.el.html('');
};

CollageController.prototype._resize = function(){
    var self = this
        , viewportSize = self.getViewportSize()
        , cellsOnGridAxis = self.props.numOfCells;

    if (self.props.orientation == 'horizontal'){
        self.viewportOriginalHeight = viewportSize.height;
        self.el.height(self.viewportOriginalHeight);
    } else {
        self.el.height('auto');
    }

    var packeryProps = {
        itemSelector: self.itemSelector,
        containerStyle: {
            position: 'relative', height: viewportSize.height + 'px'
            , width: viewportSize.width + 'px'
        }
    };
    if (self.props.orientation == 'horizontal'){
        self.cellDimension = Math.floor( viewportSize.height / cellsOnGridAxis);
        packeryProps.layoutMode = 'horizontal';
    } else {
        self.cellDimension = Math.floor( viewportSize.width / cellsOnGridAxis);
        packeryProps.layoutMode = 'vertical';
    }
    Wix.setHeight(self.el.height());
    self.pckry && self.pckry.destroy();
    self.pckry = new Packery( self.displayNode[0], packeryProps);
    self.updateLayout();
}

CollageController.prototype.getViewportSize = function(){
	var html = document.documentElement;

	return {
		width: html.clientWidth,
		height: html.clientHeight
	}
}

CollageController.prototype.getTextSizeInCell = function(itemImageWidth){
    var titleSize = null, descSize = null;
    if ((itemImageWidth < 170)) { //eslint-disable-line no-empty

    } else if (itemImageWidth < 240) {
        titleSize = 21;
    } else if (itemImageWidth < 420) {
        titleSize = 24;
        descSize = 15;
    } else if (itemImageWidth < 580) {
        titleSize = 30;
        descSize = 15;
    } else if (itemImageWidth < 650) {
        titleSize = 38;
        descSize = 21;
    } else {
        titleSize = 48;
        descSize = 24;
    }
    return {titleSize: titleSize, descSize: descSize};
}

CollageController.prototype.getSizeInCells = function(item, cellSize){
    var self = this
        , ratio = item.width/item.height
        , sizeInCells = {
            width: 1,
            height: 1
        };

//    if(ratio > 1){
//        sizeInCells.width = cellSize;
//        sizeInCells.height = Math.max(1,Math.floor(cellSize/ratio * 4/3));
//    } else {
//        sizeInCells.height = cellSize;
//        sizeInCells.width = Math.max(1,Math.floor(cellSize * ratio * 3/4));
//    }
    if(self.props.orientation == 'horizontal'){
        sizeInCells.width = cellSize;
        sizeInCells.height = (ratio <= 2) ? cellSize : Math.min(cellSize,Math.ceil(cellSize/ratio * 4/3));
    } else {
        sizeInCells.height = cellSize;
        sizeInCells.width = (ratio <= 2) ? Math.min(cellSize,Math.max(1,Math.floor(cellSize * ratio * 3/4))) : cellSize;
    }
    return sizeInCells;
}
