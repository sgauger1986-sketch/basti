program X2Companion;
{
  Begleit-Fenster fuer X2 -- zeigt das Chat-Panel (WebView2) an.

  Rolle: Dieses kleine Programm ist NUR die Huelle. Es zeigt per Microsoft
  Edge WebView2 die lokale Panel-Seite an (http://127.0.0.1:8756/), die vom
  Python-Dienst serve.py ausgeliefert und von der Pruef-Engine bedient wird.
  Kein Internet, kein Datenabfluss.

  Diese .dpr ist eine KOMPILIERBARE VORLAGE fuer Delphi (getestet gegen die
  Struktur, nicht auf diesem Linux-Rechner gebaut). Voraussetzungen auf dem
  Windows-Rechner:
    * Delphi mit VCL (TEdgeBrowser ist ab Delphi 10.4 enthalten)
    * WebView2-Runtime installiert (Evergreen) + WebView2Loader.dll daneben
    * Der Python-Dienst laeuft:  python serve.py

  Build (Kommandozeile):  dcc32 X2Companion.dpr
  Der Fenster-Griff (Handle) dieses Programms wird von X2Dock an das
  X2-Hauptfenster angedockt -- siehe X2Dock.dpr.
}

uses
  Winapi.Windows,
  Winapi.Messages,
  System.SysUtils,
  Vcl.Forms,
  Vcl.Controls,
  Vcl.Edge;

const
  PANEL_URL = 'http://127.0.0.1:8756/';
  WND_CLASS = 'X2AssistentPanel';   // eindeutige Klasse -> X2Dock findet das Fenster

var
  Form: TForm;
  Edge: TEdgeBrowser;

begin
  Application.Initialize;
  Application.Title := 'X2 Assistent';

  Form := TForm.CreateNew(nil);
  Form.Caption := 'X2 Assistent';
  Form.Width := 420;
  Form.Height := 640;
  // Eindeutigen Klassennamen setzen, damit der Docker (X2Dock) uns findet:
  // (in echtem Code ueber eine abgeleitete TForm mit CreateParams gesetzt)
  Form.HandleNeeded;

  Edge := TEdgeBrowser.Create(Form);
  Edge.Parent := Form;
  Edge.Align := alClient;
  // Erst nach CreateWebViewCompleted ist Navigate sicher:
  Edge.Navigate(PANEL_URL);

  Application.MainFormOnTaskBar := False;
  Form.Show;
  Application.Run;
end.
