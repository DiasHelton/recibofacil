import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, CircleDollarSign, Clock, Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { api } from '../api/client'
import type { Dashboard as DashboardData } from '../types'
import { Sidebar } from '../components/Layout/Sidebar'
import { Card } from '../components/Dashboard/Card'
import { ProgressPanel } from '../components/Dashboard/ProgressPanel'
import { NextDuePanel } from '../components/Dashboard/NextDuePanel'

interface DashboardProps {
  onLogout: () => void
}

function DashboardSection({
  role,
  data,
  onNewLoan,
}: {
  role: 'credor' | 'devedor'
  data: DashboardData['as_creditor'] | undefined
  onNewLoan: () => void
}) {
  if (!data || data.installments === 0) return null

  const isCreditor = role === 'credor'
  const label = isCreditor ? 'Como credor' : 'Como devedor'
  const Icon = isCreditor ? ArrowUpCircle : ArrowDownCircle
  const totalLabel = isCreditor ? 'Total emprestado' : 'Total devido'
  const receivedLabel = isCreditor ? 'Total recebido' : 'Total pago'
  const remainingLabel = isCreditor ? 'Saldo a receber' : 'Saldo devedor'

  return (
    <section>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Icon size={20} /> {label}
      </h2>
      <section className="cards">
        <Card label={totalLabel} value={String(data.total)} icon={Wallet} color="blue" />
        <Card label={receivedLabel} value={String(data.received)} icon={CircleDollarSign} color="green" />
        <Card label={remainingLabel} value={String(data.remaining)} icon={Clock} color="amber" />
      </section>
      <section className="grid">
        <ProgressPanel total={data.installments} paid={data.paid} pending={data.pending} />
        <NextDuePanel nextDue={data.next_due ?? undefined} />
      </section>
    </section>
  )
}

export function Dashboard({ onLogout }: DashboardProps) {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<DashboardData>('/dashboard/').then(setData).catch(e => setError(e.message))
  }, [])

  const hasCreditor = data && data.as_creditor.installments > 0
  const hasDebtor = data && data.as_debtor.installments > 0

  return (
    <div className="shell">
      <Sidebar onLogout={onLogout} />
      <main className="dashboard">
        <header>
          <div>
            <p className="eyebrow">VISÃO GERAL</p>
            <h1>Olá, {localStorage.getItem('userName') || 'usuário'}! Acompanhe seus empréstimos.</h1>
          </div>
          <button className="primary" onClick={() => navigate('/loans/new')}>
            <Plus size={18} /> Novo empréstimo
          </button>
        </header>

        {error && <p className="form-error">{error}</p>}

        {!data ? (
          <p className="empty">Carregando...</p>
        ) : (
          <>
            {!hasCreditor && !hasDebtor ? (
              <div className="empty-state">
                <p className="empty" style={{ marginBottom: 16 }}>Nenhum empréstimo encontrado.</p>
                <button className="primary" onClick={() => navigate('/loans/new')}>
                  <Plus size={18} /> Criar primeiro empréstimo
                </button>
              </div>
            ) : (
              <>
                <DashboardSection role="credor" data={data.as_creditor} onNewLoan={() => navigate('/loans/new')} />
                <div style={{ height: 32 }} />
                <DashboardSection role="devedor" data={data.as_debtor} onNewLoan={() => navigate('/loans/new')} />
              </>
            )}


          </>
        )}
      </main>
    </div>
  )
}
