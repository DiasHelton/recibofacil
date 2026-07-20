import { useEffect, useState } from 'react'
import { Sidebar } from '../components/Layout/Sidebar'
import { listReceipts, signReceipt } from '../api/receipts'
import type { Receipt } from '../types'

interface ReceiptsProps {
  onLogout: () => void
}

const statusLabel: Record<string, string> = {
  valid: 'Válido',
  cancelled: 'Cancelado',
}

const methodLabel: Record<string, string> = {
  pix: 'PIX', cash: 'Dinheiro', ted: 'TED', doc: 'DOC', card: 'Cartão', other: 'Outro',
}

function money(x: string | number) {
  return Number(x || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function Receipts({ onLogout }: ReceiptsProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [signingId, setSigningId] = useState<number | null>(null)
  const [signPassword, setSignPassword] = useState('')
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    listReceipts().then(setReceipts).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSign(id: number) {
    if (!signPassword) { setError('Digite sua senha.'); return }
    setError('')
    try {
      await signReceipt(id, signPassword)
      setSigningId(null)
      setSignPassword('')
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="shell">
      <Sidebar onLogout={onLogout} />
      <main className="dashboard">
        <header>
          <div>
            <p className="eyebrow">RECIBOS</p>
            <h1>Meus recibos</h1>
          </div>
        </header>

        {loading ? (
          <p className="empty">Carregando...</p>
        ) : receipts.length === 0 ? (
          <p className="empty">Nenhum recibo encontrado.</p>
        ) : (
          <div className="receipt-list">
            {receipts.map(r => (
              <article key={r.id} className={`receipt-row ${r.status}`}>
                <div className="receipt-info">
                  <strong>{r.loan_name}</strong>
                  <span className="receipt-installment">Parcela {r.installment_number}/{r.installment_total}</span>
                  <span className="receipt-amount">{money(r.amount)}</span>
                  <span className="receipt-date">{new Date(r.payment_date + 'T12:00').toLocaleDateString('pt-BR')}</span>
                  <span className="receipt-method">{methodLabel[r.payment_method] || r.payment_method}</span>
                  <span className={`status-badge ${r.status}`}>{statusLabel[r.status] || r.status}</span>
                  {r.document_hash ? (
                    <span className="receipt-hash" title={r.document_hash}>
                      #{r.number.slice(0, 8)}
                    </span>
                  ) : (
                    <span className="receipt-pending">Aguardando assinaturas</span>
                  )}
                </div>
                <div className="receipt-actions">
                  {r.document_hash ? (
                    <a
                      href={`/api/receipts/${r.id}/document/?token=${localStorage.getItem('token')}`}
                      target="_blank"
                      className="primary"
                      style={{ textDecoration: 'none', fontSize: 13, padding: '8px 14px' }}
                    >
                      Ver recibo
                    </a>
                  ) : (
                    <>
                      {signingId === r.id ? (
                        <div className="sign-form">
                          <input type="password" value={signPassword} onChange={e => setSignPassword(e.target.value)} placeholder="sua senha" />
                          <button className="primary" onClick={() => handleSign(r.id)}>
                            Assinar
                          </button>
                          <button className="link" onClick={() => { setSigningId(null); setSignPassword('') }}>Cancelar</button>
                        </div>
                      ) : (
                        <button className="pay-btn" onClick={() => setSigningId(r.id)}>
                          Assinar
                        </button>
                      )}
                    </>
                  )}
                </div>
                {error && signingId === r.id && <small className="form-error">{error}</small>}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
