import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { getClients, saveRdv, addHistorique } from '../services/storage';
import { Calendar, TimeSlots, startOfDay } from '../components/DateTimePicker';

const SERVICES = [
  'Réparation téléphone',
  'Réparation ordinateur',
  'Optimisation PC',
  'Réparation enceinte',
  'Autre',
];

const DUREES = [
  { label: '30 min', value: '30' },
  { label: '1 h', value: '60' },
  { label: '1 h 30', value: '90' },
  { label: '2 h', value: '120' },
];

function formatDateLong(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function AddAppointmentScreen({ route, navigation }) {
  const prefillClientId = route.params?.clientId;
  const prefillClientNom = route.params?.clientNom;
  const prefillService = route.params?.service;
  const prefillNote = route.params?.note;

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(prefillClientId || '');
  const [clientNom, setClientNom] = useState(prefillClientNom || '');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [service, setService] = useState(prefillService || '');
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [heure, setHeure] = useState('');
  const [duree, setDuree] = useState('60');
  const [note, setNote] = useState(prefillNote || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClients().then(setClients);
  }, []);

  const handleSave = async () => {
    if (!clientId) { Alert.alert('Champ requis', 'Sélectionne un client'); return; }
    if (!service) { Alert.alert('Champ requis', 'Choisis un service'); return; }
    if (!selectedDate) { Alert.alert('Champ requis', 'Choisis une date'); return; }
    if (!heure) { Alert.alert('Champ requis', 'Choisis une heure'); return; }

    const [h, m] = heure.split(':');
    const dateObj = new Date(selectedDate);
    dateObj.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

    setSaving(true);
    const rdv = {
      id: `rdv_${Date.now()}`,
      clientId,
      clientNom,
      service,
      date: dateObj.toISOString(),
      heure,
      duree: parseInt(duree) || 60,
      note: note.trim(),
      status: 'planifie',
      createdAt: new Date().toISOString(),
    };
    await saveRdv(rdv);

    // Trace le RDV dans l'historique du client concerné
    if (clientId) {
      await addHistorique(clientId, {
        type: 'rdv_cree',
        label: `Rendez-vous planifié — ${formatDateLong(selectedDate)} à ${heure}`,
        data: { rdvId: rdv.id, service, date: rdv.date, heure },
      });
    }

    setSaving(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nouveau RDV</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Client picker */}
          <View style={styles.field}>
            <Text style={styles.label}>Client <Text style={{ color: colors.purple }}>*</Text></Text>
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
          </View>

          {/* Service picker */}
          <View style={styles.field}>
            <Text style={styles.label}>Service <Text style={{ color: colors.purple }}>*</Text></Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowServicePicker(!showServicePicker)}>
              <Text style={service ? styles.pickerValue : styles.pickerPlaceholder}>
                {service || 'Choisir un service…'}
              </Text>
              <Text style={styles.pickerArrow}>{showServicePicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showServicePicker && (
              <View style={styles.pickerDropdown}>
                {(SERVICES.includes(service) || !service ? SERVICES : [service, ...SERVICES]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.pickerOption}
                    onPress={() => { setService(s); setShowServicePicker(false); }}
                  >
                    <Text style={[styles.pickerOptionText, s === service && { color: colors.purple }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date — calendrier */}
          <View style={styles.field}>
            <Text style={styles.label}>Date <Text style={{ color: colors.purple }}>*</Text></Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowCalendar(!showCalendar)}>
              <Text style={selectedDate ? styles.pickerValue : styles.pickerPlaceholder}>
                {selectedDate ? formatDateLong(selectedDate) : 'Choisir une date…'}
              </Text>
              <Text style={styles.pickerArrow}>{showCalendar ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showCalendar && (
              <View style={{ marginTop: 8 }}>
                <Calendar
                  value={selectedDate}
                  minDate={startOfDay(new Date())}
                  onSelect={(d) => { setSelectedDate(d); setShowCalendar(false); }}
                />
              </View>
            )}
          </View>

          {/* Heure — créneaux */}
          <View style={styles.field}>
            <Text style={styles.label}>Heure <Text style={{ color: colors.purple }}>*</Text></Text>
            <TimeSlots value={heure} onSelect={setHeure} />
          </View>

          {/* Durée — chips */}
          <View style={styles.field}>
            <Text style={styles.label}>Durée</Text>
            <View style={styles.dureeRow}>
              {DUREES.map((d) => {
                const active = d.value === duree;
                return (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.dureeChip, active && styles.dureeChipActive]}
                    onPress={() => setDuree(d.value)}
                  >
                    <Text style={[styles.dureeText, active && styles.dureeTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
              value={note}
              onChangeText={setNote}
              placeholder="Notes internes sur ce RDV…"
              placeholderTextColor={colors.grayDark}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Enregistrement…' : '✓ Créer le rendez-vous'}</Text>
          </TouchableOpacity>
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
  pickerValue: { color: colors.white, fontSize: 15 },
  pickerPlaceholder: { color: colors.grayDark, fontSize: 15 },
  pickerArrow: { color: colors.gray, fontSize: 12 },
  pickerDropdown: { backgroundColor: colors.bgInput, borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  pickerOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerOptionText: { color: colors.white, fontSize: 14 },
  pickerEmpty: { padding: 14, color: colors.gray, fontStyle: 'italic' },
  dureeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dureeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  dureeChipActive: { backgroundColor: colors.purpleFade, borderColor: colors.purple },
  dureeText: { color: colors.gray, fontSize: 14, fontWeight: '600' },
  dureeTextActive: { color: colors.purple, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.purple, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
