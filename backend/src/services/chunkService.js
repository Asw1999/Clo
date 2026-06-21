import fs from 'fs';
import path from 'path';

const TMP_DIR = path.join(process.cwd(), '.tmp_uploads');

if (!fs.existsSync(TMP_DIR)) {
	fs.mkdirSync(TMP_DIR, { recursive: true });
}

export function getTempFilePath(uploadId) {
	return path.join(TMP_DIR, `${uploadId}.tmp`);
}

export async function appendChunk(uploadId, stream, offset) {
	const tempPath = getTempFilePath(uploadId);
	
	// Create file if it doesn't exist
	if (!fs.existsSync(tempPath) && offset === 0) {
		fs.writeFileSync(tempPath, Buffer.alloc(0));
	}

	return new Promise((resolve, reject) => {
		const writeStream = fs.createWriteStream(tempPath, { flags: 'r+', start: offset });
		
		stream.pipe(writeStream);
		
		writeStream.on('finish', () => resolve());
		writeStream.on('error', reject);
		stream.on('error', reject);
	});
}

export function getUploadedBytes(uploadId) {
	const tempPath = getTempFilePath(uploadId);
	if (!fs.existsSync(tempPath)) return 0;
	return fs.statSync(tempPath).size;
}

export function removeTempFile(uploadId) {
	const tempPath = getTempFilePath(uploadId);
	if (fs.existsSync(tempPath)) {
		fs.unlinkSync(tempPath);
	}
}
