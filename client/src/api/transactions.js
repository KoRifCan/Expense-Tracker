import { db } from '../firebase/config';
import {
  collection, query, where, orderBy, getDocs,
  addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore';

const col = (uid) => collection(db, 'users', uid, 'transactions');

export const getAll = async (uid, { month, year } = {}) => {
  let q = query(col(uid), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));

  if (month && year) {
    const start = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(Number(year), Number(month), 0);
    const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    q = query(
      col(uid),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getSummary = async (uid, { month, year } = {}) => {
  const txns = await getAll(uid, { month, year });
  let totalIncome = 0, totalExpense = 0;
  const categoryMap = {};

  txns.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else {
      totalExpense += t.amount;
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    }
  });

  const categories = Object.entries(categoryMap).map(([category, total]) => ({ category, total }));

  return { totalIncome, totalExpense, balance: totalIncome - totalExpense, categories };
};

export const create = async (uid, data) => {
  const ref = await addDoc(col(uid), { ...data, createdAt: new Date().toISOString() });
  return ref.id;
};

export const update = async (uid, id, data) => {
  await updateDoc(doc(db, 'users', uid, 'transactions', id), data);
};

export const del = async (uid, id) => {
  await deleteDoc(doc(db, 'users', uid, 'transactions', id));
};
