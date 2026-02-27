const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../public/docs');
const OUTPUT_FILE = path.join(__dirname, '../public/docs/search-index.json');

function getFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, allFiles);
        } else if (file.endsWith('.md') && file !== 'sidebar.md') {
            allFiles.push(name);
        }
    }
    return allFiles;
}

function buildIndex() {
    const index = {};

    if (!fs.existsSync(DOCS_DIR)) {
        console.warn("Docs directory not found, skipping index creation.");
        return;
    }

    const files = getFiles(DOCS_DIR);

    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Relative path from public/docs/ to use as key (e.g., "getting-started/home.md")
        const relativePath = path.relative(DOCS_DIR, filePath);

        // Store content in lowercase for easier searching, matching DocService behavior
        index[relativePath] = content.toLowerCase();
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index));
    console.log(`[Build Search Index] Successfully indexed ${files.length} documents.`);
}

buildIndex();
