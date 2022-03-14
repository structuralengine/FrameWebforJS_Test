import { app, BrowserWindow, ipcMain, dialog, autoUpdater } from 'electron';
import 'electron-squirrel-startup';
import * as fs from 'fs';
import log from 'electron-log';

// アップデート --------------------------------------------------
log.info(`${app.name} ${app.getVersion()}`);

const server = 'https://update.electronjs.org'
const url = `${server}/structuralengine/FrameWebforJS/${process.platform}-${process.arch}/${app.getVersion()}`

autoUpdater.setFeedURL({ url })

// 起動時に1回だけ
dialog.showErrorBox("情報1", url);
autoUpdater.checkForUpdates();
// setInterval(() => {
//   dialog.showErrorBox("情報1", "autoUpdater.checkForUpdates")
//   autoUpdater.checkForUpdates()
// }, 10 * 60 * 1000)

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {

  dialog.showErrorBox("情報2", "update-downloaded")

  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
})

autoUpdater.on('error', message => {
  dialog.showErrorBox("情報3", 'error-' + message.message)

  console.error('There was a problem updating the application')
  console.error(message)
})


// 起動 --------------------------------------------------------------

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nativeWindowOpen: true
    }
  });
  mainWindow.maximize();
  mainWindow.setMenuBarVisibility(false);
  // mainWindow.webContents.openDevTools();
  mainWindow.loadFile('index.html');

}

app.whenReady().then(() => {
  createWindow();
});

// Angular -> Electron
// ファイルを開く
ipcMain.on('open', async (event: Electron.IpcMainEvent) => {
  // ファイルを選択
  const paths = dialog.showOpenDialogSync(mainWindow, {
    buttonLabel: 'open',  // 確認ボタンのラベル
    filters: [
      { name: 'json', extensions: ['json'] },
    ],
    properties:[
      'openFile',         // ファイルの選択を許可
      'createDirectory',  // ディレクトリの作成を許可 (macOS)
    ]
  });

  // キャンセルで閉じた場合
  if( paths === undefined ){
    event.returnValue = {status: undefined};
    return;
  }

  // ファイルの内容を返却
  try {
    const path = paths[0];
    const buff = fs.readFileSync(path);

    // ファイルを読み込む
    event.returnValue = {
      status: true,
      path: path,
      text: buff.toString()
    };
  }
  catch(error) {
    event.returnValue = {status:false, message:error.message};
  }
});

// 上書き保存
ipcMain.on('overWrite', async (event: Electron.IpcMainEvent, path: string, data: string) => {
  fs.writeFile(path, data, function (error) {
    if (error != null) {
      dialog.showMessageBox({ message: 'error : ' + error });
    }
  });
  event.returnValue = path;
});

// 名前を付けて保存
ipcMain.on('saveFile', async (event: Electron.IpcMainEvent, filename: string, data: string) => {
  // 場所とファイル名を選択
  const path = dialog.showSaveDialogSync(mainWindow, {
    buttonLabel: 'save',  // ボタンのラベル
    filters: [
      { name: 'json', extensions: ['json'] },
    ],
    defaultPath: filename,
    properties:[
      'createDirectory',  // ディレクトリの作成を許可 (macOS)
    ]
  });

  // キャンセルで閉じた場合
  if( path === undefined ){
    event.returnValue = '';
  }

  // ファイルの内容を返却
  try {
    fs.writeFileSync(path, data);
    event.returnValue = path;
  }
  catch(error) {
    dialog.showMessageBox({ message: 'error : ' + error });
    event.returnValue = '';
  }
});
