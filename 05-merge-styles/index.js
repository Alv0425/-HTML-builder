const path = require('path');
const fs = require('fs');
const { readdir } = require('fs/promises');
const { pipeline } = require('stream/promises');

const destPath = path.join(__dirname, 'project-dist', 'bundle.css');
const sourcesDirPath = path.join(__dirname, 'styles');
const sourcesPaths = [];

// get paths of all style files to merge
async function getSources() {
  const files = await readdir(sourcesDirPath, { withFileTypes: true });
  const allStyles = files.reduce((arr, file) => {
    if (!file.isDirectory() && path.extname(file.name) === '.css') {
      arr.push(path.join(file.path, file.name));
    }
    return arr;
  }, []);
  sourcesPaths.push(...allStyles);
}

// if file already exists, rewrite content
async function prepFile() {
  const writeHeader = fs.createWriteStream(destPath, {
    encoding: 'utf-8',
  });
  writeHeader.write('');
}

// asynchronyosly merge files
async function mergeStyles() {
  for (const source of sourcesPaths) {
    const writeDelimeter = fs.createWriteStream(destPath, {
      flags: 'a',
      encoding: 'utf-8',
    });
    writeDelimeter.write(`/* ${path.basename(source)} */` + '\n');
    const writeSource = fs.createWriteStream(destPath, {
      flags: 'a',
      encoding: 'utf-8',
    });
    const readSource = fs.createReadStream(source, { encoding: 'utf-8' });
    await pipeline(readSource, writeSource);
  }
}

// merge .css files to the bundle
(async () => {
  await getSources();
  await prepFile();
  await mergeStyles();
})();
