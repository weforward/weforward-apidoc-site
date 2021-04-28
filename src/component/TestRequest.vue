<template>
	<WoolShowmodal :isshow="isshow" @tapCloser="$emit('toggle')" :isshowcloser="true">
		<section class=" model-background ">
			<div class="test-request wt-scroll">
				<section class="test-request-warp">
					<p class="font_bold test-request-warp-title">header:</p>
					<div class="flexlayout test-request-item">
						<div class="test-request-item-key">access_id:</div>
						<input class="test-request-item-value" placeholder="访问微服务的access。若微服务允许无access访问，可为空" rows="1" v-model="header.accessId" type="text" />
					</div>
					<div class="flexlayout test-request-item">
						<div class="test-request-item-key">access_key:</div>
						<input class="test-request-item-value" placeholder="请输入十六进制格式或base64格式" rows="1" type="text" v-model="header.accessKey" />
					</div>
					<label class="flexlayout test-request-item" v-if="isShowCheckAccess">
						<input type="checkbox" v-model="isNeedAccess" />
						使用当前用户的access
					</label>
				</section>
				<section class="test-request-warp">
					<p class="font_bold test-request-warp-title">wf_req:</p>
					<div class="flexlayout test-request-item">
						<div class="test-request-item-key">ver:</div>
						<input class="test-request-item-value" disabled v-model="wfReq.ver" />
					</div>
					<div class="flexlayout test-request-item">
						<div class="test-request-item-key">res_id:</div>
						<input class="test-request-item-value" placeholder="微服务的资源标识（可空）" v-model="wfReq.resId" />
					</div>
					<div class="flexlayout test-request-item">
						<div class="test-request-item-key">trace_id:</div>
						<input class="test-request-item-value" placeholder="跟踪标识（可空）" v-model="wfReq.traceId" />
					</div>
					<div class="flexlayout test-request-item">
						<div class="test-request-item-key">wait_time_out:</div>
						<input class="test-request-item-value" :min="1" type="number" placeholder="网关超时参数（可空, 正整数, 秒）" v-model="wfReq.waitTimeout" />
					</div>
				</section>
				<section class="test-request-warp">
					<p class="font_bold test-request-warp-title">invoke:</p>
					<div class="flexlayout test-request-item">
						<div class="test-request-item-key">method:</div>
						<textarea class="test-request-item-value" disabled rows="1" v-model="invoke.method"></textarea>
					</div>
					<div class="flexlayout test-request-item">
						<div class="test-request-item-key">params:</div>
						<WoolTextArea class="test-request-item-value test-request-item-value-params" v-model="invoke.params"></WoolTextArea>
						<!-- <textarea class="test-request-item-value" rows="10" v-model="invoke.params"></textarea> -->
					</div>
				</section>
			</div>
			<div class="btn-wrap flexlayout"><button class="add-btn" @click="testRequest">调试</button></div>
		</section>
	</WoolShowmodal>
</template>

<script>
	import postExt from '../plugins/postExt.js';
	import hexToBase64 from '../plugins/hexToBase64.js';
	export default {
		name: 'TestRequest',
		props: {
			item: Object,
			isshow: Boolean,
			servicename: String
		},
		components: {
			WoolShowmodal: () => import('../component/WoolShowmodal.vue'),
			WoolTextArea: () => import('../component/WoolTextArea.vue')
		},
		data() {
			return {
				isShowCheckAccess: window.$cookie.get('_WF_ACCESSKEY') && window.$cookie.get('_WF_ACCESSID'),
				isNeedAccess: null,
				header: {
					accessId: '',
					accessKey: ''
				},
				wfReq: {
					ver: '',
					resId: '',
					traceId: '',
					waitTimeout: ''
				},
				invoke: {
					method: '',
					params: ''
				}
			};
		},
		watch: {
			isNeedAccess(val) {
				if (val) {
					this.header.accessKey = window.$cookie.get('_WF_ACCESSKEY');
					this.header.accessId = window.$cookie.get('_WF_ACCESSID');
				} else {
					let accessId = sessionStorage.getItem('accessId');
					this.header.accessId = accessId ? accessId : '';
					let accessKey = sessionStorage.getItem('accessKey');
					this.header.accessKey = accessKey ? accessKey : '';
				}
			},
			isshow(val) {
				if (val) {
					// 设置值
					this.invoke.method = this.item.name;
					this.wfReq.ver = this.item.version;
					let accessId = sessionStorage.getItem('accessId');
					this.header.accessId = accessId ? accessId : '';
					let accessKey = sessionStorage.getItem('accessKey');
					this.header.accessKey = accessKey ? accessKey : '';
					let strogeinvokeparams = sessionStorage.getItem(this.invoke.method);
					if (strogeinvokeparams) {
						strogeinvokeparams = JSON.parse(strogeinvokeparams);
					}
					let invokeparams = {};
					this.item.params.forEach(params => {
						if (params.type == 'List') {
							invokeparams[params.name] = [];
						} else if (params.type == 'Number') {
							invokeparams[params.name] = Number(params.example) || 0;
						} else if (params.type == 'Boolean ') {
							invokeparams[params.name] = Boolean(params.example) || true;
						} else {
							invokeparams[params.name] = params.example || '';
						}
					});
					let paramsVal = JSON.stringify(strogeinvokeparams ? strogeinvokeparams : invokeparams, null, '\t');
					this.invoke.params = paramsVal;
				}
			}
		},
		methods: {
			testRequest() {
				let servicename = this.servicename;
				let _params = {
					invoke: {}
				};
				if (this.wfReq.waitTimeout && Number(this.wfReq.waitTimeout) < 1) {
					this.$wool.showwarn('请输入正确的网关超时参数');
					return;
				}
				_params.wfReq = this.wfReq;
				_params.invoke['method'] = this.invoke.method;
				_params.invoke.params = JSON.parse(this.invoke.params) || {};
				let _config = {
					wfconfig: {}
				};
				let accessId = this.header.accessId.trim();
				let accessKey = this.header.accessKey.trim();
				if (accessId) {
					sessionStorage.setItem('accessId', accessId);
				}
				if (accessKey) {
					sessionStorage.setItem('accessKey', accessKey);
				}
				if (this.invoke.params) {
					sessionStorage.setItem(this.invoke.method, this.invoke.params);
				}
				if (accessKey.length == 64) {
					accessKey = hexToBase64(accessKey);
				}
				_config.wfconfig.accessId = accessId && accessKey ? accessId : '';
				_config.wfconfig.accessKey = accessId && accessKey ? accessKey : '';
				// 已经调试过记得保存起来
				if (accessKey && accessKey.length != 44) {
					this.$wool.showwarn('请输入base64或者16进制格式的accessKey');
					return;
				}

				let msgview = this.$wool.showloading('正在请求');
				postExt(servicename, _params, _config)
					.then(res => {
						msgview.hide(0);
						this.$emit('testresult', res);
					})
					// .catch(e => {
					// 	alert(e);
					// 	msgview.msgwarn(e.message).hide(0);
					// });
			}
		}
	};
</script>

<style scoped="scoped">
	.test-request {
		background-color: white;
		width: 900px;
		min-height: 300px;
		max-height: 500px;
		padding: 12px;
		padding-top: 50px;
	}

	.test-request-item {
		align-items: center;
		margin-bottom: 10px;
	}

	.test-request-item-key {
		width: 110px;
	}

	.test-request-item-value {
		width: 80%;
		resize: none;
		padding: 10px;
	}

	.test-request-item-value-params {
		min-height: 200px;
		font-size: 16px;
	}

	.test-request-warp-title {
		padding-bottom: 10px;
	}

	.btn-wrap {
		justify-content: flex-end;
		padding: 20px;
		background-color: white;
	}
</style>
