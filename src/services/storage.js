import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  clients: '@synapse_clients',
  rdv: '@synapse_rdv',
};

// ── CLIENTS ──────────────────────────────────────────────

export async function getClients() {
  const raw = await AsyncStorage.getItem(KEYS.clients);
  return raw ? JSON.parse(raw) : [];
}

export async function saveClient(client) {
  const clients = await getClients();
  const idx = clients.findIndex((c) => c.id === client.id);
  if (idx >= 0) clients[idx] = client;
  else clients.unshift(client);
  await AsyncStorage.setItem(KEYS.clients, JSON.stringify(clients));
}

export async function deleteClient(id) {
  const clients = await getClients();
  await AsyncStorage.setItem(KEYS.clients, JSON.stringify(clients.filter((c) => c.id !== id)));
  // Supprime aussi les RDV liés
  const rdvs = await getRdvs();
  await AsyncStorage.setItem(KEYS.rdv, JSON.stringify(rdvs.filter((r) => r.clientId !== id)));
}

// ── RENDEZ-VOUS ──────────────────────────────────────────

export async function getRdvs() {
  const raw = await AsyncStorage.getItem(KEYS.rdv);
  return raw ? JSON.parse(raw) : [];
}

export async function saveRdv(rdv) {
  const rdvs = await getRdvs();
  const idx = rdvs.findIndex((r) => r.id === rdv.id);
  if (idx >= 0) rdvs[idx] = rdv;
  else rdvs.unshift(rdv);
  await AsyncStorage.setItem(KEYS.rdv, JSON.stringify(rdvs));
}

export async function deleteRdv(id) {
  const rdvs = await getRdvs();
  await AsyncStorage.setItem(KEYS.rdv, JSON.stringify(rdvs.filter((r) => r.id !== id)));
}

// ── DEVIS LOCAL (fallback si Firebase non configuré) ──────

const DEVIS_KEY = '@synapse_devis_local';

export async function getDevisLocal() {
  const raw = await AsyncStorage.getItem(DEVIS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveDevisLocal(devis) {
  const list = await getDevisLocal();
  const idx = list.findIndex((d) => d.id === devis.id);
  if (idx >= 0) list[idx] = devis;
  else list.unshift(devis);
  await AsyncStorage.setItem(DEVIS_KEY, JSON.stringify(list));
}
