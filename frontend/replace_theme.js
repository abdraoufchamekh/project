const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

const files = walk(srcDir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // 1. Background replacements (Main / Card)
  content = content.replace(/bg-gray-900/g, 'bg-[#0A2353]');
  content = content.replace(/bg-gray-800/g, 'bg-[#112C70]');

  // 2. PRIMARY Action Buttons & Sidebar
  // Match bg-blue-[56]00 hover:bg-blue-[67]00
  content = content.replace(/bg-blue-[56]00\s+hover:bg-blue-[67]00/g, 'bg-[linear-gradient(135deg,_#03ccff,_#09fbff,_#d403e1)] hover:opacity-90');
  
  // Any remaining solitary bg-blue-600 or bg-blue-500
  content = content.replace(/bg-blue-[56]00/g, 'bg-[linear-gradient(135deg,_#03ccff,_#09fbff,_#d403e1)]');

  // 3. BADGES: Nouvelle commande (was bg-blue-900 text-blue-300 usually)
  content = content.replace(/bg-blue-900\s+text-blue-300/g, 'bg-[linear-gradient(135deg,_#460071,_#d403e1)] text-white');
  content = content.replace(/bg-blue-900/g, 'bg-[linear-gradient(135deg,_#460071,_#d403e1)]');

  // 4. Text Links & Highlighted Text & Brand Name
  content = content.replace(/text-blue-[3456]00/g, 'text-[#03ccff]');

  // 5. Borders & Secondary Buttons & En savoir plus badge
  content = content.replace(/border-blue-[3456]00/g, 'border-[#03ccff]');

  // 6. Focus Rings / Radio rings
  content = content.replace(/ring-blue-[3456]00/g, 'ring-[#03ccff]');

  // 7. Focus border
  content = content.replace(/focus:border-blue-[3456]00/g, 'focus:border-[#03ccff]');
  content = content.replace(/focus:ring-blue-[3456]00/g, 'focus:ring-[#03ccff]');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
}
