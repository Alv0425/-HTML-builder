const path = require('path');
const { readdir, copyFile, rm, mkdir, access } = require('fs/promises');

const allFilesPaths = [];
const dirPath = path.join(__dirname, 'files');
const copyDirPath = path.join(__dirname, 'files-copy');
const outputPaths = [];

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
  for (const file of output) {
    await access(file.input);
    await copyFile(file.input, file.output);
  }
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

async function getPaths(base, filesPaths) {
  await Promise.all(
    filesPaths.map((filePath) => {
      if (filePath.type === 'file') {
        const iopath = {
          input: filePath.path,
          output: path.join(base, filePath.name),
        };
        return outputPaths.push(iopath);
      }
      return getPaths(path.join(base, filePath.name), filePath.files);
    }),
  );
}

(async function () {
  await createDir(copyDirPath);
  await extractInfo(dirPath, allFilesPaths);
  await createDirThree(copyDirPath, allFilesPaths);
  await getPaths(copyDirPath, allFilesPaths);
  await copyAll(outputPaths);
})();
