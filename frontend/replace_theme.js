const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

// The color mapping to apply
const replacements = [
  { old: '#0A1628', new: '#0A2353' },
  { old: '#0E2240', new: '#112C70' },
  { old: '#1DB8B0', new: '#56E1E9' },
  { old: '#0A6B8A', new: '#5B58EB' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;

      // Handle both uppercase and lowercase hex in the source files just in case, though they are usually uppercase.
      for (const { old: oldColor, new: newColor } of replacements) {
        // Regex for case-insensitive exact replacement
        const regex = new RegExp(oldColor, 'gi');
        if (regex.test(content)) {
          content = content.replace(regex, newColor);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated colors in ${filePath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Done!');
