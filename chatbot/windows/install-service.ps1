# Richtet den X2-Assistenten-Dienst als Autostart bei Anmeldung ein
# (Windows-Aufgabenplanung, kein Zusatzprogramm noetig).
# Als Administrator in PowerShell ausfuehren:
#   powershell -ExecutionPolicy Bypass -File install-service.ps1
$ErrorActionPreference = 'Stop'

$here = $PSScriptRoot
$runBat = Join-Path $here 'run-service.bat'
if (-not (Test-Path $runBat)) { throw "run-service.bat nicht gefunden neben diesem Skript." }

$action   = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$runBat`""
$trigger  = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
              -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `
              -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask -TaskName 'X2Assistent' -Action $action -Trigger $trigger `
  -Settings $settings -Description 'Lokaler, offline X2-Assistent (gepruefte Antworten)' -Force

Write-Host "Aufgabe 'X2Assistent' eingerichtet. Startet bei der naechsten Anmeldung."
Write-Host "Jetzt sofort starten:  Start-ScheduledTask -TaskName 'X2Assistent'"
