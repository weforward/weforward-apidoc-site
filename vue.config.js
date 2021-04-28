const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
	publicPath: process.env.VUE_APP_WF_PUBLICPATH,
	devServer: {
		//前端页面的访问端口
		port: process.env.VUE_APP_WF_HOST_PORT,
	},
	configureWebpack: config => {
		if (isProduction) {
			const builder = require('weforward-builder');
			config.plugins.push(new builder());
		}
	},
	filenameHashing: true,
	productionSourceMap: false
}
