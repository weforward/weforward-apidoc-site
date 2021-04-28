<template>
	<div class="method-table-tree">
		<div style="margin-top: 20px;" class="font_bold " v-if="detail.returns && detail.returns.length == 1 && !detail.returns[0].name && type == 'returns'">
			<span v-show="!isShowObjectUrl(detail.returns[0].type)">{{ detail.returns[0].type }}</span>
			<span class="objects" @click="goObjects(detail.returns[0].type)" v-show="isShowObjectUrl(detail.returns[0].type)">
				<a :href="'#' + detail.returns[0].type" rel="nofollow">{{ detail.returns[0].type }}</a>
			</span>
			<span v-show="detail.returns[0].component">＜ {{ detail.returns[0].component }} ＞</span>
			{{ detail.returns[0].description }}
		</div>
		<ul class="method-table-tree-list" v-if="list && isshow">
			<li class="method-table-item flexlayout">
				<div>名称</div>
				<div>类型</div>
				<div>说明</div>
				<div>是否必须</div>
			</li>
			<template v-for="(item, index) in list">
				<li class="method-table-item flexlayout" :key="index">
					<div>{{ item.name | lineToHub(tohub)}}</div>
					<div class="method-table-item-open">
						<span @click="goObjects(item.type)" class="objects" v-show="isShowObjectUrl(item.type)">{{ item.type }}</span>
						<label v-show="!isShowObjectUrl(item.type)">{{ item.type }}</label>
						<label v-show="item.component">＜ {{ item.component }} ＞</label>
						<span v-if="item.detail && item.detail.attributes && item.detail.attributes.length > 0" @click="check(item)">{{ item.check ? '收起' : '展开' }}</span>
					</div>
					<div>{{ item.description }}</div>
					<div>{{ item.marks == 1 ? '是' : '否' }}</div>
				</li>
				<template>
					<MethodTableTree :tohub="tohub" v-if="item.check" :key="item.name" :detail="item.detail"></MethodTableTree>
				</template>
			</template>
		</ul>
	</div>
</template>

<script>
export default {
	name: 'MethodTableTree',
	props: {
		detail: {
			type: Object,
			default: () => {
				return {};
			}
		},
		tohub: Boolean,
		type: {
			// 有params 和returns两种
			type: String,
			default: () => {
				return 'params';
			}
		},
		objects: {
			// 通用对象列表
			type: Array,
			default: () => {
				return [];
			}
		}
	},
	computed: {
		list() {
			// let list = [];
			if (!this.detail) {
				return [];
			}
			if (this.detail.attributes && this.detail.attributes.length > 0) {
				return this.detail.attributes;
			}
			if (this.type == 'params') {
				return this.detail.params;
			}
			if (this.type == 'returns') {
				if (this.detail.returns && this.detail.returns.length == 1 && !this.detail.returns[0].name) {
					// console.log('return',this.detail.returns[0].attributes);
					return this.detail.returns[0].detail ? this.detail.returns[0].detail.attributes : [];
				}
				return this.detail.returns;
			}
			return [];
		},
		isshow() {
			if (!this.detail) {
				return false;
			}
			return this.detail && this.list.length > 0;
		}
	},
	filters: {
		//下划线转驼峰
		lineToHub(name,tohub) {
			if (!name || !tohub) {
				return name;
			}
			return name.replace(/\_([a-z])/g, (all, letter) => {
				return letter.toUpperCase();
			});
		}
	},
	methods: {
		check(item) {
			this.$set(item, 'check', !item.check);
			this.$forceUpdate();
		},
		isShowObjectUrl(type) {
			let isHave = false;
			this.objects.forEach(item => {
				if (item.name == type) {
					isHave = true;
				}
			});
			return isHave;
		}
	}
};
</script>
<style scoped="scoped">
.method-table-tree {
	margin-left: 20px;
	margin-right: 10px;
}
.method-table-tree-list {
	list-style: none;
	width: 100%;
	border: 1px solid;
	margin-top: 12px;
	margin-bottom: 40px;
	font-size: 14px;
}

.method-table-item {
	width: 100%;
	border-top: 1px solid;
	/* border-bottom: 1px solid ; */
}
.method-table-item:first-child {
	border-top: none;
}

.method-table-item:last-child {
	border-top: 1px solid;
}

.method-table-item > div {
	width: calc(100% / 4);
	padding: 10px;
	word-break: break-all;
}

.method-table-item-open > span {
	color: #095280;
	text-decoration: underline;
	cursor: pointer;
}
.objects {
	color: blue;
	text-decoration: underline;
	font-size: 15px;
	cursor: pointer;
}
</style>
