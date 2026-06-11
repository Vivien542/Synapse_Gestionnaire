import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, STATUS_COLORS } from '../theme/colors';
import { getClients, getRdvs } from '../services/storage';

function InfoRow({ icon, label, value, onPress }) {
  if (!value) return null;
  return (
    <TouchableOpacity style={styles.infoRow} onPress={onPress} disabled={!onPress}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && { color: colors.blue }]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

function RdvChip({ rdv }) {
  const date = new Date(rdv.date);
  return (
    <View style={[styles.rdvChip, { borderLeftColor: STATUS_COLORS[rdv.status] }]}>
      <Text style={styles.rdvChipDate}>
        {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {rdv.heure}
      </Text>
      <Text style={styles.rdvChipService}>{rdv.service}</Text>
      <View style={[styles.rdvChipStatus, { backgroundColor: STATUS_COLORS[rdv.status] + '22' }]}>
        <Text style={[styles.rdvChipStatusText, { color: STATUS_COLORS[rdv.status] }]}>{rdv.status}</Text>
      </View>
    </View>
  );
}

export default function ClientDetailScreen({ route, navigation }) {
  const { clientId } = route.params;
  const [client, setClient] = useState(null);
  const [rdvs, setRdvs] = useState([]);

  useFocusEffect(useCallback(() => {
    getClients().then((cs) => setClient(cs.find((c) => c.id === clientId)));
    getRdvs().then((rs) => setRdvs(rs.filter((r) => r.clientId === clientId)));
  }, [clientId]));

  if (!client) return null;

  const initials = client.nom.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Clients</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AddClient', { client })}>
          <Text style={styles.edit}>Modifier</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{client.nom}</Text>
          <Text style={styles.since}>
            Client depuis {new Date(client.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <View style={styles.card}>
          <InfoRow
            icon="✉️" label="Email" value={client.email}
            onPress={client.email ? () => Linking.openURL(`mailto:${client.email}`) : null}
          />
          <InfoRow
            icon="📞" label="Téléphone" value={client.tel}
            onPress={client.tel ? () => Linking.openURL(`tel:${client.tel}`) : null}
          />
          <InfoRow icon="📍" label="Adresse" value={client.adresse} />
        </View>

        {client.note ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Notes</Text>
            <Text style={styles.noteText}>{client.note}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rendez-vous ({rdvs.length})</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Rendez-vous', {
              screen: 'AddAppointment',
              params: { clientId: client.id, clientNom: client.nom },
            })}
          >
            <Text style={styles.sectionAdd}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {rdvs.length === 0 ? (
          <View style={styles.emptyRdv}>
            <Text style={styles.emptyRdvText}>Aucun rendez-vous pour ce client</Text>
          </View>
        ) : (
          rdvs
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((r) => <RdvChip key={r.id} rdv={r} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: colors.purple, fontSize: 16, fontWeight: '600' },
  edit: { color: colors.blue, fontSize: 15, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.purpleFade, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 2, borderColor: colors.purple,
  },
  avatarText: { color: colors.purple, fontWeight: '800', fontSize: 26 },
  name: { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 4 },
  since: { fontSize: 12, color: colors.gray },
  card: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  infoIcon: { fontSize: 18 },
  infoLabel: { fontSize: 11, color: colors.gray },
  infoValue: { fontSize: 15, color: colors.white, fontWeight: '500', marginTop: 2 },
  noteCard: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  noteTitle: { fontSize: 12, color: colors.gray, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  noteText: { fontSize: 14, color: colors.white, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionAdd: { color: colors.purple, fontWeight: '600', fontSize: 14 },
  rdvChip: {
    backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 8,
    borderLeftWidth: 3, borderWidth: 1, borderTopColor: colors.border, borderRightColor: colors.border, borderBottomColor: colors.border,
  },
  rdvChipDate: { fontSize: 14, fontWeight: '700', color: colors.white, marginBottom: 2 },
  rdvChipService: { fontSize: 13, color: colors.gray, marginBottom: 8 },
  rdvChipStatus: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rdvChipStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  emptyRdv: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyRdvText: { color: colors.gray, fontSize: 14 },
});
