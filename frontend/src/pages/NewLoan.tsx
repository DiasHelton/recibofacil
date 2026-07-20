import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User as UserIcon } from 'lucide-react'
import { listUsers } from '../api/users'
import { createLoan } from '../api/loans'
import type { User } from '../types'

export function NewLoan() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [debtorId, setDebtorId] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [installments, setInstallments] = useState('1')
  const [interestRate, setInterestRate] = useState('')
  const [installmentValue, setInstallmentValue] = useState('')
  const [loanDate, setLoanDate] = useState(new Date().toISOString().slice(0, 10))
  const [firstDue, setFirstDue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listUsers().then(setUsers).catch(() => {})
  }, [])

  function calcInstallmentValue(total: string, n: number) {
    const val = (parseFloat(total || '0') / n).toFixed(2)
    setInstallmentValue(val)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!debtorId) { setError('Selecione o devedor'); return }
    setLoading(true)
    setError('')
    try {
      const loan = await createLoan({
        name,
        debtor: parseInt(debtorId),
        amount,
        installments: parseInt(installments),
        installment_value: installmentValue,
        interest_rate: interestRate || null,
        loan_date: loanDate,
        first_due_date: firstDue,
      })
      navigate(`/loans/${loan.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const currentUser = users.find(u => u.id === parseInt(debtorId))

  return (
    <div className="shell">
      <aside style={{ background: '#173d3d' }}>
        <div className="brand">Recibo Fácil</div>
        <div className="user-info" style={{ marginTop: 12 }}>
          <span className="user-avatar"><UserIcon size={18} /></span>
          <div>
            <strong className="user-name">{localStorage.getItem('userName')}</strong>
            <span className="user-email">{localStorage.getItem('userEmail')}</span>
          </div>
        </div>
      </aside>
      <main className="dashboard">
        <header>
          <div>
            <p className="eyebrow">EMPRÉSTIMOS</p>
            <h1>Novo empréstimo</h1>
          </div>
          <button className="primary" onClick={() => navigate(-1)} style={{ background: 'none', color: '#173d3d' }}>
            <ArrowLeft size={18} /> Voltar
          </button>
        </header>

        <form onSubmit={submit} className="loan-form">
          <div className="form-grid">
            <label>
              Nome do empréstimo
              <input value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label>
              Devedor
              <select value={debtorId} onChange={e => setDebtorId(e.target.value)} required>
                <option value="">Selecione...</option>
                {users.filter(u => u.id !== parseInt(localStorage.getItem('userId') || '0')).map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
            </label>
            <label>
              Valor total (R$)
              <input type="number" step="0.01" value={amount}
                onChange={e => { setAmount(e.target.value); calcInstallmentValue(e.target.value, parseInt(installments)) }} required />
            </label>
            <label>
              Parcelas
              <input type="number" min="1" value={installments}
                onChange={e => { setInstallments(e.target.value); calcInstallmentValue(amount, parseInt(e.target.value)) }} required />
            </label>
            <label>
              Valor da parcela (R$)
              <input type="number" step="0.01" value={installmentValue}
                onChange={e => setInstallmentValue(e.target.value)} required />
            </label>
            <label>
              Juros (% ao mês)
              <input type="number" step="0.01" min="0" value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                placeholder="0" />
            </label>
            <label>
              Data do empréstimo
              <input type="date" value={loanDate} onChange={e => setLoanDate(e.target.value)} required />
            </label>
            <label>
              Primeiro vencimento
              <input type="date" value={firstDue} onChange={e => setFirstDue(e.target.value)} required />
            </label>
          </div>

          {error && <small className="form-error">{error}</small>}
          <button className="primary" disabled={loading} style={{ marginTop: 20 }}>
            {loading ? 'Criando...' : 'Criar empréstimo'}
          </button>
        </form>
      </main>
    </div>
  )
}
