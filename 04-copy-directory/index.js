const path = require('path');
const { readdir, copyFile, rm, mkdir } = require('fs/promises');

const sourceDirPath = path.join(__dirname, 'files');
const copyDirPath = path.join(__dirname, 'files-copy');

(async () => {
  await createDir(copyDirPath);
  await copyFiles(sourceDirPath, copyDirPath);
})();

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
