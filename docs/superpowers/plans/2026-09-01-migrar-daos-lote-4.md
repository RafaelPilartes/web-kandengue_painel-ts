# Migrar os DAOs do Painel — Lote 4 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Introduzir as duas variantes do motor que faltam — imutável e só-leitura — e migrar `auditLog` e `wallet` sobre elas. Apagar o `auth.dao.ts` vazio.

**Architecture:** `AppendOnlyDAO` recusa `update` e `delete`; `ReadOnlyDAO` estende-o e recusa também `create`. As duas falham com `AppError`, como o resto do motor.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

Doze de vinte DAOs migrados, 2245 linhas removidas, 149 testes. Os lotes anteriores esgotaram tudo o que era CRUD.

Este lote é diferente: **nenhum dos dois DAOs é CRUD**, e por isso obriga a construir as variantes que o documento de arquitectura descreve mas que nunca foram implementadas.

### Porque o `wallet` não pode simplesmente estender o motor

O `IWalletRepository` declara apenas leituras, e tem este comentário — escrito durante a migração das operações de dinheiro:

```ts
// Sem `create`, `update` nem `delete`: essas operações vivem na API, em
// transacções auditadas. Ver `IAdminMoneyRepository`.
```

Se o `FirebaseWalletDAO` estender o `BaseFirebaseDAO` tal como está, herda `create`, `update` e `delete` **públicos** — reabrindo exactamente as portas que fechámos. A migração desfaria, sem ninguém reparar, o trabalho que impediu o painel de escrever saldos.

Daí o `ReadOnlyDAO`.

### O `auditLog` é o caso *append-only* do documento

Um registo de auditoria que se pode editar ou apagar não é auditoria. As Security Rules hão-de bloquear isso ao nível do servidor na Fase 4; o `AppendOnlyDAO` falha mais cedo e com mensagem útil.

### Duas divergências face ao documento, deliberadas

**O documento lança `Error`; o motor usa `AppError`.** O excerto da secção 4.10 do `clean-architecture-mvvm.md` é anterior à convenção de erros ter assentado no código. As variantes novas usam `AppError`, como o `BaseFirebaseDAO` faz em `:121`, `:159` e `:254`.

**O `AuditLogInterface` não vive em `core/entities`.** Está em `src/interfaces/IAuditLog.ts` e é uma interface simples, não uma classe. Não existe `core/entities/AuditLog.ts` nem `IAuditLogRepository.ts`. Criar uma classe-entidade só para alojar um converter seria cerimónia sem ganho — o converter fica junto do tipo, em `IAuditLog.ts`. Registar a decisão no relatório.

## Global Constraints

- **O `wallet` migrado não pode expor `create`, `update` ou `delete`.** É o ponto desta task; a verificação final testa-o.
- **Não mudar IDs existentes.** Prefixos: `log` para auditoria; o `wallet` não cria nada.
- **Não perder a protecção de tipos do `searchField`** do lote 2 — os `@ts-expect-error` em `baseFirebaseDao.read.test.ts` são o guarda.
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **149**. Emulador na porta **8090**.
- **Nenhum ViewModel, página ou componente pode ser tocado.**
- Sem `sanitize`: o `initializeFirestore` já usa `ignoreUndefinedProperties`.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## Task 1: As duas variantes do motor

**Files:**
- Create: `src/modules/Api/firebase/AppendOnlyDAO.ts`
- Create: `src/modules/Api/firebase/ReadOnlyDAO.ts`
- Create: `src/modules/Api/firebase/__tests__/daoVariants.test.ts`

**Interfaces:**
- Produces: `AppendOnlyDAO<T>` e `ReadOnlyDAO<T>`, ambos abstractos. As Tasks 2 e 3 consomem-nos.

- [ ] **Step 1: Ver como o motor lança erros**

```bash
grep -n "AppError" src/modules/Api/firebase/BaseFirebaseDAO.ts
sed -n '1,30p' src/domain/errors/AppError.ts
```

Confirmar os códigos disponíveis antes de escolher um. `failed-precondition` é o que o motor usa para "esta operação não se aplica aqui" — ver o caso do `searchField` ausente.

- [ ] **Step 2: `AppendOnlyDAO`**

```ts
import { AppError } from '@/domain/errors/AppError'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

/**
 * Colecções imutáveis: escreve-se uma vez e nunca mais se toca.
 * Um registo de auditoria que se pode editar não é auditoria.
 *
 * As Security Rules hão-de bloquear isto no servidor; aqui falha mais cedo
 * e com uma mensagem que diz porquê.
 */
export abstract class AppendOnlyDAO<
  T extends { id: string }
> extends BaseFirebaseDAO<T> {
  override async update(): Promise<T> {
    throw new AppError(
      'failed-precondition',
      `[${this.path}] é imutável — não se pode alterar um registo já escrito.`
    )
  }

  override async delete(): Promise<void> {
    throw new AppError(
      'failed-precondition',
      `[${this.path}] é append-only — não se pode apagar um registo.`
    )
  }
}
```

Confirmar as assinaturas exactas de `update` e `delete` no `BaseFirebaseDAO` antes de as sobrepor — o TypeScript recusa um override incompatível, e é isso que garante que não se enganam.

- [ ] **Step 3: `ReadOnlyDAO`**

Estende o anterior e acrescenta a recusa de `create`. Só-leitura é *append-only* menos a escrita:

```ts
export abstract class ReadOnlyDAO<
  T extends { id: string }
> extends AppendOnlyDAO<T> {
  override async create(): Promise<T> {
    throw new AppError(
      'failed-precondition',
      `[${this.path}] é só-leitura neste cliente — a escrita vive na API.`
    )
  }
}
```

- [ ] **Step 4: Testes das variantes**

Criar duas classes de teste minúsculas sobre uma colecção descartável e provar:

- `AppendOnlyDAO`: `create` **funciona**; `update` e `delete` lançam
- `ReadOnlyDAO`: os três lançam
- que o erro é `AppError` com código `failed-precondition`, não um `Error` qualquer
- e — o que interessa mesmo — que **nada foi escrito** quando a chamada é recusada: ler a colecção a seguir e confirmar que está como estava

Este último ponto é o que distingue um teste real de um que só verifica a mensagem.

- [ ] **Step 5: Verificar e commit**

```bash
npx tsc -b && npm run test
git add src/modules/Api/firebase/AppendOnlyDAO.ts src/modules/Api/firebase/ReadOnlyDAO.ts src/modules/Api/firebase/__tests__/daoVariants.test.ts
git commit -m "feat: variantes append-only e so-leitura do BaseFirebaseDAO"
```

---

## Task 2: `auditLog`

**Files:**
- Modify: `src/interfaces/IAuditLog.ts` (acrescentar converter)
- Rewrite: `src/modules/Api/firebase/auditLog.dao.ts` (134 → ~20)
- Create: `src/core/interfaces/IAuditLogRepository.ts`
- Create: `src/modules/Api/firebase/__tests__/auditLog.dao.test.ts`

**Métodos actuais:** `create` e `getAll`. **Prefixo:** `log`. **Data:** só `created_at`.

**Campo de pesquisa:** ler o DAO actual e decidir. Se ele não fizer prefix-search, **não declarar `searchField`** — o motor lança erro claro se alguém pesquisar, que é melhor do que devolver vazio. Registar a escolha no relatório.

- [ ] **Step 1: Ver o que existe**

```bash
cat src/modules/Api/firebase/auditLog.dao.ts
sed -n '30,75p' src/interfaces/IAuditLog.ts
cat src/services/audit.service.ts
```

Nota: o `audit.service.ts:13` instancia `new FirebaseAuditLogDAO()` directamente, em vez de vir do `ApiRepository`. Não corrigir isso aqui — registar no relatório.

- [ ] **Step 2: Converter, interface de repositório e DAO**

O converter fica em `IAuditLog.ts`, junto do tipo. Converter `created_at` por `toDate`.

Criar `IAuditLogRepository` a estender `IBaseRepository<AuditLogInterface>`, como as outras interfaces migradas.

O DAO estende **`AppendOnlyDAO`**.

- [ ] **Step 3: Testes**

Além do habitual: **provar que `update` e `delete` lançam**, e que o registo continua intacto depois.

- [ ] **Step 4: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: auditLog.dao usa o AppendOnlyDAO"
```

---

## Task 3: `wallet`

**Files:**
- Modify: `src/core/entities/Wallet.ts` (converter)
- Rewrite: `src/modules/Api/firebase/wallet.dao.ts` (152 → ~18)
- Create: `src/modules/Api/firebase/__tests__/wallet.dao.test.ts`

**Métodos actuais:** só leituras. **Datas:** `created_at`, `updated_at`.

**Campo de pesquisa:** o DAO actual procura por quê? Ler antes de decidir. Se for um campo que a entidade não tem — como aconteceu três vezes nos lotes 1 e 2 — **não declarar `searchField`** e registar.

**O DAO estende `ReadOnlyDAO`.** É o ponto central desta task.

- [ ] **Step 1: Converter e DAO**

O `IWalletRepository` fica como está: já declara só leituras, e é essa a intenção. Se estendê-lo a `IBaseRepository` fizer reaparecer os métodos de escrita no tipo, **não o estender** — a interface actual é deliberada.

- [ ] **Step 2: O teste que justifica esta task**

Provar que `create`, `update` e `delete` no `walletRepository` lançam `AppError`, e que a carteira semeada continua com o mesmo saldo depois de cada tentativa.

É o teste que impede uma migração futura de reabrir a porta que o trabalho de dinheiro fechou.

- [ ] **Step 3: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: wallet.dao usa o ReadOnlyDAO"
```

---

## Task 4: Apagar o `auth.dao.ts`

**Files:**
- Delete: `src/modules/Api/firebase/auth.dao.ts`

Tem **0 bytes** e nenhuma referência em todo o `src/`.

- [ ] **Step 1: Reconfirmar**

```bash
wc -c src/modules/Api/firebase/auth.dao.ts
grep -rn "auth.dao\|AuthDAO" src/ | grep -v "firebase/auth.dao.ts"
```

Expected: 0 bytes, sem referências. Se aparecer alguma, **parar e reportar**.

- [ ] **Step 2: Apagar e commit**

```bash
git rm src/modules/Api/firebase/auth.dao.ts
npx tsc -b && npm run test
git commit -m "chore: apagar auth.dao.ts vazio e sem referencias"
```

---

## Task 5: Verificação do lote

**Files:** nenhum a modificar.

- [ ] **Step 1: Quantos migrados**

```bash
grep -lE "extends (BaseFirebaseDAO|AppendOnlyDAO|ReadOnlyDAO)" src/modules/Api/firebase/*.dao.ts | wc -l
```

Expected: **14** de 19 (o `auth.dao.ts` deixou de existir).

- [ ] **Step 2: A porta do `wallet` continua fechada**

```bash
grep -n "create\|update\|delete" src/core/interfaces/IWalletRepository.ts
```

Expected: só o comentário que explica a ausência. Se algum método reapareceu na interface, a migração desfez o trabalho de dinheiro.

- [ ] **Step 3: Linhas**

```bash
wc -l src/modules/Api/firebase/{auditLog,wallet}.dao.ts
```

Expected: ~38 no total, contra 286 antes.

- [ ] **Step 4: Camadas, sanitize, protecção de tipos**

```bash
grep -rn "from '@/modules/Api'" src/viewModels/ src/pages/ src/components/
grep -l "sanitize" src/modules/Api/firebase/{auditLog,wallet}.dao.ts
npx tsc -b
```

Expected: os dois greps sem resultados; o `tsc` limpo, sem acusar `@ts-expect-error` inútil.

- [ ] **Step 5: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 6: Relatório**

Sem commit. Registar: linhas antes e depois, campo de pesquisa escolhido (ou a ausência dele) e porquê, onde ficou o converter do auditLog e porquê, e o facto de o `audit.service.ts` instanciar o DAO directamente.

---

## Fecho

Catorze dos dezanove DAOs migrados, e as duas variantes do motor que o documento descrevia passam a existir e a estar testadas.

Sobram cinco, todos com forma própria: `mission` (duas colecções), `withdrawal`, `promotion`, `appConfig` (documento único, não colecção) e `file` (que é Storage, não Firestore, e provavelmente não pertence a este padrão de todo).
