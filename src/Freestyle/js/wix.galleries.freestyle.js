var FreestyleController = function (element, config) {
	var self = this;
	self.itemClass = 'item';
	self.itemSelector = '.'+self.itemClass;

	self.items = [];
	self.props = {};
    self.nodrag = true;
    self.firstLoad = true;
    self.preservedHeight = 600;
    self.lastIndex = -1;

	this.resize = _.debounce(_.bind(this._resize, this), 200);


	// NOTE: calling super (parent) constructor
    FreestyleController.super_.apply(this, arguments)

    $(self.el).on("click", '.filler', function(e){
        if (self.nodrag == true){
            var itemIndex = $(e.currentTarget).parent().index();
            if(self.lastIndex == self.activeIndex){
                self.itemClick(self.items[itemIndex], itemIndex, e);
            }
        }
        else {
            self.nodrag = true
        }
    });
    $(self.el).on("dblclick", '.filler, .caman', function(e){
        var itemIndex = $(e.currentTarget).parent().index();
        self.itemClick(self.items[itemIndex], itemIndex, e);
    })
}
utils.inherits(FreestyleController, SimpleAppProto);

FreestyleController.prototype.itemClick = function(item, index, e){
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

FreestyleController.prototype.createDom = function(){
    var self = this
        , z = 1
        , viewportSize = self.getViewportSize()
    self.containerHeight = viewportSize.height
    self.itemsInViewport = 5

    self.el.html('');
	self.displayNode = $('<div id="container"></div>').appendTo(this.el);
    var container = $('#container');

	_.each(this.items, function(item, index){
		var itemNode = $('<div class="drag"></div>').appendTo(self.displayNode);
        itemNode.data('item', item).addClass(self.itemClass);
        if(self.isMobile){
            itemNode.addClass('hide');
        }
        else {
            $('<div class="rotate NE"></div><div class="handle NW"></div><div class="handle SW"></div><div class="handle SE"></div>').appendTo(itemNode)

        }
        $('<div class="border"></div>').appendTo(itemNode);
        $('<div class="filler"></div>').appendTo(itemNode);
        $('<svg class="overlay">').appendTo(itemNode);
        $('<img class="caman">').appendTo(itemNode).attr('id','caman-' + index).addClass('hide');
		var itemInfo = $('<div class="details"></div>').appendTo(itemNode).addClass('hide');
		$('<h3 class="title"></h3>').appendTo(itemInfo).html(item.title);
	});

    if ( (self.isMobile) && (self.props.orientation == 'vertical') && ((self.itemsInViewport < self.items.length)) ){
        $('<div class="show-more">Show More</div>').appendTo(self.el).click(_.bind(self.displayMore,this));
//        $('<div class="show-more">Show More</div>').appendTo(self.el);
    }

    if(!self.isMobile){
        $('.drag')
            .mousedown(function(e){
                self.lastIndex = self.activeIndex;
                $(self.itemSelector, self.el).removeClass('active');
                $('.drag').css('cursor','')
                $( this ).css('zIndex', z++).addClass('active');
                self.activeIndex = $(this).index();
                if(self.props.galleryImageOnClickAction === 'goToLink' &&  !_.isEmpty(self.items[self.activeIndex].href)){
                    $(this).css('cursor','pointer')
                }
            })
    }

    $('.drag').on('touchstart',function(){
        self.lastIndex = self.activeIndex;
        $(self.itemSelector, self.el).removeClass('active');
        $( this ).css('zIndex', z++).addClass('active');
        self.activeIndex = $(this).index();
    })

    self.displayNode.css({
        position: 'absolute',
        top: 0 + 'px',
        bottom: 0 + 'px',
        left: 0 + 'px',
        right: 0 + 'px'
    })

}

FreestyleController.prototype.displayMore = function(){
    var self = this
        , newLimit = Math.min(self.items.length, self.itemsInViewport + 5);

    var shuffled=self.shuffleIndexes();

    for(var i=self.itemsInViewport; i<newLimit; i++){
//        console.log(i,shuffled[i],shuffled.indexOf(i))
//        $(self.itemSelector, self.el).eq(shuffled[i]).removeClass('hide')
        $(self.itemSelector, self.el).eq(shuffled.indexOf(i)).removeClass('hide')
    }
    this.itemsInViewport = newLimit;
    self.containerHeight = self.elementSize * (newLimit+1);
//    Wix.reportHeightChange(self.elementSize * (newLimit+1));
    Wix.setHeight(Math.floor(self.elementSize * (newLimit+0.5)));

    if (self.itemsInViewport == self.items.length) {
        $('.show-more').addClass('hide');
    } else {
        $('.show-more').css({
            top: Math.floor(self.elementSize * (newLimit + 0.8)) + 'px'
        })
    }
//    self.updateLayout()
}

FreestyleController.prototype.shuffleIndexes = function () {
    var self = this
    Math.seedrandom('layout-seed-' + self.props.layoutSeed);

    var shuffledIndexes = []
    self.random = []
    for (var c = 0; c < self.items.length; c++) {
        shuffledIndexes.push(c)
        self.random[c] = Math.random()
    }

    var currentIndex = shuffledIndexes.length
        , temporaryValue
        , randomIndex
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = shuffledIndexes[currentIndex];
        shuffledIndexes[currentIndex] = shuffledIndexes[randomIndex];
        shuffledIndexes[randomIndex] = temporaryValue;
    }
    return shuffledIndexes;
}

FreestyleController.prototype.updateLayout = function(){
    var self = this
//    Math.seedrandom('layout-seed-'+self.props.layoutSeed);
    var ie8 = false;
    if (self.props.orientation == 'horizontal') {
        $(self.itemSelector, self.el).removeClass('hide');
    }

    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
        var ieversion = new Number(RegExp.$1)
        if (ieversion < 9) {
            ie8 = true;
            $('.rotate').css('display', 'none');
        }
    }

    var viewportSize = self.getViewportSize()
        , rangeX = viewportSize.width
//        , rangeY = viewportSize.height
        , rangeY
        , containerHeight = 0
        , buttonTop = 0
        , decoration = (ie8 == true) ? 'none' : self.props.imageDecoration
        , itemsCount = self.items.length
        , rowWidth = Math.floor((rangeX - 180)/270) || 1
        , border = self.props.borderWidth
        , scalingFactor = (viewportSize.width - 230 > 270) ? 1 : Math.max((viewportSize.width - 230)/270, 0.5)
        , elementSize = Math.floor(270 * scalingFactor)
        , inRotate = false
        , pinch = false
        , dragDisabled = false

    self.elementSize = elementSize;
    rangeY = (self.isMobile && self.props.orientation == 'vertical') ? self.elementSize * (self.itemsInViewport+1) : viewportSize.height

    if(self.editMode == 'editor'){
        $('.item').removeClass('active');
        self.activeIndex = null;
    }

    if(!self.isMobile && self.props.orientation == 'vertical'){
        if ( (self.props.imageDecoration == 'none' || self.props.imageDecoration == 'vintageFrame') && self.props.cropAndFitStage == 'fit' ){
            Wix.setHeight((Math.ceil(itemsCount/rowWidth)+0.5)*elementSize);
        }
        else {
            Wix.setHeight((Math.ceil(itemsCount/rowWidth)+0.9)*elementSize);
        }
    }
    else if(!self.isMobile && self.props.orientation == 'horizontal'){
        self.preservedHeight = (self.editMode == 'site') ? self.containerHeight : self.preservedHeight;
//        Wix.reportHeightChange(self.preservedHeight);
        Wix.setHeight(self.preservedHeight);
        self.containerHeight = self.preservedHeight;
        }

//    Math.seedrandom('layout-seed-'+self.props.layoutSeed);

    var shuffled = self.shuffleIndexes()

    if ((self.props.imageDecoration == 'random') && (ie8 != true)) {
        var decorationsStack = ['none', 'polaroid', 'scotchTape', 'vintageFrame']
        var decorations = []
        for (var i = 0; i < itemsCount; i++) {
//            decorations.push(decorationsStack[Math.floor(Math.random()*4)])
            decorations.push(decorationsStack[Math.floor(self.random[i] * 4)])
        }
    }

    $(self.el).hammer()

    $(self.itemSelector, self.el).each(function(index){
		var el = $(this)
			, item = el.data('item')
            , itemImageWidth = 0
            , itemImageHeight = 0
            , elementRatio = 0
            , imageRatio = item.width/item.height
            , newItemImageWidth, newItemImageHeight
            , resize = 0
            , rotate = 0
            , degrees = 0
            , mobileDegrees = 0
            , newIndex = shuffled[index]
            , alpha = (self.props.applyRotationInLayout == true) ? 330 + Math.floor(self.random[shuffled[newIndex]]*60) : 0
            , pinchScale = 1
            , props = {}
            , mobileTopFix
            , mobileLeftFix

//        if( (alpha > -22.5) && (alpha < 22.5) ){
//
//        }
//        else if( (alpha > 22.5) && (alpha < 67.5) ){
//
//        }

        self.changeCursor(el,alpha)

        if(newIndex < self.itemsInViewport){
            el.removeClass('hide');
        }

        if( (self.props.imageDecoration == 'random') && (ie8 != true) ){
            decoration = decorations[index];
        }

            el.on('rotate', function(e){
                    if(index == self.activeIndex){
                        inRotate = true;
                        dragDisabled = true;
                        mobileDegrees = Math.floor(e.gesture.rotation);
                        self.rotate(el, alpha+mobileDegrees);
                    }
                })

                .on('pinch', function(e){

                    if(index == self.activeIndex){
                        pinch = true;
                        var touchTarget = e.gesture.target;

                        for (var i=0; i<e.gesture.touches.length; i++){
                            if (e.gesture.touches[i].target != touchTarget){
                                pinch = false
                            }
                        }

                        if (pinch == true){
                            dragDisabled = true;
                            pinchScale = e.gesture.scale;

                            var dh = el.height()*(1-pinchScale)
                                , dw = el.width()*(1-pinchScale)

                            props.width = Math.floor(Math.max(75, el.width()*pinchScale));
                            props.height = Math.floor(Math.max(75*el.height()/el.width(), el.height()*pinchScale));
                            props.left = mobileLeftFix + Math.floor(dw/2);
                            props.top = mobileTopFix + Math.floor(dh/2);

                            $(this).css(props);
                            var mobileDecoration = (self.props.imageDecoration == 'random') ? decorations[index] : self.props.imageDecoration;
                            self.applyResizing(el,props,mobileDecoration)
                        }

                    }
                })

                .on('release', function(e){

                    if( (mobileDegrees != 0) && inRotate ){
                        inRotate = false;
                        alpha += mobileDegrees;
                    }
                    mobileDegrees = 0;

                    if(pinch){
                        var width = props.width
                            , height = props.height

                        pinch = false;
                        var mobileDecoration = (self.props.imageDecoration == 'random') ? decorations[index] : self.props.imageDecoration;
                        self.finalizeResizing(el,index,width,height,mobileDecoration)
                    }
                    dragDisabled = false;
                    mobileTopFix = el[0].offsetTop
                    mobileLeftFix = el[0].offsetLeft
                })

        switch (decoration) {
            case 'none':
                if (self.props.cropAndFitStage == 'crop') {
                    itemImageWidth = elementSize
                    itemImageHeight = elementSize
                } else if (item.width > item.height) {
                    itemImageWidth = elementSize
                    itemImageHeight = Math.floor(elementSize / imageRatio)
                } else {
                    itemImageWidth = Math.floor(elementSize * imageRatio)
                    itemImageHeight = elementSize
                }
                el.width(itemImageWidth + border * 2).height(itemImageHeight + border * 2)
                $('.filler', el).css({
                    backgroundSize: 'cover',
                    border: self.props.borderWidth + 'px solid ' + utils.hexToRgba(self.props.borderColor, self.props.alphaBorderColor)
                })
                $('.overlay', el).attr('class', 'overlay hide')
//                el.css('background-color', self.props.borderColor)
//                el.css('background', utils.hexToRgba(self.props.borderColor, self.props.alphaBorderColor))

                break;

            case 'polaroid':

                el.width(elementSize).height(Math.floor(elementSize*31/27))

                el.css('background-color', '#F9F9F9')

                $('.border', el).removeClass('sloppy').css({
                    backgroundColor: utils.hexToRgba(self.props.borderColor || '#000000', self.props.alphaBorderColor || 0.5),
                    backgroundSize: 'cover',
                    top: Math.floor(20 * scalingFactor) + 'px',
                    left: Math.floor(20 * scalingFactor) + 'px',
                    right: Math.floor(20 * scalingFactor) + 'px',
                    bottom: Math.floor(60 * scalingFactor) + 'px'
                })

                $('.filler', el).css({
                    backgroundSize: 'cover',
                    top: Math.floor(20 * scalingFactor) + border +'px',
                    left: Math.floor(20 * scalingFactor) + border + 'px',
                    right: Math.floor(20 * scalingFactor) + border + 'px',
                    bottom: Math.floor(60 * scalingFactor) + border + 'px'
                })

                el.addClass('dropShadow')

                $('.overlay', el).attr('class','overlay hide')

//                itemImageWidth = 230 - self.props.borderWidth*2
//                itemImageHeight = 230 - self.props.borderWidth*2
                itemImageWidth = elementSize - 40 - self.props.borderWidth*2
                itemImageHeight = elementSize - 40 - self.props.borderWidth*2

                break;

            case 'scotchTape':

                itemImageWidth = elementSize
                itemImageHeight = elementSize
                el.width(itemImageWidth+border*2).height(itemImageHeight+border*2)
//                el.width(270).height(270)

                $('.filler', el).css({
                    backgroundSize: 'cover',
                    border: self.props.borderWidth + 'px solid ' + utils.hexToRgba(self.props.borderColor, self.props.alphaBorderColor)
//                    backgroundSize: 'cover',
//                    top: 20 +'px',
//                    left: 20 + 'px',
//                    right: 20 + 'px',
//                    bottom: 20 + 'px'
                })

//                var typeOfTape = Math.ceil(Math.random()*3)
                var typeOfTape = Math.abs(alpha)%3 + 1;
                $('.overlay', el).attr('class','overlay ductTape'+typeOfTape).width(elementSize+border*2).height(elementSize+border*2)
//                el.css('background', utils.hexToRgba(self.props.borderColor, self.props.alphaBorderColor))

                break;

            case 'vintageFrame':

                var frameWidth
                    , frameHeight

                if (self.props.cropAndFitStage == 'crop') {
                    itemImageWidth = elementSize
                    itemImageHeight = elementSize
                }
//                else {
//                    itemImageWidth = item.width
//                    itemImageHeight = item.height
//                }
                else if (item.width > item.height) {
                    itemImageWidth = elementSize
                    itemImageHeight = Math.floor(elementSize / imageRatio)
                } else {
                    itemImageWidth = Math.floor(elementSize * imageRatio)
                    itemImageHeight = elementSize
                }
//                frameWidth = Math.floor(itemImageWidth * 1.1 + border*2)
//                frameHeight = Math.floor(itemImageHeight * 1.2 + border*2)

                frameWidth = Math.floor(itemImageWidth * 1.07)
                frameHeight = Math.floor(itemImageHeight * 1.08)

                el.width(frameWidth + border*2).height(frameHeight + border*2)

                $('.overlay', el).attr('class','overlay hide')
                $('.border', el).addClass('sloppy').css({
//                    backgroundSize: 'cover',
                    width: frameWidth + 'px',
                    height: frameHeight + 'px',
                    border: self.props.borderWidth + 'px solid ' + utils.hexToRgba(self.props.borderColor, self.props.alphaBorderColor)
                })
//                el.css('background-color','transparent');
//                el.css('background', utils.hexToRgba(self.props.borderColor, self.props.alphaBorderColor))

                $('.filler', el).css({
                    backgroundSize: 'cover',
//                    top: 4.1 +'%',
//                    left: 2.5 +'%',
//                    right: 3.5 +'%',
//                    bottom: 3.8 +'%'
                    top: border + Math.floor(itemImageHeight * 0.036) + 'px',
                    left: border + Math.floor(itemImageWidth * 0.029) + 'px',
                    right: border + Math.floor(itemImageWidth * 0.034) + 'px',
                    bottom: border + Math.floor(itemImageHeight * 0.04) + 'px'
                })

                break;

            case 'vintageFilter':
                if (self.props.cropAndFitStage == 'crop') {
                    itemImageWidth = elementSize
                    itemImageHeight = elementSize
                } else if (item.width > item.height) {
                    itemImageWidth = elementSize
                    itemImageHeight = Math.floor(elementSize / imageRatio)
                } else {
                    itemImageWidth = Math.floor(elementSize * imageRatio)
                    itemImageHeight = elementSize
                }
                el.width(itemImageWidth).height(itemImageHeight)
                $('.caman', el).width(itemImageWidth).height(itemImageHeight)
//                $('.caman', el).attr('src', imageUri)

//                $('.filler', el).css('backgroundSize', 'cover')
                $('.overlay', el).attr('class','overlay hide')
//                $('.caman', el).removeClass('hide')

                break;

            case 'random':
                break;
        }

        var imageUri = utils.getResizedImageUrl(item.uri, itemImageWidth, itemImageHeight, {siteQuality: self.quality, maxWidth: item.width, maxHeight: item.height})
        if (decoration == 'vintageFilter') {
            var vintageImage;
            var opts = {
                store: false
            };
//            imageUri = 'http://127.0.0.1/wix/index.php?entropy='+(new Date()).getTime()+'&imgUri=' + imageUri;
            imageUri = 'http://127.0.0.1/wix/index.php?imgUri=' + imageUri;
        }


        if (self.props.orientation == 'horizontal'){
            el.css({
                position: 'absolute',
                top: Math.floor(self.random[index] * (rangeY -el.height()*1.4) + el.height()*0.2) +'px',
                left: Math.floor(self.random[shuffled[index]] * (rangeX - el.width()*1.3) + el.width()*0.15) +'px'
            });
        }
        else {
            var row = Math.floor(newIndex/rowWidth)
                , offsetX = Math.floor(el.width()*0.1)
                , offsetY = Math.floor(el.height()*0.1)
                , x, y


            y = Math.floor(row * elementSize + el.height()*0.3 + self.random[index]*2*offsetY);
//            x = Math.floor((newIndex % rowWidth) * el.width() + (rangeX - el.width()*0.3 - rowWidth*el.width())/2 + self.random[index]*3*offsetX); // original
            x = Math.floor((newIndex % rowWidth) * ((rangeX-100)/rowWidth) + (rangeX-100-rowWidth*el.width())/rowWidth*self.random[index])+50

            el.css({
                position: 'absolute',
                top: y +'px',
                left: x +'px'
            });

            if (!self.isMobile && (y + el.height() * 1.5 > containerHeight)) {
                containerHeight = Math.floor(y + el.height() * 1.5);
            } else if ((newIndex < self.itemsInViewport) && (y + el.height() * 1.5 > containerHeight)) {
                containerHeight = Math.floor(y + el.height() * 1.5);
                buttonTop = Math.floor(y + el.height() * 1.3)
            }

            if (self.itemsInViewport == self.items.length) {
                $('.show-more').addClass('hide');
            } else {
                $('.show-more').css({
                    top: buttonTop + 'px',
                    left: Math.floor((viewportSize.width - 150) / 2) + 'px'
                })
            }
        }

        self.rotate(el,alpha);
        $('.filler', el).css({
            backgroundImage: 'url('+ imageUri +')'
        })
        if(decoration == 'vintageFilter'){
            $('.caman', el).removeClass('hide')
            $('.filler', el).addClass('hide')


//  LOADING LOCAL IMAGES FOR TEST
//            imageUri = 'img/' + index + '.jpg'
//            $('.caman', el).attr('src', imageUri)

            $.ajax({
                url: imageUri,
                type: 'get',
                dataType:'text',
                success: function(data, status, xhr){
//                    console.log(imageUri);
                    $('.caman', el).attr('src', 'data:image/jpeg;base64,'+data);
                    vintageImage = Filtrr2($('#caman-'+index), function (){
                        this.brighten(20)
                            .saturate(-50)
                            .contrast(20)
                            .expose(0.6)
                            .render();
                    }, opts)
                },
                error: function(e){
                    console.log(e)
                }
            })
//            Caman('#caman-'+index, function () {
////            Caman('#caman-2', function () {
////                this.brightness(-40);
////                this.contrast(20);
////                this.render(function () {
////                    console.log(index+" Done!");
////                });
//                this.brightness(10);
//                this.newLayer(function () {
//                    this.setBlendingMode("multiply");
//                    this.opacity(80);
//                    this.copyParent();
//                    this.filter.gamma(0.8);
//                    this.filter.contrast(50);
//                    this.filter.exposure(10);
//                })
//
//                this.newLayer(function(){
//                    this.setBlendingMode("softLight");
//                    this.opacity(80);
//                    this.fillColor("#f49600");
////                    this.filter.exposure(20);
////                    this.filter.gamma(0.8);
//                })
//                this.exposure(20);
//                this.gamma(0.8);
//                this.render();
//
////                @brightness 10
////
////                @newLayer ->
////                @setBlendingMode "multiply"
////                @opacity 80
////                @copyParent()
////
////                @filter.gamma 0.8
////                @filter.contrast 50
////                @filter.exposure 10
////
////                @newLayer ->
////                @setBlendingMode "softLight"
////                @opacity 80
////                @fillColor "#f49600"
////
////                @exposure 20
////                @gamma 0.8
//
//            });

//            $('.caman', el).attr('src', imageUri).attr('data-caman', 'saturation(-90) brightness(50)')
        }
        else {
            $('.caman', el).addClass('hide')
            $('.caman', el).removeAttr('data-caman')
            $('.filler', el).removeClass('hide')
        }

        mobileTopFix = el[0].offsetTop
        mobileLeftFix = el[0].offsetLeft

//        var props = {}
        var topFix = 0
            , leftFix = 0

        var inDrag = false;
        var dragTarget
        var dragMeta = {}
        var handleClass

        el.drag("start", function( ev){
            inDrag = true
            dragTarget = ev.target

            dragMeta = {
                attr: $( ev.target ).prop("className"),
                width: el.width(),
                height: el.height()
            }

            elementRatio = el.width()/el.height();

            topFix = el[0].offsetTop
            leftFix = el[0].offsetLeft
//            decoration = (self.props.imageDecoration == 'random') ? decorations[self.activeIndex] : self.props.imageDecoration;
            if (ie8 != true){
                decoration = (self.props.imageDecoration == 'random') ? decorations[index] : self.props.imageDecoration;
            }
            else {
                decoration = 'none';
            }

            handleClass = dragMeta.attr
            self.changeElCursor(handleClass,alpha)

        })

            .drag(function( ev , eventMeta){
//                if (!inDrag || dragTarget != ev.target) return
                var dx = 0
                    , dy = 0
                    , dh = 0
                    , dw = 0
                    , centerX = 0
                    , centerY = 0
                eventMeta = $.extend({}, dragMeta, eventMeta || {})
                switch (eventMeta.attr){

                    case 'rotate NE':

                        var beta = Math.atan(el.height()/el.width())
//                        newItemImageWidth = Math.max( 100, dd.width + Math.floor(dd.deltaX * Math.cos(alpha*Math.PI/180) + dd.deltaY * Math.sin(alpha*Math.PI/180)));
//                        newItemImageHeight = Math.floor(newItemImageWidth/elementRatio);
//
//                        if( newItemImageHeight > (dd.height + dd.deltaX * Math.sin(alpha*Math.PI/180) - dd.deltaY * Math.cos(alpha*Math.PI/180)) ){
//                            newItemImageHeight = Math.max(100, Math.floor(dd.height + dd.deltaX * Math.sin(alpha*Math.PI/180) - dd.deltaY * Math.cos(alpha*Math.PI/180)));
//                            newItemImageWidth = Math.floor(newItemImageHeight * elementRatio);
//                        }
//
//                        dh = dd.height - newItemImageHeight
//                        dw = dd.width - newItemImageWidth
//                        props.top = Math.floor(topFix + 0.5*(dh*Math.cos((alpha)*Math.PI/180) - dw*Math.sin((alpha)*Math.PI/180) + dh));
//                        props.left = Math.floor(leftFix - 0.5*(dh*Math.sin((alpha)*Math.PI/180)+dw*Math.cos((alpha)*Math.PI/180)-dw));
//                        resize = true;
//                        rotate = false;
//                        dx = Math.floor(el.width()/2 + dd.deltaX * Math.cos(alpha*Math.PI/180) + dd.deltaY * Math.sin(alpha*Math.PI/180))
//                        dy = Math.floor(-dd.deltaX * Math.sin(alpha*Math.PI/180) + dd.deltaY * Math.cos(alpha*Math.PI/180))

                        var ddx = eventMeta.deltaX * Math.cos(alpha * Math.PI / 180) + eventMeta.deltaY * Math.sin(alpha * Math.PI / 180)
                        var ddy = -eventMeta.deltaX * Math.sin(alpha * Math.PI / 180) + eventMeta.deltaY * Math.cos(alpha * Math.PI / 180)
//                        dx = Math.floor( (el.width()/2 + dd.deltaX * Math.cos(alpha*Math.PI/180)) * Math.cos(beta) + (el.height()/2 - dd.deltaY * Math.sin(alpha*Math.PI/180)) * Math.sin(beta) )
//                        dx = Math.floor( (el.width()/2 + dd.deltaX)* Math.cos(beta) + (el.height()/2 - dd.deltaY) * Math.sin(beta) )
                        dx = Math.floor( (el.width()/2 + ddx + 15)* Math.cos(beta) + (el.height()/2 - ddy + 15) * Math.sin(beta) )
//                        dy = Math.floor( -dd.deltaY * Math.cos(alpha*Math.PI/180) * Math.cos(beta) - dd.deltaX * Math.sin(alpha*Math.PI/180) * Math.sin(beta) )
//                        dy = Math.floor( -dd.deltaY * Math.cos(beta) - dd.deltaX * Math.sin(beta) )
                        dy = Math.floor( -ddy * Math.cos(beta) - ddx * Math.sin(beta) )
                        degrees = (dx >= 0) ?  Math.floor(Math.atan(-dy/dx) * 180 / Math.PI) : Math.floor(180 + Math.atan(-dy/dx) * 180 / Math.PI)
                        rotate = true;
                        self.rotate(el,alpha+degrees);
//                        console.log(dx,dy)
                        break;

                    case 'handle SE':

                        newItemImageWidth = Math.max( 100, eventMeta.width + Math.floor(eventMeta.deltaX * Math.cos(alpha*Math.PI/180) + eventMeta.deltaY * Math.sin(alpha*Math.PI/180)));
                        newItemImageHeight = ( (decoration == 'none') && (self.props.cropAndFitStage == 'fit') ) ? Math.floor((newItemImageWidth-border*2)/imageRatio + border*2) :  Math.floor(newItemImageWidth/elementRatio);

                        if( newItemImageHeight > (eventMeta.height - eventMeta.deltaX * Math.sin(alpha*Math.PI/180) + eventMeta.deltaY * Math.cos(alpha*Math.PI/180)) ){
                            newItemImageHeight = Math.max(Math.ceil((100-border*2)/imageRatio + border*2), Math.floor(eventMeta.height - eventMeta.deltaX * Math.sin(alpha*Math.PI/180) + eventMeta.deltaY * Math.cos(alpha*Math.PI/180)));
                            newItemImageWidth = ( (decoration == 'none') && (self.props.cropAndFitStage == 'fit') ) ? Math.floor((newItemImageHeight-border*2) * imageRatio + border*2) : Math.floor(newItemImageHeight * elementRatio);
                        }

                        dh = eventMeta.height - newItemImageHeight
                        dw = eventMeta.width - newItemImageWidth
                        props.top = Math.floor(topFix - 0.5*(dw*Math.sin((alpha)*Math.PI/180) + dh*Math.cos((alpha)*Math.PI/180) - dh));
                        props.left = Math.floor(leftFix -0.5*(dw*Math.cos((alpha)*Math.PI/180)-dh*Math.sin((alpha)*Math.PI/180) - dw));
                        resize = true;
                        rotate = false;
                        break;

                    case 'handle NW':

                        newItemImageWidth = Math.max( 100, eventMeta.width - Math.floor(eventMeta.deltaX * Math.cos(alpha*Math.PI/180) + eventMeta.deltaY * Math.sin(alpha*Math.PI/180)));
                        newItemImageHeight = ( (decoration == 'none') && (self.props.cropAndFitStage == 'fit') ) ? Math.floor((newItemImageWidth-border*2)/imageRatio + border*2) : Math.floor(newItemImageWidth/elementRatio);

                        if( newItemImageHeight > (eventMeta.height + eventMeta.deltaX * Math.sin(alpha*Math.PI/180) - eventMeta.deltaY * Math.cos(alpha*Math.PI/180)) ){
                            newItemImageHeight = Math.max(Math.ceil((100-border*2)/imageRatio + border*2), Math.floor(eventMeta.height + eventMeta.deltaX * Math.sin(alpha*Math.PI/180) - eventMeta.deltaY * Math.cos(alpha*Math.PI/180)));
                            newItemImageWidth = ( (decoration == 'none') && (self.props.cropAndFitStage == 'fit') ) ? Math.floor((newItemImageHeight-border*2) * imageRatio + border*2) : Math.floor(newItemImageHeight * elementRatio);
                        }

                        dh = eventMeta.height - newItemImageHeight
                        dw = eventMeta.width - newItemImageWidth
                        props.top = Math.floor(topFix + 0.5*(dw*Math.sin((alpha)*Math.PI/180) + dh*Math.cos((alpha)*Math.PI/180) +dh));
                        props.left = Math.floor(leftFix - 0.5*(dh*Math.sin((alpha)*Math.PI/180)-dw*Math.cos((alpha)*Math.PI/180)-dw));
                        resize = true;
                        rotate = false;

                        break;

                    case 'handle SW':

                        newItemImageWidth = Math.max( 100, eventMeta.width - Math.floor(eventMeta.deltaX * Math.cos(alpha*Math.PI/180) + eventMeta.deltaY * Math.sin(alpha*Math.PI/180)));
                        newItemImageHeight = ( (decoration == 'none') && (self.props.cropAndFitStage == 'fit') ) ? Math.floor((newItemImageWidth-border*2)/imageRatio + border*2) : Math.floor(newItemImageWidth/elementRatio);

                        if( newItemImageHeight > (eventMeta.height - eventMeta.deltaX * Math.sin(alpha*Math.PI/180) + eventMeta.deltaY * Math.cos(alpha*Math.PI/180)) ){
                            newItemImageHeight = Math.max(Math.ceil((100-border*2)/imageRatio + border*2), Math.floor(eventMeta.height - eventMeta.deltaX * Math.sin(alpha*Math.PI/180) + eventMeta.deltaY * Math.cos(alpha*Math.PI/180)));
                            newItemImageWidth = ( (decoration == 'none') && (self.props.cropAndFitStage == 'fit') ) ? Math.floor((newItemImageHeight-border*2) * imageRatio + border*2) : Math.floor(newItemImageHeight * elementRatio);
                        }

                        dh = eventMeta.height - newItemImageHeight
                        dw = eventMeta.width - newItemImageWidth
                        props.top = Math.floor(topFix +  0.5*(dw*Math.sin((alpha)*Math.PI/180) - dh*Math.cos((alpha)*Math.PI/180) + dh));
                        props.left = Math.floor(leftFix + 0.5*(dw*Math.cos((alpha)*Math.PI/180) + dh*Math.sin((alpha)*Math.PI/180) + dw));
                        resize = true;
                        rotate = false;
                        break;

                    case 'rotate EE':

                        dx = Math.floor(el.width()/2 + eventMeta.deltaX * Math.cos(alpha*Math.PI/180) + eventMeta.deltaY * Math.sin(alpha*Math.PI/180))
                        dy = Math.floor(-eventMeta.deltaX * Math.sin(alpha*Math.PI/180) + eventMeta.deltaY * Math.cos(alpha*Math.PI/180))
                        degrees = (dx >= 0) ?  Math.floor(Math.atan(dy/dx) * 180 / Math.PI) : Math.floor(180 + Math.atan(dy/dx) * 180 / Math.PI)
                        rotate = true;
                        self.rotate(el,alpha+degrees);

                        break;

                    case 'rotate NN':

                        dx = Math.floor(el.height()/2 + eventMeta.deltaX * Math.sin(alpha*Math.PI/180) - eventMeta.deltaY * Math.cos(alpha*Math.PI/180))
                        dy = Math.floor(eventMeta.deltaX * Math.cos(alpha*Math.PI/180) + eventMeta.deltaY * Math.sin(alpha*Math.PI/180))
                        degrees = (dx >= 0) ?  Math.floor(Math.atan(dy/dx) * 180 / Math.PI) : Math.floor(180 + Math.atan(dy/dx) * 180 / Math.PI)
                        rotate = true;
                        self.rotate(el,alpha+degrees);

                        break;

                    case 'rotate WW':

                        dx = Math.floor(el.width()/2 - eventMeta.deltaX * Math.cos(alpha*Math.PI/180) - eventMeta.deltaY * Math.sin(alpha*Math.PI/180))
                        dy = Math.floor(-eventMeta.deltaX * Math.sin(alpha*Math.PI/180) + eventMeta.deltaY * Math.cos(alpha*Math.PI/180))
                        degrees = (dx >= 0) ?  Math.floor(-Math.atan(dy/dx) * 180 / Math.PI) : Math.floor(-180 - Math.atan(dy/dx) * 180 / Math.PI)
                        rotate = true;
                        self.rotate(el,alpha+degrees);

                        break;

                    case 'rotate SS':

                        dx = Math.floor(el.height()/2 - eventMeta.deltaX * Math.sin(alpha*Math.PI/180) + eventMeta.deltaY * Math.cos(alpha*Math.PI/180))
                        dy = Math.floor(-eventMeta.deltaX * Math.cos(alpha*Math.PI/180) - eventMeta.deltaY * Math.sin(alpha*Math.PI/180))
                        degrees = (dx >= 0) ?  Math.floor(Math.atan(dy/dx) * 180 / Math.PI) : Math.floor(180 + Math.atan(dy/dx) * 180 / Math.PI)
                        rotate = true;
                        self.rotate(el,alpha+degrees);

                        break;

                    default:

                        if(!dragDisabled){
                            rangeY = (self.isMobile) ? self.containerHeight : rangeY;

//                            props.top = topFix + eventMeta.deltaY;
//                            props.left = leftFix + eventMeta.deltaX;

                            props.top = ( (topFix + eventMeta.deltaY + el.height()/2 > 0) && (topFix + eventMeta.deltaY + el.height()/2 < rangeY) ) ? topFix + eventMeta.deltaY : props.top;
                            props.left = ( (leftFix + eventMeta.deltaX + el.width()/2 > 0) && (leftFix + eventMeta.deltaX + el.width()/2 < rangeX) ) ? leftFix + eventMeta.deltaX : props.left;
                            centerX = props.left + el.width()/2
                            centerY = props.top + el.height()/2

                            newItemImageWidth = el.width();
                            newItemImageHeight = el.height();

                            resize = false;
                            rotate = false;
                            self.nodrag = false
                            mobileTopFix = el[0].offsetTop
                            mobileLeftFix = el[0].offsetLeft
                        }

                        break;
                }

                props.width = newItemImageWidth;
                props.height = newItemImageHeight;
                $(this).css(props);

                self.applyResizing(el,props,decoration)
            })

            .drag("end", function (ev) {
                $(self.el).css('cursor', 'auto')
                inDrag = false
                self.nodrag = self.isMobile;
                dragTarget = null
                dragMeta = {}
                if (resize) {
                    self.finalizeResizing(el, index, newItemImageWidth, newItemImageHeight, decoration)
                }

                if (rotate) {
                    if ((alpha + degrees) % 360 > 180) {
                        alpha = (alpha + degrees - 360) % 360
                    }
                    else if ((alpha + degrees) % 360 < -180) {
                        alpha = (alpha + degrees + 360) % 360
                    }
                    else {
                        alpha = (alpha + degrees) % 360
                    }
                    self.changeCursor(el, alpha)
                }
            });

        })

//    Caman('#caman-2', function () {
//        this.brightness(50);
//        this.contrast(20);
//        this.render(function () {
//            console.log("Done!");
//        });
//    });

//    console.log(self.props)
    if (self.props.orientation == 'vertical') {
        self.containerHeight = containerHeight
        if (self.isMobile) {
            self.updated = true;
//            Wix.reportHeightChange(containerHeight);
            Wix.setHeight(containerHeight);
        }
    }
    if (self.isMobile) {
        $(self.el).css({touchAction: 'auto'});
    }
}

FreestyleController.prototype.applyResizing = function(el,props,decoration){

    var self = this
        , width = props.width
        , height = props.height
        , border = self.props.borderWidth

    $('.overlay', el).width(width).height(height)
    $('.caman', el).width(width).height(height)

    if(decoration == 'vintageFrame'){
        $('.filler', el).css({
            top: border + Math.floor(height * 0.034) + 'px',
            left: border +  Math.floor(width * 0.027) - 1 + 'px',
            right: border + Math.floor(width * 0.032) + 'px',
            bottom: border + Math.floor(height * 0.038) + 'px'
        })

        $('.border', el).css({
            width: Math.floor(width-border*2) + 'px',
            height: height-border*2 + 'px'
        })
    }
    else if(decoration == 'polaroid'){
        $('.border', el).css({
            top: Math.floor(20 * el.width()/270) + 'px',
            left: Math.floor(20 * el.width()/270) + 'px',
            right: Math.floor(20 * el.width()/270) + 'px',
            bottom: Math.floor(60 * el.width()/270) + 'px'
        })

        $('.filler', el).css({
            backgroundSize: 'cover',
            top: Math.floor(20 * el.width()/270) + border +'px',
            left: Math.floor(20 * el.width()/270) + border + 'px',
            right: Math.floor(20 * el.width()/270) + border + 'px',
            bottom: Math.floor(60 * el.width()/270) + border + 'px'
        })
    }
}

FreestyleController.prototype.finalizeResizing = function(el,index,width,height,decoration){

    var self = this
        , item =  self.items[index]
        , uri = item.uri
        , imageUri
        , border = self.props.borderWidth
        , finalWidth
        , finalHeight;

    switch (decoration){
        case 'none':
            if ((width - border * 2 > self.items[index].width) || (height - border * 2 > self.items[index].height)) {
                if (self.props.cropAndFitStage == 'crop') {
                    finalWidth = Math.min(self.items[index].width, self.items[index].height);
                    finalHeight = Math.min(self.items[index].width, self.items[index].height);
                } else {
                    finalWidth = self.items[index].width;
                    finalHeight = self.items[index].height;
                }
            } else {
                finalWidth = width - border * 2;
                finalHeight = height - border * 2;
            }
            break;

        case 'polaroid':
            finalWidth = width - Math.floor(width / 270 * 80 - border * 2);
            finalHeight = width - Math.floor(width / 270 * 80 - border * 2);
            break;

        case 'scotchTape':
            if ((width - border * 2 > self.items[index].width) || (height - border * 2 > self.items[index].height)) {
                finalWidth = Math.min(self.items[index].width, self.items[index].height);
                finalWidth = Math.min(self.items[index].width, self.items[index].height);
            } else {
                finalWidth = width - border * 2;
                finalHeight = width - border * 2;
            }
            break;

        case 'vintageFrame':
            finalWidth = width-border*2;
            finalHeight = height-border*2;

            $('.border', el).css({
                width: Math.floor(width-border*2) + 'px',
                height: height-border*2 + 'px'
            })
            el.css('width', Math.floor(width)+'px');
            break;
    }

    imageUri = utils.getResizedImageUrl(uri, finalWidth, finalHeight, {siteQuality: self.quality, maxWidth: item.width, maxHeight: item.height});

    $('.filler', el).css({
        backgroundImage: 'url('+ imageUri +')',
        backgroundSize: 'cover'
    })
}


FreestyleController.prototype.changeEditMode = function(){
    var self = this
    if (self.editMode == 'editor'){
        self.updateLayout();
    }
}

FreestyleController.prototype.updateSettings = function(config){
	var self = this
        , recreate = true;
    self.mainPageId = config.mainPageId;
    self.quality = config.quality || {}

    if (self.itemsChanged(config.items, ['uri'])) {
        recreate = true;
    } else if (self.propsChanged(config.props, ['cropAndFitStage', 'imageDecoration', 'layoutSeed', 'orientation'])) {
        recreate = true;
        self.updated = false;
    }

    if (self.propsChanged(config.props, ['applyRotationInLayout'])) {
        self.firstLoad = false;
    }

    if (recreate) {
        self.destroy();
        self.items = config.items || []
        self.props = config.props || {}
        self.createDom();
    } else {
        _.extend(self.props, config.props);
    }

//	self.props.layoutSeed = config.props.layoutSeed // || JSON.stringify(config.props);
//    console.log(config.props)
    self.updateLayout();

}

FreestyleController.prototype.destroy = function(){
	this.el.html('');
}

FreestyleController.prototype._resize = function(){
    var self = this;
    var viewportSize = self.getViewportSize();
//	self.override();

    if ((self.props.orientation == 'horizontal')){
//        self.containerHeight = viewportSize.height;

        self.preservedHeight = viewportSize.height;
        self.el.height(self.preservedHeight);
    } else {
        self.el.height(self.containerHeight);
    }
    if(!self.updated == true){
        self.updateLayout();
    }
}

FreestyleController.prototype.getViewportSize = function(){
	var html = document.documentElement;
	return {
		width: html.clientWidth,
		height: html.clientHeight
	}
}

FreestyleController.prototype.zoomClosed = function(){
}

FreestyleController.prototype.rotate = function(el,degrees){

//    el[0].style.filter = "\"progid:DXImageTransform.Microsoft.Matrix(M11=" + Math.cos(Math.PI/180*degrees) + ", M12=" + (-1)*Math.sin(Math.PI/180*degrees) + ", M21=" + Math.sin(Math.PI/180*degrees) + ", M22=" + Math.cos(Math.PI/180*degrees) + ", SizingMethod='auto expand')\";"
//
//    var fltr = el[0].filters.item('DXImageTransform.Microsoft.Matrix');
//    fltr.M11 = Math.cos(Math.PI/180*degrees)
//    fltr.M12 = (-1)*Math.sin(Math.PI/180*degrees)
//    fltr.M21 = Math.sin(Math.PI/180*degrees)
//    fltr.M22 = Math.cos(Math.PI/180*degrees)
//
//    console.log(degrees)
//    return;
    el.css({
        '-webkit-transform': 'rotate(' + degrees + 'deg)',
        '-webkit-transform-origin:': 'center center',
        '-moz-transform': 'rotate(' + degrees + 'deg)',
        '-moz-transform-origin:': 'center center',
        '-ms-transform': 'rotate(' + degrees + 'deg)',
        '-ms-transform-origin:': 'center center',
        'transform': 'rotate(' + degrees + 'deg)',
        'transform-origin:': 'center center'
//                'filter': "\"progid:DXImageTransform.Microsoft.Matrix(M11=" + Math.cos(Math.PI/180*degrees) + ", M12=" + (-1)*Math.sin(Math.PI/180*degrees) + ", M21=" + Math.sin(Math.PI/180*degrees) + ", M22=" + Math.cos(Math.PI/180*degrees) + ")\";"
    });
}

FreestyleController.prototype.changeCursor = function(el,alpha){
    if (((alpha + 180) % 180 > 22.5) && ((alpha + 180) % 180 < 67.5)) {     // 45
        $('.NW,.SE', el).css('cursor', 'url(css/Arrow-Vertical-W2.png) 6 14, auto');
        $('.SW', el).css('cursor', 'url(css/Arrow-Horizontal-W2.png) 14 6, auto');
    }
    else if (((alpha + 180) % 180 > 67.5) && ((alpha + 180) % 180 < 112.5)) {    // 90
        $('.NW,.SE', el).css('cursor', 'url(css/Arrow-FLIP_1-W2.png) 11 11, auto');
        $('.SW', el).css('cursor', 'url(css/Arrow-FLIP_2-W2.png) 11 11, auto');
    }
    else if (((alpha + 180) % 180 > 112.5) && ((alpha + 180) % 180 < 157.5)) {      //135
        $('.NW,.SE', el).css('cursor', 'url(css/Arrow-Horizontal-W2.png) 14 6, auto');
        $('.SW', el).css('cursor', 'url(css/Arrow-Vertical-W2.png) 6 14, auto');
    }
    else {                                                           // 0 || 180
        $('.NW,.SE', el).css('cursor', 'url(css/Arrow-FLIP_2-W2.png) 11 11, auto');
        $('.SW', el).css('cursor', 'url(css/Arrow-FLIP_1-W2.png) 11 11, auto');
    }
}

FreestyleController.prototype.changeElCursor = function(handleClass,alpha){
    var self = this;

    if(handleClass == 'handle SE' || handleClass == 'handle NW'){
        if( ((alpha+180)%180>22.5) && ((alpha+180)%180<67.5) ){
            $(self.el).css('cursor','url(css/Arrow-Vertical-W2.png) 6 14, auto')
        }
        else if( ((alpha+180)%180>67.5) && ((alpha+180)%180<112.5) ){
            $(self.el).css('cursor','url(css/Arrow-FLIP_1-W2.png) 11 11, auto');
        }
        else if( ((alpha+180)%180>112.5) && ((alpha+180)%180<157.5) ){
            $(self.el).css('cursor','url(css/Arrow-Horizontal-W2.png) 14 6, auto');
        }
        else {
            $(self.el).css('cursor','url(css/Arrow-FLIP_2-W2.png) 11 11, auto');
        }
    }
    else if (handleClass == 'handle SW'){
        if( ((alpha+180)%180>22.5) && ((alpha+180)%180<67.5) ){
            $(self.el).css('cursor','url(css/Arrow-Horizontal-W2.png) 14 6, auto');
        }
        else if( ((alpha+180)%180>67.5) && ((alpha+180)%180<112.5) ){
            $(self.el).css('cursor','url(css/Arrow-FLIP_2-W2.png) 11 11, auto');
        }
        else if( ((alpha+180)%180>112.5) && ((alpha+180)%180<157.5) ){
            $(self.el).css('cursor','url(css/Arrow-Vertical-W2.png) 6 14, auto');
        }
        else {
            $(self.el).css('cursor','url(css/Arrow-FLIP_1-W2.png) 11 11, auto');
        }
    }
}
