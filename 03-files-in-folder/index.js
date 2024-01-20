const path = require('path');
const { readdir, stat } = require('fs/promises');
const { stdout } = process;

let newPath = path.join(__dirname, 'secret-folder');
const allFiles = [];

async function readDir(npath) {
  try {
    const files = await readdir(npath, { withFileTypes: true });
    for (const file of files) {
      if (!file.isDirectory()) {
        const filePath = path.join(npath, file.name);
        const stats = await stat(filePath);
        const ext = path.extname(file.name);
        const fileDescription = {
          name: path.basename(file.name, ext),
          extension: ext.replace('.', ''),
          size: stats.size + 'b',
        };
        allFiles.push(fileDescription);
      }
    }
    return files;
  } catch (err) {
    stdout.write(err + '\n');
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
