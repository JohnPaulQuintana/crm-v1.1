// //import { autoUpdater } from "electron-updater";
// import { BrowserWindow, dialog } from "electron";
// import pkg from "electron-updater";
// const { autoUpdater } = pkg;

// export function setupAutoUpdater(mainWindow: BrowserWindow) {
//   autoUpdater.checkForUpdatesAndNotify();

//   autoUpdater.on("checking-for-update", () => {
//     console.log("Checking for update...");
//   });

//   autoUpdater.on("update-available", (info) => {
//     mainWindow.webContents.send("update:available", info.version);
//   });

//   autoUpdater.on("update-not-available", () => {
//     mainWindow.webContents.send("update:none");
//   });

//   autoUpdater.on("error", (err) => {
//     dialog.showErrorBox("Update Error", err?.stack || err.toString());
//   });

//   autoUpdater.on("download-progress", (progress) => {
//     mainWindow.webContents.send("update:progress", progress.percent);
//   });

//   autoUpdater.on("update-downloaded", (info) => {
//     dialog
//       .showMessageBox({
//         type: "question",
//         buttons: ["Restart Now", "Later"],
//         defaultId: 0,
//         cancelId: 1,
//         title: "Update Ready",
//         message: `Version ${info.version} has been downloaded. Restart now?`,
//       })
//       .then((res) => {
//         if (res.response === 0) autoUpdater.quitAndInstall();
//       });
//   });

  
// }
import { BrowserWindow, dialog, app } from "electron";
import pkg from "electron-updater";
import fs from "fs";
import path from "path";

const { autoUpdater } = pkg;

function getVersionFilePath() {
  return path.join(app.getPath("userData"), "lastVersion.json");
}

function saveInstalledVersion(version: string) {
  fs.writeFileSync(getVersionFilePath(), JSON.stringify({ version }));
}

function getLastInstalledVersion(): string | null {
  try {
    const file = fs.readFileSync(getVersionFilePath(), "utf-8");
    return JSON.parse(file).version;
  } catch {
    return null;
  }
}

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for update...");
  });

  autoUpdater.on("update-available", (info) => {
    mainWindow.webContents.send("update:available", info.version);
  });

  autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send("update:none");
  });

  autoUpdater.on("error", (err) => {
    dialog.showErrorBox("Update Error", err?.stack || err.toString());
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindow.webContents.send("update:progress", progress.percent);
  });

  autoUpdater.on("update-downloaded", (info) => {
    dialog
      .showMessageBox({
        type: "question",
        buttons: ["Restart Now", "Later"],
        defaultId: 0,
        cancelId: 1,
        title: "Update Ready",
        message: `Version ${info.version} has been downloaded. Restart now?`,
      })
      .then((res) => {
        if (res.response === 0) {
          saveInstalledVersion(info.version); // ✅ Save version before restarting
          autoUpdater.quitAndInstall();
        }
      });
  });

  // ✅ After app start, check if this is a "freshly updated" version
  const currentVersion = app.getVersion();
  const lastVersion = getLastInstalledVersion();
  if (lastVersion !== currentVersion) {
    // Only trigger release notes if version changed
    mainWindow.webContents.once("did-finish-load", () => {
      const releaseNotes = {
        version: currentVersion,
        date: new Date().toLocaleDateString(),
        features: [
          "1. New Bonus Scripts Available – Run the latest bonus scripts right from the app.",
          "2. Improved Description Formatting – Clearer, easier-to-read script descriptions.",
          "3. Date & Datetime Picker – Select dates/times without typing manually.",
          "4. Bug Fixes & Stability Improvements – More reliable and smooth experience.",
        ],
      };
      mainWindow.webContents.send("app:show-release-notes", releaseNotes);
    });

    // Update last installed version to current
    saveInstalledVersion(currentVersion);
  }
}
