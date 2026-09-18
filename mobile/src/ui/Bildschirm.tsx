import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND } from '@/theme/farben';

/** Scrollbarer Bildschirm mit Theme-Hintergrund und optionalem Pull-to-Refresh */
export function Bildschirm({
  children,
  aktualisieren,
  laedt,
  style,
}: {
  children: React.ReactNode;
  aktualisieren?: () => void;
  laedt?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { farben } = useTheme();
  return (
    <ScrollView
      style={[{ backgroundColor: farben.hintergrund }, style]}
      contentContainerStyle={s.inhalt}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        aktualisieren ? (
          <RefreshControl refreshing={!!laedt} onRefresh={aktualisieren} tintColor={farben.text2} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

/** Nicht scrollender Container (für FlatList-Bildschirme) */
export function Flaeche({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { farben } = useTheme();
  return <View style={[{ flex: 1, backgroundColor: farben.hintergrund }, style]}>{children}</View>;
}

const s = StyleSheet.create({
  inhalt: { paddingBottom: ABSTAND.xl * 2 },
});
