<template>
	<textarea @input="input" :value="val" @keydown="keydown" @focus="focus" @blur="blur" ref="elem"></textarea>
</template>

<script>
import * as indentTextarea from 'indent-textarea';
/**
 * 多行文本输入组件
 * @description 支持tab和shfit+tab
 * @property {Boolean} isshow 是否显示弹框
 * @event {Function} focus 获取的焦点事件
 * @event {Function} blur 失去焦点事件
 * @example <wool-text-area></wool-text-area>
 */
export default {
	name: 'WoolTextArea',
	model: {
		prop: 'value',
		event: 'change'
	},
	props: {
		value: {
			type: String,
			default: ''
		}
	},
	data() {
		return {
			val: ''
		};
	},
	methods: {
		focus(e) {
			this.$emit('focus', e);
		},
		blur(e) {
			this.$emit('blur', e);
		},
		input(e) {
			this.val = e.target.value;
		},
		keydown(e) {
			return indentTextarea.eventHandler(e);
		}
	},
	watch: {
		val(val) {
			this.$emit('change', val);
		},
		value(v) {
			this.val = v;
		}
	},
	mounted() {
		this.val = this.value;
	}
};
</script>

<style></style>
