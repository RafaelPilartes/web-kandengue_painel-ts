# Fase 2 — O Painel Deixa de Escrever Dinheiro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer as quatro operações de dinheiro do painel chamarem os endpoints admin da API, e apagar do painel todo o código que escreve saldos, transacções ou estados de saque directamente no Firestore.

**Architecture:** A Fase 1 já pôs na API quatro operações transaccionais, idempotentes e auditadas, atrás de `adminAuthMiddleware`. Esta fase liga o painel a elas: um interceptor no cliente axios injecta o ID token, um DAO REST expõe as quatro chamadas atrás de um port, e os ViewModels passam a usá-lo. As leituras continuam a ir directamente ao Firestore — só as escritas de dinheiro mudam de caminho.

**Tech Stack:** React 19 + Vite 7, `firebase` v12 (client SDK), axios, TanStack React Query v5, Vitest.

## Contexto: o que se está a apagar

Aprovar um carregamento manual (`Finances/walletTopupRequest.tsx`) são hoje três escritas independentes: marcar `approved`, ler a carteira e escrever `balance = balance + amount` calculado em JS, criar a transacção. Se a segunda falhar, o pedido fica aprovado sem dinheiro creditado; nada verifica se já estava aprovado, portanto aprovar duas vezes credita duas vezes; e como o saldo é escrito por valor absoluto, duas operações concorrentes perdem uma.

As três acções de saque (`withdrawal.dao.ts`) são transacções `runTransaction` **do lado do cliente**. A rejeição reverte todos os `earning_ids` para `pending` sem olhar ao estado de cada um — um earning já pago volta a ficar levantável.

A API já resolve os dois casos. Esta fase só corta o caminho antigo.

## Global Constraints

- **Prazo:** as Security Rules do projecto expiram a **2026-11-11**. A Fase 4 depende desta. Hoje é 2026-08-19.
- **Só mudam as escritas de dinheiro.** As leituras (`getAll`, `getById`, `countByStatus`, `getEarningsByIds`) continuam a ir ao Firestore directamente.
- **O `adminId` deixa de ser enviado pelo painel.** A API tira-o do ID token verificado. Qualquer sítio que hoje passe `adminId` a uma operação de dinheiro deixa de o fazer.
- **Auditoria: só a da API.** Decisão do dono. As quatro mutações de dinheiro perdem o `withAudit` — o registo em `walletAuditLogs` é escrito dentro da transacção do servidor e não pode existir sem o movimento. As restantes mutações do painel (motoristas, veículos, missões) mantêm `withAudit` e não são tocadas.
- **`markWithdrawalPaid` exige `approved`.** A API recusa pagar um saque em `pending`; o painel hoje permite-o. A UI tem de mudar — não é migração drop-in.
- **`erasableSyntaxOnly: true`** — proibidas parameter properties (`constructor(private x)`), `enum` e `namespace`.
- **`verbatimModuleSyntax: true`** — imports usados só como tipo têm de usar `import type`.
- **`noUnusedLocals: true` / `noUnusedParameters: true`** — qualquer import ou parâmetro não usado parte o build. Esta fase apaga muito código; contar com isto.
- Verificação de tipos: **`npx tsc -b`** (project references), não `tsc --noEmit`. Baseline verde.
- Testes: `npm run test` (Vitest). Baseline 68 testes a passar.
- Alias `@/` → `src/`.
- Mensagens de UI em português angolano.

---

## Ficheiros: mapa de responsabilidades

**Criar:**

| Ficheiro | Responsabilidade |
| --- | --- |
| `src/core/interfaces/IAdminMoneyRepository.ts` | Port das quatro operações |
| `src/modules/Api/rest/adminMoney.dao.ts` | Implementação REST do port |
| `src/modules/Api/rest/__tests__/Api.dao.test.ts` | Testes do interceptor de auth |
| `src/modules/Api/rest/__tests__/adminMoney.dao.test.ts` | Testes do DAO REST |

**Modificar:**

| Ficheiro | Alteração |
| --- | --- |
| `src/modules/Api/rest/api.server.ts` | `ApiServer` passa a ler `VITE_API_URL` |
| `src/modules/Api/rest/Api.dao.ts` | Interceptor que injecta o ID token |
| `.env.example` | Acrescentar `VITE_API_URL` |
| `src/modules/Api/index.ts` | Exportar `adminMoneyRepository` |
| `src/services/withdrawal.service.ts` | `approve`/`reject`/`markAsPaid` passam a REST |
| `src/modules/Api/firebase/withdrawal.dao.ts` | Remover as três `runTransaction` |
| `src/core/interfaces/IWithdrawalRepository.ts` | Remover os três métodos do port |
| `src/viewModels/WithdrawalViewModel.ts` | Sem `withAudit`, sem `adminId` |
| `src/pages/main/Referral/WithdrawalDetails.tsx` | `canPay` só `approved` |
| `src/viewModels/WalletTopupRequestViewModel.ts` | Mutation `approveTopup` via API |
| `src/pages/main/Finances/walletTopupRequest.tsx` | Aprovação passa a uma chamada |
| `src/viewModels/TransactionViewModel.ts` | Remover `updateBalanceAndAddTransaction` |

---

## Task 1: Base URL configurável e injecção do ID token

**Files:**
- Modify: `src/modules/Api/rest/api.server.ts`
- Modify: `src/modules/Api/rest/Api.dao.ts`
- Modify: `.env.example`
- Test: `src/modules/Api/rest/__tests__/Api.dao.test.ts`

**Interfaces:**
- Consumes: `auth` de `@/config/firebase.config`.
- Produces: `ApiDAO` (default export) passa a injectar `Authorization: Bearer <idToken>` em todos os pedidos automaticamente. Um `Authorization` passado explicitamente nos headers continua a ganhar. As Tasks 2+ deixam de precisar de passar token.

**Porque é que isto vem primeiro:** o `ApiDAO` nunca anexou `Authorization` — os headers são passados chamada a chamada, e só um sítio o faz hoje (`notification.service.ts` obtém o token e passa-o ao `PushNotificationDAO`). Sem interceptor, todas as chamadas desta fase levam 401.

**E porque é que a base URL muda ao mesmo tempo:** `ApiServer` é a URL de produção no Railway, hardcoded. Em dev o painel liga-se aos emuladores, portanto o `getIdToken()` devolve um token do emulador Auth, que a API de produção rejeita. Sem `VITE_API_URL`, esta fase é impossível de testar localmente.

- [ ] **Step 1: Escrever os testes do interceptor**

Create `src/modules/Api/rest/__tests__/Api.dao.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getIdToken = vi.fn()

let currentUser: { getIdToken: typeof getIdToken } | null = { getIdToken }

vi.mock('@/config/firebase.config', () => ({
  auth: {
    get currentUser() {
      return currentUser
    }
  }
}))

const axiosRequest = vi.fn()
vi.mock('axios', () => ({
  default: Object.assign(
    (config: unknown) => axiosRequest(config),
    { create: vi.fn() }
  )
}))

const ApiDAO = (await import('@/modules/Api/rest/Api.dao')).default

describe('ApiDAO — injecção do ID token', () => {
  beforeEach(() => {
    axiosRequest.mockReset()
    axiosRequest.mockResolvedValue({ data: { ok: true } })
    getIdToken.mockReset()
    getIdToken.mockResolvedValue('token-abc')
    currentUser = { getIdToken }
  })

  it('anexa Authorization em POST sem headers explícitos', async () => {
    await ApiDAO.post('/api/v1/x', { a: 1 })

    expect(axiosRequest).toHaveBeenCalledTimes(1)
    const config = axiosRequest.mock.calls[0][0]
    expect(config.headers.Authorization).toBe('Bearer token-abc')
  })

  it('anexa Authorization em GET', async () => {
    await ApiDAO.get('/api/v1/x')

    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toBe(
      'Bearer token-abc'
    )
  })

  it('preserva os headers que o chamador passou', async () => {
    await ApiDAO.post('/api/v1/x', { a: 1 }, { 'X-Custom': 'v' })

    const headers = axiosRequest.mock.calls[0][0].headers
    expect(headers['X-Custom']).toBe('v')
    expect(headers.Authorization).toBe('Bearer token-abc')
  })

  it('um Authorization explícito ganha ao injectado', async () => {
    await ApiDAO.post('/api/v1/x', {}, { Authorization: 'Bearer manual' })

    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toBe(
      'Bearer manual'
    )
  })

  it('não anexa nada quando não há sessão', async () => {
    currentUser = null

    await ApiDAO.get('/api/v1/x')

    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })

  it('falha com mensagem clara se o token não renovar numa sessão activa', async () => {
    getIdToken.mockRejectedValue(new Error('network'))

    // Mascarar isto como pedido anónimo daria um 401 genérico ao admin.
    await expect(ApiDAO.get('/api/v1/x')).rejects.toThrow(/Sessão expirada/)
    expect(axiosRequest).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Correr — tem de falhar**

```bash
npm run test -- src/modules/Api/rest/__tests__/Api.dao.test.ts
```

Expected: FAIL — o `Authorization` não é anexado, portanto o primeiro teste falha com `undefined`.

- [ ] **Step 3: Tornar a base URL configurável**

Substituir todo o conteúdo de `src/modules/Api/rest/api.server.ts` por:

```ts
// Em dev o painel liga-se aos emuladores, portanto o ID token vem do Auth
// emulador — a API de produção rejeita-o. `VITE_API_URL` permite apontar
// ao Fastify local. Sem a variável, cai na produção (comportamento antigo).
export const ApiServer =
  import.meta.env.VITE_API_URL ??
  'https://node-fastify-kandengueatrevido-ts-production.up.railway.app'
```

Acrescentar ao `.env.example`:

```env
# URL da API Fastify. Em dev aponta ao Fastify local, senão o ID token do
# emulador é rejeitado pela API de produção.
VITE_API_URL=http://localhost:3000
```

- [ ] **Step 4: Injectar o token no `ApiDAO`**

Em `src/modules/Api/rest/Api.dao.ts`, acrescentar o import e substituir o método `request` privado. Tudo o resto do ficheiro fica igual:

```ts
import { auth } from '@/config/firebase.config'
```

```ts
  /**
   * Obtém o ID token da sessão.
   *
   * Distingue dois casos que não são o mesmo: sem sessão, o pedido segue sem
   * header e quem exigir autenticação responde 401 — que é a mensagem certa
   * para um endpoint público. Com sessão mas token irrenovável (revogada,
   * rede, relógio), mascarar isso como pedido anónimo dava ao admin um 401
   * genérico a meio de uma aprovação de dinheiro.
   */
  private async authHeader(): Promise<Record<string, string>> {
    const user = auth.currentUser
    if (!user) return {}

    try {
      return { Authorization: `Bearer ${await user.getIdToken()}` }
    } catch {
      throw new Error('Sessão expirada. Inicie sessão novamente.')
    }
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    // Fora do try/catch de baixo de propósito: um erro daqui (sessão
    // expirada) não é um erro de rede/HTTP e não pode ser remapeado para
    // "Error in request setup" — o admin precisa da mensagem real.
    // Os headers do chamador vêm depois, para um Authorization explícito
    // continuar a ganhar — `pushNotification.dao.ts` passa o seu.
    const merged = { ...(await this.authHeader()), ...headers }

    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `${this.baseUrl}${url}`,
        data,
        headers: merged
      })
      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          error.response.data?.message ||
            error.response.data?.msg ||
            'Unknown error'
        )
      } else if (error.request) {
        throw new Error('No response from server')
      } else {
        throw new Error('Error in request setup')
      }
    }
  }
```

- [ ] **Step 5: Correr — tem de passar**

```bash
npm run test -- src/modules/Api/rest/__tests__/Api.dao.test.ts
```

Expected: `6 passed`.

- [ ] **Step 6: Verificar tipos, suite e commitar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
git add src/modules/Api/rest .env.example
git commit -m "feat: ApiDAO injecta o ID token e a base URL passa a configuravel"
```

---

## Task 2: Port e DAO REST das operações de dinheiro

**Files:**
- Create: `src/core/interfaces/IAdminMoneyRepository.ts`
- Create: `src/modules/Api/rest/adminMoney.dao.ts`
- Modify: `src/modules/Api/index.ts`
- Test: `src/modules/Api/rest/__tests__/adminMoney.dao.test.ts`

**Interfaces:**
- Consumes: `ApiDAO` (Task 1), que já injecta o token.
- Produces:
  - `interface IAdminMoneyRepository` com
    `approveTopup(topupId: string): Promise<{ credited: boolean; balance: number }>`,
    `approveWithdrawal(id: string): Promise<{ changed: boolean }>`,
    `rejectWithdrawal(id: string, reason: string): Promise<{ changed: boolean; revertedEarnings: number }>`,
    `markWithdrawalPaid(id: string): Promise<{ changed: boolean; paidEarnings: number }>`
  - `class AdminMoneyDAO implements IAdminMoneyRepository`
  - `export const adminMoneyRepository: IAdminMoneyRepository` em `src/modules/Api/index.ts`

  As Tasks 3 e 5 consomem `adminMoneyRepository`.

**As rotas da API** (Fase 1, já em produção no repo `node-fastify-kandengue_atrevido-ts`):

- `POST /api/v1/admin/topups/:topupId/approve`
- `POST /api/v1/admin/withdrawals/:withdrawalId/approve`
- `POST /api/v1/admin/withdrawals/:withdrawalId/reject` — body `{ reason: string }`
- `POST /api/v1/admin/withdrawals/:withdrawalId/mark-paid`

Nenhuma recebe `adminId` — a API tira-o do token.

- [ ] **Step 1: Escrever os testes**

Create `src/modules/Api/rest/__tests__/adminMoney.dao.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const post = vi.fn()
vi.mock('@/modules/Api/rest/Api.dao', () => ({
  default: { post }
}))

const { AdminMoneyDAO } = await import('@/modules/Api/rest/adminMoney.dao')

describe('AdminMoneyDAO', () => {
  const dao = new AdminMoneyDAO()

  beforeEach(() => {
    post.mockReset()
  })

  it('approveTopup chama a rota certa e devolve o corpo', async () => {
    post.mockResolvedValue({ credited: true, balance: 6000 })

    const result = await dao.approveTopup('top-1')

    expect(post).toHaveBeenCalledWith('/api/v1/admin/topups/top-1/approve', {})
    expect(result).toEqual({ credited: true, balance: 6000 })
  })

  it('approveWithdrawal chama a rota certa', async () => {
    post.mockResolvedValue({ changed: true })

    const result = await dao.approveWithdrawal('wd-1')

    expect(post).toHaveBeenCalledWith(
      '/api/v1/admin/withdrawals/wd-1/approve',
      {}
    )
    expect(result).toEqual({ changed: true })
  })

  it('rejectWithdrawal envia o motivo no body', async () => {
    post.mockResolvedValue({ changed: true, revertedEarnings: 2 })

    const result = await dao.rejectWithdrawal('wd-1', 'dados inválidos')

    expect(post).toHaveBeenCalledWith(
      '/api/v1/admin/withdrawals/wd-1/reject',
      { reason: 'dados inválidos' }
    )
    expect(result.revertedEarnings).toBe(2)
  })

  it('markWithdrawalPaid chama a rota certa', async () => {
    post.mockResolvedValue({ changed: true, paidEarnings: 3 })

    const result = await dao.markWithdrawalPaid('wd-1')

    expect(post).toHaveBeenCalledWith(
      '/api/v1/admin/withdrawals/wd-1/mark-paid',
      {}
    )
    expect(result.paidEarnings).toBe(3)
  })

  it('nunca envia adminId — a API tira-o do token', async () => {
    post.mockResolvedValue({ changed: true })

    await dao.approveWithdrawal('wd-1')

    expect(JSON.stringify(post.mock.calls[0])).not.toContain('adminId')
  })

  it('propaga o erro da API tal como vem', async () => {
    post.mockRejectedValue(new Error('Withdrawal not found: wd-9'))

    await expect(dao.approveWithdrawal('wd-9')).rejects.toThrow(
      'Withdrawal not found: wd-9'
    )
  })
})
```

- [ ] **Step 2: Correr — tem de falhar**

```bash
npm run test -- src/modules/Api/rest/__tests__/adminMoney.dao.test.ts
```

Expected: FAIL — módulo `@/modules/Api/rest/adminMoney.dao` não existe.

- [ ] **Step 3: Criar o port**

Create `src/core/interfaces/IAdminMoneyRepository.ts`:

```ts
/**
 * Operações de dinheiro do admin. Todas correm no servidor, numa transacção
 * única e idempotente, e são auditadas em `walletAuditLogs`.
 *
 * Nenhuma recebe `adminId`: a API tira-o do ID token verificado. Enviá-lo
 * do cliente permitiria forjar o registo de auditoria.
 */
export interface IAdminMoneyRepository {
  /** `credited: false` quando o pedido já estava aprovado — não é erro. */
  approveTopup(topupId: string): Promise<{ credited: boolean; balance: number }>

  approveWithdrawal(withdrawalId: string): Promise<{ changed: boolean }>

  rejectWithdrawal(
    withdrawalId: string,
    reason: string
  ): Promise<{ changed: boolean; revertedEarnings: number }>

  markWithdrawalPaid(
    withdrawalId: string
  ): Promise<{ changed: boolean; paidEarnings: number }>
}
```

- [ ] **Step 4: Criar o DAO**

Create `src/modules/Api/rest/adminMoney.dao.ts`:

```ts
import ApiDAO from './Api.dao'
import type { IAdminMoneyRepository } from '@/core/interfaces/IAdminMoneyRepository'

export class AdminMoneyDAO implements IAdminMoneyRepository {
  async approveTopup(
    topupId: string
  ): Promise<{ credited: boolean; balance: number }> {
    return ApiDAO.post(`/api/v1/admin/topups/${topupId}/approve`, {})
  }

  async approveWithdrawal(
    withdrawalId: string
  ): Promise<{ changed: boolean }> {
    return ApiDAO.post(`/api/v1/admin/withdrawals/${withdrawalId}/approve`, {})
  }

  async rejectWithdrawal(
    withdrawalId: string,
    reason: string
  ): Promise<{ changed: boolean; revertedEarnings: number }> {
    return ApiDAO.post(`/api/v1/admin/withdrawals/${withdrawalId}/reject`, {
      reason
    })
  }

  async markWithdrawalPaid(
    withdrawalId: string
  ): Promise<{ changed: boolean; paidEarnings: number }> {
    return ApiDAO.post(
      `/api/v1/admin/withdrawals/${withdrawalId}/mark-paid`,
      {}
    )
  }
}
```

- [ ] **Step 5: Exportar no barrel**

Acrescentar ao fim de `src/modules/Api/index.ts` (sem remover nada):

```ts
import type { IAdminMoneyRepository } from '@/core/interfaces/IAdminMoneyRepository'
import { AdminMoneyDAO } from './rest/adminMoney.dao'

export const adminMoneyRepository: IAdminMoneyRepository = new AdminMoneyDAO()
```

- [ ] **Step 6: Correr, verificar e commitar**

```bash
npm run test -- src/modules/Api/rest/__tests__/adminMoney.dao.test.ts
npx tsc -b && echo "tsc ok"
git add src/core/interfaces/IAdminMoneyRepository.ts src/modules/Api
git commit -m "feat: DAO REST das operacoes admin de dinheiro"
```

Expected: `6 passed`, `tsc ok`.

---

## Task 3: Saques passam a chamar a API

**Files:**
- Modify: `src/services/withdrawal.service.ts`
- Modify: `src/modules/Api/firebase/withdrawal.dao.ts`
- Modify: `src/core/interfaces/IWithdrawalRepository.ts`
- Modify: `src/viewModels/WithdrawalViewModel.ts`

**Interfaces:**
- Consumes: `adminMoneyRepository` (Task 2).
- Produces: `WithdrawalService.approve(id)`, `.reject(id, reason)`, `.markAsPaid(id)` — **sem o parâmetro `adminId`**. A Task 4 usa o ViewModel actualizado.

**Esta task apaga as três `runTransaction` client-side.** São elas que a Fase 1 substituiu, incluindo o bug da rejeição que ressuscitava earnings já pagos.

- [ ] **Step 1: Remover os três métodos do DAO Firestore**

Em `src/modules/Api/firebase/withdrawal.dao.ts`, apagar os métodos `approve`, `reject` e `markAsPaid` inteiros. Manter `getAll`, `getById`, `countByStatus` e `getEarningsByIds`.

Depois, remover do import de `firebase/firestore` o que ficou sem uso — `runTransaction` de certeza, e possivelmente `Timestamp`. **`noUnusedLocals` parte o build se sobrar algum**, portanto correr `npx tsc -b` a seguir e limpar o que acusar.

- [ ] **Step 2: Remover os três métodos do port**

Em `src/core/interfaces/IWithdrawalRepository.ts`, apagar as assinaturas de `approve`, `reject` e `markAsPaid`. As de leitura ficam.

- [ ] **Step 3: Apontar o service à API**

Em `src/services/withdrawal.service.ts`, substituir os três métodos. O `adminId` desaparece das assinaturas:

```ts
import { adminMoneyRepository } from '@/modules/Api'
```

```ts
  /** Aprova no servidor. `changed: false` significa que já estava aprovado. */
  async approve(id: string): Promise<{ changed: boolean }> {
    return adminMoneyRepository.approveWithdrawal(id)
  }

  async reject(
    id: string,
    reason: string
  ): Promise<{ changed: boolean; revertedEarnings: number }> {
    return adminMoneyRepository.rejectWithdrawal(id, reason)
  }

  async markAsPaid(
    id: string
  ): Promise<{ changed: boolean; paidEarnings: number }> {
    return adminMoneyRepository.markWithdrawalPaid(id)
  }
```

Remover o import de `withdrawalRepository` se deixar de ser usado pelos métodos de escrita — confirmar que as leituras ainda o usam antes de o apagar.

- [ ] **Step 4: Limpar o ViewModel**

Em `src/viewModels/WithdrawalViewModel.ts`, substituir as três mutations. Sai o `withAudit`, sai o `adminId`, sai a leitura de `previous_data` que só servia para o registo de auditoria:

```ts
  const approve = useMutation({
    mutationFn: (id: string) => withdrawalService.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] })
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      withdrawalService.reject(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] })
  })

  const markAsPaid = useMutation({
    mutationFn: (id: string) => withdrawalService.markAsPaid(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] })
  })
```

Depois remover os imports e variáveis que ficaram sem uso: `withAudit`, `useAdminStore`, `adminId`, e possivelmente `ReferralEarningEntity`. **`noUnusedLocals` acusa cada um** — correr `npx tsc -b` e limpar até ficar verde.

- [ ] **Step 5: Verificar**

```bash
npx tsc -b
echo "exit=$?"
```

Expected: `exit=0`.

Se acusar em `WithdrawalDetails.tsx`, é a Task 4 — mas confirmar que é só a assinatura das mutations e não outra coisa.

- [ ] **Step 6: Correr a suite e commitar**

```bash
npm run test
git add src/services/withdrawal.service.ts src/modules/Api/firebase/withdrawal.dao.ts src/core/interfaces/IWithdrawalRepository.ts src/viewModels/WithdrawalViewModel.ts
git commit -m "refactor: saques passam pela API e saem as transaccoes client-side"
```

---

## Task 4: UI dos saques — pagar exige aprovar primeiro

**Files:**
- Modify: `src/pages/main/Referral/WithdrawalDetails.tsx`

**Interfaces:**
- Consumes: `useWithdrawalsViewModel` da Task 3, cujas mutations já não recebem `adminId`.
- Produces: nada consumido por outras tasks.

**Porquê:** a API recusa pagar um saque em `pending` — a máquina de estados é `pending → approved → paid`. O painel hoje tem `canPay = ['approved', 'pending']`, portanto o botão aparece num estado em que a chamada vai falhar com 409.

- [ ] **Step 1: Apertar a condição do botão**

Substituir a linha:

```ts
  const canPay = ['approved', 'pending'].includes(withdrawal.status)
```

por:

```ts
  // A API só paga um saque `approved` — pagar directo de `pending` saltaria
  // o passo de aprovação e a segregação de funções que ele dá.
  const canPay = withdrawal.status === 'approved'
```

- [ ] **Step 2: Dar contexto ao admin no estado pendente**

O admin que abria um saque `pending` via o botão de pagar; agora não vê. Acrescentar uma nota, imediatamente antes do bloco de botões de acção:

```tsx
      {withdrawal.status === 'pending' && (
        <p className="text-sm text-gray-500">
          Aprova o saque antes de o marcar como pago.
        </p>
      )}
```

- [ ] **Step 3: Verificar tipos e o resto do ecrã**

```bash
npx tsc -b
echo "exit=$?"
```

Expected: `exit=0`. Se acusar nas chamadas `approve.mutateAsync(...)` / `markAsPaid.mutateAsync(...)`, é porque a Task 3 mudou as assinaturas — corrigir a chamada aqui.

- [ ] **Step 4: Correr a suite e commitar**

```bash
npm run test
git add src/pages/main/Referral/WithdrawalDetails.tsx
git commit -m "fix: pagar saque exige estado approved"
```

---

## Task 5: Aprovação de carregamento passa a uma chamada

**Files:**
- Modify: `src/pages/main/Finances/walletTopupRequest.tsx`
- Modify: `src/viewModels/TransactionViewModel.ts`

**Interfaces:**
- Consumes: `adminMoneyRepository` (Task 2).
- Produces: nada consumido por outras tasks. Remove `updateBalanceAndAddTransaction` do painel.

**O que desaparece:** as três escritas independentes. Passa a ser uma chamada que credita, marca o pedido e cria a transacção num só commit — e que devolve `credited: false` em vez de creditar outra vez se já estivesse aprovado.

- [ ] **Step 1: Acrescentar a mutation ao ViewModel dos top-ups**

A chamada pertence ao ViewModel, não à página: é lá que vivem o `queryClient` e
a chave de invalidação (`firebaseCollections.requests.root` — note-se **`requests`**,
não `topupRequests`).

Em `src/viewModels/WalletTopupRequestViewModel.ts`, acrescentar junto às outras
mutations:

```ts
import { adminMoneyRepository } from '@/modules/Api'
```

```ts
  /**
   * Aprova e credita numa só chamada ao servidor. Sem `withAudit`: a API
   * escreve em `walletAuditLogs` dentro da própria transacção, e esse registo
   * não pode existir sem o movimento de dinheiro.
   */
  const approveTopup = useMutation({
    mutationFn: (id: string) => adminMoneyRepository.approveTopup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.requests.root]
      })
    }
  })
```

E acrescentar `approveTopup` ao objecto devolvido pelo hook.

- [ ] **Step 2: Substituir o corpo da aprovação na página**

Em `src/pages/main/Finances/walletTopupRequest.tsx`, tirar `approveTopup` do
hook (junto de `updateWalletTopupRequest`, que continua a existir para o
caminho de rejeição) e substituir o `try` inteiro dentro do
`if (status === 'approved')` — as duas chamadas `updateWalletTopupRequest.mutateAsync`
e `updateBalanceAndAddTransaction.mutateAsync` — por:

```tsx
          try {
            const result = await approveTopup.mutateAsync(docId)

            if (result.credited) {
              swal('Aprovado com sucesso', { icon: 'success' })
            } else {
              // A API é idempotente: repetir não credita outra vez.
              swal('Este carregamento já tinha sido aprovado', { icon: 'info' })
            }
          } catch (error: any) {
            swal('Erro ao aprovar', {
              text: error.message ?? 'Houve algum erro durante a aprovação...',
              icon: 'error'
            })
          }
```

Se `updateBalanceAndAddTransaction` ficar sem uso na página, remover também a
sua desestruturação do `useTransactionsViewModel()` — e o próprio hook, se mais
nada dele for usado ali. `noUnusedLocals` acusa.

- [ ] **Step 2: Remover `updateBalanceAndAddTransaction` do ViewModel**

Em `src/viewModels/TransactionViewModel.ts`, apagar a mutation `updateBalanceAndAddTransaction` inteira e retirá-la do objecto devolvido.

Depois remover o que ficou sem uso — provavelmente o import de `walletUseCase`/`walletService` e tipos como `TransactionType`/`TransactionCategoryType` se mais nada os usar. `noUnusedLocals` acusa; correr `npx tsc -b` e limpar.

- [ ] **Step 3: Confirmar que mais ninguém a usava**

```bash
grep -rn "updateBalanceAndAddTransaction" src
```

Expected: sem resultados. Se aparecer algum, **parar e reportar** — havia outro caminho a escrever saldos que esta fase não previu.

- [ ] **Step 4: Verificar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
```

- [ ] **Step 5: Commitar**

```bash
git add src/viewModels/WalletTopupRequestViewModel.ts src/pages/main/Finances/walletTopupRequest.tsx src/viewModels/TransactionViewModel.ts
git commit -m "refactor: aprovacao de carregamento passa pela API idempotente"
```

---

## Task 6: Provar que o painel já não escreve dinheiro

**Files:**
- Nenhum a modificar. Esta task é verificação.

**Interfaces:**
- Consumes: tudo das Tasks 1–5.
- Produces: a evidência de que a fase está feita.

- [ ] **Step 1: Nenhuma escrita de dinheiro sobra no painel**

```bash
grep -rn "balance" src/services src/viewModels src/pages | grep -vi "getBalance\|balance:" | head -20
grep -rn "runTransaction" src
```

Expected: nenhum resultado que escreva saldo, e nenhum `runTransaction` fora de ficheiros que esta fase não tocou. Se `runTransaction` aparecer em `promotion.dao.ts`, é esperado — as promoções não fazem parte desta fase. Listar o que encontrares no relatório.

- [ ] **Step 2: Build completo**

```bash
npx tsc -b && npm run build
echo "exit=$?"
```

Expected: `exit=0`.

- [ ] **Step 3: Suite**

```bash
npm run test
```

Expected: todos a passar. Baseline era 68; as Tasks 1–2 acrescentam 11.

- [ ] **Step 4: Smoke manual — o dono executa**

Isto exige a API Fastify a correr localmente, os emuladores, e sessão de admin no painel. **Não tentar automatizar.** Registar no relatório que ficou para o dono, com esta lista:

Pré-requisitos: emuladores Firestore+Auth a correr; `npm run dev` no repo `node-fastify-kandengue_atrevido-ts`; `VITE_API_URL=http://localhost:3000` no `.env` do painel.

1. **Finanças → Carregamentos:** aprovar um pedido `pending`. O saldo da carteira sobe pelo valor exacto, aparece uma transacção nova, e o pedido fica `approved`.
2. **Aprovar o mesmo pedido outra vez** (recarregar e repetir). Tem de aparecer "Este carregamento já tinha sido aprovado" e o saldo **não** pode mudar.
3. **Referral → Saques:** abrir um saque `pending`. O botão de pagar não aparece; aparece a nota a dizer para aprovar primeiro.
4. **Aprovar** esse saque. O estado fica `approved` e o botão de pagar aparece.
5. **Rejeitar** um saque com earnings ligados. Os earnings voltam a `pending` e o saque fica `rejected`.
6. **Marcar como pago** um saque `approved`. Saque e earnings ficam `paid`.
7. Confirmar em `walletAuditLogs` que cada acção deixou uma entrada com o `admin_id` certo — e que **não** há entrada duplicada em `auditLogs` para estas quatro operações.

- [ ] **Step 5: Corrigir o `CLAUDE.md`, que passou a mentir**

O `CLAUDE.md` deste repo entra no contexto de todas as sessões. Duas notas
suas ficaram falsas — uma porque esta fase apagou o código, outra porque a
justificação nunca se sustentou:

Substituir o bloco da rejeição de saque:

```markdown
> ⚠️ A rejeição de saque (`FirebaseWithdrawalDAO.reject`) é uma
> **transação atómica client-side** que reverte cada earning ligado para
> `pending`. Não usar `Promise.all` ou batches separados — perdem a
> propriedade de all-or-nothing.
```

por:

```markdown
> ⚠️ As operações de dinheiro do admin — aprovar carregamento, e aprovar /
> rejeitar / marcar-pago um saque — vivem na API (`/api/v1/admin/...`), não
> no painel. Correm numa transação única e idempotente, e registam em
> `walletAuditLogs` dentro dessa transação. Não reintroduzir escritas de
> saldo, transação ou estado de saque no cliente.
```

E substituir o bloco dos shards de promoção:

```markdown
> ⚠️ A criação de promoções inicia atomicamente os shards
> `counters/shard_0..9` no `FirebasePromotionDAO.create()`. Sem isto a
> CAMADA 1 do `apply` (lê `used_count_approx`/`reserved_count_approx`)
> arrancaria com `0` e o `syncPromoCounters` só corrige após o primeiro
> tick (60s). Mantém este invariante.
```

por:

```markdown
> A criação de promoções pré-cria os shards `counters/shard_0..9` no
> `FirebasePromotionDAO.create()`. É conveniência idempotente, não um
> invariante: todas as escritas em shards usam `set(..., { merge: true })`,
> que cria o documento se faltar, e `used_count_approx` já nasce a `0` no
> próprio documento da promoção. O risco real dos contadores está na janela
> de reconciliação de 60s do `syncPromoCounters`, não na criação.
```

- [ ] **Step 6: Commitar**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md deixa de descrever codigo apagado como invariante"
```

- [ ] **Step 7: Commitar o relatório**

Não há código a commitar nesta task. Se algum passo do Step 1 revelar código a limpar, tratá-lo como achado e reportar em vez de o corrigir aqui.

---

## Fecho

Ao fim da Task 6, o painel lê o Firestore mas não escreve dinheiro. As Fases 3 e 4 podem avançar:

- **Fase 3** remove a capacidade de escrever saldo dos dois apps React Native.
- **Fase 4** escreve as Security Rules que tornam essas escritas impossíveis, e tem de estar publicada antes de **2026-11-11**.

Fica um follow-up conhecido: as restantes mutações do painel (motoristas, veículos, missões) continuam a usar `withAudit` a escrever em `auditLogs`, enquanto as de dinheiro passaram a `walletAuditLogs`. Um ecrã de auditoria futuro tem de ler as duas colecções, ou o padrão tem de convergir.
