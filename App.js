import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { subscribeToDevis } from './src/services/firebase';
import { requestNotificationPermission, sendDevisNotification, setBadgeCount } from './src/services/notifications';
import { FIREBASE_CONFIGURED } from './firebase.config';
import { colors } from './src/theme/colors';

export default function App() {
  const [newDevisCount, setNewDevisCount] = useState(0);
  const knownIdsRef = useRef(null); // null = premier chargement

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;

    const unsub = subscribeToDevis((devis) => {
      const nouveaux = devis.filter((d) => d.status === 'nouveau');
      setNewDevisCount(nouveaux.length);
      setBadgeCount(nouveaux.length);

      // Premier chargement : on mémorise les IDs existants sans notifier
      if (knownIdsRef.current === null) {
        knownIdsRef.current = new Set(devis.map((d) => d.id));
        return;
      }

      // Chargements suivants : notifier uniquement les vrais nouveaux
      for (const d of nouveaux) {
        if (!knownIdsRef.current.has(d.id)) {
          sendDevisNotification(d);
          knownIdsRef.current.add(d.id);
        }
      }
    });

    return unsub;
  }, []);

  // Listener pour naviguer vers le devis quand on tape la notif
  const navigationRef = useRef(null);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const devisId = response.notification.request.content.data?.devisId;
      if (devisId && navigationRef.current) {
        navigationRef.current.navigate('Devis');
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" backgroundColor={colors.bg} />
          <AppNavigator newDevisCount={newDevisCount} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
