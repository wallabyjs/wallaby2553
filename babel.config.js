module.exports = function (api) {
	const presets = [['@babel/preset-env'], ['@babel/typescript']];
	const plugins = [
		['angularjs-annotate'],
		['@babel/plugin-proposal-decorators', { legacy: true }],
		['@babel/plugin-proposal-class-properties']
	];

	const excludeFromTestCoverage = [
		'**/e2eComponentTests/**/*.js',
		'**/e2eComponentTests/**/*.ts',
		'**/test/**/*.js',
		'**/test/**/*.ts'
	];

	if (api.env('test')) {
		const testCoverage = ['istanbul', { exclude: excludeFromTestCoverage }];
		plugins.push(testCoverage);
	}

	return { presets, plugins };
};
