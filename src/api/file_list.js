import { join } from "path";
import fs from "fs";
import { setWorkingDir } from "../utils";

export function getFileStats(dir) {
  let fileStats = { open: [], hidden: [] };
  let dirStats = { open: [], hidden: [] };
  try {
    const cwd = dir;
    const files = fs.readdirSync(cwd, {
      encoding: "utf8",
      withFileTypes: true,
    });
    let fStat;
    let isDir;
    let isLink;
    let modeHR;
    let fileStat;
    files.forEach((file) => {
      if (file.isSymbolicLink()) {
        fStat = fs.lstatSync(join(cwd, file.name));
        isLink = true;
      } else {
        fStat = fs.statSync(join(cwd, file.name));
        isLink = false;
      }
      isDir = fStat.isDirectory();
      modeHR = createHumanReadableMode(fStat.mode, isLink);
      fileStat = {
        name: file.name,
        isDir,
        modeHR,
        ...fStat,
      };
      if (isDir) {
        fillStats(file.name, fileStat, dirStats);
      } else {
        fillStats(file.name, fileStat, fileStats);
      }
    });
    if (cwd !== "/") {
      const upLevelDir = join(cwd, "..");
      const fStat = fs.statSync(upLevelDir, {});
      const isDir = fStat.isDirectory();
      const modeHR = createHumanReadableMode(fStat.mode);
      dirStats.open.unshift({
        name: "..",
        isDir,
        modeHR,
        ...fStat,
      });
    }
  } catch (e) {
    if (e.code === "ENOENT" && process.platform === "linux") {
      const newDir = join(dir, "..");
      setWorkingDir(newDir);
      return { ...getFileStats(newDir), isWatch: true };
    } else {
      console.error(e.message);
    }
  }
  return { dirs: dirStats, files: fileStats };
}

function cmpFileNames(a, b) {
  return a.name?.toLowerCase().localeCompare(b.name?.toLowerCase());
}

export function sortByNames(stats) {
  stats.sort(cmpFileNames);
}

function fillStats(fileName, fileStat, stats) {
  let isHidden;
  if (process.platform === "linux" || process.platform === "darwin") {
    isHidden = fileName.startsWith(".");
  } else if (process.platform === "windows") {
    // TODO:
  }
  if (isHidden) {
    stats.hidden.push(fileStat);
  } else {
    stats.open.push(fileStat);
  }
}

function createHumanReadableMode(mode, isLink) {
  let modeBinary = mode.toString(2);
  let modeHR = "-";
  if (modeBinary.length === 15 && modeBinary[0] === "1") {
    modeHR = "d";
  } else if (isLink) {
    modeHR = "l";
  }
  const permissionTypes = ["r", "w", "x"];
  modeBinary = modeBinary.slice(modeBinary.length - 9);
  modeBinary.split("").forEach((permission, index) => {
    if (permission === "1") {
      modeHR += permissionTypes[index % 3];
    } else {
      modeHR += "-";
    }
  });
  return modeHR;
}
