import { useColorScheme } from 'react-native';
import { useApp } from '@/state/AppProvider';
import { DUNKEL, HELL, type Farben } from './farben';

export function useTheme(): { farben: Farben; dunkel: boolean } {
  const system = useColorScheme();
  const { einstellungen } = useApp();
  const dunkel =
    einstellungen.farbschema === 'dunkel' ||
    (einstellungen.farbschema === 'system' && system === 'dark');
  return { farben: dunkel ? DUNKEL : HELL, dunkel };
}
