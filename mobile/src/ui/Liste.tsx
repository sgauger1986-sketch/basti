import React from 'react';
import { FlatList, View, type FlatListProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { ABSTAND, RADIUS } from '@/theme/farben';
import { Trenner } from '@/ui';

/**
 * FlatList in Kartenoptik: Zeilen liegen auf einer Fläche mit Rand,
 * Kopf- und Leer-Komponenten außerhalb. Für lange Listen (Adressen,
 * LV-Positionen) performanter als eine ScrollView mit Karte.
 */
export function Liste<T>(props: FlatListProps<T>) {
  const { farben } = useTheme();
  const { renderItem, data, ...rest } = props;
  const n = data ? Array.from(data as ArrayLike<T>).length : 0;
  return (
    <FlatList
      data={data}
      renderItem={(info) => {
        const erste = info.index === 0;
        const letzte = info.index === n - 1;
        return (
          <View
            style={{
              backgroundColor: farben.flaeche,
              marginHorizontal: ABSTAND.l,
              borderColor: farben.rand,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderTopWidth: erste ? 1 : 0,
              borderBottomWidth: letzte ? 1 : 0,
              borderTopLeftRadius: erste ? RADIUS.l : 0,
              borderTopRightRadius: erste ? RADIUS.l : 0,
              borderBottomLeftRadius: letzte ? RADIUS.l : 0,
              borderBottomRightRadius: letzte ? RADIUS.l : 0,
              overflow: 'hidden',
            }}
          >
            {!erste ? <Trenner /> : null}
            {renderItem ? renderItem(info) : null}
          </View>
        );
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: ABSTAND.xl * 2 }}
      style={{ flex: 1 }}
      {...rest}
    />
  );
}
