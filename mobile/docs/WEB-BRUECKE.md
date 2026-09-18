# Web-Hülle: Brücke zwischen App und heywerki-Web-Oberfläche

Im Modus `startModus: 'web'` (siehe `brand.js`) lädt die App die bestehende
Web-Oberfläche (`webAppUrl`) in einer nativen Ansicht. Die Web-Oberfläche muss
dafür nichts ändern. Sie **kann** aber App-Funktionen nutzen.

## Erkennen, dass man in der App läuft

```js
if (window.heywerkiApp?.inApp) { /* z. B. Kopfzeile ausblenden */ }
document.documentElement.classList.contains('in-app'); // für CSS
navigator.userAgent.includes('heywerkiApp/'); // serverseitig
```

`window.heywerkiApp` enthält: `plattform` (`ios` | `android`), `version`,
`appName`, `pushToken` (oder `null`).

## Funktionen aufrufen

```js
heywerkiApp.externOeffnen('https://…');     // System-Browser, tel:, mailto:, tg:
heywerkiApp.teilen('Text', 'https://…');     // natives Teilen-Menü
heywerkiApp.haptik('leicht' | 'mittel' | 'erfolg' | 'fehler');
heywerkiApp.pushTokenAnfordern();            // fragt Berechtigung an, Token kommt per Event
window.addEventListener('heywerki:pushToken', (e) => sendeAnBackend(e.detail));
```

Push-Nachrichten schickt euer Backend über den Expo Push Service an den Token
(`https://exp.host/--/api/v2/push/send`, Dokumentation bei Expo). Voraussetzung:
`eas init` wurde ausgeführt (Projekt-ID in `app.config.ts`).

## Telegram-Kompatibilität

Erwartet die Web-Oberfläche `window.Telegram.WebApp` (Telegram Mini App), stellt
die Hülle eine Kompatibilitätsschicht bereit: `ready()`, `expand()`, `MainButton`,
`BackButton`, `HapticFeedback`, `themeParams`, `CloudStorage` (lokal), `openLink`,
`showAlert` usw. funktionieren, ohne dass die Seite abstürzt.

**Nicht vorhanden:** `initData` / `initDataUnsafe` (leer). Die Telegram-Anmeldung
gibt es außerhalb von Telegram nicht. Die Web-Oberfläche braucht daher einen
eigenen Login (E-Mail/Passwort, Magic Link oder „Login with Telegram“-Widget über
`oauth.telegram.org`, das in der Hülle erlaubt ist). Sitzungen bleiben per Cookie
erhalten.

## Navigationsregeln

| Ziel | Verhalten |
|---|---|
| eigene Domain (`webAppUrl`) | in der Hülle |
| Hosts aus `webErlaubteHosts` (Standard: `t.me`, `oauth.telegram.org`) | in der Hülle |
| andere `https://`-Seiten | System-Browser |
| `tel:`, `mailto:`, `sms:`, `tg:`, `geo:` | passende System-App |
| `http://`, `file:`, `javascript:` u. a. | blockiert |

## Eigene Domain

Sobald heywerki unter einer eigenen Domain läuft: `webAppUrl` in `brand.js`
ändern, fertig. Für den Store-Release ist eine feste Domain mit gültigem
TLS-Zertifikat Pflicht (die App lädt ausschließlich `https://`).

## Umstieg auf native Bildschirme

`startModus: 'erp'` schaltet auf die nativen Bildschirme (Projekte, LVs,
Rapporte) mit eigenem Backend um (siehe `API.md`). Beide Modi liegen im selben
Code, sodass die Hülle Schritt für Schritt abgelöst werden kann.
