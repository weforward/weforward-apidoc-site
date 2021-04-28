<template>
	<JsonView :line-height="18" :font-size="14" :data="data"></JsonView>
</template>

<script>
/**
 * 渲染json数据
 */
import JsonView from 'vue-json-views';
export default {
	props: {
		data: {
			type: [Object, Array],
			default() {
				return {};
			}
		}
	},
	components: {
		JsonView
	}
};
</script>

<style></style>
