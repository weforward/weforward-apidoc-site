function trim(s) {
	if (null == s || undefined == s) {
		return '';
	}
	if (typeof s != 'string') {
		return s + '';
	}
	return s.trim();
}
export default {
	trim
}
