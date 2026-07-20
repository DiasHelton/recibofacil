const API_BASE = '/api'

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

async function refreshToken(): Promise<string> {
  const refresh = localStorage.getItem('refresh')
  if (!refresh) throw new Error('No refresh token')

  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!res.ok) {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh')
    window.location.reload()
    throw new Error('Session expired')
  }

  const data = await res.json()
  localStorage.setItem('token', data.access)
  return data.access
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json'
  }

  const config: RequestInit = { ...options, headers }
  let response = await fetch(`${API_BASE}${endpoint}`, config)

  if (response.status === 401 && localStorage.getItem('refresh')) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const newToken = await refreshToken()
        isRefreshing = false
        pendingRequests.forEach(cb => cb(newToken))
        pendingRequests = []
        headers['Authorization'] = `Bearer ${newToken}`
        response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
      } catch {
        isRefreshing = false
        pendingRequests = []
        throw new Error('Session expired')
      }
    } else {
      const newToken = await new Promise<string>(resolve => {
        pendingRequests.push(resolve)
      })
      headers['Authorization'] = `Bearer ${newToken}`
      response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro de rede' }))
    const msgs = Object.values(error).flat().filter(Boolean)
    throw new Error(msgs[0] || error.detail || `HTTP ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

function body(data: unknown): BodyInit {
  return JSON.stringify(data)
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: data ? body(data) : undefined }),
  patch: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: body(data) }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
  upload: <T>(endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async r => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: 'Erro de rede' }))
        const msgs = Object.values(err).flat().filter(Boolean)
        throw new Error(msgs[0] || err.detail || `HTTP ${r.status}`)
      }
      return r.json() as T
    })
  },
}
