<template>
	<div v-if="message" class="page-loading">{{ message }}</div>
	<div v-else-if="!selectedDoc" class="page-loading"><WoolShowLoading :isshow="true" /></div>
	<div class="doc" v-else>
		<!--左边的文档目录结构-->
		<div class="catalog wt-scroll" @dblclick="tohub = !tohub">
			<div class="catalog-title">
				<h3>文档结构图</h3>
				<div class="flexlayout catalog-versions" v-if="docVersion.length > 1">
					<p>文档版本选择</p>
					<select v-model="selectedDocVersion">
						<option v-for="(version, i) in docVersion" :key="i" :value="version">{{ version }}</option>
					</select>
				</div>
				<DocTreeCatalog :tohub="tohub" v-if="catalogList.length > 0" :items="catalogList"></DocTreeCatalog>
			</div>
		</div>
		<!--右边的的文档目录结构-->
		<section class="content wt-scroll" ref="content">
			<div class="content-title content-detail">
				<h1>
					<a :id="((selectedDoc.name || '') + '接口文档') | formatIdToPinyin">{{ selectedDoc.name || '' }}接口文档</a>
					<span v-if="selectedDoc.description">({{ selectedDoc.description }})</span>
				</h1>
				<h2 class="bigtitle" v-if="selectedDoc.modifies.length"><a :id="'修订信息' | formatIdToPinyin">修订信息</a></h2>
				<table v-if="selectedDoc.modifies.length">
					<thead>
						<th>时间</th>
						<th>内容</th>
						<th>修订人</th>
					</thead>
					<tbody>
						<tr v-for="(item, index) in selectedDoc.modifies" :key="index">
							<td style="width: 300px;">{{ new Date(item.date).format('yyyy-MM-dd HH:mm:ss') }}</td>
							<td>{{ item.content }}</td>
							<td>{{ item.author }}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<section class="content-detail">
				<div class="content-detail-box content-detail-box-big">
					<h2 ref="bigtitle">接口协议</h2>
					<p>接口基于http协议，使用utf-8编码传输。</p>
					<div class="content-detail-box boxdetail">
						<h3 ref="twotitle"><a :id="'请求链接' | formatIdToPinyin">请求链接</a></h3>
						<p>接口地址：http:{{ $wf.getBaseUrl() }}/{{ serviceName }} 或 https:{{ $wf.getBaseUrl() }}/{{ serviceName }}</p>
						<!-- <p>测试access_id: {{ accessId }}</p>
						<p>测试access_key: {{ accessKey }}</p> -->
						<!-- <p>正式环境：待定</p> -->
						<h3 ref="twotitle" style="padding-top: 20px;"><a :id="'请求头' | formatIdToPinyin">请求头</a></h3>
						<table class="tableDatil content-detail-box-table">
							<thead>
								<th width="200">名称</th>
								<th>说明</th>
							</thead>
							<tbody>
								<tr v-for="(haeder, index) in requestHeaders" :key="index">
									<td>{{ haeder.name }}</td>
									<td><div v-html="haeder.desc"></div></td>
								</tr>
							</tbody>
						</table>
						<p>sign生成过程：</p>
						<div class="detail-border-box ">
							<ul>
								<li>
									按以下顺序拼接字串，过滤空项：
									<div>{{ serviceName }}+{access_id}+{access_key}+{WF-Noise}+{WF-Tag}+{WF-Content-Sign}</div>
								</li>
								<li>对已上的字串进行SHA256签名，得到sign_data</li>
								<li>Base64.encode(sign_data)，得到最终的base64字串</li>
							</ul>
						</div>
						<p>
							sign示例：
							<span class="font_14 try-handle" @click="isshowSignDebug = true">试一试</span>
						</p>
						<div class="detail-border-box">
							<p>
								<span>access_id</span>
								=
								<!-- {{accessId}} -->
								H-0965f39101cb-0965f39101cb
							</p>
							<p>
								<span>access_key</span>
								=
								<!-- {{accessKey}} -->
								EE0HQXh43wlA0Pvrwfp7N+wU+zr4vADOHqzu07sD5EY=
							</p>
							<p>
								<span>WF-Noise</span>
								= a34f2b5e9077dd05
							</p>
							<p>
								<span>请求体</span>
								= {"test":"abc"}
							</p>
							<p>
								<span>WF-Content-Sign</span>
								<!-- = o08rXpB33QV3Qt4uoZnHMS30xSp1mXC88IzsrOEp+ck= -->
								{{ hyContentSign }}
							</p>
							<p>
								<span>WF-Tag</span>
								= 无
							</p>
							<div class="sign-example">
								<p>字串拼接：</p>
								<p>{{ stringPingjie }}</p>
								<p>Sha256签名并按base64编码：</p>
								<p>{{ signSha256 }}</p>
							</div>
						</div>
					</div>
					<div class="content-detail-box boxdetail">
						<h3 ref="twotitle"><a :id="'响应头' | formatIdToPinyin">响应头</a></h3>
						<table class="tableDatil content-detail-box-table">
							<thead>
								<th width="200">WF-Tag</th>
								<th>下次请求需带上。</th>
							</thead>
						</table>
					</div>
					<div class="content-detail-box boxdetail">
						<h3 ref="twotitle"><a :id="'请求体' | formatIdToPinyin">请求体</a></h3>
						<p>必须保证wf_req节点在最前面。</p>
						<div class="detail-border-box"><textarea readonly="readonly" :value="JSON.stringify(hyReq, null, '\t')"></textarea></div>
						<p>参数说明：</p>
						<table class="tableDatil content-detail-box-table">
							<thead>
								<th width="200">名称</th>
								<th>说明</th>
								<th>是否必填</th>
							</thead>
							<tbody>
								<tr v-for="(param, index) in requestParamsDesc" :key="index">
									<td>{{ param.name }}</td>
									<td>
										<div v-html="param.desc"></div>
										<div v-if="param.name == 'ver'">
											<span style="color: red">当前版本：{{ selectedDocVersion }}</span>
										</div>
									</td>
									<td>{{ param.ismust }}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="content-detail-box boxdetail">
						<h3 ref="twotitle"><a :id="'响应体' | formatIdToPinyin">响应体</a></h3>
						<div class="detail-border-box"><textarea readonly="readonly" :value="JSON.stringify(hyResp, null, '\t')"></textarea></div>
						<p>内容说明：</p>
						<table class="tableDatil content-detail-box-table">
							<thead>
								<th width="200">名称</th>
								<th>说明</th>
								<th>是否必填</th>
							</thead>
							<tbody>
								<tr v-for="(desc, index) in responseDescs" :key="index">
									<td>{{ desc.name }}</td>
									<td><div v-html="desc.desc"></div></td>
									<td>{{ desc.ismust }}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="content-detail-box boxdetail">
						<h3 ref="twotitle"><a :id="'网关响应码（wf_code）' | formatIdToPinyin">网关响应码（wf_code）</a></h3>
						<table class="tableDatil content-detail-box-table">
							<tbody>
								<tr v-for="(code, index) in hyCodes" :key="index">
									<td width="200">{{ code.id }}</td>
									<td>{{ code.desc }}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="content-detail-box boxdetail">
						<h3 ref="twotitle"><a :id="'微服务方法响应码' | formatIdToPinyin">微服务方法响应码</a></h3>
						<table class="tableDatil content-detail-box-table">
							<tbody>
								<tr v-for="(code, index) in selectedDoc.status_codes" :key="index">
									<td width="200">{{ code.code }}</td>
									<td>{{ code.message }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				<div class="content-detail-box content-detail-box-big" v-if="selectedDoc.special_words && selectedDoc.special_words.length">
					<h2 ref="bigtitle"><a :id="'名词与约定' | formatIdToPinyin">名词与约定</a></h2>
					<div class="content-detail-box boxdetail" v-for="(special, index) in selectedDoc.special_words" :key="index">
						<h3>
							<a :id="special.name | formatIdToPinyin">{{ special.name }}</a>
						</h3>
						<p v-if="special.description">{{ special.description }}</p>
						<table class="tableDatil content-detail-box-table" v-if="special.table_items.length">
							<thead v-if="special.table_header">
								<tr>
									<th width="200">{{ special.table_header.key }}</th>
									<th>{{ special.table_header.value }}</th>
									<!-- <td>{{special.table_header.description}}</td> -->
								</tr>
							</thead>
							<tbody>
								<tr v-for="(type, tpindex) in special.table_items" :key="tpindex">
									<td width="200">{{ type.key }}</td>
									<td>{{ type.value }}</td>
									<!-- <td>{{ type.description }}</td> -->
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div class="content-detail-box content-detail-box-big">
					<h2 ref="bigtitle"><a :id="'数据类型' | formatIdToPinyin">数据类型</a></h2>
					<table class="tableDatil content-detail-box-table">
						<tbody>
							<tr v-for="(type, index) in dataTypes" :key="index">
								<td width="200">{{ type.name }}</td>
								<td>{{ type.message }}</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="content-detail-box content-detail-box-big">
					<h2 ref="bigtitle">通用对象</h2>
					<div class="content-detail-box boxdetail" v-for="item in selectedDoc.objects" :key="item.name">
						<h3 ref="twotitle">
							<div class="flexlayout">
								<a :id="item.name | formatIdToPinyin">{{ item.name }}</a>
								<a @click="downLoadObjectForJava(item)" class="font_14 btn-download-javabean">下载javabean</a>
							</div>
							<a :id="(item.description + item.name) | formatIdToPinyin">{{ item.description }}</a>
						</h3>
						<!-- <h3>{{ item.description }}{{ item.name }}</h3> -->
						<ObjectTableTree :tohub="tohub" :detail="item"></ObjectTableTree>
					</div>
				</div>
				<div class="content-detail-box content-detail-box-big">
					<h2 ref="bigtitle">方法列表</h2>
					<div class="content-detail-box boxdetail" v-for="item in selectedDoc.methods" :key="item.name">
						<h3>
							<a :id="item.name | formatIdToPinyin">
								<span v-if="item.title">{{ item.title | lineToHub(tohub) }}</span>
								<span v-else>{{ item.name | lineToHub(tohub) }}</span>
							</a>
							<span class="font_14 try-handle" @click="showTestRequest(item)">试一试</span>
						</h3>
						<p>
							方法名： {{ item.name | lineToHub(tohub) }}
							<span class="font_14 btn-copytext" @click="copyTextForMethod(item.name, tohub)">复 制</span>
						</p>
						<p>描述： {{ item.description }}</p>
						<p>
							参数：
							<span v-if="!item.params.length">无</span>
						</p>
						<MethodTableTree :tohub="tohub" :objects="selectedDoc.objects" :detail="item"></MethodTableTree>
						<p>
							返回值：
							<span v-if="!item.returns.length">无</span>
						</p>
						<MethodTableTree :tohub="tohub" :objects="selectedDoc.objects" :detail="item" type="returns"></MethodTableTree>
					</div>
				</div>
			</section>
		</section>
		<TestRequest @testresult="getTestresult" :servicename="serviceName" :item="testItem" :isshow="isshowTestRequest" @toggle="isshowTestRequest = false"></TestRequest>
		<TestRequestResult :result="testRequestResult" :isshow="isshowTestRequestResult" @toggle="isshowTestRequestResult = false"></TestRequestResult>
		<SignDebug :isshow="isshowSignDebug" @toggle="isshowSignDebug = false"></SignDebug>
	</div>
</template>

<script>
import Sha256 from '../plugins/sha256.js';
import Pinyin from '../plugins/pinyin.js';
import storage from '../utils/storage.js';
import docutils from '../utils.js';
function fiexLinkId(str) {
	let _str = str.replace(/（|）/g, '');
	_str = _str.replace(/\//g, '__');
	return Pinyin.getFullChars(_str);
}
export default {
	name: 'devopsdoc',
	components: {
		WoolShowLoading: () => import('../component/WoolShowLoading.vue'),
		DocTreeCatalog: () => import('../component/DocTreeCatalog.vue'),
		ObjectTableTree: () => import('../component/ObjectTableTree.vue'),
		MethodTableTree: () => import('../component/MethodTableTree.vue'),
		TestRequest: () => import('../component/TestRequest.vue'),
		TestRequestResult: () => import('../component/TestRequestResult.vue'),
		SignDebug: () => import('../component/SignDebug.vue')
	},
	data() {
		return {
			tohub: false,
			message: null,
			isshowSignDebug: false,
			serviceName: this.$route.query.name,
			docsDetail: [],
			selectedDocVersion: '',
			selectedDoc: null,
			accessId: '待定', //H-0965f39101cb-0965f39101cb
			accessKey: '待定', //EE0HQXh43wlA0Pvrwfp7N+wU+zr4vADOHqzu07sD5EY=
			requestHeaders: [
				{
					name: 'Content-Type',
					desc: `内容格式。<br/>取值：application/json;charset=utf-8`
				},
				{
					name: 'WF-Noise',
					desc: `长度为16，包含小写字母与数字，且不重复的字串`
				},
				{
					name: 'WF-Content-Sign',
					desc: `请求体的SHA256签名的base64字串`
				},
				{
					name: 'WF-Tag',
					desc: `接口返回的头信息，下次请求需带上。`
				},
				{
					name: 'Authorization',
					desc: `验证类型。<br/>格式：WF-SHA2+空格+{access_id}:{sign}`
				}
			],
			signSha256: '',
			hyContentSign: '',
			requestParamsDesc: [
				// 请求参数说明
				{
					name: 'wf_req',
					desc: `网关请求节点。`,
					ismust: '是'
				},
				{
					name: 'ver',
					desc: `指定调用的微服务版本号。`,
					ismust: '否'
				},
				{
					name: 'invoke',
					desc: `微服务调用节点`,
					ismust: '是'
				},
				{
					name: 'method',
					desc: `调用的方法名称`,
					ismust: '是'
				},
				{
					name: 'params',
					desc: `调用的方法参数`,
					ismust: '否'
				}
			],
			responseDescs: [
				// 响应说明
				{
					name: 'wf_resp',
					desc: `网关响应节点。`,
					ismust: '是'
				},
				{
					name: 'wf_code',
					desc: `网关响应码`,
					ismust: '是'
				},
				{
					name: 'wf_msg',
					desc: `网关响应码说明`,
					ismust: '是'
				},
				{
					name: 'result',
					desc: `微服务方法的结果`,
					ismust: '是'
				},
				{
					name: 'code',
					desc: `方法的响应码`,
					ismust: '是'
				},
				{
					name: 'msg',
					desc: `方法的响应码说明`,
					ismust: '是'
				},
				{
					name: 'content',
					desc: `方法的具体返回值`,
					ismust: '否'
				}
			],
			hyCodes: [
				{
					id: 0,
					desc: '成功'
				},
				{
					id: 1001,
					desc: 'Access Id 无效'
				},
				{
					id: 1002,
					desc: '验证失败'
				},
				{
					id: 1003,
					desc: '验证类型无效'
				},
				{
					id: 1101,
					desc: '序列化/反序列化异常（内容格式解析异常）'
				},
				{
					id: 1102,
					desc: '无效请求内容'
				},
				{
					id: 1501,
					desc: '拒绝调用'
				}
			],
			dataTypes: [
				{
					name: 'Number',
					message: '数字'
				},
				{
					name: 'String',
					message: '字串'
				},
				{
					name: 'Boolean',
					message: '布尔值'
				},
				{
					name: 'Date',
					message: "日期。采用GMT时间格式表示的字串:yyyy-MM-dd'T'HH:mm:ss.SSS'Z'，如2019-10-29T00:30:00.666Z"
				},
				{
					name: 'List',
					message: '列表'
				},
				{
					name: 'Object',
					message: '对象。详见通用对象'
				}
			],
			catalogList: [],
			stringPingjie: '',
			isshowTestRequest: false,
			isshowTestRequestResult: false,
			testRequestResult: {},
			testItem: {}
		};
	},
	watch: {
		tohub(val) {
			storage.set('_devops_doc_tohub', val);
		},
		selectedDocVersion(val) {
			let doc = this.docsDetail.filter(item => {
				return item.version == this.selectedDocVersion;
			});
			let selectedDoc = doc[0];
			let special_words = selectedDoc.special_words || selectedDoc.special_wrods || [];
			delete selectedDoc.special_wrods;
			selectedDoc.special_words = special_words;
			this.selectedDoc = selectedDoc;
		}
	},
	computed: {
		hyReq() {
			let req = {
				wf_req: {
					ver: this.selectedDocVersion
				},
				invoke: {
					method: 'methodA',
					params: {
						param1: 'value1'
					}
				}
			};
			return req;
		},
		hyResp() {
			let hyResp = {
				wf_resp: {
					wf_code: 0,
					wf_msg: ''
				},
				result: {
					code: 0,
					msg: '',
					content: {}
				}
			};
			return hyResp;
		},
		docVersion() {
			let docVersion = [];
			this.docsDetail.forEach(item => {
				docVersion = [...docVersion, item.version];
			});
			return docVersion;
		}
	},
	mounted() {
		this.tohub = storage.get('_devops_doc_tohub') === 'true';
		window.addEventListener('hashchange', () => {
			this.checkHash();
		});
	},
	filters: {
		//下划线转驼峰
		lineToHub(name, tohub) {
			if (!name || !tohub) {
				return name;
			}
			return name.replace(/\_([a-z])/g, (all, letter) => {
				return letter.toUpperCase();
			});
		},
		formatIdToPinyin(desc) {
			return fiexLinkId(desc);
		}
	},
	methods: {
		//下载javaBean
		downLoadObjectForJava(item) {
			docutils.downLoadObjectForJava(item);
		},
		fiexLinkId: fiexLinkId,
		checkHash() {
			let hash = window.decodeURIComponent(location.hash);
			if (hash) {
				hash = fiexLinkId(hash);
				let elem = document.querySelector(hash);
				if (elem) {
					elem.scrollIntoView();
				}
			}
		},
		getTestresult(val) {
			if (val) {
				this.isshowTestRequest = false;
				this.isshowTestRequestResult = true;
				this.testRequestResult = val;
			}
		},
		showTestRequest(item) {
			this.isshowTestRequest = true;
			this.testItem = item;
			this.testItem.version = this.selectedDocVersion;
		},
		copyTextForMethod(text = '', tohub) {
			if (tohub) {
				text = this.serviceName + '?method=' + text.replace(/\_([a-z])/g, (all, letter) => letter.toUpperCase());
			}
			if (this.$wool.copyText(text)) {
				this.$wool.showsucc('已复制');
			}
		},
		copyText(text) {
			if (this.$wool.copyText(text)) {
				this.$wool.showsucc('已复制');
			}
		},
		getDocData() {
			let baseurl = this.$route.query.url||this.$wf.getBaseUrl();
			this.message = null;
			this.$wf
				.axios(baseurl + '/__wf_doc/' + this.serviceName)
				.then(res => {
					this.docsDetail = res.docs;
					this.selectedDocVersion = this.docsDetail[0].version; // 默认选择第一个版本
					this.hyContentSign = new Sha256().update('{"test":"abc"}').digestBase64();
					let accessId = 'H-0965f39101cb-0965f39101cb';
					let accessKey = 'EE0HQXh43wlA0Pvrwfp7N+wU+zr4vADOHqzu07sD5EY=';
					let stringPingjie = this.serviceName + accessId + accessKey + 'a34f2b5e9077dd05' + this.hyContentSign;
					this.stringPingjie = stringPingjie;
					this.signSha256 = new Sha256().update(stringPingjie).digestBase64();
					this.$nextTick(() => this.getCatalogInfo());
				})
				.catch(err => {
					if (err.request && err.request.status == '404') {
						this.message = '该服务尚未提供文档！';
					} else {
						this.message = '获取' + this.serviceName + '文档信息失败' + err.message;
					}
				});
		},
		// 组织左边的树状结构
		getCatalogInfo() {
			let catalogList = [];
			let obj = {
				title: this.selectedDoc.name + '接口文档'
			};
			catalogList.push(obj);
			if (this.selectedDoc.modifies.length) {
				let xdxx = {
					title: '修订信息'
				};
				catalogList.push(xdxx);
			}
			let jiekouxyObj = {
				title: '接口协议',
				childTitles: [
					{
						title: '请求链接'
					},
					{
						title: '请求头'
					},
					{
						title: '响应头'
					},
					{
						title: '请求体'
					},
					{
						title: '响应体'
					},
					{
						title: '网关响应码（wf_code）'
					},
					{
						title: '微服务方法响应码'
					}
				]
			};
			catalogList.push(jiekouxyObj);
			if (this.selectedDoc.special_words &&this.selectedDoc.special_words.length) {
				let mcydobj = {
					title: '名词与约定'
				};
				mcydobj.childTitles = [];
				this.selectedDoc.special_words.forEach(item => {
					mcydobj.childTitles.push({
						title: item.name
					});
				});
				catalogList.push(mcydobj);
			}
			let sjlxdobj = {
				title: '数据类型'
			};
			catalogList.push(sjlxdobj);
			if (this.selectedDoc.objects && this.selectedDoc.objects.length) {
				let tydxdobj = {
					title: '通用对象'
				};
				tydxdobj.childTitles = [];
				this.selectedDoc.objects.forEach((item, index) => {
					tydxdobj.childTitles.push({
						title: item.name
					});
				});
				catalogList.push(tydxdobj);
			}
			// console.log('this.selectedDoc.methods', this.selectedDoc.methods);
			if (this.selectedDoc.methods && this.selectedDoc.methods.length > 0) {
				let fxlbdobj = {
					title: '方法列表',
					childTitles: []
				};
				fxlbdobj.childTitles = this.selectedDoc.methods.map(item => {
					return {
						title: item.name,
						description: item.title || item.description
					};
				});
				catalogList.push(fxlbdobj);
			}
			this.catalogList = catalogList;
			this.$nextTick(() => {
				setTimeout(() => this.checkHash(), 200);
			});
		}
	},
	created() {
		if(this.$route.query.url){
			this.$wf.setBaseHosts(this.$route.query.url)
		}
		this.getDocData();
	}
};
</script>

<style scoped="scoped">
.page-loading {
	padding-top: 200px;
	text-align: center;
	font-size: 14px;
	color: #aaa;
}
.catalog {
	width: 260px;
	position: fixed;
	left: 0;
	top: 0;
	height: calc(100vh - 40px);
	background-color: #f7f7f7;
	padding: 15px;
}
.catalog-versions {
	margin-top: 12px;
	font-size: 15px;
}
.catalog-versions > select {
	margin-left: 10px;
}
.content {
	width: calc(100vw - 300px);
	height: calc(100vh - 20px);
	color: #000000;
	position: fixed;
	right: 0;
	top: 0;
	padding-bottom: 20px;
}
.content-title > h1 {
	text-align: center;
	padding-top: 20px;
}
.content-title > p {
	text-align: center;
	padding-top: 20px;
	color: #999999;
}
.content-detail {
	width: 86%;
	margin: 0 auto;
}
.content-detail-box {
	margin-top: 20px;
}
.content-detail-box > p {
	font-size: 14px;
	padding-top: 20px;
}
.content-detail-box-table {
	margin-top: 20px !important;
}
.btn-copytext,
.try-handle {
	cursor: pointer;
	padding: 5px 10px;
	border-radius: 3px;
	margin-left: 10px;
	font-weight: normal;
}
.try-handle {
	background-color: #095280;
	color: white;
}
.btn-copytext {
	background-color: #f1f1f1;
}
.detail-border-box {
	padding: 5px;
	border: 1px solid #dedede;
	margin-top: 10px;
}
.detail-border-box > textarea {
	width: 100%;
	min-height: 200px;
	border: none;
	resize: none;
}
.detail-border-box > ul {
	margin-left: 20px;
	font-size: 14px;
}
.detail-border-box > ul > li {
	margin: 10px;
}
.detail-border-box > p {
	font-size: 14px;
	padding: 10px;
}
.detail-border-box > p > span {
	font-weight: bold;
}
.sign-example {
	font-size: 14px;
	margin: 10px;
	word-break: break-all;
	border-top: 1px double #dedede;
	padding-top: 10px;
}
.btn-download-javabean {
	line-height: 30px;
	text-decoration: underline;
	margin-left: 10px;
	color: #095280;
	cursor: pointer;
}
</style>
