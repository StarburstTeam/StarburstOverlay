const { app, BrowserWindow, ipcMain } = require('electron');

const debug_mode = true;

const createWindow = () => {
  let win = new BrowserWindow({
    width: 1080,
    height: 550,
    frame: false,
    transparent: true,
    useContentSize: true,
    maximizable: false,
    minimizable: true,
    x: 40,
    y: 20,
    icon: __dirname + '/logo.ico',
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true, contextIsolation: false }
  });
  win.loadFile('src/index.html');
  if (debug_mode)
    win.webContents.openDevTools({ mode: "detach", activate: true });
  win.on('close', () => win = null);
}
app.on('ready', createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length == null)
    createWindow();
});

let search_opened = false;
ipcMain.on('open-search-page', (_) => {
  if (search_opened) return;
  search_opened = true;
  let win = new BrowserWindow({
    width: 1000,
    height: 550,
    frame: false,
    transparent: true,
    useContentSize: true,
    maximizable: false,
    minimizable: true,
    x: 40,
    y: 20,
    icon: __dirname + '/logo.ico',
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true, contextIsolation: false }
  });
  win.loadFile('src/search.html');
  if (debug_mode)
    win.webContents.openDevTools({ mode: "detach", activate: true });
  win.on('close', () => { win = null; search_opened = false });
})