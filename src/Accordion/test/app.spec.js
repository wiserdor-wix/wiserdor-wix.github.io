/*eslint-env jasmine*/
/*globals AccordionController,$*/
describe('Accordion gallery', function () {
    'use strict';
    it('should render titles', function () {
        var config = {
            "items": [
                {
                    "type": "Image",
                    "title": "Water Droplets",
                    "uri": "cd6a81b7d29d88425609ecc053a00d16.jpg",
                    "description": "Describe your image here",
                    "width": 1000,
                    "height": 750,
                    "linkType": "FREE_LINK",
                    "id": "i022bx"
                },
                {
                    "type": "Image",
                    "title": "Budding Tree",
                    "uri": "44dab8ba8e2b5ec71d897466745a1623.jpg",
                    "description": "Describe your image here",
                    "width": 400,
                    "height": 750,
                    "linkType": "FREE_LINK",
                    "id": "i120nu"
                },
                {
                    "type": "Image",
                    "title": "Fallen Apples",
                    "uri": "8dfce587e3f99f17bba2d3346fea7a8d.jpg",
                    "description": "Describe your image here",
                    "width": 758,
                    "height": 569,
                    "linkType": "FREE_LINK",
                    "id": "i2hh4"
                },
                {
                    "type": "Image",
                    "title": "Cherry Blossom",
                    "uri": "3dcc6f56be1f8507181d0197e52d09e8.jpg",
                    "description": "Describe your image here",
                    "width": 500,
                    "height": 750,
                    "linkType": "FREE_LINK",
                    "id": "i3wxm"
                },
                {
                    "type": "Image",
                    "title": "Ray of Light",
                    "uri": "8fed9ef13904fb85b6b12092c269a465.jpg",
                    "description": "Describe your image here",
                    "width": 750,
                    "height": 563,
                    "linkType": "FREE_LINK",
                    "id": "i426s"
                },
                {
                    "type": "Image",
                    "title": "Bloom",
                    "uri": "24bba47f40f8473a534ae0301bf748c9.jpg",
                    "description": "Describe your image here",
                    "width": 400,
                    "height": 750,
                    "linkType": "FREE_LINK",
                    "id": "i5isb"
                },
                {
                    "type": "Image",
                    "title": "Dew",
                    "uri": "8dde68848c4daae3a6905dc6a17d270e.jpg",
                    "description": "Describe your image here",
                    "width": 800,
                    "height": 600,
                    "linkType": "FREE_LINK",
                    "id": "i620y9"
                },
                {
                    "type": "Image",
                    "title": "Tranquil forest",
                    "uri": "568544c06dafc9d2ab6f4f4496e7d7b9.jpg",
                    "description": "Describe your image here",
                    "width": 800,
                    "height": 600,
                    "linkType": "FREE_LINK",
                    "id": "i71rp8"
                },
                {
                    "type": "Image",
                    "title": "Lilly Pond",
                    "uri": "a3ae91861f93fde1b8917291180c5fe0.jpg",
                    "description": "Describe your image here",
                    "width": 700,
                    "height": 525,
                    "linkType": "FREE_LINK",
                    "id": "i8nbq"
                }
            ],
            "props": {
                "type": "AccordionProperties",
                "metaData": {
                    "isPreset": false
                },
                "font": "arial",
                "descFont": "arial",
                "alignText": "left",
                "textMode": "titleAndDescription",
                "galleryImageOnClickAction": "zoomMode",
                "id": "c1wwj",
                "textColor": "#0099ff",
                "alphaTextColor": 0.8,
                "descriptionColor": "#ffffff",
                "alphaDescriptionColor": 1,
                "textBackgroundColor": "#3d4fa2",
                "alphaTextBackgroundColor": 0.6,
                "borderWidth": 5,
                "borderColor": "#0099ff",
                "alphaBorderColor": 0.3
            }
        };
        var viewport = $('<div />');
        var App = new AccordionController(viewport, {});
        App.updateSettings(config);
        var titles = viewport.find('.title');
        expect(titles.size()).toEqual(9);
        expect(titles.get(0).innerHTML).toEqual('Water Droplets');
    });
});
