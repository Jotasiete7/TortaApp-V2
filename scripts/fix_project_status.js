import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'PROJECT_STATUS.md');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace the literal $newVersion with 2.1.5
    content = content.replace('$newVersion', '`2.1.5`');
    // Also fix if it was written without backticks
    content = content.replace('| 2.1.5 |', '| `2.1.5` |');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed PROJECT_STATUS.md');
} catch (err) {
    console.error('Error fixing file:', err);
}
