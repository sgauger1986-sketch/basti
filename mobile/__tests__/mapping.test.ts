import { adresseAusRoh, datenbestandAusRoh, projektAusRoh, lvPositionAusRoh } from '@/data/mapping';
import demo from '@/data/demo-daten.json';
import { kennzahlen } from '@/domain/kpi';

describe('Mapping der Rohdaten', () => {
  test('Projekt aus Rohsatz', () => {
    const p = projektAusRoh({
      ID_PROJEKTE: 'SV1',
      ID_PROJEKTE_STATUS: 'SV00000005',
      NUMMER: '1001',
      KURZBEZ: 'Kurz',
      BEZEICHNUNG: null,
      LV_SUMME_AUFTRAG: '1200.5',
    });
    expect(p).toMatchObject({ id: 'SV1', status: 'angebot', bezeichnung: 'Kurz', summeAuftrag: 1200.5 });
    expect(projektAusRoh({ NUMMER: 'ohne id' })).toBeNull();
  });

  test('Firma wird auch ohne FLAG_FIRMA erkannt', () => {
    expect(adresseAusRoh({ ID_ADRESSE: 'a', AD_ANZEIGENAME: 'Bruns GmbH', AD_FIRMA: 'Bruns GmbH', FLAG_FIRMA: false })?.istFirma).toBe(true);
    expect(adresseAusRoh({ ID_ADRESSE: 'b', AD_ANZEIGENAME: 'Toll, Richard', AD_FIRMA: 'Geisler GmbH', FLAG_FIRMA: false })?.istFirma).toBe(false);
    expect(adresseAusRoh({ ID_ADRESSE: 'c', AD_ANZEIGENAME: 'Schmitt', FLAG_FIRMA: true })?.istFirma).toBe(true);
    expect(adresseAusRoh({ ID_ADRESSE: 'd', AD_ANZEIGENAME: null })).toBeNull();
  });

  test('ROOT wird zu parentId null', () => {
    expect(lvPositionAusRoh({ ID_LV_POS: 'a', ID_PROJEKTE_LVLIST: 'lv', ID_PARENT: 'ROOT' })?.parentId).toBeNull();
    expect(lvPositionAusRoh({ ID_LV_POS: 'a', ID_PROJEKTE_LVLIST: 'lv', ID_PARENT: 'b' })?.parentId).toBe('b');
  });

  test('Demo-Datenbestand ist vollständig und konsistent', () => {
    const d = datenbestandAusRoh(demo);
    expect(d.projekte.length).toBe(8);
    expect(d.lvListen.length).toBe(20);
    expect(d.lvPositionen.length).toBe(1087);
    expect(d.adressen.length).toBeGreaterThan(0);
    // Jede LV-Liste gehört zu einem vorhandenen Projekt
    const projektIds = new Set(d.projekte.map((p) => p.id));
    expect(d.lvListen.every((l) => projektIds.has(l.projektId))).toBe(true);
    // Kennzahlen sind berechenbar
    const k = kennzahlen(d.projekte);
    expect(k.projekte).toBe(8);
    expect(k.auftragsvolumen).toBeGreaterThan(0);
    expect(k.offen).toBe(k.auftragsvolumen - k.fakturiert);
  });
});
