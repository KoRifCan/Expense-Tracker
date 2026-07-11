import { db } from '../firebase/config';
import { doc, setDoc, getDoc, getDocs, collection, writeBatch } from 'firebase/firestore';

export async function createUser(uid, { name, email }) {
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    role: 'user',
    createdAt: new Date().toISOString(),
  });
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function setUserRole(uid, role) {
  await setDoc(doc(db, 'users', uid), { role }, { merge: true });
}

export async function updatePhotoURL(uid, dataUrl) {
  await setDoc(doc(db, 'users', uid), { photoURL: dataUrl }, { merge: true });
}

export async function setUserDisabled(uid, disabled) {
  await setDoc(doc(db, 'users', uid), { disabled }, { merge: true });
}

export async function deleteOwnAccount(uid) {
  const batch = writeBatch(db);
  const txSnap = await getDocs(collection(db, 'users', uid, 'transactions'));
  txSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'users', uid));
  await batch.commit();
}
