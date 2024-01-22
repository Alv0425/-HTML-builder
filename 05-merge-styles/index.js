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
  const allStyles = files.reduce((styles, file) => {
    if (file.isFile() && path.extname(file.name) === '.css') {
      styles.push(path.join(file.path, file.name));
    }
    return styles;
  }, []);
  sourcesPaths.push(...allStyles);
}

// asynchronyosly merge files
async function mergeStyles() {
  const writeSource = fs.createWriteStream(destPath, 'utf-8');
  for (const source of sourcesPaths) {
    const readSource = fs.createReadStream(source, 'utf-8');
    readSource.on('open', () => {
      writeSource.write(`/* ${path.basename(source)} */` + '\n');
    });
    await pipeline(readSource, writeSource, { end: false });
  }
  writeSource.end();
}

// merge .css files to the bundle
(async () => {
  await getSources();
  await mergeStyles();
})();
