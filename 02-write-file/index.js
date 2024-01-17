const fs = require('fs');
const path = require('path');
const rl = require('readline');
const { stdin, stdout } = process;

const fileName = 'newfile.txt';
const newPath = path.join(__dirname, fileName);
const message = 'File ' + fileName + ' was successfully updated!';

const newWriteStream = fs.createWriteStream(newPath, {
  encoding: 'utf8',
  flags: 'a',
});
const newReadLine = rl.createInterface(stdin, stdout);
const endWrite = () => {
  newReadLine.write(message);
  process.exit();
};

stdout.write('Please, write some test (to exit type "exit"):\n');

newReadLine.on('line', (data) => {
  if (data === 'exit') {
    endWrite();
  } else {
    newWriteStream.write(data + '\n');
  }
});

newReadLine.on('SIGINT', () => endWrite());
