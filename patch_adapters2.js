import fs from 'fs';
import path from 'path';

const adaptersDir = '/data/data/com.termux/files/home/project/OmniCloud/backend/src/adapters';
const adapters = ['OneDriveAdapter.js', 'MegaAdapter.js', 'DropboxAdapter.js', 'PCloudAdapter.js', 'YandexAdapter.js', 'S3Adapter.js'];

for (const file of adapters) {
	const filePath = path.join(adaptersDir, file);
	let content = fs.readFileSync(filePath, 'utf8');

	if (content.includes('ensureRemotePath(virtualPath')) {
		content = content.replace(
			/ensureRemotePath\(virtualPath([^)]*)\) \{([\s\S]*?\n\t\})/,
			(match, args, body) => {
				if (body.includes('withPathLock')) return match;
				const indentedBody = body.replace(/\n\t\t/g, '\n\t\t\t').replace(/\n\t\}$/, '\n\t\t});\n\t}');
				return `ensureRemotePath(virtualPath${args}) {\n\t\treturn withPathLock(this.account.id, virtualPath, async () => {${indentedBody}`;
			}
		);
	}

	if (content.includes('ensureFolder(virtualPath')) {
		content = content.replace(
			/ensureFolder\(virtualPath([^)]*)\) \{([\s\S]*?\n\t\})/,
			(match, args, body) => {
				if (body.includes('withPathLock')) return match;
				const indentedBody = body.replace(/\n\t\t/g, '\n\t\t\t').replace(/\n\t\}$/, '\n\t\t});\n\t}');
				return `ensureFolder(virtualPath${args}) {\n\t\treturn withPathLock(this.account.id, virtualPath, async () => {${indentedBody}`;
			}
		);
	}

	fs.writeFileSync(filePath, content);
}
console.log('Patched adapters!');
