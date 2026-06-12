import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, STATUS_COLORS } from '../theme/colors';
import { updateDemandeStatus } from '../services/firebase';
import { saveDemandeLocal, getClients, saveClient, addHistorique } from '../services/storage';
import { FIREBASE_CONFIGURED } from '../../firebase.config';

// Retrouve un client déjà enregistré correspondant à la demande (email puis nom)
async function findClient(demande) {
  const clients = await getClients();
  return clients.find((c) =>
    (demande.email && c.email && c.email.toLowerCase() === demande.email.toLowerCase()) ||
    c.nom.toLowerCase() === demande.nom.toLowerCase()
  ) || null;
}

// Recherche ou création d'un client à partir d'une demande acceptée.
async function findOrCreateClient(demande) {
  const match = await findClient(demande);

  if (match) {
    // Complète email/tel si manquants, sans toucher au reste
    if ((!match.email && demande.email) || (!match.tel && demande.tel)) {
      const updated = {
        ...match,
        email: match.email || demande.email || '',
        tel: match.tel || demande.tel || '',
        updatedAt: new Date().toISOString(),
      };
      await saveClient(updated);
      return { client: updated, isNew: false };
    }
    return { client: match, isNew: false };
  }

  // Nouveau client → création automatique avec un premier événement d'historique
  const newClient = {
    id: `client_${Date.now()}`,
    nom: demande.nom,
    email: demande.email || '',
    tel: demande.tel || '',
    adresse: '',
    note: '',
    historique: [{
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'client_cree',
      date: new Date().toISOString(),
      label: 'Fiche client créée',
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveClient(newClient);
  return { client: newClient, isNew: true };
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function DemandeDetailScreen({ route, navigation }) {
  const { demandeId, demande: initialDemande } = route.params;
  const [demande, setDemande] = useState(initialDemande);
  const [linkedClient, setLinkedClient] = useState(null);

  const date = demande.createdAt?.toDate
    ? demande.createdAt.toDate()
    : new Date(demande.createdAt || Date.now());

  const updateStatus = async (status) => {
    const updated = { ...demande, status };
    if (FIREBASE_CONFIGURED) {
      await updateDemandeStatus(demandeId, status);
    } else {
      await saveDemandeLocal(updated);
    }
    setDemande(updated);
  };

  const handleAccept = () => {
    Alert.alert('Accepter cette demande ?', 'Le statut passera à « acceptée » et le client sera créé ou retrouvé automatiquement.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Accepter',
        onPress: async () => {
          await updateStatus('acceptee');
          const { client, isNew } = await findOrCreateClient(demande);
          await addHistorique(client.id, {
            type: 'demande_acceptee',
            label: `Demande de devis acceptée — ${demande.service}`,
            data: {
              service: demande.service,
              appareil: demande.appareil || '',
              message: demande.message || '',
              recuLe: date.toISOString(),
            },
          });
          setLinkedClient(client);

          Alert.alert(
            isNew ? '✓ Client créé' : '✓ Demande acceptée',
            isNew
              ? `${client.nom} a été ajouté à tes clients.`
              : `${client.nom} était déjà client. La demande a été ajoutée à son historique.`,
            [{ text: 'OK' }]
          );
        },
      },
    ]);
  };

  const handleRefuse = () => {
    Alert.alert('Refuser cette demande ?', 'Le statut passera à « refusée ». Aucune fiche client ne sera créée.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser', style: 'destructive',
        onPress: async () => {
          await updateStatus('refusee');
          // Si un client existe déjà, on trace le refus dans son historique.
          const existing = await findClient(demande);
          if (existing) {
            await addHistorique(existing.id, {
              type: 'demande_refusee',
              label: `Demande de devis refusée — ${demande.service}`,
              data: { service: demande.service },
            });
          }
        },
      },
    ]);
  };

  React.useEffect(() => {
    if (demande.status === 'nouvelle') {
      updateStatus('lue');
    }
    // Demande déjà acceptée : on retrouve la fiche client pour les actions de suite.
    if (demande.status === 'acceptee') {
      findClient(demande).then((c) => c && setLinkedClient(c));
    }
  }, []);

  const goToCreateDevis = () => {
    navigation.navigate('Devis', {
      screen: 'CreateDevis',
      params: {
        clientId: linkedClient?.id,
        clientNom: linkedClient?.nom || demande.nom,
        demandeId,
        service: demande.service,
      },
    });
  };

  const goToCreateRdv = () => {
    navigation.navigate('Rendez-vous', {
      screen: 'AddAppointment',
      params: {
        clientId: linkedClient?.id,
        clientNom: linkedClient?.nom || demande.nom,
        service: demande.service,
        note: demande.appareil ? `Appareil : ${demande.appareil}` : '',
      },
    });
  };

  const goToClient = () => {
    if (!linkedClient?.id) return;
    navigation.navigate('Clients', { screen: 'ClientDetail', params: { clientId: linkedClient.id } });
  };

  const enAttente = demande.status !== 'acceptee' && demande.status !== 'refusee';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Demandes</Text>
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[demande.status] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[demande.status] }]}>{demande.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <Text style={styles.nom}>{demande.nom}</Text>
          <Text style={styles.dateText}>
            Reçue le {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.contactBtns}>
            {demande.email ? (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(`mailto:${demande.email}?subject=Votre demande de devis — ${demande.service}`)}
              >
                <Text style={styles.contactBtnText}>✉️ Répondre par email</Text>
              </TouchableOpacity>
            ) : null}
            {demande.tel ? (
              <TouchableOpacity
                style={[styles.contactBtn, { borderColor: colors.green }]}
                onPress={() => Linking.openURL(`tel:${demande.tel}`)}
              >
                <Text style={[styles.contactBtnText, { color: colors.green }]}>📞 Appeler</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>
          <InfoRow label="Service" value={demande.service} />
          <InfoRow label="Appareil" value={demande.appareil} />
          <InfoRow label="Email" value={demande.email} />
          <InfoRow label="Téléphone" value={demande.tel} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Message</Text>
          <Text style={styles.message}>{demande.message}</Text>
        </View>

        {enAttente && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Text style={styles.acceptBtnText}>✓ Accepter la demande</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refuseBtn} onPress={handleRefuse}>
              <Text style={styles.refuseBtnText}>✗ Refuser</Text>
            </TouchableOpacity>
          </View>
        )}

        {demande.status === 'acceptee' && (
          <View style={styles.postAcceptActions}>
            <TouchableOpacity style={styles.devisBtn} onPress={goToCreateDevis}>
              <Text style={styles.devisBtnText}>🧾 Créer un devis</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rdvBtn} onPress={goToCreateRdv}>
              <Text style={styles.rdvBtnText}>📅 Créer un rendez-vous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clientBtn} onPress={goToClient}>
              <Text style={styles.clientBtnText}>👤 Voir la fiche client</Text>
            </TouchableOpacity>
          </View>
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
  postAcceptActions: { gap: 10 },
  devisBtn: { backgroundColor: 'rgba(0,224,209,0.12)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.cyan },
  devisBtnText: { color: colors.cyan, fontWeight: '700', fontSize: 15 },
  rdvBtn: { backgroundColor: colors.purpleFade, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.purple },
  rdvBtnText: { color: colors.purple, fontWeight: '700', fontSize: 15 },
  clientBtn: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  clientBtnText: { color: colors.gray, fontWeight: '600', fontSize: 14 },
});
