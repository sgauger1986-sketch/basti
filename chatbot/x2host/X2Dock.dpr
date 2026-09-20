program X2Dock;
{
  Startet X2 und das Begleit-Fenster und DOCKT das Panel an das X2-Fenster,
  OHNE die X2.exe zu veraendern.

  Neu: X2 und das Panel werden AUTOMATISCH ueber den Prozess gefunden
  (kein Heraussuchen der Fensterklasse mit Spy++ noetig). Einzustellen ist nur
  noch der Pfad zu X2.exe.

  Ablauf:
    1. Python-Dienst muss laufen (serve.py, per Autostart/Dienst).
    2. X2 finden (laeuft es schon?) oder starten.
    3. X2Companion.exe starten -> dessen Hauptfenster per Prozess-ID finden.
    4. Panel per SetParent ins X2-Hauptfenster einhaengen und rechts andocken.

  KOMPILIERBARE VORLAGE fuer Delphi/Windows -- hier (Linux) nicht baubar.
  Build:  dcc32 X2Dock.dpr
}

uses
  Winapi.Windows,
  Winapi.Messages,
  System.SysUtils;

const
  X2_EXE     = 'C:\Program Files\mexXsoft\X2\X2.exe';  // TODO: echten Pfad eintragen
  X2_EXENAME = 'X2.exe';                               // Prozessname (Basename)
  COMPANION  = 'X2Companion.exe';
  DOCK_WIDTH = 420;

type
  TFind = record
    Pid: DWORD;
    Best: HWND;
    BestArea: Int64;
  end;
  PFind = ^TFind;

function ExeNameOfPid(Pid: DWORD): string;
var
  h: THandle;
  buf: array[0..MAX_PATH] of Char;
  len: DWORD;
begin
  Result := '';
  h := OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, Pid);
  if h = 0 then Exit;
  try
    len := MAX_PATH;
    if QueryFullProcessImageName(h, 0, buf, len) then
      Result := ExtractFileName(buf);
  finally
    CloseHandle(h);
  end;
end;

// Waehlt das groesste sichtbare Top-Level-Fenster des gesuchten Prozesses
// (das ist verlaesslich das Hauptfenster).
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
  if GetWindow(Wnd, GW_OWNER) <> 0 then Exit;         // nur echte Top-Level
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

function FindEnumByName(Wnd: HWND; L: LPARAM): BOOL; stdcall;
var
  f: PFind;
  wpid: DWORD;
begin
  Result := True;
  f := PFind(L);
  if not IsWindowVisible(Wnd) then Exit;
  if GetWindow(Wnd, GW_OWNER) <> 0 then Exit;
  GetWindowThreadProcessId(Wnd, wpid);
  if SameText(ExeNameOfPid(wpid), X2_EXENAME) then
  begin
    f^.Best := Wnd; f^.Pid := wpid; Result := False;   // gefunden, Abbruch
  end;
end;

function FindRunningX2: HWND;
var
  f: TFind;
begin
  f.Pid := 0; f.Best := 0; f.BestArea := 0;
  EnumWindows(@FindEnumByName, LPARAM(@f));
  Result := f.Best;
end;

function StartProcessGetPid(const Cmd, Dir: string; out Pid: DWORD): Boolean;
var
  si: TStartupInfo;
  pi: TProcessInformation;
  c: string;
begin
  FillChar(si, SizeOf(si), 0);
  si.cb := SizeOf(si);
  c := Cmd; UniqueString(c);
  Result := CreateProcess(nil, PChar(c), nil, nil, False, 0, nil,
    PChar(Dir), si, pi);
  if Result then
  begin
    Pid := pi.dwProcessId;
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
  end;
end;

function WaitMainWindow(Pid: DWORD; TimeoutMs: Integer): HWND;
var
  waited: Integer;
begin
  waited := 0;
  repeat
    Result := MainWindowOfPid(Pid);
    if (Result <> 0) then Exit;
    Sleep(200); Inc(waited, 200);
  until waited >= TimeoutMs;
  Result := 0;
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
  // TODO (optional): SetWinEventHook(EVENT_OBJECT_LOCATIONCHANGE ...), damit das
  //   Panel bei Groessen-/Positionsaenderung von X2 mitwandert.
end;

var
  x2Wnd, panelWnd: HWND;
  x2Pid, panelPid: DWORD;
  dir: string;
begin
  dir := ExtractFilePath(ParamStr(0));

  // 1) X2 finden oder starten
  x2Wnd := FindRunningX2;
  if x2Wnd = 0 then
  begin
    if not StartProcessGetPid(X2_EXE, ExtractFilePath(X2_EXE), x2Pid) then
    begin
      MessageBox(0, 'X2 konnte nicht gestartet werden (Pfad pruefen).',
        'X2Dock', MB_ICONERROR); Halt(1);
    end;
    x2Wnd := WaitMainWindow(x2Pid, 40000);
  end;
  if x2Wnd = 0 then
  begin
    MessageBox(0, 'X2-Hauptfenster nicht gefunden.', 'X2Dock', MB_ICONERROR);
    Halt(2);
  end;

  // 2) Begleit-Panel starten und dessen Fenster ueber die Prozess-ID finden
  if not StartProcessGetPid(dir + COMPANION, dir, panelPid) then
  begin
    MessageBox(0, 'X2Companion.exe nicht gefunden.', 'X2Dock', MB_ICONERROR);
    Halt(3);
  end;
  panelWnd := WaitMainWindow(panelPid, 20000);
  if panelWnd = 0 then
  begin
    MessageBox(0, 'Panel-Fenster nicht gefunden.', 'X2Dock', MB_ICONERROR);
    Halt(4);
  end;

  // 3) Andocken
  DockPanel(x2Wnd, panelWnd);
end.
