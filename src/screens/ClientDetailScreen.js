import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, STATUS_COLORS } from '../theme/colors';
import { getClients, getRdvs, saveClient } from '../services/storage';

// Apparence de chaque type d'événement dans la timeline
const EVENT_META = {
  client_cree: { color: colors.purple, icon: '👤' },
  demande_acceptee: { color: colors.green, icon: '📩' },
  demande_refusee: { color: colors.red, icon: '📩' },
  devis_cree: { color: colors.blue, icon: '🧾' },
  devis_envoye: { color: colors.blue, icon: '📤' },
  devis_accepte: { color: colors.green, icon: '🧾' },
  devis_refuse: { color: colors.red, icon: '🧾' },
  rdv_cree: { color: colors.cyan, icon: '📅' },
};
const DEFAULT_META = { color: colors.gray, icon: '•' };

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

function TimelineItem({ event, isLast, onPress }) {
  const meta = EVENT_META[event.type] || DEFAULT_META;
  const date = new Date(event.date);
  const clickable = !!event.data?.devisId;
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlLeft}>
        <View style={[styles.tlDot, { backgroundColor: meta.color }]} />
        {!isLast && <View style={styles.tlLine} />}
      </View>
      <TouchableOpacity
        style={styles.tlContent}
        onPress={onPress}
        disabled={!clickable}
        activeOpacity={clickable ? 0.6 : 1}
      >
        <Text style={styles.tlLabel}>{meta.icon}  {event.label}</Text>
        <Text style={styles.tlDate}>
          {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        {clickable && <Text style={styles.tlLink}>Voir le devis ›</Text>}
      </TouchableOpacity>
    </View>
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
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useFocusEffect(useCallback(() => {
    getClients().then((cs) => setClient(cs.find((c) => c.id === clientId)));
    getRdvs().then((rs) => setRdvs(rs.filter((r) => r.clientId === clientId)));
  }, [clientId]));

  if (!client) return null;

  const initials = client.nom.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const historique = (client.historique || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  const startEditNote = () => { setNoteDraft(client.note || ''); setEditingNote(true); };

  const saveNote = async () => {
    setSavingNote(true);
    const updated = { ...client, note: noteDraft.trim(), updatedAt: new Date().toISOString() };
    await saveClient(updated);
    setClient(updated);
    setEditingNote(false);
    setSavingNote(false);
  };

  const openDevis = (devisId) =>
    navigation.navigate('Devis', { screen: 'DevisDetail', params: { devisId } });

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

        {/* Notes — éditables */}
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Text style={styles.noteTitle}>Notes</Text>
            {!editingNote && (
              <TouchableOpacity onPress={startEditNote}>
                <Text style={styles.noteEdit}>{client.note ? 'Modifier' : '+ Ajouter'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {editingNote ? (
            <>
              <TextInput
                style={styles.noteInput}
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder="ex : ne pas appeler le samedi…"
                placeholderTextColor={colors.grayDark}
                multiline
                autoFocus
              />
              <View style={styles.noteActions}>
                <TouchableOpacity style={styles.noteCancel} onPress={() => setEditingNote(false)}>
                  <Text style={styles.noteCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.noteSave, savingNote && { opacity: 0.6 }]} onPress={saveNote} disabled={savingNote}>
                  <Text style={styles.noteSaveText}>{savingNote ? '…' : 'Enregistrer'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={[styles.noteText, !client.note && styles.notePlaceholder]}>
              {client.note || 'Aucune note pour ce client'}
            </Text>
          )}
        </View>

        {/* Historique général */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historique</Text>
        </View>
        {historique.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxText}>Aucun événement pour l'instant</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {historique.map((e, i) => (
              <TimelineItem
                key={e.id}
                event={e}
                isLast={i === historique.length - 1}
                onPress={() => openDevis(e.data.devisId)}
              />
            ))}
          </View>
        )}

        {/* Rendez-vous */}
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
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxText}>Aucun rendez-vous pour ce client</Text>
          </View>
        ) : (
          rdvs
            .slice()
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
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteTitle: { fontSize: 12, color: colors.gray, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  noteEdit: { fontSize: 13, color: colors.purple, fontWeight: '600' },
  noteText: { fontSize: 14, color: colors.white, lineHeight: 20 },
  notePlaceholder: { color: colors.grayDark, fontStyle: 'italic' },
  noteInput: { backgroundColor: colors.bgInput, borderRadius: 10, padding: 12, color: colors.white, fontSize: 14, borderWidth: 1, borderColor: colors.border, minHeight: 72, textAlignVertical: 'top' },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  noteCancel: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  noteCancelText: { color: colors.gray, fontWeight: '600', fontSize: 13 },
  noteSave: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.purple },
  noteSaveText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionAdd: { color: colors.purple, fontWeight: '600', fontSize: 14 },
  timeline: { marginBottom: 16 },
  tlRow: { flexDirection: 'row' },
  tlLeft: { width: 24, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  tlLine: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 2 },
  tlContent: { flex: 1, paddingBottom: 18, paddingLeft: 8 },
  tlLabel: { fontSize: 14, color: colors.white, fontWeight: '600' },
  tlDate: { fontSize: 12, color: colors.gray, marginTop: 2 },
  tlLink: { fontSize: 12, color: colors.blue, fontWeight: '600', marginTop: 4 },
  emptyBox: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  emptyBoxText: { color: colors.gray, fontSize: 14 },
  rdvChip: {
    backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, marginBottom: 8,
    borderLeftWidth: 3, borderWidth: 1, borderTopColor: colors.border, borderRightColor: colors.border, borderBottomColor: colors.border,
  },
  rdvChipDate: { fontSize: 14, fontWeight: '700', color: colors.white, marginBottom: 2 },
  rdvChipService: { fontSize: 13, color: colors.gray, marginBottom: 8 },
  rdvChipStatus: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  rdvChipStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
