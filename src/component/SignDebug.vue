<template>
	<WoolShowmodal :isshow="isshow" @tapCloser="$emit('toggle')" :isshowcloser="true">
		<div class="sign-debug model-background wt-scroll">
			<section>
				<div class="flexlayout sign-debug-item">
					<div class="sign-debug-item-key">access_id:</div>
					<input class="sign-debug-item-value" @blur="verifyAccessId" v-model="accessId" type="text" />
				</div>
				<p class="verify-info" v-show="accessIdErr">{{ accessIdErr }}</p>
			</section>
			<section>
				<div class="flexlayout sign-debug-item">
					<div class="sign-debug-item-key">access_key :</div>
					<input class="sign-debug-item-value" @blur="verifyAccessKey" v-model="accessKey"  type="text" />
				</div>
				<p class="verify-info" v-show="accessKeyErr">
					{{ accessKeyErr }}
					<span @click="turnBase64" v-show="isshowTurnBase64" class="try-handle">尝试转换</span>
				</p>
			</section>
			<section v-if="isShowCheckAccess">
				<label class="flexlayout sign-debug-item" @click="checkAccess">
					<input type="checkbox" v-model="isNeedAccess" />
					使用当前用户的access
				</label>
			</section>
			<section>
				<div class="flexlayout sign-debug-item">
					<div class="sign-debug-item-key">{{ pageType }}-Noise:</div>
					<input class="sign-debug-item-value" @blur="verifyNoise" v-model="noise"  type="text" />
				</div>
				<p class="verify-info" v-show="noiseErr">{{ noiseErr }}</p>
			</section>
			<section>
				<div class="flexlayout sign-debug-item">
					<div class="sign-debug-item-key">post内容体:</div>
					<WoolTextArea class="sign-debug-item-value" @blur="verifypostParam" v-model="postParam"></WoolTextArea>
					<p class="verify-info"></p>
				</div>
			</section>
			<section>
				<div class="flexlayout sign-debug-item">
					<div class="sign-debug-item-key">{{ pageType }}-Content-Sign:</div>
					<input class="sign-debug-item-value" v-model="hyContentSign" type="text" disabled="disabled" />
				</div>
			</section>
			<section>
				<div class="flexlayout sign-debug-item">
					<div class="sign-debug-item-key">{{ pageType }}-Tag:</div>
					<input class="sign-debug-item-value" type="text" />
				</div>
				<p class="verify-info"></p>
			</section>
			<div class="btn-wrap flexlayout">
				<button class="reset-btn" @click="resetData">重置</button>
				<button class="add-btn" @click="getSign">生成</button>
			</div>
			<div class="sign-example" v-show="isshowSignResult">
				<p>字串拼接：</p>
				<p>{{ stringPingjie }}</p>
				<p>Sha256签名并按base64编码：</p>
				<p>{{ signSha256 }}</p>
			</div>
		</div>
	</WoolShowmodal>
</template>

<script>
import hexToBase64 from '../plugins/hexToBase64.js';
import Sha256 from '../plugins/sha256.js';
export default {
	name: 'SignDebug',
	props: {
		isshow: Boolean,
	},
	components: {
		WoolShowmodal: () => import('../component/WoolShowmodal.vue'),
		WoolTextArea: () => import('../component/WoolTextArea.vue')
	},
	data() {
		return {
			isShowCheckAccess: window.$cookie.get('_WF_ACCESSKEY') && window.$cookie.get('_WF_ACCESSID'),
			pageType: 'WF',
			accessId: '',
			accessIdErr: '',
			accessKey: '',
			accessKeyErr: '',
			isshowTurnBase64: false,
			postParam: '', //post内容体
			hyContentSign: '',
			noise: '',
			noiseErr: '',
			stringPingjie: '',
			signSha256: '',
			isshowSignResult: false,
			isNeedAccess: false
		};
	},
	methods: {
		checkAccess() {
			this.$nextTick(() =>{
				if(!this.isNeedAccess) {
					this.accessKey = window.$cookie.get('_WF_ACCESSKEY');
					this.accessId = window.$cookie.get('_WF_ACCESSID');
				} else {
					this.accessId = 'H-0965f39101cb-0965f39101cb';
					this.accessKey = 'EE0HQXh43wlA0Pvrwfp7N+wU+zr4vADOHqzu07sD5EY=';
				}
			})
		},
		// 设置默认字
		setFirstData() {
			this.accessId = 'H-0965f39101cb-0965f39101cb';
			this.accessKey = 'EE0HQXh43wlA0Pvrwfp7N+wU+zr4vADOHqzu07sD5EY=';
			this.postParam = '{"test":"abc"}';
			this.hyContentSign = new Sha256().update(this.postParam).digestBase64();
			this.noise = 'a34f2b5e9077dd05';
		},
		// 重置数据
		resetData() {
			this.isNeedAccess = false;
			this.accessId = '';
			this.accessIdErr = '';
			this.accessKey = '';
			this.accessKeyErr = '';
			this.isshowTurnBase64 = false;
			this.postParam = '';
			this.hyContentSign = '';
			this.noise = '';
			this.noiseErr = '';
			this.stringPingjie ='';
			this.signSha256 = '';
			this.isshowSignResult = false;
		},
		turnBase64() {
			this.accessKey = hexToBase64(this.accessKey);
		},
		verifyAccessId() {
			let accessId = this.accessId;
			this.accessIdErr = '';
			if (!accessId) {
				this.accessIdErr = 'access_id输入不能为空';
			}
		},
		verifyAccessKey() {
			let accessKey = this.accessKey;
			this.accessKeyErr = '';
			if (!accessKey) {
				this.accessKeyErr = 'access_key输入不能为空';
				return;
			}
			let reg = /^[0-9a-zA-Z]+$/;
			if (accessKey.length == 64 && reg.test(accessKey)) {
				this.accessKeyErr = '请输入base格式的access_key, 您也可以';
				this.isshowTurnBase64 = true;
				return;
			}
		},
		verifyNoise() {
			this.noiseErr = '';
			if (!this.noise) {
				this.noiseErr = this.pageType + '-Noise输入不能为空';
			}
		},
		verifypostParam() {
			let postParam = this.postParam;
			this.hyContentSign = new Sha256().update(postParam).digestBase64();
		},
		getSign() {
			this.verifyAccessId();
			this.verifyAccessKey();
			this.verifyNoise();
			this.verifypostParam();
			if(this.accessIdErr || this.accessKeyErr || this.noiseErr) {
				return;
			}
			let serviceName = this.$route.query.name;
			let stringPingjie = serviceName + this.accessId + this.accessKey + this.noise + this.hyContentSign;
			this.stringPingjie = stringPingjie;
			this.signSha256 = new Sha256().update(stringPingjie).digestBase64();
			this.isshowSignResult = true;
		}
	},
	mounted() {
		this.setFirstData();
	}
};
</script>

<style scoped="scoped">
.sign-debug {
	background-color: white;
	width: 700px;
	height: calc(100vh - 50px);
	padding: 12px;
	padding-top: 50px;
}
.sign-debug-item {
	align-items: center;
	margin-bottom: 10px;
}
.sign-debug-item-key {
	width: 110px;
}
.sign-debug-item-value {
	width: 80%;
	resize: none;
	padding: 10px;
}
.verify-info {
	color: red;
	font-size: 12px;
	padding-bottom: 10px;
}
.try-handle {
	cursor: pointer;
	color: #095280;
}
.btn-wrap {
	justify-content: flex-end;
	padding: 20px;
	background-color: white;
}
.reset-btn {
	height: 40px;
	width: 100px;
	border: 1px solid #BBBBBB;
	color: #333333;
	margin-left: 10px;
	cursor: pointer;
}
.sign-example {
	font-size: 14px;
	margin: 10px;
	word-break: break-all;
	border-top: 1px double #dedede;
	padding-top: 10px;
}
</style>
