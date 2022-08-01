const { exec } = require("child_process");
const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const { join } = require("path");
const fs = require("fs");

if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

let win = null;

const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}`;

const menuOptions = {
  checkedHiddenFiles: false,
};

const template = [
  {
    label: "File",
    submenu: [
      {
        label: "Delete",
        accelerator: "Delete",
        click: () => {
          win?.webContents.send("deleteFile");
        },
      },
      {
        label: "Rename",
        accelerator: "F2",
        click: () => {
          win?.webContents.send("renameFile");
        },
      },
      {
        label: "Reload",
        role: "reload",
      },
    ],
  },
  {
    label: "Dev tools",
    role: "toggleDevTools",
  },
  {
    label: "Show",
    submenu: [
      {
        label: "Show hidden files",
        type: "checkbox",
        accelerator: "Ctrl+H",
        checked: menuOptions.checkedHiddenFiles,
        click: () => {
          menuOptions.checkedHiddenFiles = !menuOptions.checkedHiddenFiles;
          win?.webContents.send(
            "showHiddenFiles",
            menuOptions.checkedHiddenFiles
          );
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);

async function createWindow() {
  win = new BrowserWindow({
    // fullscreen: true,
    title: "Main window",
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: join(__dirname, "../../electron/preload.js"),
    },
    // backgroundColor: "#2e2c29"
  });

  if (app.isPackaged) {
    await win.loadFile(join(__dirname, "../../index.html"));
  } else {
    await win.loadURL(url);
    if (process.env.NODE_ENV === "development") {
      win.webContents.openDevTools();
    }
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
      allWindows[0].focus();
    } else {
      createWindow();
    }
  });
  Menu.setApplicationMenu(menu);
});

app.on("window-all-closed", () => {
  win = null;
  app.clearRecentDocuments();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("dragndrop", (event, filePath) => {
  event.sender.startDrag({
    file: filePath,
    icon: join(__dirname, "../../src/assets/logo.png"),
  });
});

ipcMain.handle("moveFile", (event, fileName, src, dst) => {
  try {
    fs.renameSync(src, join(dst, fileName));
  } catch (e) {
    throw e;
  }
});

ipcMain.on("openFile", async (event, fileName) => {
  let execCommand;
  if (process.platform === "darwin") {
    execCommand = "open";
  } else if (process.platform === "win32") {
    execCommand = "start";
  } else if (process.platform === "linux") {
    execCommand = "xdg-open";
  }
  exec(`${execCommand} "${fileName}"`);
});

ipcMain.handle("renameFile", (event, prevName, newName) => {
  try {
    fs.renameSync(prevName, newName);
  } catch (e) {
    throw e;
  }
  return true;
});

ipcMain.handle("removeFile", (event, fileName, isDir) => {
  try {
    fs.unlinkSync(fileName);
  } catch (e) {
    if (isDir) {
      fs.rmdirSync(fileName, { recursive: true });
    } else {
      throw e;
    }
  }
});
