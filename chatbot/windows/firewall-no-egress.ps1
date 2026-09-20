# Zweiter Riegel gegen Datenabfluss: verbietet dem Python-Dienst jeden
# ausgehenden Internetzugang. Loopback (127.0.0.1, z. B. zu Ollama) bleibt
# erlaubt -- die Windows-Firewall filtert localhost nicht.
# Als Administrator ausfuehren:
#   powershell -ExecutionPolicy Bypass -File firewall-no-egress.ps1
$ErrorActionPreference = 'Stop'

# Pfad zu pythonw.exe ermitteln (dieselbe Python-Installation wie der Dienst).
$pyw = (Get-Command pythonw.exe -ErrorAction SilentlyContinue).Source
if (-not $pyw) { $pyw = (Get-Command python.exe).Source }
Write-Host "Sperre ausgehenden Verkehr fuer: $pyw"

New-NetFirewallRule -DisplayName 'X2Assistent kein Datenabfluss (pythonw)' `
  -Direction Outbound -Program $pyw -Action Block -Profile Any -Enabled True | Out-Null

Write-Host "Fertig. Der Dienst kann jetzt nur noch lokal arbeiten."
Write-Host "Entfernen mit:  Remove-NetFirewallRule -DisplayName 'X2Assistent kein Datenabfluss (pythonw)'"
