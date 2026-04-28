# Padrões de Código — Painel Administrativo

## Linguagem e Ferramentas

- **TypeScript** strict em toda a codebase
- **ESLint** para linting
- **Tailwind CSS** para estilização — sem CSS-in-JS ou ficheiros `.css` por componente

## Nomenclatura

| Elemento          | Convenção                   | Exemplo                      |
| ----------------- | --------------------------- | ---------------------------- |
| Componentes React | PascalCase                  | `RideDetailsDrawer.tsx`      |
| Pages             | PascalCase + localização    | `pages/main/Rides/index.tsx` |
| ViewModels        | camelCase + `.viewmodel.ts` | `ride.viewmodel.ts`          |
| Services          | camelCase + `.service.ts`   | `finance.service.ts`         |
| Hooks             | `use` + PascalCase          | `useRidesFilter.ts`          |
| Stores            | camelCase + `.store.ts`     | `dashboard.store.ts`         |
| Entities          | PascalCase                  | `Ride.ts`, `Driver.ts`       |
| Interfaces        | `I` + PascalCase            | `IRide.ts`, `IDriver.ts`     |
| Firestore fields  | snake_case                  | `created_at`, `driver_id`    |

## Regras MVVM

```
✅ Page → importa apenas hooks de ViewModel
✅ ViewModel → usa React Query + chama Service
✅ Service → chama Repository (modules/Api/)
✅ Repository → acede ao Firestore / Axios
❌ Page → nunca importa de modules/Api/ directamente
❌ ViewModel → nunca tem renderização JSX
❌ Service → nunca importa de React (hooks, etc.)
```

## Regras de Segurança (Admin)

```typescript
// ✅ Verificar role antes de qualquer operação destrutiva
if (admin?.role !== 'superadmin') {
  throw new Error('Permissão insuficiente para esta operação')
}

// ✅ Usar audit.service para registar todas as acções admin
await AuditService.log({
  action: 'update',
  entity: 'driver',
  entityId: driverId,
  adminId: admin.id,
  details: 'Status alterado para suspended'
})
```

## Padrão de Componente de Tabela

```tsx
// Padrão para listas com paginação e filtros:
function DriversTable() {
  const { filters, setFilters } = useDriversFilterStore()
  const { drivers, isLoading, totalPages } = useDriversViewModel(filters)

  return (
    <div>
      <DriversFilter filters={filters} onChange={setFilters} />
      <DataTable data={drivers} isLoading={isLoading} columns={columns} />
      <Pagination totalPages={totalPages} />
    </div>
  )
}
```

## Checklist antes de Commit

- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm run lint` sem erros críticos
- [ ] Acções destrutivas verificam role do admin
- [ ] Acções importantes registadas via `audit.service.ts`
- [ ] Exports Excel/PDF testados com dados reais
- [ ] Leaflet mapas carregam correctamente (SSR não aplicável — Vite SPA)

---

**Anterior**: [07 — Exportação](07-export.md) | **Próximo**: [09 — Troubleshooting](09-troubleshooting.md)
