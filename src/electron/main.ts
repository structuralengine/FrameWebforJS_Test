import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as fs from 'fs';
import log from 'electron-log';
import isDev from 'electron-is-dev';
// 起動 --------------------------------------------------------------

let mainWindow: BrowserWindow;
let locale = 'ja';

async function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.maximize();
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.openDevTools();
  mainWindow.on('close', function (e) {
    let langText = require(`../assets/i18n/${locale}.json`)
    let choice = dialog.showMessageBoxSync(this,
      {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: langText.window.closeTitle,
        message: langText.window.closeMessage,
      });
    if (choice == 1) {
      e.preventDefault();
    }
  });
  await mainWindow.loadFile('index.html');
}

app.whenReady().then(async () => {
  await createWindow();

  if (!isDev) {
    debugger
    // 起動時に1回だけ
    log.info(`アップデートがあるか確認します。${app.name} ${app.getVersion()}`);
    await autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-available', () => {
      autoUpdater.downloadUpdate();
      window.alert("dev Tupdate-available");
    });
    
    //when update downloaded, reboot to install
    autoUpdater.on('update-downloaded', function (e) {
      let langText = require(`../assets/i18n/${locale}.json`)
      window.alert("dev Tupdate-download");
      let choice = dialog.showMessageBoxSync(this,
        {
          type: 'question',
          buttons: [langText.modal.reboot, langText.modal.cancel],
          title: langText.modal.updateTitle,
          message: langText.modal.updateMessage,
        });
      if (choice == 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }
});

autoUpdater.on('update-available', () => {
  window.alert("Tupdate-available");
  autoUpdater.downloadUpdate();
});

//when update downloaded, reboot to install
autoUpdater.on('update-downloaded', function (e) {
  let langText = require(`../assets/i18n/${locale}.json`)
  window.alert("Test thôi");
  let choice = dialog.showMessageBoxSync(mainWindow,
    {
      type: 'question',
      buttons: [langText.modal.reboot, langText.modal.cancel],
      title: langText.modal.updateTitle,
      message: langText.modal.updateMessage,
    });
  if (choice == 0) {
    autoUpdater.quitAndInstall();
  }
});
ipcMain.on("ready", () => {
  setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 1000*60*10)
})
//autoUpdater.checkForUpdatesAndNotify();
ipcMain.on("newWindow", async () => await createWindow());
// Angular -> Electron --------------------------------------------------
// ファイルを開く
ipcMain.on('open', (event: Electron.IpcMainEvent) => {
  // ファイルを選択
  const paths = dialog.showOpenDialogSync(mainWindow, {
    buttonLabel: 'open', // 確認ボタンのラベル
    filters: [{ name: 'json', extensions: ['json'] }],
    properties: [
      'openFile', // ファイルの選択を許可
      'createDirectory', // ディレクトリの作成を許可 (macOS)
    ],
  });

  // キャンセルで閉じた場合
  if (paths === undefined) {
    event.returnValue = { status: undefined };
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
      text: buff.toString(),
    };
  } catch (error) {
    event.returnValue = { status: false, message: error.message };
  }
});

// 上書き保存
ipcMain.on(
  'overWrite',
  async (event: Electron.IpcMainEvent, path: string, data: string) => {
    fs.writeFile(path, data, async function (error) {
      if (error != null) {
        await dialog.showMessageBox({ message: 'error : ' + error });
      }
    });
    event.returnValue = path;
  }
);

// 名前を付けて保存
ipcMain.on(
  'saveFile',
  async (event: Electron.IpcMainEvent, filename: string, data: string, ext: string) => {
    // 場所とファイル名を選択
    const path = dialog.showSaveDialogSync(mainWindow, {
      buttonLabel: 'save', // ボタンのラベル
      filters: [{ name: ext, extensions: [ext] }],
      defaultPath: filename,
      properties: [
        'createDirectory', // ディレクトリの作成を許可 (macOS)
      ],
    });

    // キャンセルで閉じた場合
    if (path === undefined) {
      event.returnValue = '';
    }

    // ファイルの内容を返却
    try {
      fs.writeFileSync(path, data);
      event.returnValue = path;
    } catch (error) {
      await dialog.showMessageBox({ message: 'error : ' + error });
      event.returnValue = '';
    }
  }
);

// アラートを表示する
ipcMain.on(
  'alert',
  async (event: Electron.IpcMainEvent, message: string) => {
    await dialog.showMessageBox({ message });
    event.returnValue = '';
  }
);

ipcMain.on(
  'change-lang', (event, lang) => {
    locale = lang;
  })