<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const props = defineProps({
	currentSection: { type: String, default: 'drive' },
});

const emit = defineEmits(['upload-files', 'upload-folder', 'new-folder']);
const { t } = useI18n();
const router = useRouter();

const isFabOpen = ref(false);
const navPillRef = ref(null);
const navRef = ref(null);
const activeIndex = ref(0);
const toastMsg = ref('');
const showToastMsg = ref(false);
let toastTimer = null;

const tabs = [
	{ id: 'home', to: '/', title: 'Beranda', icon: `<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>` },
	{ id: 'drive', to: '/my-drive', title: 'Drive Saya', icon: `<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>` },
	{ id: 'quota', to: '/quota', title: 'Penyimpanan', icon: `<path d="M7 18a4 4 0 0 1-1-7.87A5.5 5.5 0 0 1 16.5 8a4.5 4.5 0 0 1 .5 8.97"/><path d="M7 18h10"/>` },
	{ id: 'recent', to: '/recent', title: 'Terbaru', icon: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>` },
];

function updatePillPosition() {
	if (!navPillRef.value || !navRef.value) return;
	const activeBtn = navRef.value.querySelector(`.nav-item[data-index="${activeIndex.value}"]`);
	if (activeBtn) {
		const rect = activeBtn.getBoundingClientRect();
		const navRect = navRef.value.getBoundingClientRect();
		const pillWidth = 64;
		navPillRef.value.style.width = pillWidth + 'px';
		navPillRef.value.style.transform = `translateX(${rect.left - navRect.left + (rect.width - pillWidth) / 2}px)`;
	}
}

watch(() => props.currentSection, (newSection) => {
	// Map internal section to tabs
	let idx = -1;
	if (newSection === 'home') {
		idx = 0;
	} else if (newSection === 'drive') {
		idx = 1;
	} else if (newSection === 'storage' || newSection === 'quota') {
		idx = 2;
	} else if (newSection === 'recent') {
		idx = 3;
	}
	if (idx !== -1) {
		activeIndex.value = idx;
		nextTick(updatePillPosition);
	}
});

function toggleFab(state) {
	isFabOpen.value = state !== undefined ? state : !isFabOpen.value;
}

function closeFab() {
	isFabOpen.value = false;
}

function onFilesSelected(event) {
	closeFab();
	const files = Array.from(event.target.files || []);
	if (files.length) emit('upload-files', files);
	event.target.value = '';
}

function onFolderSelected(event) {
	closeFab();
	const entries = Array.from(event.target.files || []).map(file => ({
		file,
		relativePath: file.webkitRelativePath || file.name,
	}));
	if (entries.length) emit('upload-folder', entries);
	event.target.value = '';
}

function createNewFolder() {
	closeFab();
	emit('new-folder');
}

function showToast(msg) {
	clearTimeout(toastTimer);
	toastMsg.value = msg;
	showToastMsg.value = true;
	toastTimer = setTimeout(() => { showToastMsg.value = false; }, 2200);
}

function handleFabAction(action) {
	closeFab();
	showToast(`${action} belum tersedia.`);
}

function navigate(tab, index) {
	activeIndex.value = index;
	updatePillPosition();
	router.push(tab.to);
}

function ripple(e, el) {
	const r = el.getBoundingClientRect();
	const rippleEl = document.createElement('span');
	const size = Math.max(r.width, r.height) * 1.4;
	rippleEl.className = 'ripple';
	rippleEl.style.width = rippleEl.style.height = size + 'px';
	rippleEl.style.left = (e.clientX - r.left - size / 2) + 'px';
	rippleEl.style.top = (e.clientY - r.top - size / 2) + 'px';
	el.style.position = el.style.position || 'relative';
	el.appendChild(rippleEl);
	setTimeout(() => rippleEl.remove(), 550);
}

function handleNavClick(e, tab, index) {
	ripple(e, e.currentTarget);
	navigate(tab, index);
}

onMounted(() => {
	window.addEventListener('resize', updatePillPosition);
	nextTick(() => {
		// Initialize active index
		let idx = 1;
		const path = router.currentRoute.value.path;
		if (path === '/') idx = 0;
		else if (path.startsWith('/my-drive')) idx = 1;
		else if (path.startsWith('/quota')) idx = 2;
		else if (path.startsWith('/recent')) idx = 3;
		activeIndex.value = idx;
		updatePillPosition();
	});
});

onUnmounted(() => {
	window.removeEventListener('resize', updatePillPosition);
});
</script>

<template>
	<div class="lg:hidden">
		<div class="toast dark:bg-green-900 dark:text-green-400" :class="{ show: showToastMsg }">{{ toastMsg }}</div>
		<div class="scrim dark:bg-black/60" :class="{ show: isFabOpen }" @click="closeFab"></div>

		<div class="fab-menu" :class="{ open: isFabOpen }">
			<label class="fab-menu-item relative bg-white text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.12)] dark:bg-slate-800 dark:text-slate-100" @click="(e) => ripple(e, e.currentTarget)">
				<svg class="w-[18px] h-[18px] stroke-blue-600 dark:stroke-blue-400" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
				Upload File
				<input type="file" multiple class="absolute -z-50 h-px w-px opacity-0 overflow-hidden" @change="onFilesSelected" />
			</label>
			<label class="fab-menu-item relative bg-white text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.12)] dark:bg-slate-800 dark:text-slate-100" @click="(e) => ripple(e, e.currentTarget)">
				<svg class="w-[18px] h-[18px] stroke-blue-600 dark:stroke-blue-400" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M12 10v6"/><path d="M9 13h6"/></svg>
				Upload Folder
				<input type="file" multiple webkitdirectory directory class="absolute -z-50 h-px w-px opacity-0 overflow-hidden" @change="onFolderSelected" />
			</label>
			<button class="fab-menu-item bg-white text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.12)] dark:bg-slate-800 dark:text-slate-100" @click="(e) => { ripple(e, e.currentTarget); createNewFolder(); }">
				<svg class="w-[18px] h-[18px] stroke-blue-600 dark:stroke-blue-400" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>
				Buat Folder
			</button>
			<button class="fab-menu-item bg-white text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.12)] dark:bg-slate-800 dark:text-slate-100" @click="(e) => { ripple(e, e.currentTarget); handleFabAction('Scan Dokumen'); }">
				<svg class="w-[18px] h-[18px] stroke-blue-600 dark:stroke-blue-400" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8"/></svg>
				Scan Dokumen
			</button>
		</div>

		<nav ref="navRef" class="navbar bg-white shadow-[0_-4px_20px_rgba(15,23,42,0.08)] dark:bg-slate-900 dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
			<div ref="navPillRef" class="nav-pill bg-[#eaf1ff] dark:bg-slate-800"></div>

			<button class="nav-item text-slate-400" data-index="0" :class="[activeIndex === 0 ? 'active text-blue-600 dark:text-blue-400' : 'dark:text-slate-400', { bounce: activeIndex === 0 }]" @click="(e) => handleNavClick(e, tabs[0], 0)">
				<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="tabs[0].icon"></svg>
				{{ tabs[0].title }}
			</button>

			<button class="nav-item text-slate-400" data-index="1" :class="[activeIndex === 1 ? 'active text-blue-600 dark:text-blue-400' : 'dark:text-slate-400', { bounce: activeIndex === 1 }]" @click="(e) => handleNavClick(e, tabs[1], 1)">
				<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="tabs[1].icon"></svg>
				{{ tabs[1].title }}
			</button>

			<div class="nav-upload">
				<button class="upload-btn" :class="{ open: isFabOpen }" aria-label="Upload" @click="(e) => { ripple(e, e.currentTarget); toggleFab(); }">
					<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>
					</svg>
				</button>
			</div>

			<button class="nav-item text-slate-400" data-index="3" :class="[activeIndex === 3 ? 'active text-blue-600 dark:text-blue-400' : 'dark:text-slate-400', { bounce: activeIndex === 3 }]" @click="(e) => handleNavClick(e, tabs[3], 3)">
				<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="tabs[3].icon"></svg>
				{{ tabs[3].title }}
			</button>

			<button class="nav-item text-slate-400" data-index="2" :class="[activeIndex === 2 ? 'active text-blue-600 dark:text-blue-400' : 'dark:text-slate-400', { bounce: activeIndex === 2 }]" @click="(e) => handleNavClick(e, tabs[2], 2)">
				<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="tabs[2].icon"></svg>
				{{ tabs[2].title }}
			</button>
		</nav>
	</div>
</template>

<style scoped>
/* Inject user styles */
.toast {
	position: fixed;
	left: 20px; right: 20px;
	bottom: 96px;
	background: #ecfdf3;
	color: #16a34a;
	font-size: 13px;
	font-weight: 600;
	padding: 14px 18px;
	border-radius: 16px;
	box-shadow: 0 8px 20px rgba(22,163,74,0.15);
	transform: translateY(20px);
	opacity: 0;
	pointer-events: none;
	transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.3s ease;
	z-index: 80;
}
.toast.show { transform: translateY(0); opacity: 1; pointer-events: auto; }

.navbar {
	position: fixed;
	left: 0; right: 0; bottom: 0;
	height: 72px;
	border-radius: 24px 24px 0 0;
	display: flex;
	align-items: center;
	padding: 0 8px;
	z-index: 50;
}

.nav-pill {
	position: absolute;
	left: 0;
	top: 6px;
	height: 36px;
	width: 64px;
	border-radius: 14px;
	transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), width 0.35s ease;
	z-index: 0;
}
.nav-item {
	position: relative;
	background: none;
	border: none;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	font-family: inherit;
	cursor: pointer;
	flex: 1;
	padding: 8px 0;
	z-index: 1;
	transition: color 0.2s ease;
	overflow: visible;
}
.nav-item svg {
	width: 22px; height: 22px;
	stroke: currentColor;
	transition: transform 0.2s ease;
}
.nav-item.active { color: #2563eb; font-weight: 600; }
.nav-upload { flex: 1; display: flex; justify-content: center; }
.upload-btn {
	position: relative;
	width: 56px; height: 56px;
	border-radius: 50%;
	border: none;
	background: linear-gradient(135deg, #3b82f6, #2563eb);
	box-shadow: 0 8px 18px rgba(37, 99, 235, 0.4);
	display: flex; align-items: center; justify-content: center;
	transform: translateY(-22px);
	cursor: pointer;
	transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease;
	overflow: hidden;
}
.upload-btn:active { transform: translateY(-22px) scale(0.92); }
.upload-btn.open { transform: translateY(-22px) rotate(45deg); box-shadow: 0 10px 22px rgba(37,99,235,0.55); }
.upload-btn svg { width: 26px; height: 26px; stroke: #fff; transition: transform 0.25s ease; }

.fab-menu {
	position: fixed;
	left: 50%;
	bottom: 142px;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	gap: 10px;
	align-items: center;
	z-index: 60;
}
.fab-menu-item {
	display: flex; align-items: center; gap: 10px;
	border: none;
	padding: 10px 18px 10px 14px;
	border-radius: 999px;
	font-family: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	opacity: 0;
	transform: translateY(14px) scale(0.9);
	pointer-events: none;
	transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.25s ease;
}

.fab-menu.open .fab-menu-item {
	opacity: 1;
	transform: translateY(0) scale(1);
	pointer-events: auto;
}
.fab-menu.open .fab-menu-item:nth-child(1) { transition-delay: 0.08s; }
.fab-menu.open .fab-menu-item:nth-child(2) { transition-delay: 0.04s; }
.fab-menu.open .fab-menu-item:nth-child(3) { transition-delay: 0s; }

.scrim {
	position: fixed; inset: 0;
	background: rgba(15,23,42,0.25);
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.25s ease;
	z-index: 55;
}
.scrim.show { opacity: 1; pointer-events: auto; }

:global(.ripple) {
	position: absolute;
	border-radius: 50%;
	background: rgba(255,255,255,0.55);
	transform: scale(0);
	animation: rippleAnim 0.55s ease-out;
	pointer-events: none;
}

:global(.dark) :global(.ripple) {
	background: rgba(255,255,255,0.2);
}

@keyframes pop {
	0% { transform: scale(1); }
	45% { transform: scale(1.25); }
	100% { transform: scale(1); }
}
@keyframes rippleAnim {
	to { transform: scale(2.6); opacity: 0; }
}
</style>
