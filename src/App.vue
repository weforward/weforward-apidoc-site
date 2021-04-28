<template>
	<!-- 业务页面展示 -->
	<RouterView></RouterView>
</template>

<script>
import Vue from 'vue';
//路由配置
import router from './router.js';
//微服务数据请求插件
//使用文档参考https://www.npmjs.com/package/weforward-protocol
import wf from 'weforward-protocol';
wf.updateGlobalConfig('loginUrl', 'devops?method=/devops/auth/login');
wf.updateGlobalConfig('logoutUrl', 'devops?method=/devops/auth/logout');

import './plugins/timeutils.js';
import wool from './utils/wool'
import msgView from './plugins/WoolMsgview'
window.$wool = wool.extend(wool, msgView);
Vue.prototype.$wool = window.$wool;
import cookie from './utils/cookie.js';
window.$cookie = cookie;
//设置请求数据默认的服务名
wf.setBaseService('devops');
wf.updateGlobalConfig('resDataAttrNameStyle', 0);

Vue.prototype.$wf = wf;
//Vue.prototype.site_name = "devops-site";


Vue.prototype.$wf = wf;


export default {
	name: 'App',
	router: router
};
</script>

<style>
	@import url('./assets/css/app.css');
	@import url('./assets/css/table.css');

	.apploading {
		margin-top: 10vh;
		text-align: center;
	}
</style>
