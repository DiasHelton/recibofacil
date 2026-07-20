import { api } from './client'
import type { AuthTokens } from '../types'

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4 || 4)), '=')
    return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export function getUserId(): number | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  const decoded = decodeToken(token)
  const uid = decoded?.user_id
  return uid != null ? Number(uid) : null
}

export async function login(email: string, password: string): Promise<{ access: string; refresh: string }> {
  const tokens = await api.post<{ access: string; refresh: string }>('/auth/token/', { email, password })

  localStorage.setItem('token', tokens.access)
  localStorage.setItem('refresh', tokens.refresh)

  const decoded = decodeToken(tokens.access)
  if (decoded?.user_id) {
    localStorage.setItem('userId', String(decoded.user_id))
  }

  try {
    const profile = await api.get<{ name: string; email: string; full_name: string }>('/auth/me/')
    localStorage.setItem('userName', profile.full_name || profile.name || profile.email)
    localStorage.setItem('userEmail', profile.email)
  } catch {}

  return tokens
}

export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<AuthTokens> {
  const data = await api.post<{ tokens: AuthTokens; user: { name: string; email: string } }>('/auth/register/', {
    name,
    email,
    password,
    phone: phone || '',
  })
  const decoded = decodeToken(data.tokens.access)
  if (decoded?.user_id) {
    localStorage.setItem('userId', String(decoded.user_id))
  }
  localStorage.setItem('token', data.tokens.access)
  localStorage.setItem('refresh', data.tokens.refresh)
  localStorage.setItem('userName', data.user.name || email)
  localStorage.setItem('userEmail', data.user.email)
  return data.tokens
}

export async function fetchProfile() {
  return api.get<{ id: number; name: string; email: string; phone: string }>('/auth/me/')
}

export async function updateProfile(data: { name?: string; phone?: string }) {
  return api.patch('/auth/me/', data)
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh')
  localStorage.removeItem('userId')
  localStorage.removeItem('userName')
  localStorage.removeItem('userEmail')
}
