import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, STATUS_COLORS } from '../theme/colors';
import { subscribeToDevis } from '../services/firebase';
import { getDevisLocal } from '../services/storage';
import { FIREBASE_CONFIGURED } from '../../firebase.config';

const FILTERS = ['tous', 'nouveau', 'lu', 'accepte', 'refuse'];
const FILTER_LABELS = { tous: 'Tous', nouveau: 'Nouveaux', lu: 'Lus', accepte: 'Acceptés', refuse: 'Refusés' };

function DevisCard({ devis, onPress }) {
  const date = devis.createdAt?.toDate
    ? devis.createdAt.toDate()
    : new Date(devis.createdAt || Date.now());

  return (
    <TouchableOpacity style={[styles.card, devis.status === 'nouveau' && styles.cardNew]} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[devis.status] }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardNom}>{devis.nom}</Text>
          <Text style={styles.cardService}>{devis.service}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDate}>
            {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[devis.status] + '22' }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLORS[devis.status] }]}>{devis.status}</Text>
          </View>
        </View>
      </View>
      {devis.appareil ? <Text style={styles.cardAppareil}>📱 {devis.appareil}</Text> : null}
      <Text style={styles.cardMsg} numberOfLines={2}>{devis.message}</Text>
    </TouchableOpacity>
  );
}

export default function DevisScreen({ navigation }) {
  const [devis, setDevis] = useState([]);
  const [filter, setFilter] = useState('tous');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (FIREBASE_CONFIGURED) {
      const unsub = subscribeToDevis(setDevis);
      return unsub;
    } else {
      getDevisLocal().then(setDevis);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    if (!FIREBASE_CONFIGURED) {
      setRefreshing(true);
      const local = await getDevisLocal();
      setDevis(local);
      setRefreshing(false);
    }
  }, []);

  const nouveaux = devis.filter((d) => d.status === 'nouveau').length;
  const filtered = devis.filter((d) => filter === 'tous' || d.status === filter);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Devis</Text>
          {nouveaux > 0 && (
            <Text style={styles.subtitle}>{nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}</Text>
          )}
        </View>
        {!FIREBASE_CONFIGURED && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>⚡ Hors ligne</Text>
          </View>
        )}
      </View>

      {!FIREBASE_CONFIGURED && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Configure Firebase dans firebase.config.js pour recevoir les devis du site en temps réel.
          </Text>
        </View>
      )}

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filter, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {FILTER_LABELS[f]}
              {f === 'nouveau' && nouveaux > 0 ? ` (${nouveaux})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        refreshControl={
          !FIREBASE_CONFIGURED
            ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />
            : undefined
        }
        renderItem={({ item }) => (
          <DevisCard devis={item} onPress={() => navigation.navigate('DevisDetail', { devisId: item.id, devis: item })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📩</Text>
            <Text style={styles.emptyTitle}>Aucun devis</Text>
            <Text style={styles.emptyText}>
              {FIREBASE_CONFIGURED
                ? 'Les devis du site apparaîtront ici en temps réel'
                : 'Configure Firebase pour recevoir les devis automatiquement'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: 13, color: colors.cyan, marginTop: 2 },
  offlineBadge: { backgroundColor: colors.bgCard, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
  offlineText: { fontSize: 11, color: colors.gray, fontWeight: '600' },
  banner: { backgroundColor: 'rgba(0,224,209,0.08)', borderWidth: 1, borderColor: colors.cyan, borderRadius: 10, marginHorizontal: 20, padding: 12, marginBottom: 8 },
  bannerText: { color: colors.cyan, fontSize: 12, lineHeight: 18 },
  filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  filter: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.purpleFade, borderColor: colors.purple },
  filterText: { fontSize: 11, color: colors.gray, fontWeight: '600' },
  filterTextActive: { color: colors.purple },
  list: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  card: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardNew: { borderColor: colors.cyan + '60', backgroundColor: 'rgba(0,224,209,0.05)' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  cardNom: { fontSize: 16, fontWeight: '700', color: colors.white },
  cardService: { fontSize: 12, color: colors.gray, marginTop: 2 },
  cardMeta: { alignItems: 'flex-end', gap: 4 },
  cardDate: { fontSize: 11, color: colors.grayDark },
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardAppareil: { fontSize: 12, color: colors.blue, marginBottom: 6 },
  cardMsg: { fontSize: 13, color: colors.gray, lineHeight: 18 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 20 },
});
