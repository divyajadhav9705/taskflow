import { useState, useEffect } from 'react'
import api from '../api'
import TaskModal from '../components/TaskModal'
import { AlertTriangle } from 'lucide-react'
import { isPast, parseISO } from 'date-fns'

const STATUS_OPTIONS = ['todo','in_progress','review','done']
const PRIORITY_OPTIONS = ['low','medium','high','urgent']

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState({ status: '', priority: '', overdue: false })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter.status) params.set('status', filter.status)
    if (filter.priority) params.set('priority', filter.priority)
    if (filter.overdue) params.set('overdue', 'true')
    api.get(`/tasks?${params}`).then(r => { setTasks(r.data.tasks); setLoading(false) })
  }, [filter])

  return (
    <div className="page">
      <h1 style={{ marginBottom: '1.5rem' }}>All Tasks</h1>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {STATUS_OPTIONS.map(s => (
          <button key={s} className={`chip ${filter.status === s ? 'active' : ''}`}
            onClick={() => setFilter(p => ({ ...p, status: p.status === s ? '' : s }))}>
            {s.replace('_',' ')}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', margin: '0 0.25rem' }} />
        {PRIORITY_OPTIONS.map(p => (
          <button key={p} className={`chip ${filter.priority === p ? 'active' : ''}`}
            onClick={() => setFilter(f => ({ ...f, priority: f.priority === p ? '' : p }))}>
            {p}
          </button>
        ))}
        <button className={`chip ${filter.overdue ? 'active' : ''}`}
          onClick={() => setFilter(p => ({ ...p, overdue: !p.overdue }))}>
          ⚠ overdue
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Task</th><th>Project</th><th>Status</th>
              <th>Priority</th><th>Assignee</th><th>Due</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => {
              const overdue = t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'done'
              return (
                <tr key={t.id} onClick={() => setSelected(t)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{t.title}</td>
                  <td>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background: t.project_color, display:'inline-block' }} />
                      {t.project_name}
                    </span>
                  </td>
                  <td><span className={`badge status-${t.status}`}>{t.status.replace('_',' ')}</span></td>
                  <td><span className={`badge priority-${t.priority}`}>{t.priority}</span></td>
                  <td>{t.assignee_name || <span style={{color:'var(--text3)'}}>—</span>}</td>
                  <td style={{ color: overdue ? 'var(--red)' : 'var(--text2)', fontSize: '0.82rem' }}>
                    {overdue && <AlertTriangle size={11} style={{ marginRight:4 }} />}
                    {t.due_date || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && tasks.length === 0 && (
          <div style={{ textAlign:'center', padding:'3rem', color:'var(--text2)' }}>No tasks found</div>
        )}
      </div>
      {selected && (
        <TaskModal task={selected} onClose={() => setSelected(null)}
          onUpdated={u => setTasks(p => p.map(t => t.id === u.id ? u : t))}
          onDeleted={id => setTasks(p => p.filter(t => t.id !== id))} />
      )}
    </div>
  )
}