/**
 * Wiederverwendbare Oberflächen-Bausteine. Alle Komponenten sind bewusst
 * schlicht gehalten und beziehen ihre Farben aus dem Theme.
 */
import React from 'react';
import {
  Platform,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StatusTon } from '@/domain/status';
import { Image } from 'expo-image';
import { ABSTAND, RADIUS, SCHATTEN, SCHRIFT } from '@/theme/farben';
import { useTheme } from '@/theme/useTheme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* ---------- Text ---------- */

export function Titel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { farben } = useTheme();
  return <Text style={[s.titel, { color: farben.text }, style]}>{children}</Text>;
}

export function Untertitel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { farben } = useTheme();
  return <Text style={[s.untertitel, { color: farben.text2 }, style]}>{children}</Text>;
}

export function Abschnitt({ children, rechts }: { children: React.ReactNode; rechts?: React.ReactNode }) {
  const { farben } = useTheme();
  return (
    <View style={s.abschnitt}>
      <Text style={[s.abschnittText, { color: farben.text3 }]}>{children}</Text>
      {rechts}
    </View>
  );
}

/* ---------- Flächen ---------- */

export function Karte({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { farben } = useTheme();
  return (
    <View style={[s.karte, SCHATTEN.karte, { backgroundColor: farben.flaeche, borderColor: farben.rand }, style]}>
      {children}
    </View>
  );
}

export function Trenner() {
  const { farben } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: farben.rand }} />;
}

/* ---------- Kennzahl ---------- */

export function Kennzahl({ label, wert, meta, icon }: { label: string; wert: string; meta?: string; icon?: IconName }) {
  const { farben } = useTheme();
  return (
    <Karte style={s.kpi}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[s.kpiLabel, { color: farben.text3 }]}>{label}</Text>
        {icon ? <Ionicons name={icon} size={16} color={farben.akzent} /> : null}
      </View>
      <Text style={[s.kpiWert, { color: farben.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {wert}
      </Text>
      {meta ? <Text style={[s.kpiMeta, { color: farben.text2 }]}>{meta}</Text> : null}
    </Karte>
  );
}

/* ---------- Status-Pille ---------- */

export function Pille({ ton, children }: { ton: StatusTon; children: React.ReactNode }) {
  const { farben } = useTheme();
  const f = farben.status[ton];
  return (
    <View style={[s.pille, { backgroundColor: f.hintergrund }]}>
      <Text style={[s.pilleText, { color: f.text }]}>{children}</Text>
    </View>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  const { farben } = useTheme();
  return (
    <View style={[s.chip, { backgroundColor: farben.flaeche2, borderColor: farben.rand }]}>
      <Text style={[s.chipText, { color: farben.text2 }]}>{children}</Text>
    </View>
  );
}

/* ---------- Listenzeile ---------- */

export interface ZeileProps {
  titel: string;
  untertitel?: string | null;
  rechts?: React.ReactNode;
  rechtsText?: string;
  icon?: IconName;
  onPress?: () => void;
  ohnePfeil?: boolean;
  mono?: boolean;
}

export function Zeile({ titel, untertitel, rechts, rechtsText, icon, onPress, ohnePfeil, mono }: ZeileProps) {
  const { farben } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.zeile, pressed && { backgroundColor: farben.flaeche2 }]}
    >
      {icon ? (
        <View style={[s.zeileIcon, { backgroundColor: farben.akzentWeich }]}>
          <Ionicons name={icon} size={18} color={farben.akzent} />
        </View>
      ) : null}
      <View style={s.zeileMitte}>
        <Text style={[s.zeileTitel, { color: farben.text }, mono && s.mono]} numberOfLines={2}>
          {titel}
        </Text>
        {untertitel ? (
          <Text style={[s.zeileUnter, { color: farben.text2 }]} numberOfLines={2}>
            {untertitel}
          </Text>
        ) : null}
      </View>
      {rechtsText ? (
        <Text style={[s.zeileRechtsText, { color: farben.text }]}>{rechtsText}</Text>
      ) : null}
      {rechts}
      {onPress && !ohnePfeil ? <Ionicons name="chevron-forward" size={18} color={farben.text3} /> : null}
    </Pressable>
  );
}

/* ---------- Feld (Label + Wert) ---------- */

export function Feld({ label, wert, mono }: { label: string; wert: React.ReactNode; mono?: boolean }) {
  const { farben } = useTheme();
  if (wert == null || wert === '' || wert === '—') return null;
  return (
    <View style={s.feld}>
      <Text style={[s.feldLabel, { color: farben.text3 }]}>{label}</Text>
      {typeof wert === 'string' ? (
        <Text style={[s.feldWert, { color: farben.text }, mono && s.mono]}>{wert}</Text>
      ) : (
        wert
      )}
    </View>
  );
}

/* ---------- Eingaben ---------- */

export function Eingabe({
  label,
  style,
  fehler,
  ...rest
}: TextInputProps & { label?: string; fehler?: string | null }) {
  const { farben } = useTheme();
  return (
    <View style={s.eingabeBlock}>
      {label ? <Text style={[s.eingabeLabel, { color: farben.text2 }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={farben.text3}
        style={[
          s.eingabe,
          {
            backgroundColor: farben.flaeche,
            borderColor: fehler ? farben.fehler : farben.rand,
            color: farben.text,
          },
          rest.multiline && { minHeight: 90, textAlignVertical: 'top' },
          style,
        ]}
        {...rest}
      />
      {fehler ? <Text style={[s.eingabeFehler, { color: farben.fehler }]}>{fehler}</Text> : null}
    </View>
  );
}

export function Suchfeld({ wert, onChange, placeholder }: { wert: string; onChange: (t: string) => void; placeholder?: string }) {
  const { farben } = useTheme();
  return (
    <View style={[s.suche, { backgroundColor: farben.flaeche, borderColor: farben.rand }]}>
      <Ionicons name="search" size={17} color={farben.text3} />
      <TextInput
        value={wert}
        onChangeText={onChange}
        placeholder={placeholder ?? 'Suchen'}
        placeholderTextColor={farben.text3}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        style={[s.sucheInput, { color: farben.text }]}
      />
      {wert ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Ionicons name="close-circle" size={17} color={farben.text3} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- Buttons ---------- */

export function Knopf({
  titel,
  variante = 'primaer',
  icon,
  laedt,
  style,
  ...rest
}: PressableProps & {
  titel: string;
  variante?: 'primaer' | 'sekundaer' | 'gefaehrlich';
  icon?: IconName;
  laedt?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { farben } = useTheme();
  const bg =
    variante === 'primaer' ? farben.akzent : variante === 'gefaehrlich' ? farben.fehlerWeich : farben.flaeche2;
  const fg =
    variante === 'primaer' ? farben.akzentText : variante === 'gefaehrlich' ? farben.fehler : farben.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={laedt || rest.disabled}
      style={({ pressed }) => [
        s.knopf,
        { backgroundColor: bg, opacity: pressed || rest.disabled ? 0.7 : 1 },
        style,
      ]}
      {...rest}
    >
      {laedt ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[s.knopfText, { color: fg }]}>{titel}</Text>
        </>
      )}
    </Pressable>
  );
}

export function AktionsKnopf({ icon, titel, onPress }: { icon: IconName; titel: string; onPress: () => void }) {
  const { farben } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.aktion,
        { backgroundColor: farben.akzentWeich, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={20} color={farben.akzent} />
      <Text style={[s.aktionText, { color: farben.akzent }]}>{titel}</Text>
    </Pressable>
  );
}

/* ---------- Leerzustand & Hinweis ---------- */

export function Leer({ icon = 'folder-open-outline', titel, text, bild }: { icon?: IconName; titel: string; text?: string; bild?: boolean }) {
  const { farben } = useTheme();
  return (
    <View style={s.leer}>
      {bild ? (
        <Image source={require('../../assets/leer.png')} style={{ width: 150, height: 150, marginBottom: 4 }} contentFit="contain" />
      ) : (
        <View style={[s.leerIcon, { backgroundColor: farben.akzentWeich }]}>
          <Ionicons name={icon} size={26} color={farben.akzent} />
        </View>
      )}
      <Text style={[s.leerTitel, { color: farben.text }]}>{titel}</Text>
      {text ? <Text style={[s.leerText, { color: farben.text2 }]}>{text}</Text> : null}
    </View>
  );
}

export function Hinweis({ ton = 'neutral', children }: { ton?: StatusTon; children: React.ReactNode }) {
  const { farben } = useTheme();
  const f = farben.status[ton];
  return (
    <View style={[s.hinweis, { backgroundColor: f.hintergrund }]}>
      <Text style={[s.hinweisText, { color: f.text }]}>{children}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const s = StyleSheet.create({
  titel: { fontSize: 24, fontFamily: SCHRIFT.bold, letterSpacing: -0.4, lineHeight: 30 },
  untertitel: { fontFamily: SCHRIFT.regular, fontSize: 13, marginTop: 2 },
  abschnitt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ABSTAND.l,
    paddingTop: ABSTAND.xl,
    paddingBottom: ABSTAND.s,
  },
  abschnittText: { fontSize: 11.5, fontFamily: SCHRIFT.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  karte: {
    borderRadius: RADIUS.l,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginHorizontal: ABSTAND.l,
  },
  kpi: { flex: 1, padding: ABSTAND.l, marginHorizontal: 0, minWidth: 140 },
  kpiLabel: { fontSize: 11, fontFamily: SCHRIFT.bold, textTransform: 'uppercase', letterSpacing: 0.6 },
  kpiWert: { fontSize: 22, fontFamily: SCHRIFT.bold, marginTop: 8, fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  kpiMeta: { fontFamily: SCHRIFT.regular, fontSize: 12, marginTop: 2 },
  pille: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  pilleText: { fontSize: 11.5, fontFamily: SCHRIFT.semibold },
  chip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 11, fontFamily: SCHRIFT.semibold },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ABSTAND.m,
    paddingHorizontal: ABSTAND.l,
    paddingVertical: ABSTAND.m,
    minHeight: 56,
  },
  zeileIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  zeileMitte: { flex: 1, gap: 2 },
  zeileTitel: { fontSize: 15, fontFamily: SCHRIFT.semibold },
  zeileUnter: { fontFamily: SCHRIFT.regular, fontSize: 13 },
  zeileRechtsText: { fontSize: 14, fontFamily: SCHRIFT.semibold, fontVariant: ['tabular-nums'] },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  feld: { width: '50%', paddingHorizontal: ABSTAND.l, paddingVertical: ABSTAND.s },
  feldLabel: { fontSize: 11, fontFamily: SCHRIFT.bold, textTransform: 'uppercase', letterSpacing: 0.6 },
  feldWert: { fontFamily: SCHRIFT.regular, fontSize: 15, marginTop: 3 },
  eingabeBlock: { gap: 6 },
  eingabeLabel: { fontSize: 13, fontFamily: SCHRIFT.semibold },
  eingabe: {
    borderWidth: 1,
    borderRadius: RADIUS.s,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: SCHRIFT.regular, fontSize: 16,
  },
  eingabeFehler: { fontFamily: SCHRIFT.regular, fontSize: 12 },
  suche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.s,
    paddingHorizontal: 10,
    height: 40,
    marginHorizontal: ABSTAND.l,
  },
  sucheInput: { flex: 1, fontFamily: SCHRIFT.regular, fontSize: 15, paddingVertical: 0 },
  knopf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.m,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 50,
  },
  knopfText: { fontSize: 15, fontFamily: SCHRIFT.bold },
  aktion: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: RADIUS.s,
    paddingVertical: 10,
  },
  aktionText: { fontSize: 12, fontFamily: SCHRIFT.semibold },
  leer: { alignItems: 'center', paddingVertical: ABSTAND.xl * 1.5, paddingHorizontal: ABSTAND.xl, gap: 6 },
  leerIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  leerTitel: { fontSize: 16, fontFamily: SCHRIFT.bold },
  leerText: { fontFamily: SCHRIFT.regular, fontSize: 13, textAlign: 'center' },
  hinweis: { borderRadius: RADIUS.s, padding: ABSTAND.m, marginHorizontal: ABSTAND.l },
  hinweisText: { fontFamily: SCHRIFT.regular, fontSize: 13, lineHeight: 18 },
});
