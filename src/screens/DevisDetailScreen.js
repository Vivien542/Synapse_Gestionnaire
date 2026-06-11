import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, STATUS_COLORS } from '../theme/colors';
import { updateDevisStatus } from '../services/firebase';
import { saveDevisLocal } from '../services/storage';
import { FIREBASE_CONFIGURED } from '../../firebase.config';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function DevisDetailScreen({ route, navigation }) {
  const { devisId, devis: initialDevis } = route.params;
  const [devis, setDevis] = useState(initialDevis);

  const date = devis.createdAt?.toDate
    ? devis.createdAt.toDate()
    : new Date(devis.createdAt || Date.now());

  const updateStatus = async (status) => {
    const updated = { ...devis, status };
    if (FIREBASE_CONFIGURED) {
      await updateDevisStatus(devisId, status);
    } else {
      await saveDevisLocal(updated);
    }
    setDevis(updated);
  };

  const handleAccept = () => {
    Alert.alert('Accepter ce devis ?', 'Le statut sera mis à jour.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Accepter', onPress: () => updateStatus('accepte') },
    ]);
  };

  const handleRefuse = () => {
    Alert.alert('Refuser ce devis ?', 'Le statut sera mis à jour.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: () => updateStatus('refuse') },
    ]);
  };

  const handleMarkRead = () => {
    if (devis.status === 'nouveau') updateStatus('lu');
  };

  React.useEffect(() => {
    if (devis.status === 'nouveau') {
      updateStatus('lu');
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Devis</Text>
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[devis.status] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[devis.status] }]}>{devis.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <Text style={styles.nom}>{devis.nom}</Text>
          <Text style={styles.dateText}>
            Reçu le {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.contactBtns}>
            {devis.email ? (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(`mailto:${devis.email}?subject=Votre demande de devis — ${devis.service}`)}
              >
                <Text style={styles.contactBtnText}>✉️ Répondre par email</Text>
              </TouchableOpacity>
            ) : null}
            {devis.tel ? (
              <TouchableOpacity
                style={[styles.contactBtn, { borderColor: colors.green }]}
                onPress={() => Linking.openURL(`tel:${devis.tel}`)}
              >
                <Text style={[styles.contactBtnText, { color: colors.green }]}>📞 Appeler</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>
          <InfoRow label="Service" value={devis.service} />
          <InfoRow label="Appareil" value={devis.appareil} />
          <InfoRow label="Email" value={devis.email} />
          <InfoRow label="Téléphone" value={devis.tel} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Message</Text>
          <Text style={styles.message}>{devis.message}</Text>
        </View>

        {devis.status !== 'accepte' && devis.status !== 'refuse' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Text style={styles.acceptBtnText}>✓ Accepter ce devis</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refuseBtn} onPress={handleRefuse}>
              <Text style={styles.refuseBtnText}>✗ Refuser</Text>
            </TouchableOpacity>
          </View>
        )}

        {devis.status === 'accepte' && (
          <TouchableOpacity
            style={styles.rdvBtn}
            onPress={() => navigation.navigate('Rendez-vous', {
              screen: 'AddAppointment',
              params: { clientNom: devis.nom },
            })}
          >
            <Text style={styles.rdvBtnText}>📅 Créer un rendez-vous pour ce client</Text>
          </TouchableOpacity>
        )}
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
  nom: { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 4 },
  dateText: { fontSize: 12, color: colors.gray, marginBottom: 16, textTransform: 'capitalize' },
  contactBtns: { flexDirection: 'row', gap: 10 },
  contactBtn: { borderWidth: 1, borderColor: colors.blue, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  contactBtnText: { color: colors.blue, fontWeight: '600', fontSize: 13 },
  card: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 12, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 13, color: colors.gray },
  infoValue: { fontSize: 13, color: colors.white, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 12 },
  message: { fontSize: 15, color: colors.white, lineHeight: 22 },
  actions: { gap: 10, marginBottom: 12 },
  acceptBtn: { backgroundColor: 'rgba(0,196,140,0.15)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.green },
  acceptBtnText: { color: colors.green, fontWeight: '700', fontSize: 16 },
  refuseBtn: { backgroundColor: 'rgba(255,71,87,0.1)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.red },
  refuseBtnText: { color: colors.red, fontWeight: '600', fontSize: 15 },
  rdvBtn: { backgroundColor: colors.purpleFade, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.purple },
  rdvBtnText: { color: colors.purple, fontWeight: '700', fontSize: 15 },
});
