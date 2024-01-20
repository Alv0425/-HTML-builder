const path = require('path');
const { readdir, readFile, copyFile, rm, mkdir } = require('fs/promises');
const fs = require('fs');
const { pipeline } = require('stream/promises');

const distDirPath = path.join(__dirname, 'project-dist');
const assetsSourcePath = path.join(__dirname, 'assets');
const destAssetsPath = path.join(distDirPath, 'assets');

const stylesSourcesPath = path.join(__dirname, 'styles');
const stylesBundlePath = path.join(distDirPath, 'style.css');

const htmlComponentsPath = path.join(__dirname, 'components');
const htmlBundlePath = path.join(distDirPath, 'index.html');
const htmlTemplPath = path.join(__dirname, 'template.html');

const assets = [];
const assetsPathes = [];
const sourcesStylesPathes = [];
const htmlTemplPaths = [];
const componentsHTML = {};

(async () => {
  // create dir three and copy assets
  await createDir(distDirPath);
  await createDir(destAssetsPath);
  await extractInfo(assetsSourcePath, assets);
  await createDirThree(destAssetsPath, assets);
  await getAssetsPaths(destAssetsPath, assets);
  await copyAll(assetsPathes);
  // merge styles
  await getSources(stylesSourcesPath, sourcesStylesPathes, '.css');
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

// Get pathes of all files
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

//if file already exists, rewrite content
async function prepFile(src) {
  const clearFile = fs.createWriteStream(src, {
    encoding: 'utf-8',
  });
  clearFile.write('');
}

// Asynchronyosly merge files
async function mergeStyles() {
  for (const source of sourcesStylesPathes) {
    const delimeter = () => {
      return new Promise((res, rej) => {
        const writeDelimeter = fs.createWriteStream(stylesBundlePath, {
          flags: 'a',
          encoding: 'utf-8',
        });
        writeDelimeter.write(`/* ${path.basename(source)} */` + '\n');
        writeDelimeter.end();
        writeDelimeter.on('finish', () => {
          res(true);
        });
      });
    };
    const writeStyle = fs.createWriteStream(stylesBundlePath, {
      flags: 'a',
      encoding: 'utf-8',
    });
    const readSource = fs.createReadStream(source, { encoding: 'utf-8' });
    await delimeter();
    await pipeline(readSource, writeStyle);
  }
}

/* ----------  Create directories three and copy assets  ----------  */
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

async function copyAll(output) {
  for (const file of output) await copyFile(file.input, file.output);
}

async function createDirThree(base, arr) {
  let dirArr = arr.filter((file) => file.type === 'dir');
  if (dirArr.length) {
    for (const dir of dirArr) {
      const newPath = path.join(base, dir.name);
      await createDir(newPath);
      await createDirThree(newPath, dir.files);
    }
  }
}

async function extractInfo(npath, arr) {
  const allFiles = await readdir(npath, { withFileTypes: true });
  for (const file of allFiles) {
    const fileName = file.name;
    const fileDir = file.path;
    const filePath = path.join(fileDir, fileName);
    const fileDescr = {
      type: 'file',
      name: fileName,
      path: filePath,
    };
    if (file.isDirectory()) {
      const subfolderPaths = [];
      await extractInfo(filePath, subfolderPaths);
      fileDescr.type = 'dir';
      fileDescr.files = subfolderPaths;
    }
    arr.push(fileDescr);
  }
}

async function getAssetsPaths(base, filesPaths) {
  await Promise.all(
    filesPaths.map((filePath) => {
      if (filePath.type === 'file') {
        const iopath = {
          input: filePath.path,
          output: path.join(base, filePath.name),
        };
        return assetsPathes.push(iopath);
      }
      return getAssetsPaths(path.join(base, filePath.name), filePath.files);
    }),
  );
}
