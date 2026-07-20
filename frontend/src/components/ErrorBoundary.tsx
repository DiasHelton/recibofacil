import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
          <h2 style={{ color: '#b04c4c' }}>Erro na aplicação</h2>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            style={{ marginTop: 16, padding: '10px 20px', cursor: 'pointer' }}
          >
            Limpar dados e recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
