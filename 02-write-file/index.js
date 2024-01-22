const fs = require('fs');
const path = require('path');
const rl = require('readline');
const { stdin, stdout } = process;

const fileName = 'newfile.txt';
const newPath = path.join(__dirname, fileName);
const line = '\n------------------------------------------\n';
const message = line + 'File ' + fileName + ' was successfully updated!' + line;
const newWriteStream = fs.createWriteStream(newPath, 'utf8');

const newReadLine = rl.createInterface(stdin, stdout);

const endWrite = () => {
  newReadLine.write(message);
  process.exit();
};

stdout.write(line + 'Please, write text (to exit type "exit"):' + line);

newReadLine.on('line', (data) => {
  if (data === 'exit') {
    endWrite();
  } else {
    newWriteStream.write(data + '\n');
  }
});

newReadLine.on('SIGINT', () => endWrite());
