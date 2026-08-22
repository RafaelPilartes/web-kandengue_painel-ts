# O Painel Deixa de Escrever Dinheiro: Missões e Criação de Carteiras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ligar as duas últimas operações de dinheiro do painel aos endpoints da API — pagamento de bónus de missão e criação de carteira — e apagar o `ModalEditWallet` morto.

**Architecture:** O painel passa a chamar `POST /api/v1/admin/missions/pay` e `POST /api/v1/admin/wallets` através do `adminMoneyRepository`, seguindo o caminho ViewModel → Service → port já estabelecido. As escritas de saldo, transacção e estado que hoje correm no cliente são removidas.

**Tech Stack:** React 19 + Vite 7, TanStack React Query v5, Vitest, Firestore client SDK v12.

## Contexto: o que ainda escreve dinheiro no cliente

A Fase 2 tirou do painel a aprovação de carregamentos e as três acções de saque. Sobraram duas operações, e ambas são piores do que as que já foram corrigidas.

**`missionService.payMissionBonus`** (`src/services/mission.service.ts:222-278`) faz três escritas separadas, sem transacção:

1. cria a transacção (`:260`)
2. lê o saldo, soma, e escreve o resultado (`:267-272`)
3. e só depois, de volta em `payMissionProgress` (`:215-217`), marca `is_paid = true`

Qualquer falha entre elas deixa dinheiro inconsistente: falhar no passo 2 deixa uma transacção fantasma no extracto sem dinheiro creditado; falhar no passo 3 credita o motorista e deixa a missão por paga — o pagamento seguinte credita outra vez. O passo 2 é ainda uma leitura-depois-escrita: dois admins em simultâneo lêem 1000, ambos escrevem 1500, e 500 desaparecem.

O endpoint da API faz as três coisas numa transacção única com guarda de idempotência.

**`walletService.create`** (`src/services/wallet.service.ts:66`) escreve a carteira directamente. O endpoint da API existe precisamente porque a criação no cliente produzia carteiras inutilizáveis — sem `user_id` preenchido com o Firebase UID, o `GET /me/wallet` da app nunca as encontra.

## Uma decisão que tomei, e que precisas de saber

O `createWallet` da API **exige** `user.firebase_uid` (`z.string().min(1)`). No painel, `firebase_uid` é **opcional** (`src/core/entities/User.ts:19`), e o `ModalCreate` serializa o documento do motorista inteiro vindo do dropdown — portanto envia o que o Firestore tiver.

Se um motorista não tiver o campo, o pedido é rejeitado. Não vale a pena descobrir isso com um erro cru: a API devolve mensagens em inglês, e o `error-handler.hook.ts` mapeia erros de validação para **500** em vez de 400 (defeito conhecido e deferido). O utilizador veria "Internal Server Error".

**Decisão:** o painel valida antes de enviar e bloqueia com uma mensagem em português que nomeia o motorista. Isto não esconde o problema — expõe-no de forma accionável, e evita criar carteiras que ninguém consegue carregar. Se se vier a descobrir que muitos motoristas não têm o campo, o problema é de dados e resolve-se à parte.

## Global Constraints

- **`erasableSyntaxOnly: true`** — proibidas parameter properties, `enum` e `namespace`.
- **`verbatimModuleSyntax: true`** — imports usados só como tipo têm de usar `import type`.
- **`noUnusedLocals: true` / `noUnusedParameters: true`** — imports que ficam órfãos partem o build.
- `strict: true`.
- Verificação de tipos: **`npx tsc -b`**, não `tsc --noEmit`.
- Testes: `npm run test`. Baseline **86 testes**. A suite precisa do emulador Firestore na porta **8090**.
- Alias `@/` → `src/`.
- **Nenhum ViewModel, página ou componente pode importar `@/modules/Api`.** O caminho é ViewModel → Service → port. Verificado e limpo neste momento — não reintroduzir.
- **Não usar `withAudit` nas duas operações novas.** É o precedente do `approveTopup` (`WalletTopupRequestViewModel:148-151`): a API escreve `walletAuditLogs` dentro da transacção, e esse registo não pode existir sem o movimento de dinheiro. Um `withAudit` no cliente escreveria um segundo registo que pode sobreviver a um pagamento falhado.
- Não tocar na API (`node-fastify-kandengue_atrevido-ts`) — os endpoints já existem e estão testados.

---

## Contratos da API (verificados no código, não presumidos)

**`POST /api/v1/admin/missions/pay`** → 200

```ts
// body
{ driver_id: string, mission_id: string, type_paid: 'cash' | 'wallet' }
// resposta
{ paid: boolean, balance: number | null }
```

`paid: false` significa que a missão já estava paga — **não é erro**, é o mesmo padrão do `credited: false` do `approveTopup`. `balance` é `null` quando o pagamento foi em dinheiro (`cash`), porque nenhuma carteira foi tocada.

**`POST /api/v1/admin/wallets`** → 201

```ts
// body
{
  user_id: string,
  user: { id: string, firebase_uid: string, ... },  // passthrough: campos extra passam
  initial_balance: number,
  currency: string,
  status: string,
  reason?: string
}
// resposta
{ walletId: string, balance: number }
```

Atenção à mudança de forma: o `ModalCreate` verifica hoje `resultSubmit?.id`. A API devolve **`walletId`**, não `id`.

---

## Ficheiros

| Ficheiro | Alteração |
| --- | --- |
| `src/modules/Api/rest/adminMoney.dao.ts` | Acrescentar os dois métodos |
| `src/services/mission.service.ts` | `payMissionProgress` delega; apagar `payMissionBonus` |
| `src/viewModels/MissionViewModel.ts` | Largar `withAudit` |
| `src/services/wallet.service.ts` | Acrescentar `createViaApi` |
| `src/viewModels/WalletViewModel.ts` | `createWallet` usa o novo caminho, sem `withAudit` |
| `src/pages/main/Finances/components/ModalCreate.tsx` | Guarda de `firebase_uid`, nova forma de resposta |
| `src/pages/main/Finances/components/ModalEdit.tsx` | **Apagar** |

---

## Task 1: Os dois métodos no cliente REST

**Files:**
- Modify: `src/modules/Api/rest/adminMoney.dao.ts`

**Interfaces:**
- Produces:
  - `adminMoneyRepository.payMissionBonus(input: { driver_id: string; mission_id: string; type_paid: 'cash' | 'wallet' }): Promise<{ paid: boolean; balance: number | null }>`
  - `adminMoneyRepository.createWallet(input: CreateWalletInput): Promise<{ walletId: string; balance: number }>`

  As Tasks 2 e 3 consomem-nos.

- [ ] **Step 1: Ver o padrão dos quatro métodos que já lá estão**

```bash
cat src/modules/Api/rest/adminMoney.dao.ts
```

Repara em como o `rejectWithdrawal` (`:17-24`) envia um corpo — é a forma a seguir. O `ApiDAO` já trata do header de autenticação e da extracção da mensagem de erro; não acrescentes `try/catch`.

- [ ] **Step 2: Acrescentar os dois métodos**

Seguindo o estilo exacto do ficheiro (aspas simples, sem ponto e vírgula):

```ts
  async payMissionBonus(input: {
    driver_id: string
    mission_id: string
    type_paid: 'cash' | 'wallet'
  }): Promise<{ paid: boolean; balance: number | null }> {
    return ApiDAO.post('/api/v1/admin/missions/pay', input)
  },

  async createWallet(input: {
    user_id: string
    user: { id: string; firebase_uid: string; [key: string]: unknown }
    initial_balance: number
    currency: string
    status: string
    reason?: string
  }): Promise<{ walletId: string; balance: number }> {
    return ApiDAO.post('/api/v1/admin/wallets', input)
  }
```

Confirma se o objecto exportado usa vírgulas entre métodos ou se é uma classe — segue o que lá está, não o que está escrito acima.

- [ ] **Step 3: Verificar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
```

Expected: `tsc ok`, 86 testes. Ainda nada os chama.

- [ ] **Step 4: Commit**

```bash
git add src/modules/Api/rest/adminMoney.dao.ts
git commit -m "feat: cliente REST para pagar bonus de missao e criar carteira"
```

---

## Task 2: O pagamento de missão passa pela API

**Files:**
- Modify: `src/services/mission.service.ts`
- Modify: `src/viewModels/MissionViewModel.ts`

**Interfaces:**
- Consumes: `adminMoneyRepository.payMissionBonus` da Task 1.
- Produces: `missionService.payMissionProgress(driver_id, mission_id, type_paid): Promise<{ paid: boolean; balance: number | null }>` — **a forma do retorno muda**, de `MissionProgressEntity` para o resultado da API.

- [ ] **Step 1: Substituir o corpo de `payMissionProgress`**

Em `src/services/mission.service.ts`, o método actual (`:194-220`) valida, chama `payMissionBonus` e escreve `is_paid`. Tudo isso passa a viver na transacção do servidor. Substituir por:

```ts
  /**
   * Paga o bónus no servidor, numa transacção única e idempotente.
   * `paid: false` significa que a missão já estava paga — não é erro.
   * `balance` vem `null` quando o pagamento é em dinheiro.
   */
  async payMissionProgress(
    driver_id: string,
    mission_id: string,
    type_paid: 'cash' | 'wallet'
  ): Promise<{ paid: boolean; balance: number | null }> {
    return adminMoneyRepository.payMissionBonus({
      driver_id,
      mission_id,
      type_paid
    })
  }
```

As validações locais (`progress não encontrado`, `missão ainda não concluída`, `missão já paga`) saem: a API faz as mesmas verificações dentro da transacção, onde não podem ficar desactualizadas entre a leitura e a escrita.

- [ ] **Step 2: Apagar o `payMissionBonus` privado**

Apagar todo o método `private async payMissionBonus` (`:222-278`). É o código que escrevia transacção e saldo a partir do cliente.

- [ ] **Step 3: Limpar imports órfãos**

Depois de apagar, provavelmente ficam sem uso: `walletRepository`, `transactionRepository`, `TransactionEntity`, `generateId`. **Não os apagues às cegas** — confirma com `npx tsc -b`, que acusa cada um por `noUnusedLocals`. Alguns podem ainda ser usados noutros métodos do ficheiro.

Acrescenta o import do `adminMoneyRepository` de `@/modules/Api` (juntando ao import existente se já houver um desse módulo).

Atenção: `missionRepository.updateProgress` continua a ser usado em `:185`, num caminho que não é de dinheiro. **Não mexer nele.**

- [ ] **Step 4: Largar o `withAudit` no ViewModel**

Em `src/viewModels/MissionViewModel.ts:126-147`, a mutation embrulha a chamada em `withAudit`. Substituir por chamada directa, mantendo o `onSuccess` e as chaves de invalidação exactamente como estão:

```ts
  const payMissionProgress = useMutation({
    mutationFn: ({
      driver_id,
      mission_id,
      type_paid
    }: {
      driver_id: string
      mission_id: string
      type_paid: 'cash' | 'wallet'
    }) => missionService.payMissionProgress(driver_id, mission_id, type_paid),
    onSuccess: (_, variables) => {
      // ... manter exactamente o que lá está
    }
  })
```

Se o `withAudit` ficar sem uso no ficheiro, remover o import.

- [ ] **Step 5: Distinguir `paid: false` na interface**

`src/components/drivers/DriverProgressTracker.tsx:52` faz `await payMissionProgress.mutateAsync({...})` e mostra sempre "Pagamento registrado com sucesso!". Agora que a API distingue, usar o resultado:

```ts
      const result = await payMissionProgress.mutateAsync({
        driver_id,
        mission_id,
        type_paid
      })
      if (result.paid) {
        showToast('success', 'Pagamento registrado com sucesso!')
      } else {
        showToast('info', 'Esta missão já tinha sido paga.')
      }
```

Confirma que `showToast` aceita `'info'`; se não aceitar, usa o nível que o componente já usa para informação neutra.

- [ ] **Step 6: Verificar**

```bash
npx tsc -b && echo "tsc ok"
grep -rn "walletRepository\|transactionRepository" src/services/mission.service.ts
npm run test
```

Expected: `tsc ok`, o grep **sem resultados** (nenhuma escrita de dinheiro sobra no serviço de missões), 86 testes.

- [ ] **Step 7: Commit**

```bash
git add src/services/mission.service.ts src/viewModels/MissionViewModel.ts src/components/drivers/DriverProgressTracker.tsx
git commit -m "refactor: pagamento de bonus de missao passa pela API"
```

---

## Task 3: A criação de carteiras passa pela API

**Files:**
- Modify: `src/services/wallet.service.ts`
- Modify: `src/viewModels/WalletViewModel.ts`
- Modify: `src/pages/main/Finances/components/ModalCreate.tsx`

**Interfaces:**
- Consumes: `adminMoneyRepository.createWallet` da Task 1.
- Produces: `walletService.createViaApi(input): Promise<{ walletId: string; balance: number }>`.

**Porquê um nome novo:** o `walletService.create` existente escreve directamente no Firestore. Em vez de mudar o seu comportamento por baixo de quem o chama, acrescenta-se `createViaApi` e muda-se o chamador. O `create` antigo fica sem consumidores no fim desta task — o Step 5 confirma isso e apaga-o.

- [ ] **Step 1: Acrescentar `createViaApi` ao service**

Em `src/services/wallet.service.ts`, junto ao `create`:

```ts
  /**
   * Cria a carteira no servidor, numa transacção auditada.
   * É a única porta de criação — a escrita directa produzia carteiras sem
   * `user_id`, que a app do motorista nunca encontrava.
   */
  async createViaApi(input: {
    user_id: string
    user: { id: string; firebase_uid: string; [key: string]: unknown }
    initial_balance: number
    currency: string
    status: string
    reason?: string
  }): Promise<{ walletId: string; balance: number }> {
    return adminMoneyRepository.createWallet(input)
  }
```

Sem `try/catch` — o `create` antigo tem um, que reembrulha o erro e perde a mensagem da API. O padrão certo é o do `WithdrawalService`: delegar directamente.

Acrescentar o import do `adminMoneyRepository`.

- [ ] **Step 2: O ViewModel usa o novo caminho, sem `withAudit`**

Em `src/viewModels/WalletViewModel.ts:69-83`:

```ts
  /** Criar carteira — no servidor, com auditoria dentro da transacção */
  const createWallet = useMutation({
    mutationFn: (input: {
      user_id: string
      user: { id: string; firebase_uid: string; [key: string]: unknown }
      initial_balance: number
      currency: string
      status: string
      reason?: string
    }) => walletService.createViaApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })
```

A chave de invalidação fica igual. Se `withAudit` ficar órfão no ficheiro, remover o import — mas confirma primeiro, porque as outras mutations deste ViewModel (`updateWallet`) continuam a usá-lo.

- [ ] **Step 3: A guarda de `firebase_uid` no modal**

Em `src/pages/main/Finances/components/ModalCreate.tsx`, antes do `mutateAsync` (`:133`), acrescentar a validação:

```ts
      if (!dataForm.user?.firebase_uid) {
        showToast(
          'error',
          `O motorista ${dataForm.user?.name ?? 'seleccionado'} não tem conta Firebase associada. ` +
            'Sem isso a carteira ficaria inacessível na app. Corrija o registo do motorista primeiro.'
        )
        setIsSending(false)
        return
      }
```

É a decisão explicada no topo deste plano: falhar cedo e em português, em vez de deixar a API devolver um 500 com texto em inglês.

- [ ] **Step 4: Adaptar a chamada e a resposta**

O `mutateAsync` actual envia `{ user, balance, status, currency }` e verifica `resultSubmit?.id`. O contrato da API é outro:

```ts
      const resultSubmit = await createWallet.mutateAsync({
        user_id: dataForm.user.id,
        user: dataForm.user,
        initial_balance: dataForm.balance,
        currency: dataForm.currency,
        status: dataForm.status
      })

      if (!resultSubmit?.walletId) {
        showToast('error', 'Houve algum erro durante a criação da carteira')
        setIsSending(false)
      } else {
        showToast('success', 'Carteira criada com sucesso!')
        // ... manter o resto exactamente como está
      }
```

Confirma os nomes reais dos campos em `dataForm` antes de colar — se o saldo se chamar outra coisa que não `balance`, usa o nome real.

**Nota sobre a verificação de duplicados** que o modal já faz antes (`:125-131`, "já tem uma carteira criada"): deixa-a. É boa experiência de utilização — falha antes de fazer o pedido. A API volta a verificar dentro da transacção, que é onde a garantia real vive; as duas não se contradizem.

- [ ] **Step 5: Apagar o `create` antigo do service**

```bash
grep -rn "walletService.create\b\|walletService\.create(" src/
```

Se não houver mais consumidores (esperado), apagar o método `create` de `src/services/wallet.service.ts:65-73`. Se houver, **parar e reportar** — não apagar código ainda em uso.

- [ ] **Step 6: Verificar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
npm run build
```

Expected: `tsc ok`, 86 testes, build exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/services/wallet.service.ts src/viewModels/WalletViewModel.ts src/pages/main/Finances/components/ModalCreate.tsx
git commit -m "refactor: criacao de carteiras passa pela API"
```

---

## Task 4: Apagar o modal morto e verificar

**Files:**
- Delete: `src/pages/main/Finances/components/ModalEdit.tsx`

- [ ] **Step 1: Confirmar que está mesmo morto**

```bash
grep -rn "ModalEditWallet" src/
```

Expected: **só o próprio ficheiro** (`src/pages/main/Finances/components/ModalEdit.tsx:50`). Se aparecer um import noutro sítio, **parar e reportar** — não apagar.

Cuidado a ler o resultado: existem `ModalEdit.tsx` noutras pastas (`Admin/`, `Passengers/`) que **estão** em uso. Só o de `Finances/` é morto, e só o símbolo `ModalEditWallet` interessa aqui.

- [ ] **Step 2: Apagar**

```bash
git rm src/pages/main/Finances/components/ModalEdit.tsx
```

- [ ] **Step 3: Nenhuma escrita de dinheiro sobra no cliente**

```bash
grep -rn "balance" src/services/ src/viewModels/ src/modules/Api/firebase/ | grep -v "\.test\." | grep -vi "net_balance\|getAll\|find\|read"
```

Lê cada resultado. Leituras e apresentação de saldo são legítimas; o que não pode existir é uma **escrita** de `balance` a partir do painel. Se encontrares uma, regista-a no relatório — pode ser um caminho que este plano não previu.

- [ ] **Step 4: As camadas continuam limpas**

```bash
grep -rn "from '@/modules/Api'" src/viewModels/ src/pages/ src/components/
```

Expected: **sem resultados**. As Tasks 2 e 3 acrescentaram imports do `adminMoneyRepository` — mas em *services*, nunca em ViewModels, páginas ou componentes.

- [ ] **Step 5: Suite completa**

```bash
npx tsc -b && npm run test && npm run build
echo "exit=$?"
```

Expected: 86 testes, `exit=0`.

- [ ] **Step 6: Commit**

```bash
git commit -m "chore: apagar ModalEditWallet sem consumidores"
```

---

## Fecho

Depois disto o painel não escreve dinheiro em lado nenhum. As seis operações de dinheiro do admin — aprovar carregamento, aprovar/rejeitar/marcar-pago um saque, pagar bónus de missão, criar carteira — correm todas em transacções no servidor, com auditoria dentro da transacção.

É o que desbloqueia a Fase 4: as Firestore Security Rules podem finalmente negar escrita de clientes em `wallets`, `transactions`, `missionProgress` e `withdrawal_requests`, porque nenhum cliente precisa dela. As regras actuais são o template por omissão e **expiram a 2026-11-11**.

Fica por fazer, conhecido e deferido: o `error-handler.hook.ts` da API mapeia erros de validação do Fastify para **500** em vez de 400 em todas as rotas, e as mensagens de erro da API estão em inglês numa interface em português. A guarda de `firebase_uid` da Task 3 contorna o caso mais provável, não o defeito.
