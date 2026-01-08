import fs from 'fs';
import path from 'path';

const filesToFix = [
    'package.json',
    'src-tauri/tauri.conf.json',
    'PROJECT_STATUS.md'
];

function removeBom(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        // Remove BOM if present
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
            console.log(`BOM removed from: ${filePath}`);
        }
        // Ensure we write it back cleanly
        fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err.message);
    }
}

filesToFix.forEach(file => {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        removeBom(fullPath);
    } else {
        console.log(`File not found: ${file}`);
    }
});

console.log('Cleanup complete.');
