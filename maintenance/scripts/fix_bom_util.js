const fs = require('fs');
const path = require('path');

const files = [
    'src-tauri/tauri.conf.json',
    'src-tauri/capabilities/default.json'
];

files.forEach(file => {
    const filePath = path.resolve(process.cwd(), file);
    try {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            let hasBOM = false;
            if (content.charCodeAt(0) === 0xFEFF) {
                content = content.slice(1);
                hasBOM = true;
            }

            // Always write back to enforce UTF-8 without BOM
            fs.writeFileSync(filePath, content, { encoding: 'utf8' });
            console.log(`Processed ${file}: BOM removed? ${hasBOM}`);
        } else {
            console.log(`File not found: ${file}`);
        }
    } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
    }
});
