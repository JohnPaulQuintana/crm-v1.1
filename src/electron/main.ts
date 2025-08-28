import { app, BrowserWindow, ipcMain, globalShortcut, screen } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";

import { registerAuthHandlers } from "./auth.js";
import { registerSqlHandlers } from "./sql.js";
import { registerCredentialHandlers } from "./credentials.js";
import { setupAutoUpdater } from "./updater.js";
import { bootstrapResources } from "./resources.js";
import { registerSqlDescriptionHandlers } from "./sqlDescription.js";

app.on("ready", () => {
  const display = screen.getPrimaryDisplay();
  const scaleFactor = display.scaleFactor; // e.g. 1, 1.25, 1.5, 2
  // console.log(scaleFactor)
  bootstrapResources();

  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: getPreloadPath(),
      devTools: isDev(), // ⛔ disable DevTools in production
      zoomFactor: 2, // adjust this to scale UI
    },
  });

   // ✅ Apply scaling so UI looks the same on all resolutions
  mainWindow.webContents.setZoomFactor(scaleFactor);

  mainWindow.maximize();
  mainWindow.setMenuBarVisibility(false);

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));

    // 🚫 Prevent DevTools opening in production
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });

    // 🚫 Block DevTools shortcuts
    app.on("browser-window-focus", () => {
      globalShortcut.register("CommandOrControl+Shift+I", () => false);
      globalShortcut.register("F12", () => false);
    });

    app.on("browser-window-blur", () => {
      globalShortcut.unregisterAll();
    });
  }

  setupAutoUpdater(mainWindow); // forward updater events to window instead of blocking dialogs

  // --- Register IPC handlers ---
  registerAuthHandlers(ipcMain);
  registerSqlHandlers(ipcMain);
  registerCredentialHandlers(ipcMain);
  registerSqlDescriptionHandlers(ipcMain);
});



// import { app, BrowserWindow, ipcMain, dialog } from "electron";
// import path from "path";
// import fs from "fs";
// import { spawn } from "child_process";
// import { isDev } from "./util.js";
// import { getPreloadPath } from "./pathResolver.js";
// import admin from "firebase-admin";
// import { verifyIdToken } from "./firebase.js";
// import { chromium, Page, Browser, Locator } from "playwright-core";

// import https from "https";
// import pkg from "electron-updater";
// const { autoUpdater } = pkg;

// // Add this function near your other utility functions
// function getChromiumExecutablePath() {
//   // In production, Electron packs into resources
//   const base = path.join(process.resourcesPath, "chromium", "chrome-win");

//   // In dev, resolve relative to project root
//   const devBase = path.join(
//     app.getAppPath(),
//     "dist-electron",
//     "chromium",
//     "chrome-win"
//   );

//   // Decide path
//   const exePath =
//     process.env.NODE_ENV === "development"
//       ? path.join(devBase, "chrome.exe")
//       : path.join(base, "chrome.exe");

//   if (!fs.existsSync(exePath)) {
//     throw new Error(`Chromium not found at ${exePath}`);
//   }

//   return exePath;
// }

// // ==================================================
// // Bootstrap Default Resources
// // ==================================================
// function bootstrapResources() {
//   const resources = ["sql", "session", "config"];

//   resources.forEach((subdir) => {
//     const sourceDir = isDev()
//       ? path.join(app.getAppPath(), "dist-electron", subdir)
//       : path.join(process.resourcesPath, subdir);

//     const targetDir = getWritableDir(subdir);

//     if (fs.existsSync(sourceDir)) {
//       // Copy only missing files (so user edits aren’t overwritten)
//       fs.readdirSync(sourceDir, { withFileTypes: true }).forEach((entry) => {
//         const srcPath = path.join(sourceDir, entry.name);
//         const destPath = path.join(targetDir, entry.name);

//         if (entry.isDirectory()) {
//           fs.mkdirSync(destPath, { recursive: true });
//           fs.cpSync(srcPath, destPath, { recursive: true, force: false });
//         } else {
//           if (!fs.existsSync(destPath)) {
//             fs.copyFileSync(srcPath, destPath);
//           }
//         }
//       });
//     }
//   });
// }

// // ==================================================
// // Writable Path Helpers
// // ==================================================
// function getWritableDir(subdir: string) {
//   const dir = path.join(app.getPath("userData"), subdir);
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
//   return dir;
// }

// function ensureFileCopied(subdir: string, brand: string, file: string) {
//   const userDir = getWritableDir(path.join(subdir, brand));
//   const userPath = path.join(userDir, file);

//   if (!fs.existsSync(userPath)) {
//     const resourcePath = isDev()
//       ? path.join(app.getAppPath(), "dist-electron", subdir, brand, file)
//       : path.join(process.resourcesPath, subdir, brand, file);

//     if (fs.existsSync(resourcePath)) {
//       fs.copyFileSync(resourcePath, userPath);
//     }
//   }

//   return userPath;
// }

// // ==================================================
// // Utilities
// // ==================================================
// function checkSiteReachable(url: string): Promise<boolean> {
//   return new Promise((resolve) => {
//     https
//       .get(url, (res) => {
//         resolve(res.statusCode! >= 200 && res.statusCode! < 400);
//       })
//       .on("error", (err) => {
//         console.error("checkSiteReachable error:", err.message);
//         resolve(false);
//       });
//   });
// }

// const getSessionBaseDir = () => {
//   return isDev()
//     ? path.join(app.getAppPath(), "dist-electron", "session")
//     : getWritableDir("session");
// };

// const getSqlBaseDir = () => {
//   return isDev()
//     ? path.join(app.getAppPath(), "dist-electron", "sql")
//     : getWritableDir("sql");
// };

// const getCredentialsPath = () =>
//   path.join(getSessionBaseDir(), "credentials.json");

// // ==================================================
// // Main Window
// // ==================================================
// app.on("ready", () => {
//   // First-run bootstrap (copy default resources)
//   bootstrapResources();

//   const mainWindow = new BrowserWindow({
//     width: 1920,
//     height: 1080,
//     frame: true,
//     autoHideMenuBar: true,
//     webPreferences: {
//       preload: getPreloadPath(),
//     },
//   });

//   mainWindow.maximize();
//   mainWindow.setMenuBarVisibility(false);

//   if (isDev()) {
//     mainWindow.loadURL("http://localhost:5173");
//   } else {
//     mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
//   }

//   // Auto update check
//   autoUpdater.checkForUpdatesAndNotify();
// });

// // 🔔 Update events with dialogs
// autoUpdater.on("checking-for-update", () => {
//   console.log("Checking for update...");
// });

// autoUpdater.on("update-available", (info) => {
//   dialog.showMessageBox({
//     type: "info",
//     title: "Update Available",
//     message: `A new version (${info.version}) is available. It is being downloaded.`,
//   });
// });

// autoUpdater.on("update-not-available", () => {
//   console.log("You are already running the latest version.");
//   // dialog.showMessageBox({
//   //   type: "info",
//   //   title: "No Updates",
//   //   message: "You are already running the latest version.",
//   // });
// });

// autoUpdater.on("error", (err) => {
//   dialog.showErrorBox(
//     "Update Error",
//     err == null ? "unknown" : (err.stack || err).toString()
//   );
// });

// autoUpdater.on("download-progress", (progress) => {
//   console.log(
//     `Download speed: ${progress.bytesPerSecond} - ${progress.percent.toFixed(
//       2
//     )}%`
//   );
// });

// autoUpdater.on("update-downloaded", (info) => {
//   dialog
//     .showMessageBox({
//       type: "question",
//       buttons: ["Restart Now", "Later"],
//       defaultId: 0,
//       cancelId: 1,
//       title: "Update Ready",
//       message: `Version ${info.version} has been downloaded. Restart the app now to apply the update.`,
//     })
//     .then((result) => {
//       if (result.response === 0) {
//         autoUpdater.quitAndInstall();
//       }
//     });
// });

// // ==================================================
// // IPC Handlers
// // ==================================================

// // ---------- Auth ----------
// ipcMain.handle("auth:verify", async (_event, token: string) => {
//   try {
//     const decoded = await verifyIdToken(token);
//     const userRecord = await admin.auth().getUser(decoded.uid);
//     const userDoc = await admin
//       .firestore()
//       .collection("users")
//       .doc(decoded.uid)
//       .get();
//     const role = userDoc.exists ? userDoc.data()?.role ?? "user" : "user";

//     return {
//       success: true,
//       uid: decoded.uid,
//       name: userRecord.displayName,
//       email: userRecord.email,
//       photoURL: userRecord.photoURL,
//       role,
//     };
//   } catch (err: any) {
//     return { success: false, error: err?.message ?? "Invalid token" };
//   }
// });

// // ---------- SQL ----------
// ipcMain.handle("sql:getBrands", async () => {
//   try {
//     const brands = fs
//       .readdirSync(getSqlBaseDir(), { withFileTypes: true })
//       .filter((dirent) => dirent.isDirectory())
//       .map((dirent) => dirent.name);
//     return { success: true, brands };
//   } catch (err: any) {
//     return { success: false, error: err.message };
//   }
// });

// ipcMain.handle("sql:getFiles", async (_event, brand: string) => {
//   try {
//     const brandDir = path.join(getSqlBaseDir(), brand);
//     if (!fs.existsSync(brandDir)) throw new Error("Brand not found");
//     const files = fs
//       .readdirSync(brandDir)
//       .filter((file) => file.endsWith(".sql"));
//     return { success: true, files };
//   } catch (err: any) {
//     return { success: false, error: err.message };
//   }
// });

// ipcMain.handle(
//   "sql:getFileContent",
//   async (_event, brand: string, file: string) => {
//     try {
//       const filePath = ensureFileCopied("sql", brand, file);
//       const content = fs.readFileSync(filePath, "utf-8");
//       return { success: true, content };
//     } catch (err: any) {
//       return { success: false, error: err.message };
//     }
//   }
// );

// // ---------- Credentials ----------
// ipcMain.handle("credentials:get", async () => {
//   const credPath = getCredentialsPath();
//   if (fs.existsSync(credPath)) {
//     return {
//       success: true,
//       credentials: JSON.parse(fs.readFileSync(credPath, "utf-8")),
//     };
//   }
//   return { success: false, error: "No credentials saved" };
// });

// ipcMain.handle(
//   "credentials:update",
//   async (_event, creds: { username: string; password: string }) => {
//     const credPath = getCredentialsPath();
//     fs.mkdirSync(path.dirname(credPath), { recursive: true });
//     fs.writeFileSync(credPath, JSON.stringify(creds, null, 2));
//     return { success: true };
//   }
// );

// // ---------- Save & Run SQL ----------
// ipcMain.handle(
//   "save-file-content",
//   async (_event, brand: string, file: string, content: string) => {
//     let browser: Browser | undefined;
//     let page: Page | undefined;
//     let newTab: Locator | undefined;
//     let storageStatePath = "";

//     try {
//       // --- File and session setup ---
//       // const filePath = ensureFileCopied("sql", brand, file);
//       // fs.writeFileSync(filePath, content, "utf-8");

//       const sessionDir = getSessionBaseDir();
//       fs.mkdirSync(sessionDir, { recursive: true });
//       storageStatePath = path.join(sessionDir, "auth.json");
//       const metaPath = path.join(sessionDir, "auth_meta.json");

//       const loginUrl = "https://ar0ytyts.superdv.com/login";
//       const credPath = getCredentialsPath();

//       const reachable = await checkSiteReachable(loginUrl);
//       if (!reachable) {
//         return {
//           success: false,
//           type: "vpn_error",
//           error: "Site not reachable.",
//         };
//       }

//       if (!fs.existsSync(credPath)) {
//         return {
//           success: false,
//           type: "credentials_required",
//           error: "No credentials found.",
//         };
//       }

//       const credentials = JSON.parse(fs.readFileSync(credPath, "utf-8"));

//       // --- Launch Playwright ---
//       browser = await chromium.launch({
//         headless: true,
//         executablePath: getChromiumExecutablePath(),
//         args: [
//           "--no-sandbox",
//           "--disable-setuid-sandbox",
//           "--disable-dev-shm-usage",
//           "--disable-gpu",
//         ],
//       });

//       // --- Determine if we can reuse existing session ---
//       let lastUsername = "";
//       if (fs.existsSync(metaPath)) {
//         lastUsername = JSON.parse(fs.readFileSync(metaPath, "utf-8")).username;
//       }
//       const useExistingSession =
//         fs.existsSync(storageStatePath) &&
//         lastUsername === credentials.username;

//       const context = useExistingSession
//         ? await browser.newContext({ storageState: storageStatePath })
//         : await browser.newContext();

//       page = await context.newPage();
//       await page.goto(loginUrl);

//       // --- Login if session missing or username changed ---
//       if (!useExistingSession) {
//         await page.fill("#username", credentials.username);
//         await page.fill("#password", credentials.password);
//         await Promise.all([
//           page.waitForURL(/.*\/superset\/(welcome|dashboard).*/, {
//             timeout: 15000,
//           }),
//           page.click('input[type="submit"][value="Sign In"]'),
//         ]);
//         await context.storageState({ path: storageStatePath });
//         fs.writeFileSync(
//           metaPath,
//           JSON.stringify({ username: credentials.username })
//         );
//       }

//       await page.goto("https://ar0ytyts.superdv.com/superset/sqllab");

//       // --- Add a new query tab ---
//       await page.click("button.ant-tabs-nav-add", { force: true });
//       await page.waitForTimeout(2000);

//       newTab = page.locator(
//         ".ant-tabs-tab.ant-tabs-tab-active:has(button.ant-tabs-tab-remove)"
//       );
//       await newTab.waitFor();

//       const tabName = await newTab
//         .locator(".ant-tabs-tab-btn span")
//         .innerText();
//       console.log("Created query tab:", tabName);

//       // --- Prepare Ace editor ---
//       await page.waitForSelector("#ace-editor");
//       await page.click("#ace-editor");
//       await page.keyboard.press("Control+A");
//       await page.keyboard.press("Backspace");

//       const sanitizedSQL = content.replace(/\{\{|\}\}/g, "");

//       await page.evaluate((sql: string) => {
//         const editor = (window as any).ace.edit("ace-editor");
//         editor.setValue(sql, -1);
//       }, sanitizedSQL);

//       // --- Set LIMIT dropdown ---
//       try {
//         // Open dropdown
//         await page.click("a.ant-dropdown-trigger");

//         // Wait for the option (example: "1 000")
//         const limitOption = page
//           .locator('li.ant-dropdown-menu-item:has-text("1 000")')
//           .first(); // pick the first match
//         await limitOption.waitFor({ state: "visible", timeout: 5000 });

//         // Select the option
//         await limitOption.click();
//         console.log("LIMIT dropdown set to 1 000");
//       } catch (err) {
//         console.warn("Failed to set LIMIT dropdown:", (err as Error).message);
//       }

//       // --- SQL Execution ---
//       let sqlResult: any = null;

//       try {
//         const runButton = page.locator("button.superset-button.cta", {
//           hasText: /Run/i,
//         });
//         await runButton.waitFor({ state: "visible", timeout: 10000 });
//         await runButton.scrollIntoViewIfNeeded();

//         sqlResult = await new Promise<any>((resolve, reject) => {
//           const timeout = setTimeout(
//             () => reject(new Error("SQL query timed out")),
//             60000
//           );

//           page?.on("response", async (response) => {
//             try {
//               if (response.url().includes("/superset/sql_json/")) {
//                 clearTimeout(timeout);

//                 if (response.status() === 200) {
//                   const body = await response.json();
//                   if (body.error)
//                     reject(new Error(`Query Error: ${body.error}`));
//                   else resolve(body);
//                 } else if (response.status() === 403) {
//                   reject(
//                     new Error(
//                       "Your account does not have enough permissions for this query."
//                     )
//                   );
//                 } else {
//                   reject(
//                     new Error(
//                       `SQL request failed with status ${response.status()}`
//                     )
//                   );
//                 }
//               }
//             } catch (err) {
//               reject(err);
//             }
//           });

//           // Click Run after listener is active
//           runButton.click({ force: true }).catch(reject);
//         });
//       } catch (err: any) {
//         return {
//           success: false,
//           type: "sql_error",
//           error: err.message || "Unknown SQL error",
//           sessionPath: storageStatePath,
//         };
//       }

//       // --- Return SQL result ---
//       return {
//         success: true,
//         type: "success",
//         title: sqlResult?.query?.db || "No Database",
//         data: sqlResult?.data?.length ? sqlResult.data : [],
//         columns: sqlResult?.columns?.length ? sqlResult.columns : [],
//         sessionPath: storageStatePath,
//       };
//     } catch (err: any) {
//       return { success: false, type: "auth_error", error: err.message };
//     } finally {
//       // --- Guaranteed cleanup ---
//       try {
//         if (newTab) {
//           const closeBtn = newTab.locator("button.ant-tabs-tab-remove");
//           await closeBtn.click();
//           console.log("Closed tab");
//         }
//         if (browser) {
//           await browser.close();
//           console.log("Browser closed");
//         }
//       } catch (cleanupErr) {
//         console.error("Cleanup failed:", (cleanupErr as Error).message);
//       }
//     }
//   }
// );

// import { app, BrowserWindow, ipcMain } from "electron";
// import path from "path";
// import fs from "fs";
// import { isDev } from "./util.js";
// import { getPreloadPath } from "./pathResolver.js";
// import admin from "firebase-admin";
// import { verifyIdToken } from "./firebase.js";
// import { chromium } from "playwright";
// import https from "https";

// // ---------- Helpers ----------
// function checkSiteReachable(url: string): Promise<boolean> {
//   return new Promise((resolve) => {
//     https
//       .get(url, (res) => {
//         resolve(res.statusCode! >= 200 && res.statusCode! < 400);
//       })
//       .on("error", (err) => {
//         console.error("checkSiteReachable error:", err.message);
//         resolve(false);
//       });
//   });
// }

// const getSessionBaseDir = () => {
//   if (isDev()) {
//     return path.join(app.getAppPath(), "dist-electron", "session");
//   } else {
//     return path.join(process.resourcesPath, "session");
//   }
// };

// const getSqlBaseDir = () => {
//   if (isDev()) {
//     return path.join(app.getAppPath(), "dist-electron", "sql");
//   } else {
//     return path.join(process.resourcesPath, "sql");
//   }
// };

// const getCredentialsPath = () =>
//   path.join(getSessionBaseDir(), "credentials.json");

// // ---------- App ----------
// app.on("ready", () => {
//   const mainWindow = new BrowserWindow({
//     width: 1920,
//     height: 1080,
//     frame: true,
//     autoHideMenuBar: false,
//     webPreferences: {
//       preload: getPreloadPath(),
//     },
//   });

//   mainWindow.maximize();
//   mainWindow.setMenuBarVisibility(true);

//   if (isDev()) {
//     mainWindow.loadURL("http://localhost:5173");
//   } else {
//     mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
//   }
// });

// // ---------- IPC handlers ----------
// // Auth
// ipcMain.handle("auth:verify", async (_event, token: string) => {
//   try {
//     const decoded = await verifyIdToken(token);
//     const userRecord = await admin.auth().getUser(decoded.uid);
//     const userDoc = await admin
//       .firestore()
//       .collection("users")
//       .doc(decoded.uid)
//       .get();
//     const role = userDoc.exists ? userDoc.data()?.role ?? "user" : "user";

//     return {
//       success: true,
//       uid: decoded.uid,
//       name: userRecord.displayName,
//       email: userRecord.email,
//       photoURL: userRecord.photoURL,
//       role,
//     };
//   } catch (err: any) {
//     return { success: false, error: err?.message ?? "Invalid token" };
//   }
// });

// // SQL
// ipcMain.handle("sql:getBrands", async () => {
//   try {
//     const brands = fs
//       .readdirSync(getSqlBaseDir(), { withFileTypes: true })
//       .filter((dirent) => dirent.isDirectory())
//       .map((dirent) => dirent.name);
//     return { success: true, brands };
//   } catch (err: any) {
//     return { success: false, error: err.message };
//   }
// });

// ipcMain.handle("sql:getFiles", async (_event, brand: string) => {
//   try {
//     const brandDir = path.join(getSqlBaseDir(), brand);
//     if (!fs.existsSync(brandDir)) throw new Error("Brand not found");
//     const files = fs
//       .readdirSync(brandDir)
//       .filter((file) => file.endsWith(".sql"));
//     return { success: true, files };
//   } catch (err: any) {
//     return { success: false, error: err.message };
//   }
// });

// ipcMain.handle(
//   "sql:getFileContent",
//   async (_event, brand: string, file: string) => {
//     try {
//       const filePath = path.join(getSqlBaseDir(), brand, file);
//       if (!fs.existsSync(filePath)) throw new Error("SQL file not found");
//       const content = fs.readFileSync(filePath, "utf-8");
//       return { success: true, content };
//     } catch (err: any) {
//       return { success: false, error: err.message };
//     }
//   }
// );

// // ---------- Credentials management ----------
// ipcMain.handle("credentials:get", async () => {
//   const credPath = getCredentialsPath();
//   if (fs.existsSync(credPath)) {
//     return {
//       success: true,
//       credentials: JSON.parse(fs.readFileSync(credPath, "utf-8")),
//     };
//   }
//   return { success: false, error: "No credentials saved" };
// });

// ipcMain.handle(
//   "credentials:update",
//   async (_event, creds: { username: string; password: string }) => {
//     const credPath = getCredentialsPath();
//     fs.mkdirSync(path.dirname(credPath), { recursive: true });
//     fs.writeFileSync(credPath, JSON.stringify(creds, null, 2));
//     return { success: true };
//   }
// );

// // ---------- Save & authenticate & run SQL ----------
// ipcMain.handle(
//   "save-file-content",
//   async (_event, brand: string, file: string, content: string) => {
//     try {
//       const filePath = path.join(getSqlBaseDir(), brand, file);
//       if (!fs.existsSync(filePath))
//         throw new Error("File does not exist (cannot create new files)");

//       fs.writeFileSync(filePath, content, "utf-8");

//       const sessionDir = getSessionBaseDir();
//       fs.mkdirSync(sessionDir, { recursive: true });

//       const storageStatePath = path.join(sessionDir, "auth.json");
//       const loginUrl = "https://ar0ytyts.superdv.com/login";
//       const credPath = getCredentialsPath();

//       // --- Check VPN/site reachability ---
//       // const reachable = await checkSiteReachable(loginUrl);
//       // if (!reachable) {
//       //   return {
//       //     success: false,
//       //     type: "vpn_error",
//       //     error: "Site not reachable. Please enable VPN first.",
//       //   };
//       // }

//       // // --- Check credentials ---
//       // if (!fs.existsSync(credPath)) {
//       //   return {
//       //     success: false,
//       //     type: "credentials_required",
//       //     error: "No credentials found. Please provide username & password.",
//       //   };
//       // }
//       // const credentials = JSON.parse(fs.readFileSync(credPath, "utf-8"));

//       // // --- Start Playwright ---
//       // const browser = await chromium.launch({ headless: false });
//       // let context;
//       // if (fs.existsSync(storageStatePath)) {
//       //   context = await browser.newContext({ storageState: storageStatePath });
//       // } else {
//       //   context = await browser.newContext();
//       // }

//       // const page = await context.newPage();
//       // await page.goto(loginUrl);

//       // // --- Login if no session ---
//       // if (!fs.existsSync(storageStatePath)) {
//       //   await page.fill("#username", credentials.username);
//       //   await page.fill("#password", credentials.password);

//       //   try {
//       //     await Promise.all([
//       //       page.waitForURL(/.*\/superset\/(welcome|dashboard).*/, {
//       //         timeout: 15000,
//       //       }),
//       //       page.click('input[type="submit"][value="Sign In"]'),
//       //     ]);
//       //     await context.storageState({ path: storageStatePath });
//       //   } catch (err) {
//       //     await browser.close();
//       //     return {
//       //       success: false,
//       //       type: "invalid_credentials",
//       //       error: "Login failed. Please check username & password.",
//       //     };
//       //   }
//       // }

//       // // --- Navigate to SQL Lab ---
//       // try {
//       //   await page.goto("https://ar0ytyts.superdv.com/superset/sqllab");
//       // } catch {
//       //   // Session expired → re-login
//       //   await page.goto(loginUrl);
//       //   await page.fill("#username", credentials.username);
//       //   await page.fill("#password", credentials.password);
//       //   await Promise.all([
//       //     page.waitForURL("**/superset/welcome"),
//       //     page.click('input[type="submit"][value="Sign In"]'),
//       //   ]);
//       //   await context.storageState({ path: storageStatePath });
//       //   await page.goto("https://ar0ytyts.superdv.com/superset/sqllab");
//       // }

//       // const title = await page.title();

//       // // --- Wait for Ace editor ---
//       // await page.waitForSelector("#ace-editor");
//       // await page.click("#ace-editor");
//       // await page.keyboard.press("Control+A");
//       // await page.keyboard.press("Backspace");

//       // // Inject SQL
//       // // console.log("Injecting SQL Query:", content);
//       // // Remove only the curly braces, keep the content inside
//       // const sanitizedSQL = content.replace(/\{\{|\}\}/g, "");
//       // await page.evaluate((sql) => {
//       //   const editor = (window as any).ace.edit("ace-editor");
//       //   editor.setValue(sql, -1);
//       // }, sanitizedSQL);

//       // // --- Listen for Superset SQL response ---
//       // const sqlResult = new Promise<any>((resolve, reject) => {
//       //   page.on("response", async (response) => {
//       //     try {
//       //       if (
//       //         response.url().includes("/superset/sql_json/") &&
//       //         response.status() === 200
//       //       ) {
//       //         const body = await response.json();
//       //         if (body.error) {
//       //           reject(new Error(`Query Error: ${body.error}`));
//       //         } else {
//       //           resolve(body);
//       //         }
//       //       }
//       //     } catch (err) {
//       //       reject(err);
//       //     }
//       //   });
//       // });

//       // // --- Click Run button ---
//       // await page.click('button.superset-button.cta:has-text("Run")');

//       // // --- Wait for SQL result ---
//       // const result = await sqlResult;
//       // console.log("===============================")
//       // console.log(result)
//       // console.log("===============================")
//       // // await browser.close();

//       // return {
//       //   success: true,
//       //   type: "success",
//       //   title,
//       //   data: result,
//       //   sessionPath: storageStatePath,
//       // };

//       //for testing only
//       return {
//         success: true,
//         type: "success",
//         title: "dwadwa",
//         data: [
//           { Date: "2025-08-22", NSU: 120, FTD: 15, ConversionRate: "12.5%" },
//           { Date: "2025-08-23", NSU: 135, FTD: 18, ConversionRate: "13.3%" },
//           { Date: "2025-08-24", NSU: 110, FTD: 12, ConversionRate: "10.9%" },
//           // Add more rows dynamically
//         ],
//         sessionPath: storageStatePath,
//       };
//     } catch (err: any) {
//       return { success: false, type: "auth_error", error: err.message };
//     }
//   }
// );
