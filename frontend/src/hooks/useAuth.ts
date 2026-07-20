import { useState, useCallback, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/auth'
import { api } from '../api/client'

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const isAuthenticated = !!token

  useEffect(() => {
    if (!isAuthenticated || localStorage.getItem('userName')) return
    api.get<{ name: string; email: string; full_name: string }>('/auth/me/')
      .then(p => {
        localStorage.setItem('userName', p.full_name || p.name || p.email)
        localStorage.setItem('userEmail', p.email)
      })
      .catch(() => {})
  }, [isAuthenticated])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await apiLogin(email, password)
    setToken(tokens.access)
    return tokens
  }, [])

  const logout = useCallback(() => {
    apiLogout()
    setToken(null)
  }, [])

  return { isAuthenticated, login, logout, token }
}
