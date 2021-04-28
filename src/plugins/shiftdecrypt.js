/**
 * 位移解密
 */
const _hexTable0_f = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1, -1,
	-1, -1, -1, -1, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0x0A, 0x0B, 0x0C,
	0x0D, 0x0E, 0x0F
];

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
 * 转换HEX字串
 * 
 * @param hex
 *            HEX字串
 * @param offset
 *            HEX字串开始位置（包含）
 * @param end
 *            HEX字串结束位置（不包含），-1则为全字串长
 * @param invaild
 *            若格式无效，返回此值
 * @return 返回解析后的数值，若格式无效返回传入的invaild
 */
function parseHex(hex, offset, end, invaild) {
	if (end > hex.length) {
		return invaild;
	}
	if (-1 == end) {
		end = hex.length;
	}
	if (0 == end || end - offset > 8) {
		return invaild;
	}

	// 检查字串是否有效，若包含无效部分，返回invaild
	let val = 0;
	for (let i = offset; i < end; i++) {
		let ch = hex.charCodeAt(i);
		if (ch < 0 || ch >= _hexTable0_f.length || -1 == _hexTable0_f[ch]) {
			return invaild;
		}
		let bit4 = _hexTable0_f[ch];
		if (i > 0) {
			val <<= 4;
		}
		val |= bit4;
	}
	return val;
}

/**
 * 移位解密（shift取值为>=0,<=16）
 * 
 * @param ciphertext
 *            密文
 * @param shift
 *            要移动的位
 * @return 明文
 */
function ShiftDecrypt(ciphertext, shift) {
	if (!ciphertext) {
		return '';
	}
	let len = ciphertext.length;
	if (len < 4 || 0 != (3 & len))
		return '';

	if (shift < 0 || shift >= 16)
		shift = 0;

	let result = new StringBuilder();
	for (let i = 0; i < len; i += 4) {
		// 转换HEX16编码的值
		let utf16 = parseHex(ciphertext.substring(i, i + 4), 0, 4, 0);

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
		// 先把后部分位取出
		let bits = (mask & utf16);
		// 右移___shift位修正前部分位
		utf16 &= (~mask);
		utf16 >>= shift;

		// 把___bits位转回高位，然后组合
		utf16 |= (bits << (16 - shift));
		result.append(String.fromCharCode(utf16 + ''));
		// 取当前解码字符最后4位作为下个移位的基准
		shift = (0x000F & utf16);
	}
	return result.toString();
}

export default ShiftDecrypt;
