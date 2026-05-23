const router = require('express').Router();
const { prepare } = require('../db');
const { auth } = require('../middleware');

router.use(auth);

router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT id, name, email, role, avatar, created_at FROM users';
  const params = [];
  if (search) { sql += ' WHERE name LIKE ? OR email LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY name ASC LIMIT 50';
  res.json({ users: prepare(sql).all(...params) });
});

router.put('/:id/role', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { role } = req.body;
  if (!['admin','member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  prepare('UPDATE users SET role=? WHERE id=?').run(role, req.params.id);
  res.json({ message: 'Role updated' });
});

module.exports = router;