const jwt = require('jsonwebtoken');
const { prepare } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-dev-secret-change-in-prod';

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user; next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

const requireProjectRole = (minRole) => (req, res, next) => {
  const projectId = parseInt(req.params.projectId || req.body.project_id);
  const project = prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (req.user.role === 'admin') { req.project = project; return next(); }
  const membership = prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Not a project member' });
  if (minRole === 'admin' && membership.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  req.project = project; req.projectRole = membership.role; next();
};

module.exports = { auth, requireProjectRole, JWT_SECRET };