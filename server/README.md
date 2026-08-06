# mexXsoft X2 Cloud — Sync-Server

Reines Node.js (≥ 18), **keine Abhängigkeiten** — eine Datei, überall lauffähig
(eigener Server, Hetzner, IONOS, Raspberry Pi …).

## Start

```bash
node server.js               # Port 8080; PORT=80 node server.js für anderen Port
```

Beim allerersten Start wird automatisch ein Demo-Zugang angelegt:
Mandant `demo`, Benutzer `demo`, Passwort `demo` — **für den Echtbetrieb ersetzen!**

## Benutzer & Mandanten anlegen

```bash
node server.js adduser meier-galabau chef 'Sicheres!Passwort9'
node server.js adduser meier-galabau bauleiter 'Anderes!Passwort7'
```

Jeder Mandant (= Kundenfirma) bekommt automatisch ein eigenes, getrenntes
Datenverzeichnis `data/tenants/<mandant>/` mit revisioniertem
Änderungsprotokoll (`changelog.jsonl`, append-only). Neue Mandanten werden
beim ersten Sync mit den Demo-Daten vorbefüllt (dies lässt sich in
`server.js`, Funktion `loadTenant`, abschalten).

## API

| Endpunkt | Zweck |
|---|---|
| `POST /api/login` `{tenant,user,pass}` | Anmeldung → `{token}` (30 Tage gleitend) |
| `POST /api/sync` `{since,changes[]}` + `Authorization: Bearer` | Änderungen senden + alles seit Revision `since` empfangen |
| `GET /api/health` | Statusprüfung |
| alles andere | statische Auslieferung der Web-App (`../webapp`) |

## Produktion (HTTPS ist Pflicht)

Empfohlen: Reverse-Proxy mit automatischem Zertifikat, z. B. Caddy:

```
cloud.mexxsoft.de {
    reverse_proxy localhost:8080
}
```

Alternativ direkt: `TLS_CERT=cert.pem TLS_KEY=key.pem node server.js`.

Als Dienst (systemd):

```ini
[Unit]
Description=mexXsoft X2 Cloud Sync
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/x2cloud/server/server.js
Environment=PORT=8080
Restart=always
User=x2cloud

[Install]
WantedBy=multi-user.target
```

**Backup:** das Verzeichnis `server/data/` sichern — es enthält Benutzer,
Token und sämtliche Mandantendaten (Änderungsprotokolle).
