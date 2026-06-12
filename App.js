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
import { subscribeToDemandes } from './src/services/firebase';
import { requestNotificationPermission, sendDemandeNotification, setBadgeCount } from './src/services/notifications';
import { FIREBASE_CONFIGURED } from './firebase.config';
import { colors } from './src/theme/colors';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

export default function App() {
  const [newDemandesCount, setNewDemandesCount] = useState(0);
  const knownIdsRef = useRef(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    if (!IS_EXPO_GO) requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;

    const unsub = subscribeToDemandes((demandes) => {
      const nouvelles = demandes.filter((d) => d.status === 'nouvelle');
      setNewDemandesCount(nouvelles.length);
      if (!IS_EXPO_GO) setBadgeCount(nouvelles.length);

      if (knownIdsRef.current === null) {
        knownIdsRef.current = new Set(demandes.map((d) => d.id));
        return;
      }

      if (!IS_EXPO_GO) {
        for (const d of nouvelles) {
          if (!knownIdsRef.current.has(d.id)) {
            sendDemandeNotification(d);
            knownIdsRef.current.add(d.id);
          }
        }
      }

      demandes.forEach((d) => knownIdsRef.current.add(d.id));
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (IS_EXPO_GO) return;
    let sub;
    try {
      const Notifications = require('expo-notifications');
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const demandeId = response.notification.request.content.data?.demandeId;
        if (demandeId && navigationRef.current) {
          navigationRef.current.navigate('Demandes');
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
          <AppNavigator newDemandesCount={newDemandesCount} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
