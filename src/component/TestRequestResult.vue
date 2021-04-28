<template>
	<WoolShowmodal :isshow="isshow" @tapCloser="$emit('toggle')" :isshowcloser="true">
		<div class="test-request-result model-background wt-scroll">
			<section class="test-request-result-warp">
				<p class="font_bold test-request-result-warp-title">header:</p>
				<div class="test-request-result-item">
					<JsonTree :data="reqHeader"></JsonTree>
				</div>
				<div class="test-request-result-item">
					<p class="font_bold test-request-result-warp-title">body:</p>
					<JsonTree :data="reqBody"></JsonTree>
				</div>
			</section>
		</div>
	</WoolShowmodal>
</template>

<script>
export default {
	name: 'TestRequestResult',
	props: {
		isshow: Boolean,
		result: Object
	},
	components: {
		WoolShowmodal: () => import('../component/WoolShowmodal.vue'),
		JsonTree: () => import('../component/JsonTree.vue')
	},
	data(){
		return {
			reqBody: {},
			reqHeader: {},
		}
	},
	watch: {
		isshow(val) {
			if(val) {
				this.reqBody = this.result.data;
				this.reqHeader = this.result.headers;
			}
		}
	}
};
</script>

<style scoped="scoped">
.test-request-result {
	background-color: white;
	width: 900px;
	height: calc(100vh - 50px);
	padding: 12px;
	padding-top: 50px;
}
.test-request-result-item {
	align-items: center;
	margin-bottom: 10px;
}
.test-request-result-item-value {
	width: 95%;
	resize: none;
	padding: 10px;
}
.test-request-result-warp-title {
	padding-bottom: 10px;
}
</style>
