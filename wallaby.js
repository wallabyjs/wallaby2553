const wallabyWebpack = require('wallaby-webpack');
const path = require('path');
const { find, remove } = require('lodash');

const webpackConfig = require('./webpack.dev')({ isTest: true });

module.exports = function (wallaby) {
	// Wallaby copies the files in its own cache folder, we need to tell webpack where that is
	webpackConfig.context = path.join(wallaby.projectCacheDir, 'src');

	webpackConfig.entryPatterns = [
		'webpack-config/vendor.js',
		'webpack-config/index.js',
		'webpack-config/wallaby.test.js',

		// add test files here
		'myTestFile.ts'
	].map(pattern => pattern.replace(/ts$/, 'js'));

	// remove babel loader, wallaby takes over for us (see further down the property "compilers")
	const { rules } = webpackConfig.module;
	remove(rules, find(rules, { use: [{ loader: 'babel-loader' }] }));

	// anything you need but .ts extension
	webpackConfig.resolve.extensions = ['.js', '.json'];

	return {
		files: [
			{ pattern: 'src/**/*.js', load: false },
			{ pattern: 'src/**/*.ts', load: false },
			{ pattern: 'src/**/*.html', load: false },
			{ pattern: 'webpack-config/*.js', load: false },
			{ pattern: 'test/karma/helpers.js', load: false },
			{ pattern: 'test/karma/runtimeError.js', load: false },
			{ pattern: 'test/karma/simulateMaskedRuntimeError.js', load: false },

			// ignore test files since they get declared in the "tests" option
			{ pattern: 'src/**/test/e2e/**/*.{js,ts}', ignore: true },
			{ pattern: 'src/**/test/midway/**/*.{js,ts}', ignore: true },
			{ pattern: 'src/**/test/unit/**/*.helpers.{js,ts}', ignore: true },
			{ pattern: 'src/**/*.spec.ts', ignore: true }
		],

		// loaders: [{ loader: '@ngtools/webpack' }],

		tests: [
			{ pattern: 'src/**/test/unit/**/!(*.helpers).{js,ts}', load: false },
			{ pattern: 'src/**/*.spec.ts', load: false }
		],

		compilers: {
			'src/**/*.{js,ts}': wallaby.compilers.babel()
		},

		postprocessor: wallabyWebpack(webpackConfig),

		env: {
			kind: 'chrome'
		},

		setup() {
			window.__moduleBundler.loadTests();
		}
	};
};
