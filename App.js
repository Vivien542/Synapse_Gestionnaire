import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { subscribeToDevis } from './src/services/firebase';
import { FIREBASE_CONFIGURED } from './firebase.config';
import { colors } from './src/theme/colors';

export default function App() {
  const [newDevisCount, setNewDevisCount] = useState(0);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    const unsub = subscribeToDevis((devis) => {
      setNewDevisCount(devis.filter((d) => d.status === 'nouveau').length);
    });
    return unsub;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={colors.bg} />
          <AppNavigator newDevisCount={newDevisCount} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
