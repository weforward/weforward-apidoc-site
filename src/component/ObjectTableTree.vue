<template>
	<div class="obj-table-tree">
		<ul class="obj-table-tree-list" v-if="detail">
			<li class="obj-table-item flexlayout">
				<div>字段名</div>
				<div>字段说明</div>
				<div>类型</div>
			</li>
			<template v-for="(item, index) in detail.attributes">
				<li class="obj-table-item flexlayout" :key="index">
					<div class="obj-table-item-open">
						<span v-show="item.detail" @click="check">{{ item.check ? '收起' : '展开' }}</span>
						{{ item.name | lineToHub(tohub) }}
					</div>
					<div>{{ item.description }}</div>
					<div>
						{{ item.type }}
						<template v-if="item.component">
							&lt;{{ item.component }}&gt;
						</template>
					</div>
				</li>
				<template>
					<ObjectTableTree v-show="item.check" :key="item.name" :detail="item.detail"></ObjectTableTree>
				</template>
			</template>
		</ul>
	</div>
</template>

<script>
import utils from '../utils.js';
export default {
	name: 'ObjectTableTree',
	props: {
		tohub: Boolean,
		detail: {
			type: Object,
			default: () => {
				return {};
			}
		}
	},
	filters: {
		//下划线转驼峰
		lineToHub(name, tohub) {
			if (!name || !tohub) {
				return name;
			}
			return utils.stringtoHub(name);
		}
	},
	methods: {
		check(item) {
			this.$set(item, 'check', !item.check);
		}
	}
};
</script>
<style scoped="scoped">
.obj-table-tree-list {
	list-style: none;
	width: 100%;
	border: 1px solid black;
	margin-top: 20px;
	font-size: 14px;
	border-bottom: none;
}
.obj-table-item {
	width: 100%;
	border-bottom: 1px solid black;
}
.obj-table-item:last-child {
	border: none !important;
}
.obj-table-item > div {
	width: calc(100% / 3);
	padding: 10px;
}
.obj-table-item-open > span {
	color: #095280;
	text-decoration: underline;
}
</style>
