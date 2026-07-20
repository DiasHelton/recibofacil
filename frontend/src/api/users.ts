import { api } from './client'
import type { User } from '../types'

export function listUsers() {
  return api.get<User[]>('/users/')
}
