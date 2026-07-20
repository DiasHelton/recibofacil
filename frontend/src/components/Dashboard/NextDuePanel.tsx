import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface NextDuePanelProps {
  nextDue?: {
    due_date: string
    amount: string
    number: number
    loan: number
  }
}

const money = (x: string | number) =>
  Number(x || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function NextDuePanel({ nextDue }: NextDuePanelProps) {
  const navigate = useNavigate()

  return (
    <article className="panel due">
      <h2>Próximo vencimento</h2>
      {nextDue ? (
        <>
          <div className="date">
            {new Date(nextDue.due_date + 'T12:00').toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })}
          </div>
          <h3>Parcela {nextDue.number}</h3>
          <strong>{money(nextDue.amount)}</strong>
          <button onClick={() => navigate(`/loans/${nextDue.loan}`)}>
            Ver empréstimo <ChevronRight size={16} />
          </button>
        </>
      ) : (
        <p className="empty">Nenhuma parcela pendente.</p>
      )}
    </article>
  )
}
