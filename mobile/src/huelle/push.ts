/**
 * Push-Benachrichtigungen (Expo Push Service). Liefert den Token, den die
 * Web-Oberfläche an ihr Backend melden kann; ohne EAS-Projekt-ID oder auf
 * dem Simulator gibt es keinen Token – das ist kein Fehler.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function pushTokenHolen(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('standard', {
        name: 'Benachrichtigungen',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const vorhanden = await Notifications.getPermissionsAsync();
    let status = vorhanden.status;
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      (Constants.easConfig as { projectId?: string } | null)?.projectId;
    if (!projectId) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

/** Benachrichtigungen auch im Vordergrund anzeigen */
export function pushVerhaltenSetzen(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}
