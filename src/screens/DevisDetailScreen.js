import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, STATUS_COLORS } from '../theme/colors';
import { getDevis, saveDevis, addHistorique } from '../services/storage';

function formatEuro(n) {
  return `${(n || 0).toFixed(2).replace('.', ',')} €`;
}

export default function DevisDetailScreen({ route, navigation }) {
  const { devisId } = route.params;
  const [devis, setDevis] = useState(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    getDevis().then((list) => {
      if (!active) return;
      const found = list.find((d) => d.id === devisId);
      if (found) setDevis(found);
      else navigation.goBack();
    });
    return () => { active = false; };
  }, [devisId]));

  if (!devis) return <SafeAreaView style={styles.safe} />;

  const date = new Date(devis.createdAt);

  const changeStatut = async (statut, type, label) => {
    const updated = await saveDevis({ ...devis, statut });
    setDevis(updated);
    await addHistorique(updated.clientId, {
      type,
      label: `${label} — ${formatEuro(updated.total)}`,
      data: { devisId: updated.id, total: updated.total },
    });
  };

  const confirmRefuse = () => {
    Alert.alert('Marquer ce devis comme refusé ?', 'Le client a décliné ce devis.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Refusé', style: 'destructive', onPress: () => changeStatut('refuse', 'devis_refuse', 'Devis refusé') },
    ]);
  };

  const createRdv = () => {
    navigation.navigate('Rendez-vous', {
      screen: 'AddAppointment',
      params: {
        clientId: devis.clientId,
        clientNom: devis.clientNom,
        service: devis.lignes?.[0]?.label || '',
        note: `Devis ${formatEuro(devis.total)}`,
      },
    });
  };

  const editable = devis.statut === 'brouillon' || devis.statut === 'envoye';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Devis</Text>
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[devis.statut] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[devis.statut] }]}>{devis.statut}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <Text style={styles.client}>{devis.clientNom}</Text>
          <Text style={styles.dateText}>
            Créé le {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Prestations</Text>
          {devis.lignes.map((l) => (
            <View key={l.id} style={styles.ligneRow}>
              <Text style={styles.ligneLabel}>{l.label || '—'}</Text>
              <Text style={styles.lignePrix}>{formatEuro(l.prix)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatEuro(devis.total)}</Text>
          </View>
        </View>

        {devis.note ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Note interne</Text>
            <Text style={styles.note}>{devis.note}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {editable && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('CreateDevis', { devis })}
            >
              <Text style={styles.editBtnText}>✎ Modifier</Text>
            </TouchableOpacity>
          )}

          {devis.statut === 'brouillon' && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => changeStatut('envoye', 'devis_envoye', 'Devis envoyé')}
            >
              <Text style={styles.primaryBtnText}>📤 Marquer comme envoyé</Text>
            </TouchableOpacity>
          )}

          {devis.statut === 'envoye' && (
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.acceptBtn, { flex: 1 }]}
                onPress={() => changeStatut('accepte', 'devis_accepte', 'Devis accepté')}
              >
                <Text style={styles.acceptBtnText}>✓ Accepté</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.refuseBtn, { flex: 1 }]} onPress={confirmRefuse}>
                <Text style={styles.refuseBtnText}>✗ Refusé</Text>
              </TouchableOpacity>
            </View>
          )}

          {devis.statut === 'accepte' && (
            <TouchableOpacity style={styles.rdvBtn} onPress={createRdv}>
              <Text style={styles.rdvBtnText}>📅 Créer un rendez-vous</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: colors.purple, fontSize: 16, fontWeight: '600' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  scroll: { padding: 20, paddingBottom: 40 },
  profileCard: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  client: { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 4 },
  dateText: { fontSize: 12, color: colors.gray, textTransform: 'capitalize' },
  card: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 12, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  ligneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  ligneLabel: { fontSize: 14, color: colors.white, flex: 1, marginRight: 12 },
  lignePrix: { fontSize: 14, color: colors.white, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 14, color: colors.gray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 22, fontWeight: '800', color: colors.white },
  note: { fontSize: 15, color: colors.white, lineHeight: 22 },
  actions: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  editBtn: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  editBtnText: { color: colors.gray, fontWeight: '600', fontSize: 15 },
  primaryBtn: { backgroundColor: colors.purpleFade, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.purple },
  primaryBtnText: { color: colors.purple, fontWeight: '700', fontSize: 15 },
  acceptBtn: { backgroundColor: 'rgba(0,196,140,0.15)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.green },
  acceptBtnText: { color: colors.green, fontWeight: '700', fontSize: 15 },
  refuseBtn: { backgroundColor: 'rgba(255,71,87,0.1)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.red },
  refuseBtnText: { color: colors.red, fontWeight: '700', fontSize: 15 },
  rdvBtn: { backgroundColor: colors.purpleFade, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.purple },
  rdvBtnText: { color: colors.purple, fontWeight: '700', fontSize: 15 },
});
