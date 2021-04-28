const HEXDIGITS = '0123456789abcdef'.split('');

function StringBuilder() {
	const array = [];
	this.list = array;
	this.append = function(str) {
		array.push(str);
	};
	this.toString = function() {
		return array.join('');
	};
}
/**
 * 移位加密（shift取值为>=0,<=16）
 * @param plaintext
 *            明文
 * @param shift
 *            要移动的位
 * @return 密文
 */
function ShiftEncrypt(plaintext, shift) {
	if (!plaintext || typeof plaintext !='string') {
		return "";
	}
	if (shift < 0 || shift >= 16) {
		shift = 0;
	}
	let result = new StringBuilder();
	let len = plaintext.length;
	for (let i = 0; i < len; i++) {
		// 取得每个字符的UTF内码
		let utf16 = plaintext.charCodeAt(i);
		// 先左移___shift位，并把前部分挤走的位移到后面
		let int32 = (0xFFFF & utf16) << shift;
		// 制造移位mask
		let mask = 0;
		switch (shift) {
			case 1:
				mask = 0x0001;
				break;
			case 2:
				mask = 0x0003;
				break;
			case 3:
				mask = 0x0007;
				break;
			case 4:
				mask = 0x000F;
				break;
			case 5:
				mask = 0x001F;
				break;
			case 6:
				mask = 0x003F;
				break;
			case 7:
				mask = 0x007F;
				break;
			case 8:
				mask = 0x00FF;
				break;
			case 9:
				mask = 0x01FF;
				break;
			case 10:
				mask = 0x03FF;
				break;
			case 11:
				mask = 0x07FF;
				break;
			case 12:
				mask = 0x0FFF;
				break;
			case 13:
				mask = 0x1FFF;
				break;
			case 14:
				mask = 0x3FFF;
				break;
			case 15:
				mask = 0x7FFF;
				break;
			case 16:
				mask = 0xFFFF;
				break;
		}
		// 把移位超出16位部分转移回后面
		int32 &= (0xFFFF0000 | (~mask));
		int32 |= (int32 >> 16);
		toHexFixed((0xFFFF & int32), result);

		// 取当前字符最后4位作为下个移位的基准
		shift = (0x000F & utf16);
	}
	return result.toString();
}

/**
 * 定长的16位整数HEX字串，不足4个字符前端补0
 * 
 * @param val
 *            要转换的数值
 * @param sb
 *            转换输出字串缓冲区，若为null则自动内部创建
 * @return 传入或内部创建的缓存区
 */
function toHexFixed(val, sb) {
	if (null == sb) {
		sb = new StringBuilder();
	}
	toHexFixedAppendable(val, sb);
	return sb;
}


/**
 * 定长的16位整数HEX字串，不足4个字符前端补0
 * 
 * @param val
 *            要转换的数值
 * @param sb
 *            转换输出字串缓冲区，若为null则自动内部创建
 * @return 传入或内部创建的缓存区
 */
function toHexFixedAppendable(val, sb) {
	if (val < 0 || val >= 0x1000) {
		sb.append(HEXDIGITS[(val >> 12) & 0xF]);
		sb.append(HEXDIGITS[(val >> 8) & 0xF]);
		sb.append(HEXDIGITS[(val >> 4) & 0xF]);
		sb.append(HEXDIGITS[val & 0x0F]);
	} else if (val >= 0x0100) {
		sb.append('0');
		sb.append(HEXDIGITS[(val >> 8) & 0xF]);
		sb.append(HEXDIGITS[(val >> 4) & 0xF]);
		sb.append(HEXDIGITS[val & 0x0F]);
	} else if (val >= 0x0010) {
		sb.append("00");
		sb.append(HEXDIGITS[(val >> 4) & 0xF]);
		sb.append(HEXDIGITS[val & 0x0F]);
	} else if (val >= 0x0001) {
		sb.append("000");
		sb.append(HEXDIGITS[val & 0x0F]);
	} else {
		sb.append("0000");
	}
}
export default ShiftEncrypt;
