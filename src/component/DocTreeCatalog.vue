<template>
	<div class="tree-catalog">
		<ul class="tree-catalog-list">
			<template v-for="(item, index) in list">
				<li class="tree-catalog-item" :key="index">
					<div
						style="padding-left: 10px;"
						@click="check(item)"
						:class="{ 'tree-catalog-item-title-check': item.check, 'tree-catalog-item-title': item.childTitles && item.childTitles.length > 0 }"
					>
						<span v-if="item.childTitles">{{ item.title }}</span>
						<a v-if="!item.childTitles" :href="'#' + item.title" rel="nofollow">
							<div class="font_bold" :class="{ font_12: item.description }" v-if="item.description">{{ item.title | lineToHub(tohub) }}</div>
							<div :class="{ font_12: item.description || item.description }" v-else>{{ item.title | lineToHub(tohub) }}</div>
							<div class="methoddesc font_12" v-if="item.description">{{ item.description }}</div>
						</a>
					</div>
				</li>
				<template>
					<DocTreeCatalog :tohub="tohub" :key="item.title" v-show="item.check" :items="item.childTitles"></DocTreeCatalog>
				</template>
			</template>
		</ul>
	</div>
</template>

<script>
export default {
	name: 'DocTreeCatalog',
	props: {
		tohub: Boolean,
		items: {
			type: Array,
			default: () => {
				return [];
			}
		}
	},
	filters: {
		methodName(name) {
			let names = name.split('/');
			return names[names.length - 1];
		},
		//下划线转驼峰
		lineToHub(name, tohub) {
			if (!name || !tohub) {
				return name;
			}
			return name.replace(/\_([a-z])/g, (all, letter) => {
				return letter.toUpperCase();
			});
		}
	},
	data() {
		return {
			list: []
		};
	},
	methods: {
		check(item) {
			if (item.childTitles) {
				if (item.childTitles.length > 0) {
					this.$set(item, 'check', !item.check);
					return;
				}
			}
			if (!item.childTitles || item.childTitles.length == 0) {
				return;
			}
			this.$set(item, 'check', !item.check);
		}
	},
	mounted() {
		// 延时赋值
		this.$nextTick(() => {
			var list = JSON.stringify(this.items); // 深拷贝数组
			this.list = JSON.parse(list);
		});
	}
};
</script>

<style scoped="scoped">
.font_12 {
	font-size: 12px;
}
.tree-catalog > ul {
	list-style: none;
	padding-left: 5px;
	user-select: none;
}
.tree-catalog-item {
	line-height: 40px;
	color: #414141;
	font-size: 14px;
	cursor: pointer;
	border-radius: 3px;
}
.tree-catalog-item > div > a {
	display: block;
	width: 100%;
	padding: 8px 0;
	line-height: 1.6;
	word-break: break-all;
	color: black;
}
.tree-catalog-item:hover {
	background-color: #f1f1f1;
}
.tree-catalog-item-title {
	width: 100%;
	background-image: url(../img/arrow-right.png);
	background-size: 12px;
	background-position-y: center;
	background-position-x: left;
	text-indent: 5px;
}
.tree-catalog-item-title-check {
	background-image: url(../img/arrow-down.png);
}
.methoddesc {
	color: #7d7d7d;
}
</style>
