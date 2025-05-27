const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const { run } = require(path.join(__dirname, "../../browser"));

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "./preload.js"),
    },
    icon: "public/icons/icon.ico",
    resizable: false,
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(path.join(__dirname, "../renderer/index.html"));

  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.send("dom-ready");
  });

  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

ipcMain.on("run", async (event, value) => {
  try {
    let config = JSON.parse(value);
    await run(config);
    event.reply("ran");
  } catch (error) {
    event.reply("run-error", error.message);
  }
});
