# Migrar os DAOs do Painel — Lote 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar os três DAOs de CRUD puro que restam, alargando o motor para suportar pesquisa em campos aninhados — sem perder a verificação de tipos que apanhou os bugs do lote 1.

**Architecture:** O `searchField` passa a aceitar caminhos com ponto (`driver.email`) além dos campos de topo, através de um tipo que continua a recusar nomes inexistentes. Depois disso, os três DAOs colapsam como os do lote 1.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

O lote 1 migrou quatro DAOs: 805 linhas para 79, e corrigiu duas pesquisas que devolviam vazio porque procuravam por um campo que a entidade não tinha. Estão 5 de 20 migrados, com 106 testes.

Este lote leva `ride`, `rideTracking` e `walletTopupRequest` — os três últimos de CRUD puro. Juntos são 814 linhas.

### Porque o motor tem de mudar primeiro

O `ride.dao.ts:71` pesquisa por **`driver.email`**, um campo aninhado. O `searchField` do `BaseFirebaseDAO` está tipado `keyof T & string`, que só aceita campos de topo — o `ride` não cabe.

Alargar para `string` resolveria e seria um erro: `keyof T & string` é exactamente o que recusa `email` numa entidade sem email, e foi isso que expôs os bugs do lote 1. Perder essa verificação para acomodar um caso seria trocar uma protecção real por conveniência.

A solução mantém as duas coisas:

```ts
type SearchField<T> = (keyof T & string) | `${string}.${string}`
```

Ou é um campo real da entidade, ou é um caminho com ponto — explicitamente aninhado, assumido como não verificável. Um typo de topo (`stauts`) continua a ser recusado; `email` numa entidade sem email continua a ser recusado.

**Verifiquei este tipo com `@ts-expect-error` antes de o propor:** aceita `status` e `driver.email`, recusa `email` em `RideRate` e recusa `stauts` em `Ride`.

### A terceira pesquisa partida

`walletTopupRequest.dao.ts:71` procura por `email`. A entidade não tem esse campo e não estende nada — mesma família dos dois corrigidos no lote 1, e devolve vazio sempre.

Passa a `phone_number`, que existe e é por onde um admin procura um carregamento.

## Global Constraints

- **Não perder a verificação de tipos.** Se a mudança ao `searchField` deixar passar `email` numa entidade sem email, está errada.
- **Não mudar IDs existentes.** Os prefixos actuais (`rid`, `rtck`, `wtopr`) mantêm-se — nenhum está trocado neste lote.
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificação com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **106**. Emulador na porta **8090**.
- **Nenhum ViewModel, página ou componente pode ser tocado.** Se a assinatura de um DAO mudar de forma que parta um consumidor, a tradução fica no `*.service.ts` — foi o que o lote 1 fez, e é o precedente.
- Sem `sanitize` nos DAOs novos: o `initializeFirestore` já usa `ignoreUndefinedProperties`.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## Task 1: O motor aceita caminhos aninhados

**Files:**
- Modify: `src/modules/Api/firebase/BaseFirebaseDAO.ts`
- Modify: `src/modules/Api/firebase/__tests__/baseFirebaseDao.read.test.ts`

**Interfaces:**
- Produces: `type SearchField<T> = (keyof T & string) | \`${string}.${string}\``, exportado, e o construtor a aceitá-lo. As Tasks 2–4 dependem disto.

- [ ] **Step 1: Ver o estado actual**

```bash
sed -n '55,80p' src/modules/Api/firebase/BaseFirebaseDAO.ts
```

`searchField` está declarado duas vezes — na propriedade (`:61`) e no parâmetro do construtor (`:74`). Ambos mudam.

- [ ] **Step 2: Um teste que prova a protecção**

Antes de mexer, escrever um teste de tipos que falharia se a protecção se perdesse. No ficheiro de testes de leitura, ou num `.test-d.ts` se o projecto tiver essa convenção — verificar antes qual usa:

```ts
// Os campos válidos passam; os inválidos são recusados em tempo de compilação.
// Se algum destes `@ts-expect-error` deixar de acusar erro, a protecção
// que apanhou os bugs do lote 1 desapareceu.
type Amostra = { id: string; status: string; driver: { email: string } }

const topo: SearchField<Amostra> = 'status'
const aninhado: SearchField<Amostra> = 'driver.email'
// @ts-expect-error — campo que não existe na entidade
const inexistente: SearchField<Amostra> = 'email'
// @ts-expect-error — typo num campo de topo
const typo: SearchField<Amostra> = 'stauts'
```

**O `@ts-expect-error` é o próprio teste:** se a linha seguinte deixar de dar erro, o TypeScript acusa o `@ts-expect-error` como inútil e o build falha. É o que torna esta verificação real em vez de decorativa.

- [ ] **Step 3: Alargar o tipo**

Declarar e exportar o `SearchField<T>`, e usá-lo nos dois sítios. Documentar no comentário do construtor que um caminho com ponto **não é verificado** contra a entidade — é uma promessa de quem chama.

- [ ] **Step 4: Confirmar que o Firestore aceita o caminho aninhado**

O `orderBy('driver.email')` e o `where('driver.email', '>=', …)` são válidos no Firestore, mas convém prová-lo em vez de assumir. Acrescentar um teste que semeia um documento com objecto aninhado e confirma que a pesquisa o encontra.

- [ ] **Step 5: Verificar**

```bash
npx tsc -b && npm run test
```

Expected: 106 testes mais os novos. Nenhum DAO mudou ainda.

- [ ] **Step 6: Commit**

```bash
git add src/modules/Api/firebase/BaseFirebaseDAO.ts src/modules/Api/firebase/__tests__/
git commit -m "feat: searchField aceita caminhos aninhados sem perder a verificacao de tipos"
```

---

## Task 2: `rideTracking`

**Files:**
- Modify: `src/core/entities/RideTracking.ts` (converter)
- Rewrite: `src/modules/Api/firebase/rideTracking.dao.ts` (229 → ~16)
- Create: `src/modules/Api/firebase/__tests__/rideTracking.dao.test.ts`

O mais simples dos três — nada de anómalo. Serve para confirmar que o lote arranca bem antes dos outros dois.

**Campo de pesquisa: `ride_id`** — já era o correcto e existe na entidade. **Prefixo:** `rtck`.

- [ ] **Step 1: Converter, DAO e testes**, seguindo os modelos:

```bash
cat src/modules/Api/firebase/vehicle.dao.ts
sed -n '46,59p' src/core/entities/Vehicle.ts
cat src/modules/Api/firebase/__tests__/rideRate.dao.test.ts
```

Converter **todos** os campos de data por `toDate`. Ler a entidade em vez de assumir quais são — o `rideTracking` guarda um `path` de posições, e vale confirmar se os pontos têm timestamps próprios.

- [ ] **Step 2: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: rideTracking.dao usa o BaseFirebaseDAO"
```

---

## Task 3: `walletTopupRequest` — a terceira pesquisa partida

**Files:**
- Modify: `src/core/entities/WalletTopupRequest.ts`
- Rewrite: `src/modules/Api/firebase/walletTopupRequest.dao.ts` (212 → ~16)
- Create: `src/modules/Api/firebase/__tests__/walletTopupRequest.dao.test.ts`

**Campo de pesquisa: `phone_number`.** O actual é `email`, que a entidade não tem — devolve vazio sempre, como o `document` e o `rideRate` do lote 1.

**Prefixo:** `wtopr`.

**Datas:** esta entidade tem várias — `created_at`, `processed_at`, `confirmed_at`, `updated_at`. Confirmar no ficheiro e converter todas. É a que tem mais, e a mais fácil de falhar uma.

- [ ] **Step 1: Converter, DAO e testes.**

O teste característico: **provar que a pesquisa por `phone_number` devolve resultados**. É o bug a ser corrigido.

- [ ] **Step 2: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: walletTopupRequest.dao usa o BaseFirebaseDAO; corrigir pesquisa"
```

---

## Task 4: `ride` — o caso da pesquisa aninhada

**Files:**
- Modify: `src/core/entities/Ride.ts`
- Rewrite: `src/modules/Api/firebase/ride.dao.ts` (373 → ~18)
- Create: `src/modules/Api/firebase/__tests__/ride.dao.test.ts`

O maior dos três, e o que motivou a Task 1.

**Campo de pesquisa: `driver.email`** — aninhado, e é o que o DAO já faz hoje (`:71`). Os campos de topo do `RideEntity` são `status`, `type`, `otp_code`, `cancel_reason`; nenhum serve para um admin procurar uma corrida. Ele procura pelo motorista.

**Prefixo:** `rid`.

**Datas — esta entidade tem muitas:** `waiting_start_at`, `waiting_end_at`, `completed_at`, `canceled_at`, `created_at`, `updated_at`. Ler o ficheiro e converter todas. Falhar uma deixa um `Timestamp` onde o código espera `Date`, e isso só aparece em execução.

**Atenção ao `fare`:** é um objecto com `breakdown` e `payouts`. Não tem datas, mas confirmar antes de assumir.

- [ ] **Step 1: Converter, DAO e testes.**

O teste característico: semear uma corrida com `driver: { email: 'x@y.ao' }` e provar que a pesquisa a encontra. É o que justifica a Task 1 ter existido.

- [ ] **Step 2: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: ride.dao usa o BaseFirebaseDAO com pesquisa aninhada"
```

---

## Task 5: Verificação do lote

**Files:** nenhum a modificar.

- [ ] **Step 1: Quantos migrados**

```bash
grep -l "extends BaseFirebaseDAO" src/modules/Api/firebase/*.dao.ts | wc -l
```

Expected: **8** de 20.

- [ ] **Step 2: Linhas**

```bash
wc -l src/modules/Api/firebase/{ride,rideTracking,walletTopupRequest}.dao.ts
```

Expected: ~50 no total, contra 814 antes.

- [ ] **Step 3: A protecção de tipos continua viva**

```bash
npx tsc -b
```

Se algum `@ts-expect-error` da Task 1 tiver deixado de ser necessário, o compilador acusa-o. É o sinal de que a protecção se perdeu.

- [ ] **Step 4: Camadas e sanitize**

```bash
grep -rn "from '@/modules/Api'" src/viewModels/ src/pages/ src/components/
grep -l "sanitize" src/modules/Api/firebase/{ride,rideTracking,walletTopupRequest}.dao.ts
```

Expected: ambos sem resultados.

- [ ] **Step 5: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 6: Relatório**

Sem commit. Registar linhas antes e depois, campos de data por converter, e qualquer divergência entre a entidade e o que o DAO antigo assumia.

---

## Fecho

Oito dos vinte DAOs migrados, os de CRUD puro esgotados, e as três pesquisas partidas todas corrigidas.

Sobram doze: cinco que precisam de um método extra (`users`, `driver`, `admins`, `application`, `mission`), seis que não são CRUD (`wallet` só-leitura, `auditLog` append-only, `withdrawal`, `promotion`, `appConfig`, `file` que é Storage), e o `auth.dao.ts` vazio, para apagar.
