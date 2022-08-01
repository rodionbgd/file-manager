export function getCwdFromStorage() {
  const fileManager = JSON.parse(localStorage.getItem("fileManager"));
  return fileManager?.dir;
}

export function setWorkingDir(dir) {
  const fileManager = JSON.parse(localStorage.getItem("fileManager"));
  localStorage.setItem("fileManager", JSON.stringify({ ...fileManager, dir }));
}

export function getShortSize(file) {
  let { isDir, size } = file;
  if (isDir) {
    return "<DIR>";
  }
  const sizeDim = ["", "K", "M", "G", "T"];
  let i = 0;
  while (size / 1024 > 1) {
    i += 1;
    size /= 1024;
  }
  return `${sizeDim[i] ? size.toFixed(2) : size} ${sizeDim[i]}`;
}
