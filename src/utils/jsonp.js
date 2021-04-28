function toparams(obj) {
	if (typeof obj != 'object') {
		return '';
	}
	var arr = [];
	for (var key in obj) {
		arr.push(key + '=' + encodeURIComponent(obj[key] || ''));
	}
	return arr.join('&');
}
export default function(url, params) {
	let callbackname = 'wooljsonp_' + Date.now();
	let pms = Object.assign({
		callback: callbackname,
	}, params);
	return new Promise((resoved, reject) => {
		let head = document.querySelector('head');
		let script = document.createElement('script');
		script.setAttribute('src', url + '?' + toparams(pms));
		script.setAttribute('type', 'text/javascript');
		window[pms.callback] = function(data) {
			delete window[pms.callback];
			head.removeChild(script);
			resoved(data);
		};
		script.onerror = function(e) {
			delete window[pms.callback];
			head.removeChild(script);
			reject(e);
		};
		head.appendChild(script);
	});
}
