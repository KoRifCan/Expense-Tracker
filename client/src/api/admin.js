import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function getAllUsersWithTransactions() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const result = [];

  for (const userDoc of usersSnap.docs) {
    const user = { uid: userDoc.id, ...userDoc.data() };
    const txSnap = await getDocs(
      query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'))
    );
    user.transactions = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    user.totalIncome = user.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    user.totalExpense = user.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    result.push(user);
  }

  return result;
}
