/* eslint global-require: 0, import/no-extraneous-dependencies: 0, import/order: 0, import/no-dynamic-require: 0 */

const merge = require('webpack-merge');
const path = require('path');
const fs = require('fs');
const common = require('./webpack.common');

const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');

module.exports = env => {
	const userConfFile = './grunt/current_user/webpack.config.js';

	let userConf = {};
	if (fs.existsSync(userConfFile)) {
		userConf = require(userConfFile);
		if (typeof userConf === 'function') {
			userConf = userConf.call();
		}
	}

	const commonConf = common(env);

	const devConfig = {
		mode: 'development',
		devtool: 'inline-source-map',

		devServer: {
			disableHostCheck: true,
			host: '0.0.0.0',
			port: 3000,

			contentBase: path.join(__dirname, 'build'),

			watchContentBase: true,
			watchOptions: {
				// since we use "require.context" to include all source files, we need to declare absolute paths
				ignored: (() => {
					const patterns = [
						'src/**/test/**/*.js',
						'src/**/test/**/*.ts',
						'scss/customer',
						'node_modules',
						'build',
						'build-e2e',
						'.tscache'
					];
					return patterns.map(pattern => path.join(__dirname, pattern));
				})()
			},

			hot: true,

			before(app) {
				// only set CSP for index.html request.
				// i.e. do not set CSP for external content test widgets.
				app.get('/', function (req, res, next) {
					// This CSP value must be in sync with the resolved play.filters.csp.directives value of development.conf.
					// PLUS "connect-src 'self' ws:;"
					res.set({
						'Content-Security-Policy':
							"default-src 'self'; " +
							"connect-src 'self' ws:; " +
							"script-src 'self' 'unsafe-eval'" +
							"style-src 'self' 'unsafe-inline'; " +
							"object-src 'none'; " +
							"img-src 'self' data:; " +
							"frame-ancestors 'self' https://localhost:* http://localhost:*; " +
							"frame-src 'self' https://localhost:* http://localhost:*"
					});
					next();
				});
			}
		},

		module: {
			rules: [
				{
					test: /\.scss$/,
					exclude: /(node_modules|ngx)/,
					use: [
						{
							loader: ExtractCssChunksPlugin.loader,
							options: {
								hot: true
							}
						},
						{
							loader: 'css-loader',
							options: {
								sourceMap: true,
								url: false // don't resolve urls to static files
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								sourceMap: true
							}
						},
						{
							loader: 'thread-loader'
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true,
								sourceComments: true
							}
						}
					]
				}
			]
		}
	};

	return merge(commonConf, devConfig, userConf);
};
