import fs from 'fs';
import path from 'path';

const adaptersDir = '/data/data/com.termux/files/home/project/OmniCloud/backend/src/adapters';
const adapters = fs.readdirSync(adaptersDir).filter(f => f.endsWith('Adapter.js') && f !== 'BaseCloudAdapter.js' && f !== 'GoogleDriveAdapter.js');

for (const file of adapters) {
	const filePath = path.join(adaptersDir, file);
	let content = fs.readFileSync(filePath, 'utf8');

	if (!content.includes('withPathLock')) {
		// Insert import after the last import
		const importIndex = content.lastIndexOf('import ');
		if (importIndex !== -1) {
			const endOfLine = content.indexOf('\n', importIndex);
			content = content.slice(0, endOfLine + 1) + "import { withPathLock } from '../utils/pathMutex.js';\n" + content.slice(endOfLine + 1);
		}
	}

	// For adapters with ensureRemotePath
	if (content.includes('ensureRemotePath(virtualPath')) {
		content = content.replace(
			/ensureRemotePath\(virtualPath(.*?)\) \{([\s\S]*?^\t\})/,
			(match, args, body) => {
				if (body.includes('withPathLock')) return match;
				// Replace the body to be wrapped in withPathLock
				const indentedBody = body.replace(/\n\t\t/g, '\n\t\t\t').replace(/\n\t\}/, '\n\t\t});\n\t}');
				return `ensureRemotePath(virtualPath${args}) {\n\t\treturn withPathLock(this.account.id, virtualPath, async () => {${indentedBody}`;
			}
		);
	}

	// For adapters with ensureFolder
	if (content.includes('ensureFolder(virtualPath')) {
		content = content.replace(
			/ensureFolder\(virtualPath(.*?)\) \{([\s\S]*?^\t\})/,
			(match, args, body) => {
				if (body.includes('withPathLock')) return match;
				const indentedBody = body.replace(/\n\t\t/g, '\n\t\t\t').replace(/\n\t\}/, '\n\t\t});\n\t}');
				return `ensureFolder(virtualPath${args}) {\n\t\treturn withPathLock(this.account.id, virtualPath, async () => {${indentedBody}`;
			}
		);
	}

	fs.writeFileSync(filePath, content);
}
console.log('Patched adapters!');
