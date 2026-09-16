// MexXsoft Messevideo – Kiosk / Bildschirmschoner
// Zeigt video.mp4 im Vollbild in Dauerschleife (ohne Ton). Beenden nur nach PIN-Eingabe.
const { app, BrowserWindow, ipcMain, screen, powerSaveBlocker } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Als Bildschirmschoner (.scr) aufgerufen: /c = Einstellungen, /p = Vorschau -> nichts tun.
const first = (process.argv.find(a => /^\/[cps]/i.test(a)) || '').toLowerCase();
if (first.startsWith('/c') || first.startsWith('/p')) { app.quit(); }

if (!app.requestSingleInstanceLock()) { app.quit(); }

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

function readConfig() {
  const exeDir = path.dirname(app.getPath('exe'));
  const cfg = { pin: '0000', video: '', pinTimeoutSeconds: 20, scale: 1 };
  try { Object.assign(cfg, JSON.parse(fs.readFileSync(path.join(exeDir, 'config.json'), 'utf8'))); } catch {}
  const candidates = [
    cfg.video ? path.resolve(exeDir, cfg.video) : null,   // config.json: "video": "meinvideo.mp4"
    path.join(exeDir, 'video.mp4'),                        // video.mp4 neben der .exe (überschreibt das eingebaute)
    path.join(process.resourcesPath || exeDir, 'video.mp4'), // eingebautes Video
    path.join(__dirname, 'video.mp4'),                     // Entwicklung (npm start)
  ].filter(Boolean);
  cfg.videoPath = candidates.find(p => fs.existsSync(p)) || candidates[candidates.length - 1];
  cfg.pin = String(cfg.pin);
  cfg.scale = Math.min(1, Math.max(0.5, Number(cfg.scale) || 1));   // 0.9 = Video auf 90 % verkleinern (gegen TV-Overscan)
  return cfg;
}

let unlocked = false;

app.whenReady().then(() => {
  const cfg = readConfig();
  powerSaveBlocker.start('prevent-display-sleep');   // Monitor darf nicht abschalten

  const { x, y, width, height } = screen.getPrimaryDisplay().bounds;
  const win = new BrowserWindow({
    x, y, width, height,
    kiosk: true, fullscreen: true, frame: false, alwaysOnTop: true,
    backgroundColor: '#000000', autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.setMenu(null);
  win.on('close', e => { if (!unlocked) e.preventDefault(); });   // Alt+F4 ohne PIN wirkungslos
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  win.loadFile(path.join(__dirname, 'index.html'), {
    query: { video: pathToFileURL(cfg.videoPath).href, timeout: String(cfg.pinTimeoutSeconds), pinlen: String(cfg.pin.length), scale: String(cfg.scale) },
  });

  ipcMain.handle('kiosk:checkPin', (_e, pin) => String(pin) === cfg.pin);
  ipcMain.on('kiosk:quit', () => { unlocked = true; app.quit(); });
});

app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { w.focus(); } });
app.on('window-all-closed', () => app.quit());
