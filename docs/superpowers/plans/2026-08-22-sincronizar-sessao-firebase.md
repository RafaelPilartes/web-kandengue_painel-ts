# Sincronizar a Sessão do Firebase com o Estado do Painel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o painel reagir quando a sessão do Firebase morre — limpar o estado do admin e a cache de queries, para o guarda de rotas mandar para o login em vez de manter o utilizador num painel onde tudo falha.

**Architecture:** O painel já tem as duas peças: `authService.onAuthChanged(cb)` envolve o `onAuthStateChanged` do Firebase, e `useAdminStore` tem `removeAdmin()`. Falta ligá-las. Um hook subscreve o listener uma vez, e quando o Firebase reporta ausência de utilizador limpa o store e a cache do React Query. O `PrivateRoute`, que já decide com base em `currentAdminData`, passa a redireccionar sozinho.

**Tech Stack:** React 19 + Vite 7, `firebase` v12 (client SDK), Zustand com `persist`, TanStack React Query v5, Vitest.

## Contexto: porque é que isto existe

O smoke manual da Fase 2 passou nos sete testes, mas revelou que a sessão não se renovava sozinha. A investigação mostrou que o refresh do Firebase não é o problema — o problema é o painel ter **duas noções de estar autenticado que não falam uma com a outra**:

- `PrivateRoute` decide com base em `currentAdminData`, um store Zustand **persistido em localStorage**.
- A sessão real vive no Firebase Auth.
- `authService.onAuthChanged` existe e está exportado, mas **ninguém o consome** — zero utilizações em toda a aplicação.

Quando o refresh token morre, o Firebase deixa de ter sessão, mas o localStorage continua a dizer que o admin está autenticado. O guarda mantém-no lá dentro e só as chamadas à API falham. Nada limpa o store, nada redirecciona.

Isto é anterior à Fase 2. A diferença é que antes o pedido seguia anónimo e devolvia um 401 genérico; a Fase 2 fez o `ApiDAO` lançar `'Sessão expirada. Inicie sessão novamente.'`, o que tornou o sintoma legível — e foi assim que apareceu.

## Global Constraints

- **`erasableSyntaxOnly: true`** — proibidas parameter properties (`constructor(private x)`), `enum` e `namespace`.
- **`verbatimModuleSyntax: true`** — imports usados só como tipo têm de usar `import type`.
- **`noUnusedLocals: true` / `noUnusedParameters: true`** — qualquer import ou parâmetro não usado parte o build.
- `strict: true`.
- Verificação de tipos: **`npx tsc -b`** (project references), não `tsc --noEmit`. Baseline verde.
- Testes: `npm run test` (Vitest). Baseline **81 testes** a passar. A suite precisa do emulador Firestore na porta **8090**; os testes desta fase mockam tudo e não precisam dele, mas a suite completa sim.
- Alias `@/` → `src/`.
- Mensagens de UI em português angolano.
- **Não alterar o fluxo de login.** Esta fase trata só do que acontece quando a sessão morre, não de como ela nasce.
- **Não alterar `PrivateRoute`.** Ele já redirecciona quando `currentAdminData` é nulo; o objectivo é dar-lhe a informação certa, não mudar a sua lógica.

---

## Ficheiros: mapa de responsabilidades

**Criar:**

| Ficheiro | Responsabilidade |
| --- | --- |
| `src/hooks/useAuthSessionSync.ts` | Subscreve o Firebase e limpa o estado local quando a sessão morre |
| `src/hooks/__tests__/useAuthSessionSync.test.ts` | Testes do hook |

**Modificar:**

| Ficheiro | Alteração |
| --- | --- |
| `src/App.tsx` | Montar o hook dentro do `QueryClientProvider` |

---

## Task 1: O hook que sincroniza a sessão

**Files:**
- Create: `src/hooks/useAuthSessionSync.ts`
- Test: `src/hooks/__tests__/useAuthSessionSync.test.ts`

**Interfaces:**
- Consumes:
  - `AuthService` de `@/services/auth.service` — **é uma classe, não um singleton**. O padrão do repo é instanciar (`const authService = new AuthService()`), como faz `AuthViewModel.ts:5`. O método é `onAuthChanged(cb: (user: User | null) => void): () => void` e devolve a função de unsubscribe.
  - `useAdminStore` de `@/stores/userStore`, com `currentAdminData` e `removeAdmin()`.
  - `useQueryClient` de `@tanstack/react-query`.
- Produces: `export function useAuthSessionSync(): void`. A Task 2 monta-o.

**Três decisões que o teste fixa:**

1. **Só limpa quando havia estado local para limpar.** Se o Firebase reporta `null` e o store já está vazio, não faz nada — senão, na página de login (onde não há sessão nem admin), o hook dispararia a cada montagem.

2. **Limpa a cache do React Query também.** Sem isso, os dados do admin anterior ficam no cache e o próximo a entrar vê-os antes do primeiro refetch.

3. **Cancela a subscrição ao desmontar.** Um listener órfão do Firebase continua vivo e a disparar.

- [ ] **Step 1: Escrever os testes**

Create `src/hooks/__tests__/useAuthSessionSync.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const onAuthChanged = vi.fn()
const removeAdmin = vi.fn()
const clear = vi.fn()

let currentAdminData: { id: string } | null = { id: 'adm-1' }

vi.mock('@/services/auth.service', () => ({
  AuthService: class {
    onAuthChanged = onAuthChanged
  }
}))

vi.mock('@/stores/userStore', () => ({
  useAdminStore: () => ({ currentAdminData, removeAdmin })
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ clear })
}))

const { useAuthSessionSync } = await import('@/hooks/useAuthSessionSync')

describe('useAuthSessionSync', () => {
  beforeEach(() => {
    onAuthChanged.mockReset()
    removeAdmin.mockReset()
    clear.mockReset()
    currentAdminData = { id: 'adm-1' }
    onAuthChanged.mockReturnValue(() => {})
  })

  it('subscreve o Firebase uma vez ao montar', () => {
    renderHook(() => useAuthSessionSync())

    expect(onAuthChanged).toHaveBeenCalledTimes(1)
  })

  it('limpa o store e a cache quando a sessão morre', () => {
    renderHook(() => useAuthSessionSync())
    const callback = onAuthChanged.mock.calls[0][0]

    callback(null)

    expect(removeAdmin).toHaveBeenCalledTimes(1)
    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('não faz nada quando o Firebase reporta um utilizador', () => {
    renderHook(() => useAuthSessionSync())
    const callback = onAuthChanged.mock.calls[0][0]

    callback({ uid: 'uid-1' })

    expect(removeAdmin).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
  })

  it('não limpa quando já não havia admin no store', () => {
    // Sem esta guarda, o hook dispararia em cada montagem da página de login.
    currentAdminData = null
    renderHook(() => useAuthSessionSync())
    const callback = onAuthChanged.mock.calls[0][0]

    callback(null)

    expect(removeAdmin).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
  })

  it('cancela a subscrição ao desmontar', () => {
    const unsubscribe = vi.fn()
    onAuthChanged.mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useAuthSessionSync())
    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Instalar as dependências de teste de hooks**

Nenhuma das duas existe no repo (verificado):

```bash
npm install -D @testing-library/react@^16 jsdom@^26
```

O `vitest.config.ts` declara `environment: 'node'`, e **não deve ser alterado** —
os testes de emulador dependem dele. Em vez disso, o ficheiro de teste do hook
declara o seu próprio ambiente na primeira linha:

```ts
// @vitest-environment jsdom
```

Essa linha tem de ser mesmo a primeira do ficheiro, antes dos imports.

- [ ] **Step 3: Correr — tem de falhar**

```bash
npm run test -- src/hooks/__tests__/useAuthSessionSync.test.ts
```

Expected: FAIL — módulo `@/hooks/useAuthSessionSync` não existe.

- [ ] **Step 4: Implementar**

Create `src/hooks/useAuthSessionSync.ts`:

```ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthService } from '@/services/auth.service'
import { useAdminStore } from '@/stores/userStore'

// Instanciada uma vez a nível de módulo: o serviço não tem estado, e criar
// uma por render faria o useEffect resubscrever a cada renderização.
const authService = new AuthService()

/**
 * Mantém o estado local do painel alinhado com a sessão real do Firebase.
 *
 * O `PrivateRoute` decide com base em `currentAdminData`, que vive num store
 * Zustand persistido em localStorage. A sessão real vive no Firebase Auth.
 * Sem esta ligação, um refresh token morto deixa o localStorage a dizer que o
 * admin está autenticado enquanto todas as chamadas à API falham — e nada
 * redirecciona para o login.
 */
export function useAuthSessionSync(): void {
  const queryClient = useQueryClient()
  const { currentAdminData, removeAdmin } = useAdminStore()

  useEffect(() => {
    const unsubscribe = authService.onAuthChanged(user => {
      if (user) return

      // Só limpa se havia algo para limpar: na página de login não há sessão
      // nem admin, e sem esta guarda o hook disparava a cada montagem.
      if (!currentAdminData) return

      // A cache tem de ir também, senão o próximo admin a entrar vê os dados
      // do anterior até ao primeiro refetch.
      removeAdmin()
      queryClient.clear()
    })

    return unsubscribe
  }, [currentAdminData, removeAdmin, queryClient])
}
```

- [ ] **Step 5: Correr — tem de passar**

```bash
npm run test -- src/hooks/__tests__/useAuthSessionSync.test.ts
```

Expected: `5 passed`.

- [ ] **Step 6: Verificar tipos, suite e commitar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
git add src/hooks vitest.config.ts package.json package-lock.json
git commit -m "feat: hook que sincroniza a sessao do Firebase com o estado do painel"
```

---

## Task 2: Montar o hook

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAuthSessionSync` (Task 1).
- Produces: nada consumido por outras tasks.

**Onde montar, e porquê:** o hook usa `useQueryClient()`, portanto tem de estar **dentro** do `QueryClientProvider`. Como `App` é quem cria o provider, o hook não pode ser chamado no corpo de `App` — ficaria fora do contexto. A solução é um componente interno mínimo.

- [ ] **Step 1: Substituir `src/App.tsx`**

```tsx
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
```

- [ ] **Step 2: Verificar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
npm run build
echo "build exit=$?"
```

Expected: `tsc ok`, suite verde, `exit=0`.

- [ ] **Step 3: Commitar**

```bash
git add src/App.tsx
git commit -m "feat: montar o sincronizador de sessao dentro do QueryClientProvider"
```

---

## Task 3: Provar que funciona no ecrã

**Files:**
- Nenhum a modificar. Verificação.

**Interfaces:**
- Consumes: tudo das Tasks 1–2.
- Produces: a evidência de que a fase está feita.

- [ ] **Step 1: Confirmar que ninguém mais duplica esta lógica**

```bash
grep -rn "onAuthChanged\|onAuthStateChanged" src | grep -v "auth.service.ts"
```

Expected: só `useAuthSessionSync.ts` e o seu teste. Se aparecer outro consumidor, listar no relatório — significa que havia uma segunda tentativa de resolver isto.

- [ ] **Step 2: Confirmar que o `PrivateRoute` não foi tocado**

```bash
git diff main --stat -- src/routes/PrivateRoute.tsx
```

Expected: vazio. A lógica de redireccionamento dele não muda; só passa a receber a informação certa.

- [ ] **Step 3: Build e suite**

```bash
npx tsc -b && npm run build && npm run test
```

- [ ] **Step 4: Smoke manual — o dono executa**

**Não tentar automatizar.** Exige emuladores, API local e sessão de admin no browser. Registar no relatório que ficou para o dono, com esta lista:

1. Entrar no painel normalmente. Navegar para qualquer ecrã.
2. Com a aplicação aberta, **reiniciar o emulador Auth** (Ctrl+C no terminal dos emuladores e arrancar outra vez). Isso invalida o refresh token, que é exactamente o cenário que causou o problema.
3. Voltar ao separador do painel e fazer uma acção que chame a API — aprovar um carregamento, por exemplo.
4. **Esperado:** ser mandado para o ecrã de login, em vez de ficar num painel onde tudo falha com "Sessão expirada".
5. Entrar de novo. Confirmar que os dados que aparecem são os da sessão nova — em particular que nenhum ecrã mostra dados carregados antes do reinício.

O passo 5 é o que prova a limpeza da cache. Sem ela, o React Query serviria os dados antigos até ao primeiro refetch.

- [ ] **Step 5: Relatório**

Não há código a commitar. Se o Step 1 revelar outro consumidor, tratá-lo como achado e reportar em vez de o corrigir aqui.

---

## Fecho

Depois disto, o painel tem uma só noção de estar autenticado. O `PrivateRoute` continua a decidir pelo store, mas o store passa a seguir o Firebase.

Fica um follow-up conhecido, fora de âmbito: o caminho inverso — Firebase com sessão e store vazio — continua sem tratamento. Acontece se o localStorage for limpo com a sessão viva, e resolve-se entrando de novo. Não é o cenário que motivou esta fase.
