import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  clients: '@synapse_clients',
  rdv: '@synapse_rdv',
  devis: '@synapse_devis',
};

// ── CLIENTS ──────────────────────────────────────────────

export async function getClients() {
  const raw = await AsyncStorage.getItem(KEYS.clients);
  let clients = raw ? JSON.parse(raw) : [];

  // Migration douce : ancien champ `devisHistorique` → `historique`
  let migrated = false;
  clients = clients.map((c) => {
    if (!c.devisHistorique) return c;
    migrated = true;
    const events = (c.devisHistorique || []).map((d) => ({
      id: d.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'demande_acceptee',
      date: d.date || c.createdAt || new Date().toISOString(),
      label: `Demande de devis acceptée${d.service ? ` — ${d.service}` : ''}`,
      data: { service: d.service, appareil: d.appareil, message: d.message },
    }));
    const { devisHistorique, ...rest } = c;
    return { ...rest, historique: [...events, ...(c.historique || [])] };
  });
  if (migrated) await AsyncStorage.setItem(KEYS.clients, JSON.stringify(clients));

  return clients;
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
  // Supprime aussi les RDV et devis liés
  const rdvs = await getRdvs();
  await AsyncStorage.setItem(KEYS.rdv, JSON.stringify(rdvs.filter((r) => r.clientId !== id)));
  const devis = await getDevis();
  await AsyncStorage.setItem(KEYS.devis, JSON.stringify(devis.filter((d) => d.clientId !== id)));
}

// Historique général du client — point d'entrée unique pour TOUS les écrans.
// event : { type, label, data? } — id et date sont ajoutés ici.
export async function addHistorique(clientId, event) {
  if (!clientId) return;
  const clients = await getClients();
  const idx = clients.findIndex((c) => c.id === clientId);
  if (idx < 0) return;
  const fullEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    ...event,
  };
  const client = clients[idx];
  clients[idx] = {
    ...client,
    historique: [fullEvent, ...(client.historique || [])],
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEYS.clients, JSON.stringify(clients));
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

// ── DEVIS (créés dans l'app) ─────────────────────────────

export async function getDevis() {
  const raw = await AsyncStorage.getItem(KEYS.devis);
  return raw ? JSON.parse(raw) : [];
}

// Recalcule toujours le total à partir des lignes avant sauvegarde.
export async function saveDevis(devis) {
  const list = await getDevis();
  const total = (devis.lignes || []).reduce((sum, l) => sum + (parseFloat(l.prix) || 0), 0);
  const toSave = { ...devis, total, updatedAt: new Date().toISOString() };
  const idx = list.findIndex((d) => d.id === toSave.id);
  if (idx >= 0) list[idx] = toSave;
  else list.unshift(toSave);
  await AsyncStorage.setItem(KEYS.devis, JSON.stringify(list));
  return toSave;
}

export async function deleteDevis(id) {
  const list = await getDevis();
  await AsyncStorage.setItem(KEYS.devis, JSON.stringify(list.filter((d) => d.id !== id)));
}

// ── DEMANDES LOCALES (fallback si Firebase non configuré) ─

const DEMANDES_KEY = '@synapse_demandes_local';

export async function getDemandesLocal() {
  const raw = await AsyncStorage.getItem(DEMANDES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveDemandeLocal(demande) {
  const list = await getDemandesLocal();
  const idx = list.findIndex((d) => d.id === demande.id);
  if (idx >= 0) list[idx] = demande;
  else list.unshift(demande);
  await AsyncStorage.setItem(DEMANDES_KEY, JSON.stringify(list));
}
