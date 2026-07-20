import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { register as apiRegister } from '../../api/auth'

interface RegisterFormProps {
  onRegister: () => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Senhas não conferem.')
      return
    }
    setLoading(true)
    try {
      await apiRegister(name, email, password)
      onRegister()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth">
      <section>
        <span className="mark"><Wallet /></span>
        <h1>Recibo Fácil</h1>
        <p>Empréstimos claros. Recibos seguros.</p>
      </section>
      <form onSubmit={submit}>
        <h2>Criar conta</h2>
        <label>
          Nome
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <label>
          E-mail
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        </label>
        <label>
          Confirmar senha
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
        </label>
        {error && <small>{error}</small>}
        <button disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button>
        <p className="muted">
          Já tem conta?{' '}
          <button type="button" className="link" onClick={onSwitchToLogin} style={{ padding: 0, fontSize: 12 }}>
            Entrar
          </button>
        </p>
      </form>
    </main>
  )
}
