# Migrar os DAOs do Painel — Lote 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Migrar os quatro DAOs que só precisam de um método extra — `users`, `driver`, `admins` e `application` — e apagar um método morto que devolveria vazio se alguém o chamasse.

**Architecture:** O `getByEmail` de cada um é `getOneByField('email', …)` disfarçado, e passa a ser uma linha. O `softDelete` fica como método próprio do DAO migrado, acima do que o `BaseFirebaseDAO` oferece.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

Oito de vinte DAOs estão migrados. Os lotes 1 e 2 removeram 1474 linhas, subiram os testes de 86 para 121, e corrigiram três pesquisas que devolviam vazio porque procuravam por um campo inexistente.

Este lote leva quatro DAOs: 935 linhas.

### O que já se sabe destes quatro

**`getByEmail` é `getOneByField('email', email)`.** Verifiquei em `users.dao.ts:161`: faz uma query com `where('email','==',…)`, devolve o primeiro ou `null`. É exactamente o que o método do motor faz. Nos quatro DAOs passa a uma linha que delega.

**`softDelete` não é CRUD e fica.** Em `users.dao.ts:211` marca `status: 'deleted'` e, **se o `firebaseUid` for o do utilizador com sessão iniciada**, apaga a conta no Firebase Auth. No painel quem tem sessão é o admin, portanto esse segundo ramo só dispara se um admin se apagar a si próprio. Parece código vindo das apps móveis, onde o utilizador se elimina a si mesmo.

**Não mudar esse comportamento neste lote.** Portá-lo tal e qual, e registar a observação no relatório. Mudar semântica de eliminação de contas não é trabalho de uma migração estrutural.

**`getAllInBatches` apaga-se.** Em `admins.dao.ts:48`, ordena por **`createdAt`** em camelCase quando o resto do ficheiro — e todo o projecto — usa `created_at`. Numa colecção onde nenhum documento tem `createdAt`, o `orderBy` devolve **vazio**. E não tem um único consumidor em todo o `src/`. É código morto com um bug latente: não vale a pena portá-lo.

### A armadilha das datas herdadas

`Driver` e `Admin` **estendem `UserEntity`** e não declaram nenhum campo de data nos seus próprios ficheiros. Quem escrever o converter a olhar só para `Driver.ts` não converte nada, e as datas herdadas (`created_at`, `updated_at`, definidas em `User.ts`) chegam à aplicação como `Timestamp` do Firestore em vez de `Date`.

Isso não dá erro de compilação e só rebenta em execução. **Ler `User.ts` além do ficheiro da subclasse.**

## Global Constraints

- **Não mudar o comportamento do `softDelete`.** Portar como está.
- **Não mudar IDs existentes.** Prefixos: `us`, `dri`, `adm`, `appl`.
- **Não perder a verificação de tipos do `searchField`** introduzida no lote 2 — os `@ts-expect-error` em `baseFirebaseDao.read.test.ts` são o guarda.
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **121**. Emulador na porta **8090**.
- **Nenhum ViewModel, página ou componente pode ser tocado.** A tradução de assinaturas antigas fica nos `*.service.ts` — precedente dos lotes 1 e 2.
- Sem `sanitize`: o `initializeFirestore` já usa `ignoreUndefinedProperties`.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## Campos de pesquisa

Os quatro procuram por `email`, e nos quatro isso é **legítimo** — ao contrário dos casos corrigidos nos lotes anteriores:

| DAO | Entidade | Tem `email`? |
| --- | --- | --- |
| `users` | `UserEntity` | sim, próprio |
| `driver` | `DriverEntity extends UserEntity` | sim, herdado |
| `admins` | `AdminEntity extends UserEntity` | sim, herdado |
| `application` | `ApplicationEntity` | sim, próprio |

**Uma correcção silenciosa no `admins`:** ele ordena por `created_at` enquanto filtra por intervalo em `email` (`admins.dao.ts:96`), ao contrário dos outros três que ordenam pelo próprio `email`. O `BaseFirebaseDAO` ordena sempre pelo `searchField`, portanto a migração alinha-o com os restantes sem esforço.

---

## Task 1: `application`

**Files:**
- Modify: `src/core/entities/Application.ts` (converter)
- Rewrite: `src/modules/Api/firebase/application.dao.ts` (217 → ~20)
- Create: `src/modules/Api/firebase/__tests__/application.dao.test.ts`

O mais simples: um só extra (`getByEmail`), entidade sem herança, duas datas (`created_at`, `updated_at`).

**Pesquisa:** `email`. **Prefixo:** `appl`.

- [ ] **Step 1: Ler os modelos**

```bash
cat src/modules/Api/firebase/vehicle.dao.ts
sed -n '46,59p' src/core/entities/Vehicle.ts
cat src/modules/Api/firebase/__tests__/rideRate.dao.test.ts
```

- [ ] **Step 2: Converter, DAO e o extra**

O DAO migrado leva o `getByEmail` a delegar:

```ts
  /** Atalho de leitura — o motor já sabe procurar por campo. */
  async getByEmail(email: string): Promise<ApplicationEntity | null> {
    return this.getOneByField('email', email)
  }
```

Confirmar o nome exacto da interface e da chave em `firebaseCollections`.

- [ ] **Step 3: Testes**

Cobrir ida e volta (`create` + `getById`), paginação, pesquisa por `email`, e o `getByEmail` — incluindo o caso em que não existe, que tem de devolver `null` e não lançar.

- [ ] **Step 4: Verificar e commit**

```bash
npx tsc -b && npm run test
git add src/core/entities/Application.ts src/modules/Api/firebase/application.dao.ts src/modules/Api/firebase/__tests__/application.dao.test.ts
git commit -m "refactor: application.dao usa o BaseFirebaseDAO"
```

---

## Task 2: `users`

**Files:**
- Modify: `src/core/entities/User.ts`
- Rewrite: `src/modules/Api/firebase/users.dao.ts` (221 → ~30)
- Create: `src/modules/Api/firebase/__tests__/users.dao.test.ts`

Dois extras: `getByEmail` e `softDelete`. **Pesquisa:** `email`. **Prefixo:** `us`.

- [ ] **Step 1: Converter, DAO e os dois extras**

O `softDelete` porta-se como está (`users.dao.ts:211-220`), incluindo o ramo que apaga a conta Auth. Manter a assinatura `(id: string, firebaseUid?: string)` — o `users.service.ts:105` e o ViewModel dependem dela.

Pode usar o `update` do motor para a marcação de estado, mas o efeito tem de ser o mesmo: `status: 'deleted'` e `updated_at`.

- [ ] **Step 2: Testes**

Além dos habituais, um teste do `softDelete` que confirma que o documento **continua a existir** com `status: 'deleted'` — é o que distingue soft de hard delete.

Não testar o ramo do Firebase Auth: exige sessão iniciada e sai do âmbito do emulador de Firestore. Registar no relatório que ficou por cobrir.

- [ ] **Step 3: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: users.dao usa o BaseFirebaseDAO"
```

---

## Task 3: `driver`

**Files:**
- Modify: `src/core/entities/Driver.ts`
- Rewrite: `src/modules/Api/firebase/driver.dao.ts` (252 → ~30)
- Create: `src/modules/Api/firebase/__tests__/driver.dao.test.ts`

Mesmos dois extras do `users`. **Pesquisa:** `email` (herdado). **Prefixo:** `dri`.

**A armadilha desta task:** `DriverEntity extends UserEntity` e **não declara nenhuma data própria**. As datas a converter — `created_at` e `updated_at` — estão em `User.ts`. Ler os dois ficheiros.

- [ ] **Step 1: Confirmar os campos herdados antes de escrever o converter**

```bash
grep -nE "_at\b" src/core/entities/User.ts src/core/entities/Driver.ts
```

- [ ] **Step 2: Converter, DAO, extras e testes**, como na Task 2.

- [ ] **Step 3: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: driver.dao usa o BaseFirebaseDAO"
```

---

## Task 4: `admins` — e o método morto

**Files:**
- Modify: `src/core/entities/Admin.ts`
- Rewrite: `src/modules/Api/firebase/admins.dao.ts` (245 → ~20)
- Create: `src/modules/Api/firebase/__tests__/admins.dao.test.ts`

**Pesquisa:** `email` (herdado, mesma armadilha do `driver`). **Prefixo:** `adm`.

- [ ] **Step 1: Confirmar que o `getAllInBatches` continua sem consumidores**

```bash
grep -rn "getAllInBatches" src/ | grep -v "admins.dao.ts"
```

Expected: **sem resultados**. Se aparecer algum, **parar e reportar** — o método teria de ser portado e o seu bug corrigido, em vez de apagado.

- [ ] **Step 2: Apagar o `getAllInBatches`**

Remover o método e, se a interface `IAdminRepository` o declarar, remover de lá também.

Ordena por `createdAt` numa colecção cujos documentos usam `created_at` — devolveria vazio. Não tem consumidores. Portá-lo seria mover um bug de sítio.

- [ ] **Step 3: Converter, DAO, `getByEmail` e testes.**

- [ ] **Step 4: Verificar e commit**

```bash
npx tsc -b && npm run test
git add src/core/entities/Admin.ts src/modules/Api/firebase/admins.dao.ts src/core/interfaces/IAdminRepository.ts src/modules/Api/firebase/__tests__/admins.dao.test.ts
git commit -m "refactor: admins.dao usa o BaseFirebaseDAO; apagar getAllInBatches morto"
```

---

## Task 5: Verificação do lote

**Files:** nenhum a modificar.

- [ ] **Step 1: Quantos migrados**

```bash
grep -l "extends BaseFirebaseDAO" src/modules/Api/firebase/*.dao.ts | wc -l
```

Expected: **12** de 20.

- [ ] **Step 2: Linhas**

```bash
wc -l src/modules/Api/firebase/{users,driver,admins,application}.dao.ts
```

Expected: ~100 no total, contra 935 antes.

- [ ] **Step 3: As datas herdadas foram convertidas**

```bash
grep -n "toDate" src/core/entities/Driver.ts src/core/entities/Admin.ts
```

Expected: **ambos convertem `created_at` e `updated_at`**, apesar de os declararem em `User.ts`. Se algum converter não os menciona, a armadilha das datas herdadas não foi evitada.

- [ ] **Step 4: A protecção de tipos continua viva**

```bash
npx tsc -b
```

Se algum `@ts-expect-error` do lote 2 for acusado como inútil, a protecção perdeu-se.

- [ ] **Step 5: Camadas, sanitize e método morto**

```bash
grep -rn "from '@/modules/Api'" src/viewModels/ src/pages/ src/components/
grep -l "sanitize" src/modules/Api/firebase/{users,driver,admins,application}.dao.ts
grep -rn "getAllInBatches" src/
```

Expected: os três sem resultados.

- [ ] **Step 6: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 7: Relatório**

Sem commit. Registar linhas antes e depois, datas por converter (com nota explícita sobre as herdadas), o que ficou por testar no `softDelete`, e qualquer divergência encontrada.

---

## Fecho

Doze dos vinte migrados, e um método morto com bug latente removido em vez de portado.

Sobram oito: `mission` (que gere duas colecções e é meio DAO de progresso), `wallet` (só-leitura desde o trabalho de dinheiro), `auditLog` (o caso *append-only* do documento), `withdrawal`, `promotion`, `appConfig`, `file` (que é Storage e provavelmente não pertence a este padrão), e o `auth.dao.ts` vazio, para apagar.
