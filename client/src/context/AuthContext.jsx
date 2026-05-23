import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tf_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tf_token')
    if (token) {
      api.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => { localStorage.removeItem('tf_token'); setUser(null) })
        .finally(() => setLoading(false))
    } else setLoading(false)
  }, [])

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password })
    localStorage.setItem('tf_token', r.data.token)
    localStorage.setItem('tf_user', JSON.stringify(r.data.user))
    setUser(r.data.user)
    return r.data
  }

  const signup = async (data) => {
    const r = await api.post('/auth/signup', data)
    localStorage.setItem('tf_token', r.data.token)
    localStorage.setItem('tf_user', JSON.stringify(r.data.user))
    setUser(r.data.user)
    return r.data
  }

  const logout = () => {
    localStorage.removeItem('tf_token')
    localStorage.removeItem('tf_user')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
