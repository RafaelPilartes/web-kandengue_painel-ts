# Migrar os DAOs do Painel — Lote 5 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Migrar `withdrawal` e `mission` — os dois últimos que cabem no motor — e marcar explicitamente os que ficam de fora e porquê.

**Architecture:** O `withdrawal` é só-leitura sobre `withdrawal_requests`, com um acesso secundário a `referral_earnings`. O `mission` parte-se em dois DAOs, um por colecção.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

Catorze de dezanove DAOs migrados, 2494 linhas removidas, 164 testes. Os lotes anteriores esgotaram o CRUD e introduziram as variantes imutável e só-leitura.

Restavam cinco. **Três não pertencem a este padrão**, e a análise mostrou porquê:

| DAO | Porque fica de fora |
| --- | --- |
| `file` | Importa de `firebase/storage`, não `firestore`. É upload e download de binários — não há colecção, documento nem converter |
| `appConfig` | Lê um documento único conhecido (`doc(db, root, REFERRAL_SETTINGS_DOC)`), não uma colecção. Paginação, pesquisa e IDs gerados não se aplicam |
| `promotion` | Usa **subcolecções** (`counters` para shards, `allowed_users`), capacidade que o motor não tem. Fica para um lote próprio, depois de se decidir se o motor a ganha |

Este lote leva os outros dois: 350 linhas.

### O `withdrawal` é outro caso só-leitura

O `IWithdrawalRepository` declara `getAll`, `getById`, `countByStatus` e `getEarningsByIds` — nenhuma escrita. As escritas foram para a API durante a migração das operações de dinheiro, tal como aconteceu com o `wallet`.

Usa **duas** colecções: `withdrawal_requests` como principal, e `referral_earnings` para resolver os ganhos ligados a um saque no ecrã de detalhe.

### O `mission` são dois DAOs disfarçados de um

Gere `missions` **e** `missionProgress`. Os três métodos de progresso (`getProgress`, `updateProgress`, `getAllProgressByDriver`) não têm nada que ver com a colecção principal — são um DAO inteiro escondido dentro de outro.

Partir em dois é o que torna ambos migráveis.

**O `updateProgress` faz *upsert* com ID composto** — `{driver_id}_{mission_id}` (`mission.dao.ts:143`). É a mesma convenção que a API usa no `MissionProgressRepository`, portanto está certa e mantém-se. Mas não é o `create` do motor, que gera IDs com prefixo: fica como método extra.

## Global Constraints

- **O `withdrawal` migrado não pode expor `create`, `update` ou `delete`.** Mesma razão do `wallet`: essas operações vivem na API. Usar `ReadOnlyDAO`.
- **Não mudar a convenção do ID composto** do progresso de missões — a API depende dela.
- **Não perder a protecção de tipos do `searchField`** (lote 2) nem reabrir portas fechadas (lote 4).
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **164**. Emulador na porta **8090**.
- **Nenhum ViewModel, página ou componente pode ser tocado.**
- Sem `sanitize`: o `initializeFirestore` já usa `ignoreUndefinedProperties`.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## Task 1: `withdrawal`

**Files:**
- Modify: `src/core/entities/Promotion.ts` (converters — as entidades vivem lá)
- Rewrite: `src/modules/Api/firebase/withdrawal.dao.ts` (132 → ~35)
- Create: `src/modules/Api/firebase/__tests__/withdrawal.dao.test.ts`

**Estende `ReadOnlyDAO<WithdrawalRequestEntity>`** sobre `firebaseCollections.withdrawalRequests.root`.

**Datas:** as entidades `WithdrawalRequestEntity` e `ReferralEarningEntity` estão em `src/core/entities/Promotion.ts`, que declara `created_at`, `expires_at`, `paid_at`, `requested_at`, `reviewed_at`, `updated_at`. **Ler o ficheiro e ver quais pertencem a cada entidade** — não converter às cegas os seis em ambas.

**Campo de pesquisa:** ler o DAO actual. Se ele não fizer prefix-search, **não declarar `searchField`**.

- [ ] **Step 1: Ver o que existe**

```bash
cat src/modules/Api/firebase/withdrawal.dao.ts
grep -n "class WithdrawalRequestEntity\|class ReferralEarningEntity" -A25 src/core/entities/Promotion.ts
cat src/core/interfaces/IWithdrawalRepository.ts
```

- [ ] **Step 2: Os dois extras**

`countByStatus(status)` — o motor tem `count(filters)`. Delegar:

```ts
  async countByStatus(status: WithdrawalStatus): Promise<number> {
    return this.count({ status } as Partial<WithdrawalRequestEntity>)
  }
```

`getEarningsByIds(ids)` — lê a **outra** colecção (`referral_earnings`). Não é do motor; fica como método próprio, com a query escrita à mão. Manter o comportamento actual, incluindo o que faz com uma lista vazia.

**Atenção:** o Firestore limita o operador `in` a 30 valores por query. Ler o DAO actual e ver se ele já divide em lotes. Se dividir, **manter**; se não dividir, **não acrescentar** essa correcção aqui — registar no relatório como achado.

- [ ] **Step 3: Testes**

Além do habitual: provar que `create`, `update` e `delete` lançam `AppError('failed-precondition')` e que **nada foi escrito** — ler a colecção de volta, como o lote 4 fez para o `wallet`.

E um teste do `getEarningsByIds` com dois IDs, que prova que resolve da segunda colecção.

- [ ] **Step 4: Verificar e commit**

```bash
npx tsc -b && npm run test
git add src/core/entities/Promotion.ts src/modules/Api/firebase/withdrawal.dao.ts src/modules/Api/firebase/__tests__/withdrawal.dao.test.ts
git commit -m "refactor: withdrawal.dao usa o ReadOnlyDAO"
```

---

## Task 2: `mission` — partir em dois

**Files:**
- Modify: `src/core/entities/Mission.ts` e `src/core/entities/MissionProgress.ts` (converters)
- Rewrite: `src/modules/Api/firebase/mission.dao.ts` (218 → ~18)
- Create: `src/modules/Api/firebase/missionProgress.dao.ts` (~40)
- Create: `src/core/interfaces/IMissionProgressRepository.ts`
- Create: `src/modules/Api/firebase/__tests__/mission.dao.test.ts`
- Create: `src/modules/Api/firebase/__tests__/missionProgress.dao.test.ts`

- [ ] **Step 1: `mission.dao.ts` — a parte fácil**

Estende `BaseFirebaseDAO<MissionEntity>` sobre `firebaseCollections.missions.root`. Prefixo `miss`. Datas: `created_at`, `updated_at`.

Campo de pesquisa: ler o DAO actual e decidir; se não houver campo de texto útil, não declarar.

- [ ] **Step 2: `missionProgress.dao.ts` — a parte com forma própria**

Estende `BaseFirebaseDAO<MissionProgressEntity>` sobre `firebaseCollections.missionProgress.root`.

**As datas desta entidade não seguem a convenção:** são `completed_at` e **`last_updated`** — a segunda não termina em `_at`. Um converter escrito por hábito perde-a, e o `Timestamp` chega à aplicação sem nada falhar até à execução. Confirmar no ficheiro.

Os três extras, portados do DAO actual (`:114-170`):

```ts
  /** ID composto por convenção — a API usa a mesma em MissionProgressRepository. */
  private compositeId(driverId: string, missionId: string): string {
    return `${driverId}_${missionId}`
  }

  async getProgress(driverId: string, missionId: string) { … }
  async updateProgress(progress: MissionProgressEntity) { … }
  async getAllProgressByDriver(driverId: string) { … }
```

O `updateProgress` faz *upsert* com esse ID. **Não substituir pelo `create` do motor**, que geraria um ID com prefixo e partiria a convenção que a API espera.

**Apagar o `console.log('snapshot =>', snapshot)`** que está em `mission.dao.ts:160`. É depuração esquecida em código de produção.

- [ ] **Step 3: Ligar os consumidores**

O `mission.service.ts` chama os três métodos de progresso no DAO antigo. Passa a chamá-los no DAO novo. **A tradução fica no service** — nenhum ViewModel muda.

Registar o novo DAO no `ApiRepository` (`src/modules/Api/factory.ts`), seguindo o padrão dos outros.

- [ ] **Step 4: Testes**

Para o progresso, o teste que importa: **`updateProgress` duas vezes com o mesmo par driver/missão tem de actualizar o mesmo documento**, não criar dois. É a garantia que o ID composto existe para dar.

- [ ] **Step 5: Verificar e commit**

```bash
npx tsc -b && npm run test
git add src/core/entities/Mission.ts src/core/entities/MissionProgress.ts src/modules/Api/firebase/mission.dao.ts src/modules/Api/firebase/missionProgress.dao.ts src/core/interfaces/IMissionProgressRepository.ts src/modules/Api/factory.ts src/services/mission.service.ts src/modules/Api/firebase/__tests__/
git commit -m "refactor: mission.dao parte-se em mission e missionProgress"
```

---

## Task 3: Marcar os que ficam de fora

**Files:**
- Modify: `src/modules/Api/firebase/file.dao.ts` (comentário)
- Modify: `src/modules/Api/firebase/appConfig.dao.ts` (comentário)

Sem estes comentários, alguém que veja "17 de 19 migrados" vai assumir que faltam dois e tentar terminá-los.

- [ ] **Step 1: `file.dao.ts`**

No topo, acima dos imports:

```ts
// Não usa o BaseFirebaseDAO de propósito: isto é Cloud Storage, não
// Firestore. Não há colecção, documento nem converter — só upload,
// download e remoção de binários. O motor não se aplica.
```

- [ ] **Step 2: `appConfig.dao.ts`**

```ts
// Não usa o BaseFirebaseDAO de propósito: lê e escreve um documento único
// e conhecido, não uma colecção. Paginação, pesquisa por prefixo e IDs
// gerados — tudo o que o motor traz — não se aplicam aqui.
```

- [ ] **Step 3: Commit**

```bash
npx tsc -b
git add src/modules/Api/firebase/file.dao.ts src/modules/Api/firebase/appConfig.dao.ts
git commit -m "docs: explicar porque file e appConfig nao usam o motor"
```

---

## Task 4: Verificação do lote

**Files:** nenhum a modificar.

- [ ] **Step 1: Quantos migrados**

```bash
grep -lE "extends (BaseFirebaseDAO|AppendOnlyDAO|ReadOnlyDAO)" src/modules/Api/firebase/*.dao.ts | wc -l
ls src/modules/Api/firebase/*.dao.ts | wc -l
```

Expected: **17** migrados de **20** ficheiros (o `missionProgress.dao.ts` é novo). Os três não migrados são `file`, `appConfig` e `promotion`.

- [ ] **Step 2: As portas continuam fechadas**

```bash
grep -nE "create|update|delete" src/core/interfaces/IWithdrawalRepository.ts src/core/interfaces/IWalletRepository.ts
```

Expected: só comentários a explicar a ausência.

- [ ] **Step 3: O ID composto sobreviveu**

```bash
grep -n "_\${" src/modules/Api/firebase/missionProgress.dao.ts
```

Expected: a construção `${driverId}_${missionId}`. A API depende dela.

- [ ] **Step 4: A depuração desapareceu**

```bash
grep -rn "console.log" src/modules/Api/firebase/*.dao.ts || echo "(limpo)"
```

- [ ] **Step 5: Camadas, sanitize, tipos**

```bash
grep -rn "from '@/modules/Api'" src/viewModels/ src/pages/ src/components/
grep -l "sanitize" src/modules/Api/firebase/{withdrawal,mission,missionProgress}.dao.ts
npx tsc -b
```

Expected: os dois greps sem resultados; `tsc` limpo.

- [ ] **Step 6: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 7: Relatório**

Sem commit. Registar linhas antes e depois, datas por converter (com nota sobre o `last_updated`, que não segue a convenção), o que se descobriu sobre o limite do `in` no `getEarningsByIds`, e o campo de pesquisa escolhido em cada um.

---

## Fecho

Dezassete DAOs sobre o motor, dois deliberadamente fora com o porquê escrito no código, e um — o `promotion` — à espera de uma decisão de arquitectura sobre subcolecções.

O painel fica migrado. O passo seguinte da missão original é o que nunca foi provado: pôr o `BaseFirebaseDAO` a correr numa app React Native, onde o `@react-native-firebase` v23 expõe a mesma API modular do SDK web — a premissa em que o documento assenta e que ninguém testou.
