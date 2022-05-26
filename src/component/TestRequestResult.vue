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
				<div v-if="resUrl!=''" class="test-request-result-item">
					<p class="font_bold test-request-result-warp-title">upload:</p>
					<div class="test-request-result-item">
						<span class="font_14 upload" @click="submitForm($event)">上传</span>
						<input type="file" @change="getFile($event,'file1')">
					</div>
				</div>
				<div v-if="resUrl!=''" class="test-request-result-item">
					<p class="font_bold test-request-result-warp-title">download:</p>
					<div class="test-request-result-item">
						<span class="font_14 upload" @click="downFile">下载</span>
					</div>
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
		data() {
			return {
				reqBody: {},
				reqHeader: {},
				resUrl: '',
				formData: new FormData(),
			}
		},
		watch: {
			isshow(val) {
				if (val) {
					this.reqBody = this.result.data;
					this.reqHeader = this.result.headers;
					this.resUrl = this.reqBody.wf_resp.res_url;
				}
			}
		},
		methods: {
			getFile(event, input_file_name) {
				this.formData.append(input_file_name, event.target.files[0]);
			},
			submitForm(event) {
				event.preventDefault();
				let config = {
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				};
				let msgview = this.$wool.showloading('正在请求');
				let wool = this.wool;
				this.$wf.axios.post(this.resUrl, this.formData, config).then(function(res) {
					if (res.status === 200) {
						msgview.msgsucc("上传成功").hide(1000);
					} else {
						msgview.msgwarn("上传失败" + res.status).hide(1000);
					}
				}).catch((error) => {
					msgview.msgwarn("上传异常" + error).hide(1000);
				});
			},
			downFile(){
				window.location.href = this.resUrl;
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

	.upload {
		cursor: pointer;
		padding: 5px 10px;
		border-radius: 3px;
		margin-left: 5px;
		margin-right: 20px;
		font-weight: normal;
		background-color: #095280;
		color: white;
	}
</style>
