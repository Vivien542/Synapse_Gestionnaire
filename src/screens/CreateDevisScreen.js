import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { getClients, saveDevis, addHistorique } from '../services/storage';

// Accepte virgule ou point comme séparateur décimal
function parsePrix(v) {
  return parseFloat(String(v ?? '').replace(',', '.')) || 0;
}

export function formatEuro(n) {
  return `${(n || 0).toFixed(2).replace('.', ',')} €`;
}

function newLigne(label = '', prix = '') {
  return { id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, label, prix };
}

export default function CreateDevisScreen({ route, navigation }) {
  const editDevis = route.params?.devis;
  const isEdit = !!editDevis;

  const prefillClientId = route.params?.clientId;
  const prefillClientNom = route.params?.clientNom;
  const prefillService = route.params?.service;
  const demandeId = route.params?.demandeId ?? editDevis?.demandeId ?? null;

  // Client verrouillé si on vient d'une demande / fiche client, ou en édition
  const clientLocked = isEdit || !!prefillClientId;

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(editDevis?.clientId || prefillClientId || '');
  const [clientNom, setClientNom] = useState(editDevis?.clientNom || prefillClientNom || '');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [lignes, setLignes] = useState(
    isEdit
      ? editDevis.lignes.map((l) => newLigne(l.label, String(l.prix ?? '')))
      : [newLigne(prefillService || '')]
  );
  const [note, setNote] = useState(editDevis?.note || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!clientLocked) getClients().then(setClients);
  }, [clientLocked]);

  const total = lignes.reduce((sum, l) => sum + parsePrix(l.prix), 0);

  const updateLigne = (id, field, value) => {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };
  const addLigne = () => setLignes((prev) => [...prev, newLigne()]);
  const removeLigne = (id) => setLignes((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

  const handleSave = async (statut) => {
    if (!clientId) { Alert.alert('Champ requis', 'Sélectionne un client'); return; }
    const lignesValides = lignes
      .map((l) => ({ id: l.id, label: l.label.trim(), prix: parsePrix(l.prix) }))
      .filter((l) => l.label || l.prix > 0);
    if (lignesValides.length === 0) { Alert.alert('Champ requis', 'Ajoute au moins une ligne de prestation'); return; }

    setSaving(true);
    const now = new Date().toISOString();
    const devis = {
      id: editDevis?.id || `devis_${Date.now()}`,
      clientId,
      clientNom,
      demandeId,
      lignes: lignesValides,
      statut,
      note: note.trim(),
      createdAt: editDevis?.createdAt || now,
    };
    const saved = await saveDevis(devis);

    // Historique client
    if (!isEdit) {
      await addHistorique(clientId, {
        type: 'devis_cree',
        label: `Devis créé — ${formatEuro(saved.total)}`,
        data: { devisId: saved.id, total: saved.total },
      });
      if (statut === 'envoye') {
        await addHistorique(clientId, {
          type: 'devis_envoye',
          label: `Devis envoyé — ${formatEuro(saved.total)}`,
          data: { devisId: saved.id, total: saved.total },
        });
      }
    } else if (statut === 'envoye' && editDevis.statut !== 'envoye') {
      await addHistorique(clientId, {
        type: 'devis_envoye',
        label: `Devis envoyé — ${formatEuro(saved.total)}`,
        data: { devisId: saved.id, total: saved.total },
      });
    }

    setSaving(false);
    if (isEdit) navigation.goBack();
    else navigation.replace('DevisDetail', { devisId: saved.id });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Modifier le devis' : 'Nouveau devis'}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Client */}
          <View style={styles.field}>
            <Text style={styles.label}>Client <Text style={{ color: colors.purple }}>*</Text></Text>
            {clientLocked ? (
              <View style={[styles.picker, styles.pickerLocked]}>
                <Text style={styles.pickerValue}>{clientNom}</Text>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.picker} onPress={() => setShowClientPicker(!showClientPicker)}>
                  <Text style={clientId ? styles.pickerValue : styles.pickerPlaceholder}>
                    {clientNom || 'Sélectionner un client…'}
                  </Text>
                  <Text style={styles.pickerArrow}>{showClientPicker ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showClientPicker && (
                  <View style={styles.pickerDropdown}>
                    {clients.length === 0 ? (
                      <Text style={styles.pickerEmpty}>Aucun client — crée-en un d'abord</Text>
                    ) : (
                      clients.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.pickerOption}
                          onPress={() => { setClientId(c.id); setClientNom(c.nom); setShowClientPicker(false); }}
                        >
                          <Text style={[styles.pickerOptionText, c.id === clientId && { color: colors.purple }]}>{c.nom}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Lignes */}
          <View style={styles.field}>
            <Text style={styles.label}>Prestations <Text style={{ color: colors.purple }}>*</Text></Text>
            <View style={styles.lignesHeader}>
              <Text style={[styles.lignesHeaderText, { flex: 1 }]}>Désignation</Text>
              <Text style={[styles.lignesHeaderText, { width: 90, textAlign: 'right' }]}>Prix €</Text>
              <View style={{ width: 32 }} />
            </View>
            {lignes.map((l) => (
              <View key={l.id} style={styles.ligneRow}>
                <TextInput
                  style={[styles.input, styles.ligneLabel]}
                  value={l.label}
                  onChangeText={(v) => updateLigne(l.id, 'label', v)}
                  placeholder="ex : Remplacement écran"
                  placeholderTextColor={colors.grayDark}
                />
                <TextInput
                  style={[styles.input, styles.lignePrix]}
                  value={l.prix}
                  onChangeText={(v) => updateLigne(l.id, 'prix', v)}
                  placeholder="0"
                  placeholderTextColor={colors.grayDark}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeLigne(l.id)} disabled={lignes.length === 1}>
                  <Text style={[styles.removeBtnText, lignes.length === 1 && { opacity: 0.3 }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addLigneBtn} onPress={addLigne}>
              <Text style={styles.addLigneText}>+ Ajouter une ligne</Text>
            </TouchableOpacity>
          </View>

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatEuro(total)}</Text>
          </View>

          {/* Note */}
          <View style={styles.field}>
            <Text style={styles.label}>Note interne</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
              value={note}
              onChangeText={setNote}
              placeholder="Remarque facultative sur ce devis…"
              placeholderTextColor={colors.grayDark}
              multiline
            />
          </View>

          {/* Actions */}
          {isEdit ? (
            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
              onPress={() => handleSave(editDevis.statut)}
              disabled={saving}
            >
              <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : '✓ Enregistrer les modifications'}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
                onPress={() => handleSave('envoye')}
                disabled={saving}
              >
                <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement…' : '✓ Enregistrer et marquer envoyé'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, saving && { opacity: 0.6 }]}
                onPress={() => handleSave('brouillon')}
                disabled={saving}
              >
                <Text style={styles.secondaryBtnText}>Enregistrer en brouillon</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: colors.purple, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: colors.white },
  scroll: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, color: colors.gray, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, color: colors.white, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  picker: { backgroundColor: colors.bgCard, borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  pickerLocked: { opacity: 0.85 },
  lockIcon: { fontSize: 13 },
  pickerValue: { color: colors.white, fontSize: 15 },
  pickerPlaceholder: { color: colors.grayDark, fontSize: 15 },
  pickerArrow: { color: colors.gray, fontSize: 12 },
  pickerDropdown: { backgroundColor: colors.bgInput, borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  pickerOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerOptionText: { color: colors.white, fontSize: 14 },
  pickerEmpty: { padding: 14, color: colors.gray, fontStyle: 'italic' },
  lignesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingHorizontal: 2 },
  lignesHeaderText: { fontSize: 11, color: colors.grayDark, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  ligneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ligneLabel: { flex: 1 },
  lignePrix: { width: 90, textAlign: 'right' },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: colors.red, fontSize: 16, fontWeight: '700' },
  addLigneBtn: { borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 2 },
  addLigneText: { color: colors.purple, fontWeight: '600', fontSize: 14 },
  totalCard: { backgroundColor: colors.purpleFade, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.purple, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: colors.gray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 24, fontWeight: '800', color: colors.white },
  primaryBtn: { backgroundColor: colors.purple, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  secondaryBtn: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: colors.border },
  secondaryBtnText: { color: colors.gray, fontWeight: '600', fontSize: 15 },
});
