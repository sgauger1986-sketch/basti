program X2Dock;
{
  Startet X2 und das Begleit-Fenster und DOCKT das Panel an das X2-Fenster,
  OHNE die X2.exe zu veraendern.

  Ablauf:
    1. Python-Dienst sicherstellen (serve.py laeuft lokal).
    2. X2.exe starten (oder ein bereits laufendes X2 finden).
    3. X2Companion.exe starten.
    4. Dessen Fenster per SetParent in das X2-Hauptfenster einhaengen und
       rechts andocken; per SetWinEventHook mitwandern lassen.

  Das ist der ROBUSTE Weg fuer den Hersteller: kein Byte-Patch, kein Eingriff in
  die VCL-Formulare von X2. Der Nutzer startet kuenftig X2Dock statt X2 direkt
  (der Installer legt die Verknuepfung entsprechend an).

  KOMPILIERBARE VORLAGE fuer Delphi/Windows -- hier nicht baubar. Die mit TODO
  markierten Stellen (Fensterklasse von X2, Pfade) am Zielsystem eintragen.

  Build:  dcc32 X2Dock.dpr
}

uses
  Winapi.Windows,
  Winapi.Messages,
  System.SysUtils;

const
  X2_EXE        = 'C:\Program Files\mexXsoft\X2\X2.exe';   // TODO: echten Pfad
  COMPANION_EXE = 'X2Companion.exe';
  X2_MAINCLASS  = 'TAppBuilder';   // TODO: echte Fensterklasse von X2 (s. Anleitung)
  PANEL_CLASS   = 'X2AssistentPanel';
  DOCK_WIDTH    = 420;

var
  X2Wnd, PanelWnd: HWND;

function StartProcess(const Cmd: string): Boolean;
var
  si: TStartupInfo;
  pi: TProcessInformation;
  c: string;
begin
  FillChar(si, SizeOf(si), 0);
  si.cb := SizeOf(si);
  c := Cmd;
  UniqueString(c);
  Result := CreateProcess(nil, PChar(c), nil, nil, False, 0, nil, nil, si, pi);
  if Result then
  begin
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
  end;
end;

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

procedure DockPanel(Host, Panel: HWND);
var
  r: TRect;
begin
  // Panel zum Kind des X2-Fensters machen und rechts andocken.
  Winapi.Windows.SetParent(Panel, Host);
  SetWindowLong(Panel, GWL_STYLE,
    (GetWindowLong(Panel, GWL_STYLE) or WS_CHILD) and not WS_POPUP);
  GetClientRect(Host, r);
  MoveWindow(Panel, r.Right - DOCK_WIDTH, 0, DOCK_WIDTH, r.Bottom - r.Top, True);
  // TODO: SetWinEventHook(EVENT_OBJECT_LOCATIONCHANGE ...) registrieren, damit
  //       das Panel bei Groessen-/Positionsaenderung von X2 mitwandert.
end;

begin
  // 1) Dienst-Hinweis (serve.py muss laufen; der Installer startet ihn als
  //    Autostart/Dienst). Hier nur ein Platzhalter:
  // StartProcess('pythonw serve.py');

  // 2) X2 starten, falls nicht offen
  X2Wnd := FindByClass(X2_MAINCLASS);
  if X2Wnd = 0 then
  begin
    if not StartProcess(X2_EXE) then
    begin
      MessageBox(0, 'X2 konnte nicht gestartet werden.', 'X2Dock', MB_ICONERROR);
      Halt(1);
    end;
    X2Wnd := WaitForWindow(X2_MAINCLASS, 30000);
  end;
  if X2Wnd = 0 then
  begin
    MessageBox(0, 'X2-Hauptfenster nicht gefunden (Fensterklasse pruefen).',
      'X2Dock', MB_ICONERROR);
    Halt(2);
  end;

  // 3) Begleit-Fenster starten
  StartProcess(COMPANION_EXE);
  PanelWnd := WaitForWindow(PANEL_CLASS, 15000);
  if PanelWnd = 0 then
  begin
    MessageBox(0, 'Panel-Fenster nicht gefunden.', 'X2Dock', MB_ICONERROR);
    Halt(3);
  end;

  // 4) Andocken
  DockPanel(X2Wnd, PanelWnd);
end.
