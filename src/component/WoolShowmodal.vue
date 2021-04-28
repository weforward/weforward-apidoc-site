<template>
	<section class="wool-modal-wrap" :style="{ zIndex: zIndex }" ref="woolshowmodal">
		<transition name="woolmodalfade"><div v-show="isshow" class="wool-modal-mask" :style="mdstyle" @click="tapMask"></div></transition>
		<transition name="woolmodalscale" @enter="onEnter">
			<div ref="frame" :style="{ zIndex: zIndex }" v-show="isshow" class="wool-modal-frame wool-modal-framenormal">
				<div class="closer" v-if="isshowcloser" :style="closerStyle" @click="tapCloser"></div>
				<slot></slot>
			</div>
		</transition>
	</section>
</template>

<script>
import throttle from '../plugins/throttle.js';
let zIndex = 1000;

export default {
	name: 'WoolShowmodal',
	props: {
		isshow: {
			type: Boolean,
			default: false
		},
		isshowcloser: {
			type: Boolean,
			default: false
		},
		//遮罩背景颜色
		backgroundColor: {
			type: String
		},
		closerStyle: {
			type: Object
		}
	},
	computed: {
		mdstyle() {
			let styles = {};
			if (this.backgroundColor) {
				styles.backgroundColor = this.backgroundColor;
			}
			return styles;
		}
	},
	data: function() {
		return {
			top: 0,
			left: 0,
			zIndex: 0,
			throttlekey: 'woolsm:' + Math.random()
		};
	},
	mounted: function() {
		var refview = this.$refs.woolshowmodal;
		//			document.body.appendChild(refview);
		var vm = this;
		//对外的方法
		refview.$app = vm;
		window.addEventListener('resize', this.onResize);
		this.$refs.frame.addEventListener('DOMSubtreeModified', this.onResize);
		this.checkShow(this.isshow);
		if (this.isshow) {
			this.$nextTick(() => this.moveTocenter());
		}
	},
	watch: {
		isshow: 'checkShow'
	},
	methods: {
		checkShow: function(val) {
			if (val) {
				this.zIndex = zIndex++;
				this.$nextTick(() => this.moveTocenter());
			}
		},
		onResize: function(e) {
			if (this.isshow) {
				throttle(this.throttlekey, this.moveTocenter);
			}
		},
		tapCloser: function() {
			this.$emit('tapCloser');
		},
		tapMask: function() {
			this.$emit('tapmask');
		},
		onEnter() {
			this.moveTocenter();
			this.$emit('aftershow');
		},
		moveTocenter: function() {
			var el = this.$refs.frame;
			if (!el) {
				return;
			}
			var rooter = window.document.documentElement;
			el.style.left = (rooter.clientWidth - el.offsetWidth) / 2 + 'px';
			el.style.top = (rooter.clientHeight - el.offsetHeight) / 2 + 'px';
		}
	},
	beforeDestroy: function() {
		window.removeEventListener('resize', this.onResize);
		this.$refs.frame.removeEventListener('DOMSubtreeModified', this.onResize);
	}
};
</script>

<style>
.closer {
	position: absolute;
	height: 30px;
	width: 30px;
	background-image: url(../img/icon_close.png);
	background-size: 20px;
	top: 15px;
	right: 15px;
	cursor: pointer;
	background-position: center;
	z-index: 10;
}

.wool-modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.3);
	z-index: 1000;
}

@media only screen and (max-width: 500px) {
	.wool-modal-frame {
		width: calc(100vw - 40px);
		overflow: auto;
		-webkit-overflow-scrolling: touch;
	}
}

.wool-modal-frame {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 1001;
}

.wool-modal-framenormal {
	transition-duration: left, top;
	transition-duration: 0.4s;
}

.woolmodalfade-enter-active,
.woolmodalfade-leave-active {
	transition: opacity 0.15s;
}

.woolmodalfade-enter,
.woolmodalfade-leave-to {
	opacity: 0;
}

.woolmodalscale-enter-active,
.woolmodalscale-leave-active {
	transition-property: transform, opacity !important;
	transition-duration: 0.15s !important;
}

.woolmodalscale-enter,
.woolmodalscale-leave-to {
	opacity: 0;
	transform: scale(0.95, 0.95);
}
.html_overflow_hide {
	overflow: hidden;
	height: 100vh;
	box-sizing: border-box;
}
</style>
