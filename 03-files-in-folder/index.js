const path = require('path');
const { readdir, stat } = require('fs/promises');
const { stdout } = process;

let newPath = path.join(__dirname, 'secret-folder');
const allFiles = [];

function bytesToKb(size) {
  return (size / 1024).toFixed(2) + 'kb';
}

async function readDir(npath) {
  try {
    const files = await readdir(npath, { withFileTypes: true });
    for (const file of files) {
      if (!file.isDirectory()) {
        const filePath = path.join(npath, file.name);
        const stats = await stat(filePath);
        const ext = path.extname(file.name);
        const name = path.basename(file.name, ext);
        const fileDescription = {
          name: name,
          extension: ext.slice(1),
          size: bytesToKb(stats.size),
        };
        allFiles.push(fileDescription);
      }
    }
    return files;
  } catch (err) {
    stdout.write(err);
  }
}

readDir(newPath).then(() => {
  allFiles.forEach((file) => {
    stdout.write(
      file.name.padEnd(10, ' ') +
        ' - ' +
        file.extension.padEnd(6, ' ').padStart(10, ' ') +
        ' - ' +
        file.size.padStart(10, ' ') +
        '\n',
    );
  });
});
