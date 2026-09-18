import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, RADIUS, SCHRIFT } from '@/theme/farben';
import { Suchfeld, Trenner } from '@/ui';

export interface Option {
  id: string;
  text: string;
  untertitel?: string | null;
}

/**
 * Auswahlfeld, das ein Vollbild-Sheet mit durchsuchbarer Liste öffnet.
 * Bewusst ohne native Picker-Abhängigkeit, funktioniert identisch auf iOS,
 * Android und im Web.
 */
export function Auswahl({
  label,
  wertId,
  optionen,
  onWahl,
  gesperrt,
  leerText = 'Bitte wählen',
  keinerErlaubt,
}: {
  label: string;
  wertId: string | null;
  optionen: Option[];
  onWahl: (id: string | null) => void;
  gesperrt?: boolean;
  leerText?: string;
  keinerErlaubt?: boolean;
}) {
  const { farben } = useTheme();
  const [offen, setOffen] = useState(false);
  const [suche, setSuche] = useState('');
  const aktuell = optionen.find((o) => o.id === wertId);
  const liste = useMemo(() => {
    const t = suche.trim().toLowerCase();
    return t ? optionen.filter((o) => `${o.text} ${o.untertitel ?? ''}`.toLowerCase().includes(t)) : optionen;
  }, [optionen, suche]);

  function waehlen(id: string | null) {
    onWahl(id);
    setOffen(false);
    setSuche('');
  }

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontFamily: SCHRIFT.semibold, color: farben.text2 }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={gesperrt ? undefined : () => setOffen(true)}
        style={[s.feld, { backgroundColor: farben.flaeche, borderColor: farben.rand, opacity: gesperrt ? 0.6 : 1 }]}
      >
        <Text style={{ color: aktuell ? farben.text : farben.text3, fontFamily: SCHRIFT.regular, fontSize: 16, flex: 1 }} numberOfLines={1}>
          {aktuell?.text ?? leerText}
        </Text>
        {!gesperrt ? <Ionicons name="chevron-expand-outline" size={16} color={farben.text3} /> : null}
      </Pressable>

      <Modal visible={offen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOffen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: farben.hintergrund }} edges={['top', 'bottom']}>
          <View style={s.kopf}>
            <Text style={[s.kopfTitel, { color: farben.text }]}>{label}</Text>
            <Pressable onPress={() => setOffen(false)} hitSlop={8} accessibilityLabel="Schließen">
              <Ionicons name="close" size={24} color={farben.text2} />
            </Pressable>
          </View>
          {optionen.length > 8 ? (
            <View style={{ paddingBottom: ABSTAND.m }}>
              <Suchfeld wert={suche} onChange={setSuche} />
            </View>
          ) : null}
          <FlatList
            data={liste}
            keyExtractor={(o) => o.id}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={Trenner}
            ListHeaderComponent={
              keinerErlaubt ? (
                <>
                  <Eintrag text="Keine Auswahl" aktiv={wertId == null} onPress={() => waehlen(null)} />
                  <Trenner />
                </>
              ) : null
            }
            ListEmptyComponent={<Text style={{ color: farben.text3, padding: ABSTAND.xl, textAlign: 'center' }}>Keine Einträge</Text>}
            renderItem={({ item }) => (
              <Eintrag text={item.text} untertitel={item.untertitel} aktiv={item.id === wertId} onPress={() => waehlen(item.id)} />
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function Eintrag({ text, untertitel, aktiv, onPress }: { text: string; untertitel?: string | null; aktiv: boolean; onPress: () => void }) {
  const { farben } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.eintrag, { backgroundColor: pressed ? farben.flaeche2 : farben.flaeche }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: farben.text, fontSize: 16, fontFamily: aktiv ? SCHRIFT.bold : SCHRIFT.regular }}>{text}</Text>
        {untertitel ? <Text style={{ color: farben.text2, fontFamily: SCHRIFT.regular, fontSize: 13 }}>{untertitel}</Text> : null}
      </View>
      {aktiv ? <Ionicons name="checkmark" size={20} color={farben.akzent} /> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  feld: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: RADIUS.s, paddingHorizontal: 12, minHeight: 44 },
  kopf: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ABSTAND.l },
  kopfTitel: { fontSize: 18, fontFamily: SCHRIFT.bold },
  eintrag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ABSTAND.l, paddingVertical: 14, gap: 12 },
});
