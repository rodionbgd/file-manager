const { ipcRenderer } = require("electron");
const { join } = require("path");
const fs = require("fs");

window.electron = {
  startDrag: (fileName, cwd) => {
    ipcRenderer.send("dragndrop", join(cwd, fileName));
  },
  moveFile: async (fileName, dst, cwd) => {
    if (fileName === "..") {
      return;
    }
    try {
      await ipcRenderer.invoke(
        "moveFile",
        fileName,
        join(cwd, fileName),
        join(cwd, dst)
      );
    } catch (e) {
      throw e;
    }
  },
  renameFile: async (dir, prevName, newName) => {
    let res = false;
    try {
      if (!newName || prevName === newName) {
        return false;
      }
      res = await ipcRenderer.invoke(
        "renameFile",
        join(dir, prevName),
        join(dir, newName)
      );
    } catch (e) {
      throw e;
    }
    return res;
  },
  onRename: (isRenamed) => {
    ipcRenderer.on("renameFile", () => {
      isRenamed.value = !isRenamed.value;
    });
  },
  openFile: (dir, fileName) => {
    ipcRenderer.send("openFile", join(dir, fileName));
  },
  joinPath: (dir, fileName) => {
    return join(dir, fileName);
  },
  onShowHiddenFiles: (isHiddenFiles) => {
    ipcRenderer.on("showHiddenFiles", (event, checked) => {
      isHiddenFiles.value = checked;
    });
  },
  removeFile: async (dir, fileName, isDir) => {
    if (fileName === "..") {
      return false;
    }
    try {
      debugger;
      await ipcRenderer.invoke("removeFile", join(dir, fileName), isDir);
    } catch (e) {
      throw e;
    }
    return true;
  },
  onRemove: (isRemoved) => {
    ipcRenderer.on("deleteFile", () => {
      isRemoved.value = !isRemoved.value;
    });
  },

  watchDir: (isUpdatedFileList) => {
    let fsWatcher = null;
    return function (dir) {
      if (fsWatcher) {
        fsWatcher.close();
        fsWatcher = null;
      }
      try {
        fsWatcher = fs.watch(dir, () => {
          isUpdatedFileList.value = !isUpdatedFileList.value;
        });
      } catch (e) {
        throw e;
      }
    };
  },
};
