import { db } from '../firebase/config';
import {
  collection, query, where, orderBy, getDocs,
  addDoc, updateDoc, deleteDoc, doc, writeBatch,
} from 'firebase/firestore';

const col = (uid) => collection(db, 'users', uid, 'transactions');

export const getAll = async (uid, { month, year } = {}) => {
  let constraints = [orderBy('date', 'desc')];

  if (month && year) {
    const start = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(Number(year), Number(month), 0);
    const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    constraints = [
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc'),
    ];
  }

  try {
    const snap = await getDocs(query(col(uid), ...constraints));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    if (err.code === 'failed-precondition') {
      return [];
    }
    throw err;
  }
};

export const getSummary = async (uid, { month, year } = {}) => {
  const txns = await getAll(uid, { month, year });
  let totalIncome = 0, totalExpense = 0;
  const expenseMap = {};
  const incomeMap = {};

  txns.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
      incomeMap[t.category] = (incomeMap[t.category] || 0) + t.amount;
    } else {
      totalExpense += t.amount;
      expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
    }
  });

  const categories = Object.entries(expenseMap).map(([category, total]) => ({ category, total }));
  const incomeCategories = Object.entries(incomeMap).map(([category, total]) => ({ category, total }));

  return { totalIncome, totalExpense, balance: totalIncome - totalExpense, categories, incomeCategories };
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

export const deleteAll = async (uid) => {
  const snap = await getDocs(col(uid));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};
