import fs from "fs";
import path from "path";
import type { IpcMain } from "electron";
import { chromium, Page, Browser, Locator } from "playwright-core";
import { getWritableDir } from "./resources.js";
import { isDev } from "./util.js";
import https from "https";
import { getSupersetCredentials, getSupersetCredential } from "./auth.js";

// ==================================================
// Paths & Helpers
// ==================================================
function getSqlBaseDir() {
  return isDev()
    ? path.join(process.cwd(), "dist-electron", "sql")
    : getWritableDir("sql");
}

function getSessionBaseDir() {
  return isDev()
    ? path.join(process.cwd(), "dist-electron", "session")
    : getWritableDir("session");
}

function getCredentialsPath() {
  return path.join(getSessionBaseDir(), "credentials.json");
}

function getChromiumExecutablePath() {
  const base = path.join(process.resourcesPath, "chromium", "chrome-win");
  const devBase = path.join(
    process.cwd(),
    "dist-electron",
    "chromium",
    "chrome-win"
  );

  const exePath =
    process.env.NODE_ENV === "development"
      ? path.join(devBase, "chrome.exe")
      : path.join(base, "chrome.exe");

  if (!fs.existsSync(exePath)) {
    throw new Error(`Chromium not found at ${exePath}`);
  }
  return exePath;
}

function ensureFileCopied(subdir: string, brand: string, file: string) {
  const userDir = getWritableDir(path.join(subdir, brand));
  const userPath = path.join(userDir, file);

  if (!fs.existsSync(userPath)) {
    const resourcePath = isDev()
      ? path.join(process.cwd(), "dist-electron", subdir, brand, file)
      : path.join(process.resourcesPath, subdir, brand, file);

    if (fs.existsSync(resourcePath)) {
      fs.copyFileSync(resourcePath, userPath);
    }
  }

  return userPath;
}

function checkSiteReachable(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        resolve(res.statusCode! >= 200 && res.statusCode! < 400);
      })
      .on("error", () => resolve(false));
  });
}

// ==================================================
// IPC Registration
// ==================================================
export function registerSqlHandlers(ipcMain: IpcMain) {
  // ---------- Brands ----------
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

  // ---------- Files ----------
  ipcMain.handle("sql:getFiles", async (_event, brand: string) => {
    try {
      const brandDir = path.join(getSqlBaseDir(), brand);
      if (!fs.existsSync(brandDir)) throw new Error("Brand not found");
      const files = fs.readdirSync(brandDir).filter((f) => f.endsWith(".sql"));
      return { success: true, files };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ---------- File Content ----------
  ipcMain.handle(
    "sql:getFileContent",
    async (_event, brand: string, file: string) => {
      try {
        const filePath = ensureFileCopied("sql", brand, file);
        const content = fs.readFileSync(filePath, "utf-8");
        return { success: true, content };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  );

  // ---------- Save & Run SQL ----------
  ipcMain.handle(
    "sql:runFile",
    async (_event, brand: string, file: string, content: string) => {
      let browser: Browser | undefined;
      let page: Page | undefined;
      let newTab: Locator | undefined;

      const sessionDir = getSessionBaseDir();
      fs.mkdirSync(sessionDir, { recursive: true });
      const storageStatePath = path.join(sessionDir, "auth.json");
      const metaPath = path.join(sessionDir, "auth_meta.json");
      const loginUrl = "https://ar0ytyts.superdv.com/login";

      try {
        // --- Get Firestore credential ---
        const creds = await getSupersetCredentials();
        const activeCred = creds.find((c: any) => c.status === true);
        if (!activeCred) {
          return {
            success: false,
            type: "credentials_required",
            error: "No active Superset credential found in Firestore",
          };
        }

        // --- VPN check ---
        const reachable = await checkSiteReachable(loginUrl);
        if (!reachable) {
          return {
            success: false,
            type: "vpn_error",
            error: "Site not reachable.",
          };
        }

        // --- Launch Playwright ---
        browser = await chromium.launch({
          headless: true,
          executablePath: getChromiumExecutablePath(),
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        });

        // --- Determine if we can reuse existing session ---
        let lastUsername = "";
        if (fs.existsSync(metaPath)) {
          lastUsername = JSON.parse(
            fs.readFileSync(metaPath, "utf-8")
          ).username;
        }
        const useExistingSession =
          fs.existsSync(storageStatePath) &&
          lastUsername === activeCred.username;

        const context = useExistingSession
          ? await browser.newContext({ storageState: storageStatePath })
          : await browser.newContext();

        page = await context.newPage();
        await page.goto(loginUrl);

        // --- Login if session missing or username changed ---
        if (!useExistingSession) {
          console.log(`Logging in as ${activeCred.username}`);
          await page.fill("#username", activeCred.username);
          await page.fill("#password", activeCred.password);
          await Promise.all([
            page.waitForURL(/.*\/superset\/(welcome|dashboard).*/, {
              timeout: 15000,
            }),
            page.click('input[type="submit"][value="Sign In"]'),
          ]);

          // Save session + who owns it
          await context.storageState({ path: storageStatePath });
          fs.writeFileSync(
            metaPath,
            JSON.stringify({ username: activeCred.username })
          );
        } else {
          console.log(`Reusing existing session for ${activeCred.username}`);
        }

        // --- SQL Lab ---
        await page.goto("https://ar0ytyts.superdv.com/superset/sqllab");

        await page.click("button.ant-tabs-nav-add", { force: true });
        await page.waitForTimeout(2000);

        newTab = page.locator(
          ".ant-tabs-tab.ant-tabs-tab-active:has(button.ant-tabs-tab-remove)"
        );
        await newTab.waitFor();

        // --- Inject SQL into Ace ---
        await page.waitForSelector("#ace-editor");
        await page.click("#ace-editor");
        await page.keyboard.press("Control+A");
        await page.keyboard.press("Backspace");

        const sanitizedSQL = content.replace(/\{\{|\}\}/g, "");
        await page.evaluate((sql: string) => {
          const editor = (window as any).ace.edit("ace-editor");
          editor.setValue(sql, -1);
        }, sanitizedSQL);

        // --- Set LIMIT dropdown (optional) ---
        try {
          await page.click("a.ant-dropdown-trigger");
          const limitOption = page
            .locator('li.ant-dropdown-menu-item:has-text("1 000")')
            .first();
          await limitOption.waitFor({ state: "visible", timeout: 5000 });
          await limitOption.click();
        } catch (err) {
          console.warn("Failed to set LIMIT dropdown:", (err as Error).message);
        }

        // --- Run SQL ---
        const runButton = page.locator("button.superset-button.cta", {
          hasText: /Run/i,
        });
        await runButton.waitFor({ state: "visible", timeout: 10000 });

        let resolved = false;
        const sqlResult = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("SQL query timed out")),
            60000
          );

          page?.on("response", async (response) => {
            if (resolved) return;
            if (response.url().includes("/superset/sql_json/")) {
              resolved = true;
              clearTimeout(timeout);
              const body = await response.json();
              if (response.status() === 200) {
                if (body.error) reject(new Error(`Query Error: ${body.error}`));
                else resolve(body);
              } else if (response.status() === 403) {
                // Return structured error instead of stringified JSON
                reject({ type: "forbidden", body });
              } else {
                reject(
                  new Error(
                    `SQL request failed with status ${response.status()}`
                  )
                );
              }
            }
          });

          runButton.click({ force: true }).catch(reject);
        });

        return {
          success: true,
          type: "success",
          title: sqlResult?.query?.db || "No Database",
          data: sqlResult?.data?.length ? sqlResult.data : [],
          columns: sqlResult?.columns?.length ? sqlResult.columns : [],
          sessionPath: storageStatePath,
        };
      } catch (err: any) {
        if (err?.body) {
          return {
            success: false,
            type: "superset_error",
            error: err.body, // full Superset response here
          };
        }

        return { success: false, type: "auth_error", error: err.message };
      } finally {
        try {
          if (newTab) {
            const closeBtn = newTab.locator("button.ant-tabs-tab-remove");
            await closeBtn.click();
          }
          if (browser) {
            await browser.close();
          }
        } catch {
          // ignore cleanup errors
        }
      }
    }
  );
}
