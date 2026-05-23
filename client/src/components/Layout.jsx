import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Zap, Shield } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const doLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  ]

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div style={{ padding: '1.5rem 1.25rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'var(--accent)', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={15} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              TaskFlow
            </span>
          </div>
        </div>

        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.55rem 0.75rem', borderRadius: '8px',
                marginBottom: '2px', textDecoration: 'none',
                fontSize: '0.88rem', fontWeight: 500,
                color: isActive ? 'var(--text)' : 'var(--text2)',
                background: isActive ? 'var(--surface2)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} color={isActive ? 'var(--accent)' : 'currentColor'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div className="avatar" style={{ background: user?.avatar || 'var(--accent)' }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {user?.role === 'admin' && <Shield size={10} color="var(--accent)" />}
                <span style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'capitalize' }}>{user?.role}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={doLogout} style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}