import { LogBox } from 'react-native';

// Ces warnings sont attendus dans Expo Go — les notifs push fonctionnent dans le vrai APK
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported',
]);

import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import AppNavigator from './src/navigation/AppNavigator';
import { subscribeToDevis } from './src/services/firebase';
import { requestNotificationPermission, sendDevisNotification, setBadgeCount } from './src/services/notifications';
import { FIREBASE_CONFIGURED } from './firebase.config';
import { colors } from './src/theme/colors';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

export default function App() {
  const [newDevisCount, setNewDevisCount] = useState(0);
  const knownIdsRef = useRef(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    if (!IS_EXPO_GO) requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;

    const unsub = subscribeToDevis((devis) => {
      const nouveaux = devis.filter((d) => d.status === 'nouveau');
      setNewDevisCount(nouveaux.length);
      if (!IS_EXPO_GO) setBadgeCount(nouveaux.length);

      if (knownIdsRef.current === null) {
        knownIdsRef.current = new Set(devis.map((d) => d.id));
        return;
      }

      if (!IS_EXPO_GO) {
        for (const d of nouveaux) {
          if (!knownIdsRef.current.has(d.id)) {
            sendDevisNotification(d);
            knownIdsRef.current.add(d.id);
          }
        }
      }

      devis.forEach((d) => knownIdsRef.current.add(d.id));
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (IS_EXPO_GO) return;
    let sub;
    try {
      const Notifications = require('expo-notifications');
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const devisId = response.notification.request.content.data?.devisId;
        if (devisId && navigationRef.current) {
          navigationRef.current.navigate('Devis');
        }
      });
    } catch {}
    return () => sub?.remove();
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
