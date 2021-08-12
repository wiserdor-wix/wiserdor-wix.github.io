/*eslint-env node,es6*/
/*eslint strict:0*/
'use strict';
module.exports = function register(grunt) {
    var path = require('path'),
        fs = require('fs-extra'),
        _ = require('lodash'),
        UglifyJS = require('uglify-js'),
        CleanCSS = require('clean-css'),
        less = require('less');

    const ROOT = path.join(__dirname, '..');
    const GALLERIES_BASE_SOURCE = path.join(ROOT, 'src');
    const GALLERIES_BASE_TARGET = path.join(ROOT, 'target');
    const GALLERIES_HTML_TEMPLATE = grunt.file.read(path.join(__dirname, 'tpaGalleryResources', 'appTemplate.template'));

    function getPath(root, rest) {
        return path.join.apply(path, [root].concat(rest));
    }

    function source() {
        return getPath(GALLERIES_BASE_SOURCE, _.toArray(arguments));
    }

    function target() {
        return getPath(GALLERIES_BASE_TARGET, _.toArray(arguments));
    }

    function getManifest(gallery) {
        var manifestPath = path.join(__dirname, 'tpaGalleryResources', gallery + '.json');
        if (grunt.file.exists(manifestPath)){
            return JSON.parse(grunt.file.read(manifestPath));
        }
        return null;
    }

    const IS_SOURCE_STYLE = /\.less$|style\.css$/;

    function withoutSourceStyleFiles(fileName) {
        return !IS_SOURCE_STYLE.test(fileName);
    }

    function buildGalleryWithManifest(gallery, manifest) {

        function minifyJs() {
            var sourceContents = _.map(manifest.resources.js, (resource) => grunt.file.read(source(gallery, resource))).join('');
            var targetFile = target(gallery, 'js', 'app.min.js');
            var minified = UglifyJS.minify(sourceContents, {fromString: true}).code;
            grunt.file.write(targetFile, minified);
        }

        function buildCss() {
            var sourceLessFile = source(gallery, 'css', 'style.less');
            var cssContent = grunt.file.match({matchBase: true}, '*.css', manifest.resources.style).map((cssFile) => grunt.file.read(source(gallery, cssFile))).join('');

            if (grunt.file.exists(sourceLessFile)) {
                var lessContent = grunt.file.read(sourceLessFile);
                return less.render(lessContent, {paths: [source(gallery, 'css')]}).then(function (output) {
                    cssContent += output.css;
                    grunt.file.write(source(gallery, 'css', 'style.css'), cssContent);
                    var minified = new CleanCSS().minify(cssContent).styles;
                    grunt.file.write(target(gallery, 'css', 'style.min.css'), minified);
                });
            }
        }

        function copyResources() {
            var sourceFiles = source(gallery, 'css');
            var targetResources = target(gallery, 'css');
            fs.copySync(sourceFiles, targetResources, {filter: withoutSourceStyleFiles});
        }

        function buildTemplate() {
            var templateData = _.assign({}, manifest, {
                PRODUCTION: true,
                DEBUG: false
            });
            var debugTemplateData = _.assign({}, manifest, {
                PRODUCTION: false,
                DEBUG: true
            });

            var htmlFile = grunt.template.process(GALLERIES_HTML_TEMPLATE, {data: templateData});
            var debugHtmlFile = grunt.template.process(GALLERIES_HTML_TEMPLATE, {data: debugTemplateData});

            grunt.file.write(target(gallery, manifest.main), htmlFile);
            grunt.file.write(source(gallery, manifest.main), debugHtmlFile);
        }

        return Promise.resolve()
            //.then(cleanTarget)
            .then(minifyJs)
            .then(buildCss)
            .then(copyResources)
            .then(buildTemplate);

    }

    function buildGallery(gallery) {
        var manifest = getManifest(gallery);
        if (manifest) {
            return buildGalleryWithManifest(gallery, manifest);
        }
        throw new Error(`ERROR: missing manifest ${gallery}`);
    }

    grunt.registerMultiTask('buildTPAGallery', 'builds tpa galleries locally', function () {
        const galleries = this.data;

        Promise.all(galleries.map(buildGallery))
            .then(this.async())
            .catch(function (err) {
                grunt.fail.fatal(`building the TPA Galleries failed due to an error:\n ${err}`);
            });
    });
};
