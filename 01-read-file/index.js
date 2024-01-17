const fs = require('fs');
const path = require('path');

const newPath = path.join(__dirname, 'text.txt');
console.log(newPath);

const newReadStream = fs.createReadStream(newPath, 'utf-8');
newReadStream.on('data', (data) => {
  console.log(data);
});
