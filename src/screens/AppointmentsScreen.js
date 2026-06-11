import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, STATUS_COLORS } from '../theme/colors';
import { getRdvs, saveRdv, deleteRdv } from '../services/storage';

const FILTERS = ['tous', 'planifie', 'termine', 'annule'];
const FILTER_LABELS = { tous: 'Tous', planifie: 'Planifiés', termine: 'Terminés', annule: 'Annulés' };

function RdvCard({ rdv, onStatusChange, onDelete }) {
  const date = new Date(rdv.date);
  const isPast = date < new Date();
  return (
    <View style={[styles.card, isPast && rdv.status === 'planifie' && styles.cardLate]}>
      <View style={styles.cardTop}>
        <View style={styles.cardDateBox}>
          <Text style={styles.cardDay}>{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</Text>
          <Text style={styles.cardDayNum}>{date.getDate()}</Text>
          <Text style={styles.cardMonth}>{date.toLocaleDateString('fr-FR', { month: 'short' })}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardClient}>{rdv.clientNom}</Text>
          <Text style={styles.cardService}>{rdv.service}</Text>
          <Text style={styles.cardHeure}>🕐 {rdv.heure}{rdv.duree ? ` · ${rdv.duree} min` : ''}</Text>
          {rdv.note ? <Text style={styles.cardNote}>{rdv.note}</Text> : null}
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[rdv.status] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[rdv.status] }]}>{rdv.status}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {rdv.status === 'planifie' && (
          <>
            <TouchableOpacity style={styles.actionGreen} onPress={() => onStatusChange(rdv, 'termine')}>
              <Text style={styles.actionGreenText}>✓ Terminé</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionGray} onPress={() => onStatusChange(rdv, 'annule')}>
              <Text style={styles.actionGrayText}>Annuler</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.actionRed} onPress={() => onDelete(rdv)}>
          <Text style={styles.actionRedText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AppointmentsScreen({ navigation }) {
  const [rdvs, setRdvs] = useState([]);
  const [filter, setFilter] = useState('planifie');

  useFocusEffect(useCallback(() => {
    getRdvs().then(setRdvs);
  }, []));

  const handleStatus = async (rdv, status) => {
    const updated = { ...rdv, status };
    await saveRdv(updated);
    setRdvs((prev) => prev.map((r) => (r.id === rdv.id ? updated : r)));
  };

  const handleDelete = (rdv) => {
    Alert.alert('Supprimer ce RDV ?', `${rdv.clientNom} — ${new Date(rdv.date).toLocaleDateString('fr-FR')}`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteRdv(rdv.id);
          setRdvs((prev) => prev.filter((r) => r.id !== rdv.id));
        },
      },
    ]);
  };

  const filtered = rdvs
    .filter((r) => filter === 'tous' || r.status === filter)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Rendez-vous</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddAppointment')}>
          <Text style={styles.addBtnText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filter, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RdvCard rdv={item} onStatusChange={handleStatus} onDelete={handleDelete} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Aucun rendez-vous {filter !== 'tous' ? FILTER_LABELS[filter].toLowerCase() : ''}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddAppointment')}>
              <Text style={styles.emptyBtnText}>Créer un rendez-vous</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.white },
  addBtn: { backgroundColor: colors.purple, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.purpleFade, borderColor: colors.purple },
  filterText: { fontSize: 12, color: colors.gray, fontWeight: '600' },
  filterTextActive: { color: colors.purple },
  list: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  cardLate: { borderColor: colors.orange + '60' },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardDateBox: { alignItems: 'center', width: 44 },
  cardDay: { fontSize: 11, color: colors.gray, textTransform: 'capitalize' },
  cardDayNum: { fontSize: 24, fontWeight: '800', color: colors.white, lineHeight: 28 },
  cardMonth: { fontSize: 11, color: colors.gray, textTransform: 'capitalize' },
  cardBody: { flex: 1 },
  cardClient: { fontSize: 16, fontWeight: '700', color: colors.white },
  cardService: { fontSize: 13, color: colors.gray, marginTop: 2 },
  cardHeure: { fontSize: 12, color: colors.blue, marginTop: 4 },
  cardNote: { fontSize: 12, color: colors.grayDark, marginTop: 4, fontStyle: 'italic' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionGreen: { flex: 1, backgroundColor: 'rgba(0, 196, 140, 0.15)', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.green },
  actionGreenText: { color: colors.green, fontWeight: '700', fontSize: 13 },
  actionGray: { flex: 1, backgroundColor: colors.bgInput, borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionGrayText: { color: colors.gray, fontWeight: '600', fontSize: 13 },
  actionRed: { backgroundColor: 'rgba(255,71,87,0.1)', borderRadius: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.red },
  actionRedText: { fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.gray, fontSize: 16, marginBottom: 16 },
  emptyBtn: { backgroundColor: colors.purple, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: colors.white, fontWeight: '700' },
});
