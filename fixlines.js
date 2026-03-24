// Remove lines 984-1528 from server.js (old leaked CSS/HTML after new template literal)
const fs = require('fs');
const filepath = 'c:\\Users\\diego\\OneDrive\\Desktop\\Alejandro app\\server.js';
console.log('Reading:', filepath);
const src = fs.readFileSync(filepath, 'utf8');
const lines = src.split('\n');
console.log('Total lines before:', lines.length);
console.log('Line 983 ends with:', lines[982].slice(-20));
console.log('Line 984 starts:', lines[983] ? lines[983].slice(0,60) : 'EMPTY');
console.log('Line 1529:', lines[1528] ? lines[1528] : 'EMPTY');
// Keep lines 0..982 (1-983) and 1528..end (1529+)
// This removes lines 984-1528 (0-indexed 983-1527)
const fixed = [...lines.slice(0, 983), ...lines.slice(1528)];
console.log('Total lines after:', fixed.length);
fs.writeFileSync(filepath, fixed.join('\n'), { encoding: 'utf8', flag: 'w' });
const verify = fs.readFileSync(filepath, 'utf8').split('\n');
console.log('Verified lines:', verify.length);
console.log('New line 984:', verify[983] ? verify[983].slice(0,60) : 'EMPTY');
console.log('Done!');
