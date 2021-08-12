var MasonryController = function (element, config) {
	var self = this;
	this.resize = _.debounce(_.bind(this._resize, this), 200);
	this.shouldEnableSettingHeight = false;

	// NOTE: calling super (parent) constructor
	MasonryController.super_.apply(this, arguments)


	this.itemClass = 'item';
	this.itemSelector = '.' + this.itemClass;
	this.itemsInSlice = 6;
	this.editMode = false;

	this.init(config);

	$(this.el).on('click', '.'+this.itemClass, function(e){
		var itemIndex = $(e.currentTarget).index()-1; // -1 is because we always have a grid-sizer in the same controller as first element
		self.itemClick(self.items[itemIndex], itemIndex, e.target, e);
	});
}
utils.inherits(MasonryController, SimpleAppProto);

MasonryController.prototype.itemClick = function(item, index, sourceElement, e){
//	if (this.props.expandEnabled){
	switch(this.props.galleryImageOnClickAction)
	{
		case "zoomMode":
			Wix.pushState(JSON.stringify({cmd:'zoom', args:[index]}));
			break;

		case "goToLink":
			this.openLink(item.href, item.target, item.linkType, e, item["data-anchor"], this.mainPageId, item.link);
			break;
		default:
            Wix.pushState(JSON.stringify({cmd: 'itemClicked', args: [index]}));
            break;
	}
	return false;
//	}
}

MasonryController.prototype.itemTemplate = _.template('<div class="<%=itemClass%>"><div class="overlay"></div><img src="<%=img.src%>"><% if(description || title) {  %><div class="sb-description"><% if(title) { %><h3 class="title" title="<%=title%>"><%=title%></h3><% } %><% if(description) { %><div class="desc"><%=description%></div><% } %></div><% } %></div>');

MasonryController.prototype.init = function(config){
	this.items = config.items || []
	this.props = config.props || {}
	this.gutterSize = this.props.margin;
	this.columnsCount = Math.min(this.props.numCols, this.items.length);
	this.el.html('<div class="grid-sizer"></div>');

	this.gridSizer = $('.grid-sizer');
	this.createDom();
	this.createLayout();
	this.calculateLayoutSizes();
	this.updateLayout();
	this._resize();
}

MasonryController.prototype.zoomClosed = function () {
	return;
}

MasonryController.prototype._resize = function () {
	this.calculateLayoutSizes();
	this.updateLayout();
	$('.show-more').css('top', this.el.height());
	if (this.shouldEnableSettingHeight) {
		Wix.setHeight(this.el.height() + $('.show-more', this.el).outerHeight());
	}
}

MasonryController.prototype.destroy = function () {
	this.msnry.destroy();
//	this.el.html('<div class="grid-sizer"></div>');
}

MasonryController.prototype.createDom = function () {
	var self = this;
	this.el.html('<div class="grid-sizer"></div>');
	this.calculateLayoutSizes();
	var fragment = document.createDocumentFragment();

	var itemsToShow = this.items.length;
	if (this.deviceType == 'mobile'){
		itemsToShow = Math.min(this.items.length, this.itemsInSlice);
	}

	this.itemsInViewport = itemsToShow;

	for (var i=0; i<itemsToShow; i++){
		var item = this.items[i];
		fragment.appendChild(self.createSingleItem(item, i));
	}

	this.el.append(fragment);

	if (this.itemsInViewport < this.items.length){
		$('<div class="show-more">Show More</div>').appendTo(this.el).click(_.bind(this.displayMore,this));

		$('.show-more').css('color',this.props.textButtonColor || '#4A4A4A');
	}
}

MasonryController.prototype.displayMore = function(){
	var newLimit = Math.min(this.items.length, this.itemsInViewport + this.itemsInSlice);

	for (var i=this.itemsInViewport; i<newLimit; i++){
		var item = this.items[i];
		var node = this.createSingleItem(item, i);
		this.el.append(node);
		this.msnry.appended(node);
	}

	this.itemsInViewport = newLimit;

	if (this.itemsInViewport >= this.items.length){
		$('.show-more', this.el).remove();
	} else {
		$('.show-more', this.el).appendTo(this.el);
	}
	this.resize();
}

MasonryController.prototype.createLayout = function () {
	var self = this;
	var props = {
		columnWidth: '.grid-sizer',
		itemSelector: '.' + this.itemClass,
		gutter: this.gutterSize,
		isResizeBound: false
	};
//	p = _.clone(App.props);i = _.clone(App.items); App.margin=25; App.updateSettings({items:i,props:p})

	this.msnry = new Masonry(this.el[0], props);
}

MasonryController.prototype.updateSettings = function(config){
	var itemPropertiesChangingLayout = ['uri', 'title', 'description']
	var recreate = false;
	this.mainPageId = config.mainPageId;
	this.shouldEnableSettingHeight = true;
	if (this.deviceType == 'mobile'){
		this.gutterSize = config.props.margin;
	}

	if (!utils.isEqualQuality(this.quality, config.quality)) {
		recreate = true;
	}
	this.quality = config.quality || {}

	var columnsCount = Math.min(config.props.numCols, config.items.length);

	if ((this.gutterSize != config.props.margin) ||
        (this.columnsCount != columnsCount) ||
        (this.props.textMode != config.props.textMode)) {
		recreate = true;
	}

	this.columnsCount = columnsCount;

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

	this.props = config.props;

	if (recreate){
		this.destroy();
		this.init(config);
	} else {
		this.resize();
	}
}

MasonryController.prototype.calculateLayoutSizes = function () {
	this.gridSizer = $('.grid-sizer');
	this.wrapperWidth = $('body').width()-6;

	var nettoSpace = this.wrapperWidth - this.gutterSize * (this.columnsCount - 1);

	this.columnWidth = Math.floor(nettoSpace / this.columnsCount);
	this.gridSizer.width(this.columnWidth);
	$('.' + this.itemClass, this.el).width(this.columnWidth);
}


MasonryController.prototype.updateLayout = function () {
	var self = this;

	if (this.wrapperWidth < 0) return;

	if (this.props.alignText)
		this.el.css('text-align', this.props.alignText);

	if (this.props.font) {
		utils.loadGoogleFontIfNeeded(this.props.font);
		this.el.css('font-family', utils.fontFamilyDegradation(this.props.font));
	}


//	if (!this.props.textColor) this.props.textColor = '#000'
	if (this.props.textColor){
		var titleColor = this.props.textColor;
		if (this.props.alphaTextColor) titleColor = utils.hexToRgba(this.props.textColor, this.props.alphaTextColor)
		$('.'+this.itemClass+' .title', this.el).css('color', titleColor);
		$('.show-more').css('color',titleColor);
	}

	if (this.props.descriptionColor){
		var descriptionColor = this.props.descriptionColor;
		if (this.props.alphaDescriptionTextColor) descriptionColor = utils.hexToRgba(this.props.descriptionColor, this.props.alphaDescriptionTextColor)
		$('.'+this.itemClass+' .desc', this.el).css('color', descriptionColor);
	}

	if (this.props.backgroundMouseoverColor){
		var overlayColor = this.props.backgroundMouseoverColor;
		if (typeof this.props.alphaBackgroundMouseoverColor !== 'undefined' && $.support.opacity) {
			overlayColor = utils.hexToRgba(this.props.backgroundMouseoverColor, this.props.alphaBackgroundMouseoverColor);
		}
		var ruleSelector = '#viewport '+self.itemSelector+':hover .overlay'
		var rule = utils.insertCssRule(self, ruleSelector+' { background-color: '+overlayColor+'!important; }')
		rule.style.backgroundColor = overlayColor;
		if (!$.support.opacity){
			rule.style['-ms-filter']="progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
			rule.style.filter="alpha(opacity=50)";
			rule.style.opacity = 0.5;
		}
	}

	// Waiting for React Transition
	//Wix.Styles.getSiteTextPresets(function(textPreset) {
	//	var prefix = '.' + self.itemClass + ' .sb-description ';
	//	if (self.isMobile){
	//		$(prefix + 'h3', self.el).css('font-size', textPreset['Body-M']['size']);
	//		$(prefix + '.desc', self.el).css('font-size', textPreset['Body-S']['size']);
	//	} else {
	//		$(prefix + 'h3', self.el).css('font-size', textPreset['Body-L']['size']);
	//		$(prefix + '.desc', self.el).css('font-size', textPreset['Body-M']['size']);
	//	}
	//});

	if (this.props.textBackgroundColor){
		var bgColor = this.props.textBackgroundColor;
		if (typeof this.props.alphaTextBackgroundColor !== 'undefined') bgColor = utils.hexToRgba(this.props.textBackgroundColor, this.props.alphaTextBackgroundColor)
		$('.' + this.itemClass+' .sb-description', this.el).css('background-color', bgColor);
	}

	var resizeImages = utils.pyramid.isOverThresholdChange() || this.preRender;
	var disableImageAction = (self.props.galleryImageOnClickAction === 'disabled');
	var goToLinkAction = (self.props.galleryImageOnClickAction === 'goToLink');
	var itemStyles = {
		marginBottom: self.gutterSize + 'px',
		boxShadow: self.props.boxShadowIsOn ? self.props.boxShadow : 'none'
//		cursor: (!disableImageAction) ? 'pointer' : ''
	}

    var self = this;
    $('.' + this.itemClass, this.el).each(function () {
        var item = $(this).data('item');
        if (!item) {
            return;
        }
        $(this).css(itemStyles);
        var overlay = $('.overlay', this);

        if (disableImageAction || (goToLinkAction && _.isEmpty(item.href))) {
            overlay.hide();
            $(this).css('cursor', '');
        } else {
            overlay.show();
            $(this).css('cursor', 'pointer');
        }

        $('img', this).attr('src', function () {
            var imgSize = utils.getVerticalColumnImageSize(self.columnWidth, item.width, item.height);
            this.width = imgSize.width
            this.height = imgSize.height
            overlay.height(imgSize.height)
            if (resizeImages) {
                return utils.getResizedImageUrl(item.uri, this.width, this.height, {siteQuality: self.quality, maxWidth: item.width, maxHeight: item.height});
            }
            return this.src;
        })
    });
    this.msnry.layout();
    this.preRender = false;
}


MasonryController.prototype.createSingleItem = function (item, index) {
	this.preRender = true;
	var itemTemplate = this.itemTemplate;
//	var imgSize = utils.getVerticalColumnImageSize(this.columnWidth, item.width, item.height);
	var template_data = {
		itemClass: this.itemClass,
		img: {
//			src: Wix.Utils.Media.getResizedImageUrl(item.uri, imgSize.width, imgSize.height),
			src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
//			height: item.height,
//			width: item.width,
//			uri: item.uri
		},
		title: null,
		description: null
	};
//		if (item.description){
//			item.description = item.description.replace(/(.....)/gi,'$1&shy;');
//		}
    switch (this.props.textMode) {
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

	// if (this.props.galleryImageOnClickAction === 'zoomMode') {
	// }

	var slice = itemTemplate(template_data);
	var itemNode = $(slice);
	itemNode.data('item', item);

	return itemNode[0];
}
