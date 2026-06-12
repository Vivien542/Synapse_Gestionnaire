import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, STATUS_COLORS } from '../theme/colors';
import { getDevis, getClients } from '../services/storage';

const FILTERS = ['tous', 'brouillon', 'envoye', 'accepte', 'refuse'];
const FILTER_LABELS = { tous: 'Tous', brouillon: 'Brouillons', envoye: 'Envoyés', accepte: 'Acceptés', refuse: 'Refusés' };

function formatEuro(n) {
  return `${(n || 0).toFixed(2).replace('.', ',')} €`;
}

function DevisCard({ devis, onPress }) {
  const date = new Date(devis.createdAt);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardClient}>{devis.clientNom}</Text>
        <Text style={styles.cardLignes}>
          {devis.lignes?.length || 0} ligne{(devis.lignes?.length || 0) > 1 ? 's' : ''} · {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardTotal}>{formatEuro(devis.total)}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[devis.statut] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[devis.statut] }]}>{devis.statut}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DevisListScreen({ navigation }) {
  const [devis, setDevis] = useState([]);
  const [filter, setFilter] = useState('tous');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => {
    getDevis().then((list) =>
      setDevis(list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    );
  }, []));

  const openPicker = async () => {
    setClients(await getClients());
    setSearch('');
    setPickerVisible(true);
  };

  const pickClient = (c) => {
    setPickerVisible(false);
    navigation.navigate('CreateDevis', { clientId: c.id, clientNom: c.nom });
  };

  const filtered = devis.filter((d) => filter === 'tous' || d.statut === filter);
  const clientsFiltres = clients.filter((c) => c.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Devis</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openPicker}>
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
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{FILTER_LABELS[f]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <DevisCard devis={item} onPress={() => navigation.navigate('DevisDetail', { devisId: item.id })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>Aucun devis</Text>
            <Text style={styles.emptyText}>Crée un devis depuis une demande acceptée ou avec le bouton « + ».</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openPicker}>
              <Text style={styles.emptyBtnText}>+ Créer un devis</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Sélecteur de client */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un client</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Text style={styles.modalClose}>Fermer</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un client…"
              placeholderTextColor={colors.grayDark}
              autoFocus
            />
            <FlatList
              data={clientsFiltres}
              keyExtractor={(c) => c.id}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.clientOption} onPress={() => pickClient(item)}>
                  <Text style={styles.clientOptionText}>{item.nom}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.modalEmpty}>Aucun client trouvé</Text>}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.white },
  addBtn: { backgroundColor: colors.purple, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  filter: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.purpleFade, borderColor: colors.purple },
  filterText: { fontSize: 11, color: colors.gray, fontWeight: '600' },
  filterTextActive: { color: colors.purple },
  list: { padding: 20, paddingTop: 4, paddingBottom: 40 },
  card: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  cardClient: { fontSize: 16, fontWeight: '700', color: colors.white },
  cardLignes: { fontSize: 12, color: colors.gray, marginTop: 3 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardTotal: { fontSize: 17, fontWeight: '800', color: colors.white },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyBtn: { backgroundColor: colors.purple, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: colors.white, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.white },
  modalClose: { color: colors.purple, fontWeight: '600', fontSize: 15 },
  searchInput: { backgroundColor: colors.bgInput, borderRadius: 10, padding: 12, color: colors.white, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  clientOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  clientOptionText: { color: colors.white, fontSize: 15 },
  modalEmpty: { color: colors.gray, fontStyle: 'italic', padding: 14, textAlign: 'center' },
});
