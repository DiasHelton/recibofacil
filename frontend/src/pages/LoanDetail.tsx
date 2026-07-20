import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, CheckCircle, ShieldCheck } from 'lucide-react'
import { getLoan, payInstallment, confirmPayment } from '../api/loans'
import { getUserId } from '../api/auth'
import type { Loan } from '../types'
import { Sidebar } from '../components/Layout/Sidebar'

interface LoanDetailProps {
  onLogout: () => void
}

const money = (x: string | number) =>
  Number(x || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
  active: 'Ativo',
  cancelled: 'Cancelado',
}

const paymentMethods = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'ted', label: 'TED' },
  { value: 'doc', label: 'DOC' },
  { value: 'card', label: 'Cartão' },
  { value: 'other', label: 'Outro' },
]

export function LoanDetail({ onLogout }: LoanDetailProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<number | null>(null)
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payMethod, setPayMethod] = useState('pix')
  const [payPassword, setPayPassword] = useState('')
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const userId = getUserId()

  function load() {
    if (!id) return
    setLoading(true)
    getLoan(parseInt(id)).then(setLoan).catch(() => navigate('/loans')).finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function handlePay(number: number) {
    if (!loan) return
    setError('')
    try {
      const installment = loan.installment_list.find(i => i.number === number)
      if (!installment) return
      await payInstallment(loan.id, number, {
        payment_date: payDate,
        amount: installment.amount,
        payment_method: payMethod,
        password: payPassword,
      })
      setPaying(null)
      setPayPassword('')
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleConfirm(number: number) {
    if (!loan) return
    setError('')
    try {
      await confirmPayment(loan.id, number, confirmPassword)
      setConfirmingId(null)
      setConfirmPassword('')
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="shell">
        <Sidebar onLogout={onLogout} />
        <main className="dashboard"><p className="empty">Carregando...</p></main>
      </div>
    )
  }

  if (!loan) return null

  const isCreditor = userId === loan.creditor
  const paidCount = loan.installment_list.filter(i => i.status === 'paid' && i.payment_confirmed).length

  return (
    <div className="shell">
      <Sidebar onLogout={onLogout} />
      <main className="dashboard">
        <header>
          <div>
            <p className="eyebrow">EMPRÉSTIMOS</p>
            <h1>{loan.name}</h1>
          </div>
          <button className="primary" onClick={() => navigate('/loans')} style={{ background: 'none', color: '#173d3d' }}>
            <ArrowLeft size={18} /> Voltar
          </button>
        </header>

        <section className="loan-meta">
          <div className="meta-grid">
            <div><span>Credor</span><strong>{loan.creditor_name}</strong></div>
            <div><span>Devedor</span><strong>{loan.debtor_name}</strong></div>
            <div><span>Valor</span><strong>{money(loan.amount)}</strong></div>
            <div><span>Parcelas</span><strong>{paidCount}/{loan.installments}</strong></div>
            <div><span>Valor parcela</span><strong>{money(loan.installment_value)}</strong></div>
            <div><span>Juros</span><strong>{loan.interest_rate ? `${loan.interest_rate}% a.m.` : '—'}</strong></div>
            <div><span>Status</span><strong><span className={`status-badge ${loan.status}`}>{statusLabel[loan.status]}</span></strong></div>
          </div>
          {isCreditor ? (
            <p style={{ fontSize: 13, color: '#5a8d38', marginTop: 8 }}>
              Você é o credor — pode registrar pagamentos e confirmar os feitos pelo devedor.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: '#b77c1e', marginTop: 8 }}>
              Você é o devedor — registre o pagamento e o credor precisará confirmar.
            </p>
          )}
        </section>

        {error && <small className="form-error">{error}</small>}

        <section className="installment-list">
          <h2>Parcelas</h2>
          {loan.installment_list.map(inst => {
            const isUnconfirmed = inst.status === 'paid' && inst.payment_id && !inst.payment_confirmed
            const isConfirmed = inst.status === 'paid' && inst.payment_id && inst.payment_confirmed

            return (
              <article key={inst.id} className={`installment-row ${inst.status}`}>
                <div className="inst-number">#{inst.number}</div>
                <div className="inst-info">
                  <strong>{money(inst.amount)}</strong>
                  <span>Vence {new Date(inst.due_date + 'T12:00').toLocaleDateString('pt-BR')}</span>
                </div>

                {isConfirmed ? (
                  <span className="status-badge confirmed">Confirmado</span>
                ) : isUnconfirmed ? (
                  <span className="status-badge awaiting">Aguardando confirmação</span>
                ) : (
                  <span className={`status-badge ${inst.status}`}>{statusLabel[inst.status]}</span>
                )}

                {inst.status === 'pending' && paying !== inst.number && (
                  <button className="pay-btn" onClick={() => setPaying(inst.number)}>
                    <DollarSign size={16} /> Pagar
                  </button>
                )}

                {paying === inst.number && (
                  <div className="pay-form">
                    <label>
                      Data
                      <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
                    </label>
                    <label>
                      Método
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                        {paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </label>
                    <label>
                      <ShieldCheck size={13} /> Senha
                      <input type="password" value={payPassword} onChange={e => setPayPassword(e.target.value)} placeholder="sua senha" />
                    </label>
                    <button className="primary" onClick={() => handlePay(inst.number)}>
                      Confirmar
                    </button>
                    <button className="link" onClick={() => { setPaying(null); setPayPassword('') }}>Cancelar</button>
                  </div>
                )}

                {isUnconfirmed && isCreditor && confirmingId !== inst.number && (
                  <button className="pay-btn confirm" onClick={() => setConfirmingId(inst.number)}>
                    <CheckCircle size={16} /> Confirmar
                  </button>
                )}

                {isUnconfirmed && isCreditor && confirmingId === inst.number && (
                  <div className="pay-form">
                    <label>
                      <ShieldCheck size={13} /> Senha
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="sua senha" />
                    </label>
                    <button className="primary" onClick={() => handleConfirm(inst.number)}>
                      Confirmar
                    </button>
                    <button className="link" onClick={() => { setConfirmingId(null); setConfirmPassword('') }}>Cancelar</button>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
