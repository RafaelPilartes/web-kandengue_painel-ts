# Migrar os DAOs do Painel — Lote 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar quatro DAOs de CRUD puro para o `BaseFirebaseDAO`, corrigindo pelo caminho três pesquisas que estão partidas.

**Architecture:** Cada DAO passa a ser uma classe de ~16 linhas que só declara colecção, converter, prefixo de ID e campo de pesquisa. O trabalho real é escrever o `FirestoreDataConverter` de cada entidade — hoje só o `Vehicle` tem um.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

O piloto está feito: `BaseFirebaseDAO.ts` (346 linhas) e `vehicle.dao.ts`, que passou de **196 para 16 linhas**. Restam 19 DAOs no painel, 3582 linhas ao todo.

Este lote leva quatro: `document`, `notification`, `rideRate`, `transaction`.

### Três pesquisas partidas, e como se descobre

O varrimento dos DAOs mostrou que `document`, `walletTopupRequest` e `rideRate` fazem prefix-search sobre **`email`** — um campo que as respectivas entidades não têm. `Driver` e `Admin` estendem `UserEntity` e por isso têm email legitimamente; estes três não estendem nada.

Provei-o contra o emulador: numa colecção `rideRates` com um documento, a consulta que o DAO faz devolve **zero**. Não dá erro — nenhum documento tem o campo, portanto nenhum passa o filtro. A pesquisa está morta e falha em silêncio.

É copiar-colar entre DAOs. O padrão novo elimina a categoria inteira, porque o campo passa a estar visível no construtor em vez de enterrado a 60 linhas.

### O que mais o varrimento revelou

`transaction.dao.ts:169` gera IDs com `generateId('wt')` — o prefixo das **carteiras**. As transacções escritas pela app do motorista usam `tra`. Há transacções em produção com IDs que parecem de carteira; isto corrige daqui para a frente, sem tocar nas existentes.

`auth.dao.ts` tem **0 linhas**. Fora do âmbito deste lote, mas fica registado.

## Global Constraints

- **`searchField` é `keyof T & string`** — só campos de topo. `user.name` não compila.
- **Não mudar IDs existentes.** Corrigir o prefixo afecta só documentos novos.
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificação com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **86**. Precisam do emulador em **8090**.
- Alias `@/` → `src/`. Aspas simples, sem ponto e vírgula, indentação de 2.
- **Nenhum ViewModel, página ou componente importa `@/modules/Api`** — está limpo, não reintroduzir.
- O `initializeFirestore` já usa `ignoreUndefinedProperties`, por isso **não é preciso `sanitize`** nos DAOs novos. Era isso que os antigos faziam à mão.

---

## O contrato de cada DAO migrado

O `vehicle.dao.ts` é o modelo exacto:

```ts
export class FirebaseVehicleDAO
  extends BaseFirebaseDAO<VehicleEntity>
  implements IVehicleRepository
{
  constructor() {
    super(firebaseCollections.vehicles.root, vehicleConverter, 'veh', 'plate')
  }
}
```

E o `vehicleConverter` (`src/core/entities/Vehicle.ts:46`) é o modelo do converter:

```ts
export const vehicleConverter: FirestoreDataConverter<VehicleEntity> = {
  toFirestore(vehicle) {
    return { ...vehicle }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as VehicleDoc
    return new VehicleEntity({
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at),
      updated_at: toDate(d.updated_at)
    })
  }
}
```

O trabalho por entidade é identificar **todos** os campos de data e passá-los por `toDate`. Falhar um deixa um `Timestamp` do Firestore onde o código espera um `Date`, e isso só rebenta em execução.

---

## Task 1: `document`

**Files:**
- Modify: `src/core/entities/Document.ts` (acrescentar converter)
- Rewrite: `src/modules/Api/firebase/document.dao.ts` (196 → ~16 linhas)
- Create: `src/modules/Api/firebase/__tests__/document.dao.test.ts`

**Campos da entidade:** `id, user, type, url, status, feedback, vehicle_id, created_at, updated_at`

**Campo de pesquisa: `type`.** O actual é `email`, que a entidade não tem — pesquisa sempre vazia. `type` é o único campo de texto de topo. Não usar `user.name`: é aninhado e não compila.

**Prefixo:** `doc` (mantém-se).

- [ ] **Step 1: Ler os dois modelos**

```bash
cat src/modules/Api/firebase/vehicle.dao.ts
sed -n '40,60p' src/core/entities/Vehicle.ts
```

- [ ] **Step 2: O converter**

Em `src/core/entities/Document.ts`, seguindo o do `Vehicle`. Passar por `toDate` **todos** os campos de data — aqui `created_at` e `updated_at`. Confirmar no ficheiro se há outros.

- [ ] **Step 3: Reescrever o DAO**

Substituir as 196 linhas pela classe curta. Confirmar o nome exacto da interface que ele implementa (`IDocumentRepository` ou similar) e o nome no registo `firebaseCollections`.

- [ ] **Step 4: Testes**

Seguir `src/modules/Api/firebase/__tests__/vehicle.dao.test.ts`. Cobrir: `create` + `getById` de ida e volta, `getAll` com paginação, e — importante — **um teste que prova que a pesquisa por `type` devolve resultados**, que é o que estava partido.

- [ ] **Step 5: Verificar**

```bash
npx tsc -b && npm run test
```

Expected: `tsc` limpo, 86 testes + os novos.

- [ ] **Step 6: Commit**

```bash
git add src/core/entities/Document.ts src/modules/Api/firebase/document.dao.ts src/modules/Api/firebase/__tests__/document.dao.test.ts
git commit -m "refactor: document.dao usa o BaseFirebaseDAO; corrigir pesquisa"
```

---

## Task 2: `notification`

**Files:**
- Modify: `src/core/entities/Notification.ts`
- Rewrite: `src/modules/Api/firebase/notification.dao.ts` (205 → ~16)
- Create: `src/modules/Api/firebase/__tests__/notification.dao.test.ts`

**Campos:** `id, title, message, type, category, specific_user, user, user_id, user_role, is_read, sent, sent_at, created_at`

**Campo de pesquisa: `title`** — já era o correcto, mantém-se. **Prefixo:** `nft`.

**Atenção às datas:** esta entidade tem `sent_at` **e** `created_at`. Ambos precisam de `toDate`. Não tem `updated_at` — não inventar.

- [ ] **Step 1: Converter, DAO e testes**, seguindo a Task 1.

Como a pesquisa já funcionava, o teste de pesquisa aqui é uma **regressão**: prova que continua a funcionar depois da migração.

- [ ] **Step 2: Verificar e commit**

```bash
npx tsc -b && npm run test
git add src/core/entities/Notification.ts src/modules/Api/firebase/notification.dao.ts src/modules/Api/firebase/__tests__/notification.dao.test.ts
git commit -m "refactor: notification.dao usa o BaseFirebaseDAO"
```

---

## Task 3: `rideRate` — o caso sem pesquisa

**Files:**
- Modify: `src/core/entities/RideRate.ts`
- Rewrite: `src/modules/Api/firebase/rideRate.dao.ts` (200 → ~14)
- Create: `src/modules/Api/firebase/__tests__/rideRate.dao.test.ts`

**Campos:** `id, day_rates, night_rates, insurance_percent, payouts, updated_at`

**Não declarar `searchField`.** A entidade não tem um único campo de texto de topo — `day_rates` e `payouts` são objectos, os restantes são números. O actual pesquisa por `email`, que não existe.

O `BaseFirebaseDAO` lança um `AppError('failed-precondition')` com mensagem explícita se alguém tentar pesquisar num DAO sem `searchField`. É melhor do que devolver vazio para sempre: falha alto em vez de mentir.

O construtor fica com três argumentos:

```ts
super(firebaseCollections.rideRates.root, rideRateConverter, 'rate')
```

**Datas:** só `updated_at`. Confirmar se há `created_at` no documento real — o varrimento não o encontrou na entidade, mas o DAO antigo ordenava por ele. Se a entidade não o declara e o Firestore o tem, é uma divergência a registar no relatório, não a resolver por iniciativa própria.

- [ ] **Step 1: Converter, DAO e testes.**

O teste característico desta task: **pesquisar tem de lançar erro**, não devolver vazio. Escrever isso explicitamente.

- [ ] **Step 2: Verificar e commit**

```bash
npx tsc -b && npm run test
git add src/core/entities/RideRate.ts src/modules/Api/firebase/rideRate.dao.ts src/modules/Api/firebase/__tests__/rideRate.dao.test.ts
git commit -m "refactor: rideRate.dao usa o BaseFirebaseDAO; pesquisa deixa de mentir"
```

---

## Task 4: `transaction`

**Files:**
- Modify: `src/core/entities/Transaction.ts`
- Rewrite: `src/modules/Api/firebase/transaction.dao.ts` (204 → ~16)
- Create: `src/modules/Api/firebase/__tests__/transaction.dao.test.ts`

**Campos:** `id, wallet_id, user_id, type, category, amount, status, reference_id, provider, provider_transaction_id, description, originator_conversation_id, conversation_id, created_at, updated_at`

**Campo de pesquisa: `description`** — já era o correcto.

**Prefixo: `tra`, não `wt`.** O actual (`transaction.dao.ts:169`) usa `wt`, que é o prefixo das carteiras. As transacções escritas pela app do motorista usam `tra`. Isto só afecta IDs novos; os existentes ficam como estão, e não há migração a fazer.

- [ ] **Step 1: Converter, DAO e testes.**

Acrescentar um teste que verifica que um `create` gera um ID começado por `tra-`.

- [ ] **Step 2: Verificar e commit**

```bash
npx tsc -b && npm run test
git add src/core/entities/Transaction.ts src/modules/Api/firebase/transaction.dao.ts src/modules/Api/firebase/__tests__/transaction.dao.test.ts
git commit -m "refactor: transaction.dao usa o BaseFirebaseDAO; corrigir prefixo de ID"
```

---

## Task 5: Verificação do lote

**Files:** nenhum a modificar.

- [ ] **Step 1: Quantos DAOs migrados**

```bash
grep -l "extends BaseFirebaseDAO" src/modules/Api/firebase/*.dao.ts | wc -l
```

Expected: **5** (o vehicle mais os quatro).

- [ ] **Step 2: Quanto código desapareceu**

```bash
wc -l src/modules/Api/firebase/{document,notification,rideRate,transaction}.dao.ts
```

Expected: ~64 linhas no total, contra 805 antes.

- [ ] **Step 3: Nenhum `sanitize` sobrou**

```bash
grep -n "sanitize" src/modules/Api/firebase/{document,notification,rideRate,transaction}.dao.ts || echo "(limpo)"
```

O `ignoreUndefinedProperties` do `initializeFirestore` cobre isso.

- [ ] **Step 4: As camadas continuam limpas**

```bash
grep -rn "from '@/modules/Api'" src/viewModels/ src/pages/ src/components/
```

Expected: **sem resultados**.

- [ ] **Step 5: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 6: Relatório**

Sem commit. Registar: linhas antes e depois por DAO, campos de data que cada converter trata, e qualquer divergência entre a entidade e o que está no Firestore.

---

## Fecho

Cinco dos vinte DAOs do painel migrados, e três pesquisas que devolviam vazio passam a funcionar ou a falhar alto.

Sobram catorze, em três grupos: os de CRUD puro (`ride`, `rideTracking`, `walletTopupRequest`), os que precisam de um método extra (`users`, `driver`, `admins`, `application`, `mission`), e os que não são CRUD (`wallet` só-leitura, `auditLog` append-only, `withdrawal`, `promotion`, `appConfig`, `file` que é Storage). O `auth.dao.ts` está vazio e é para apagar.
