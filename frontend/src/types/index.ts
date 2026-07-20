export interface DashboardSide {
  total: number
  received: number
  remaining: number
  installments: number
  paid: number
  pending: number
  next_due?: DueInstallment | null
}

export interface Dashboard {
  as_creditor: DashboardSide
  as_debtor: DashboardSide
}

export interface DueInstallment {
  due_date: string
  amount: string
  number: number
  loan: number
}

export interface User {
  id: number
  username: string
  name: string
  full_name: string
  email: string
  phone: string
  photo: string | null
}

export interface Loan {
  id: number
  name: string
  creditor: number
  debtor: number
  creditor_name: string
  debtor_name: string
  amount: string
  installments: number
  installment_value: string
  interest_rate: string | null
  loan_date: string
  first_due_date: string
  notes: string
  status: string
  created_at: string
  installment_list: Installment[]
}

export interface Installment {
  id: number
  number: number
  due_date: string
  amount: string
  status: 'pending' | 'paid' | 'overdue'
  loan: number
  payment_id: number | null
  payment_confirmed: boolean | null
}

export interface Payment {
  id: number
  installment: number
  payment_date: string
  amount: string
  payment_method: string
  notes: string
  proof: string | null
  recorded_by: number
  created_at: string
}

export interface Receipt {
  id: number
  payment: number
  number: string
  document_hash: string
  status: 'valid' | 'cancelled'
  created_at: string
  loan_name: string
  installment_number: number
  installment_total: number
  amount: string
  payment_date: string
  payment_method: string
}

export interface Notification {
  id: number
  user: number
  title: string
  message: string
  read_at: string | null
  created_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}
