import { type LucideIcon } from 'lucide-react'

interface CardProps {
  label: string
  value: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'amber'
}

const money = (x: string | number) =>
  Number(x || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function Card({ label, value, icon: Icon, color }: CardProps) {
  return (
    <article className="card">
      <div>
        <p>{label}</p>
        <strong>{money(value)}</strong>
      </div>
      <span className={`icon ${color}`}><Icon /></span>
    </article>
  )
}
