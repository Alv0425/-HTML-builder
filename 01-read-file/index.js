const fs = require('fs');
const path = require('path');
const stdout = process.stdout;

const newPath = path.join(__dirname, 'text.txt');

const newReadStream = fs.createReadStream(newPath, 'utf-8');
newReadStream.pipe(stdout);
