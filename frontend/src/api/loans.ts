import { api } from './client'
import type { Loan } from '../types'

export function listLoans() {
  return api.get<Loan[]>('/loans/')
}

export function getLoan(id: number) {
  return api.get<Loan>(`/loans/${id}/`)
}

export function createLoan(data: {
  name: string
  debtor: number
  amount: string
  installments: number
  installment_value: string
  loan_date: string
  first_due_date: string
  interest_rate?: string | null
  notes?: string
}) {
  return api.post<Loan>('/loans/', data)
}

export function payInstallment(loanId: number, number: number, data: {
  payment_date: string
  amount: string
  payment_method: string
  password: string
}) {
  return api.post<{ payment: unknown; receipt: unknown }>(
    `/loans/${loanId}/installments/${number}/pay/`, data
  )
}

export function confirmPayment(loanId: number, number: number, password: string) {
  return api.post<{ payment: unknown; receipt: unknown }>(
    `/loans/${loanId}/installments/${number}/confirm/`, { password }
  )
}
