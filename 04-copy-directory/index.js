const path = require('path');
const { readdir, copyFile, rm, mkdir } = require('fs/promises');

const dirPath = path.join(__dirname, 'files');
const copyDirPath = path.join(__dirname, 'files-copy');
const outputPaths = [];
const dirThree = [];

(async () => {
  await createDir(copyDirPath);
  await extractInfo(dirPath, copyDirPath);
  await createDirThree();
  await copyAll(outputPaths);
})();
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
      outputPaths.push(iopath);
    }
  }
}
