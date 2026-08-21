import { AppProvider } from './provider/AppProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router } from './routes/Routes'
import { useAuthSessionSync } from './hooks/useAuthSessionSync'

const queryClient = new QueryClient()

/**
 * Existe para o hook correr dentro do QueryClientProvider — `useQueryClient()`
 * precisa do contexto que `App` só cria à sua volta.
 */
function AuthSessionGate() {
  useAuthSessionSync()
  return <Router />
}

export function App() {
  return (
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <AuthSessionGate />
      </QueryClientProvider>
    </AppProvider>
  )
}
