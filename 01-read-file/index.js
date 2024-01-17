const fs = require('fs');
const path = require('path');

const newPath = path.join(__dirname, 'text.txt');

const newReadStream = fs.createReadStream(newPath, 'utf-8');
newReadStream.on('data', (data) => {
  process.stdout.write(data);
});

newReadStream.on('error', (err) => {
  process.stdout.write(err);
});
