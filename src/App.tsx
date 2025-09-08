import { AppProvider } from './provider/AppProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router } from './routes/Routes'

const queryClient = new QueryClient()

export function App() {
  return (
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </AppProvider>
  )
}
