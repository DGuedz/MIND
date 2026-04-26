const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (!filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('dist') && !filePath.includes('build')) {
                results = results.concat(walk(filePath));
            }
        } else {
            if (filePath.endsWith('.md') || filePath.endsWith('.yml') || filePath.endsWith('.yaml') || filePath.endsWith('.json')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walk('.');
// Regex for matching Emoji_Presentation properties in Unicode
const emojiRegex = /\p{Emoji_Presentation}/gu;
let count = 0;

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf-8');
        if (emojiRegex.test(content)) {
            const cleaned = content.replace(emojiRegex, '');
            fs.writeFileSync(file, cleaned, 'utf-8');
            console.log(`Limpado: ${file}`);
            count++;
        }
    } catch (e) {
        console.error(`Erro ao ler ${file}: ${e.message}`);
    }
});

console.log(`\nTotal de arquivos limpos: ${count}`);
