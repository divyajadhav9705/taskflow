import { useState, useEffect } from 'react'
import api from '../api'
import { X, Send, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
]
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export default function TaskModal({ task, onClose, onUpdated, onDeleted, members = [] }) {
  const [t, setT] = useState(task)
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  useEffect(() => {
    api.get(`/tasks/${task.id}`).then(r => { setT(r.data.task); setComments(r.data.comments) })
  }, [task.id])

  const update = async (field, value) => {
    const r = await api.put(`/tasks/${t.id}`, { [field]: value })
    setT(r.data.task)
    onUpdated?.(r.data.task)
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSendingComment(true)
    try {
      const r = await api.post(`/tasks/${t.id}/comments`, { content: comment })
      setComments(prev => [...prev, r.data.comment])
      setComment('')
    } finally { setSendingComment(false) }
  }

  const deleteTask = async () => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${t.id}`)
    onDeleted?.(t.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            <span className={`badge status-${t.status}`} style={{ marginBottom: '0.5rem' }}>
              {STATUS_OPTIONS.find(s => s.value === t.status)?.label}
            </span>
            <h2 style={{ fontSize: '1.1rem', lineHeight: 1.3 }}>{t.title}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '1rem', flexShrink: 0 }}>
            <button className="btn-icon btn-sm" onClick={deleteTask} style={{ color: 'var(--red)' }}><Trash2 size={14} /></button>
            <button className="btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <div>
            <label>Status</label>
            <select value={t.status} onChange={e => update('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label>Priority</label>
            <select value={t.priority} onChange={e => update('priority', e.target.value)}>
              {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <div>
            <label>Assignee</label>
            <select value={t.assignee_id || ''} onChange={e => update('assignee_id', e.target.value || null)}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label>Due date</label>
            <input type="date" value={t.due_date || ''} onChange={e => update('due_date', e.target.value || null)} />
          </div>
        </div>

        {t.description && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label>Description</label>
            <div style={{ fontSize: '0.88rem', color: 'var(--text2)', lineHeight: 1.6, background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              {t.description}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: 'var(--text3)' }}>
          <span>Project: <span style={{ color: 'var(--text2)' }}>{t.project_name}</span></span>
          <span>Created by: <span style={{ color: 'var(--text2)' }}>{t.creator_name}</span></span>
        </div>

        <hr className="divider" />

        <div>
          <label style={{ marginBottom: '0.75rem' }}>Comments ({comments.length})</label>
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem' }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <div className="avatar avatar-sm" style={{ background: c.user_avatar || 'var(--accent)', flexShrink: 0, marginTop: 2 }}>
                  {c.user_name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{c.user_name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>
                      {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text2)' }}>{c.content}</div>
                </div>
              </div>
            ))}
            {comments.length === 0 && <div style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>No comments yet</div>}
          </div>
          <form onSubmit={addComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…" style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={sendingComment || !comment.trim()}>
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}