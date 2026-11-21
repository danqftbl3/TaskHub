const { app, BrowserWindow, net, protocol, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([
  { scheme: 'taskhub', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

function openExternal(url) {
  const parsed = new URL(url);
  if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:') {
    shell.openExternal(url).catch((error) => console.error('Unable to open external link:', error));
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 360,
    minHeight: 600,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    if (target.protocol !== 'taskhub:' || target.hostname !== 'app') {
      event.preventDefault();
      openExternal(url);
    }
  });
  window.loadURL('taskhub://app/index.html').catch((error) => console.error('Unable to load TaskHub:', error));
}

app.whenReady().then(() => {
  const root = path.join(app.getAppPath(), 'dist');
  protocol.handle('taskhub', (request) => {
    const url = new URL(request.url);
    const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (url.hostname !== 'app' || (file !== root && !file.startsWith(`${root}${path.sep}`))) {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
