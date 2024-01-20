const path = require('path');
const { readdir, readFile, copyFile, rm, mkdir } = require('fs/promises');
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

const assetsPathes = [];
const dirThree = [];
const sourcesStylesPaths = [];
const htmlTemplPaths = [];
const componentsHTML = {};

(async () => {
  // create dir three and copy assets
  await createDir(distDirPath);
  await createDir(destAssetsPath);
  await extractInfo(assetsSourcePath, destAssetsPath);
  await createDirThree();
  await copyAll(assetsPathes);
  // merge styles
  await getSources(stylesSourcesPath, sourcesStylesPaths, '.css');
  await prepFile(stylesBundlePath);
  await mergeStyles();
  // generate HTML from template
  await getSources(htmlComponentsPath, htmlTemplPaths, '.html');
  await prepFile(htmlBundlePath);
  await readComponents();
  await generateHTML();
})();

/* ----------  Generate HTML file from template  ----------- */
async function readComponents() {
  for (const compPath of htmlTemplPaths) {
    const readfile = await readFile(compPath, { encoding: 'utf-8' });
    const name = path.basename(compPath, '.html');
    const placeholder = `{{${name}}}`;
    componentsHTML[placeholder] = readfile;
  }
}

async function generateHTML() {
  let templ = await readFile(htmlTemplPath, { encoding: 'utf-8' });
  for (const placeholder in componentsHTML) {
    templ = templ.replaceAll(placeholder, componentsHTML[placeholder]);
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

// if file already exists, rewrite content
async function prepFile(src) {
  const clearFile = fs.createWriteStream(src, {
    encoding: 'utf-8',
  });
  clearFile.write('');
}

// asynchronyosly merge files
async function mergeStyles() {
  for (const source of sourcesStylesPaths) {
    const writeStyle = fs.createWriteStream(stylesBundlePath, {
      flags: 'a',
      encoding: 'utf-8',
    });
    const readSource = fs.createReadStream(source, { encoding: 'utf-8' });
    await pipeline(readSource, writeStyle);
  }
}

/* ----------  Create directories three and copy assets  ----------  */
// create directory
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
// copy all files
async function copyAll(output) {
  for (const file of output) await copyFile(file.input, file.output);
}
// create dir three
async function createDirThree() {
  for (const dirPath of dirThree) await createDir(dirPath);
}
// run recursively over directory for copying and extract paths of all subfolders and files
async function extractInfo(npath, destPathBase) {
  const allFiles = await readdir(npath, { withFileTypes: true });
  for (const file of allFiles) {
    const fileName = file.name;
    const fileDir = file.path;
    const filePath = path.join(fileDir, fileName);
    if (file.isDirectory()) {
      const newBase = path.join(destPathBase, file.name);
      dirThree.push(newBase);
      await extractInfo(filePath, newBase);
    } else {
      const iopath = {
        input: filePath,
        output: path.join(destPathBase, file.name),
      };
      assetsPathes.push(iopath);
    }
  }
}
