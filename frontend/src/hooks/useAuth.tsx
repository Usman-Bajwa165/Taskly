import React, { createContext, useContext, useEffect, useState } from 'react'
import api, { setAuthToken } from '../api'

type User = { id: string; email: string; name?: string } | null
type AuthCtx = {
  token: string | null
  user: User
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}
const AuthContext = createContext<AuthCtx | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('taskly_token'))
  const [user, setUser] = useState<User>(() => {
    const raw = localStorage.getItem('taskly_user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    setAuthToken(token)
    if (token) localStorage.setItem('taskly_token', token)
    else localStorage.removeItem('taskly_token')
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    setToken(res.data.token)
    setUser(res.data.user)
    localStorage.setItem('taskly_user', JSON.stringify(res.data.user))
  }

  const register = async (email: string, password: string, name?: string) => {
    const res = await api.post('/auth/register', { email, password, name })
    setToken(res.data.token)
    setUser(res.data.user)
    localStorage.setItem('taskly_user', JSON.stringify(res.data.user))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setAuthToken(null)
    localStorage.removeItem('taskly_user')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
