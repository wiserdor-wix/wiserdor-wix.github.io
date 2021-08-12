/*eslint strict: [2, "global"]*/
/*eslint-env node, es6 */
'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        buildTPAGallery: {
            all: ['Accordion', 'BookGallery', 'Collage', 'Freestyle', 'Honeycomb', 'Impress', 'Masonry', 'StripShowcase', 'StripSlideshow', 'Thumbnails']
        },
        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'src/Carousel/', src: ['**'], dest: 'target/Carousel/'},
                    {expand: true, cwd: 'src/Slicebox/', src: ['**'], dest: 'target/Slicebox/'}
                ]
            }
        },
        clean: {
            build: {
                src: ['target']
            }
        },
        uglify: {
            libs: {
                options: {
                    sourceMap: true
                },
                files: [
                    {'lib/js/app.proto.min.js': ['lib/js/app.proto.js']},
                    {'lib/js/classList.min.js': ['lib/js/classList.js']},
                    {'lib/js/html5-dataset.min.js': ['lib/js/html5-dataset.js']},
                    {'lib/js/jquery.cycle2.carousel.min.js': ['lib/js/jquery.cycle2.carousel.js']},
                    {'lib/js/jquery.cycle2.tile.min.js': ['lib/js/jquery.cycle2.tile.js']},
                    {'lib/js/jquery.event.drag-2.2.min.js': ['lib/js/jquery.event.drag-2.2.js']},
                    {'lib/js/jquery.hoverscroll.min.js': ['lib/js/jquery.hoverscroll.js']},
                    {'lib/js/jquery.pageFlipper.min.js': ['lib/js/jquery.pageFlipper.js']},
                    {'lib/js/utils.min.js': ['lib/js/utils.js']},
                    {'lib/js/seedrandom.min.js': ['lib/js/seedrandom.js']},
                    {'lib/js/wix.min.js': ['lib/js/Wix.js']}
                ]
            }
        },
        karma: {
            options: {
                configFile: 'karma.conf.js',
                runnerPort: 9999,
                singleRun: true,
                colors: true,
                browsers: ['PhantomJS']
            },
            //coverage: {
            //    reporters: ['progress', 'coverage'],
            //    coverageReporter: {
            //        type: 'html',
            //        dir: 'target/coverage/'
            //    },
            //    options: {
            //        client: {
            //            santaTestPattern: '\.(unit|spec)\.js$'
            //        }
            //    }
            //},
            //teamcity: {
            //    colors: false,
            //    reporters: ['teamcity', 'coverage'],
            //    plugins: ['karma-requirejs', 'karma-jasmine', 'karma-coverage', 'karma-phantomjs-launcher', 'karma-teamcity-reporter'],
            //    coverageReporter: {type: 'teamcity'},
            //    browsers: ['PhantomJS']
            //},
            all: {
                browsers: ['PhantomJS']
            }
        }
    });
    grunt.loadTasks('./conf');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['clean', 'copy', 'buildTPAGallery:all']);
    grunt.registerTask('test', ['karma']);
};
