/**
 * Regeln und Skripte für die Web-Hülle – reine Logik, ohne React,
 * damit sie testbar bleibt.
 */

export type NavigationsEntscheidung = 'intern' | 'extern' | 'blockiert';

function host(url: string): string | null {
  const m = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url);
  if (!m) return null;
  return m[1].replace(/^.*@/, '').replace(/:\d+$/, '').toLowerCase();
}

function schema(url: string): string {
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(url);
  return m ? m[1].toLowerCase() : '';
}

/**
 * Entscheidet, ob eine Adresse in der Hülle bleibt, im System (Browser,
 * Telefon, Telegram-App …) geöffnet wird oder gar nicht geladen werden darf.
 */
export function navigationEntscheiden(
  url: string,
  appUrl: string,
  erlaubteHosts: readonly string[]
): NavigationsEntscheidung {
  const s = schema(url);
  if (s === 'about' || s === 'blob' || s === 'data') return 'intern';
  if (s === 'tel' || s === 'mailto' || s === 'sms' || s === 'tg' || s === 'geo' || s === 'maps') return 'extern';
  if (s === 'http') return 'blockiert'; // kein Klartext
  if (s !== 'https') return 'blockiert';
  const h = host(url);
  const appHost = host(appUrl);
  if (!h || !appHost) return 'blockiert';
  if (h === appHost) return 'intern';
  const erlaubt = erlaubteHosts.some((e) => {
    const eh = e.toLowerCase();
    return h === eh || h.endsWith(`.${eh}`);
  });
  return erlaubt ? 'intern' : 'extern';
}

/** Nachrichten, die die Web-Oberfläche an die App schicken darf */
export type BrueckenNachricht =
  | { typ: 'extern-oeffnen'; url: string }
  | { typ: 'teilen'; text: string; url?: string }
  | { typ: 'haptik'; art?: 'leicht' | 'mittel' | 'erfolg' | 'fehler' }
  | { typ: 'titel'; text: string }
  | { typ: 'push-token-anfordern' }
  | { typ: 'schliessen' };

export function nachrichtParsen(roh: string): BrueckenNachricht | null {
  let o: unknown;
  try {
    o = JSON.parse(roh);
  } catch {
    return null;
  }
  if (!o || typeof o !== 'object') return null;
  const n = o as Record<string, unknown>;
  switch (n.typ) {
    case 'extern-oeffnen':
      return typeof n.url === 'string' && /^(https:|tel:|mailto:|tg:)/i.test(n.url) ? { typ: 'extern-oeffnen', url: n.url } : null;
    case 'teilen':
      return typeof n.text === 'string' ? { typ: 'teilen', text: n.text, url: typeof n.url === 'string' ? n.url : undefined } : null;
    case 'haptik': {
      const art = n.art;
      return { typ: 'haptik', art: art === 'leicht' || art === 'mittel' || art === 'erfolg' || art === 'fehler' ? art : undefined };
    }
    case 'titel':
      return typeof n.text === 'string' ? { typ: 'titel', text: n.text.slice(0, 80) } : null;
    case 'push-token-anfordern':
      return { typ: 'push-token-anfordern' };
    case 'schliessen':
      return { typ: 'schliessen' };
    default:
      return null;
  }
}

export interface BrueckenInfo {
  plattform: string;
  version: string;
  appName: string;
  pushToken: string | null;
}

/**
 * Skript, das vor dem Laden der Seite eingespielt wird.
 *
 * 1. `window.heywerkiApp` – Informationen über die App und Funktionen, mit
 *    denen die Web-Oberfläche native Dinge auslösen kann (siehe docs/WEB-BRUECKE.md).
 * 2. Kompatibilitätsschicht für Telegram-Mini-Apps: Seiten, die
 *    `window.Telegram.WebApp` erwarten, laufen auch außerhalb von Telegram,
 *    ohne abzustürzen. Nutzerdaten (initData) gibt es hier bewusst nicht –
 *    die Anmeldung muss die Web-Oberfläche selbst anbieten.
 */
export function brueckenSkript(info: BrueckenInfo, dunkel: boolean, akzent: string, hintergrund: string): string {
  const infoJson = JSON.stringify(info);
  return `(function () {
  if (window.heywerkiApp) return;
  var senden = function (n) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(n)); };
  window.heywerkiApp = Object.assign(${infoJson}, {
    inApp: true,
    externOeffnen: function (url) { senden({ typ: 'extern-oeffnen', url: String(url) }); },
    teilen: function (text, url) { senden({ typ: 'teilen', text: String(text), url: url ? String(url) : undefined }); },
    haptik: function (art) { senden({ typ: 'haptik', art: art }); },
    titelSetzen: function (text) { senden({ typ: 'titel', text: String(text) }); },
    pushTokenAnfordern: function () { senden({ typ: 'push-token-anfordern' }); }
  });
  document.documentElement.classList.add('in-app');

  if (!window.Telegram || !window.Telegram.WebApp) {
    var handler = {};
    var noop = function () { return button; };
    var button = { text: '', color: '${akzent}', textColor: '#ffffff', isVisible: false, isActive: true, isProgressVisible: false,
      setText: function (t) { button.text = t; return button; }, onClick: function (f) { button._f = f; return button; }, offClick: noop,
      show: function () { button.isVisible = true; return button; }, hide: function () { button.isVisible = false; return button; },
      enable: noop, disable: noop, showProgress: noop, hideProgress: noop, setParams: noop };
    var backButton = { isVisible: false, onClick: noop, offClick: noop, show: noop, hide: noop };
    var themeParams = { bg_color: '${hintergrund}', text_color: '${dunkel ? '#e8ece2' : '#1b1f1a'}', hint_color: '#87907c',
      link_color: '${akzent}', button_color: '${akzent}', button_text_color: '#ffffff', secondary_bg_color: '${hintergrund}' };
    window.Telegram = window.Telegram || {};
    window.Telegram.WebApp = {
      initData: '', initDataUnsafe: {}, version: '7.0', platform: '${info.plattform}',
      colorScheme: '${dunkel ? 'dark' : 'light'}', themeParams: themeParams,
      isExpanded: true, viewportHeight: window.innerHeight, viewportStableHeight: window.innerHeight,
      headerColor: '${hintergrund}', backgroundColor: '${hintergrund}', isClosingConfirmationEnabled: false,
      MainButton: button, BackButton: backButton,
      HapticFeedback: { impactOccurred: function (s) { senden({ typ: 'haptik', art: s === 'heavy' ? 'mittel' : 'leicht' }); },
        notificationOccurred: function (t) { senden({ typ: 'haptik', art: t === 'error' ? 'fehler' : 'erfolg' }); }, selectionChanged: function () {} },
      ready: function () {}, expand: function () {}, close: function () { senden({ typ: 'schliessen' }); },
      onEvent: function (e, f) { (handler[e] = handler[e] || []).push(f); }, offEvent: function (e, f) { handler[e] = (handler[e] || []).filter(function (x) { return x !== f; }); },
      sendData: function () {}, openLink: function (u) { senden({ typ: 'extern-oeffnen', url: String(u) }); },
      openTelegramLink: function (u) { senden({ typ: 'extern-oeffnen', url: String(u) }); },
      showAlert: function (m, cb) { window.alert(m); cb && cb(); },
      showConfirm: function (m, cb) { var r = window.confirm(m); cb && cb(r); },
      showPopup: function (p, cb) { window.alert((p && (p.title ? p.title + '\\n' : '') + (p.message || '')) || ''); cb && cb(''); },
      setHeaderColor: function () {}, setBackgroundColor: function () {}, enableClosingConfirmation: function () {}, disableClosingConfirmation: function () {},
      isVersionAtLeast: function () { return true; }, requestWriteAccess: function (cb) { cb && cb(false); }, requestContact: function (cb) { cb && cb(false); },
      CloudStorage: { setItem: function (k, v, cb) { try { localStorage.setItem('tgcs:' + k, v); cb && cb(null, true); } catch (e) { cb && cb(e); } },
        getItem: function (k, cb) { cb && cb(null, localStorage.getItem('tgcs:' + k) || ''); },
        getItems: function (ks, cb) { var o = {}; ks.forEach(function (k) { o[k] = localStorage.getItem('tgcs:' + k) || ''; }); cb && cb(null, o); },
        removeItem: function (k, cb) { localStorage.removeItem('tgcs:' + k); cb && cb(null, true); },
        removeItems: function (ks, cb) { ks.forEach(function (k) { localStorage.removeItem('tgcs:' + k); }); cb && cb(null, true); },
        getKeys: function (cb) { var ks = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('tgcs:') === 0) ks.push(k.slice(5)); } cb && cb(null, ks); } }
    };
  }
  true;
})();`;
}
