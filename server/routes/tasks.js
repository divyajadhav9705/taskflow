const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { prepare } = require('../db');
const { auth } = require('../middleware');

router.use(auth);

const taskSelect = `SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, c.name as creator_name, p.name as project_name, p.color as project_color FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id LEFT JOIN users c ON c.id=t.creator_id LEFT JOIN projects p ON p.id=t.project_id`;

router.get('/dashboard', (req, res) => {
  const uid = req.user.id;
  const isAdmin = req.user.role === 'admin';
  const scope = isAdmin ? '1=1' : `project_id IN (SELECT project_id FROM project_members WHERE user_id=${uid})`;
  const stats = {
    total: prepare(`SELECT COUNT(*) as n FROM tasks WHERE ${scope}`).get().n,
    todo: prepare(`SELECT COUNT(*) as n FROM tasks WHERE ${scope} AND status='todo'`).get().n,
    in_progress: prepare(`SELECT COUNT(*) as n FROM tasks WHERE ${scope} AND status='in_progress'`).get().n,
    review: prepare(`SELECT COUNT(*) as n FROM tasks WHERE ${scope} AND status='review'`).get().n,
    done: prepare(`SELECT COUNT(*) as n FROM tasks WHERE ${scope} AND status='done'`).get().n,
    overdue: prepare(`SELECT COUNT(*) as n FROM tasks WHERE ${scope} AND due_date < date('now') AND status!='done'`).get().n,
    my_tasks: prepare(`SELECT COUNT(*) as n FROM tasks WHERE assignee_id=?`).get(uid).n,
  };
  const recentTasks = prepare(`${taskSelect} WHERE ${scope} AND t.status!='done' ORDER BY CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date ASC LIMIT 8`).all();
  const projects = isAdmin
    ? prepare(`SELECT p.*, (SELECT COUNT(*) FROM tasks WHERE project_id=p.id AND status!='done') as open_tasks FROM projects p ORDER BY p.created_at DESC LIMIT 6`).all()
    : prepare(`SELECT p.*, (SELECT COUNT(*) FROM tasks WHERE project_id=p.id AND status!='done') as open_tasks FROM projects p JOIN project_members pm ON pm.project_id=p.id AND pm.user_id=? ORDER BY p.created_at DESC LIMIT 6`).all(uid);
  res.json({ stats, recentTasks, projects });
});

router.get('/', (req, res) => {
  const { project_id, status, assignee_id, priority, overdue } = req.query;
  let sql = taskSelect + ` WHERE 1=1`;
  const params = [];
  if (req.user.role !== 'admin') { sql += ` AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id=?)`; params.push(req.user.id); }
  if (project_id) { sql += ' AND t.project_id=?'; params.push(project_id); }
  if (status) { sql += ' AND t.status=?'; params.push(status); }
  if (assignee_id) { sql += ' AND t.assignee_id=?'; params.push(assignee_id); }
  if (priority) { sql += ' AND t.priority=?'; params.push(priority); }
  if (overdue === 'true') { sql += ` AND t.due_date < date('now') AND t.status!='done'`; }
  sql += ' ORDER BY t.created_at DESC';
  res.json({ tasks: prepare(sql).all(...params) });
});

router.post('/', [body('title').trim().notEmpty(), body('project_id').notEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, description='', project_id, status='todo', priority='medium', due_date=null, assignee_id=null } = req.body;
  if (req.user.role !== 'admin') {
    const mem = prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(project_id, req.user.id);
    if (!mem) return res.status(403).json({ error: 'Not a project member' });
  }
  const result = prepare('INSERT INTO tasks (title, description, project_id, status, priority, due_date, assignee_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(title, description, project_id, status, priority, due_date||null, assignee_id||null, req.user.id);
  res.status(201).json({ task: prepare(`${taskSelect} WHERE t.id=?`).get(result.lastInsertRowid) });
});

router.get('/:id', (req, res) => {
  const task = prepare(`${taskSelect} WHERE t.id=?`).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.user.role !== 'admin') {
    const mem = prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(task.project_id, req.user.id);
    if (!mem) return res.status(403).json({ error: 'Access denied' });
  }
  const comments = prepare(`SELECT tc.*, u.name as user_name, u.avatar as user_avatar FROM task_comments tc JOIN users u ON u.id=tc.user_id WHERE tc.task_id=? ORDER BY tc.created_at ASC`).all(req.params.id);
  res.json({ task, comments });
});

router.put('/:id', (req, res) => {
  const task = prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.user.role !== 'admin') {
    const mem = prepare('SELECT role FROM project_members WHERE project_id=? AND user_id=?').get(task.project_id, req.user.id);
    if (!mem) return res.status(403).json({ error: 'Access denied' });
  }
  const allowed = ['title','description','status','priority','due_date','assignee_id'];
  const fields=[], vals=[];
  for (const key of allowed) { if (req.body[key] !== undefined) { fields.push(`${key}=?`); vals.push(req.body[key]==='' ? null : req.body[key]); } }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id);
  prepare(`UPDATE tasks SET ${fields.join(',')}, updated_at=datetime('now') WHERE id=?`).run(...vals);
  res.json({ task: prepare(`${taskSelect} WHERE t.id=?`).get(req.params.id) });
});

router.delete('/:id', (req, res) => {
  const task = prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.user.role !== 'admin') {
    const mem = prepare('SELECT role FROM project_members WHERE project_id=? AND user_id=?').get(task.project_id, req.user.id);
    if (!mem || (mem.role !== 'admin' && task.creator_id !== req.user.id)) return res.status(403).json({ error: 'Cannot delete this task' });
  }
  prepare('DELETE FROM task_comments WHERE task_id=?').run(req.params.id);
  prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

router.post('/:id/comments', [body('content').trim().notEmpty()], (req, res) => {
  const task = prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const result = prepare('INSERT INTO task_comments (task_id, user_id, content) VALUES (?, ?, ?)').run(req.params.id, req.user.id, req.body.content);
  const comment = prepare('SELECT tc.*, u.name as user_name, u.avatar as user_avatar FROM task_comments tc JOIN users u ON u.id=tc.user_id WHERE tc.id=?').get(result.lastInsertRowid);
  res.status(201).json({ comment });
});

module.exports = router;