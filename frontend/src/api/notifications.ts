import { api } from './client'
import type { Notification } from '../types'

export function listNotifications() {
  return api.get<Notification[]>('/notifications/')
}

export function markAsRead(id: number) {
  return api.post<Notification>(`/notifications/${id}/read/`)
}

export function markAllAsRead() {
  return api.post<{ detail: string }>('/notifications/read_all/')
}
