<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { IconFileDescription, IconFolder, IconCloud, IconPhoto, IconVideo, IconFileText, IconDotsCircleHorizontal, IconUpload, IconFolderPlus, IconDotsVertical, IconCheck } from '@tabler/icons-vue';
import TruncateMarquee from '../components/TruncateMarquee.vue';
import { useFileTreeStore } from '../stores/fileTree';
import { useAccountManagementStore } from '../stores/accountManagement';
import { useUploadQueueStore } from '../stores/uploadQueue';
import { getModifiedTime, formatDate, providerIcon, providerLabel, formatBytesStrict } from '../composables/useFormatFile.js';
import { useStorageStats } from '../composables/useStorageStats.js';
import { useAuthStore } from '../stores/auth';
import { api } from '../services/api';

const { t } = useI18n();

const fileTreeStore = useFileTreeStore();
const accountStore = useAccountManagementStore();
const authStore = useAuthStore();
const uploadQueueStore = useUploadQueueStore();

const { files, isLoading, currentPath } = storeToRefs(fileTreeStore);
const { accounts } = storeToRefs(accountStore);
const { storagePercentRounded, storageLabel, usedFormatted, usedTotalLabel, totalUsed } = useStorageStats();
const { uploads, totalProgress } = storeToRefs(uploadQueueStore);

const userName = computed(() => {
	const email = authStore.user?.email || '';
	return email.split('@')[0] || 'User';
});

const suggestedFiles = computed(() => {
	return [...files.value]
		.filter((f) => !f.is_folder)
		.sort((a, b) => new Date(getModifiedTime(b)) - new Date(getModifiedTime(a)))
		.slice(0, 4);
});

const totalFolders = computed(() => files.value.filter(f => f.is_folder).length);
const totalFilesCount = computed(() => files.value.filter(f => !f.is_folder).length);

const fileTypes = computed(() => {
	const stats = {
		image: { label: 'Gambar', count: 0, size: 0, icon: IconPhoto, color: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
		video: { label: 'Video', count: 0, size: 0, icon: IconVideo, color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
		document: { label: 'Dokumen', count: 0, size: 0, icon: IconFileText, color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
		other: { label: 'Lainnya', count: 0, size: 0, icon: IconDotsCircleHorizontal, color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' }
	};

	let totalSize = 0;
	files.value.filter(f => !f.is_folder).forEach(f => {
		const name = (f.file_name || '').toLowerCase();
		const size = f.size || 0;
		totalSize += size;
		if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) {
			stats.image.count++; stats.image.size += size;
		} else if (name.match(/\.(mp4|mkv|avi|mov|wmv|webm)$/)) {
			stats.video.count++; stats.video.size += size;
		} else if (name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf)$/)) {
			stats.document.count++; stats.document.size += size;
		} else {
			stats.other.count++; stats.other.size += size;
		}
	});

	return Object.values(stats).map(stat => ({
		...stat,
		percent: totalSize > 0 ? Math.round((stat.size / totalSize) * 100) : 0
	})).sort((a, b) => b.size - a.size);
});

async function refreshCurrentFolder() {
	await fileTreeStore.loadFiles(currentPath.value || '/');
}

async function handleUploads(entries) {
	if (!entries.length) return;
	try {
		await uploadQueueStore.uploadFiles(entries, currentPath.value || '/', refreshCurrentFolder);
		await refreshCurrentFolder();
	} catch {}
}

async function createNewFolder() {
	const folderName = window.prompt(t('drive.newFolderName'));
	if (!folderName?.trim()) return;
	try {
		await uploadQueueStore.trackServerOperation(
			{ type: 'create-folder', name: folderName.trim(), targetKind: 'folder' },
			() => api.createFolder({ name: folderName.trim(), virtual_path: currentPath.value || '/' }),
		);
		await refreshCurrentFolder();
	} catch {}
}

async function loadPage() {
	await Promise.all([fileTreeStore.loadFiles('/'), accountStore.loadAccounts()]);
}

onMounted(loadPage);

function getFileIconByType(filename) {
	const name = (filename || '').toLowerCase();
	if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) return IconPhoto;
	if (name.match(/\.(mp4|mkv|avi|mov|wmv|webm)$/)) return IconVideo;
	if (name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf)$/)) return IconFileText;
	return IconFileDescription;
}

function getFileColorClass(filename) {
	const name = (filename || '').toLowerCase();
	if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) return 'text-blue-600 bg-blue-100 dark:bg-blue-500/20';
	if (name.match(/\.(mp4|mkv|avi|mov|wmv|webm)$/)) return 'text-red-600 bg-red-100 dark:bg-red-500/20';
	if (name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf)$/)) return 'text-amber-600 bg-amber-100 dark:bg-amber-500/20';
	return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20';
}
</script>

<template>
<div class="min-h-[calc(100vh-84px)] px-2 py-4 text-[#202124] dark:text-slate-100 sm:px-6">
			<!-- Header Greeting -->
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-semibold text-[#1f1f1f] dark:text-white sm:text-[28px]">Halo, {{ userName }}!</h1>
					<p class="mt-1 text-sm text-[#5f6368] dark:text-slate-400">Berikut adalah ringkasan penyimpanan awan Anda hari ini.</p>
				</div>
			</div>

			<!-- Dashboard Bento Grid -->
			<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<!-- Storage Card -->
				<div class="flex flex-col justify-between rounded-3xl border border-[#e0e3e7] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
					<div class="flex items-start justify-between">
						<div>
							<p class="text-sm font-medium text-[#5f6368] dark:text-slate-400">Penyimpanan Terpakai</p>
							<h3 class="mt-1 text-2xl font-bold text-[#1f1f1f] dark:text-white">{{ usedFormatted }}</h3>
						</div>
						<div class="relative grid size-12 place-items-center rounded-full" :style="{ background: `conic-gradient(#1a73e8 0 ${storagePercentRounded}%, #eaf1fb ${storagePercentRounded}% 100%)` }">
							<div class="grid size-9 place-items-center rounded-full bg-white text-xs font-bold text-[#1a73e8] dark:bg-slate-800">{{ storagePercentRounded }}%</div>
						</div>
					</div>
					<p class="mt-4 text-xs text-[#5f6368] dark:text-slate-400">Dari total {{ usedTotalLabel?.replace(/.*\/ /, '') || '...' }} kapasitas</p>
				</div>

				<!-- Files Count Card -->
				<div class="flex flex-col justify-between rounded-3xl border border-[#e0e3e7] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
					<div class="flex items-start justify-between">
						<div>
							<p class="text-sm font-medium text-[#5f6368] dark:text-slate-400">Total File & Folder</p>
							<h3 class="mt-1 text-2xl font-bold text-[#1f1f1f] dark:text-white">{{ totalFilesCount + totalFolders }} <span class="text-sm font-normal text-[#5f6368]">Item</span></h3>
						</div>
						<div class="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
							<IconFolder :size="24" :stroke="1.5" />
						</div>
					</div>
					<div class="mt-4 flex gap-4 text-xs text-[#5f6368] dark:text-slate-400">
						<span class="flex items-center gap-1"><IconFileDescription :size="14" /> {{ totalFilesCount }} Files</span>
						<span class="flex items-center gap-1"><IconFolder :size="14" /> {{ totalFolders }} Folders</span>
					</div>
				</div>

				<!-- Connected Clouds -->
				<div class="flex flex-col justify-between rounded-3xl border border-[#e0e3e7] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
					<div class="flex items-start justify-between">
						<div>
							<p class="text-sm font-medium text-[#5f6368] dark:text-slate-400">Awan Terhubung</p>
							<h3 class="mt-1 text-2xl font-bold text-[#1f1f1f] dark:text-white">{{ accounts.length }} <span class="text-sm font-normal text-[#5f6368]">Akun</span></h3>
						</div>
						<div class="grid size-12 place-items-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
							<IconCloud :size="24" :stroke="1.5" />
						</div>
					</div>
					<div class="mt-4 flex -space-x-2 overflow-hidden">
						<div v-for="acc in accounts.slice(0,5)" :key="acc.id" class="inline-block size-7 rounded-full bg-white ring-2 ring-white dark:bg-slate-800 dark:ring-slate-800">
							<img v-if="providerIcon(acc.provider)" :src="providerIcon(acc.provider)" :title="acc.email" class="size-full rounded-full object-cover p-1" />
						</div>
					</div>
				</div>

				<!-- File Types Overview -->
				<div class="flex flex-col justify-between rounded-3xl border border-[#e0e3e7] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
					<p class="text-sm font-medium text-[#5f6368] dark:text-slate-400">Komposisi File</p>
					<div class="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
						<div v-for="stat in fileTypes" :key="stat.label" :class="stat.color" :style="{ width: stat.percent + '%' }" class="h-full first:rounded-l-full last:rounded-r-full"></div>
					</div>
					<div class="mt-3 grid grid-cols-2 gap-y-2 text-xs">
						<div v-for="stat in fileTypes.slice(0,2)" :key="stat.label" class="flex items-center gap-1.5">
							<span class="size-2 rounded-full" :class="stat.color"></span>
							<span class="text-[#5f6368] dark:text-slate-400">{{ stat.label }}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Suggested Files (Card Grid) -->
			<section class="mb-8">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-medium text-[#1f1f1f] dark:text-white">Disarankan</h2>
				</div>
				<div v-if="isLoading" class="flex items-center justify-center p-8">
					<div class="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
				</div>
				<div v-else-if="!suggestedFiles.length" class="rounded-2xl border border-dashed border-[#dadce0] p-10 text-center dark:border-slate-700">
					<p class="text-[#5f6368] dark:text-slate-400">Belum ada file terbaru untuk disarankan.</p>
				</div>
				<div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div v-for="file in suggestedFiles" :key="file.id" class="group relative flex flex-col rounded-2xl border border-[#e0e3e7] bg-white p-4 transition-all hover:bg-[#f8fafd] hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50">
						<div class="mb-3 flex items-start justify-between">
							<div class="grid size-10 place-items-center rounded-xl" :class="getFileColorClass(file.file_name)">
								<component :is="getFileIconByType(file.file_name)" :size="20" :stroke="1.5" />
							</div>
							<button class="text-[#5f6368] opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-400">
								<IconDotsVertical :size="18" />
							</button>
						</div>
						<h4 class="mb-1 truncate text-sm font-medium text-[#1f1f1f] dark:text-slate-100" :title="file.display_name || file.file_name">{{ file.display_name || file.file_name }}</h4>
						<p class="text-xs text-[#5f6368] dark:text-slate-400">Diubah {{ formatDate(getModifiedTime(file)) }}</p>
						<div class="mt-3 flex items-center gap-2 text-xs text-[#5f6368] dark:text-slate-400">
							<img v-if="providerIcon(file.provider)" :src="providerIcon(file.provider)" class="size-3.5 object-contain" />
							<span class="truncate">{{ file.email }}</span>
						</div>
					</div>
				</div>
			</section>

		</div>
</template>
