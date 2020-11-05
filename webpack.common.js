/* eslint global-require: 0, import/no-extraneous-dependencies: 0, import/order: 0, import/no-dynamic-require: 0 */

const webpack = require('webpack');
const path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');
const AngularCompilerPlugin = require('@ngtools/webpack').AngularCompilerPlugin;

const expose = (module, as) => ({
	test: require.resolve(module),
	loader: `expose-loader?${as}`
});

const getSourcePattern = isTest => {
	// Exclude all downgraded wrapper files from unit test runs.
	const fileNameSuffix = isTest ? '(?<!\\.downgraded\\.)' : '';
	const FILE_TYPES = 'controller|directive|service|filter|validator|constant';
	const FILE_EXTENSIONS = 'js|ts';

	return `/^.*\\/(${FILE_TYPES})(?<!.*test.*)\\/.*.${fileNameSuffix}.(${FILE_EXTENSIONS})$/`;
};

const isNodeModuleDependency = module => /node_modules/.test(module);

const excludeFromTranspilation = module => {
	const included = [/@ngx/, /@angular/];
	const isJSFile = /\.js$/.test(module);
	return isNodeModuleDependency(module) && !(isJSFile && included.some(pattern => pattern.test(module)));
};

const isNgxSource = module => {
	const included = [/ngx/, /main.ts/];
	return !isNodeModuleDependency(module) && included.some(pattern => pattern.test(module));
};

module.exports = env => {
	const customerBundleStatics = ['./customer_bundles/', env.customer || 'finnova', '/static'].join('');

	return {
		performance: {
			hints: false
		},

		entry: {
			app: ['./webpack-config/vendor.js', './webpack-config/index.js', './src/main.ts'],
			templates: ['./webpack-config/templates.js'],
			css: ['./scss/app.scss']
		},

		output: {
			filename: 'assets/js/[name].js',
			path: path.join(__dirname, 'build'),
			pathinfo: false
		},

		resolve: {
			extensions: ['.ts', '.js']
		},

		optimization: {
			splitChunks: {
				cacheGroups: {
					commons: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendor',
						chunks: 'all'
					}
				}
			}
		},

		module: {
			rules: [
				{
					test: /[/\\]@angular[/\\]core[/\\].+\.js$/, // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
					parser: { system: true }
				},
				{
					test: /\.ts$/,
					loader: '@ngtools/webpack',
					include: module => isNgxSource(module)
				},
				{
					test: /\.(js|ts)$/,
					exclude: module => isNgxSource(module) || excludeFromTranspilation(module),
					use: [
						'thread-loader',
						{
							loader: 'babel-loader',
							options: {
								envName: env.isTest ? 'test' : undefined
							}
						}
					]
				},
				{
					test: /\.html$/,
					exclude: /(node_modules|static)/,
					use: [
						'thread-loader',
						{
							loader: 'html-loader',
							options: {
								attrs: false, // don't resolve urls to static files
								minimize: true,
								removeComments: true,
								preserveLineBreaks: false,
								collapseWhitespace: true,
								conservativeCollapse: false,
								collapseInlineTagWhitespace: true,
								removeAttributeQuotes: false,
								keepClosingSlash: true,
								caseSensitive: true
							}
						}
					]
				},

				// load scss for angular-components
				{
					test: /\.scss$/,
					include: /ngx/,
					use: [
						'thread-loader',
						{
							loader: 'to-string-loader',
							options: {
								sourceMap: env.uiDebug
							}
						},
						{
							loader: 'css-loader',
							options: {
								sourceMap: env.uiDebug,
								url: false // don't resolve urls to static files
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								sourceMap: env.uiDebug,
								config: {
									path: path.join(__dirname, './scss/')
								}
							}
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: env.uiDebug
							}
						},
						{
							loader: 'sass-resources-loader',
							options: {
								resources: [path.resolve(__dirname, './scss/spec/spec_ngx.scss')]
							}
						}
					]
				},

				// ------------------------------------------------------------------
				// Webpack wraps everything in an IIFE to prevent namespace polluting
				// Since our app depends on some globally defined dependencies,
				// we need to explicitly expose them via expose-loader
				// ------------------------------------------------------------------
				// expose('jquery', 'jQuery'),
				// expose('jquery', '$'),
				// expose('better-scroll', 'BScroll'),
				// expose('moment', 'moment'),
				// expose('highcharts', 'Highcharts'),
				// expose('crypto-js/core', 'CryptoJS')
			]
		},

		// if webpack is run as part of a test (karma, wallaby), only include necessary plugins
		plugins: (() => {
			const commonPlugins = [
				new AngularCompilerPlugin({
					tsConfigPath: 'tsconfig.ngx.json',
					sourceMap: env.uiDebug
				}),

				new CleanWebpackPlugin(),

				new webpack.DefinePlugin({
					SRC_PATTERN: getSourcePattern(env.isTest),
					webpackDebugEnabled: env.uiDebug,
					webpackTestMode: env.isTest || false,
					API_VERSION: `'${env.apiVersion}'`
				}),

				// only load necessary locales
				new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /de|de-ch|fr|fr-ch|en-gb|it|es/),

				new webpack.ContextReplacementPlugin(/angular([\\/])core/, path.resolve(__dirname, './src'))
			];

			const buildPlugins = [
				new ExtractCssChunksPlugin({
					filename: 'assets/css/app.css'
				}),

				new HtmlWebpackPlugin({
					filename: './index.html',
					template: './static/index.html',
					chunksSortMode(a, b) {
						const order = ['vendor', 'app', 'templates', 'css'];
						return order.indexOf(a.names[0]) - order.indexOf(b.names[0]);
					},

					// don't add css.js/css.min.js to the bundle in production mode
					excludeAssets: env.uiDebug ? undefined : [/css.js/, /css.min.js/]
				}),

				// HtmlWebpackPlugin only supports excludeChunks, which excludes whole chunks including "app.css"
				// To exclude single assets we need to add the HtmlWebpackExcludeAssetsPlugin
				new HtmlWebpackExcludeAssetsPlugin(),

				// copy static files to build folder
				new CopyWebpackPlugin([
					{ from: customerBundleStatics, to: 'assets' },
					{ from: './static/js', to: 'assets/js' },
					{ from: './static/fonts', to: 'assets/fonts' },
					{ from: './src/card/images', to: 'assets/images/card' },
					{ from: './src/common/images', to: 'assets/images/select2' }
				])
			];

			if (env.uiDebug) {
				commonPlugins.push(
					new HtmlWebpackPlugin({
						filename: './iframe.html',
						template: './static/iframe.html',
						excludeAssets: [/\.(css|js)$/]
					})
				);
			}

			return env.isTest ? commonPlugins : commonPlugins.concat(buildPlugins);
		}).apply()
	};
};
