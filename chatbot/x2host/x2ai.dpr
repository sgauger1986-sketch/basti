library x2ai;
{
  Begleit-DLL fuer die IN-PROCESS-Variante (Weg B).

  Wird per x2inject.exe in den X2-Prozess geladen (oder ueber Import-Tabelle /
  Proxy-DLL). Sobald sie im X2-Prozess ist, startet sie das Chat-Panel
  (X2Companion.exe) und dockt dessen Fenster an das X2-Hauptfenster an -- gleiche
  Wirkung wie X2Dock, aber aus dem X2-Prozess heraus. Die X2.exe auf der Platte
  bleibt unveraendert.

  Neu: Das X2-Hauptfenster wird AUTOMATISCH gefunden (groesstes sichtbares
  Top-Level-Fenster DES EIGENEN Prozesses -- wir sind ja in X2 geladen). Keine
  Fensterklasse mehr einzutragen.

  Warum das Panel als eigener Prozess: einen WebView2 in einem fremden Prozess
  mit fremder Message-Loop zu betreiben ist heikel; das Panel als schlanken
  Begleitprozess zu starten und nur sein Fenster einzuhaengen ist robust und
  trotzdem 'in X2'.

  KOMPILIERBARE VORLAGE fuer Delphi/Windows -- hier (Linux) nicht baubar.
  Build:  dcc32 x2ai.dpr        (erzeugt x2ai.dll)
}

uses
  Winapi.Windows,
  Winapi.Messages,
  System.SysUtils;

const
  COMPANION  = 'X2Companion.exe';   // im selben Ordner wie x2ai.dll
  DOCK_WIDTH = 420;

type
  TFind = record
    Pid: DWORD;
    Best: HWND;
    BestArea: Int64;
  end;
  PFind = ^TFind;

function EnumProc(Wnd: HWND; L: LPARAM): BOOL; stdcall;
var
  f: PFind;
  wpid: DWORD;
  r: TRect;
  area: Int64;
begin
  Result := True;
  f := PFind(L);
  if not IsWindowVisible(Wnd) then Exit;
  if GetWindow(Wnd, GW_OWNER) <> 0 then Exit;
  GetWindowThreadProcessId(Wnd, wpid);
  if wpid <> f^.Pid then Exit;
  if not GetWindowRect(Wnd, r) then Exit;
  area := Int64(r.Right - r.Left) * Int64(r.Bottom - r.Top);
  if area > f^.BestArea then
  begin
    f^.BestArea := area;
    f^.Best := Wnd;
  end;
end;

function MainWindowOfPid(Pid: DWORD): HWND;
var
  f: TFind;
begin
  f.Pid := Pid; f.Best := 0; f.BestArea := 0;
  EnumWindows(@EnumProc, LPARAM(@f));
  Result := f.Best;
end;

function WaitMainWindow(Pid: DWORD; TimeoutMs: Integer): HWND;
var
  waited: Integer;
begin
  waited := 0;
  repeat
    Result := MainWindowOfPid(Pid);
    if Result <> 0 then Exit;
    Sleep(200); Inc(waited, 200);
  until waited >= TimeoutMs;
  Result := 0;
end;

function StartCompanion(out Pid: DWORD): Boolean;
var
  si: TStartupInfo;
  pi: TProcessInformation;
  dir, cmd: string;
  buf: array[0..MAX_PATH] of Char;
begin
  SetString(dir, buf, GetModuleFileName(HInstance, buf, MAX_PATH));
  dir := ExtractFilePath(dir);
  cmd := dir + COMPANION; UniqueString(cmd);
  FillChar(si, SizeOf(si), 0);
  si.cb := SizeOf(si);
  Result := CreateProcess(nil, PChar(cmd), nil, nil, False, 0, nil,
    PChar(dir), si, pi);
  if Result then
  begin
    Pid := pi.dwProcessId;
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
  end;
end;

procedure DockPanel(Host, Panel: HWND);
var
  r: TRect;
begin
  Winapi.Windows.SetParent(Panel, Host);
  SetWindowLong(Panel, GWL_STYLE,
    (GetWindowLong(Panel, GWL_STYLE) or WS_CHILD) and not WS_POPUP);
  GetClientRect(Host, r);
  MoveWindow(Panel, r.Right - DOCK_WIDTH, 0, DOCK_WIDTH, r.Bottom - r.Top, True);
end;

function Worker(P: Pointer): Integer; stdcall;
var
  x2, panel: HWND;
  panelPid: DWORD;
begin
  Result := 0;
  // Das X2-Hauptfenster gehoert zu UNSEREM Prozess.
  x2 := WaitMainWindow(GetCurrentProcessId, 40000);
  if x2 = 0 then Exit;
  if not StartCompanion(panelPid) then Exit;
  panel := WaitMainWindow(panelPid, 20000);
  if panel <> 0 then
    DockPanel(x2, panel);
end;

procedure OnAttach;
var
  tid: DWORD;
begin
  CloseHandle(CreateThread(nil, 0, @Worker, nil, 0, tid));  // Loader nicht blockieren
end;

procedure DLLMain(Reason: Integer);
begin
  if Reason = DLL_PROCESS_ATTACH then
    OnAttach;
end;

begin
  DllProc := @DLLMain;
  DLLMain(DLL_PROCESS_ATTACH);
end.
