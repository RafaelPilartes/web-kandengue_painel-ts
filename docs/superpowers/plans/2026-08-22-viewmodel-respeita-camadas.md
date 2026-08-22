# O ViewModel dos Top-ups Volta a Respeitar as Camadas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pôr a aprovação de carregamento a passar pelo `WalletTopupRequestService`, como todas as outras operações do mesmo ViewModel, em vez de importar o repositório directamente.

**Architecture:** O `WalletTopupRequestService` já existe e já serve o mesmo ViewModel em `getAll`, `getById`, `update` e `delete`. Acrescenta-se-lhe um `approveTopup(id)` que delega no `adminMoneyRepository`, exactamente como o `WithdrawalService` faz para as três operações de saque. O ViewModel deixa de conhecer `modules/Api`.

**Tech Stack:** React 19 + Vite 7, TanStack React Query v5, Vitest.

## Contexto: como isto entrou

Na Fase 2, a primeira versão do plano punha a chamada na *página*, o que era pior — a página não tem o `queryClient` nem a chave de invalidação. Corrigi para o ViewModel, que resolveu esse problema, mas esqueci-me de manter o service no caminho.

Nenhuma revisão o apanhou porque cada uma via um diff isolado: os saques e os top-ups foram tasks diferentes, e nenhum revisor teve os dois lado a lado. Uma auditoria posterior confirmou que é a **única** ocorrência — nenhuma página ou componente importa `modules/Api`.

## Global Constraints

- **`erasableSyntaxOnly: true`** — proibidas parameter properties, `enum` e `namespace`.
- **`verbatimModuleSyntax: true`** — imports usados só como tipo têm de usar `import type`.
- **`noUnusedLocals: true` / `noUnusedParameters: true`** — o import removido do ViewModel parte o build se ficar.
- `strict: true`.
- Verificação de tipos: **`npx tsc -b`**, não `tsc --noEmit`.
- Testes: `npm run test`. Baseline **86 testes**. A suite precisa do emulador Firestore na porta **8090**.
- Alias `@/` → `src/`.
- **Não mudar o comportamento.** A mutation continua a invalidar a mesma chave e a distinguir `credited: false`; só muda quem faz a chamada.

---

## Task 1: A aprovação passa pelo service

**Files:**
- Modify: `src/services/walletTopupRequest.service.ts`
- Modify: `src/viewModels/WalletTopupRequestViewModel.ts`

**Interfaces:**
- Consumes: `adminMoneyRepository.approveTopup(topupId): Promise<{ credited: boolean; balance: number }>` de `@/modules/Api`.
- Produces: `WalletTopupRequestService.approveTopup(id: string): Promise<{ credited: boolean; balance: number }>`.

- [ ] **Step 1: Ver como o `WithdrawalService` faz o mesmo**

```bash
sed -n '/async approve/,/^  }/p' src/services/withdrawal.service.ts
```

É o modelo: delega directamente, sem `try/catch` a reembrulhar o erro. O `ApiDAO` já extrai a mensagem da API, e o ViewModel mostra-a. Um `catch` aqui só serviria para a perder.

- [ ] **Step 2: Acrescentar o método ao service**

Em `src/services/walletTopupRequest.service.ts`, acrescentar o import:

```ts
import { adminMoneyRepository } from '@/modules/Api'
```

(Se `walletTopupRequestRepository` já vier de `@/modules/Api`, juntar ao import existente em vez de criar um segundo.)

E o método, junto aos outros:

```ts
  /**
   * Aprova e credita no servidor, numa transacção idempotente.
   * `credited: false` significa que já estava aprovado — não é erro.
   */
  async approveTopup(
    id: string
  ): Promise<{ credited: boolean; balance: number }> {
    return adminMoneyRepository.approveTopup(id)
  }
```

- [ ] **Step 3: O ViewModel chama o service**

Em `src/viewModels/WalletTopupRequestViewModel.ts`:

- remover `import { adminMoneyRepository } from '@/modules/Api'`
- na mutation `approveTopup`, trocar
  `mutationFn: (id: string) => adminMoneyRepository.approveTopup(id)`
  por
  `mutationFn: (id: string) => walletTopupRequestService.approveTopup(id)`

O `onSuccess` e a chave de invalidação ficam como estão.

- [ ] **Step 4: Confirmar que nenhum ViewModel conhece o `modules/Api`**

```bash
grep -rn "from '@/modules/Api'" src/viewModels/ src/pages/ src/components/
```

Expected: **sem resultados**. Qualquer ocorrência que sobre é uma segunda violação — listar no relatório.

- [ ] **Step 5: Verificar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
npm run build
echo "build exit=$?"
```

Expected: `tsc ok`, 86 testes, `exit=0`. Esta task não acrescenta testes — a suite é uma verificação de regressão.

- [ ] **Step 6: Commit**

```bash
git add src/services/walletTopupRequest.service.ts src/viewModels/WalletTopupRequestViewModel.ts
git commit -m "refactor: aprovacao de carregamento passa pelo service, nao pelo repositorio"
```

---

## Fecho

Depois disto, nenhum ViewModel, página ou componente do painel conhece `modules/Api`. As seis operações de dinheiro seguem todas o mesmo caminho: ViewModel → Service → port.
