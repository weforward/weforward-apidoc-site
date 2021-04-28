document.body.addEventListener('touchstart', function() {});
import jsonp from './jsonp.js'
import extend from './extend.js'
import stringutil from './string.util.js'
import urlutil from './url.util.js'
const trim = stringutil.trim;
let EMPTY = '';
let CSSOVERRIDE;
//什么都不执行的函数
const FNEMPTY = function() {};
const UDF = undefined;
const NUMBERREG = /^(0|[1-9][0-9]{0,9})(\.[0-9]{1,})?$/;
//保存不同key的定时器id
const DELAYS_KEYS = {};
// 倒计格式化所需参数
const t_second = 1;
const t_min = 60 * t_second;
const t_hour = 60 * t_min;
const t_day = 24 * t_hour;
let timercount = 0;

//缓存函数
let Tween = {
	linear: function(t, b, c, d) {
		return c * t / d + b;
	},
	easeOut: function(t, b, c, d) {
		return -c * (t /= d) * (t - 2) + b;
	},
	easeIn: function(t, b, c, d) {
		return c * (t /= d) * t + b;
	},
	easeOutQuint: function(t, b, c, d) {
		return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
	},
	easeOutBack: function(t, b, c, d) {
		if ((t /= d) < 1 / 2.75) {
			return c * 7.5625 * t * t + b;
		} else if (t < 2 / 2.75) {
			return c * (7.5625 * (t -= 1.5 / 2.75) * t + .75) + b;
		} else if (t < 2.5 / 2.75) {
			return c * (7.5625 * (t -= 2.25 / 2.75) * t + .9375) + b;
		} else {
			return c * (7.5625 * (t -= 2.625 / 2.75) * t + .984375) + b;
		}
	}
};

function isObject(obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
}
/**
 * 当前时间毫秒数
 */
function timestamp() {
	return Date.now();
}


//动画类（基于缓动函数的时间的变化通知）
function Animation(options) {
	timercount++;
	var opt = extend({
		//动画过渡时间
		duration: 500,
		//定时器名称
		name: '',
		//循环后开始下一轮的延时
		recycleDelay: 0,
		//动画是否循环
		isrecycle: false,
		//动画每帧变动处理回调
		ontick: FNEMPTY,
		//动画结束事件
		onfinish: FNEMPTY,
		//动画开始循环事件
		onrecycle: FNEMPTY,
		//每秒钟，ontick的次数倒数
		framenum: 60
	}, options);
	opt.name = opt.name || 'timer' + timercount;
	var instant = this;
	//开始时间
	var starttime;
	//累计时间
	var t;
	//状态-未执行
	var state = 0;
	//暂停时间，累计时间
	var pausetime, pauseplus = 0;

	function ontick() {
		var animator = function(callback) {
			setTimeout(callback, 1e3 / opt.framenum);
		};
		animator(function() {
			if (state == 4 || state == 3 || state == 2) {
				return;
			}
			t = timestamp() - starttime - pauseplus;
			var timedout = t >= opt.duration;
			if (timedout) {
				state = 2;
				//完成
				t = opt.duration;
			}
			opt.ontick.call(instant);
			if (state == 1) {
				ontick();
			} else {
				if (opt.isrecycle && state == 2) {
					setTimeout(function() {
						if (isFn(opt.onrecycle)) {
							opt.onrecycle.call(instant);
						}
						if (state == 2) {
							instant.reset().run();
						} else {
							opt.onfinish.call(instant);
						}
					}, opt.recycleDelay);
				} else if (isFn(opt.onfinish)) {
					opt.onfinish.call(instant);
				}
			}
		}, opt.framenum);
	}

	//执行动画
	this.run = function() {
		if (state == 0) {
			starttime = timestamp();
			state = 1;
			//动画中
			ontick();
		}
		return instant;
	};
	//停止正在执行的动画
	this.stop = function() {
		state = 3;
		return instant;
	};
	this.reset = function() {
		t = state = pausetime = pauseplus = 0;
		return instant;
	};
	//暂停或运动
	this.toggle = function() {
		if (instant.isRunning()) {
			instant.pause();
		} else if (instant.isPause()) {
			instant.resume();
		}
		return instant;
	};
	//动画暂停
	this.pause = function() {
		if (state == 1 || state == 2) {
			state = 4;
			pausetime = timestamp();
		}
		return instant;
	};
	//暂停后继续执行动画
	this.resume = function() {
		if (instant.isPause()) {
			pauseplus = pauseplus + timestamp() - pausetime;
			state = 1;
			ontick();
		}
		return instant;
	};
	/*
	 * 判断是否在执行动画
	 * 动画中返回true，否则返回false
	 */
	this.isRunning = function() {
		return state == 1;
	};
	//判断动画是否暂停中，暂停中返回true，否则返回false
	this.isPause = function() {
		return state == 4;
	};
	//判断动画是否已取消，已取消返回true，否则返回false
	this.isCanceled = function() {
		return state == 3;
	};
	//判断动画是否已停止，已取消返回true，否则返回false
	this.isStop = function() {
		return state == 2 || state == 3;
	};
	//获取当前时刻的动画耗时，返回结果：毫秒数
	this.getCostTime = function() {
		return t;
	};
	/*
	 * 获取当前动画时刻的缓动进度值
	 * startvalue:integer动画初始值,必需
	 * destvalue:integer动画目标值，必需
	 * ease:function缓动函数，可选，默认Tween.easeOut 更多缓动函数参考 Tween
	 */
	this.easeValue = function(startvalue, destvalue, ease) {
		var ee = Tween[ease] || Tween.easeOut;
		return ee(t, startvalue, destvalue - startvalue, opt.duration);
	};
}
/**
 * 是否为函数类型
 */
function isFn(obj) {
	return typeof obj == 'function';
}

/**
 * 四舍五入
 * number 数值
 * fractionDigits 精度
 */
function round2(number, fractionDigits) {
	return Math.round(number * Math.pow(10, fractionDigits)) / Math.pow(10, fractionDigits)
}

/**
 * 队列数据
 */
var QueueData = {};
/**
 * 队列对象
 */
function Queue(objid) {
	this.id = objid;
	this.queues = [];
	this.add = (hander) => {
		//当前的队列
		if (isFn(hander)) {
			this.queues.push(hander);
			return this.next();
		} else if (typeof hander === 'number' && hander >= 0 && hander < this.queues.length) {
			return this.queues[0];
		} else {
			return this.queues;
		}
	};
	/** 执行队列中下一个任务【一般供内部或者开发插件使用】*/
	this.next = () => {
		var isExecute = !!this.isExecute;
		//是否有任务在处理
		if (!isExecute && this.queues.length > 0) {
			this.isExecute = true;
			this.queues.shift().call(this);
		}
		return this;
	};
	/**
	 * 通知通知队列中的下一个任务执行【一般在队列的任务结束时调用】
	 */
	this.dequeue = () => {
		this.isExecute = false;
		return this.next();
	};
	/**清空队列*/
	this.remove = () => {
		this.queues.length == 0;
		return this;
	};
	this.delay = (duration, hander) => {
		this.add(() => {
			var _this = this;
			setTimeout(function() {
				if (isFn(hander)) {
					hander();
				} else {
					_this.dequeue();
				}
			}, duration || 0);
		});
		return this;
	};
}

function AutoDisplayImage(img, callback) {
	var parent = img.parentNode;
	var w = parent.offsetWidth;
	var h = parent.offsetHeight;
	var oldwidth = img.naturalWidth;
	var oldheight = img.naturalHeight;
	var zoomw = w / oldwidth;
	var zoomh = h / oldheight;
	var zoom = zoomw > zoomh ? zoomw : zoomh;
	var width = round2(oldwidth * zoom, 0);
	var height = round2(oldheight * zoom, 0);
	var styles = {
		width: width + 'px',
		height: height + 'px',
		'margin-top': (h - height) / 2 + 'px'
	};
	for (var name in styles) {
		img.style[name] = styles[name];
	}
	if (h < height) {
		img.style['margin-top'] = (h - height) / 2 + 'px';
	} else {
		img.style['margin-left'] = (w - width) / 2 + 'px';
	}
	if (callback) {
		callback();
	}

}

var userAgent = navigator.userAgent.toLowerCase();
export default {
	extend: extend,
	isFunction: isFn,
	/**
	 * 返回一个新的动画对象实例，调用run方法开始动画
	 */
	animate: function(opt) {
		return new Animation(opt);
	},
	//倒计时格式化
	formatCountDown: function(remainsecond, pattern) {
		var patternobj = extend({
			d: '天',
			H: '时',
			m: '分',
			s: '秒'
		}, pattern);
		var day = parseInt(remainsecond / t_day);
		var hour = parseInt(remainsecond % t_day / t_hour);
		var min = parseInt(remainsecond % t_day % t_hour / t_min);
		var second = parseInt(remainsecond % t_day % t_hour % t_min / t_second);
		var sb = [];
		if (day > 0) {
			sb.push(day + patternobj.d);
		}
		if (hour > 0 || day > 0) {
			var h = hour;
			if (h < 10) {
				h = '0' + h;
			}
			sb.push(h + patternobj.H);
		}
		if (min > 0 || (day > 0 || hour > 0)) {
			var m = min;
			if (m < 10) {
				m = '0' + m;
			}
			sb.push(m + patternobj.m);
		}
		if (second > 0 || (min > 0 || hour > 0 || day > 0)) {
			var s = second;
			if (s < 10) {
				s = '0' + second;
			}
			sb.push(s + patternobj.s);
		}
		return sb.join('');
	},
	//四舍五入
	round2: round2,
	//浏览器信息
	browser: {
		ios: !!userAgent.match(/like mac os x/),
		weixin: !!userAgent.match(/micromessenger/),
		mobile: !!userAgent.match(/mobile/),
		android: userAgent.match(/Android/i) || userAgent.match(/Linux/i)
	},
	//http://abc.com?a=1&b=2解析为{a:1,b:2}
	serialize: urlutil.serialize,
	/**
	 * 参数对象转查询字串
	 */
	param: urlutil.param,
	//截止到url额最后一个目录
	parseUrlLastFold: urlutil.parseUrlLastFold,
	/**
	 * 执行倒计时
	 * second 倒计时间 Number
	 * ontick 每一秒数值的变化监听 Function
	 */
	runCountDown: function(options) {
		var opt = extend({
			second: 0,
			ontick: FNEMPTY,
			onfinish: FNEMPTY
		}, options);
		opt.ontick(opt.second);
		var ani = new Animation({
			duration: opt.second * 1000,
			framenum: 1,
			ontick: function() {
				opt.ontick(round2(this.easeValue(opt.second, 0, 'linear'), 0));
			},
			onfinish: function() {
				//结束了
				opt.onfinish();
			}
		});
		ani.run();
		return ani;
	},
	trim: stringutil.trim,
	/**
	 * @description  动态创建css样式，例如 cssutils.addCss('.main_color','#ff6648');
	 * @param {Object} selector 选择器
	 * @param {Object} rules 规则
	 */
	addCss: function(selector, rules) {
		if (!CSSOVERRIDE) {
			CSSOVERRIDE = this.creatElement('style', {
				parent: document.head
			}).sheet;
		}
		if ('addRule' in CSSOVERRIDE) {
			CSSOVERRIDE.addRule(selector, rules);
		} else if ('insertRule' in CSSOVERRIDE) {
			CSSOVERRIDE.insertRule(selector + '{' + rules + '}', CSSOVERRIDE.cssRules.length);
		}
	},
	creatElement(tagName, options) {
		var elem = document.createElement(tagName);
		if (options.parent) {
			options.parent.appendChild(elem);
		}
		if (options.attrs) {
			for (var name in options.attrs) {
				elem.setAttribute(name, options.attrs[name]);
			}
		}
		if (options.classes) {
			this.addClass(elem,options.classes);
		}
		if (options.styles) {
			this.addStyles(elem,options.styles);
		}
		if (options.innerText) {
			elem.innerText = options.innerText;
		}
		if (options.children) {
			options.children.forEach(item => {
				elem.appendChild(item);
			});
		}
		return elem;
	},
	getRealLength: function(str) {
		let l = str.length;
		let blen = 0;
		for (let i = 0; i < l; i++) {
			if ((str.charCodeAt(i) & 0xff00) != 0) {
				blen++;
			}
			blen++;
		}
		return blen;
	},
	queue: function(objid) {
		var queue = QueueData[objid];
		if (!queue) {
			queue = new Queue(objid);
			QueueData[objid] = queue;
		}
		return queue;
	},
	removeQueue: function(queueObj) {
		delete QueueData[queueObj.id];
	},
	removeClass: function(elem, csses) {
		let clazz = trim(csses).replace('/^\\s+$/g', ' ').split(' ');
		elem.classList.remove(...clazz);
	},
	addClass: function(elem, csses) {
		let clazz = trim(csses).replace('/^\\s+$/g', ' ').split(' ');
		elem.classList.add(...clazz);
	},
	getStyle(elem, attr, filterNumer) {
		let val = document.defaultView.getComputedStyle(elem, null)[attr];
		if (val && filterNumer) {
			let match = val.match(/\d*.\d*/);
			return match ? parseFloat(match[0]) : 0;
		}
		return val;
	},
	addStyles: function(elem, styles) {
		for (var name in styles) {
			elem.style.setProperty(name, styles[name]);
		}
	},
	removeElement: function(elem) {
		if (elem && elem.parentNode) {
			elem.parentNode.removeChild(elem);
		}
	},
	autofitImgage: function(image, onautosize, delay) {
		console.error('wool.autofitImgage方法已废弃，请使用WoolImage组件代替');
		if (image.complete) {
			if (typeof delay == 'number' && delay > 0) {
				setTimeout(() => AutoDisplayImage(image, onautosize), delay);
			} else {
				AutoDisplayImage(image, onautosize);
			}
		}
		image.onload = function() {
			if (typeof delay == 'number' && delay > 0) {
				setTimeout(() => AutoDisplayImage(image, onautosize), delay);
			} else {
				AutoDisplayImage(image, onautosize);
			}
		};
	},
	/**节流函数
	 * @param {String} key 相同key的处理函数视为同一类操作，在指定时间完成时只处理最会一个
	 * @param {Function} handler 处理函数
	 * @param {Number} milliseconds 延时时间
	 */
	throttle: function(key, handler, milliseconds) {
		if (!key || typeof key != 'string') {
			throw '缺少key';
		}
		if (!isFn(handler)) {
			return;
		}
		clearTimeout(DELAYS_KEYS[key]);
		DELAYS_KEYS[key] = setTimeout(() => handler(), milliseconds || 300)
	},
	/**
	 * 用于移动端的复制
	 * @param {Object} text
	 */
	mobileCopyText(text) {
		const input = document.createElement("input");
		input.readOnly = 'readonly';
		input.value = text;
		document.body.appendChild(input);
		input.select();
		input.setSelectionRange(0, input.value.length);
		let isok = document.execCommand('Copy');
		console.log(isok);
		document.body.removeChild(input);
		return isok;
	},
	//复制文本
	copyText: function(text) {
		text = trim(text);
		let doc = document;
		let inputview = doc.createElement('textarea');
		doc.body.appendChild(inputview);
		inputview.value = text;
		//解决ios 10弹出键盘的问题
		inputview.setAttribute('readonly', 'readonly');
		inputview.select();
		if (this.browser.ios) {
			//兼容ios
			let range = doc.createRange();
			range.selectNodeContents(inputview);
			let sel = window.getSelection()
			sel.removeAllRanges();
			sel.addRange(range);
		}
		//增大覆盖范围
		inputview.setSelectionRange(0, 99999);
		let result;
		try {
			result = doc.execCommand('copy');
		} catch (e) {
			result = false;
		}
		doc.body.removeChild(inputview);
		return result;
	},
	//休眠
	sleep: function(duration) {
		return new Promise((resolve) => {
			setTimeout(resolve, duration);
		});
	},
	/**
	 * 在数组中查找最先匹配handler方法返回true的元素的下标，没有找到返回-1
	 * @param {Array} list 
	 * @param {Function} handler
	 */
	findIndexInArray: function(list, handler) {
		console.warn('findIndexInArray已废弃，请使用array原生的findIndex方法')
		if (!Array.isArray(list)) {
			return -1;
		}
		return list.findIndex(handler);
	},
	//加载脚本
	loadScript(url, params) {
		let pms = extend({}, params);
		return new Promise((resoved, reject) => {
			let head = document.querySelector('head');
			let script = this.creatElement('script', {
				attrs: {
					src: url + '?' + this.param(pms),
					type: 'text/javascript'
				}
			});
			script.onload = resoved;
			script.onerror = reject;
			head.appendChild(script);
		});
	},
	getJSONP: jsonp,
	//修复android返回第一个页面重载的问题
	fixPageCache() {
		if (this.browser.android) {
			let firstTouch = function() {
				location.hash = 'app';
				document.removeEventListener('touchstart', firstTouch, true);
			}
			document.addEventListener('touchstart', firstTouch, true);
		}
	},
	//是否测试环境
	isInTestPage() {
		return !!location.host.match('127.0.0.1|192.168|.navboy.com|localhost:');
	},
	//是否纯json对象
	isPlainObject(object) {
		return Object.prototype.toString.call(object) == '[object Object]';
	},
	//是否空的纯对象
	isEmptyObject(object) {
		return this.isPlainObject(object) && Object.keys(object).length == 0;
	},
	//是否开发环境
	isInDev() {
		return process.env.NODE_ENV === 'development';
	},
	//是否全面屏
	isFullsreen() {
		return window.screen.height / window.screen.width > 16 / 9;
	},
	//把query中的数字字串修正为数值类型
	fixQuery(object) {
		let obj = {};
		if (isObject(object)) {
			obj = extend(true, obj, object);
			for (let key in obj) {
				let item = obj[key];
				if (typeof item != 'string') {
					continue;
				}
				if (item.match(NUMBERREG)) {
					obj[key] = Number(item);
				} else if (item === 'true') {
					obj[key] = true;
				} else if (item === 'false') {
					obj[key] = false;
				}
			}
			return obj;
		}
		return obj;
	},
	calcColor: function(hex, delta, opacity) {
		var ndelat = delta;
		if (typeof delta == 'number') {
			ndelat = [delta, delta, delta];
		}
		if (Array.isArray(ndelat)) {
			var nhex = trim(hex).replace('#', EMPTY);
			var rgb = [
				[0, 2],
				[2, 4],
				[4, 6]
			].map(function(item, index) {
				var vl = parseInt(nhex.substring(item[0], item[1]), 16) + ndelat[index];
				vl = vl > 255 ? 255 : vl;
				vl = vl < 0 ? 0 : vl;
				return vl = vl ? vl : 0;
			});
			var useropacity = typeof opacity == 'number' && opacity >= 0 && opacity <= 1;
			return 'rgb' + (useropacity ? 'a' : EMPTY) + '(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + (useropacity ? ',' +
				opacity : EMPTY) + ')';
		}
		return hex;
	}
};
