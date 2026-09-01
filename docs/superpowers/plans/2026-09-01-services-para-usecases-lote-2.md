# Services → UseCases: Lote 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Converter seis services em usecases — os que mapeiam um DAO e têm no máximo dois métodos extra.

**Architecture:** Cada um segue o `vehicleUseCase`: repositório vindo do `ApiRepository`, métodos `executeXxx` embrulhados em `this.run()`, e o `offsetToCursor` do `BaseUseCase` em vez da cópia local.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

A fundação está feita: o factory expõe 21 repositórios com instanciação preguiçosa, o `BaseUseCase` absorveu o `offsetToCursor` que estava copiado catorze vezes, e três services já viraram usecases. São **5 usecases contra 17 services**, com 185 testes.

Este lote leva seis: `transaction`, `rideTracking`, `walletTopupRequest`, `applications`, `admins`, `users` — 853 linhas.

Foram escolhidos por serem uniformes: cada um mapeia um DAO, todos têm a sua cópia do `offsetToCursor`, e os extras resumem-se a `getByEmail`, `softDelete` e `approveTopup`.

### O que a fundação já provou

As três primeiras conversões foram mecânicas. O `notification` foi a prova de que o helper centralizado funciona no terreno, e de que o padrão aguenta um usecase que orquestra mais do que um repositório.

### O que aprendemos a meio, e que este lote tem de respeitar

Os usecases da fundação nasceram com `field: string` e um `as keyof` a converter — um casting que cala o compilador. Apertar isso expôs que o `DriverDetails.tsx` procura documentos por **`user.id`**, um caminho aninhado.

A correcção foi o `FieldPath<T>` em `src/core/interfaces/IBaseRepository.ts`: aceita campos de topo, que continuam verificados, ou caminhos com ponto, que não são. **Os usecases deste lote usam `FieldPath<T>` desde o início.** Nada de `field: string`, nada de `as keyof`.

## Global Constraints

- **Não mudar comportamento.** Os 185 testes existentes são a rede.
- **Nada de `as keyof` nem `field: string`.** Usar `FieldPath<T>` do `IBaseRepository`.
- **Não tocar no `audit.service.ts` nem no `withAudit`** — transversal, 57 consumidores, fica para decisão própria.
- **O repositório vem sempre do `ApiRepository`**, nunca de `@/modules/Api` nem de `@/modules/Api/firebase/*`.
- **Apagar cada service** quando o usecase o substituir — não deixar os dois.
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **185**. Emulador na porta **8090**.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## O modelo

`src/domain/usecases/notificationUseCase.ts` é a referência mais recente — usa o `offsetToCursor` do `BaseUseCase` e orquestra dois repositórios. O `vehicleUseCase` mostra como guardar regras de negócio.

Padrão de cada método:

```ts
  executeGetById(id: string): Promise<XEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }
```

O `run()` substitui o `try/catch` + `console.error` que cada método de cada service repete. **Ler o service antes de converter:** se ele fizer mais do que delegar — validar, normalizar, orquestrar — essa lógica vai para o usecase, não desaparece.

---

## Task 1: `transaction` e `rideTracking`

**Files:**
- Create: `src/domain/usecases/transactionUseCase.ts`, `src/domain/usecases/rideTrackingUseCase.ts`
- Delete: `src/services/transaction.service.ts`, `src/services/rideTracking.service.ts`
- Modify: os ViewModels que os consomem

Os dois mais simples do lote — sem métodos extra. Fazem-se juntos porque a forma é idêntica.

- [ ] **Step 1: Ler antes de converter**

```bash
cat src/services/transaction.service.ts
grep -rn "transaction.service\|TransactionService" src/
```

Reparar nos `LEGACY_PAGE_SIZE` — as conversões da fundação preservaram-nos como constantes locais, porque o motor usa 50 por omissão e os services antigos usavam outros valores. Manter esse comportamento.

- [ ] **Step 2: Converter os dois**

Usar `this.offsetToCursor(this.repository, base, offset)` em vez da cópia local.

- [ ] **Step 3: Repontar os ViewModels e apagar os services**

```bash
git rm src/services/transaction.service.ts src/services/rideTracking.service.ts
```

- [ ] **Step 4: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: transactionUseCase e rideTrackingUseCase substituem os services"
```

---

## Task 2: `applications` e `admins`

**Files:**
- Create: `src/domain/usecases/applicationUseCase.ts`, `src/domain/usecases/adminUseCase.ts`
- Delete: os dois services
- Modify: os ViewModels

Ambos com um extra: `getByEmail`.

- [ ] **Step 1: O `getByEmail` é `getOneByField` disfarçado**

Foi o que se confirmou na migração dos DAOs. No usecase:

```ts
  executeGetByEmail(email: string): Promise<AdminEntity | null> {
    return this.run('getByEmail', () =>
      this.repository.getOneByField('email', email)
    )
  }
```

**Ler o service primeiro:** se ele normalizar o email (minúsculas, trim) antes de procurar, essa normalização é a regra de negócio e vai para o usecase — como a matrícula no `vehicleUseCase`.

- [ ] **Step 2: Converter, repontar, apagar**

- [ ] **Step 3: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: applicationUseCase e adminUseCase substituem os services"
```

---

## Task 3: `users` — com `softDelete`

**Files:**
- Create: `src/domain/usecases/userUseCase.ts`
- Delete: `src/services/users.service.ts`
- Modify: os ViewModels

Dois extras: `getByEmail` e `softDelete`.

**O `softDelete` porta-se como está.** Marca `status: 'deleted'` e, se o `firebaseUid` corresponder ao utilizador com sessão iniciada, apaga a conta no Firebase Auth. Manter a assinatura `(id: string, firebaseUid?: string)` — o ViewModel depende dela.

Não mudar essa semântica aqui: é uma conversão estrutural, e eliminar contas não é assunto para se decidir de passagem.

- [ ] **Step 1: Converter, repontar, apagar**
- [ ] **Step 2: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: userUseCase substitui users.service"
```

---

## Task 4: `walletTopupRequest` — com `approveTopup`

**Files:**
- Create: `src/domain/usecases/walletTopupRequestUseCase.ts`
- Delete: `src/services/walletTopupRequest.service.ts`
- Modify: os ViewModels

**O `approveTopup` chama a API, não o Firestore.** Delega em `adminMoneyRepository.approveTopup(id)`, que já está no factory como `ApiRepository.adminMoney`.

Este método existe porque o painel deixou de escrever dinheiro: aprovar um carregamento credita a carteira numa transacção auditada no servidor. **`credited: false` significa que já estava aprovado — não é erro**, e o ViewModel distingue os dois casos.

Não acrescentar `try/catch` à volta dele: o `ApiDAO` já extrai a mensagem de erro da API, e o `run()` do `BaseUseCase` normaliza o resto. Embrulhar outra vez perderia a mensagem.

- [ ] **Step 1: Converter, usando `ApiRepository.adminMoney` para o `approveTopup`**
- [ ] **Step 2: Repontar, apagar, verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: walletTopupRequestUseCase substitui o service"
```

---

## Task 5: Verificação do lote

**Files:** nenhum a modificar.

- [ ] **Step 1: Contagens**

```bash
ls src/domain/usecases/*UseCase.ts | wc -l
ls src/services/*.service.ts | wc -l
grep -l "offsetToCursor" src/services/*.service.ts | wc -l
```

Expected: **11** usecases, **11** services, e **5** cópias do `offsetToCursor` (eram 11).

- [ ] **Step 2: Ninguém salta o factory**

```bash
grep -rn "from '@/modules/Api'" src/domain/usecases/
grep -rn "from '@/modules/Api/firebase/" src/domain/usecases/
```

Expected: ambos sem resultados.

- [ ] **Step 3: Nada de castings**

```bash
grep -n "as keyof\|field: string" src/domain/usecases/*.ts || echo "(limpo)"
```

Expected: sem resultados. É o que a fundação corrigiu e este lote não pode reintroduzir.

- [ ] **Step 4: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 5: Relatório**

Sem commit. Registar quantos consumidores cada conversão obrigou a tocar, que lógica de negócio foi encontrada além da delegação, e o que se aprendeu sobre os que faltam.

---

## Fecho

Onze usecases contra onze services — o ponto de viragem.

Sobram: `driver` e `ride` (os maiores dos que mapeiam um DAO), `wallet`, `withdrawal`, `promotion`, `mission`, `appConfig`, `files`, `auth`, mais os dois que não são usecases de entidade — `audit` com o `withAudit` de 57 consumidores, e `finance` que agrega dois DAOs.
