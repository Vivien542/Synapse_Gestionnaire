import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { getClients } from '../services/storage';

function ClientRow({ client, onPress }) {
  const initials = client.nom.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{client.nom}</Text>
        <Text style={styles.meta}>{client.email || client.tel || 'Aucune info'}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ClientsScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => {
    getClients().then(setClients);
  }, []));

  const filtered = clients.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.tel || '').includes(search)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddClient')}>
          <Text style={styles.addBtnText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Rechercher un client…"
          placeholderTextColor={colors.grayDark}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ClientRow
            client={item}
            onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'Aucun résultat' : 'Aucun client encore'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddClient')}>
                <Text style={styles.emptyBtnText}>Ajouter votre premier client</Text>
              </TouchableOpacity>
            )}
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
  searchWrap: { paddingHorizontal: 20, marginBottom: 8 },
  search: {
    backgroundColor: colors.bgCard, borderRadius: 10, padding: 12,
    color: colors.white, fontSize: 14, borderWidth: 1, borderColor: colors.border,
  },
  list: { padding: 20, paddingTop: 4 },
  row: {
    backgroundColor: colors.bgCard, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.purpleFade, alignItems: 'center', justifyContent: 'center',
    marginRight: 12, borderWidth: 1, borderColor: colors.purple,
  },
  avatarText: { color: colors.purple, fontWeight: '700', fontSize: 15 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.white },
  meta: { fontSize: 12, color: colors.gray, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.grayDark },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: colors.gray, marginBottom: 16 },
  emptyBtn: { backgroundColor: colors.purple, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: colors.white, fontWeight: '700' },
});
