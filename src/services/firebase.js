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

// Écoute en temps réel les devis envoyés depuis le site
export function subscribeToDevis(callback) {
  if (!db) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'devis'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const devis = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(devis);
  });
}

// Met à jour le statut d'un devis
export async function updateDevisStatus(id, status) {
  if (!db) return;
  await updateDoc(doc(db, 'devis', id), { status });
}

// Ajoute un devis manuellement (depuis l'app)
export async function addDevis(data) {
  if (!db) return;
  await addDoc(collection(db, 'devis'), { ...data, createdAt: serverTimestamp() });
}

export { db };
