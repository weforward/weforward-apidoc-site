//http://abc.com?a=1&b=2解析为{a:1,b:2}
function serialize(url) {
	var query = {};
	if (!url) {
		return query;
	}
	url = this.trim(url).split("#")[0];
	if (url.indexOf('?') > -1) {
		url = url.split('?')[1] || '';
	} else {
		url = '';
	}
	if (!url) {
		return query;
	}
	const arrys = url.split('&');
	for (let item of arrys) {
		let arr = item.split('=');
		if (arr.length > 0) {
			let key = this.trim(arr[0]);
			query[key] = decodeURIComponent(this.trim(arr[1]) || '');
		}
	}
	return query;
}
/**
 * 参数对象转查询字串
 */
function param(obj) {
	if (typeof obj != 'object') {
		return '';
	}
	var arr = [];
	for (var key in obj) {
		arr.push(key + '=' + encodeURIComponent(obj[key] || ''));
	}
	return arr.join('&');
}

function parseUrlLastFold(url) {
	if (!url) {
		return '';
	}
	let lastindex = url.lastIndexOf('/');
	return url.substring(0, lastindex + 1);
}

export default {
	serialize,
	param,
	parseUrlLastFold
}
