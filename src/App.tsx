import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
        {/*
          Um único contentor para a aplicação inteira. Havia dezanove
          espalhados por páginas e modais: com mais do que um montado ao
          mesmo tempo, o mesmo toast aparecia repetido em cada um deles.
        */}
        <ToastContainer position="top-right" autoClose={3000} />
      </QueryClientProvider>
    </AppProvider>
  )
}
