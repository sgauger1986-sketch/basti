@echo off
REM Startet den X2-Assistenten-Dienst mit LOKALEM Modell (offline, kein Abfluss).
REM Voraussetzung: 'ollama serve' laeuft und das Modell ist geladen
REM   ollama pull qwen2.5-coder:7b
setlocal
cd /d "%~dp0\.."

REM --- Konfiguration (bei Bedarf anpassen) ---
set X2_LLM=local
set X2_LOCAL_URL=http://127.0.0.1:11434
set X2_LOCAL_API=ollama
set X2_GEN_MODEL=qwen2.5-coder:7b
set X2_VER_MODEL=qwen2.5:7b
set X2_SERVE_PORT=8756

if not exist x2demo.sqlite python build_db.py
python serve.py
