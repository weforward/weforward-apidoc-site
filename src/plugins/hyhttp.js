/**
 * 该包装插件基于axios包装，用于请求网关数据
 * 主要功能：简化业务的请求参数和配置，提供统一的登录和退出登录方法，实现简单的负载均衡
 */
import axios from 'axios';
import cookie from '../utils/cookie.js'
import Sha256 from './sha256.js';
import hexToBase64 from './hexToBase64.js';

import extend from '../utils/extend.js'
window.extend = extend;
const env_type = window._wool_global_env_type;
//加密
import shiftencrypt from './shiftencrypt.js'
window.shiftencrypt = shiftencrypt;
//解密
import shiftdecrypt from './shiftdecrypt.js'
window.shiftdecrypt = shiftdecrypt;
import storage from '../utils/storage.js'
const NODE_ENV = process.env.NODE_ENV;
//鉴权链接
let baseURL = '';
//默认服务名
let _baseServiceName = '';
//默认开发环境的服务名
let _baseDevServiceName = '';
//生产环境可选的网关域名
let _optionsURLs = [];
let _hyBaseUrl = '';
//测试环境可选的浩云域名
let _optionsTestURLs = [];
let _hyTestBaseUrl = '';
//开发环境可选的网关域名
let _optionsDevURLs = [];
let _hyDevBaseUrl = '';
//允许重试最大次数
let _maxretrycount = 1;
let instance;
//浩云验证登录的code
//浩云异常监听事件
const HY_EVENTS = {};
//浩云业务层全局参数
const HY_GLOBAL = {};
//全局配置参数
const GLOBALCONFIG = {};
//成功回调时是否轮流切换url
let ISRECYCLEURLS = false;
//默认1,0:不转换，1、下划线转驼峰，2、兼容默认，转驼峰的同时保留原属性
let RES_DATA_ATTR_NAME_STYLE = 1;
//默认1,0:不转换驼峰，1、下划线转驼峰
let REQ_DATA_ATTR_NAME_STYLE = 1;
//默认0，0:纯业务数据，1:包含code等信息的包装数据(需要登录或者无访问权限时不受该参数控制)
let RES_DATA_MODE = 0;
//网关服务tag
const HY_SERVICE_TAGS = storage.tem.getObj('__HY_SERVICE_TAGS') || {};
//需要配置浩云数据请求配置文件
let HYCONFIG = window._WOOL_HY_CONFIG;
//开发环境服务名映射
const SERVICENAMEMAP = {};
window.SERVICENAMEMAP = SERVICENAMEMAP;
//环境服务名版本
const SERVICE_VERSIONS = {};
//自定义事件
const CUSTOMEVENTS = [];
const NOAUTHDEFCONFIG = {
	withoutaccessid: true,
	resDataMode: 0,
	resDataAttrNameStyle: 1,
};
//租户信息
let TENANT = '';
if (HYCONFIG) {
	HYCONFIG.developmentHosts = HYCONFIG.testHosts = HYCONFIG.productionHosts = HYCONFIG.hosts;
} else {
	let developServiceName = process.env.VUE_APP_DEV_SERVICENAME || '';
	if (developServiceName.match(/,|:/)) {
		developServiceName.split(',').forEach(item => {
			if (!item) {
				return;
			}
			let kv = item.split(':');
			if (kv.length == 1) {
				SERVICENAMEMAP[kv[0]] = kv[0];
				return;
			}
			SERVICENAMEMAP[kv[0]] = kv[1];
		});
		developServiceName = '';
	}
	HYCONFIG = {
		productionHosts: exchangeHostToHosts(process.env.VUE_APP_HY_HOST_PRODUCT),
		testHosts: exchangeHostToHosts(process.env.VUE_APP_HY_HOST_TEST),
		developmentHosts: exchangeHostToHosts(process.env.VUE_APP_HY_HOST_DEV),
		developServiceName: developServiceName
	};
}

function getHyTag(serviceName) {
	return HY_SERVICE_TAGS[serviceName] || '';
}

function setHyTag(serviceName, tag = '') {
	if (HY_SERVICE_TAGS[serviceName] !== tag) {
		HY_SERVICE_TAGS[serviceName] = tag;
		storage.tem.setObj('__HY_SERVICE_TAGS', HY_SERVICE_TAGS);
	}
}

function exchangeHostToHosts(hostdesc) {
	let _host = (hostdesc || '').split(',');
	return _host;
}
//记录失败的接口调用信息
const API_FAIL_RECORD = {};
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
//请求次数计数器
let requestCounter = 0;
//配置域名
setHyBaseHosts.apply(null, HYCONFIG.productionHosts);
setHyTestBaseHosts.apply(null, HYCONFIG.testHosts);
setHyDevBaseHosts.apply(null, HYCONFIG.developmentHosts);
if (HYCONFIG.developServiceName) {
	setHyDevBaseService(HYCONFIG.developServiceName);
}


/**
 * 执行回调
 * @param {String} event
 * @param {Object} data
 */
function fireEvents(event, data) {
	if (event === 'requireauth') {
		//实际情况是，多个请求同事触发，为了避免频繁所有的请求同事要求登录，因此需要限制触发的频率
		let lastFireOauthTime = Number(storage.tem.get('__HY_LAST_FIRE_OAUTH_TIME') || '0');
		let nowTime = Date.now();
		let deltaTime = nowTime - lastFireOauthTime;
		if (deltaTime > 0 && deltaTime < 3000) {
			console.log('已拒绝授权请求');
			return;
		}
		storage.tem.set('__HY_LAST_FIRE_OAUTH_TIME', nowTime);
	}
	let events = HY_EVENTS[event];
	if (events && events.length > 0) {
		for (let item of events) {
			item(data);
		}
	}
}

//转换返回的数据值，ios
function exchangeBackDataValues(data) {
	if (!data) {
		return data;
	}
	if (typeof data == 'string' && data.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}z$/gi)) {
		return new Date(data);
	}
	if (Array.isArray(data)) {
		let array = [];
		data.forEach(item => {
			array.push(exchangeBackDataValues(item));
		});
		return array;
	}
	if (!isPlainObject(data)) {
		return data;
	}
	let _data = {};
	for (let key in data) {
		let oldData = data[key];
		_data[key] = exchangeBackDataValues(data[key]);
	}
	return _data;

}
//转换返回的数据
function exchangeBackData(data, mode) {
	//数据转换
	data = exchangeBackDataValues(data);
	let globalMode = RES_DATA_ATTR_NAME_STYLE;
	let _mode = globalMode;
	if (mode >= 0 && mode <= 2) {
		_mode = mode;
	}
	return exchangeObjAttrNameLineToHump(data, _mode);
}

/**
 * 自定义处理全局异常响应码事件
 * @param {Object} eventName 事件名
 * @param {Object} matchedHandler 匹配函数，函数接受一个参数(错误码)，用于匹配，返回的结果应为true或false
 */
function customResErrorEvent(eventName, matchedHandler) {
	CUSTOMEVENTS.push({
		event: eventName,
		handler: matchedHandler
	});
}

function getProtocolPre(str = '') {
	return ((GLOBALCONFIG.protocolPre || 'WF') + '').toLowerCase() + str;
}

function getProtocolHeaderPre(str = '') {
	return getProtocolPre('-').toUpperCase() + str;
}

function getProtocolResParams(str = '') {
	return getProtocolPre('_') + str;
}

function WeforwardError(message, code) {
	this.message = message;
	this.code = code;
	this.toString = function() {
		return this.message;
	};
}
//返回的异常数据统一处理
axios.interceptors.response.use(res => {
	let data = res.data;
	if (!data) {
		return res;
	}
	//来自网关的数据
	let reqhyconfig = res.config.hyconfig;
	if (reqhyconfig) {
		let resDataMode = reqhyconfig.resDataMode;
		if (resDataMode == -1) {
			resDataMode = RES_DATA_MODE;
		}
		//返回原始结果
		if (resDataMode == 2) {
			return res;
		}
		let serviceName = reqhyconfig.url.split('?')[0] || getBaseService();
		if (isDevelopment() && SERVICENAMEMAP[serviceName]) {
			serviceName = SERVICENAMEMAP[serviceName];
		}
		let hytag = res.headers[getProtocolHeaderPre('Tag').toLowerCase()] || '';
		let reqTagName = getProtocolHeaderPre('Tag');
		let reqTagValue = res.config.headers[reqTagName];
		if (hytag != reqTagValue) {
			setHyTag(serviceName, hytag);
		}
		if (ISRECYCLEURLS) {
			//轮流切换url
			recycleUrl(getBaseUrl());
		}
		let resDataAttrNameStyle = reqhyconfig.resDataAttrNameStyle;
		if (resDataAttrNameStyle == -2) {
			resDataAttrNameStyle = RES_DATA_ATTR_NAME_STYLE;
		}
		//浩云层异常码处理
		let hyresp = data[getProtocolResParams('resp')];
		let loginErrorMsg = GLOBALCONFIG.loginErrorMsg;
		let hyCode = hyresp[getProtocolResParams('code')];
		if (hyCode !== 0) {
			let errorMsg = hyresp[getProtocolResParams('msg')];
			if ([1001, 1002, 1501].indexOf(hyCode) != -1) {
				if (hyCode == 1501 && !!reqhyconfig.accessId) {
					//有登陆过但是无法调用，提示无访问权限
					fireEvents('visitforbidden', result);
					throw new WeforwardError(errorMsg, hyCode);
				}
				let isNeedLogin = true;
				if ((hyCode == 1001 || hyCode == 1002) && !!reqhyconfig.accessId) {
					let logincounter = Number(storage.tem.get('__HY_LAST_LOGIN_TIME') || 0);
					//短时间登录过一次了，直接抛错
					if (Date.now() - logincounter < 3000) {
						isNeedLogin = false;
					}
				}
				if (isNeedLogin) {
					//需要验证登录
					if (loginErrorMsg) {
						errorMsg = loginErrorMsg;
					}
					removeLoginInfo();
					fireEvents('requireauth', errorMsg);
				}
			}
			throw new WeforwardError(errorMsg, hyCode);
		}
		//上传或者下载业务处理
		if (hyresp.res_url) {
			return exchangeBackData(data, resDataAttrNameStyle);
		}
		//业务层异常码处理
		let result = data.result;
		let code = result.code;
		if (code !== 0) {
			let errorMsg = result.msg;
			let haslogininfo = !!reqhyconfig.accessId;
			if ([10002, 10003].indexOf(code) != -1) {
				if (code == 10002 && haslogininfo) {
					//有登陆过但是无法调用，提示无访问权限
					fireEvents('visitforbidden', result);
					throw new Error(errorMsg);
				}
				let isNeedLogin = true;
				if (code == 10003 && haslogininfo) {
					let logincounter = Number(storage.tem.get('__HY_LAST_LOGIN_TIME') || 0);
					//短时间内登录过一次了，直接抛错
					if (Date.now() - logincounter < 3000) {
						isNeedLogin = false;
					}
				}
				if (isNeedLogin) {
					//需要验证登录
					if (loginErrorMsg) {
						errorMsg = loginErrorMsg;
					}
					removeLoginInfo();
					fireEvents('requireauth', errorMsg);
				}
				throw new WeforwardError(errorMsg, code);
			}
			//自定义错误码拦截
			for (let item of CUSTOMEVENTS) {
				if (item.handler(code)) {
					fireEvents(item.event, result);
					throw new WeforwardError(errorMsg, code);
				}
			}
			if (resDataMode == 1) {
				return exchangeBackData(result, resDataAttrNameStyle);
			} else {
				throw new WeforwardError(errorMsg, code);
			}
		}
		let returnret = resDataMode == 1 ? result : result.content;
		return exchangeBackData(returnret, resDataAttrNameStyle);
	}
	//非网关的服务请求直接返回业务数据
	return data;
}, err => {
	if (err && err.config && err.config.hyconfig && err.request) {
		//浩云异常处理，负载均衡实现
		let axioscfg = err.config;
		let reqcode = err.request.readyState || -1;
		let res = err.response;
		let rescode = res ? res.status : 0;
		let hycfg = axioscfg.hyconfig;
		//开启切换url并且，不是每次请求都指定baseURL的情况下，执行轮流切换url
		if (!ISRECYCLEURLS && !hycfg.baseURL) {
			if (rescode >= 500 || (!res && reqcode >= 0)) {
				let baseUrl = getBaseUrl();
				let newbaseUrl = updateBaseUrl(baseUrl);
				if (newbaseUrl) {
					//重试机制
					hycfg.retryedcount = hycfg.retryedcount || 0;
					if (hycfg.retryable === true || hycfg.retryedcount < _maxretrycount) {
						let _reqparams = JSON.parse(axioscfg.data).invoke.params;
						let _hycfg = extend(true, {}, hycfg);
						_hycfg.retryedcount++;
						return post(hycfg.url, _reqparams, {
							hyconfig: _hycfg
						});
					}
				}
			}
		}
	}
	throw err;
});

function isProduction() {
	return env_type === 'production';
}

function isDevelopment() {
	return NODE_ENV === 'development'
}

function getBaseUrls() {
	if (isDevelopment()) {
		return _optionsDevURLs;
	}
	return isProduction() ? _optionsURLs : _optionsTestURLs;
}

function getBaseUrl() {
	if (isDevelopment()) {
		return _hyDevBaseUrl;
	}
	return isProduction() ? _hyBaseUrl : _hyTestBaseUrl;
}
/**
 * 循环使用baseUrl
 * @param {Object} baseUrl
 */
function recycleUrl(baseUrl) {
	let urls = getBaseUrls();
	//有1一个以上的url时有效
	if (urls.length < 2) {
		return baseUrl;
	}
	let curindex = urls.indexOf(baseUrl);
	let nextIndex = curindex + 1;
	if (nextIndex >= urls.length) {
		//一轮完成，从第一个开始
		nextIndex = 0;
	}
	let newurl = urls[nextIndex];
	saveBaseUrl(newurl);
	return newurl;
}
/**
 * 更新默认的基础网关域名
 */
function updateBaseUrl(baseUrl) {
	if (!baseUrl) {
		return;
	}
	API_FAIL_RECORD[baseUrl] = Date.now();
	let mintime = 0;
	let fiturl = null;
	let urls = getBaseUrls();
	for (let url of urls) {
		let recordtime = API_FAIL_RECORD[url] || 0;
		if (!fiturl || mintime > recordtime) {
			fiturl = url;
			mintime = recordtime;
		}
	}
	//距离最旧切换的链接的时间较短时，基本说明全部链接都有问题，暂不切换
	if (Date.now() - mintime < 10 * 1000) {
		return;
	}
	saveBaseUrl(fiturl);
	return fiturl;
}

function saveBaseUrl(url) {
	if (isProduction()) {
		_hyBaseUrl = url;
	} else if (isDevelopment()) {
		_hyDevBaseUrl = url;
	} else {
		_hyTestBaseUrl = url;
	}
}
/**
 * @param {Object} obj是否文件类型对象（包括Blob和File类型）
 */
function isTypeFile(obj) {
	return isObjectTypeOf(obj, 'File') || isObjectTypeOf(obj, 'Blob');
}
/**
 * 是否文件集合
 * @param {Object} obj
 */
function isTypeFiles(obj) {
	return isObjectTypeOf(obj, 'FileList');
}
/**
 * 是否为指定类型的对象
 * @param {Object} obj
 * @param {Object} type
 */
function isObjectTypeOf(obj, type) {
	return null !== obj && typeof obj == 'object' && obj.constructor.name == type;
}
/**
 * @param {Object} obj 是否纯数据对象
 */
function isPlainObject(obj) {
	return Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
}
/**
 * 
 * @param {Object} data 按照递归的方式
 * 对属性值进行转换，File对象转base64字串，Date对象转ISO字串
 */
function exchangeFormValues(data) {
	if (data instanceof Date) {
		return data.toISOString();
	} else if (isPlainObject(data)) {
		for (let key in data) {
			let ret = exchangeFormValues(data[key]);
			data[key] = ret;
		}
	} else if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i++) {
			let ret = exchangeFormValues(data[i]);
			data[i] = ret;
		}
	} else if (isTypeFiles(data)) {
		let list = [];
		for (let file of data) {
			let ret = exchangeFormValues(file);
			list.push(ret);
		}
		return list;
	}
	return data;
}

//驼峰转下划线
function humpToLine(name) {
	if (!name) {
		return name;
	}
	return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}
//对象的属性名由驼峰转下划线
function exchangeObjAttrNameHumpToLine(params) {
	if (Array.isArray(params)) {
		let array = [];
		params.forEach(item => {
			array.push(exchangeObjAttrNameHumpToLine(item));
		});
		return array;
	}
	if (!isPlainObject(params)) {
		return params;
	}
	let _params = {};
	for (let key in params) {
		let _key = humpToLine(key);
		_params[_key] = exchangeObjAttrNameHumpToLine(params[key]);
	}
	return _params;
}
//下划线转驼峰
function lineToHub(name) {
	if (!name) {
		return name;
	}
	return name.replace(/\_([a-z])/g, (all, letter) => {
		return letter.toUpperCase();
	});
}
//对象的属性名由下划线转驼峰
function exchangeObjAttrNameLineToHump(params, mode) {
	if (!mode) {
		return params;
	}
	if (Array.isArray(params)) {
		let array = [];
		params.forEach(item => {
			array.push(exchangeObjAttrNameLineToHump(item, mode));
		});
		return array;
	}
	if (!isPlainObject(params)) {
		return params;
	}
	let _params = {};
	for (let key in params) {
		let _key = lineToHub(key);
		let oldData = params[key];
		_params[_key] = exchangeObjAttrNameLineToHump(params[key], mode);
		if (key == 2) {
			//兼容模式，保留原属性
			_params[key] = oldData;
		}
	}
	return _params;
}

function noAccessPost(url, params, config) {
	let _config = extend(true, {
		hyconfig: { ...NOAUTHDEFCONFIG
		},
	}, config);
	return post(url, params, _config);
}

async function post(url, params, config) {
	//请求数据前的监听事件触发
	fireEvents('beforerequest');
	let _config = extend(true, {}, config);
	let headers = extend(true, {}, _config.headers);
	//浩云层的配置
	let hyconfig = _config.hyconfig = extend(true, {
		url: url,
		//网关域名
		baseURL: getBaseUrl(),
		//返回数据模式
		resDataMode: -2,
		//返回数据属性名风格
		resDataAttrNameStyle: -2,
		//请输入数据属性名风格
		reqDataAttrNameStyle: -2,
		//自定义头
		headers: headers,
		//网关请求参数，可选
		hyReq: {
			resId: '',
			traceId: '',
			ver: '',
			waitTimeout: -1
		},
		accessId: instance.getHyAccessId(),
		accessKey: instance.getHyAccessKey(),
	}, _config.hyconfig);
	_config.baseURL = hyconfig.baseURL;
	//校验网关
	checkHost(_config.baseURL);
	let accessId = hyconfig.accessId;
	let accessKey = fixHyAccessKeyToBase64(hyconfig.accessKey);
	//值转换
	let _params = exchangeFormValues(extend(true, {}, params));
	//全局参数
	_params._global = extend(true, {}, HY_GLOBAL, _params._global);
	let _global = exchangeFormValues(_params._global);
	_params._global = _global;
	let splitIndex = url.indexOf('?');
	let baseService = getBaseService();
	if (isDevelopment() && SERVICENAMEMAP[baseService]) {
		baseService = SERVICENAMEMAP[baseService];
	}
	let _url = baseService;
	let hyextparams = '';
	let _pms = {
		method: ''
	};
	if (-1 !== splitIndex) {
		_url = url.substring(0, splitIndex) || baseService;
		if (isDevelopment() && SERVICENAMEMAP[_url]) {
			_url = SERVICENAMEMAP[_url];
		}
		hyextparams = url.substring(splitIndex + 1, url.length);
		for (let item of hyextparams.split('&')) {
			let keyvalue = item.split('=');
			_pms[keyvalue[0]] = keyvalue[1] || '';
		}
	}
	let serviceName = _url;
	if (!serviceName) {
		throw new Error('参数异常：未指定请求服务名');
	}
	if (_pms.method) {
		_pms.method = humpToLine(_pms.method);
	} else {
		throw new Error('参数异常：未指定请求方法名');
	}
	let hyReq = {
		//微服务版本
		ver: SERVICE_VERSIONS[serviceName] || '',
		traceId: '',
		resId: '',
		waitTimeout: -1
	};
	if (hyconfig.hyReq) {
		hyReq = extend(true, hyReq, hyconfig.hyReq);
	}
	hyReq = exchangeFormValues(hyReq);
	let waitTimeout = hyReq['waitTimeout'];
	if (typeof waitTimeout != 'number' || waitTimeout <= 0) {
		waitTimeout = GLOBALCONFIG['waitTimeout'] || 0;
	}
	if (typeof waitTimeout == 'number' && waitTimeout > 0) {
		hyReq['waitTimeout'] = waitTimeout;
		_config.timeout = waitTimeout * 1000;
	} else {
		delete hyReq['waitTimeout'];
	}
	let hyReqName = getProtocolPre('Req');
	_params = {
		[hyReqName]: hyReq,
		invoke: extend(true, _pms, {
			//业务层参数
			params: _params,
		})
	};
	//属性名转换
	let reqDataAttrNameStyle = hyconfig.reqDataAttrNameStyle;
	if (reqDataAttrNameStyle == -2) {
		reqDataAttrNameStyle = REQ_DATA_ATTR_NAME_STYLE;
	}
	if (reqDataAttrNameStyle === 1) {
		//请求参数转驼峰模式
		_params = exchangeObjAttrNameHumpToLine(_params);
	}
	let hyTag = headers[getProtocolHeaderPre('Tag')] || getHyTag(serviceName);
	headers[getProtocolHeaderPre('Tag')] = hyTag;
	if (accessId && accessKey && hyconfig.ignoreauth !== true && hyconfig.withoutaccessid != true) {
		//唯一字串
		let hynoise = Number(Date.now() + (++requestCounter)).toString(16);
		let content = JSON.stringify(_params);
		//签名：参数内容+唯一字串+鉴权账号
		let hyContentSign = new Sha256().update(content).digestBase64();
		headers[getProtocolHeaderPre('Content-Sign')] = hyContentSign;
		let signDataStr = serviceName + accessId + accessKey + hynoise + hyTag + hyContentSign;
		let sign = new Sha256().update(signDataStr).digestBase64();
		headers['Authorization'] = getProtocolHeaderPre('SHA2') + ' ' + accessId + ':' + sign;
		headers[getProtocolHeaderPre('Noise')] = hynoise;
	} else {
		headers['Authorization'] = getProtocolHeaderPre('None');
	}
	_config.headers = headers;
	return axios.post(_url, _params, _config);
}

function checkHost(url, existurls) {
	var reg = new RegExp(/^((\w+):)*\/\/([^/:]+)(:\d*)?(\/)*$/, 'g')
	if (!url || !url.match(reg)) {
		throw new Error('配置的域名：\n' + url + '\n无效,\n\n正确的域名格式示例：\nhttps://abc.cn\nhttps://abc.cn:8081\n//abc.cn:8088');
	}
	if (existurls && existurls.indexOf(url) != -1) {
		throw new Error('不能配置重复的域名：' + url);
	}
}


/**
 * 配置生产服务请求域名（请求服务的urls）
 * @param {String} urls 支持多个参数url用于负载均衡
 */
function setHyBaseHosts(...urls) {
	let _urls = [];
	for (let url of urls) {
		if (url) {
			checkHost(url, _urls);
			_urls.push(url);
		}
	}
	_optionsURLs = _urls;
	if (_optionsURLs.length > 0) {
		_hyBaseUrl = _urls[0];
	}
}
/**
 * 配置测试环境默认请求拦截（请求服务的urls）
 * @param {String} urls 支持多个参数url用于负载均衡
 */
function setHyTestBaseHosts(...urls) {
	let _urls = [];
	for (let url of urls) {
		if (url) {
			checkHost(url, _urls);
			_urls.push(url);
		}
	}
	_optionsTestURLs = _urls;
	if (_urls.length > 0) {
		_hyTestBaseUrl = _urls[0];
	}
}
/**
 * 配置开发环境默认请求拦截（请求服务的urls）
 * @param {String} urls 支持多个参数url用于负载均衡
 */
function setHyDevBaseHosts(...urls) {
	let _urls = [];
	for (let url of urls) {
		if (url) {
			checkHost(url, _urls);
			_urls.push(url);
		}
	}
	_optionsDevURLs = _urls;
	if (_urls.length > 0) {
		_hyDevBaseUrl = _urls[0];
	}
}

/**
 * 配置基础服务名称
 * @param {Object} serviceName 服务名称,至少一位及以上，数字，字母，下划线
 */
function setHyBaseService(serviceName) {
	chckServiceName(serviceName);
	_baseServiceName = serviceName;
}
/**
 * 配置开发环境基础服务名称
 * @param {Object} serviceName 服务名称,至少一位及以上，数字，字母，下划线
 */
function setHyDevBaseService(serviceName) {
	chckServiceName(serviceName);
	_baseDevServiceName = serviceName;
}

function getBaseService() {
	if (!_baseDevServiceName) {
		return _baseServiceName;
	}
	return isDevelopment() ? _baseDevServiceName : _baseServiceName;
}

function chckServiceName(serviceName) {
	if (!serviceName) {
		return;
	}
	if (!serviceName.match(/^[\d|a-z|_]{1,}$/i)) {
		throw new Error('服务名称匹配字符为数字、字母、下划线');
	}

}

function removeLoginInfo() {
	cookie.remove('_HY_ACCESSID', '/');
	cookie.remove('_HY_ACCESSKEY', '/');
	cookie.remove('_HY_ACCESSEXPIRE', '/');
	cookie.remove('omni-ssss', '/');
	storage.tem.remove('__HY_LAST_LOGIN_TIME');
	storage.tem.remove('__HY_LAST_FIRE_OAUTH_TIME');
}

function onlogined(data, resove) {
	let cookieExpire = data.cookieExpire || 0;
	let cookiePath = data.cookiePath || '/';
	cookie.set('_HY_ACCESSID', data.accessId, cookieExpire, cookiePath);
	cookie.set('_HY_ACCESSKEY', data.accessKey, cookieExpire, cookiePath);
	if (data.accessExpire) {
		cookie.set('_HY_ACCESSEXPIRE', data.accessExpire, cookieExpire, cookiePath);
	}
	if (data.sessionId) {
		cookie.set('omni-ssss', data.sessionId, cookieExpire, cookiePath);
	}
	storage.tem.set('__HY_LAST_LOGIN_TIME', Date.now());
	if (typeof resove == 'function') {
		resove(data);
	}
}

function fixHyAccessKeyToBase64(key) {
	if (!key) {
		return '';
	}
	if (key.length == 64) {
		//64长度的为16进制的
		return hexToBase64(key);
	} else {
		//其他的当做base64格式的
		return key;
	}
}
//刷新access
function refreshAccess() {
	const access_id = instance.getHyAccessId();
	const access_key = instance.getHyAccessKey();
	let url = GLOBALCONFIG['refreshAccessURl'] || 'zuoche_user?method=refresh_access';
	return new Promise((resove, reject) => {
		noAccessPost(url, {
			access_id: access_id,
			access_key: access_key,
		}).then(data => {
			//刷新成功
			onlogined(data);
		}).catch(e => {
			//刷新失败，删掉过期时间
			cookie.remove('_HY_ACCESSEXPIRE', '/');
		});
	});
}

//定时器，检查检查是否需要更新access
setInterval(function() {
	let expire = cookie.get('_HY_ACCESSEXPIRE');
	if (!expire) {
		return;
	}
	if (Number(expire) - Date.now() < 5 * 60 * 1000) {
		//当有效期小于5分钟时刷新
		refreshAccess();
	}
}, 2 * 60 * 1000);
/**
 * 对外提供的方法
 */
instance = {
	/**
	 * 设置浩云数据请求异常（非业务异常，例如：网络链接错误或者，response的status为500,502,503,504之类的）时,单个请求可重试的次数
	 * 【注意：仅当配置了多个可选的网关域名，并且距离最久没有调用过的域名的时间超过了10秒时才生效】
	 * @param {Number} count 可选数值0~3,默认1
	 */
	setHyMaxRetryCount(count) {
		if (typeof count == 'number' && count >= 0 && count <= 3) {
			_maxretrycount = count;
		} else {
			throw new Error('可重试次数值应为为0-3之间（包含）的数字');
		}
	},
	/**
	 * 获取浩云鉴权id
	 */
	getHyAccessId() {
		return cookie.get('_HY_ACCESSID');
	},
	/**
	 * 获取浩云鉴权key
	 */
	getHyAccessKey() {
		return cookie.get('_HY_ACCESSKEY');
	},
	post: post,
	//用法同post，默认忽略access获取数据
	noAccessPost: noAccessPost,
	//原始的axios，可用于普通的数据请求
	axios: axios,
	/**
	 * @param {Object} url 请求上传的微服务所需要url
	 * @param {Object} params 请求上传的微服务所需要的参数
	 * @param {Object} file 需要上传文件,file必须为是Blob或File对象,每次只能上传一个
	 * @param {Object} config，如果配置了hyconfig,resDataAttrNameStyle此处配置不生效，强制驼峰模式
	 * 关于监听上传进度的配置,请配置hyconfig的onUploadProgress属性：function(e){
		 
	 }
	 * {hyconfig:{onUploadProgress:onUploadProgress}}
	 * 
	 */
	async upload(url, params, file, config) {
		if (!file) {
			throw new Error('参数异常：未指定要上传的文件‘file’');
		}
		if (!isTypeFile(file)) {
			throw new Error('参数异常：file必须为是Blob或File对象');
		}
		let _config = extend(true, config, {
			hyconfig: {
				//返回数据强制下划线转驼峰
				resDataAttrNameStyle: 1,
			},
		});
		return new Promise(async (resoved, reject) => {
			let backData = null;
			try {
				let data = await post(url, params, _config);
				//处理返回的数据
				let resDataMode = _config.hyconfig.resDataMode === undefined ? -1 : _config.hyconfig.resDataMode;
				if (resDataMode == -2) {
					resDataMode = RES_DATA_MODE;
				}
				if (resDataMode == 1) {
					backData = data.result;
				} else {
					backData = data.result.content;
				}
				let hyResp = data[getProtocolPre('Resp')];
				if (!hyResp.resUrl) {
					reject({
						message: '上传异常：未返回上传通道',
						data: backData
					});
					return;
				}
				let fileFormData = new FormData();
				fileFormData.append('file', file);
				let uploaddata = await axios.post(hyResp.resUrl, fileFormData, {
					onUploadProgress: _config.hyconfig.onUploadProgress
				});
				let resData = uploaddata.request ? uploaddata.data : uploaddata;
				if (resData && resData.code != 0) {
					reject({
						message: resData.msg || resData || '上传失败',
						data: backData
					});
					return;
				}
				resoved(backData);
			} catch (e) {
				if (backData) {
					reject({
						message: e.message,
						data: backData
					});
					return;
				}
				reject(e);
			}
		});
	},
	/**
	 * @param {Object} url 请求下载的微服务所需要url
	 * @param {Object} params 请求下载的微服务所需要的参数
	 * @param {Object} config 如果配置了hyconfig,resDataAttrNameStyle此处配置不生效，强制驼峰模式,
	 * 下载接口的hyconfig配置，此处新增一个notAutoDownload属性用于配置是否不自动打开连接Boolean类型，默认为false,也就是默认自动打开，特殊情况可能不需要自动打开，例如上传文件后
	 */
	async download(url, params, config) {
		let _config = extend(true, config, {
			hyconfig: {
				resDataAttrNameStyle: 1
			}
		});
		return new Promise(async (resoved, reject) => {
			try {
				let data = await post(url, params, _config);
				let hyResp = data[getProtocolPre('Resp')];
				if (!hyResp.resUrl) {
					reject(new Error('下载异常：未返回下载通道'));
				}
				resoved(hyResp);
				if (!_config.hyconfig.notAutoDownload) {
					location.href = hyResp.resUrl;
				}
			} catch (e) {
				reject(e);
			}
		});
	},
	/**
	 * 浩云统一登录
	 * @param {String} username 用户名
	 * @param {String} password 密码
	 * 
	 * @return {Promise}
	 */
	login(username, password) {
		return new Promise((resove, reject) => {
			let url = GLOBALCONFIG['loginUrl'] || 'zuoche_user?method=login';
			noAccessPost(url, {
				userName: username,
				password: password,
			}, {
				hyconfig: {
					reqDataAttrNameStyle: 1
				}
			}).then(data => {
				if (data.accessId && data.accessKey) {
					onlogined(data, resove);
					return;
				}
				reject(new Error('登录异常：' + JSON.stringify(data)));
			}).catch(e => {
				reject(e);
			});
		});
	},
	/**
	 * 穿越登录功能
	 * @param {String} username 穿越用户名
	 * @param {String} password 穿越用户密码
	 * @param {String} suloginname 被穿越者登录名
	 */
	su(username, password, suloginname) {
		return new Promise(async (resove, reject) => {
			try {
				let url = GLOBALCONFIG['loginUrl'] || 'zuoche_user?method=login';
				let data = await noAccessPost(url, {
					userName: username,
					password: password,
				}, {
					hyconfig: {
						reqDataAttrNameStyle: 1
					}
				});
				let suurl = GLOBALCONFIG['suUrl'] || 'zuoche_user?method=su';
				data = await noAccessPost(suurl, {
					userName: suloginname,
					suId: data.sessionId
				}, {
					hyconfig: {
						reqDataAttrNameStyle: 1
					}
				});
				if (data.accessId && data.accessKey) {
					onlogined(data, resove);
					return;
				}
				reject(new Error('登录异常：' + JSON.stringify(data)));
			} catch (e) {
				reject(e);
			}
		});
	},
	/**
	 * 退出登录，不会有失败的情况
	 */
	logout(options) {
		let promise = new Promise((resove, reject) => {
			let url = GLOBALCONFIG['logoutUrl'] || 'zuoche_user?method=logout';
			noAccessPost(url, {
				accessId: instance.getHyAccessId()
			}).finally(() => {
				removeLoginInfo();
				resove();
			})
		});
		return promise;
	},
	/**
	 * 添加网关请求事件监听
	 * @param {String} event 监听的事件名，可选事件:requireauth--表示需要登录监听事件,visitforbidden--表示无访问权限监听事件,beforerequest--表示请求数据前的时间
	 * @param {Function} handler
	 */
	addEventListener(event, handler) {
		if (!event) {
			return;
		}
		if (typeof handler != 'function') {
			return;
		}
		let events = HY_EVENTS[event];
		if (!events) {
			HY_EVENTS[event] = [];
		} else if (HY_EVENTS[event].indexOf(handler) !== -1) {
			//不允许有重复的
			return;
		}
		HY_EVENTS[event].push(handler);
	},
	/**
	 * 移除请求异常的事件监听
	 * @param {String} event 事件名称
	 * @param {Function} handler 待移除的监听事件，不指定时移除全部监听
	 */
	removeEventListener(event, handler) {
		if (!event) {
			return;
		}
		let events = HY_EVENTS[event];
		if (!handler) {
			delete HY_EVENTS[event];
			return;
		}
		let index = -1;
		if (events && (index == events.indexOf(handler) != -1)) {
			events.splice(index, 1);
		}
	},
	/**
	 * 移除全部监听
	 */
	removeAllEventListener() {
		for (let key in HY_EVENTS) {
			delete HY_EVENTS[key];
		}
	},
	/**
	 * 配置生产服务请求域名（请求服务的urls）【优先级高于通过hyconfig.json的配置】
	 * @param {String} urls 支持多个参数url用于负载均衡
	 */
	setHyBaseHosts,
	/**
	 * 配置测试环境默认请求拦截（请求服务的urls）【优先级高于通过hyconfig.json的配置】
	 * @param {String} urls 支持多个参数url用于负载均衡
	 */
	setHyTestBaseHosts,
	/**
	 * 配置开发环境默认请求拦截（请求服务的urls）【优先级高于通过hyconfig.json的配置】
	 * @param {String} urls 支持多个参数url用于负载均衡
	 */
	setHyDevBaseHosts,
	/**
	 * 配置基础服务名称【优先级高于通过hyconfig.json的配置】
	 * @param {String} serverName
	 */
	setHyBaseService,
	/**
	 * 配置开发环境基础服务名称
	 * @param {String} serverName
	 */
	setHyDevBaseService,
	/**
	 * 配置微服务版本
	 * @param {String} serviceName 正式环境服务名
	 * @param {String} version 大版本号例如：1.0
	 */
	setServiceVersion: function(serviceName, version) {
		if (!serviceName) {
			return;
		}
		if (version) {
			SERVICE_VERSIONS[serviceName] = version;
		} else {
			delete SERVICE_VERSIONS[serviceName];
		}
	},
	/**
	 * 更新全局属性
	 * @param {String} name 可以选的全局属性名
	 * 
	 * resDataMode:返回的数据模式，默认0，0:纯业务数据，1:包含code等信息的包装数据(需要登录或者无访问权限时不受该参数控制),2、表示返回原始请求数据，此时不针对数据做任何加工处理
	 * resDataAttrNameStyle: 返回数据属性名转换模式，默认1,0:不转换，1、下划线转驼峰，2、兼容默认，转驼峰的同时保留原属性
	 * reqDataAttrNameStyle:Number类型，用于配置请求数据属性名的风格，不指定时默认读取全局配置，0表示不作处理，1表示驼峰转下划线
	 * loginErrorMsg:String类型，用于配置需要登录的提示
	 * loginUrl:String类型，用于配置需要自定义登录的url
	 * logoutUrl:String类型，用于配置需要自定义退出登录的url
	 * suUrl:String类型，模拟登陆 url
	 * waitTimeout:Number 单位秒
	 * protocolPre:String 协议头
	 */
	updateGlobalConfig: function(name, value) {
		if (name == 'resDataMode') {
			let val = Number(value);
			if (typeof value != 'number' || (val !== 0 && val !== 1 && val !== 2)) {
				throw new Error(name + '的可选数值为0~1');
			}
			RES_DATA_MODE = val;
			return;
		}
		if (name == 'resDataAttrNameStyle') {
			let val = Number(value);
			if (typeof value != 'number' || (val !== 0 && val !== 1 && val !== 2)) {
				throw new Error(name + '的可选数值为0~2');
			}
			RES_DATA_ATTR_NAME_STYLE = val;
			return;
		}
		if (name == 'reqDataAttrNameStyle') {
			let val = Number(value);
			if (typeof value != 'number' || (val !== 0 && val !== 1)) {
				throw new Error(name + '的可选数值为0~2');
			}
			REQ_DATA_ATTR_NAME_STYLE = val;
			return;
		}
		GLOBALCONFIG[name] = value;
	},
	/**
	 * 配置全局参数
	 * @param {String} key 参数名
	 * @param {String,Number,Boolean} value 参数值 
	 */
	putGlobalParam(key, value) {
		if (value == null || value === undefined) {
			value = '';
		}
		if (typeof key != 'string' || !key) {
			throw new Error('key:' + key + '必须为非空字串');
		}
		if (typeof value == 'string' || typeof value == 'number' || typeof value == 'boolean') {
			HY_GLOBAL[key] = value;
		} else {
			throw new Error('value可选类型为String,Number,Boolean');
		}
	},
	/**
	 * 获取全局参数值
	 * @param {String} key
	 */
	getGlobalParam(key) {
		return HY_GLOBAL[key];
	},
	/**
	 * 删除全局参数值
	 * @param {String} key
	 */
	removeGlobalParam(key) {
		delete HY_GLOBAL[key];
	},
	//自定义全局响应错误码拦截事件
	customResErrorEvent,
	//保存登录信息（内部或插件使用）
	onlogined,
	exchangeFormValues,
	//获得编译版本信息
	getBuildInfo() {
		return extend(true, {
			version: '',
			buildTime: '',
			buildType: '',
			buildPluginName: ''
		}, window._WOOL_HY_DATA);
	},
	//获取当前的基础url
	getBaseUrl
};
export default instance;
