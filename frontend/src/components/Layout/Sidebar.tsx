import { Wallet, User, LayoutDashboard, HandCoins, ReceiptText, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

interface SidebarProps {
  onLogout: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
  const userName = localStorage.getItem('userName') || 'Usuário'
  const userEmail = localStorage.getItem('userEmail') || ''
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <aside className={menuOpen ? 'open' : ''}>
        <div className="brand"><Wallet /> Recibo Fácil</div>

        <div className="user-info">
          <span className="user-avatar"><User size={18} /></span>
          <div>
            <strong className="user-name">{userName}</strong>
            <span className="user-email">{userEmail}</span>
          </div>
        </div>

        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>
            <LayoutDashboard size={18} /> Visão geral
          </NavLink>
          <NavLink to="/loans" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>
            <HandCoins size={18} /> Empréstimos
          </NavLink>
          <NavLink to="/receipts" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>
            <ReceiptText size={18} /> Recibos
          </NavLink>
          <button className="logout" onClick={() => { setMenuOpen(false); onLogout() }}>
            <LogOut size={18} /> Sair
          </button>
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-top">
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="mobile-brand"><Wallet size={16} /> Recibo Fácil</span>
        <button className="hamburger" onClick={onLogout}><LogOut size={18} /></button>
      </div>

      {/* Mobile overlay */}
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  )
}
