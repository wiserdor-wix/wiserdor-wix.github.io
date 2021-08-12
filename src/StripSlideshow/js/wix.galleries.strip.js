var StripGalleryController = function (element, config) {
	var self = this;
	this.resize = _.debounce(_.bind(this._resize, this), 200);

	// NOTE: calling super (parent) constructor
	StripGalleryController.super_.apply(this, arguments)

	this.el = element;
	this.itemClass = 'item';
	this.editMode = Wix.Utils.getViewMode();

	this.init(config);

	$(this.el).on('click', '.'+this.itemClass + " .more", function(e){
		var itemIndex = self.currSlideindex;
        self.itemClick(self.items[itemIndex], itemIndex, e.target, e,self.items[itemIndex]["data-anchor"],this.mainPageId);
	});
}
utils.inherits(StripGalleryController, SimpleAppProto);



StripGalleryController.prototype._randomTransition = function(){
    var transitions = ['crossFade', 'scroll', 'slide', 'zoom'];
    this._fxRandomized = this._fxRandomized || _.shuffle(transitions);
    this._fxRandomIteration = this._fxRandomIteration || 0;

    var index = this._fxRandomIteration % this._fxRandomized.length;

    this._fxRandomIteration++;

    return this._fxFromTransition(this._fxRandomized[index]);
}

StripGalleryController.prototype._fxFromTransition = function(transition){
    var data = {
        fx: transition,
        transition: transition,
        speed: (this.props.transDuration || 1) * 1000
    };

    switch (transition){
        case 'none':
            data.speed = 1;
            break;
        case 'zoom':
        case 'crossFade':
            data.fx = 'fadeout';
            break;
        case 'scroll':
            data.fx = 'scrollVert';
            data.easing = "easeInOutQuart";
            break;
        case 'slide':
            data.fx = 'scrollHorz';
            data.easing = "easeInOutQuart";
            break;
        case 'random':
            data.fx = 'random'
            break;
    }
    return data;
}

StripGalleryController.prototype.dimCrop = function(width, height){
    var scale = Math.max( this.wrapperWidth / width, this.wrapperHeight/height);
    scale = Math.min(scale, 1);
    return {
        height: Math.floor(height * scale),
        width: Math.floor(width * scale)
    }
}

StripGalleryController.prototype.itemClick = function (item, index, sourceElement) {
    this.openLink(item.href, item.target, item.linkType, item["data-anchor", this.mainPageId], item["data-anchor"], this.mainPageId, item.link);
}

StripGalleryController.prototype.itemTemplate = _.template('<div class="<%=itemClass%>"><div class="inner"><div><div class="img" data-uri="<%=img.uri%>" data-width="<%=img.width%>" data-height="<%=img.height%>"></div><div class="overlay"><div class="sb-description"><% if(description || title) {  %><% if(title) { %><div class="title" title="<%=title%>"><%=title%></div><% } %><% if(description) { %><div class="desc"><%=description%></div><% } %><% } %><div><div class="more">Read more&nbsp;&nbsp;&nbsp;&nbsp;&gt;</div></div></div></div></div>');

StripGalleryController.prototype.init = function(config){
	this.items = config.items || []
	this.props = config.props || {}
    this.marketingLandingPage = config.marketingLandingPage;
	this.el.html('<div class="grid-sizer"></div>');

	this.gridSizer = $('.grid-sizer');
	this.createDom();
	this.createLayout();
	this._resize();
}

StripGalleryController.prototype.zoomClosed = function () {
    this.autoplayResume()
}

StripGalleryController.prototype.next = function () {
    var cycleNode = $(this.el);
    cycleNode.cycle('next');
}

StripGalleryController.prototype.previous = function () {
    var cycleNode = $(this.el);
    cycleNode.cycle('prev');
}


StripGalleryController.prototype.autoplayPause = function(){
    var cycleNode = $(this.el);
    cycleNode.cycle('pause');
    this.el.removeClass("image-animation");
}

StripGalleryController.prototype.autoplayResume = function(){
    var cycleNode = $(this.el);
    if (this.editMode == 'editor') return;
    if (this.props.autoplay) cycleNode.cycle('resume');
    this.el.addClass("image-animation");

}


StripGalleryController.prototype._resize = function () {
	this.calculateLayoutSizes();
	this.updateLayout();
    this.moveCaption("in");
}

StripGalleryController.prototype.destroy = function () {
    this.el.cycle("destroy");
//	this.el.html('<div class="grid-sizer"></div>');
}

StripGalleryController.prototype.createDom = function () {
	var self = this;
	this.el.html('<div class="grid-sizer"></div><div class="cycle-pager"></div>');
	this.calculateLayoutSizes();
	var fragment = document.createDocumentFragment();

	_.each(this.items, function (item, index) {
		fragment.appendChild(self.createSingleItem(item, index));
	});

	this.el.append(fragment);

  if (this.marketingLandingPage || this.items.length <=1) {
      $('.cycle-pager').hide();
  }
}

StripGalleryController.prototype.moveCaption = function (move_direction) {
    var caption = $('.cycle-slide-active .sb-description');

    var top = 0;

    switch(move_direction)
    {
        case "in":
            top = ((this.wrapperHeight - caption.height()) / 2);

            // if caption size is still unavailable
            if ((top == undefined) || (top < 0) || !caption.width()) {
                top = (this.wrapperHeight - 196) / 2;
            }
            break;

        case "out":
            top = this.wrapperHeight;
            break;
    }

    caption.css("top", top + "px");
}

StripGalleryController.prototype.createLayout = function () {
	var self = this;
	var props = {
		columnWidth: '.grid-sizer',
		itemSelector: '.' + this.itemClass,
		isResizeBound: false
	};
//	p = _.clone(App.props);i = _.clone(App.items); App.margin=25; App.updateSettings({items:i,props:p})

    $( this.el ).on( 'cycle-update-view', function( event, opts ) {
        self.moveCaption("in");
    });

    $(this.el).on( 'cycle-after', function( e, opts) {
        self.moveCaption("out");
        if (self.currSlideindex !== opts.nextSlide) {
            self.currSlideindex = opts.nextSlide;
            Wix.pushState(JSON.stringify({cmd:'itemChanged', args:[opts.nextSlide]}));
        }
    });

    $(this.el).on( 'cycle-before', function( e, opts, outgoingSlideEl, incomingSlideEl, forwardFlag ) {
        if(self.props.transition == 'random')
        {
            if($(incomingSlideEl).data('transition') == "zoom")
            {
                $(self.el).addClass("animation-zoom");
            }
            else
            {
                $(self.el).removeClass("animation-zoom");
            }
        }

        /* Update pager before the transition */
        var pagers;

        if ( opts.pager ) {
            var index = opts.nextSlide;
            pagers = opts.API.getComponent( 'pager' );
            pagers.each(function() {
                $(this).children().removeClass(opts.pagerActiveClass)
                    .eq(index).addClass( opts.pagerActiveClass );
            });

            var galleryWidth = $(this).width();
            var buttonWidth = pagers.children().eq(index).outerWidth(true);
            var shouldIndent = buttonWidth * pagers.children().length > galleryWidth;

            if (shouldIndent) {
                var direction = opts.nextSlide > opts.currSlide;
                var indent = (-1 * buttonWidth * index) +
                    (direction ? (galleryWidth / 3) : (2 * galleryWidth / 3));

                indent = Math.min(indent, galleryWidth / 4);
                pagers.css('transform', 'translateX(' + indent + 'px)');
            }

        }
    });

	if (this.editMode == 'editor'){
        $(this.el).cycle('pause');
        $(this.el).removeClass("image-animation");
	}

    // Read More button styling
    var titleBackgroundColor = self.props.backgroundColor; // title bg + desc bg + button text
    var titleTextColor = self.props.titleColor; // title text + button bg

    $(this.el).find(".more").hover(function(){
        $(this).css(
            {'color': titleTextColor,
                backgroundColor: titleBackgroundColor}
        )
    }, function(){
        $(this).css(
            {'color': titleBackgroundColor,
                backgroundColor: titleTextColor}
        )
    });
}

StripGalleryController.prototype.updateSettings = function(config){
    var recreate = true;
    this.mainPageId = config.mainPageId;
    this.transitionChanged = (self.editMode == 'editor') && (this.props.transition != config.props.transition);

    this.quality = config.quality || {};
    this.marketingLandingPage = config.marketingLandingPage;
    if ((this.props.textMode != config.props.textMode) || this.transitionChanged )
    {
        recreate = true;
    }

	if (this.items.length != config.items.length){
		recreate = true;
	} else {
		for (var i=0; i<this.items.length; i++)
			if (!_.isEqual(this.items[i], config.items[i])) {
				recreate = true;
				break;
			}
	}

	this.props = config.props;

	if (recreate){
		this.destroy();
		this.init(config);
	} else {
		this.resize();
	}
}

StripGalleryController.prototype.calculateLayoutSizes = function () {
	this.gridSizer = $('.grid-sizer');
	this.wrapperWidth = $('body').width();
	this.wrapperHeight = $('body').height();
    this.currSlideindex = this.currSlideindex || 0;

	this.gridSizer.width(this.wrapperWidth);
	$('.' + this.itemClass, this.el).width(this.wrapperWidth);
}


StripGalleryController.prototype.updateLayout = function () {
	var self = this;
	this.el.css('text-align', this.props.alignText);
	var resizeImages = utils.pyramid.isOverThresholdChange() || this.preRender;

	var wrapperDim = {
		height: self.wrapperHeight,
		width: self.wrapperWidth
	}
	var itemStyles = {
		boxShadow: self.props.boxShadow,
		'font-family': utils.fontFamilyDegradation(self.props.font)
	}

	$('.' + this.itemClass, this.el).css(itemStyles).css(wrapperDim).find('.img').css(wrapperDim);

	$('.' + this.itemClass + ":not(.cycle-sentinel)", this.el ).each(function (index) {
        var transition = self.props.transition || 'none';
        if(transition == 'random')
        {
            var slideFxData = self._randomTransition();

            $(this).attr({
                'data-cycle-fx':slideFxData.fx,
                'data-cycle-speed':slideFxData.speed,
                'data-transition': slideFxData.transition
            });
        }

        if (resizeImages) {
            var overlay = $('.overlay', this);
            var img = $('.img', this);
            var dim = self.dimCrop(img.data('width'), img.data('height'));
            var uri = img.data('uri');
            img.css({
                background: 'url('+utils.getResizedImageUrl(uri, dim.width, dim.height, {siteQuality: self.quality, maxWidth: img.data('width'), maxHeight: img.data('height')})+')',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '50%',
                backgroundSize: 'cover'
            });

            overlay.height(dim.height);
            var max_overlay_size = 980;
            overlay.css("left", (Math.max((self.wrapperWidth-max_overlay_size)/2, 0)));
        }

        var caption = $('.sb-description', this).css("text-size" , "10px");
        var caption_elements = $('.desc, .title, .more', this);

        switch(self.props.alignText)
        {
            case 'right':
                caption.css({
                    left : "auto",
                    right :"20px",
                    float: 'right'});

                caption_elements.css({
                        float:"right",
                        clear: "right"
                    });
                break;

            case 'center':
                caption.css({
                    left : "auto",
                    right : "auto",
                    float: 'none',
                    margin: '0 auto'});
                caption_elements.css({
                    float:"none",
                    clear: "both"
                });
                break;

            default:
            case 'left':
                caption.css({
                    left :"20px",
                    right : "auto",
                    float: 'left'});
                caption_elements.css({
                    float:"left",
                    clear: "left"
                });
                break;
        }

        // Colors
        var titleBackgroundColor = self.props.backgroundColor; // title bg + desc bg + button text
        var titleBackgroundOpacity = self.props.alphaBackgroundColor;
        var titleBackgroundColorRGBA = utils.hexToRgba(titleBackgroundColor, titleBackgroundOpacity);

        var titleTextColor = self.props.titleColor; // title text + button bg
        var titleTextOpacity = self.props.alphaTitleColor; // title text + button bg
        var titleTextColorRGBA = utils.hexToRgba(titleTextColor, titleTextOpacity);

        var descriptionTextColor = self.props.descriptionColor; // description text colore
        var descriptionTextOpacity = self.props.alphaDescriptionColor; // description text colore
        var descriptionTextColorRGBA = utils.hexToRgba(descriptionTextColor, descriptionTextOpacity);

        var title = $('.sb-description .title', this);
        var description = $('.sb-description .desc', this);
        var read_more_btn = $('.sb-description .more', this);

        title.css({
            'color':titleTextColorRGBA,
            'background-color':titleBackgroundColorRGBA
        });

        read_more_btn.css({
            'background-color':titleTextColorRGBA,
            'color':titleBackgroundColor,
            'cursor': "pointer"});

        if(self.items[index] != undefined && (self.items[index].href == undefined || !self.items[index].href))
        {
            read_more_btn.css({
                'display':'none'
            });
        }
        else
        {
            read_more_btn.css({
                'display':'block'
            });
        }

        description.css({
            'background-color':titleBackgroundColorRGBA,
            'color':descriptionTextColorRGBA
        });

        var ss = document.styleSheets;
        for (var i=0; i<ss.length; i++) {
            try {
                var rules = ss[i].cssRules || ss[i].rules || [];

                for (var j=0; j<rules.length; j++) {
                    if (rules[j].selectorText === ".cycle-pager span") {
                        rules[j].style.color = titleBackgroundColorRGBA;
                    }
                    if (rules[j].selectorText === ".cycle-pager span.cycle-pager-active") {
                        rules[j].style.color = titleTextColorRGBA;
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
    });

    /* Transitions */
    var transition = self.props.transition || 'none';
    var fxData = self._fxFromTransition(transition);

    var timeout = self.props.autoplayInterval * 1000 || 5000;
    var paused = !self.props.autoplay || self.editMode == 'editor';

    $(this.el).find(".sb-description").addClass("text-animation");
    $(this.el).addClass("image-animation");
    $(this.el).removeClass("animation-zoom");

    switch (transition){
        case 'none':
            $(this.el).find(".sb-description").removeClass("text-animation");
            break;

        case 'zoom':
            $(this.el).addClass("animation-zoom");
            break;
    }

    $(this.el).cycle({
        slides: ".item",
        fx: fxData.fx,
        speed: fxData.speed,
        easing: fxData.easing,
        timeout: timeout,
        paused: paused,
        startingSlide: self.currSlideindex
    });

    if(this.transitionChanged && this.editMode == 'editor')
    {
        _.delay(function(){
            $(self.el).cycle('next');
        }, 1500);

        this.transitionChanged = false;
    }

	this.preRender = false;
}


StripGalleryController.prototype.createSingleItem = function (item, index) {
	this.preRender = true;
	var itemTemplate = this.itemTemplate;
//	var imgSize = utils.getVerticalColumnImageSize(this.columnWidth, item.width, item.height);
	var template_data = {
		itemClass: this.itemClass,
		img: {
//			src: Wix.Utils.Media.getResizedImageUrl(item.uri, imgSize.width, imgSize.height),
			src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
			height: item.height,
			width: item.width,
			uri: item.uri
		},
		title: null,
		description: null
	};
//		if (item.description){
//			item.description = item.description.replace(/(.....)/gi,'$1&shy;');
//		}
    switch(this.props.textMode)
    {
        case 'titleAndDescription':
            template_data.title = item.title;
            template_data.description = item.description;
            break;

        case 'titleOnly':
            template_data.title = item.title;
            break;

        case 'descriptionOnly':
            template_data.description = item.description;
            break;

        case 'noText':
            break;
    }

	if (this.props.galleryImageOnClickAction === 'zoomMode') {
        // this.autoplayPause();
	}

	var slice = itemTemplate(template_data);

	return $(slice)[0];
}

StripGalleryController.prototype.changeEditMode = function(){
    var cycleNode = $(this.el);

    if (this.editMode == 'editor'){
        this.autoplayPause();
    } else {
        this.autoplayResume();
    }
    cycleNode.cycle({'timeout':this.props.autoplayInterval*1000})
}
