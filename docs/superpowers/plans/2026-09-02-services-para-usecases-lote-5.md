# Services → UseCases: Lote 5 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Converter `appConfig`, `files`, `promotion` e `mission` — e fechar a última dependência de um usecase num service.

**Architecture:** Os três primeiros são mecânicos. O `mission` é o maior do painel: toca cinco repositórios, tem uma escrita na API, e é aquele de que o `rideUseCase` depende hoje através de um `new MissionService()`.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

Quinze usecases contra sete services, 185 testes. A última cópia do `offsetToCursor` está isolada no `audit`.

Este lote leva quatro: `appConfig` (32 linhas), `files` (72), `promotion` (96) e `mission` (223).

### A dependência a fechar

`rideUseCase.ts:10` faz `const missionService = new MissionService()`, e usa-o no efeito secundário do `executeUpdate`. É a única inconsistência de camadas que resta — um usecase a depender de um service.

**Converter o `mission` fecha-a.** Depois disso, o `rideUseCase` passa a depender do `missionUseCase`, e a camada fica homogénea.

### A regra do lote 4 aplica-se ao `mission`

O `payMissionProgress` (`mission.service.ts:212`) chama `adminMoneyRepository.payMissionBonus` e delega **sem `try/catch`**. É a mesma família das cinco escritas do lote anterior.

O `run()` do `BaseUseCase` chama o `toAppError`, que **substitui a mensagem** por uma genérica e guarda a original só no `cause`. Como a UI mostra `error.message`, um erro da API viraria *"Ocorreu um erro inesperado."*

**O `payMissionProgress` fica fora do `run()`.** As leituras do Firestore passam, como sempre.

### Três DAOs deste lote não estão no motor, e isso não é problema

`appConfig` (documento único), `files` (Cloud Storage) e `promotion` (subcolecções) ficaram deliberadamente fora da migração dos DAOs, com o porquê escrito no código. **Estão no factory à mesma**, portanto os usecases obtêm-nos como qualquer outro.

Converter o service não muda o DAO. O usecase embrulha o que existe.

## Global Constraints

- **O `payMissionProgress` não passa pelo `run()`.** As leituras passam.
- **Não mudar comportamento.** Os 185 testes são a rede.
- **Nada de `field: string` nem `as keyof`** — usar `FieldPath<T>`.
- **Os repositórios vêm do `ApiRepository`**, incluindo os três não migrados.
- **Não tocar no `audit.service.ts` nem no `withAudit`.**
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **185**. Emulador na porta **8090**.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## Task 1: `appConfig` e `files`

**Files:**
- Create: `src/domain/usecases/appConfigUseCase.ts`, `src/domain/usecases/fileUseCase.ts`
- Delete: os dois services
- Modify: os consumidores

Os dois mais pequenos, sem nada de especial. Servem para arrancar o lote.

**`appConfig`:** `getReferralSettings`, `updateReferralSettings`. Lê e escreve um documento único.

**`files`:** `uploadFile`, `uploadBlob`, `deleteFile`, `getDownloadUrl`. É Cloud Storage, não Firestore.

- [ ] **Step 1: Ler antes de converter**

```bash
cat src/services/appConfig.service.ts src/services/files.service.ts
grep -rn "appConfigService\|filesService\|FilesService\|AppConfigService" src/
```

- [ ] **Step 2: Converter**

Modelo: `src/domain/usecases/rideRateUseCase.ts`, o mais simples dos já feitos.

Os métodos do `files` devolvem URLs e recebem ficheiros — **manter as assinaturas exactas**, porque os componentes de upload dependem delas.

- [ ] **Step 3: Repontar, apagar, verificar e commit**

```bash
git rm src/services/appConfig.service.ts src/services/files.service.ts
npx tsc -b && npm run test && npm run build
git commit -m "refactor: appConfigUseCase e fileUseCase substituem os services"
```

---

## Task 2: `promotion`

**Files:**
- Create: `src/domain/usecases/promotionUseCase.ts`
- Delete: `src/services/promotion.service.ts`
- Modify: os consumidores

Dez métodos, um só repositório. O DAO não está no motor porque usa subcolecções — `counters` para os shards e `allowed_users` — mas isso é problema do DAO, não do usecase.

**Métodos:** `getAll`, `getByCode`, `create`, `update`, `setActive`, `addAllowedUser`, `addAllowedUsersBulk`, `removeAllowedUser`, `listAllowedUsers`, `listUsages`.

- [ ] **Step 1: Ler o service com atenção**

```bash
cat src/services/promotion.service.ts
```

Procurar normalização — o DAO tem um `normalizeCode` que põe os códigos em maiúsculas. Se o service também normalizar, decidir onde fica: **regra de negócio pertence ao usecase**, como a matrícula no `vehicleUseCase`. Se a normalização já vive no DAO, não a duplicar.

- [ ] **Step 2: Converter, repontar, apagar**

- [ ] **Step 3: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: promotionUseCase substitui promotion.service"
```

---

## Task 3: `mission` — e fechar a dependência do `ride`

**Files:**
- Create: `src/domain/usecases/missionUseCase.ts`
- Delete: `src/services/mission.service.ts`
- Modify: `src/domain/usecases/rideUseCase.ts` e os consumidores

O maior do painel. Toca `missionRepository`, `missionProgressRepository`, `rideRepository`, `adminMoney` — e o `ApiRepository` directamente.

**Métodos:** `getAllMissions`, `getActiveMissions`, `getById`, `createMission`, `updateMission`, `deleteMission`, `getDriverProgress`, `updateDriverProgress`, `payMissionProgress`.

- [ ] **Step 1: Ler o service inteiro antes de tocar em nada**

```bash
cat src/services/mission.service.ts
```

O `processMissionProgress` recalcula do zero — consulta as corridas concluídas do motorista e deriva a contagem, em vez de incrementar. É o que torna a duplicação com o trigger do servidor inofensiva. **Não mudar isso.**

- [ ] **Step 2: Converter, com a excepção do `payMissionProgress`**

```ts
  /**
   * Paga o bónus no servidor, numa transacção idempotente.
   * `paid: false` significa que a missão já estava paga — não é erro.
   *
   * NÃO passa pelo `run()`: o `toAppError` substituiria a mensagem da API
   * por uma genérica, e o admin deixaria de saber o que falhou.
   */
  executePayMissionProgress(
    driverId: string,
    missionId: string,
    typePaid: 'cash' | 'wallet'
  ): Promise<{ paid: boolean; balance: number | null }> {
    return ApiRepository.adminMoney.payMissionBonus({
      driver_id: driverId,
      mission_id: missionId,
      type_paid: typePaid
    })
  }
```

Confirmar os nomes dos campos no service — a API usa snake_case no corpo.

- [ ] **Step 3: Fechar a dependência do `rideUseCase`**

Em `src/domain/usecases/rideUseCase.ts`, remover o `new MissionService()` da linha 10 e passar a usar o `missionUseCase`.

O efeito secundário do `executeUpdate` mantém-se exactamente como está — a condição `status === 'completed'`, a chamada, e o erro engolido de propósito.

- [ ] **Step 4: Repontar os consumidores, apagar o service**

```bash
git rm src/services/mission.service.ts
```

- [ ] **Step 5: Verificar e commit**

```bash
npx tsc -b && npm run test && npm run build
git commit -m "refactor: missionUseCase substitui mission.service e fecha a dependencia do ride"
```

---

## Task 4: Verificação do lote

**Files:** nenhum a modificar.

- [ ] **Step 1: Contagens**

```bash
ls src/domain/usecases/*UseCase.ts | wc -l
ls src/services/*.service.ts | wc -l
```

Expected: **19** usecases, **3** services (`audit`, `finance`, `auth`).

- [ ] **Step 2: Nenhum usecase depende de um service**

```bash
grep -rn "Service\b" src/domain/usecases/*.ts || echo "(limpo)"
```

Expected: sem resultados. É a inconsistência que este lote fecha.

- [ ] **Step 3: A regra das escritas na API**

```bash
grep -rn "adminMoney\.[a-z]" src/domain/usecases/*.ts
```

Para cada resultado, confirmar por leitura que **não** está dentro de um `this.run(`. São sete ao todo depois deste lote.

- [ ] **Step 4: Camadas e castings**

```bash
grep -rn "from '@/modules/Api'" src/domain/usecases/
grep -n "as keyof\|field: string" src/domain/usecases/*.ts || echo "(limpo)"
```

- [ ] **Step 5: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 6: Relatório**

Sem commit. Registar quantos consumidores cada conversão tocou, o que se encontrou no `mission` além de delegação, e como ficou a dependência do `rideUseCase`.

---

## Fecho

Dezanove usecases contra três services, e a camada sem dependências invertidas.

Sobram os três que não são usecases de entidade: `auth` (embrulha o Firebase Auth, sem repositório), `audit` (o `withAudit` com 57 consumidores, transversal) e `finance` (agrega dois DAOs e importa-os directamente, saltando o factory). Cada um precisa de decisão própria, não de conversão mecânica.
