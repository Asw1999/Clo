import { Router } from 'express';
import { requireAppUser } from '../middleware/authMiddleware.js';
import { selectBestAccount } from '../services/spaceAllocator.js';
import { findSessionByFingerprint, createUploadSession, getUploadSessionForUser } from '../services/uploadSessionService.js';
import { getUploadedBytes, appendChunk } from '../services/chunkService.js';
import { handleUpload, handleChunkedUploadCommit } from '../services/uploadService.js';

const router = Router();

router.use(requireAppUser);

router.post('/uploads/initiate', (req, res) => {
	const { file_name, size, mime_type, virtual_path = '/', remote_parent_id = null, fingerprint } = req.body;

	if (!file_name || size === undefined || size === null) {
		return res.status(400).json({ error: 'file_name and size are required' });
	}

	let session = findSessionByFingerprint(req.user.id, fingerprint);
	let uploadedBytes = 0;

	if (session) {
		uploadedBytes = getUploadedBytes(session.id);
	} else {
		const allocation = selectBestAccount(req.user.id, Number(size));
		session = createUploadSession({
			user_id: req.user.id,
			file_name,
			size: Number(size),
			mime_type,
			virtual_path,
			remote_parent_id,
			fingerprint,
			cloud_account_id: allocation.selected.id,
			fallback_chain: allocation.fallbackChain.map((account) => account.id),
		});
	}

	return res.status(201).json({
		data: {
			upload_id: session.id,
			session_token: session.token,
			uploaded_bytes: uploadedBytes,
			target_account: {
				id: session.cloud_account_id,
			},
		},
	});
});

router.post('/uploads/:uploadId/chunk', async (req, res, next) => {
	try {
		const session = getUploadSessionForUser(req.user.id, req.params.uploadId);
		if (!session) return res.status(404).json({ error: 'Upload session not found' });

		const offset = Number(req.headers['x-upload-offset'] || 0);
		await appendChunk(session.id, req, offset);
		
		res.status(200).json({ data: { received: getUploadedBytes(session.id) } });
	} catch (error) {
		next(error);
	}
});

router.post('/uploads/:uploadId/commit', async (req, res, next) => {
	try {
		const metadata = await handleChunkedUploadCommit(req.user.id, req.params.uploadId);
		res.status(201).json({ data: metadata });
	} catch (error) {
		next(error);
	}
});

router.post('/uploads/:uploadId/stream', async (req, res, next) => {
	try {
		const metadata = await handleUpload(req, req.params.uploadId);
		res.status(201).json({ data: metadata });
	} catch (error) {
		next(error);
	}
});

export default router;
