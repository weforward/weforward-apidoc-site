/**
 * 四舍五入
 * number 数值
 * fractionDigits 精度
 */
function round(number, fractionDigits) {
	return Math.round(number * Math.pow(10, fractionDigits)) / Math.pow(10, fractionDigits);
}
/**
 * 格式化价格过滤器，如果有小数的情况，默认保留两位小数
 */
Vue.filter('formatPrice', (value = 0, fractionDigits = 2) => {
	if (typeof value != 'number') {
		return value;
	}
	return round(value, fractionDigits);
});

export default {
	round
}
