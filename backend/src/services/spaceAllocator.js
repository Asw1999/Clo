import {
	getOrderedActiveAccounts,
} from './allocationService.js';

function withFreeSpace(account) {
	const total = Number(account.total_space) || 0;
	const used = Number(account.used_space) || 0;
	return {
		...account,
		freeSpace: Math.max(0, total - used),
		usedRatio: total > 0 ? used / total : 1,
	};
}

function buildResult(selected, allAccounts) {
	if (!selected) {
		throw new Error('No active cloud account available');
	}

	const fallbackChain = allAccounts
		.filter((account) => account.id !== selected.id)
		.sort((a, b) => b.freeSpace - a.freeSpace);

	return { selected, fallbackChain };
}

function selectMostFree(accounts) {
	return [...accounts].sort((a, b) => b.freeSpace - a.freeSpace)[0];
}

export function selectBestAccount(userId) {
	const accounts = getOrderedActiveAccounts(userId).map(withFreeSpace);

	if (!accounts.length) {
		throw new Error('No active cloud account available');
	}

	const selected = selectMostFree(accounts);
	return buildResult(selected, accounts);
}
