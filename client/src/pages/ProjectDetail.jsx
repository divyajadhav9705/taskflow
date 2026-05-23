import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import TaskModal from '../components/TaskModal'
import { Plus, Users, Settings, Trash2, X, ArrowLeft, AlertTriangle } from 'lucide-react'
import { isPast, parseISO } from 'date-fns'

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--text2)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
  { key: 'review', label: 'Review', color: 'var(--yellow)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
]
const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--blue)', high: 'var(--yellow)', urgent: 'var(--red)' }

function NewTaskModal({ projectId, members, onClose, onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const payload = { ...form, project_id: projectId, due_date: form.due_date || null, assignee_id: form.assignee_id || null }
      const r = await api.post('/tasks', payload)
      onCreated(r.data.task); onClose()
    } catch (err) { setError(err.response?.data?.error || 'Failed to create task') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>New Task</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Details…" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assign to</label>
              <select value={form.assignee_id} onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MembersModal({ project, members, onClose, onMemberAdded, onMemberRemoved }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const addMember = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    try {
      const r = await api.post(`/projects/${project.id}/members`, { email, role })
      onMemberAdded(r.data)
      setEmail(''); setSuccess(`${r.data.user.name} added!`)
    } catch (err) { setError(err.response?.data?.error || 'Failed to add member') }
    finally { setLoading(false) }
  }

  const removeMember = async (userId) => {
    if (!confirm('Remove member?')) return
    try {
      await api.delete(`/projects/${project.id}/members/${userId}`)
      onMemberRemoved(userId)
    } catch (err) { setError(err.response?.data?.error) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Team Members</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
              <div className="avatar" style={{ background: m.avatar || 'var(--accent)' }}>{m.name?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{m.email}</div>
              </div>
              <span className="badge" style={{ background: m.role === 'admin' ? 'var(--accent-glow)' : 'var(--surface2)', color: m.role === 'admin' ? 'var(--accent)' : 'var(--text2)' }}>{m.role}</span>
              {m.id !== project.owner_id && (
                <button className="btn-icon btn-sm" onClick={() => removeMember(m.id)} style={{ color: 'var(--red)' }}><X size={13} /></button>
              )}
            </div>
          ))}
        </div>

        <hr className="divider" />
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Add member</h3>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={addMember}>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <div className="chip-group">
              <button type="button" className={`chip ${role === 'member' ? 'active' : ''}`} onClick={() => setRole('member')}>Member</button>
              <button type="button" className={`chip ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>Admin</button>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding…' : 'Add member'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskCard({ task, onClick }) {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done'
  return (
    <div className="card" onClick={() => onClick(task)}
      style={{ cursor: 'pointer', padding: '0.85rem', marginBottom: '0.5rem', borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || 'transparent'}` }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', lineHeight: 1.4 }}>{task.title}</div>
      {task.description && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <span className={`badge priority-${task.priority}`}>{task.priority}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isOverdue && <AlertTriangle size={11} color="var(--red)" />}
          {task.due_date && <span style={{ fontSize: '0.68rem', color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>{task.due_date}</span>}
          {task.assignee_name && (
            <div className="avatar avatar-sm" style={{ background: task.assignee_avatar || 'var(--accent)' }} title={task.assignee_name}>
              {task.assignee_name[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewTask, setShowNewTask] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project_id=${id}`)
    ]).then(([pr, tr]) => {
      setProject(pr.data.project)
      setMembers(pr.data.members)
      setTasks(tr.data.tasks)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const deleteProject = async () => {
    if (!confirm(`Delete project "${project?.name}"? This will delete all tasks.`)) return
    await api.delete(`/projects/${id}`)
    navigate('/projects')
  }

  const isAdmin = user?.role === 'admin' || members.find(m => m.id === user?.id)?.role === 'admin'

  if (loading) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text2)' }}>Loading…</div>
  if (!project) return <div className="page"><div className="alert alert-error">Project not found</div></div>

  const tasksByStatus = COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: tasks.filter(t => t.status === col.key) }), {})

  return (
    <div className="page" style={{ maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <Link to="/projects" style={{ color: 'var(--text2)', display: 'flex', alignItems: 'center' }}><ArrowLeft size={18} /></Link>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: project.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem' }}>{project.name[0]}</span>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.4rem' }}>{project.name}</h1>
          {project.description && <p style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowMembers(true)}>
            <Users size={14} /> Team ({members.length})
          </button>
          {isAdmin && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewTask(true)}>
                <Plus size={14} /> Task
              </button>
              <button className="btn btn-danger btn-sm" onClick={deleteProject}>
                <Trash2 size={14} />
              </button>
            </>
          )}
          {!isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewTask(true)}>
              <Plus size={14} /> Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', overflowX: 'auto' }}>
        {COLUMNS.map(col => (
          <div key={col.key} style={{ minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.label}</span>
              <span style={{ marginLeft: 'auto', background: 'var(--surface2)', color: 'var(--text3)', fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 10 }}>
                {tasksByStatus[col.key]?.length || 0}
              </span>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '0.75rem', minHeight: 200, border: '1px solid var(--border)' }}>
              {tasksByStatus[col.key]?.map(task => (
                <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
              ))}
              {tasksByStatus[col.key]?.length === 0 && (
                <div style={{ color: 'var(--text3)', fontSize: '0.78rem', textAlign: 'center', padding: '1.5rem 0' }}>No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNewTask && (
        <NewTaskModal projectId={parseInt(id)} members={members} onClose={() => setShowNewTask(false)}
          onCreated={task => setTasks(prev => [task, ...prev])} />
      )}
      {showMembers && (
        <MembersModal project={project} members={members} onClose={() => setShowMembers(false)}
          onMemberAdded={({ user: u, role }) => setMembers(prev => [...prev, { ...u, role }])}
          onMemberRemoved={uid => setMembers(prev => prev.filter(m => m.id !== uid))} />
      )}
      {selectedTask && (
        <TaskModal task={selectedTask} members={members} onClose={() => setSelectedTask(null)}
          onUpdated={updated => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))}
          onDeleted={tid => setTasks(prev => prev.filter(t => t.id !== tid))} />
      )}
    </div>
  )
}