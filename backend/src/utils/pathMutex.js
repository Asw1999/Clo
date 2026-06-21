const locks = new Map();

export async function withPathLock(accountId, path, fn) {
	const key = `${accountId}:${path}`;
	
	let lock = locks.get(key);
	if (!lock) {
		lock = Promise.resolve();
	}

	let release;
	const nextLock = new Promise(resolve => {
		release = resolve;
	});

	locks.set(key, lock.then(() => nextLock));

	try {
		await lock;
		return await fn();
	} finally {
		release();
		if (locks.get(key) === nextLock) {
			locks.delete(key);
		}
	}
}
