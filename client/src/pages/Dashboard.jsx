import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { CheckSquare, AlertTriangle, TrendingUp, FolderKanban, ListTodo } from 'lucide-react'
import { formatDistanceToNow, isPast, parseISO } from 'date-fns'

function StatCard({ icon: Icon, iconBg, label, value, sub, subColor }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>
        <Icon size={20} color="#fff" />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: subColor || 'var(--text2)', marginTop: '0.15rem' }}>{sub}</div>}
      </div>
    </div>
  )
}

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' }
const priorityColors = { low: 'var(--green)', medium: 'var(--blue)', high: 'var(--yellow)', urgent: 'var(--red)' }

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tasks/dashboard').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page">
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Loading dashboard…</div>
    </div>
  )

  const { stats = {}, recentTasks = [], projects = [] } = data || {}
  const donePercent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className="page">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '0.25rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard icon={ListTodo} iconBg="var(--accent)" label="Total Tasks" value={stats.total || 0} sub={`${donePercent}% complete`} />
        <StatCard icon={TrendingUp} iconBg="rgba(96,165,250,0.3)" label="In Progress" value={stats.in_progress || 0} sub={`${stats.review || 0} in review`} subColor="var(--yellow)" />
        <StatCard icon={CheckSquare} iconBg="rgba(34,211,165,0.2)" label="Completed" value={stats.done || 0} sub="tasks done" subColor="var(--green)" />
        <StatCard icon={AlertTriangle} iconBg="rgba(240,92,122,0.2)" label="Overdue" value={stats.overdue || 0} sub={stats.overdue > 0 ? 'needs attention' : 'all on track'} subColor={stats.overdue > 0 ? 'var(--red)' : 'var(--green)'} />
      </div>

      {stats.total > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text2)' }}>Overall Progress</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)' }}>{donePercent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${donePercent}%`, background: 'linear-gradient(90deg, var(--accent), var(--green))' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3>Upcoming Tasks</h3>
            <Link to="/tasks" style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>View all →</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)', fontSize: '0.85rem' }}>No open tasks 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentTasks.map(task => {
                const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done'
                return (
                  <div key={task.id} className="card" style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ width: 3, minHeight: 36, borderRadius: 2, background: priorityColors[task.priority], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>{task.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className={`badge status-${task.status}`}>{statusLabel[task.status]}</span>
                          {task.due_date && (
                            <span style={{ fontSize: '0.72rem', color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>
                              {isOverdue ? '⚠ Overdue' : formatDistanceToNow(parseISO(task.due_date), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3>Projects</h3>
            <Link to="/projects" style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>View all →</Link>
          </div>
          {projects.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)', fontSize: '0.85rem' }}>No projects yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {projects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FolderKanban size={15} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{p.open_tasks} open tasks</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}