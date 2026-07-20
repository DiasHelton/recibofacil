interface ProgressPanelProps {
  total: number
  paid: number
  pending: number
}

export function ProgressPanel({ total, paid, pending }: ProgressPanelProps) {
  const pct = total ? Math.round((paid / total) * 100) : 0

  return (
    <article className="panel progress">
      <h2>Progresso das parcelas</h2>
      <div className="ring">
        <b>{pct}%</b>
        <span>quitado</span>
      </div>
      <p><b>{paid}</b> de {total} parcelas pagas</p>
      <div className="bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="legend">
        <span><i /> Pagas</span>
        <span><i /> Pendentes ({pending})</span>
      </div>
    </article>
  )
}
