<template>
	<div class="flex flex-col items-center justify-center gap-3 py-10 text-center text-[#5f6368] dark:text-slate-400">
		<span class="loading-spinner" aria-hidden="true" />
		<p class="text-sm">{{ message || t('drive.loadingMetadata') }}</p>
	</div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
	message: { type: String, default: null },
	variant: { type: String, default: 'panel' },
});

const { t } = useI18n();
</script>

<style scoped>
.loading-spinner {
	width: 32px;
	height: 32px;
	border-radius: 9999px;
	border: 3px solid rgba(148, 163, 184, 0.35);
	border-top-color: #1a73e8;
	animation: loading-spin 0.8s linear infinite;
}

.dark .loading-spinner {
	border-color: rgba(71, 85, 105, 0.6);
	border-top-color: #60a5fa;
}

@keyframes loading-spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
