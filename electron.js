const {app, BrowserWindow, Menu} = require('electron')
const path = require("path");
// const Config = require('electron-config');

function createWindow(canvasObject) {

  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1280,
    'icon': 'favicon.ico',
    webPreferences: {
      worldSafeExecuteJavaScript: true,
      frame: false,
      backgroundColor: 'WHITE',
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      useContentSize: true,
      enableRemoteModule: true,
    },
  })
  mainWindow.loadFile(path.join(__dirname, `/dist/index.html`)).then(r => 1)

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    app.quit();
  });
  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

const mainMenuTemplate = [
  // Each object is a dropdown
  {
    label: '',
    submenu: []
  }
];