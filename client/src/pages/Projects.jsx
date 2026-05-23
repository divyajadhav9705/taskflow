import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { Plus, FolderKanban, Users, CheckSquare, X } from 'lucide-react'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#06b6d4']

function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const r = await api.post('/projects', form)
      onCreated(r.data.project); onClose()
    } catch (err) { setError(err.response?.data?.error || 'Failed to create project') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>New Project</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Project name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Website Redesign" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What is this project about?" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label>Project color</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', outline: form.color === c ? '2px solid ' + c : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create project'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    api.get('/projects').then(r => { setProjects(r.data.projects); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1>Projects</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={16} /> New project
        </button>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowNew(true)}>
            <Plus size={15} /> Create project
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
                {/* Color bar */}
                <div style={{ height: 4, background: p.color, borderRadius: 2, marginBottom: '1rem', margin: '-1.25rem -1.25rem 1rem', borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FolderKanban size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description || 'No description'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text2)' }}>
                    <CheckSquare size={13} /> {p.task_count} task{p.task_count !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text2)' }}>
                    <Users size={13} /> {p.member_count} member{p.member_count !== 1 ? 's' : ''}
                  </div>
                  {p.my_role && <span className="badge" style={{ marginLeft: 'auto', background: 'var(--accent-glow)', color: 'var(--accent)' }}>{p.my_role}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={p => setProjects(prev => [p, ...prev])} />}
    </div>
  )
}