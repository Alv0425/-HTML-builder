const path = require('path');
const fs = require('fs');
const { readdir } = require('fs/promises');

const destPath = path.join(__dirname, 'project-dist', 'bundle.css');
const sourcesDirPath = path.join(__dirname, 'styles');
const sourcesPathes = [];

async function getSources() {
  const files = await readdir(sourcesDirPath, { withFileTypes: true });
  const allStyles = files.reduce((arr, file) => {
    if (!file.isDirectory() && path.extname(file.name) === '.css') {
      arr.push(path.join(file.path, file.name));
    }
    return arr;
  }, []);
  sourcesPathes.push(...allStyles);
}

//if file already exists, rewrite content
async function prepFile() {
  const writeHeader = fs.createWriteStream(destPath, {
    encoding: 'utf-8',
  });
  writeHeader.write('/* --- BUNDLE --- */\n');
}

async function mergeStyles() {
  for (const source of sourcesPathes) {
    const writeDelimeter = fs.createWriteStream(destPath, {
      flags: 'a',
      encoding: 'utf-8',
    });
    writeDelimeter.write('\n' + `/* ${path.basename(source)} */` + '\n');
    const writeSource = fs.createWriteStream(destPath, {
      flags: 'a',
      encoding: 'utf-8',
    });
    const readSource = fs.createReadStream(source, { encoding: 'utf-8' });
    await readSource.pipe(writeSource);
  }
}

(async () => {
  await getSources();
  await prepFile();
  await mergeStyles();
})();
