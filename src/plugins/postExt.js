import wf from 'weforward-protocol'
import extend from '../utils/extend.js'
/**
 * 扩展请求封装，默认返回原始数据
 * @param {Object} serviceName 服务名例如:tain
 * @param {Object} wfparams 浩宁原始请求参数，例如
 * {
    "wfReq": {
      	resId:'',
      	traceId:'',
      	tenatId:'',
      	ver:'1.0'
   },
   "invoke": {
      "method": "test",
      "params": {
         "param1": "value1"
      }
   }
}
 * 
 * 
 * @param {Object} config，例如：
 * {
		 wfconfig:{
		 //自定义头
		 headers: {},
		 accessId: 'accessKey',
		 accessKey: 'accessKey',
	 }
 }
 * 
 */
export default async function postExt(serviceName, params, config) {
	if (!serviceName) {
		throw new Error('缺少参数：serviceName');
	}
	params = await wf.exchangeFormValues(params);
	let _wfparams = extend(true, {
			wfReq: {
				ver: '1.0'
			},
			invoke: {
				method: '',
				params: {}
			},
		},
		params);
	if (!params.invoke.method) {
		throw new Error('缺少参数：params.invoke.method');
	}
	let url = serviceName + '?method=' + _wfparams.invoke.method;
	let _config = extend(true, {
		wfconfig: {
			waitTimeout: null,
			wfReq: _wfparams.wfReq,
			resDataMode: 2,
			accessId: '',
			accessKey: '',
		}
	}, config);
	let _wfconfig = _config.wfconfig;
	if (!_wfconfig.accessId || !_wfconfig.accessKey) {
		_wfconfig.accessId = '';
		_wfconfig.accessKey = '';
	}
	return wf.post(url, _wfparams.invoke.params, _config);
}
