# Gestão de Estado — Painel Administrativo

## Camadas de Estado

```
┌──────────────────────────────────────────┐
│  React Query (server state — principal)  │
│  Corridas, motoristas, finanças, missões │
├──────────────────────────────────────────┤
│  Zustand (estado global de UI)           │
│  Filtros activos, paginação, selecção    │
├──────────────────────────────────────────┤
│  useState (estado local de componente)   │
│  Formulários, modais, drawers            │
└──────────────────────────────────────────┘
```

---

## React Query — Convenções

Todas as queries seguem o padrão de `queryKey` hierárquico:

```typescript
// Listas com filtros
queryKey: ['rides', { status, dateRange, driverId }]
queryKey: ['drivers', { status: 'pending' }]
queryKey: ['transactions', { walletId, type }]

// Entidades individuais
queryKey: ['ride', rideId]
queryKey: ['driver', driverId]
queryKey: ['wallet', driverId]

// Métricas do dashboard
queryKey: ['metrics', 'today']
queryKey: ['metrics', 'monthly', month, year]
```

### Configuração Global

```typescript
// provider/QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minuto para listas operacionais
      refetchOnWindowFocus: true,
      retry: 2
    }
  }
})
```

---

## Zustand — Stores do Dashboard

### DashboardStore

```typescript
interface DashboardStore {
  // Filtros globais de data (afectam múltiplas secções)
  dateRange: { start: Date; end: Date }
  setDateRange: (range: { start: Date; end: Date }) => void

  // Selecção de entidade para detalhes
  selectedRideId: string | null
  selectedDriverId: string | null
  setSelectedRide: (id: string | null) => void
  setSelectedDriver: (id: string | null) => void
}
```

### AuthStore (Admin)

```typescript
interface AdminAuthStore {
  admin: AdminInterface | null
  isAuthenticated: boolean
  setAdmin: (admin: AdminInterface | null) => void
}
```

---

## Padrão de ViewModel para o Dashboard

```typescript
// viewModels/ride.viewmodel.ts
export function useRidesViewModel(filters: RideFilters) {
  // 1. Server state
  const {
    data: rides,
    isLoading,
    error
  } = useQuery({
    queryKey: ['rides', filters],
    queryFn: () => RideService.getFiltered(filters),
    staleTime: 30_000
  })

  // 2. Mutations (ex: cancelar corrida)
  const { mutate: cancelRide } = useMutation({
    mutationFn: (rideId: string) => RideService.cancel(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] })
    }
  })

  // 3. Métricas derivadas (calculadas no cliente)
  const totalRevenue = useMemo(
    () => rides?.reduce((sum, r) => sum + (r.fare?.total ?? 0), 0),
    [rides]
  )

  return { rides, isLoading, error, cancelRide, totalRevenue }
}
```

---

## Side Panel (Drawer) — Detalhes de Corrida

O painel de detalhes de corrida é um drawer lateral com:

```
RideDetailsDrawer
  ├── Cabeçalho (ID, status, datas)
  ├── Mapa Leaflet (rota percorrida)
  ├── FinancialBreakdown
  │   ├── fare.total
  │   ├── fare.breakdown (base_fare, distance_cost, wait_cost)
  │   └── fare.payouts (driver_earnings, company_earnings, pension_fund)
  ├── ProofImages (proof_pickup_photo, proof_dropoff_photo)
  └── Timeline (created_at → completed_at/canceled_at)
```

---

**Anterior**: [05 — Firebase](05-firebase.md) | **Próximo**: [07 — Exportação](07-export.md)
