<template>
	<router-view v-slot="{ Component, route }">
		<DriveShell v-if="route.meta.keepAlive" :current-section="getSection(String(route.name))" @new-folder="createNewFolder" @upload-files="handleUploads" @upload-folder="handleUploads">
			<keep-alive>
				<component :is="Component" :key="route.name" />
			</keep-alive>
		</DriveShell>
		<component v-else :is="Component" :key="route.name" />
	</router-view>
	<FloatingProgressToast :uploads="uploads" :total-progress="totalProgress" @close="uploadQueueStore.clearOperations" @close-item="uploadQueueStore.closeOperation" />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import DriveShell from './components/DriveShell.vue';
import FloatingProgressToast from './components/FloatingProgressToast.vue';
import { useFileTreeStore } from './stores/fileTree';
import { useUploadQueueStore } from './stores/uploadQueue';
import { api } from './services/api';

const { t } = useI18n();
const fileTreeStore = useFileTreeStore();
const uploadQueueStore = useUploadQueueStore();

function handleBeforeUnload(event) {
	if (uploadQueueStore.activeUploads.length > 0) {
		event.preventDefault();
		event.returnValue = '';
	}
}

onMounted(() => {
	window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
	window.removeEventListener('beforeunload', handleBeforeUnload);
});

const { uploads, totalProgress } = storeToRefs(uploadQueueStore);

const sectionMap = {
	'my-drive': 'drive',
	'shared-with-me': 'shared',
	'quota': 'storage',
};

function getSection(routeName) {
	return sectionMap[routeName] || routeName;
}

async function createNewFolder() {
	const folderName = window.prompt(t('drive.newFolderName') || 'Nama Folder Baru');
	if (!folderName?.trim()) return;
	try {
		await uploadQueueStore.trackServerOperation(
			{ type: 'create-folder', name: folderName.trim(), targetKind: 'folder' },
			() => api.createFolder({ name: folderName.trim(), virtual_path: fileTreeStore.currentPath }),
		);
		await fileTreeStore.loadFiles(fileTreeStore.currentPath);
	} catch {}
}

async function handleUploads(entries) {
	if (!entries || !entries.length) return;
	try {
		await uploadQueueStore.uploadFiles(entries, fileTreeStore.currentPath, () => fileTreeStore.loadFiles(fileTreeStore.currentPath));
		await fileTreeStore.loadFiles(fileTreeStore.currentPath);
	} catch {}
}
</script>
