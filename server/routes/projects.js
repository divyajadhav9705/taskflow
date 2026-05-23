const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { prepare } = require('../db');
const { auth, requireProjectRole } = require('../middleware');

router.use(auth);

router.get('/', (req, res) => {
  const projects = req.user.role === 'admin'
    ? prepare(`SELECT p.*, u.name as owner_name, (SELECT COUNT(*) FROM tasks WHERE project_id=p.id) as task_count, (SELECT COUNT(*) FROM project_members WHERE project_id=p.id) as member_count FROM projects p JOIN users u ON p.owner_id=u.id ORDER BY p.created_at DESC`).all()
    : prepare(`SELECT p.*, u.name as owner_name, pm.role as my_role, (SELECT COUNT(*) FROM tasks WHERE project_id=p.id) as task_count, (SELECT COUNT(*) FROM project_members WHERE project_id=p.id) as member_count FROM projects p JOIN project_members pm ON pm.project_id=p.id AND pm.user_id=? JOIN users u ON p.owner_id=u.id ORDER BY p.created_at DESC`).all(req.user.id);
  res.json({ projects });
});

router.post('/', [body('name').trim().notEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, description = '', color = '#6366f1' } = req.body;
  const result = prepare('INSERT INTO projects (name, description, color, owner_id) VALUES (?, ?, ?, ?)').run(name, description, color, req.user.id);
  prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.user.id, 'admin');
  res.status(201).json({ project: prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid) });
});

router.get('/:projectId', requireProjectRole('member'), (req, res) => {
  const members = prepare(`SELECT u.id, u.name, u.email, u.avatar, pm.role FROM project_members pm JOIN users u ON u.id=pm.user_id WHERE pm.project_id=?`).all(req.params.projectId);
  res.json({ project: req.project, members });
});

router.put('/:projectId', requireProjectRole('admin'), (req, res) => {
  const { name, description, color } = req.body;
  const fields = [], vals = [];
  if (name) { fields.push('name=?'); vals.push(name); }
  if (description !== undefined) { fields.push('description=?'); vals.push(description); }
  if (color) { fields.push('color=?'); vals.push(color); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.projectId);
  prepare(`UPDATE projects SET ${fields.join(',')} WHERE id=?`).run(...vals);
  res.json({ project: prepare('SELECT * FROM projects WHERE id=?').get(req.params.projectId) });
});

router.delete('/:projectId', requireProjectRole('admin'), (req, res) => {
  prepare('DELETE FROM task_comments WHERE task_id IN (SELECT id FROM tasks WHERE project_id=?)').run(req.params.projectId);
  prepare('DELETE FROM tasks WHERE project_id=?').run(req.params.projectId);
  prepare('DELETE FROM project_members WHERE project_id=?').run(req.params.projectId);
  prepare('DELETE FROM projects WHERE id=?').run(req.params.projectId);
  res.json({ message: 'Project deleted' });
});

router.post('/:projectId/members', requireProjectRole('admin'), [body('email').isEmail().normalizeEmail()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, role = 'member' } = req.body;
  const user = prepare('SELECT id, name, email, avatar FROM users WHERE email=?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found. They must sign up first.' });
  if (prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(req.params.projectId, user.id))
    return res.status(409).json({ error: 'User already a member' });
  prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.projectId, user.id, role);
  res.status(201).json({ user, role });
});

router.delete('/:projectId/members/:userId', requireProjectRole('admin'), (req, res) => {
  if (parseInt(req.params.userId) === req.project.owner_id)
    return res.status(400).json({ error: 'Cannot remove project owner' });
  prepare('DELETE FROM project_members WHERE project_id=? AND user_id=?').run(req.params.projectId, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;