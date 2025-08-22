import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import admin from "firebase-admin";
import { verifyIdToken } from "./firebase.js";
// type test = string;

const getSqlBaseDir = () => {
  if (isDev()) {
    // During development, SQL files are in dist-electron/sql
    return path.join(app.getAppPath(), "dist-electron", "sql");
  } else {
    // In production, extraResources are unpacked by Electron Builder
    return path.join(process.resourcesPath, "dist-electron", "sql");
  }
};

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: true,
    autoHideMenuBar: false,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  mainWindow.maximize();  // fills the screen but menu bar remains
  mainWindow.setMenuBarVisibility(true); // ensure menu bar is visible

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }
});

// ---------- IPC handlers ----------
// Auth
ipcMain.handle("auth:verify", async (_event, token: string) => {
  try {
    const decoded = await verifyIdToken(token);
    const userRecord = await admin.auth().getUser(decoded.uid);
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(decoded.uid)
      .get();
    const role = userDoc.exists ? userDoc.data()?.role ?? "user" : "user";

    return {
      success: true,
      uid: decoded.uid,
      name: userRecord.displayName,
      email: userRecord.email,
      photoURL: userRecord.photoURL,
      role,
    };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Invalid token" };
  }
});

// SQL
ipcMain.handle("sql:getBrands", async () => {
  try {
    const brands = fs
      .readdirSync(getSqlBaseDir(), { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    return { success: true, brands };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("sql:getFiles", async (_event, brand: string) => {
  try {
    const brandDir = path.join(getSqlBaseDir(), brand);
    if (!fs.existsSync(brandDir)) throw new Error("Brand not found");
    const files = fs
      .readdirSync(brandDir)
      .filter((file) => file.endsWith(".sql"));
    return { success: true, files };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle(
  "sql:getFileContent",
  async (_event, brand: string, file: string) => {
    try {
      const filePath = path.join(getSqlBaseDir(), brand, file);
      if (!fs.existsSync(filePath)) throw new Error("SQL file not found");
      const content = fs.readFileSync(filePath, "utf-8");
      return { success: true, content };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
);

// Save existing SQL file
ipcMain.handle(
  "save-file-content",
  async (_event, brand: string, file: string, content: string) => {
    try {
      const filePath = path.join(getSqlBaseDir(), brand, file);
      if (!fs.existsSync(filePath))
        throw new Error("File does not exist (cannot create new files)");
      fs.writeFileSync(filePath, content, "utf-8");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
);
