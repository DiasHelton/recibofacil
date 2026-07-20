import { useState } from 'react'
import { Wallet } from 'lucide-react'

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>
  onSwitchToRegister: () => void
}

export function LoginForm({ onLogin, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch {
      setError('E-mail ou senha inválidos')
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
        <h2>Entrar</h2>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <small>{error}</small>}
        <button disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        <p className="muted">
          Não tem conta?{' '}
          <button type="button" className="link" onClick={onSwitchToRegister} style={{ padding: 0, fontSize: 12 }}>
            Cadastre-se
          </button>
        </p>
      </form>
    </main>
  )
}
