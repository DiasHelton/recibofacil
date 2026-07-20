import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { listLoans } from '../api/loans'
import { getUserId } from '../api/auth'
import type { Loan } from '../types'
import { Sidebar } from '../components/Layout/Sidebar'

interface LoansProps {
  onLogout: () => void
}

const money = (x: string | number) =>
  Number(x || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  paid: 'Quitado',
  cancelled: 'Cancelado',
}

export function Loans({ onLogout }: LoansProps) {
  const navigate = useNavigate()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const userId = getUserId()

  useEffect(() => {
    listLoans().then(setLoans).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="shell">
      <Sidebar onLogout={onLogout} />
      <main className="dashboard">
        <header>
          <div>
            <p className="eyebrow">EMPRÉSTIMOS</p>
            <h1>Meus empréstimos</h1>
          </div>
          <button className="primary" onClick={() => navigate('/loans/new')}>
            <Plus size={18} /> Novo empréstimo
          </button>
        </header>

        {loading ? (
          <p className="empty">Carregando...</p>
        ) : loans.length === 0 ? (
          <p className="empty">Nenhum empréstimo encontrado.</p>
        ) : (
          <div className="loan-list">
            {loans.map(loan => {
              const isCreditor = userId === loan.creditor
              const paid = loan.installment_list.filter(i => i.status === 'paid' && i.payment_confirmed).length
              const nextPending = loan.installment_list.find(i => i.status === 'pending')
              const overdueInst = loan.installment_list.find(i => i.status === 'overdue')
              const pct = loan.installments > 0 ? Math.round((paid / loan.installments) * 100) : 0

              return (
                <article key={loan.id} className="loan-row" onClick={() => navigate(`/loans/${loan.id}`)}>
                  <div>
                    <div className="loan-row-top">
                      <h3>{loan.name}</h3>
                      <span className={`role-badge ${isCreditor ? 'creditor' : 'debtor'}`}>
                        {isCreditor ? 'Credor' : 'Devedor'}
                      </span>
                    </div>
                    <p>
                      {isCreditor ? loan.debtor_name : loan.creditor_name}
                      {' · '}{money(loan.amount)}
                      {' · '}{paid}/{loan.installments} parc.
                    </p>
                    <p className="loan-row-meta">
                      {overdueInst ? (
                        <span className="overdue-warning">Parcela {overdueInst.number} atrasada</span>
                      ) : nextPending ? (
                        <span>Próxima: parcela {nextPending.number} — {new Date(nextPending.due_date + 'T12:00').toLocaleDateString('pt-BR')}</span>
                      ) : loan.status === 'paid' ? (
                        <span>Totalmente quitado</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="loan-row-end">
                    <div className="loan-progress">
                      <div className="mini-bar"><i style={{ width: `${pct}%` }} /></div>
                      <span>{pct}%</span>
                    </div>
                    <span className={`status-badge ${loan.status}`}>{statusLabel[loan.status] || loan.status}</span>
                    <ChevronRight size={18} />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
