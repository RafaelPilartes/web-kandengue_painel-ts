# Services → UseCases: Lote 4 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Converter `wallet` e `withdrawal` — os dois híbridos, que leem do Firestore e escrevem pela API.

**Architecture:** As leituras passam pelo `run()` do `BaseUseCase`, como nos lotes anteriores. As escritas na API **não passam**, porque o `run()` destruiria a mensagem de erro que o servidor devolve.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

Treze usecases contra nove services, 185 testes. Este lote leva os dois últimos que a migração do dinheiro moldou.

### São híbridos, não só-leitura

Os DAOs de `wallet` e `withdrawal` são `ReadOnlyDAO` — não escrevem no Firestore, porque essas operações vivem na API em transacções auditadas. Mas os **services** escrevem, através do `adminMoneyRepository`:

| Service | Lê de | Escreve via `adminMoney` |
| --- | --- | --- |
| `wallet` | `walletRepository` | `createViaApi`, `setStatus` |
| `withdrawal` | `withdrawalRepository` | `approve`, `reject`, `markAsPaid` |

Portanto o "só-leitura" aplica-se ao repositório Firestore, não ao usecase. Estes usecases orquestram os dois lados, e isso é o desenho, não um acidente.

### A regra que este lote existe para respeitar

Os cinco métodos de escrita delegam **sem `try/catch`**. Não é esquecimento: foi decidido durante a migração do dinheiro, para a mensagem de erro da API chegar ao admin.

O `run()` do `BaseUseCase` chama o `toAppError`, e **verifiquei o que ele faz**:

```ts
const message = context ? `${context} ${MESSAGES[code]}` : MESSAGES[code]
return new AppError(code, message, err)
```

Substitui a mensagem por uma genérica da tabela. A original sobrevive só no `cause`, não no `.message` — e a UI mostra `error.message` (`wallet.tsx:120`).

Como o `Error` que o `ApiDAO` lança não tem `code`, cairia em `unknown`. Resultado: *"Este motorista já tem uma carteira: wt-123"* viraria **"Ocorreu um erro inesperado."**

**Os métodos que chamam a API delegam directamente, sem `run()`.** É a única excepção ao padrão dos lotes anteriores, e a Task 3 verifica-a.

## Global Constraints

- **As escritas na API não passam pelo `run()`.** Delegar directamente, como os services fazem hoje.
- **As leituras do Firestore passam**, como nos lotes anteriores.
- **Não mudar comportamento.** Os 185 testes são a rede.
- **Nada de `field: string` nem `as keyof`** — usar `FieldPath<T>`.
- **Os repositórios vêm do `ApiRepository`**, incluindo o `adminMoney`, que já lá está.
- **Não tocar no `audit.service.ts` nem no `withAudit`.**
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **185**. Emulador na porta **8090**.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## Task 1: `wallet`

**Files:**
- Create: `src/domain/usecases/walletUseCase.ts`
- Delete: `src/services/wallet.service.ts`
- Modify: os ViewModels que o consomem

**Leituras** (passam pelo `run()`): `getAll`, `getById`, `getOneByField`, `getAllByField`.

**Escritas na API** (não passam): `createViaApi`, `setStatus`.

- [ ] **Step 1: Ler antes de converter**

```bash
cat src/services/wallet.service.ts
grep -rn "walletService\|WalletService" src/
```

- [ ] **Step 2: Converter, com a distinção**

```ts
  /**
   * Cria a carteira no servidor, numa transacção auditada.
   *
   * NÃO passa pelo `run()`: o `toAppError` substituiria a mensagem da API
   * por uma genérica, e o admin deixaria de saber o que correu mal. O
   * `ApiDAO` já extrai a mensagem do servidor.
   */
  executeCreateViaApi(input: {
    user_id: string
    user: { id: string; firebase_uid: string; [key: string]: unknown }
    initial_balance: number
    currency: string
    status: string
    reason?: string
  }): Promise<{ walletId: string; balance: number }> {
    return ApiRepository.adminMoney.createWallet(input)
  }
```

O `setStatus` segue a mesma forma. Confirmar as assinaturas exactas no service antes de escrever — o `createViaApi` tem um objecto de entrada com campos obrigatórios que o modal do painel preenche.

- [ ] **Step 3: Repontar, apagar, verificar e commit**

```bash
git rm src/services/wallet.service.ts
npx tsc -b && npm run test && npm run build
git commit -m "refactor: walletUseCase substitui wallet.service"
```

---

## Task 2: `withdrawal`

**Files:**
- Create: `src/domain/usecases/withdrawalUseCase.ts`
- Delete: `src/services/withdrawal.service.ts`
- Modify: os ViewModels que o consomem

**Leituras** (passam pelo `run()`): `getAll`, `getById`, `countByStatus`, `getEarningsByIds`.

**Escritas na API** (não passam): `approve`, `reject`, `markAsPaid`.

- [ ] **Step 1: Ler o service**

Reparar que o `countByStatus` e o `getEarningsByIds` são leituras com forma própria — o primeiro delega no `count` do motor, o segundo lê a colecção `referral_earnings` em lotes de 30, por causa do limite do operador `in` do Firestore.

- [ ] **Step 2: Converter**

As três acções de saque devolvem objectos com significado que a UI distingue:

- `approve` → `{ changed: boolean }`
- `reject` → `{ changed: boolean; revertedEarnings: number }`
- `markAsPaid` → `{ changed: boolean; paidEarnings: number }`

`changed: false` significa que a operação já tinha sido feita — **não é erro**. Manter esses tipos intactos; a página usa-os.

- [ ] **Step 3: Repontar, apagar, verificar e commit**

```bash
git rm src/services/withdrawal.service.ts
npx tsc -b && npm run test && npm run build
git commit -m "refactor: withdrawalUseCase substitui withdrawal.service"
```

---

## Task 3: Verificação do lote

**Files:** nenhum a modificar.

- [ ] **Step 1: Contagens**

```bash
ls src/domain/usecases/*UseCase.ts | wc -l
ls src/services/*.service.ts | wc -l
grep -l "offsetToCursor" src/services/*.service.ts | wc -l
```

Expected: **15** usecases, **7** services, **1** cópia do `offsetToCursor` (só no `audit`).

- [ ] **Step 2: A regra deste lote — a verificação que importa**

```bash
grep -n -B2 "adminMoney\." src/domain/usecases/walletUseCase.ts src/domain/usecases/withdrawalUseCase.ts
```

Expected: **nenhuma** dessas chamadas dentro de `this.run(`. Se alguma estiver, a mensagem de erro da API foi destruída, e a UI passa a mostrar "Ocorreu um erro inesperado" em vez do que o servidor disse.

- [ ] **Step 3: Camadas e castings**

```bash
grep -rn "from '@/modules/Api'" src/domain/usecases/
grep -n "as keyof\|field: string" src/domain/usecases/*.ts || echo "(limpo)"
```

Expected: ambos sem resultados.

- [ ] **Step 4: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 5: Relatório**

Sem commit. Registar quantos consumidores cada conversão tocou, e confirmar explicitamente quais métodos ficaram fora do `run()` e porquê.

---

## Fecho

Quinze usecases contra sete services, e a última cópia do `offsetToCursor` isolada no `audit`.

Sobram: `promotion`, `mission`, `appConfig`, `files`, `auth`, e os dois que não são usecases de entidade — `audit`, com o `withAudit` de 57 consumidores, e `finance`, que agrega dois DAOs e importa-os directamente, saltando o factory.
