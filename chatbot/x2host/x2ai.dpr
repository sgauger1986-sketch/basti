library x2ai;
{
  Begleit-DLL fuer die IN-PROCESS-Variante (Weg B).

  Sie wird per x2inject.exe in den X2-Prozess geladen (oder ueber einen
  Import-Tabellen-Eintrag / eine Proxy-DLL). Sobald sie im X2-Prozess ist,
  startet sie das Chat-Panel (X2Companion.exe) und dockt dessen Fenster an das
  X2-Hauptfenster an -- dieselbe Wirkung wie X2Dock, aber aus dem X2-Prozess
  heraus. Die X2.exe auf der Platte bleibt unveraendert.

  Warum das Panel als eigener Prozess und nicht VCL/WebView2 direkt in der DLL:
  einen WebView2 in einem fremden Prozess (mit fremder Message-Loop) zu betreiben
  ist heikel und bricht leicht. Das Panel als schlanken Begleitprozess zu starten
  und nur sein Fenster einzuhaengen ist robust und trotzdem 'in X2'.

  KOMPILIERBARE VORLAGE fuer Delphi/Windows -- hier (Linux) nicht baubar.
  Build:  dcc32 x2ai.dpr        (erzeugt x2ai.dll)
  TODO am Zielsystem: X2_MAINCLASS (Fensterklasse von X2), Pfade.
}

uses
  Winapi.Windows,
  Winapi.Messages,
  System.SysUtils;

const
  COMPANION_EXE = 'X2Companion.exe';   // im selben Ordner wie x2ai.dll
  PANEL_CLASS   = 'X2AssistentPanel';
  X2_MAINCLASS  = 'TAppBuilder';       // TODO: echte Fensterklasse von X2
  DOCK_WIDTH    = 420;

function FindByClass(const ClassName: string): HWND;
begin
  Result := FindWindow(PChar(ClassName), nil);
end;

function WaitForWindow(const ClassName: string; TimeoutMs: Integer): HWND;
var
  waited: Integer;
begin
  waited := 0;
  repeat
    Result := FindByClass(ClassName);
    if Result <> 0 then Exit;
    Sleep(200);
    Inc(waited, 200);
  until waited >= TimeoutMs;
  Result := 0;
end;

procedure StartCompanion;
var
  si: TStartupInfo;
  pi: TProcessInformation;
  dir, cmd: string;
begin
  // Pfad relativ zum Ordner dieser DLL aufloesen.
  SetLength(dir, MAX_PATH);
  SetLength(dir, GetModuleFileName(HInstance, PChar(dir), MAX_PATH));
  dir := ExtractFilePath(dir);
  cmd := dir + COMPANION_EXE;
  UniqueString(cmd);
  FillChar(si, SizeOf(si), 0);
  si.cb := SizeOf(si);
  if CreateProcess(nil, PChar(cmd), nil, nil, False, 0, nil,
       PChar(dir), si, pi) then
  begin
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
  // TODO: SetWinEventHook(EVENT_OBJECT_LOCATIONCHANGE ...), damit das Panel bei
  //       Groessen-/Positionsaenderung von X2 mitwandert.
end;

function Worker(P: Pointer): Integer; stdcall;
var
  x2, panel: HWND;
begin
  Result := 0;
  // Das X2-Hauptfenster gehoert zu UNSEREM Prozess (wir sind ja darin geladen).
  x2 := WaitForWindow(X2_MAINCLASS, 30000);
  if x2 = 0 then Exit;
  StartCompanion;
  panel := WaitForWindow(PANEL_CLASS, 15000);
  if panel <> 0 then
    DockPanel(x2, panel);
end;

procedure OnAttach;
var
  tid: DWORD;
begin
  // Im Loader (DllMain) NICHT blockieren -> Arbeit in eigenen Thread auslagern.
  CloseHandle(CreateThread(nil, 0, @Worker, nil, 0, tid));
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
