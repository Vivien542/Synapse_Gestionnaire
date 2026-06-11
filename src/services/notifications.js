import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission() {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendDevisNotification(devis) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📩 Nouveau devis reçu',
      body: `${devis.nom} — ${devis.service}`,
      data: { devisId: devis.id },
      sound: true,
    },
    trigger: null, // immédiat
  });
}

export function setBadgeCount(count) {
  Notifications.setBadgeCountAsync(count);
}
