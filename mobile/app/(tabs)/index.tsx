import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { brand } from '@/brand';
import { kennzahlen, rapportStunden } from '@/domain/kpi';
import { datum, euroKompakt, stunden } from '@/domain/format';
import { PROJEKT_STATUS_LABEL, SYNC_STATUS_LABEL, projektStatusTon, syncStatusTon } from '@/domain/status';
import { useApp, useDaten } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, SCHATTEN, SCHRIFT } from '@/theme/farben';
import { Bildschirm } from '@/ui/Bildschirm';
import { Abschnitt, Hinweis, Karte, Kennzahl, Knopf, Leer, Pille, Trenner, Zeile } from '@/ui';

export default function Start() {
  const router = useRouter();
  const { laedt, ladeFehler, datenAktualisieren, rapporte, einstellungen, daten } = useApp();
  const d = useDaten();
  const { farben } = useTheme();
  const k = useMemo(() => kennzahlen(d.projekte), [d.projekte]);
  const aktiveProjekte = useMemo(
    () => d.projekte.filter((p) => p.status === 'bearbeitung' || p.status === 'auftrag').slice(0, 5),
    [d.projekte]
  );
  const offeneRapporte = useMemo(() => rapporte.filter((r) => r.sync !== 'synchronisiert').slice(0, 5), [rapporte]);
  const projektName = (id: string) => d.projekte.find((p) => p.id === id)?.kurzbez ?? 'Unbekanntes Projekt';

  return (
    <Bildschirm aktualisieren={datenAktualisieren} laedt={laedt}>
      <LinearGradient
        colors={[farben.akzent, '#1f4d38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.hero, SCHATTEN.hervorgehoben]}
      >
        <View style={s.heroKopf}>
          <View>
            <Text style={s.heroGruss}>{gruss()}</Text>
            <Text style={s.heroName}>{brand.name}</Text>
          </View>
          <View style={s.heroBadge}>
            <Ionicons name={einstellungen.modus === 'demo' ? 'flask-outline' : 'cloud-done-outline'} size={13} color="#fff" />
            <Text style={s.heroBadgeText}>
              {einstellungen.modus === 'demo' ? 'Demo · offline' : `Stand ${daten?.standVom ? datum(daten.standVom) : '—'}`}
            </Text>
          </View>
        </View>
        <Text style={s.heroLabel}>Offene Auftragssumme</Text>
        <Text style={s.heroWert}>{euroKompakt(k.offen)}</Text>
        <View style={s.heroZeile}>
          <HeroStat label="Angebote" wert={euroKompakt(k.angebotsvolumen)} />
          <HeroStat label="Aufträge" wert={euroKompakt(k.auftragsvolumen)} />
          <HeroStat label="Fakturiert" wert={euroKompakt(k.fakturiert)} />
        </View>
      </LinearGradient>

      {ladeFehler ? <Hinweis ton="fehler">Daten konnten nicht geladen werden: {ladeFehler}</Hinweis> : null}

      <View style={s.kpis}>
        <Kennzahl icon="briefcase-outline" label="Projekte" wert={String(k.projekte)} meta={`${d.lvListen.length} Leistungsverzeichnisse`} />
        <Kennzahl icon="create-outline" label="Rapporte" wert={String(rapporte.length)} meta={`${offeneRapporte.length} offen`} />
      </View>

      <View style={{ paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l }}>
        <Knopf titel="Rapport erfassen" icon="add-circle-outline" onPress={() => router.push('/rapport/neu')} />
      </View>

      <Abschnitt>Laufende Projekte</Abschnitt>
      <Karte>
        {aktiveProjekte.length === 0 ? (
          <Leer titel="Keine laufenden Projekte" />
        ) : (
          aktiveProjekte.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 ? <Trenner /> : null}
              <Zeile
                titel={p.bezeichnung}
                untertitel={[p.nummer, p.kundenName].filter(Boolean).join(' · ')}
                rechts={<Pille ton={projektStatusTon(p.status)}>{PROJEKT_STATUS_LABEL[p.status]}</Pille>}
                onPress={() => router.push(`/projekt/${p.id}`)}
              />
            </React.Fragment>
          ))
        )}
      </Karte>

      <Abschnitt>Meine offenen Rapporte</Abschnitt>
      <Karte>
        {offeneRapporte.length === 0 ? (
          <Leer bild titel="Alles übertragen" text="Keine offenen Rapporte." />
        ) : (
          offeneRapporte.map((r, i) => (
            <React.Fragment key={r.id}>
              {i > 0 ? <Trenner /> : null}
              <Zeile
                titel={r.name || 'Ohne Bezeichnung'}
                untertitel={`${datum(r.datum)} · ${projektName(r.projektId)} · ${stunden(rapportStunden(r))}`}
                rechts={<Pille ton={syncStatusTon(r.sync)}>{SYNC_STATUS_LABEL[r.sync]}</Pille>}
                onPress={() => router.push(`/rapport/${r.id}`)}
              />
            </React.Fragment>
          ))
        )}
      </Karte>
    </Bildschirm>
  );
}

function gruss(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 17) return 'Guten Tag';
  return 'Guten Abend';
}

function HeroStat({ label, wert }: { label: string; wert: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.heroStatLabel}>{label}</Text>
      <Text style={s.heroStatWert} numberOfLines={1}>
        {wert}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { marginHorizontal: ABSTAND.l, marginTop: ABSTAND.l, borderRadius: 22, padding: ABSTAND.xl - 2 },
  heroKopf: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ABSTAND.xl },
  heroGruss: { fontFamily: SCHRIFT.medium, fontSize: 13, color: 'rgba(255,255,255,0.78)' },
  heroName: { fontFamily: SCHRIFT.extrabold, fontSize: 24, color: '#fff', letterSpacing: -0.5 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  heroBadgeText: { fontFamily: SCHRIFT.medium, fontSize: 11, color: '#fff' },
  heroLabel: { fontFamily: SCHRIFT.medium, fontSize: 12, color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroWert: { fontFamily: SCHRIFT.extrabold, fontSize: 36, color: '#fff', letterSpacing: -1, marginTop: 2, marginBottom: ABSTAND.l, fontVariant: ['tabular-nums'] },
  heroZeile: { flexDirection: 'row', gap: ABSTAND.m, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.3)', paddingTop: ABSTAND.m },
  heroStatLabel: { fontFamily: SCHRIFT.regular, fontSize: 11, color: 'rgba(255,255,255,0.72)' },
  heroStatWert: { fontFamily: SCHRIFT.semibold, fontSize: 14, color: '#fff', marginTop: 2, fontVariant: ['tabular-nums'] },
  kpis: { flexDirection: 'row', gap: ABSTAND.m, paddingHorizontal: ABSTAND.l, paddingTop: ABSTAND.l },
});
