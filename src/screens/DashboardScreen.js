import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { getClients, getRdvs } from '../services/storage';
import { FIREBASE_CONFIGURED } from '../../firebase.config';

function StatCard({ label, value, color, sub }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function RdvItem({ rdv, onPress }) {
  const date = new Date(rdv.date);
  const day = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <TouchableOpacity style={styles.rdvItem} onPress={onPress}>
      <View style={styles.rdvTime}>
        <Text style={styles.rdvHeure}>{rdv.heure}</Text>
        <Text style={styles.rdvDay}>{day}</Text>
      </View>
      <View style={styles.rdvInfo}>
        <Text style={styles.rdvClient}>{rdv.clientNom}</Text>
        <Text style={styles.rdvService}>{rdv.service}</Text>
      </View>
      <View style={[styles.rdvDot, { backgroundColor: rdv.status === 'planifie' ? colors.blue : colors.green }]} />
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([getClients(), getRdvs()]);
    setClients(c);
    setRdvs(r);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const now = new Date();
  const today = now.toDateString();
  const rdvAujourdhui = rdvs.filter((r) => new Date(r.date).toDateString() === today && r.status === 'planifie');
  const rdvProchains = rdvs
    .filter((r) => new Date(r.date) >= now && r.status === 'planifie')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>⬡ Synapse</Text>
          <Text style={styles.date}>{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>

        {!FIREBASE_CONFIGURED && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              ⚡ Configure Firebase pour recevoir les demandes du site en temps réel
            </Text>
          </View>
        )}

        <Text style={styles.section}>Vue d'ensemble</Text>
        <View style={styles.statsRow}>
          <StatCard label="Clients" value={clients.length} color={colors.purple} />
          <StatCard label="RDV aujourd'hui" value={rdvAujourdhui.length} color={colors.cyan} />
          <StatCard
            label="RDV à venir"
            value={rdvs.filter((r) => new Date(r.date) >= now && r.status === 'planifie').length}
            color={colors.blue}
          />
        </View>

        <Text style={styles.section}>Prochains rendez-vous</Text>
        {rdvProchains.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun rendez-vous à venir</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('Rendez-vous', { screen: 'AddAppointment' })}
            >
              <Text style={styles.emptyBtnText}>+ Ajouter un RDV</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rdvProchains.map((r) => (
            <RdvItem key={r.id} rdv={r} onPress={() => navigation.navigate('Rendez-vous')} />
          ))
        )}

        <View style={styles.quickActions}>
          <Text style={styles.section}>Actions rapides</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.action}
              onPress={() => navigation.navigate('Clients', { screen: 'AddClient' })}
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionLabel}>Nouveau client</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.action}
              onPress={() => navigation.navigate('Rendez-vous', { screen: 'AddAppointment' })}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionLabel}>Nouveau RDV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.action}
              onPress={() => navigation.navigate('Demandes')}
            >
              <Text style={styles.actionIcon}>📩</Text>
              <Text style={styles.actionLabel}>Voir les demandes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  logo: { fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: 1 },
  date: { fontSize: 13, color: colors.gray, marginTop: 2, textTransform: 'capitalize' },
  banner: {
    backgroundColor: 'rgba(0, 224, 209, 0.1)',
    borderWidth: 1, borderColor: colors.cyan,
    borderRadius: 10, padding: 12, marginBottom: 20,
  },
  bannerText: { color: colors.cyan, fontSize: 12, lineHeight: 18 },
  section: { fontSize: 13, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 12,
    padding: 14, borderLeftWidth: 3,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.gray, marginTop: 2 },
  statSub: { fontSize: 10, color: colors.grayDark, marginTop: 2 },
  rdvItem: {
    backgroundColor: colors.bgCard, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  rdvTime: { width: 68, marginRight: 12 },
  rdvHeure: { fontSize: 18, fontWeight: '700', color: colors.white },
  rdvDay: { fontSize: 11, color: colors.gray, marginTop: 2, textTransform: 'capitalize' },
  rdvInfo: { flex: 1 },
  rdvClient: { fontSize: 15, fontWeight: '600', color: colors.white },
  rdvService: { fontSize: 12, color: colors.gray, marginTop: 2 },
  rdvDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 8 },
  emptyText: { color: colors.gray, fontSize: 14, marginBottom: 12 },
  emptyBtn: { backgroundColor: colors.purpleFade, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.purple },
  emptyBtnText: { color: colors.purple, fontWeight: '600', fontSize: 13 },
  quickActions: { marginTop: 8 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  action: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 12,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, color: colors.gray, textAlign: 'center', fontWeight: '600' },
});
