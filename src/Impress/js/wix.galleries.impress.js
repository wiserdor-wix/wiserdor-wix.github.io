window.setTimeout(function () {
    window.scrollTo(0, 1)
}, 100)

var ImpressController = function (element, config) {
    var isChangingSlide = false;
    var self = this;
    self.itemClass = 'item';
    self.itemSelector = '.' + self.itemClass;

    self.items = []
    self.props = {}
    self.impressStarted = false;
    var t = 0;
    self.updatedMobileViewportSize = false;

	this.resize = _.debounce(_.bind(this._resize, this), 200);


	// NOTE: calling super (parent) constructor
    ImpressController.super_.apply(this, arguments)

    $('html *').on("click", function(e){
        e.stopPropagation();
    })

    $(self.el).on("click", '.image', function(e){
        var itemIndex = $(this).closest(self.itemSelector).index();
        self.itemClick(self.items[itemIndex], itemIndex, e);
    });
    $(self.el).on("click", '.more', function(e){
        var itemIndex = $(this).closest(self.itemSelector).index()
            , item = self.items[itemIndex]
        self.openLink(item.href, e.target, item.linkType, e, undefined, undefined, item.link);
    });
    $(self.el).on('click', '.page', function(){
        if(!isChangingSlide){
          var hash = $(this).attr('hash')
          if (hash) {
              self.autoplayPause()
              document.location.hash = hash;
              setTimeout(function(){self.autoplayResume()},1000)
          }
        }
    })

    $(self.el).on('click', '.next', function(){
        if(!isChangingSlide){
          self.autoplayPause()
          impress(self.impressId).next();
          setTimeout(function(){self.autoplayResume()},1000)
        }
    })
    $(self.el).on('click', '.prev', function(){
        if(!isChangingSlide){
          self.autoplayPause()
          impress(self.impressId).prev();
          setTimeout(function(){self.autoplayResume()},1000)
        }
    })

    self.activeIndex = $('.active').attr('data-index')

    document.body.addEventListener('slideChanged',function(e){
        if(isChangingSlide){
            return;
        }
        var didActiveSlideChange = $('.active').attr('data-index') !== self.activeIndex;
        isChangingSlide = true;
         setTimeout(function(){
           isChangingSlide = false;
           if (didActiveSlideChange) {
               Wix.pushState(JSON.stringify({cmd:'itemChanged', args:[parseInt(self.activeIndex, 10) - 1]}));
           }
         }, 2000);
        if(didActiveSlideChange){
            self.leavingSlideIndex = self.activeIndex;
            self.activeIndex = $('.active').attr('data-index');
            $('.step[data-index="'+ self.activeIndex + '"]').fadeIn(2000);
            $('.step[data-index="'+ self.leavingSlideIndex + '"]').removeClass('hide').show().stop().fadeOut(1500)
        }

        var activeSlide = $('.step[data-index="'+ self.activeIndex + '"]')
            , detailsHeight = $('.details', activeSlide).height()
            , windowHeight = $(window).height()-100
            , detailsVerticalPosition = Math.floor((windowHeight -detailsHeight)/2);
                $('.details', activeSlide).css({
                    top: detailsVerticalPosition
                });

        $('.page').each(function(index){
            $(this).removeClass('page-active').addClass('page-inactive');
        })

        $("span[data-index='" + self.activeIndex + "']").removeClass('page-inactive').addClass('page-active');
        self.el.css('background',utils.hexToRgba(self.bgColor[(self.activeIndex-1) % 5].color, self.bgColor[(self.activeIndex-1) % 5].alpha));

        if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)){
            if(!self.leavingSlideIndex){
                self.leavingSlideIndex = self.activeIndex
            }

            var ieversion=new Number(RegExp.$1)
            if(ieversion < 11){
                $('#leavingBg').css('background',utils.hexToRgba(self.bgColor[(self.leavingSlideIndex-1) % 5].color, self.bgColor[(self.leavingSlideIndex-1) % 5].alpha))
                    .show()
                    .stop()
                    .fadeOut(1500)
            }
        }
        else {
            clearTimeout(t);
            $('.item .more').css({
                top: 100 + 'px',
                opacity: 0
            })
            t = setTimeout(function(){
                $('.item .more').css({
                    top: 0 + 'px',
                    opacity: 1
                })
            }, (e.detail.totalTransitionDuration+200))
        }

    })

    $(document).on('keyup',function(event){
        if(event.keyCode == 9 || ( event.keyCode >= 32 && event.keyCode <= 34 ) || (event.keyCode >= 37 && event.keyCode <= 40)){
            self.autoplayPause()
            setTimeout(function(){self.autoplayResume()},1000)
        }
    })
}

utils.inherits(ImpressController, SimpleAppProto);


ImpressController.prototype.itemClick = function(item, index, e){
    var self = this;
    var itemIndex = parseInt(self.activeIndex, 10) - 1;
    switch (self.props.galleryImageOnClickAction){
        case "goToLink":
            if( self.isMobile || ($(window).width() < 585) ){
//                var item = self.items[itemIndex]
                self.openLink(item.href, e.target, item.linkType, e, undefined, undefined, item.link);
            }
            break;
        case "zoomMode":
            Wix.pushState(JSON.stringify({cmd:'zoom', args:[itemIndex]}));
            self.autoplayPause();
            break;
        case 'disabled':
        default:
            Wix.pushState(JSON.stringify({cmd: 'itemClicked', args: [itemIndex]}));
            break;
    }
}

ImpressController.prototype.zoomClosed = function () {
    var self = this;
    self.autoplayResume()
}

ImpressController.prototype.next = function () {
    impress(this.impressId).next();
}

ImpressController.prototype.previous = function () {
    impress(this.impressId).prev();
}

ImpressController.prototype.createDom = function(){
	var self = this
        , viewportSize = self.getViewportSize()
    self.impressId = _.uniqueId('impress-')

    self.el.width(viewportSize.width).height(viewportSize.height)

    var leavingBg = $('<div id="leavingBg"></div>').appendTo(self.el).width(viewportSize.width).height(viewportSize.height).addClass('hide');

	self.displayNode = $('<div></div>').appendTo(this.el)
    var pager = $('<div></div>').appendTo(self.el).addClass('pager')

    self.displayNode.attr('id', self.impressId).addClass('impress-display')

    if (self.isMobile) {
        $(self.displayNode).attr('data-height', $(window).height());
    }

	_.each(this.items, function(item, index){
		var itemNode = $('<div></div>').appendTo(self.displayNode)//.removeClass('hide')
			, itemImg = $('<div></div>').appendTo(itemNode).addClass('image')
			, itemInfo = $('<div></div>').appendTo(itemNode).addClass('details');
		itemNode.data('item', item).addClass(self.itemClass);

		$('<h3></h3>').appendTo(itemInfo).addClass('title').html(item.title);
		$('<div></div>').appendTo(itemInfo).addClass('desc').html(item.description);
		$('<div>Read more&nbsp;&nbsp;&nbsp;&nbsp;&gt;</div>').appendTo(itemInfo).addClass('more');
        $('<span>•</span>').appendTo(pager).attr('hash', '#step-' + (index+1)).attr('data-index', (index+1)).addClass('page');

	});

    var prev = $('<div><div class="inner"></div></div>').appendTo(self.el).addClass('prev')

    var next = $('<div><div class="inner"></div></div>').appendTo(self.el).addClass('next')

}

ImpressController.prototype.updateLayout = function(){
    var self = this
    if(self.isMobile && self.updatedMobileViewportSize == false){
        windowWidth = ($(window).width() > $(window).height()) ? (screen.height-110) : (screen.width-110)
        windowHeight = ($(window).width() > $(window).height()) ? (screen.width-40) : (screen.height-40)
        self.updatedMobileViewportSize = true;
        self._resize();
    }

    else {
          var itemsCount = self.items.length
            , i = 0
            , scale = 1
            , transition = self.props.transition
            , alfa = 0
            , globalScale = 1
            , windowWidth
            , windowHeight
            , activeDotColor = self.props.textColor
            , inactiveDotColor = self.props.textBackgroundColor
            , dotOpacity = self.props.alphaTextBackgroundColor
            , index=1
            , x = 0
            , y = 0
            , z = 0
            , rotateX = 0
            , rotateY = 0
            , rotateZ = 0
            , imageMaxWidth

        if (!self.tmpStyleSheet) {
            $('<style></style>').appendTo('head').attr('id', 'dynamic-style').get(0);
            for (var i = document.styleSheets.length - 1; i >= 0; i--) {
                var style = document.styleSheets[i];
                if (style.cssRules != null) {
                    self.tmpStyleSheet = style;
                    break;
                }
            }
        }

        if (self.props.transition == 'random') {
            var transitionsStack = ['1', '2', '3', '4', '5']
            var transitions = []
            for (var c = 0; c < itemsCount; c++) {
                transitions.push(transitionsStack[Math.floor(Math.random() * 5)])
            }
        }

        var s = self.tmpStyleSheet, l=0

        var ruleActive, ruleInactive
        var inactiveDotSelector = '#viewport .pager .page-inactive';
        var activeDotSelector = '#viewport .pager .page-active';
        if (s.insertRule){
            l = s.cssRules.length
            s.insertRule(inactiveDotSelector+' { color: '+inactiveDotColor+'!important; opacity: '+dotOpacity+';}', l);
            s.insertRule(activeDotSelector+' { color: '+activeDotColor+'!important; opacity: '+dotOpacity+';}', l+1);
            ruleInactive = s.cssRules[l];
            ruleActive = s.cssRules[l+1];
        } else if (s.addRule){
            l = s.rules.length
            s.addRule(inactiveDotSelector, 'color: '+inactiveDotColor+'; opacity: '+dotOpacity+';', l);
            s.addRule(activeDotSelector, 'color: '+activeDotColor+'; opacity: '+dotOpacity+';', l+1);
            ruleInactive = s.rules[l];
            ruleActive = s.rules[l+1];
        }
        ruleInactive.style.color = inactiveDotColor;
        ruleInactive.style.opacity = dotOpacity;
        ruleActive.style.color = activeDotColor;
        ruleActive.style.opacity = dotOpacity;

        utils.loadGoogleFontIfNeeded(self.props.font);
        $(self.itemSelector, self.el).find('.title').css({
            fontFamily: utils.fontFamilyDegradation(self.props.font),
            color: utils.hexToRgba(self.props.textColor, self.props.alphaTextColor)
        })

        $(self.itemSelector, self.el).find('.desc').css({
            fontFamily: utils.fontFamilyDegradation(self.props.font),
            color: utils.hexToRgba(self.props.descriptionColor, self.props.alphaDescriptionColor)
        });

        if(self.props.galleryImageOnClickAction !== 'goToLink'){
            $(self.itemSelector, self.el).find('.more').css('display', 'none');
        }
        else {
            $(self.itemSelector, self.el).find('.more')
                .css({
                    display: 'inline-block',
                    fontFamily: utils.fontFamilyDegradation(self.props.font),
                    color: self.props.textBackgroundColor,
                    background: self.props.textColor
                })
                .hover(function(){
                    $(this).css({
                        color: self.props.textColor,
                        background: self.props.textBackgroundColor
                    })
                }, function(){
                    $(this).css({
                        color: self.props.textBackgroundColor,
                        background: self.props.textColor
                    })
                }
            );
        }

        if (self.activeIndex){
            self.el.css('background',utils.hexToRgba(self.bgColor[(self.activeIndex-1) % 5].color, self.bgColor[(self.activeIndex-1) % 5].alpha));
        }
        else {
            self.el.css('background',utils.hexToRgba(self.bgColor[0].color, self.bgColor[0].alpha));
        }

        if(self.isMobile){
            windowWidth = Math.min(screen.width - 42, $(window).width() - 42);
            windowHeight = Math.min(screen.height, $(window).height());
            $('.next, .prev').addClass('mobile');
        }
        else {
            windowWidth = $(window).width()-200;
            windowHeight = $(window).height()-100;
            $('.next, .prev').removeClass('mobile');
        }

        if ( (windowWidth+200 < 585) || self.props.showPagination == false || self.isMobile){
            $('.pager').addClass('hide');
            $('.details').addClass('hide');
        }
        else {
            $('.pager').removeClass('hide');
            $('.details').removeClass('hide');
        }

        if( !self.isMobile && (windowWidth+200 < 585) ){
            $('.image').css('cursor', 'pointer');
        }

        if (self.props.galleryImageOnClickAction == 'zoomMode'){
            $('.image').css('cursor', 'pointer');
        }
        else {
            $('.image').css('cursor', '');
        }

        imageMaxWidth = (windowWidth+200 < 585) ? windowWidth : windowWidth/2

        $(self.itemSelector, self.el).each(function(index){
            var el = $(this),
                img = $('.image', el)
                , item = el.data('item')
                , ratio = item.width/item.height
                , itemImageHeight = 0
                , itemImageWidth = 0

            if (navigator.userAgent.match(/msie/i) || navigator.userAgent.match(/trident/i)) {
                transition = 'none';
            } else if (self.props.transition == 'random') {
                transition = transitions[i];
            }

            $('.title', el).html(item.title);
            $('.desc', el).html(item.description);
            if(!item.href){
                $('.more', el).css('display', 'none');
            }

            if( self.props.cropAndFitStage && self.props.cropAndFitStage == 'crop' ){

              if(self.isMobile){

                  if( (item.width <= Math.floor(imageMaxWidth)) && (item.height <= windowHeight) ){
                      itemImageWidth = (item.width > 210) ? 210 : item.width;
                      itemImageHeight = Math.floor(item.width *3/4);
                      if(itemImageHeight > item.height){
                          itemImageWidth = Math.floor(item.height * 4/3)
                          itemImageHeight = item.height
                      }
                  }
                  else {
                      itemImageWidth = (Math.floor(imageMaxWidth) > 210) ? 210 : Math.floor(imageMaxWidth)
                      itemImageHeight = Math.floor(itemImageWidth*3/4);
                      if (itemImageHeight >= windowHeight){
                          itemImageHeight = windowHeight;
                          itemImageWidth = Math.floor(itemImageHeight * 4/3);
                      }
                  }
              } else if ((item.width <= Math.floor(imageMaxWidth)) && (item.height <= windowHeight)) {
                  itemImageWidth = item.width
                  itemImageHeight = Math.floor(item.width * 3 / 4);
                  if (itemImageHeight > item.height) {
                      itemImageWidth = Math.floor(item.height * 4 / 3)
                      itemImageHeight = item.height
                  }
              }
              else {
                  itemImageWidth = Math.floor(imageMaxWidth)
                  itemImageHeight = Math.floor(itemImageWidth*3/4);
                  if (itemImageHeight >= windowHeight){
                      itemImageHeight = windowHeight;
                      itemImageWidth = Math.floor(itemImageHeight * 4/3);
                  }
              }

            } else {
                var maxWidth, maxHeight

                if(self.isMobile){
                    if (Math.floor(imageMaxWidth) / windowHeight >= 4 / 3) {
                        maxWidth = (Math.floor(windowHeight * 4 / 3) > 210) ? 210 : Math.floor(windowHeight * 4 / 3)
                        maxHeight = windowHeight
                    } else {
                        maxWidth = (Math.floor(imageMaxWidth) > 210) ? 210 : Math.floor(imageMaxWidth)
                        maxHeight = Math.floor(imageMaxWidth * 3 / 4)
                    }

                    if ((item.width <= maxWidth) && (item.height <= maxHeight)) {
                        itemImageWidth = item.width
                        itemImageHeight = item.height
                    } else if (item.width >= item.height) {
                        itemImageWidth = maxWidth
                        itemImageHeight = Math.floor(itemImageWidth / ratio);
                        if (itemImageHeight >= maxHeight) {
                            itemImageHeight = maxHeight;
                            itemImageWidth = Math.floor(itemImageHeight * ratio);
                        }
                    } else {
                        itemImageHeight = maxHeight
                        itemImageWidth = Math.floor(itemImageHeight * ratio);
                        if (itemImageWidth >= maxWidth) {
                            itemImageWidth = maxWidth
                            itemImageHeight = Math.floor(itemImageWidth / ratio);
                        }
                    }
                } else {
                    if (Math.floor(imageMaxWidth) / windowHeight >= 4 / 3) {
                        maxWidth = Math.floor(windowHeight * 4 / 3)
                        maxHeight = windowHeight
                    } else {
                        maxWidth = Math.floor(imageMaxWidth)
                        maxHeight = Math.floor(imageMaxWidth * 3 / 4)
                    }

                    if ((item.width <= maxWidth) && (item.height <= maxHeight)) {
                        itemImageWidth = item.width
                        itemImageHeight = item.height
                    } else if (item.width >= item.height) {
                        itemImageWidth = maxWidth
                        itemImageHeight = Math.floor(itemImageWidth / ratio);
                        if (itemImageHeight >= maxHeight) {
                            itemImageHeight = maxHeight;
                            itemImageWidth = Math.floor(itemImageHeight * ratio);
                        }
                    } else {
                        itemImageHeight = maxHeight
                        itemImageWidth = Math.floor(itemImageHeight * ratio);
                        if (itemImageWidth >= maxWidth) {
                            itemImageWidth = maxWidth
                            itemImageHeight = Math.floor(itemImageWidth / ratio);
                        }
                    }
                }
            }

            if(self.isMobile){
                img.css({
                    left: Math.floor((windowWidth - itemImageWidth)/2) + 'px'
                })
            }

            else {
                img.css({
                    left: 'auto',
                    right: Math.floor((imageMaxWidth - itemImageWidth)/2) + 'px'
                })
            }

            var imageUri = utils.getResizedImageUrl(item.uri, itemImageWidth, itemImageHeight, {siteQuality: self.quality, maxWidth: item.width, maxHeight: item.height})
                , impressItem = el[0]

            switch (transition){

                case 'none':
                    break;

                case '1':

                    y += 750;
                    scale = (scale < 1) ? 1 : 0.3;
                    break;

                case '2':

                    x += 2000*(1-2*(i%2));
                    y += -500*(1-2*(i%2));
                    z += 3000;
                    rotateZ += 180;
                    break;

                case '3':

                    x += -500*(1-2*(i%2));
                    z -= 3000;
                    rotateZ -= 180;
                    break;

                case '4':

                    x += Math.floor(1500 * Math.cos(rotateY*Math.PI/180) + 1000 * Math.sin(rotateY*Math.PI/180));
                    z += Math.floor(-1500 * Math.sin(rotateY*Math.PI/180) + 1000 * Math.cos(rotateY*Math.PI/180));
                    rotateY += 45;
                    break;

                case '5':

                    var factor = windowWidth/780;
                    x += Math.floor((-2500 * Math.cos((rotateY-45)*Math.PI/180) - 1000 * Math.sin((rotateY-45)*Math.PI/180)) * factor);
                    z += Math.floor((2500 * Math.sin((rotateY-45)*Math.PI/180) - 1000 * Math.cos((rotateY-45)*Math.PI/180)) * factor);
                    rotateY -= 45;
                    break;
            }

            $(impressItem).addClass('item step')
                .attr('data-index', index+1)
                .attr('data-modulus', index%5)
                .attr('data-x', x)
                .attr('data-y', y)
                .attr('data-z', z)
                .attr('data-scale', scale)
                .attr('data-rotate-x', rotateX)
                .attr('data-rotate-y', rotateY)
                .attr('data-rotate-z', rotateZ)
            i++;

            el.height(windowHeight).width(windowWidth);
            var detailsEl = $('.details', el);
            var descEl = $('.desc', el);
            var titleEl = $('.title', el);
            var moreEl = $('.more', el);
            if(!self.isMobile && (windowWidth+200 >= 585)){
                switch (self.props.textMode){
                    case "titleAndDescription":
                        $('.title,.desc,.details', el).removeClass('hide');
                        $('.more, .desc', el).removeClass('noTopMargin');
                        if(!item.description){
                            descEl.addClass('hide');
                            moreEl.removeClass('noTopMargin');
                        }
                        if(!item.title){
                            titleEl.addClass('hide');
                            descEl.addClass('noTopMargin');
                            moreEl.removeClass('noTopMargin');
                        }
                        break;
                    case "titleOnly":
                        $('.title,.details', el).removeClass('hide');
                        descEl.addClass('hide');
                        moreEl.removeClass('noTopMargin');
                        break;
                    case "descriptionOnly":
                        $('.desc,.details', el).removeClass('hide');
                        titleEl.addClass('hide');
                        descEl.addClass('noTopMargin');
                        moreEl.removeClass('noTopMargin');
                        break;
                    case "noText":
                        $('.title,.desc', el).addClass('hide');
                        moreEl.addClass('noTopMargin');
                        break;
                }
            }

            var imgVerticalPosition = Math.floor((windowHeight -itemImageHeight)/2);
            img.height(itemImageHeight).width(itemImageWidth).css({
                backgroundImage: 'url('+ imageUri +')',
                backgroundSize: 'cover',
                top: imgVerticalPosition
            });
            var detailsHeight = detailsEl.height();
            var detailsVerticalPosition = Math.floor((windowHeight -detailsHeight)/2);
            detailsEl.css({
                top: detailsVerticalPosition
            });

            el.addClass('hide')
        });

        $('.step[data-index="'+ self.activeIndex + '"]').fadeIn(2000);
        impress(self.impressId).init();
        self.activeSlide = $('.active').attr('id');
        self.autoplayResume();
    }
}

ImpressController.prototype.changeEditMode = function(){
    var self = this

    if (self.editMode == 'editor'){
        self.autoplayPause();
    } else {
        self.autoplayResume();
    }
}

ImpressController.prototype.autoplayPause = function(){
    var self = this

    clearInterval(self.autoplayId);
    self.autoplayId = null;
}

ImpressController.prototype.autoplayResume = function(){
    var self = this
        , autoplayInterval = (self.props.autoplayInterval > 2) ? self.props.autoplayInterval : 2

    if (this.editMode == 'editor') {
        return;
    }

    if (self.props.autoplay == true){
        self.autoplayId = self.autoplayId || setInterval(function(){
            impress(self.impressId).next();
        },autoplayInterval*1000)
    }
}

ImpressController.prototype.updateSettings = function(config){
    var self = this
        , recreate = false
    self.bgColor = []

    self.quality = config.quality || {};
    if (self.itemsChanged(config.items, ['uri'])){
        recreate = true;
    }
    else if (self.propsChanged(config.props, ['transition','layoutSeed'])){
        recreate = true;
    }

    if (self.propsChanged(config.props, ['transition','layoutSeed']) && (self.editMode != 'site')){
        setTimeout(function(){
            impress(self.impressId).next()},2500)
    }

    if (self.props.autoplay !== config.props.autoplay) {
        config.props.autoplay ? this.autoplayResume() : this.autoplayPause();
    }

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

    for (var i = 1; i <= 5; i++) {
        self.bgColor.push({
            'color': eval('self.props.bcgColor' + i), //eslint-disable-line no-eval
            'alpha': eval('self.props.alphaBcgColor' + i) //eslint-disable-line no-eval
        })
    }

	self.updateLayout();
}

ImpressController.prototype.destroy = function(){
    this.el.html('');
}

ImpressController.prototype._resize = function(){
    var self = this
        , viewportSize = self.getViewportSize()

    self.destroy();
    self.createDom();
    self.updateLayout();
}

ImpressController.prototype.distributeSizes = function(){
    var self = this
        , result = []
        , size = self.items.length
        , sum = 0

    Math.seedrandom('layout-seed-50');
    for (var i = 0; i < size; i++) {
            var value = Math.ceil(Math.random()*3)
        sum += value;
        result.push(value)
    }

    return {
        item: result,
        sum: sum
    };
}

ImpressController.prototype.getViewportSize = function(){
    var html = document.documentElement;

    return {
        width: html.clientWidth,
        height: html.clientHeight
    }
}
