import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
import { colors } from '../theme/colors';

import DashboardScreen from '../screens/DashboardScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import AddClientScreen from '../screens/AddClientScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import AddAppointmentScreen from '../screens/AddAppointmentScreen';
import DemandesScreen from '../screens/DemandesScreen';
import DemandeDetailScreen from '../screens/DemandeDetailScreen';
import DevisListScreen from '../screens/DevisListScreen';
import DevisDetailScreen from '../screens/DevisDetailScreen';
import CreateDevisScreen from '../screens/CreateDevisScreen';

const Tab = createBottomTabNavigator();
const ClientStack = createStackNavigator();
const RdvStack = createStackNavigator();
const DemandesStack = createStackNavigator();
const DevisStack = createStackNavigator();

const TAB_ICON = {
  Dashboard: '⬡',
  Demandes: '📩',
  Devis: '🧾',
  Clients: '👤',
  'Rendez-vous': '📅',
};

function TabIcon({ name, focused, badgeCount }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{TAB_ICON[name]}</Text>
      {badgeCount > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -10,
          backgroundColor: colors.cyan, borderRadius: 8,
          minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: colors.bg, fontSize: 10, fontWeight: '700' }}>{badgeCount}</Text>
        </View>
      )}
    </View>
  );
}

function ClientsNavigator() {
  return (
    <ClientStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientStack.Screen name="ClientsList" component={ClientsScreen} />
      <ClientStack.Screen name="ClientDetail" component={ClientDetailScreen} />
      <ClientStack.Screen name="AddClient" component={AddClientScreen} />
    </ClientStack.Navigator>
  );
}

function RdvNavigator() {
  return (
    <RdvStack.Navigator screenOptions={{ headerShown: false }}>
      <RdvStack.Screen name="RdvList" component={AppointmentsScreen} />
      <RdvStack.Screen name="AddAppointment" component={AddAppointmentScreen} />
    </RdvStack.Navigator>
  );
}

function DemandesNavigator() {
  return (
    <DemandesStack.Navigator screenOptions={{ headerShown: false }}>
      <DemandesStack.Screen name="DemandesList" component={DemandesScreen} />
      <DemandesStack.Screen name="DemandeDetail" component={DemandeDetailScreen} />
    </DemandesStack.Navigator>
  );
}

function DevisNavigator() {
  return (
    <DevisStack.Navigator screenOptions={{ headerShown: false }}>
      <DevisStack.Screen name="DevisList" component={DevisListScreen} />
      <DevisStack.Screen name="DevisDetail" component={DevisDetailScreen} />
      <DevisStack.Screen name="CreateDevis" component={CreateDevisScreen} />
    </DevisStack.Navigator>
  );
}

export default function AppNavigator({ newDemandesCount }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.gray,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            badgeCount={route.name === 'Demandes' ? newDemandesCount : 0}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Demandes" component={DemandesNavigator} />
      <Tab.Screen name="Devis" component={DevisNavigator} />
      <Tab.Screen name="Clients" component={ClientsNavigator} />
      <Tab.Screen name="Rendez-vous" component={RdvNavigator} />
    </Tab.Navigator>
  );
}
