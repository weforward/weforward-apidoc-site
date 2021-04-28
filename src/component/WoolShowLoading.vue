<template>
	<div class="dotwrap" v-show="isshow" style="{animationDuration:0.3*(size+1)+'s'}">
		<span
			v-for="index in size"
			class="dot"
			:key="index"
			:style="{ width: width + 'px', height: width + 'px', marginRight: width + 'px', '--maincolor': color, animationDelay: 0.3 * (index + 1) + 's' }"
		></span>
	</div>
</template>

<script>
export default {
	name: 'WoolShowLoading',
	//属性
	props: {
		//是否显示
		isshow: {
			type: Boolean,
			default: false
		},
		width: {
			type: Number,
			default: 6
		},
		//颜色
		color: {
			type: String
		}
	},
	data: () => {
		return {
			size: 3
		};
	}
};
</script>

<style scoped>
.dotwrap {
	display: inline-block;
	margin: 0 auto;
}

.dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	opacity: 0.5;
	animation: load 1.2s ease infinite;
	display: inline-block;
	margin-right: 5px;
	background-color: var(--maincolor,#1dbbff);
}
.dotwrap .dot:last-child {
	margin-right: 0;
}

@keyframes load {
	0% {
		opacity: 1;
	}
	100% {
		opacity: 0.3;
	}
}
</style>
