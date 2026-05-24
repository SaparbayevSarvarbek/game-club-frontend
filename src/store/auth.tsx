import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

type User = {
  id: number
  username: string
  full_name: string | null
  role: 'user' | 'admin'
  is_active: boolean
}

type AuthContextState = {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextState | undefined>(undefined)

const STORAGE_KEY = 'gameclub_auth'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored) as { token: string; user: User }
        setUser(data.user)
        setToken(data.token)
        api.setToken(data.token)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const result = await api.login(username, password)
    setToken(result.access_token)
    setUser(result.user)
    api.setToken(result.access_token)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: result.access_token, user: result.user }))
    return result.user
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    api.clearToken()
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
