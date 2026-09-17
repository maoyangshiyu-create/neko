import fs from 'fs';
import path from 'path';

const outputFile = 'all_code_bundle.txt';
const targetExts = ['.ts', '.tsx', '.json', '.html', '.css'];
const skipDirs = ['node_modules', 'dist', '.git'];
const includeFiles = ['package.json', 'server.ts', 'index.html', 'vite.config.ts', 'tsconfig.json', 'metadata.json', 'firestore.rules', 'firebase-blueprint.json', '.env.example'];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (skipDirs.includes(f)) return;
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let content = `# ==========================================
# WEPHONE FULL CODEBASE BUNDLE
# Generated at: ${new Date().toISOString()}
# ==========================================\n\n`;

const addFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    content += `// ==========================================\n`;
    content += `// FILE: ${filePath}\n`;
    content += `// ==========================================\n\n`;
    content += fs.readFileSync(filePath, 'utf8') + '\n\n';
  }
}

// Add important root files
includeFiles.forEach(addFile);

// Add src files
if (fs.existsSync('./src')) {
  walkDir('./src', (filePath) => {
    if (targetExts.some(ext => filePath.endsWith(ext))) {
      addFile(filePath);
    }
  });
}

// Add public text files
if (fs.existsSync('./public')) {
  walkDir('./public', (filePath) => {
    if (targetExts.some(ext => filePath.endsWith(ext))) {
      addFile(filePath);
    }
  });
}

fs.writeFileSync(outputFile, content);
console.log(`Successfully updated ${outputFile} with ${content.length} bytes.`);
