import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Les notifications push ne fonctionnent pas dans Expo Go (SDK 53+)
// Elles sont actives uniquement dans un vrai build (APK / dev build)
const IS_EXPO_GO = Constants.appOwnership === 'expo';

if (!IS_EXPO_GO) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function requestNotificationPermission() {
  if (IS_EXPO_GO || !Device.isDevice) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function sendDemandeNotification(demande) {
  if (IS_EXPO_GO) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📩 Nouvelle demande de devis',
        body: `${demande.nom} — ${demande.service}`,
        data: { demandeId: demande.id },
        sound: true,
      },
      trigger: null,
    });
  } catch {}
}

export function setBadgeCount(count) {
  if (IS_EXPO_GO) return;
  try {
    Notifications.setBadgeCountAsync(count);
  } catch {}
}
