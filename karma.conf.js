const webpackConfig = require('./../../webpack.dev')({ isTest: true });

// remove unnecessary webpack options
webpackConfig.devtool = false;
delete webpackConfig.devServer;
delete webpackConfig.entry;
delete webpackConfig.optimization;
delete webpackConfig.output;

module.exports = function (config) {
	config.set({
		basePath: '../../',
		frameworks: ['parallel', 'jasmine-jquery', 'jasmine', 'jasmine-matchers'],
		plugins: [
			// eslint-disable-next-line global-require
			require('karma-parallel'),
			'karma-coverage',
			'karma-jasmine',
			'karma-jasmine-matchers',
			'karma-chrome-launcher',
			'@metahub/karma-jasmine-jquery',
			'karma-junit-reporter',
			'karma-story-reporter',
			'karma-webpack'
		],

		// to avoid DISCONNECTED messages
		// see https://github.com/karma-runner/karma/issues/598#issuecomment-77105719
		browserDisconnectTimeout: 10000, // default 2000
		browserDisconnectTolerance: 1, // default 0
		browserNoActivityTimeout: 60000, //default 10000
		client: {
			jasmine: {
				random: false
			}
		},

		parallelOptions: {
			executors: 10
		},

		reporters: ['progress', 'story', 'coverage', 'junit'],
		colors: true,
		logLevel: config.LOG_INFO,
		autoWatch: true,
		browsers: ['ChromeHeadless'],
		singleRun: false,

		// Setup JUnit Reporter:
		junitReporter: {
			outputDir: 'test/reports/unit/junit',
			outputFile: 'test-results-unit.xml',
			suite: 'Client: Unit Tests'
		},

		coverageReporter: {
			type: 'lcov',
			dir: 'test/reports/unit/coverage/lcov/',
			subdir(browser) {
				// normalization process to keep a consistent browser name across different OS & browser versions
				return browser.toLowerCase().split(/[ /-]/)[0];
			}
		},

		files: [
			'./test/karma/index.test.js',
			// available in browser env (e.g. for dynamic loading), but no initial script tag generated
			{pattern: './test/karma/runtimeError.js', included: false},
			{pattern: './test/karma/simulateMaskedRuntimeError.js', included: false}
		],

		preprocessors: {
			'./test/karma/index.test.js': ['webpack']
		},

		webpack: webpackConfig,

		webpackMiddleware: {
			noInfo: true
		}
	});
};
