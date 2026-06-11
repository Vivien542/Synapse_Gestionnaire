import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { saveClient, getClients, deleteClient } from '../services/storage';

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, required }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required && <Text style={{ color: colors.purple }}> *</Text>}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.grayDark}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function AddClientScreen({ route, navigation }) {
  const existing = route.params?.client;
  const [nom, setNom] = useState(existing?.nom || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [tel, setTel] = useState(existing?.tel || '');
  const [adresse, setAdresse] = useState(existing?.adresse || '');
  const [note, setNote] = useState(existing?.note || '');
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Modifier le client' : 'Nouveau client' });
  }, [navigation, existing]);

  const handleSave = async () => {
    if (!nom.trim()) {
      Alert.alert('Champ requis', 'Le nom est obligatoire');
      return;
    }
    setSaving(true);
    const client = {
      id: existing?.id || `client_${Date.now()}`,
      nom: nom.trim(),
      email: email.trim(),
      tel: tel.trim(),
      adresse: adresse.trim(),
      note: note.trim(),
      devisHistorique: existing?.devisHistorique || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveClient(client);
    setSaving(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce client',
      `Supprimer ${nom} ? Ses rendez-vous seront aussi supprimés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            await deleteClient(existing.id);
            navigation.navigate('ClientsList');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{existing ? 'Modifier' : 'Nouveau client'}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Field label="Nom" value={nom} onChangeText={setNom} placeholder="Nom complet" required />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="email@exemple.com" keyboardType="email-address" />
          <Field label="Téléphone" value={tel} onChangeText={setTel} placeholder="06 xx xx xx xx" keyboardType="phone-pad" />
          <Field label="Adresse" value={adresse} onChangeText={setAdresse} placeholder="Adresse (optionnel)" />
          <Field label="Notes" value={note} onChangeText={setNote} placeholder="Notes internes sur ce client…" multiline />

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Enregistrement…' : '✓ Enregistrer'}</Text>
          </TouchableOpacity>

          {existing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Supprimer ce client</Text>
            </TouchableOpacity>
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
  input: {
    backgroundColor: colors.bgCard, borderRadius: 10, padding: 14,
    color: colors.white, fontSize: 15, borderWidth: 1, borderColor: colors.border,
  },
  inputMulti: { height: 100, paddingTop: 14 },
  saveBtn: {
    backgroundColor: colors.purple, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 12,
  },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  deleteBtn: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)', borderRadius: 12,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.red,
  },
  deleteBtnText: { color: colors.red, fontWeight: '600', fontSize: 15 },
});
