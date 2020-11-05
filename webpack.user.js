module.exports = () => {
	return {
		devtool: 'source-map',

		devServer: {
			port: 15555,
			proxy: [
				{
					context: ['/api'],
					target: 'http://localhost:15556',
					secure: false
				}
			]
		}
	};
};
