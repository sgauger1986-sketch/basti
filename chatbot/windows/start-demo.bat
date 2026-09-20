@echo off
REM Schneller Test OHNE lokales Modell (Mock-Backend). Zeigt das Panel im Browser.
setlocal
cd /d "%~dp0\.."
if not exist x2demo.sqlite (
  echo Baue Demo-Datenbank...
  python build_db.py || goto :err
)
echo Starte lokalen Dienst (Mock) auf http://127.0.0.1:8756/ ...
start "" pythonw serve.py
REM kurz warten, dann Panel oeffnen
ping -n 3 127.0.0.1 >nul
start "" http://127.0.0.1:8756/
echo Fertig. Zum Beenden den Task 'pythonw' im Task-Manager schliessen.
goto :eof
:err
echo Fehler beim Bau der Datenbank. Laeuft Python?
pause
