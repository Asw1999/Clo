import { computed, ref } from 'vue';

export function useFileSelection({ sourceList, onBeforeSelect } = {}) {
	const selectedFileIds = ref(new Set());
	const lastSelectedFileId = ref(null);

	const selectedFiles = computed(() => {
		const ids = selectedFileIds.value;
		return sourceList.value.filter((file) => ids.has(file.id));
	});

	const selectedCount = computed(() => selectedFiles.value.length);
	const primarySelectedFile = computed(() => selectedFiles.value[0] || null);

	function isSelected(file) {
		return selectedFileIds.value.has(file.id);
	}

	function replaceSelection(file) {
		selectedFileIds.value = new Set([file.id]);
		lastSelectedFileId.value = file.id;
	}

	function toggleSelection(file) {
		const next = new Set(selectedFileIds.value);
		if (next.has(file.id)) {
			next.delete(file.id);
		} else {
			next.add(file.id);
		}
		selectedFileIds.value = next;
		lastSelectedFileId.value = file.id;
	}

	function selectRange(file) {
		const items = sourceList.value;
		const currentIndex = items.findIndex((item) => item.id === file.id);
		const anchorIndex = items.findIndex((item) => item.id === lastSelectedFileId.value);

		if (currentIndex === -1 || anchorIndex === -1) {
			replaceSelection(file);
			return;
		}

		const [start, end] = currentIndex < anchorIndex
			? [currentIndex, anchorIndex]
			: [anchorIndex, currentIndex];

		selectedFileIds.value = new Set(items.slice(start, end + 1).map((item) => item.id));
		lastSelectedFileId.value = file.id;
	}

	function selectAll() {
		selectedFileIds.value = new Set(sourceList.value.map((item) => item.id));
		lastSelectedFileId.value = sourceList.value[sourceList.value.length - 1]?.id || null;
	}

	function selectItem(event, file, onOpenCallback) {
		event.preventDefault();
		event.stopPropagation();
		if (typeof onBeforeSelect === 'function') onBeforeSelect();

		if (event.shiftKey) {
			selectRange(file);
			return;
		}

		if (event.ctrlKey || event.metaKey) {
			toggleSelection(file);
			return;
		}

		const isTouch = event.pointerType === 'touch' || (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents);

		if (isTouch) {
			if (selectedCount.value > 0) {
				toggleSelection(file);
			} else if (typeof onOpenCallback === 'function') {
				onOpenCallback();
			}
			return;
		}

		replaceSelection(file);
	}

	function clearSelection() {
		selectedFileIds.value = new Set();
		lastSelectedFileId.value = null;
	}

	return {
		selectedFileIds,
		lastSelectedFileId,
		selectedFiles,
		selectedCount,
		primarySelectedFile,
		isSelected,
		replaceSelection,
		toggleSelection,
		selectRange,
		selectItem,
		selectAll,
		clearSelection,
	};
}
