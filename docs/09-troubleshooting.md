# Troubleshooting — Painel Administrativo

## Problemas de Autenticação

### ❌ Admin não consegue fazer login

1. Verificar que o utilizador existe no Firebase Auth
2. Verificar que o documento `users/{uid}` existe no Firestore com `role: 'admin'`
3. Verificar as variáveis de ambiente `VITE_FIREBASE_*` no `.env`

### ❌ Redirecionado para login após entrar

O serviço de auth verificou que o `role` não é `'admin'`. Confirmar no Firestore:

```javascript
// Firestore Console: users/{uid}
{ role: 'admin', status: 'active' }
```

---

## Problemas de Dados

### ❌ Listas não carregam (Firestore `permission-denied`)

1. Verificar as Firestore Security Rules — o utilizador deve ter `role: 'admin'`
2. Confirmar que o utilizador está autenticado antes da query
3. Verificar se a coleção existe e tem documentos

### ❌ Gráficos Chart.js não renderizam

1. Verificar que os dados não são `undefined` (usar `isLoading` + loading state)
2. Confirmar que os dados têm o formato correcto para o tipo de gráfico
3. Verificar que o canvas não tem `height: 0`

### ❌ Mapa Leaflet não aparece (CSS missing)

Importar o CSS do Leaflet no entry point:

```typescript
// main.tsx ou App.tsx
import 'leaflet/dist/leaflet.css'
```

Sem este import, o mapa renderiza sem estilo e sem tiles.

---

## Problemas de Exportação

### ❌ Download Excel não funciona

Verificar que `file-saver` está instalado:

```bash
npm install file-saver @types/file-saver
```

```typescript
import { saveAs } from 'file-saver'
```

### ❌ PDF em branco

Verificar que os dados estão carregados antes de chamar `exportFinancialReport`. O jsPDF opera de forma síncrona — não suporta async callbacks na geração.

---

## Problemas de Performance

### ❌ Dashboard lento com muitas corridas

1. Adicionar paginação às queries Firestore (`.limit(50)`)
2. Usar `startAfter` para cursor-based pagination
3. Adicionar índices compostos no `firestore.indexes.json` do backend

### ❌ React Query refetching demasiado

Aumentar `staleTime` para dados históricos que não mudam frequentemente:

```typescript
useQuery({
  queryKey: ['rides', 'history'],
  staleTime: 5 * 60_000 // 5 minutos para histórico
})
```

---

**Anterior**: [08 — Padrões de Código](08-code-standards.md) | **Próximo**: [10 — Roadmap](10-roadmap.md)
