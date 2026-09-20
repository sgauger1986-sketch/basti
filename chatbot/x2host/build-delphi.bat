@echo off
REM Baut die Windows-Teile. Auf dem Windows-Rechner MIT Delphi ausfuehren
REM (dcc32 muss im PATH sein, z. B. via rsvars.bat des Delphi-BDS).
REM Voraussetzung fuer das Panel-Fenster: WebView2-Runtime installiert und
REM WebView2Loader.dll neben X2Companion.exe.
setlocal
cd /d "%~dp0"

echo == X2Companion.exe (WebView2-Panel) ==
dcc32 X2Companion.dpr || goto :err
echo == X2Dock.exe (SetParent-Andocken, Weg A) ==
dcc32 X2Dock.dpr || goto :err
echo == x2ai.dll (In-Process, Weg B) ==
dcc32 x2ai.dpr || goto :err
echo == x2inject.exe (Injektor fuer Weg B) ==
dcc32 x2inject.dpr || goto :err

echo.
echo Fertig. Ergebnisse in diesem Ordner.
goto :eof
:err
echo Build-Fehler. Ist dcc32 im PATH (rsvars.bat ausgefuehrt)?
pause
