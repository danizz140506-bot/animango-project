// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let DATA_DIR;
let FILE;

// --- Data Store Functions ---
function initStorePaths() {
  const projectData = path.join(__dirname, "data");
  app.setPath("userData", projectData);
  DATA_DIR = app.getPath("userData");
  FILE = path.join(DATA_DIR, "userData.json");
  console.log("[Animango] Using store:", FILE);
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf8");
}

function readStore() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8") || "[]");
  } catch {
    return [];
  }
}

function writeStore(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

// --- Create Window ---
function createWindow() {
  const R = (...p) => path.join(__dirname, "renderer", ...p);
  const win = new BrowserWindow({
    width: 1980,
    height: 1080,
    webPreferences: {
      preload: R("preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(R("index.html"));
}

// --- App Lifecycle ---
app.whenReady().then(() => {
  initStorePaths();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- IPC Handlers ---
ipcMain.on("add-entry", (_event, item) => {
  const data = readStore();
  if (!data.find((x) => x.id === item.id && x.type === item.type)) {
    data.push(item);
    writeStore(data);
  }
});

ipcMain.handle("get-all", () => {
  const rows = readStore();
  console.log("[Animango] get-all ->", rows.length, "items");
  return rows;
});

ipcMain.handle("save-entry", (_event, updated) => {
  const data = readStore();
  const idx = data.findIndex(
    (x) => x.id === updated.id && x.type === updated.type
  );
  if (idx !== -1) {
    data[idx] = updated;
    writeStore(data);
  }
  return true;
});

ipcMain.handle("delete-entry", (_event, id) => {
  const data = readStore().filter((x) => x.id !== id);
  writeStore(data);
  return true;
});
