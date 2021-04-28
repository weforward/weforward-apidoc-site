import extend from './extend.js'
import urlutil from './url.util.js'
let _space;

let apis = {
	set(key, value) {
		this.storage.setItem(this.getKey(key), value);
	},
	get(key) {
		return this.storage.getItem(this.getKey(key));
	},
	remove(key) {
		this.storage.removeItem(this.getKey(key))
	},
	clear() {
		this.storage.clear();
	},
	setObj(key, obj) {
		this.storage.setItem(this.getKey(key), JSON.stringify(obj));
	},
	getObj(key) {
		var val = this.storage.getItem(this.getKey(key));
		if (val) {
			return JSON.parse(val);
		}
		return val;
	},
	getKey(key) {
		if (this.pre) {
			return this.pre + key;
		}
		return key;
	}
};
let exports = {
	//普通存储
	storage: window.localStorage,
	//会话存储
	tem: {
		storage: window.sessionStorage
	},
	//具备命名空间的存储
	space: {
		setPreName(preName) {
			this.pre = preName;
			this.tem.pre = preName;
			if (preName.length > 0) {
				let parentPre = preName.substring(preName.length - 1, preName.length);
				if (parentPre == '/') {
					this.parent.pre = urlutil.parseUrlLastFold(preName.substring(0,preName.length-1));
					this.tem.parent.pre = this.parent.pre;
				}
			}
		},
		//空间前缀
		pre: null,
		storage: window.localStorage,
		tem: {
			pre: null,
			storage: window.sessionStorage,
			parent: {
				pre: null,
				storage: window.sessionStorage
			}
		},
		parent: {
			pre: null,
			storage: window.localStorage
		}
	},
};
[exports, exports.tem, exports.space, exports.space.tem, exports.space.parent, exports.space.tem.parent].forEach(item => {
	extend(item, apis);
});
export default exports;
