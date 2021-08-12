/*eslint strict:0,semi:0*/
// Karma configuration
// Generated on Tue Mar 01 2016 09:36:56 GMT+0200 (IST)

module.exports = function(config) {
    config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
        'http://static.parastorage.com/services/third-party/jquery/1.10.2/dist/jquery.min.js',
        'http://static.parastorage.com/services/third-party/lodash/2.4.1/dist/lodash.min.js',
        'http://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js',
        'http://static.parastorage.com/services/third-party/hammer/1.0.5/jquery.hammer.min.js',
        'http://static.parastorage.com/services/third-party/jquery-easing/1.3/jquery.easing.min.js',
        'http://static.parastorage.com/services/js-sdk/1.44.0/js/Wix.js',
        'lib/js/utils.js',
        'lib/js/app.proto.js',
        //'lib/**/*.min.js',
        //'lib/**/*.min.js.map',
        'src/Accordion/js/**/*.js',
        'src/Accordion/test/**/*.spec.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
