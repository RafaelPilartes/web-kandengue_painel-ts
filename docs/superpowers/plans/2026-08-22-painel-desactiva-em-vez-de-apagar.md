# O Painel Desactiva em Vez de Apagar Carteiras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o apagar de carteiras por activar/desactivar através da API, e remover as duas últimas escritas de carteira que sobram no cliente.

**Architecture:** O botão "Excluir" da listagem de carteiras passa a alternar entre "Desactivar" e "Reactivar", conforme o estado da linha, chamando `PATCH /api/v1/admin/wallets/:walletId/status`. O `deleteWallet` e o `updateWallet` do painel desaparecem, com eles o `delete` e o `update` do `walletService`.

**Tech Stack:** React 19 + Vite 7, TanStack React Query v5, Vitest, Firestore client SDK v12.

## Contexto: dois problemas, uma solução

**Apagar carteiras é destrutivo e não tem guarda nenhuma.** O caminho actual é literalmente isto:

```ts
// src/modules/Api/firebase/wallet.dao.ts:190
async delete(id: string): Promise<void> {
  await deleteDoc(doc(this.walletsRef, id))
}
```

Sem verificação de saldo, em camada nenhuma. Apagar a carteira de um motorista com 50.000 AOA destrói o registo do dinheiro que lhe é devido, e deixa órfãs todas as `transactions` e `topupRequests` que apontam para aquele `wallet_id`. É irreversível no Firestore, e está ligado a um botão com confirmação que funciona hoje.

Quase de certeza que nenhum admin quer isto. O que quer é **desactivar** — que preserva o extracto e se pode desfazer.

**E congelar uma carteira tornou-se impossível.** O `ModalEditWallet`, apagado por editar `balance` directamente, também editava `status`. Ao removê-lo fechou-se a única via para mudar o estado de uma carteira: hoje uma carteira só pode nascer inactiva, nunca mudar.

O endpoint `PATCH /api/v1/admin/wallets/:walletId/status` resolve os dois de uma vez.

**O `updateWallet` vai embora e não volta.** Não é por não haver caso de uso — é porque escrevia `balance` e `currency` a par do `status`. Editar saldo à mão é criar dinheiro sem extracto; mudar a moeda de uma carteira com saldo transforma 1000 AOA em 1000 USD sem uma única linha de registo. O `status` é a única parte legítima, e agora tem a sua própria porta.

## Global Constraints

- **`erasableSyntaxOnly: true`** — proibidas parameter properties, `enum` e `namespace`.
- **`verbatimModuleSyntax: true`** — imports usados só como tipo têm de usar `import type`.
- **`noUnusedLocals: true` / `noUnusedParameters: true`** — este plano apaga bastante código, por isso imports órfãos são a falha provável. Deixa o `npx tsc -b` identificá-los; não os apagues por adivinhação.
- `strict: true`.
- Verificação de tipos: **`npx tsc -b`**, não `tsc --noEmit`.
- Testes: `npm run test`. Baseline **86 testes**. A suite precisa do emulador Firestore na porta **8090**.
- Alias `@/` → `src/`.
- **Nenhum ViewModel, página ou componente pode importar `@/modules/Api`.** O caminho é ViewModel → Service → port. Está limpo neste momento — não reintroduzir.
- **Não usar `withAudit`.** A API escreve `walletAuditLogs` dentro da transacção; um registo no cliente podia sobreviver a uma operação falhada. É o precedente das seis operações já migradas.
- Estilo: aspas simples, sem ponto e vírgula, indentação de 2. Comentários em português.

---

## Contrato da API (implementado e testado, 88 testes verdes)

```
PATCH /api/v1/admin/wallets/:walletId/status
```

```ts
// body
{ status: 'active' | 'inactive', reason?: string }

// 200
{ changed: boolean, status: 'active' | 'inactive' }
```

`changed: false` significa que a carteira já estava nesse estado — **não é erro**, é o mesmo padrão do `credited: false` do `approveTopup`. Carteira inexistente devolve erro.

Só `active` e `inactive`: `pending` é estado de criação e a API recusa-o.

---

## Ficheiros

| Ficheiro | Alteração |
| --- | --- |
| `src/core/interfaces/IAdminMoneyRepository.ts` | Assinatura do novo método |
| `src/modules/Api/rest/adminMoney.dao.ts` | Método `setWalletStatus` |
| `src/services/wallet.service.ts` | `setStatus`; **apagar** `update` e `delete` |
| `src/viewModels/WalletViewModel.ts` | `setWalletStatus`; **apagar** `updateWallet` e `deleteWallet` |
| `src/components/table/TableRowWallet.tsx` | Menu alterna Desactivar/Reactivar |
| `src/pages/main/Finances/wallet.tsx` | Handler novo, confirmação nova |
| `src/modules/Api/firebase/wallet.dao.ts` | **Apagar** `delete` e `update` se ficarem órfãos |

---

## Task 1: O cliente REST

**Files:**
- Modify: `src/core/interfaces/IAdminMoneyRepository.ts`
- Modify: `src/modules/Api/rest/adminMoney.dao.ts`

**Interfaces:**
- Produces: `adminMoneyRepository.setWalletStatus(walletId: string, status: 'active' | 'inactive', reason?: string): Promise<{ changed: boolean; status: 'active' | 'inactive' }>`

  A Task 2 consome-o.

**Nota sobre a forma da assinatura:** os métodos deste ficheiro que recebem um ID e um corpo usam argumentos posicionais — ver `rejectWithdrawal(withdrawalId, reason)`. Segue essa forma, não um objecto.

- [ ] **Step 1: Ver o `rejectWithdrawal`, que é o análogo mais próximo**

```bash
sed -n '1,35p' src/modules/Api/rest/adminMoney.dao.ts
```

Recebe um ID posicional, envia um corpo, e não tem `try/catch` — o `ApiDAO` já trata do header de autenticação e extrai a mensagem de erro da API.

Repara: é uma **classe** (`export class AdminMoneyDAO implements IAdminMoneyRepository`), portanto os métodos não levam vírgulas entre si.

- [ ] **Step 2: A assinatura na interface**

Em `src/core/interfaces/IAdminMoneyRepository.ts`, seguindo o estilo do ficheiro — que documenta retornos não-óbvios com uma linha `/** */`:

```ts
  /**
   * Activa ou desactiva uma carteira. Não move dinheiro.
   * `changed: false` quando a carteira já estava nesse estado — não é erro.
   */
  setWalletStatus(
    walletId: string,
    status: 'active' | 'inactive',
    reason?: string
  ): Promise<{ changed: boolean; status: 'active' | 'inactive' }>
```

- [ ] **Step 3: O método na classe**

```ts
  async setWalletStatus(
    walletId: string,
    status: 'active' | 'inactive',
    reason?: string
  ): Promise<{ changed: boolean; status: 'active' | 'inactive' }> {
    return ApiDAO.patch(`/api/v1/admin/wallets/${walletId}/status`, {
      status,
      reason
    })
  }
```

**Verifica primeiro se o `ApiDAO` tem um método `patch`.** Os seis métodos existentes usam todos `ApiDAO.post`. Se não houver `patch`, acrescenta-o a `src/modules/Api/rest/Api.dao.ts` copiando exactamente a forma do `post` — incluindo o tratamento do header de autenticação, que fica **fora** do `try/catch` do axios. Se acrescentares, diz no relatório.

- [ ] **Step 4: Verificar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
```

Expected: `tsc ok`, 86 testes. Ainda nada o chama.

- [ ] **Step 5: Commit**

```bash
git add src/core/interfaces/IAdminMoneyRepository.ts src/modules/Api/rest/
git commit -m "feat: cliente REST para o estado da carteira"
```

---

## Task 2: O service e o ViewModel

**Files:**
- Modify: `src/services/wallet.service.ts`
- Modify: `src/viewModels/WalletViewModel.ts`

**Interfaces:**
- Consumes: `adminMoneyRepository.setWalletStatus` da Task 1.
- Produces: `walletService.setStatus(walletId, status, reason?)` e a mutation `setWalletStatus` do ViewModel.

- [ ] **Step 1: `setStatus` no service**

Em `src/services/wallet.service.ts`, junto ao `createViaApi` (que é o modelo — delega sem `try/catch`, para não perder a mensagem da API):

```ts
  /**
   * Activa ou desactiva a carteira no servidor, com auditoria dentro da
   * transacção. Substitui o apagar: apagar destruía o registo do dinheiro
   * devido ao motorista e deixava órfãs as transacções da carteira.
   */
  async setStatus(
    walletId: string,
    status: 'active' | 'inactive',
    reason?: string
  ): Promise<{ changed: boolean; status: 'active' | 'inactive' }> {
    return adminMoneyRepository.setWalletStatus(walletId, status, reason)
  }
```

- [ ] **Step 2: Apagar o `update` e o `delete` do service**

Apagar ambos os métodos de `src/services/wallet.service.ts`. Antes de apagar cada um:

```bash
grep -rn "walletService.update\|walletService.delete" src/
```

Se algum ainda tiver consumidor fora do `WalletViewModel` (que a Step 3 trata), **parar e reportar** — não apagar código em uso.

- [ ] **Step 3: O ViewModel**

Em `src/viewModels/WalletViewModel.ts`:

**Apagar** a mutation `updateWallet` (que já não tem consumidor nenhum desde que o `ModalEditWallet` foi removido) e a mutation `deleteWallet`.

**Acrescentar**, sem `withAudit`:

```ts
  /** Activar/desactivar carteira — auditado dentro da transacção da API */
  const setWalletStatus = useMutation({
    mutationFn: ({
      walletId,
      status,
      reason
    }: {
      walletId: string
      status: 'active' | 'inactive'
      reason?: string
    }) => walletService.setStatus(walletId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })
```

Usa a mesma chave de invalidação que o `createWallet` já usa neste ficheiro — copia-a de lá em vez de a escrever de memória.

Actualiza o objecto devolvido no fim do hook: fora `updateWallet` e `deleteWallet`, dentro `setWalletStatus`.

**Atenção ao `withAudit`:** depois de apagares as duas mutations, confirma se ainda resta alguma que o use neste ficheiro. Se não restar, remove o import; se restar, deixa-o. Deixa o `tsc` decidir.

- [ ] **Step 4: Verificar**

```bash
npx tsc -b
```

Expected: **erros** em `src/pages/main/Finances/wallet.tsx`, que ainda usa `deleteWallet`. É esperado — a Task 3 corrige. Não os silencies aqui e não avances sem os ler: confirma que os erros são só nesse ficheiro e são sobre `deleteWallet`.

- [ ] **Step 5: Commit**

Como o `tsc` está vermelho de propósito entre tasks, commita mesmo assim para não perder o trabalho:

```bash
git add src/services/wallet.service.ts src/viewModels/WalletViewModel.ts
git commit -m "refactor: estado da carteira via API; remover update e delete do cliente"
```

---

## Task 3: A interface

**Files:**
- Modify: `src/components/table/TableRowWallet.tsx`
- Modify: `src/pages/main/Finances/wallet.tsx`

**Interfaces:**
- Consumes: a mutation `setWalletStatus` da Task 2.

**O desenho:** a linha já mostra o estado da carteira (`TableRowWallet.tsx:48-53`). O item de menu "Excluir" passa a ser um interruptor, que lê `rowItem.status`:

- carteira `active` → **"Desactivar"**
- carteira não-`active` → **"Reactivar"**

Um só controlo cobre congelar e descongelar.

- [ ] **Step 1: A prop do componente**

Em `src/components/table/TableRowWallet.tsx`, trocar na interface de props:

```ts
  handleDeleteRow: (id: string) => void
```

por:

```ts
  handleToggleStatus: (id: string, nextStatus: 'active' | 'inactive') => void
```

...e actualizar a desestruturação dos parâmetros em conformidade.

- [ ] **Step 2: O item de menu**

Substituir o item `'Excluir'` (`:73-74`) por:

```ts
              {
                label: rowItem.status === 'active' ? 'Desactivar' : 'Reactivar',
                onClick: () =>
                  handleToggleStatus(
                    rowItem.id as string,
                    rowItem.status === 'active' ? 'inactive' : 'active'
                  )
              },
```

Mantém a vírgula final e a forma exacta dos itens vizinhos (`'Ver transações'`, `'Detalhes'`) — copia a estrutura real do ficheiro, incluindo qualquer propriedade de ícone ou estilo que os outros itens tenham e que não esteja no excerto acima.

- [ ] **Step 3: O handler na página**

Em `src/pages/main/Finances/wallet.tsx`, substituir `handleDeleteRow` (`:81-113`) por:

```ts
  // Activar / desactivar
  function handleToggleStatus(id: string, nextStatus: 'active' | 'inactive') {
    const desactivar = nextStatus === 'inactive'

    swal({
      title: 'Tem certeza?',
      text: desactivar
        ? 'A carteira deixa de poder ser usada. O saldo e o histórico são preservados, e pode reactivá-la depois.'
        : 'A carteira volta a ficar activa e utilizável.',
      buttons: ['Cancelar', 'Confirmar'],
      icon: 'warning',
      dangerMode: desactivar
    }).then(async willChange => {
      if (!willChange) return

      try {
        const result = await setWalletStatus.mutateAsync({
          walletId: id,
          status: nextStatus
        })

        if (!result.changed) {
          swal('Sem alterações', {
            text: 'A carteira já estava nesse estado.',
            icon: 'info'
          })
          return
        }

        swal('Feito', {
          title: desactivar
            ? 'Carteira desactivada'
            : 'Carteira reactivada',
          icon: 'success'
        })
      } catch (error) {
        const message = mapFirebaseError(error)
        swal('Erro', {
          text: `Não foi possível alterar o estado: ${String(message)}`,
          icon: 'error'
        })
      }
    })
  }
```

Nota que o `swal` deste ficheiro é chamado com duas formas diferentes ao longo do handler antigo — confirma qual é a que o projecto usa para cada caso e mantém-te consistente com o que lá está.

O `mapFirebaseError` foi escrito para erros do Firestore, e agora o erro vem da API. Se a mensagem resultante ficar pior do que o `error.message` cru, usa este último e diz porquê no relatório.

- [ ] **Step 4: Ligar a prop e a mutation**

No mesmo ficheiro, trocar `deleteWallet` por `setWalletStatus` na desestruturação do `useWalletsViewModel()` (`:41`), e `handleDeleteRow={handleDeleteRow}` por `handleToggleStatus={handleToggleStatus}` na renderização das linhas (`:74`).

- [ ] **Step 5: Verificar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
npm run build
```

Expected: `tsc ok` (o vermelho da Task 2 resolvido), 86 testes, build exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/table/TableRowWallet.tsx src/pages/main/Finances/wallet.tsx
git commit -m "feat: desactivar e reactivar carteira em vez de apagar"
```

---

## Task 4: Limpar o DAO e verificar

**Files:**
- Modify: `src/modules/Api/firebase/wallet.dao.ts`

- [ ] **Step 1: O `delete` e o `update` do DAO ainda são usados?**

```bash
grep -rn "walletRepository\.\(delete\|update\)\|\.delete(\|\.update(" src/modules/Api/firebase/wallet.dao.ts src/services/wallet.service.ts
grep -rn "walletRepository" src/
```

Lê os resultados com cuidado: o DAO implementa uma interface (`IWalletRepository`), e apagar um método que a interface declara parte o `implements`. Se apagares do DAO, apaga também da interface.

Se algum consumidor sobrar, **parar e reportar**.

- [ ] **Step 2: Apagar o que estiver morto**

Apagar `delete` (`:190-192`) e `update` do `wallet.dao.ts`, mais as declarações correspondentes em `src/core/interfaces/IWalletRepository.ts`.

O `deleteDoc` e o `updateDoc` importados do `firebase/firestore` podem ficar órfãos — o `noUnusedLocals` acusa. Confirma se outros métodos do ficheiro ainda os usam antes de remover os imports.

- [ ] **Step 3: Nenhuma escrita de carteira sobra no cliente**

```bash
grep -rn "deleteDoc\|updateDoc\|setDoc" src/modules/Api/firebase/wallet.dao.ts
```

Expected: só o que serve leitura ou criação legítima — e depois da migração, idealmente **nada**. Regista no relatório o que sobrar e porquê.

- [ ] **Step 4: As camadas continuam limpas**

```bash
grep -rn "from '@/modules/Api'" src/viewModels/ src/pages/ src/components/
```

Expected: **sem resultados**.

- [ ] **Step 5: Suite completa**

```bash
npx tsc -b && npm run test && npm run build
echo "exit=$?"
```

Expected: 86 testes, `exit=0`.

- [ ] **Step 6: Commit**

```bash
git add src/modules/Api/firebase/wallet.dao.ts src/core/interfaces/IWalletRepository.ts
git commit -m "chore: remover escrita e remocao de carteiras do cliente"
```

---

## Fecho

Depois disto o painel não escreve nem apaga carteiras. As sete operações de admin — aprovar carregamento, aprovar/rejeitar/marcar-pago um saque, pagar bónus de missão, criar carteira e mudar o estado da carteira — correm todas no servidor, em transacções auditadas.

É o estado que a Fase 4 precisa: as regras do Firestore podem negar escrita de clientes em `wallets`, `transactions`, `missionProgress`, `topupRequests` e `withdrawal_requests` sem partir nada no painel. As regras actuais são o template por omissão e **expiram a 2026-11-11**.
