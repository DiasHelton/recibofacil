import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginForm } from './components/Auth/LoginForm'
import { RegisterForm } from './components/Auth/RegisterForm'
import { Dashboard } from './pages/Dashboard'
import { Loans } from './pages/Loans'
import { LoanDetail } from './pages/LoanDetail'
import { NewLoan } from './pages/NewLoan'
import { Receipts } from './pages/Receipts'
import { useAuth } from './hooks/useAuth'
import { ErrorBoundary } from './components/ErrorBoundary'
import './style.css'

function ProtectedApp() {
  const { isAuthenticated, login, logout } = useAuth()
  const [ready, setReady] = useState(isAuthenticated)
  const [showRegister, setShowRegister] = useState(false)

  if (!ready) {
    if (showRegister) {
      return (
        <RegisterForm
          onRegister={() => setReady(true)}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      )
    }
    return (
      <LoginForm
        onLogin={async (email, password) => {
          await login(email, password)
          setReady(true)
        }}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    )
  }

  const handleLogout = () => {
    logout()
    setReady(false)
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/loans" element={<Loans onLogout={handleLogout} />} />
        <Route path="/loans/new" element={<NewLoan />} />
        <Route path="/loans/:id" element={<LoanDetail onLogout={handleLogout} />} />
        <Route path="/receipts" element={<Receipts onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <ProtectedApp />
    </BrowserRouter>
  )
}
