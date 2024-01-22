const path = require('path');
const { readdir, copyFile, rm, mkdir } = require('fs/promises');
const { pipeline } = require('stream/promises');
const fs = require('fs');

const distDirPath = path.join(__dirname, 'project-dist');
const assetsSourcePath = path.join(__dirname, 'assets');
const destAssetsPath = path.join(distDirPath, 'assets');

const stylesSourcesPath = path.join(__dirname, 'styles');
const stylesBundlePath = path.join(distDirPath, 'style.css');

const htmlComponentsPath = path.join(__dirname, 'components');
const htmlBundlePath = path.join(distDirPath, 'index.html');
const htmlTemplPath = path.join(__dirname, 'template.html');

const sourcesStylesPaths = [];
const htmlTemplPaths = [];
const componentsHTML = {};

(async () => {
  // create dir tree and copy assets
  await createDir(distDirPath);
  await createDir(destAssetsPath);
  await copyFiles(assetsSourcePath, destAssetsPath);
  // merge styles
  await getSources(stylesSourcesPath, sourcesStylesPaths, '.css');
  await mergeStyles();
  // generate HTML from template
  await getSources(htmlComponentsPath, htmlTemplPaths, '.html');
  await readComponents();
  await generateHTML();
})();

/* ----------  Generate HTML file from template  ----------- */
async function readComponents() {
  for (const compPath of htmlTemplPaths) {
    const readfile = fs.createReadStream(compPath, { encoding: 'utf-8' });
    const name = path.basename(compPath, '.html');
    const placeholder = `{{${name}}}`;
    const fileContent = [];
    await new Promise((res) => {
      readfile.on('data', (chunk) => {
        fileContent.push(chunk);
      });
      readfile.on('close', () => {
        componentsHTML[placeholder] = fileContent.join('');
        res(true);
      });
    });
  }
}

async function generateHTML() {
  let templRead = fs.createReadStream(htmlTemplPath, { encoding: 'utf-8' });
  let templ;
  const templData = [];
  await new Promise((res) => {
    templRead.on('data', (chunk) => templData.push(chunk));
    templRead.on('close', () => {
      templ = templData.join('');
      res(true);
    });
  });
  const placeholders = templ.match(/\{\{[a-zA-Z-_]{1,}\}\}/g);
  for (const placeholder of placeholders) {
    const replacer = componentsHTML[placeholder]
      ? componentsHTML[placeholder]
      : '';
    templ = templ.replaceAll(placeholder, replacer);
  }
  const writeHTML = fs.createWriteStream(htmlBundlePath, { encoding: 'utf-8' });
  writeHTML.write(templ);
}

/* ----------  Merge styles from styles folder  ----------  */
// get paths of all files
async function getSources(dirpath, srcs, ext) {
  const files = await readdir(dirpath, { withFileTypes: true });
  const allStyles = files.reduce((arr, file) => {
    if (!file.isDirectory() && path.extname(file.name) === ext) {
      arr.push(path.join(file.path, file.name));
    }
    return arr;
  }, []);
  srcs.push(...allStyles);
}

async function mergeStyles() {
  const writeSource = fs.createWriteStream(stylesBundlePath, 'utf-8');
  for (const source of sourcesStylesPaths) {
    const readSource = fs.createReadStream(source, 'utf-8');
    await pipeline(readSource, writeSource, { end: false });
  }
  writeSource.end();
}

/* ----------  Create directories tree and copy assets  ----------  */
async function createDir(newPath) {
  try {
    await rm(newPath, { recursive: true, force: true });
    await mkdir(newPath, { recursive: true });
  } catch (e) {
    if (e.code === 'ENOENT') {
      await mkdir(newPath, { recursive: true });
    }
  }
}

async function copyFiles(sourcePath, destPathBase) {
  const allFiles = await readdir(sourcePath, { withFileTypes: true });
  for (const file of allFiles) {
    const filePath = path.join(file.path, file.name);
    if (file.isDirectory()) {
      const newBase = path.join(destPathBase, file.name);
      await createDir(newBase);
      await copyFiles(filePath, newBase);
    } else {
      const copyPath = {
        input: filePath,
        output: path.join(destPathBase, file.name),
      };
      await copyFile(copyPath.input, copyPath.output);
    }
  }
}
