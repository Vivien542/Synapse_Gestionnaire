import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseConfig, FIREBASE_CONFIGURED } from '../../firebase.config';

let db = null;

if (FIREBASE_CONFIGURED) {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
}

// Écoute en temps réel les demandes de devis envoyées depuis le site
export function subscribeToDemandes(callback) {
  if (!db) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'demandes'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const demandes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(demandes);
  });
}

// Met à jour le statut d'une demande
export async function updateDemandeStatus(id, status) {
  if (!db) return;
  await updateDoc(doc(db, 'demandes', id), { status });
}

// Ajoute une demande manuellement (depuis l'app)
export async function addDemande(data) {
  if (!db) return;
  await addDoc(collection(db, 'demandes'), { ...data, createdAt: serverTimestamp() });
}

export { db };
