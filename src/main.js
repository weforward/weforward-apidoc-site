//vue框架 文档地址 https://cn.vuejs.org/menu/
import Vue from 'vue'
import App from './App.vue'
Vue.config.productionTip = false
new Vue({
	render: h => h(App)
}).$mount('#app');
