# Services → UseCases: Lote 6 (o último) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Fechar a camada — converter `finance` e `auth` em usecases, e mudar o `audit` para uma pasta que diga o que ele é.

**Architecture:** O `finance` é um usecase de caso de uso, não de entidade. O `auth` é uma fachada sobre o SDK, e os seus dois métodos síncronos não passam pelo `run()`. O `audit` não é usecase nenhum: é observabilidade com estado de sessão, e muda para `src/observability/`.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

Dezanove usecases contra três services, 185 testes. Este lote arruma os três que sobraram, e nenhum deles é conversão mecânica — foi por isso que ficaram para o fim.

### `finance` — o único que é mesmo conversão

248 linhas com **um só método público**, `getLedger(filters)`, que agrega corridas e carregamentos para montar o extracto. O resto é cálculo privado.

O defeito está nas linhas 9-10: `new FirebaseRideDAO()` e `new FirebaseWalletTopupRequestDAO()`. Instancia DAOs à mão, saltando o factory — a última via de acesso a repositórios que ainda escapa ao `ApiRepository`.

### `auth` — fachada sobre o SDK, com dois métodos que não são assíncronos

Não tem repositório. Embrulha o Firebase Auth: `login`, `logout`, `register`, `resetPassword`, `changePassword`, mais dois que são diferentes:

- `getCurrentUser(): User | null` — **síncrono**, devolve `auth.currentUser`
- `onAuthChanged(callback)` — devolve a **subscrição**, não um valor

O `run()` do `BaseUseCase` é para operações assíncronas que devolvem valor. **Estes dois delegam directos**, pela mesma razão que o `executeListenOnlineDrivers` do `driver` delega: embrulhar uma subscrição perde a função de cancelamento, e embrulhar um getter síncrono transforma-o num `Promise` sem motivo.

### `audit` — não é um usecase, e converter seria um erro

306 linhas com três coisas distintas:

**Estado mutável de sessão** — `private admin`, com `setAdmin()` chamado do `login.tsx:83` e do `PrivateRoute.tsx:51`.

**Recolha de contexto do browser** — sessão, geolocalização, IP, e um `stripSensitiveFields` que limpa dados antes de gravar.

**O `withAudit`**, um decorador que embrulha qualquer operação, regista sucesso ou falha, e volta a lançar o erro.

Convertê-lo daria um "usecase" chamado por todos os outros usecases para se registarem — o que **inverte a camada outra vez**, exactamente o que o lote 5 fechou ao tirar o `new MissionService()` de dentro do `rideUseCase`.

Muda de pasta, não de forma. São **17 ficheiros** a corrigir o caminho do import — os "57 consumidores" que eu andava a citar eram chamadas ao `withAudit`, não imports.

## Global Constraints

- **Os métodos síncronos do `auth` não passam pelo `run()`.**
- **As escritas na API continuam fora do `run()`** — são sete, e nenhuma é tocada por este lote.
- **Não mudar comportamento.** Os 185 testes são a rede.
- **O `finance` passa a obter os repositórios do `ApiRepository`** — nada de `new FirebaseXDAO()`.
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **185**. Emulador na porta **8090**.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## Task 1: `finance`

**Files:**
- Create: `src/domain/usecases/financeUseCase.ts`
- Delete: `src/services/finance.service.ts`
- Modify: os consumidores

- [ ] **Step 1: Ler antes de converter**

```bash
cat src/services/finance.service.ts
grep -rn "financeService\|FinanceService" src/
```

- [ ] **Step 2: Converter**

O `getLedger` passa a `executeGetLedger`, embrulhado no `run()`. Os dois DAOs instanciados à mão passam a `ApiRepository.rides` e `ApiRepository.walletTopupRequests` — confirmar os nomes exactos das entradas no factory.

Os métodos privados de cálculo vêm todos, sem alteração. **Se algum fizer filtragem ou agregação com regras próprias, isso é lógica de negócio e pertence aqui** — não achatar.

- [ ] **Step 3: Repontar, apagar, verificar e commit**

```bash
git rm src/services/finance.service.ts
npx tsc -b && npm run test && npm run build
git commit -m "refactor: financeUseCase substitui finance.service"
```

---

## Task 2: `auth`

**Files:**
- Create: `src/domain/usecases/authUseCase.ts`
- Delete: `src/services/auth.service.ts`
- Modify: `src/viewModels/AuthViewModel.ts`, `src/hooks/useAuthSessionSync.ts` e o respectivo teste

- [ ] **Step 1: Ler os consumidores, não só o service**

```bash
cat src/services/auth.service.ts
cat src/hooks/useAuthSessionSync.ts
grep -rn "authService" src/
```

O `useAuthSessionSync` **tem teste** (`src/hooks/__tests__/useAuthSessionSync.test.ts`). Ele limpa a sessão e a cache do React Query quando o Firebase deixa de reportar utilizador. Esse teste tem de continuar a passar sem ser alterado — se precisar de mudar, algo se partiu.

- [ ] **Step 2: Converter, com a excepção dos dois síncronos**

```ts
  /** Síncrono — não passa pelo `run()`, que devolveria um Promise. */
  executeGetCurrentUser(): User | null {
    return auth.currentUser
  }

  /**
   * Devolve a subscrição. Não passa pelo `run()` — embrulhar perderia a
   * função de cancelamento, e o hook deixaria o listener pendurado.
   */
  executeOnAuthChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
  }
```

Os cinco assíncronos (`login`, `logout`, `register`, `resetPassword`, `changePassword`) passam pelo `run()` normalmente.

**Atenção ao `register`:** ler o que ele faz além de criar a conta — se escrever um documento de admin ou definir um perfil, isso vem junto.

- [ ] **Step 3: Repontar, apagar, verificar e commit**

```bash
git rm src/services/auth.service.ts
npx tsc -b && npm run test && npm run build
git commit -m "refactor: authUseCase substitui auth.service"
```

---

## Task 3: O `audit` muda de pasta

**Files:**
- Move: `src/services/audit.service.ts` → `src/observability/audit.ts`
- Modify: os 17 ficheiros que o importam

- [ ] **Step 1: Confirmar a lista**

```bash
grep -rln "from '@/services/audit.service'" src/
```

Expected: **17** ficheiros.

- [ ] **Step 2: Mover com `git mv`**

```bash
mkdir -p src/observability
git mv src/services/audit.service.ts src/observability/audit.ts
```

Usar `git mv` para o histórico do ficheiro sobreviver — o `git log --follow` deixa de funcionar se for apagar e criar.

- [ ] **Step 3: Explicar no topo do ficheiro porque não é um usecase**

```ts
// Observabilidade, não acesso a dados.
//
// Não é um usecase de propósito: tem estado mutável de sessão (`setAdmin`,
// chamado do login e do PrivateRoute), recolhe contexto do browser, e o
// `withAudit` é um decorador que os próprios usecases chamam para se
// registarem. Convertê-lo poria a camada a depender de si mesma.
```

- [ ] **Step 4: Corrigir os imports**

`'@/services/audit.service'` → `'@/observability/audit'`, nos 17 ficheiros.

- [ ] **Step 5: Verificar e commit**

```bash
npx tsc -b && npm run test && npm run build
git commit -m "refactor: audit muda para observability — nao e acesso a dados"
```

---

## Task 4: Verificação final

**Files:** nenhum a modificar.

- [ ] **Step 1: A camada está fechada**

```bash
ls src/domain/usecases/*UseCase.ts | wc -l
ls src/services/ 2>/dev/null
```

Expected: **21** usecases, e a pasta `src/services/` **vazia ou inexistente**. Se ficou vazia, apagá-la.

- [ ] **Step 2: Ninguém instancia DAOs à mão**

```bash
grep -rn "new Firebase[A-Za-z]*DAO(" src/ | grep -v "modules/Api/factory.ts"
```

Expected: sem resultados. O factory passa a ser a via única.

- [ ] **Step 3: As sete escritas na API continuam fora do `run()`**

```bash
grep -rn "adminMoney\.[a-z]" src/domain/usecases/*.ts
```

Para cada uma, confirmar por leitura que não está dentro de `this.run(`.

- [ ] **Step 4: Os síncronos do `auth` não devolvem Promise**

```bash
grep -n -A3 "executeGetCurrentUser\|executeOnAuthChanged" src/domain/usecases/authUseCase.ts
```

Expected: `return` directo, sem `run()` e sem `async`.

- [ ] **Step 5: Nada aponta ao caminho antigo do audit**

```bash
grep -rn "services/audit" src/ || echo "(limpo)"
```

- [ ] **Step 6: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

O teste do `useAuthSessionSync` tem de passar **sem ter sido alterado**.

- [ ] **Step 7: Relatório**

Sem commit. Registar o que o `register` fazia além de criar a conta, quantos ficheiros cada conversão tocou, e se a pasta `services/` ficou vazia.

---

## Fecho

Vinte e um usecases, zero services, e o `audit` numa pasta que diz o que ele é.

O painel fica alinhado com o documento de arquitectura e com as duas apps RN, que já usavam usecases desde sempre — eram elas que estavam certas e o painel que estava fora do padrão.

O que resta da missão original é o que nunca foi provado: pôr o `BaseFirebaseDAO` a correr numa app React Native, onde o `@react-native-firebase` v23 expõe a mesma API modular do SDK web. São 37 DAOs nas duas apps mais 2 no website, e se a premissa falhar, falha para os quatro repositórios de uma vez.
