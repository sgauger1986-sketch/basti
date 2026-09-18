program x2inject;
{
  IN-PROCESS-Variante: laedt eine Begleit-DLL in den X2-Prozess, damit der
  Assistent WIRKLICH im selben Prozess wie X2 laeuft (nicht nur daneben).

  Verfahren: klassische DLL-Injektion (CreateRemoteThread + LoadLibrary). Die
  X2.exe bleibt auf der Platte unveraendert -- es wird nur zur Laufzeit Code in
  ihren Prozess geladen. Als Hersteller liefert ihr die DLL im Installer mit.

  Die DLL x2ai.dll (separate Vorlage) macht in ihrem DllMain dasselbe wie
  X2Dock: Panel-Fenster erzeugen/andocken -- nur eben aus dem X2-Prozess heraus.

  KOMPILIERBARE VORLAGE fuer Delphi/Windows -- hier nicht baubar.
  Build:  dcc32 x2inject.dpr
  Aufruf: x2inject.exe  (startet X2 und injiziert x2ai.dll)

  Hinweis: DLL-Injektion kann von Virenschutz als verdaechtig gewertet werden.
  Da es EURE eigene, signierte Software ist, die DLL signieren und die
  Schutzsoftware entsprechend konfigurieren. Der robuste Alternativweg ohne
  Injektion ist X2Dock.dpr (SetParent-Andocken).
}

uses
  Winapi.Windows,
  System.SysUtils;

const
  X2_EXE  = 'C:\Program Files\mexXsoft\X2\X2.exe';   // TODO: echten Pfad
  DLL_PATH = 'x2ai.dll';                             // absolute Pfadangabe empfohlen

function InjectDll(ProcessHandle: THandle; const DllPath: string): Boolean;
var
  remoteMem: Pointer;
  bytesWritten: SIZE_T;
  loadLibAddr: Pointer;
  thread: THandle;
  pathBytes: Integer;
  fullPath: string;
begin
  Result := False;
  fullPath := ExpandFileName(DllPath);
  pathBytes := (Length(fullPath) + 1) * SizeOf(Char);

  remoteMem := VirtualAllocEx(ProcessHandle, nil, pathBytes,
    MEM_COMMIT or MEM_RESERVE, PAGE_READWRITE);
  if remoteMem = nil then Exit;

  if not WriteProcessMemory(ProcessHandle, remoteMem, PChar(fullPath),
    pathBytes, bytesWritten) then Exit;

  // LoadLibraryW aus kernel32 -- selbe Adresse in Ziel- und eigenem Prozess.
  loadLibAddr := GetProcAddress(GetModuleHandle('kernel32.dll'), 'LoadLibraryW');
  if loadLibAddr = nil then Exit;

  thread := CreateRemoteThread(ProcessHandle, nil, 0, loadLibAddr,
    remoteMem, 0, PDWORD(nil)^);
  if thread = 0 then Exit;

  WaitForSingleObject(thread, INFINITE);
  CloseHandle(thread);
  VirtualFreeEx(ProcessHandle, remoteMem, 0, MEM_RELEASE);
  Result := True;
end;

var
  si: TStartupInfo;
  pi: TProcessInformation;
  cmd: string;
begin
  FillChar(si, SizeOf(si), 0);
  si.cb := SizeOf(si);
  cmd := X2_EXE;
  UniqueString(cmd);

  // X2 angehalten starten, injizieren, dann fortsetzen -- so ist die DLL schon
  // vor dem ersten Fenster drin.
  if not CreateProcess(nil, PChar(cmd), nil, nil, False, CREATE_SUSPENDED,
    nil, nil, si, pi) then
  begin
    MessageBox(0, 'X2 konnte nicht gestartet werden.', 'x2inject', MB_ICONERROR);
    Halt(1);
  end;

  if not InjectDll(pi.hProcess, DLL_PATH) then
    MessageBox(0, 'DLL-Injektion fehlgeschlagen.', 'x2inject', MB_ICONWARNING);

  ResumeThread(pi.hThread);
  CloseHandle(pi.hThread);
  CloseHandle(pi.hProcess);
end.
