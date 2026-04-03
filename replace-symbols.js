const fs = require('fs');
const path = require('path');

const projectRoot = 'e:\\2-1\\Poshradh\\PoshRa';
let filesChanged = {};
let rupeeCount = 0;
let localeCount = 0;

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(file)) {
      walkDir(filePath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      let content = fs.readFileSync(filePath, 'utf-8');
      let originalContent = content;

      // Count and replace rupee symbol
      const rupeeMatches = (content.match(/₹/g) || []).length;
      content = content.replace(/₹/g, '৳');

      // Count and replace locale
      const localeMatches = (content.match(/en-IN/g) || []).length;
      content = content.replace(/en-IN/g, 'en-BD');

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        const relativePath = path.relative(projectRoot, filePath);
        filesChanged[relativePath] = { rupee: rupeeMatches, locale: localeMatches };
        rupeeCount += rupeeMatches;
        localeCount += localeMatches;
      }
    }
  });
}

walkDir(projectRoot);

console.log('\n========== REPLACEMENT SUMMARY ==========\n');
console.log(`Total Rupee Symbols (₹) Replaced: ${rupeeCount}`);
console.log(`Total Locale Strings (en-IN) Replaced: ${localeCount}`);
console.log(`\nFiles Modified: ${Object.keys(filesChanged).length}\n');

Object.entries(filesChanged).forEach(([file, counts]) => {
  if (counts.rupee > 0 || counts.locale > 0) {
    console.log(`${file}`);
    if (counts.rupee > 0) console.log(`  ₹ → ৳: ${counts.rupee} occurrence(s)`);
    if (counts.locale > 0) console.log(`  en-IN → en-BD: ${counts.locale} occurrence(s)`);
  }
});
