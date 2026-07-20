import { api } from './client'
import type { Receipt } from '../types'

export function listReceipts() {
  return api.get<Receipt[]>('/receipts/')
}

export function getReceipt(id: number) {
  return api.get<Receipt>(`/receipts/${id}/`)
}

export function signReceipt(id: number, password: string) {
  return api.post<Receipt>(`/receipts/${id}/sign/`, { password })
}

export function cancelReceipt(id: number) {
  return api.post<Receipt>(`/receipts/${id}/cancel/`)
}

export function documentUrl(id: number) {
  const token = localStorage.getItem('token')
  return `/api/receipts/${id}/document/?token=${token}`
}
