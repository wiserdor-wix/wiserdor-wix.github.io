console.log('App loaded')
var BookGalleryController = function (element, config) {
	var self = this;
	self.itemClass = 'item';
	self.itemSelector = '.'+self.itemClass;

	self.items = []
	self.props = {}

	this.resize = _.debounce(_.bind(this._resize, this), 200);

	// NOTE: calling super (parent) constructor
	BookGalleryController.super_.apply(this, arguments)

	$(self.el).on('click', '.page', function(e){

	});
}
utils.inherits(BookGalleryController, SimpleAppProto);

BookGalleryController.prototype.updateLayout = function(){
	var self = this
    console.log("updateLayout")
    $('#imagesList').pageFlipper({
        fps: 20,
        easing: 0.15,
        backgroundColor: 'black'
    });

//    $('.canvasHolder').css('left', 20 + 'px');
    $('#mouse').css({
        width: 20 + 'px',
        height: 20 + 'px',
        '-moz-border-radius': 10 + 'px',
        '-webkit-border-radius': 10 + 'px'
    });



}

BookGalleryController.prototype.updateSettings = function(config){
    console.log("updateSettings")

    var self = this
        , recreate = false
//    console.log(self.props)

    if (self.itemsChanged(config.items, ['uri'])){
        recreate = true;
    }
    else if (self.propsChanged(config.props, ['flipOrientation'])){
        recreate = true;
    }

    if (recreate){
        self.destroy();
        self.items = config.items || []
        self.props = config.props || {}
        self.createDom();
    } else {
        _.extend(self.props, config.props);
    }

    $(self.el).css('text-align', self.props.alignText);


    self.updateLayout();
//	$('<pre></pre>').appendTo(this.el).html(JSON.stringify(config, null, 2));
}

BookGalleryController.prototype.createDom = function(){
		console.log("createDom")

		var self = this
			, viewportSize = self.getViewportSize()
			, shadow = 85

		self.el.html('');
		self.displayNode = $('<div id="container"></div>').appendTo(this.el);
	  var imagesList = $('<ul id="imagesList"></ul>').appendTo(self.displayNode);
		var imageSize = {height : Math.floor(viewportSize.height-50), width : Math.floor(viewportSize.width/2)};
		console.log(imageSize.width, imageSize.height)
			_.each(this.items, function(item, index){
	//		var itemNode = $('<div class="pager"></div>').appendTo(self.displayNode);
	      var imageUri = utils.getResizedImageUrl(item.uri, imageSize.width, imageSize.height)
				var itemNode = $('<div class="content"><li><img src="' + imageUri + '"></li></div>').appendTo(imagesList);
				itemNode.data('item', item).addClass(self.itemClass);

				$('<div class="flip"></div>').appendTo(itemNode);
				var itemInfo = $('<div class="details"></div>').appendTo(itemNode).addClass('hide');
				$('<h3 class="title"></h3>').appendTo(itemInfo).html(item.title).addClass('hide');
		});
		$('<div class="shadow"></div>').appendTo(self.displayNode)
			.css('left', viewportSize.width/2-shadow)
			.css('height', viewportSize.height);
//	$(self.el).css('text-align', self.props.alignText);
//	$('.flip, .title, .details').wrapAll('<div class="pageObject">').appendTo(self.displayNode);

}

BookGalleryController.prototype.itemClick = function (item, index, e) {
    var self = this;
    switch (self.props.galleryImageOnClickAction) {
        case "goToLink":
            self.openLink(item.href, e.target, item.linkType, e, undefined, undefined, item.link);
            break;
        case "zoomMode":
            Wix.pushState(JSON.stringify({cmd: 'zoom', args: [index]}));
            break;
        case 'disabled':
        default:
            Wix.pushState(JSON.stringify({cmd: 'itemClicked', args: [index]}));
            break;
    }
}

BookGalleryController.prototype._resize = function () {
    console.log('resize')
    var self           = this
        , viewportSize = self.getViewportSize()

    // if (true) {
        $(self.el)
            .width(viewportSize.width)
            .height(viewportSize.height)
    // } else {
    //     self.updateLayout()
    // }
}

BookGalleryController.prototype.getViewportSize = function () {
    var html = document.documentElement;
    return {
        width: html.clientWidth,
        height: html.clientHeight
    }
}

BookGalleryController.prototype.destroy = function () {
    this.el.html('');
}
