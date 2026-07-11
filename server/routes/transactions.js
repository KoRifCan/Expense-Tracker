const express = require('express');
const { prepare } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const { month, year, type } = req.query;
  let sql = 'SELECT * FROM transactions WHERE user_id = ?';
  const params = [req.userId];

  if (month && year) {
    sql += " AND strftime('%m', date) = ? AND strftime('%Y', date) = ?";
    params.push(month.padStart(2, '0'), year);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY date DESC, id DESC';
  const transactions = prepare(sql).all(...params);
  res.json(transactions);
});

router.get('/summary', auth, (req, res) => {
  const { month, year } = req.query;
  const m = (month || String(new Date().getMonth() + 1)).padStart(2, '0');
  const y = year || String(new Date().getFullYear());

  const transactions = prepare(
    "SELECT type, amount FROM transactions WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?"
  ).all(req.userId, m, y);

  let totalIncome = 0, totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  const categories = prepare(
    "SELECT category, SUM(amount) as total FROM transactions WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ? AND type = 'expense' GROUP BY category"
  ).all(req.userId, m, y);

  res.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categories
  });
});

router.post('/', auth, (req, res) => {
  const { type, amount, category, description, date } = req.body;
  if (!type || !amount || !category || !date) {
    return res.status(400).json({ error: 'Type, amount, category, dan date harus diisi' });
  }

  const result = prepare(
    'INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.userId, type, amount, category, description || '', date);

  const transaction = prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(transaction);
});

router.put('/:id', auth, (req, res) => {
  const { type, amount, category, description, date } = req.body;
  const existing = prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  prepare(
    'UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ?'
  ).run(
    type || existing.type,
    amount ?? existing.amount,
    category || existing.category,
    description !== undefined ? description : existing.description,
    date || existing.date,
    req.params.id
  );

  const updated = prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', auth, (req, res) => {
  const existing = prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Transaksi berhasil dihapus' });
});

module.exports = router;
