# BaseFirebaseDAO — Rede de Segurança + Slice Vertical `vehicle` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estabelecer testes contra o emulador Firestore e migrar a entidade `vehicle` para o padrão de `clean-architecture-mvvm.md` ponta a ponta (Doc → Entity+Converter → port → `BaseFirebaseDAO` → ApiFactory lazy → UseCase → ViewModel), provando o padrão antes de o replicar pelos restantes 19 DAOs.

**Architecture:** Introduz-se `BaseFirebaseDAO` — um motor CRUD+realtime genérico sobre `FirestoreDataConverter` — e `IBaseRepository<T>` como contrato único. `vehicle` é a primeira entidade a usá-los. Todo o código existente (19 DAOs, 20 services, exports antigos de `modules/Api/index.ts`) continua a funcionar sem alterações: as peças novas coexistem com as antigas. A verificação assenta numa suite de contrato que corre contra o emulador Firestore.

**Tech Stack:** TypeScript 5.8, React 19, Vite 7, `firebase` v12 (SDK modular web), `@tanstack/react-query` v5, Vitest, Firebase Emulator Suite.

## Global Constraints

Estas restrições aplicam-se a **todas** as tasks. Violá-las parte o build.

- **Branch:** todo o trabalho vai para `feat/data-layer-base-dao` no repo `web-kandengue_painel-ts`. Nunca commitar em `main`.
- **`erasableSyntaxOnly: true`** — **proibidas** as parameter properties do TypeScript (`constructor(private readonly x: string) {}`), `enum` e `namespace`. Declarar o campo na classe e atribuir no corpo do construtor. Esta é a armadilha nº1 deste plano.
- **`verbatimModuleSyntax: true`** — importações usadas apenas como tipo **têm** de usar `import type { X } from '...'`. Um `import { X }` de um tipo parte o build.
- **`noUnusedLocals: true` e `noUnusedParameters: true`** — qualquer import, variável ou parâmetro não usado parte o build. Para parâmetros que existem só por assinatura, prefixar com `_`.
- **`strict: true`** — sem `any` implícito.
- **Não alterar** `src/interfaces/IVehicle.ts::VehicleInterface`. É consumido por `Driver.ts`, `IDriver.ts`, `mockData.ts` e `DriverDetails.tsx`. Só se **acrescenta** um tipo novo a esse ficheiro.
- **Não tocar** nos outros 19 DAOs, nos outros services, nem remover exports existentes de `src/modules/Api/index.ts`.
- **Comando de verificação de tipos:** `npx tsc -b` (project references). Não `tsc --noEmit`. Baseline actual: verde, exit 0.
- **Comando de testes:** `npm run test`. Os testes de emulador exigem o emulador Firestore a correr (ver Task 1).
- **Alias de import:** `@/` → `src/`.
- **Idioma:** identificadores e comentários de código em inglês ou português conforme o ficheiro vizinho; mensagens de UI em português angolano.

---

## Ficheiros: mapa de responsabilidades

**Criar:**

| Ficheiro                                                        | Responsabilidade                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| `vitest.config.ts`                                              | Configuração Vitest + alias `@`                             |
| `src/test/firebase.emulator.ts`                                 | App Firebase isolada, ligada ao emulador; helper de limpeza |
| `src/modules/Api/firebase/__tests__/vehicle.dao.legacy.test.ts` | Caracterização do DAO actual (o "antes")                    |
| `src/helpers/firestore.ts`                                      | `toDate()` — fronteira Timestamp/Date                       |
| `src/helpers/__tests__/firestore.test.ts`                       | Testes de `toDate`                                          |
| `src/domain/errors/AppError.ts`                                 | `AppError` + `toAppError`                                   |
| `src/domain/errors/__tests__/AppError.test.ts`                  | Testes de `toAppError`                                      |
| `src/core/interfaces/IBaseRepository.ts`                        | Contrato CRUD+realtime único                                |
| `src/modules/Api/firebase/BaseFirebaseDAO.ts`                   | Motor de acesso a dados                                     |
| `src/modules/Api/firebase/__tests__/vehicle.dao.test.ts`        | Contrato aplicado ao DAO novo                               |
| `src/domain/usecases/BaseUseCase.ts`                            | Normalização de erros                                       |
| `src/domain/usecases/vehicleUseCase.ts`                         | Regras de negócio de veículos                               |

**Modificar:**

| Ficheiro                                    | Alteração                                                      |
| ------------------------------------------- | -------------------------------------------------------------- |
| `package.json`                              | devDeps de teste + script `test`                               |
| `src/interfaces/IVehicle.ts`                | **acrescentar** `VehicleDoc` (não mexer em `VehicleInterface`) |
| `src/interfaces/IApiResponse.ts`            | **acrescentar** campos `cursor`/`hasMore` a `paginationType`   |
| `src/core/entities/Vehicle.ts`              | acrescentar `vehicleConverter`                                 |
| `src/core/interfaces/IVehicleRepository.ts` | passar a `extends IBaseRepository<VehicleEntity>`              |
| `src/modules/Api/firebase/vehicle.dao.ts`   | reescrever a estender `BaseFirebaseDAO`                        |
| `src/modules/Api/index.ts`                  | acrescentar `ApiRepository` (manter exports antigos)           |
| `src/viewModels/VehicleViewModel.ts`        | passar a usar `vehicleUseCase`                                 |

**Apagar (só na última task):** `src/services/vehicle.service.ts`

---

## Task 1: Infra de teste — Vitest ligado ao emulador Firestore

**Files:**

- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/firebase.emulator.ts`
- Test: `src/test/__tests__/emulator.smoke.test.ts`

**Interfaces:**

- Consumes: nada.
- Produces: `src/test/firebase.emulator.ts` exporta `testDb: Firestore`, `assertEmulatorRunning()` e `clearCollection(path: string): Promise<void>`. (Não exporta auth/storage: os `vi.mock` das tasks seguintes passam `{ auth: {}, storage: {} }`.) Todas as tasks seguintes que testem contra o emulador importam daqui e fazem `vi.mock('@/config/firebase.config')` a apontar para estes.

**Contexto:** O emulador Firestore corre a partir do repo `node-fastify-kandengue_atrevido-ts` (`npm run dev:emulator`), na porta **8080**, projeto `kandengue-atrevido-5740d`. Este repo não tem `firebase.json` e não precisa de ter — os testes apenas se ligam ao emulador já em execução.

⚠️ **A porta é 8090, não a 8080 do `firebase.json` do node-fastify.** Nesta máquina, as portas 8080 e 8081 estão ocupadas por dev servers de outro projecto (`NaLupa/web-na_lupa-ts`), pelo que `npm run dev:emulator` do node-fastify falha com "port taken". O emulador para estes testes já está a correr na 8090 — não é preciso arrancá-lo.

- [ ] **Step 1: Criar a branch**

```bash
cd /Users/user/Projects/Kandebgue/web-kandengue_painel-ts
git checkout -b feat/data-layer-base-dao
git status
```

Expected: `On branch feat/data-layer-base-dao`, working tree clean.

- [ ] **Step 2: Instalar as dependências de teste**

```bash
npm install -D vitest@^3 @vitest/ui@^3
```

- [ ] **Step 3: Acrescentar o script `test` ao `package.json`**

No bloco `"scripts"`, acrescentar as duas linhas `test` e `test:watch` (manter as existentes):

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 4: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'node',
    // Os testes de emulador partilham uma base de dados: correr em série
    // evita que a limpeza de uma suite apague os dados de outra.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
    include: ['src/**/__tests__/**/*.test.ts']
  }
})
```

- [ ] **Step 5: Criar `src/test/firebase.emulator.ts`**

```ts
import { initializeApp, deleteApp, getApps } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import {
  initializeFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

const PROJECT_ID = 'kandengue-atrevido-5740d'
const EMULATOR_HOST = '127.0.0.1'
const EMULATOR_PORT = 8090

const APP_NAME = 'kandengue-painel-tests'

function createApp(): FirebaseApp {
  const existing = getApps().find(a => a.name === APP_NAME)
  if (existing) return existing
  return initializeApp(
    { projectId: PROJECT_ID, apiKey: 'emulator-fake-key' },
    APP_NAME
  )
}

const app = createApp()

// ignoreUndefinedProperties espelha o que a config de produção passará a ter,
// para que os testes exercitem o mesmo comportamento de escrita.
export const testDb: Firestore = initializeFirestore(app, {
  ignoreUndefinedProperties: true
})

connectFirestoreEmulator(testDb, EMULATOR_HOST, EMULATOR_PORT)

const START_HINT =
  `Arranca o emulador com:\n` +
  `  firebase emulators:start --only firestore --project ${PROJECT_ID}\n` +
  `a partir de uma pasta cujo firebase.json declare a porta ${EMULATOR_PORT}.`

/**
 * Falha com uma mensagem accionável se o emulador não estiver a correr.
 * Sem isto, o erro é um timeout opaco de 20s.
 */
export async function assertEmulatorRunning(): Promise<void> {
  let body: string
  try {
    const res = await fetch(`http://${EMULATOR_HOST}:${EMULATOR_PORT}/`)
    body = (await res.text()).trim()
  } catch (err) {
    throw new Error(
      `Emulador Firestore inacessível em ${EMULATOR_HOST}:${EMULATOR_PORT}.\n` +
        `${START_HINT}\nCausa: ${(err as Error).message}`
    )
  }

  // O emulador Firestore responde exactamente "Ok" na raiz. Qualquer dev
  // server também devolve HTTP 200 — por isso valida-se o CORPO e não o
  // status, ou uma porta ocupada por outro processo passa por emulador.
  if (body !== 'Ok') {
    throw new Error(
      `A porta ${EMULATOR_PORT} está ocupada por outro serviço, não pelo ` +
        `emulador Firestore (resposta: "${body.slice(0, 60)}").\n${START_HINT}`
    )
  }
}

/** Apaga todos os documentos de uma colecção. Usar em beforeEach. */
export async function clearCollection(path: string): Promise<void> {
  const snap = await getDocs(collection(testDb, path))
  if (snap.empty) return
  const batch = writeBatch(testDb)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

/** Liberta a app do Firebase. Usar em afterAll do último ficheiro, se necessário. */
export async function destroyTestApp(): Promise<void> {
  await deleteApp(app)
}
```

- [ ] **Step 6: Escrever o teste de fumo**

Create `src/test/__tests__/emulator.smoke.test.ts`:

```ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  testDb,
  assertEmulatorRunning,
  clearCollection
} from '@/test/firebase.emulator'

describe('emulador Firestore', () => {
  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection('__smoke')
  })

  it('escreve e lê um documento', async () => {
    await setDoc(doc(testDb, '__smoke/doc-1'), { name: 'Kandengue', n: 42 })

    const snap = await getDoc(doc(testDb, '__smoke/doc-1'))

    expect(snap.exists()).toBe(true)
    expect(snap.data()).toEqual({ name: 'Kandengue', n: 42 })
  })

  it('clearCollection apaga os documentos', async () => {
    await setDoc(doc(testDb, '__smoke/doc-2'), { a: 1 })
    await clearCollection('__smoke')

    const snap = await getDoc(doc(testDb, '__smoke/doc-2'))

    expect(snap.exists()).toBe(false)
  })
})
```

- [ ] **Step 7: Confirmar o emulador e correr o teste**

O emulador **já está a correr na porta 8090** — não arranques outro. Confirma:

```bash
curl -s http://127.0.0.1:8090/
```

Expected: `Ok` (exactamente esta string; um `<!DOCTYPE html>` significa que a porta foi tomada por um dev server).

Depois, no repo do painel:

```bash
npm run test -- src/test/__tests__/emulator.smoke.test.ts
```

Expected: `2 passed`.

Se o emulador não estiver a correr, o teste falha com a mensagem `Emulador Firestore inacessível em 127.0.0.1:8080` — é o comportamento correcto.

- [ ] **Step 8: Verificar que os tipos continuam verdes**

```bash
npx tsc -b
echo "exit=$?"
```

Expected: `exit=0`, sem output.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/
git commit -m "test: adicionar Vitest e harness do emulador Firestore"
```

---

## Task 2: Caracterização do `FirebaseVehicleDAO` actual

Captura o comportamento de hoje **antes** de mexer em qualquer coisa. Estes testes são a prova de que a migração não muda o que importa — e documentam os bugs actuais, para que a migração os corrija de propósito e não por acaso.

**Files:**

- Test: `src/modules/Api/firebase/__tests__/vehicle.dao.legacy.test.ts`

**Interfaces:**

- Consumes: `testDb`, `assertEmulatorRunning`, `clearCollection` de `@/test/firebase.emulator` (Task 1). `FirebaseVehicleDAO` de `@/modules/Api/firebase/vehicle.dao` (assinatura actual, posicional: `getAll(limit?, offset?, searchTerm?, filters?)`).
- Produces: nada consumido por outras tasks. É uma rede, não uma API.

- [ ] **Step 1: Escrever os testes de caracterização**

Create `src/modules/Api/firebase/__tests__/vehicle.dao.legacy.test.ts`:

```ts
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

// Redirecciona o `db` da app para o emulador. Tem de vir antes do import do DAO.
vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseVehicleDAO } =
  await import('@/modules/Api/firebase/vehicle.dao')

const COLLECTION = 'vehicles'

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseVehicleDAO (legado) — caracterização', () => {
  let dao: InstanceType<typeof FirebaseVehicleDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseVehicleDAO()
  })

  it('getAll devolve os veículos ordenados por created_at desc', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      brand: 'Toyota',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })
    await seed('veh-b', {
      plate: 'LD-22-22-BB',
      brand: 'Honda',
      created_at: Timestamp.fromDate(new Date('2026-06-01'))
    })

    const res = await dao.getAll(10)

    expect(res.data.map(v => v.id)).toEqual(['veh-b', 'veh-a'])
  })

  it('getById devolve null quando o documento não existe', async () => {
    expect(await dao.getById('nao-existe')).toBeNull()
  })

  it('getOneByField encontra por matrícula exacta', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    const found = await dao.getOneByField('plate', 'LD-11-11-AA')

    expect(found?.id).toBe('veh-a')
  })

  it('create grava o documento e devolve a entidade', async () => {
    const created = await dao.create({
      user_id: 'usr-1',
      type: 'car',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'preto',
      plate: 'LD-33-33-CC',
      status: 'under_analysis'
    } as never)

    expect(created.id).toMatch(/^veh-/)
    const stored = await dao.getById(created.id)
    expect(stored?.plate).toBe('LD-33-33-CC')
  })

  it('update altera o campo e devolve a entidade actualizada', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      status: 'under_analysis',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    const updated = await dao.update('veh-a', { status: 'validated' })

    expect(updated.status).toBe('validated')
  })

  it('delete remove o documento', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    await dao.delete('veh-a')

    expect(await dao.getById('veh-a')).toBeNull()
  })

  // ─────────── Bugs actuais, documentados de propósito ───────────
  // Estes dois testes asseveram o comportamento ERRADO de hoje.
  // A Task 9 vai invertê-los — é esse o sinal de que a migração corrigiu algo.

  it('BUG: created_at volta como Timestamp, não como Date', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    const found = await dao.getById('veh-a')

    // VehicleEntity declara `created_at?: Date`, mas o que chega é um Timestamp.
    // Qualquer `.toLocaleDateString()` na UI rebenta em runtime.
    expect(found?.created_at).toBeInstanceOf(Timestamp)
    expect(found?.created_at).not.toBeInstanceOf(Date)
  })

  it('BUG: a pesquisa por matrícula não encontra nada (case mismatch)', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    // O DAO faz `searchTerm.toLowerCase()` mas as matrículas estão gravadas
    // em maiúsculas — o range nunca encontra nada.
    const res = await dao.getAll(10, 0, 'LD-11')

    expect(res.data).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Correr os testes**

```bash
npm run test -- src/modules/Api/firebase/__tests__/vehicle.dao.legacy.test.ts
```

Expected: `8 passed`.

Se algum dos dois testes marcados como `BUG:` **passar ao contrário** (ou seja, falhar), significa que o comportamento actual é diferente do que este plano assume. **Parar e reportar** em vez de ajustar o teste — a diferença é informação.

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc -b
echo "exit=$?"
```

Expected: `exit=0`.

- [ ] **Step 4: Commit**

```bash
git add src/modules/Api/firebase/__tests__/vehicle.dao.legacy.test.ts
git commit -m "test: caracterizar o FirebaseVehicleDAO actual antes da migracao"
```

---

## Task 3: Helpers — `toDate` e `AppError`

Duas peças puras, sem emulador, sem Firestore. Testes rápidos.

**Files:**

- Create: `src/helpers/firestore.ts`
- Create: `src/helpers/__tests__/firestore.test.ts`
- Create: `src/domain/errors/AppError.ts`
- Create: `src/domain/errors/__tests__/AppError.test.ts`

**Interfaces:**

- Consumes: nada.
- Produces:
  - `toDate(v: Timestamp | Date | string | null | undefined): Date | null`
  - `type AppErrorCode = 'permission-denied' | 'not-found' | 'already-exists' | 'unavailable' | 'failed-precondition' | 'unauthenticated' | 'unknown'`
  - `class AppError extends Error` com campos `code: AppErrorCode` e `original?: unknown`
  - `toAppError(err: unknown, context?: string): AppError`

- [ ] **Step 1: Escrever os testes de `toDate`**

Create `src/helpers/__tests__/firestore.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { toDate } from '@/helpers/firestore'

describe('toDate', () => {
  it('converte Timestamp em Date', () => {
    const d = new Date('2026-01-15T10:30:00.000Z')
    expect(toDate(Timestamp.fromDate(d))).toEqual(d)
  })

  it('devolve a própria Date sem alterar', () => {
    const d = new Date('2026-01-15T10:30:00.000Z')
    expect(toDate(d)).toBe(d)
  })

  it('converte string ISO em Date', () => {
    expect(toDate('2026-01-15T10:30:00.000Z')).toEqual(
      new Date('2026-01-15T10:30:00.000Z')
    )
  })

  it('devolve null para null e undefined', () => {
    expect(toDate(null)).toBeNull()
    expect(toDate(undefined)).toBeNull()
  })
})
```

- [ ] **Step 2: Correr — tem de falhar**

```bash
npm run test -- src/helpers/__tests__/firestore.test.ts
```

Expected: FAIL — `Failed to resolve import "@/helpers/firestore"`.

- [ ] **Step 3: Implementar `toDate`**

Create `src/helpers/firestore.ts`:

```ts
import type { Timestamp } from 'firebase/firestore'

/**
 * Fronteira única entre o tempo do Firestore e o tempo da aplicação.
 * Aceita Timestamp, Date, string ISO, null ou undefined.
 */
export function toDate(
  value: Timestamp | Date | string | null | undefined
): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate()
  }
  return null
}
```

- [ ] **Step 4: Correr — tem de passar**

```bash
npm run test -- src/helpers/__tests__/firestore.test.ts
```

Expected: `4 passed`.

- [ ] **Step 5: Escrever os testes de `AppError`**

Create `src/domain/errors/__tests__/AppError.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { AppError, toAppError } from '@/domain/errors/AppError'

describe('toAppError', () => {
  it('mapeia firestore/permission-denied', () => {
    const err = toAppError({ code: 'firestore/permission-denied' })

    expect(err).toBeInstanceOf(AppError)
    expect(err.code).toBe('permission-denied')
    expect(err.message).toContain('Não tem permissão')
  })

  it('mapeia auth/unauthenticated', () => {
    expect(toAppError({ code: 'auth/unauthenticated' }).code).toBe(
      'unauthenticated'
    )
  })

  it('cai em unknown para códigos não mapeados', () => {
    expect(toAppError({ code: 'firestore/aborted' }).code).toBe('unknown')
    expect(toAppError(new Error('boom')).code).toBe('unknown')
  })

  it('prefixa a mensagem com o contexto', () => {
    const err = toAppError(
      { code: 'firestore/not-found' },
      '[vehicles.getById]'
    )

    expect(err.message).toBe('[vehicles.getById] Registo não encontrado.')
  })

  it('preserva o erro original', () => {
    const original = { code: 'firestore/unavailable' }

    expect(toAppError(original).original).toBe(original)
  })

  it('AppError é lançável e apanhável', () => {
    expect(() => {
      throw new AppError('not-found', 'x')
    }).toThrow(AppError)
  })
})
```

- [ ] **Step 6: Correr — tem de falhar**

```bash
npm run test -- src/domain/errors/__tests__/AppError.test.ts
```

Expected: FAIL — `Failed to resolve import "@/domain/errors/AppError"`.

- [ ] **Step 7: Implementar `AppError`**

Create `src/domain/errors/AppError.ts`.

⚠️ **`erasableSyntaxOnly`**: nada de `constructor(public readonly code: ...)`. Campos declarados, atribuídos no corpo. O campo chama-se `original` e **não** `cause`, para não colidir com `Error.cause` do lib ES2022.

```ts
export type AppErrorCode =
  | 'permission-denied'
  | 'not-found'
  | 'already-exists'
  | 'unavailable'
  | 'failed-precondition'
  | 'unauthenticated'
  | 'unknown'

const MESSAGES: Record<AppErrorCode, string> = {
  'permission-denied': 'Não tem permissão para esta operação.',
  'not-found': 'Registo não encontrado.',
  'already-exists': 'Este registo já existe.',
  unavailable: 'Sem ligação. Verifique a internet e tente novamente.',
  'failed-precondition': 'Consulta inválida — índice em falta.',
  unauthenticated: 'Sessão expirada. Inicie sessão novamente.',
  unknown: 'Ocorreu um erro inesperado.'
}

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly original?: unknown

  constructor(code: AppErrorCode, message: string, original?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.original = original
  }
}

/** Traduz um erro do Firebase para o vocabulário do domínio. */
export function toAppError(err: unknown, context = ''): AppError {
  if (err instanceof AppError) return err

  const raw = (err as { code?: string } | null)?.code ?? ''
  const suffix = raw.includes('/') ? raw.split('/')[1] : raw
  const code: AppErrorCode =
    suffix in MESSAGES ? (suffix as AppErrorCode) : 'unknown'

  if (code === 'failed-precondition') {
    // O Firestore devolve o URL de criação do índice dentro da mensagem.
    console.error(`${context} índice em falta:`, (err as Error)?.message)
  }

  const message = context ? `${context} ${MESSAGES[code]}` : MESSAGES[code]
  return new AppError(code, message, err)
}
```

- [ ] **Step 8: Correr — tem de passar**

```bash
npm run test -- src/domain/errors/__tests__/AppError.test.ts
```

Expected: `6 passed`.

- [ ] **Step 9: Verificar tipos e commitar**

```bash
npx tsc -b && echo "tsc ok"
git add src/helpers/firestore.ts src/helpers/__tests__ src/domain/errors
git commit -m "feat: adicionar helper toDate e AppError com normalizacao de erros"
```

---

## Task 4: Ports — `IBaseRepository` e paginação por cursor

Só tipos. Nenhuma alteração de runtime, nenhum teste de comportamento — a verificação é `tsc -b`.

**Files:**

- Create: `src/core/interfaces/IBaseRepository.ts`
- Modify: `src/interfaces/IApiResponse.ts`

**Interfaces:**

- Consumes: `ListResponseType` de `@/interfaces/IApiResponse`.
- Produces:
  - `interface QueryOptions<T>` com `{ limit?, after?, orderBy?, orderDirection?, filters?, searchTerm?, withTotal? }`
  - `interface ListenOptions<T>` com `{ limit?, orderBy?, orderDirection?, filters? }`
  - `interface IBaseRepository<T extends { id: string }>` com `getAll(options?)`, `getById`, `getAllByField(field, value, options?)`, `getOneByField`, `count`, `create(data, id?)`, `update`, `delete`, `listenById`, `listenAll`, `listenAllByField`.

  As Tasks 6–9 implementam exactamente estas assinaturas. A Task 11 consome-as.

- [ ] **Step 1: Acrescentar os campos de cursor a `paginationType`**

Modify `src/interfaces/IApiResponse.ts`. Substituir o bloco `paginationType` existente por:

```ts
export type paginationType = {
  limit: number | null
  offset?: any | null
  count: number
  total?: number | undefined
  /** ID do último documento devolvido — passar em `after` para a página seguinte. */
  cursor?: string | null
  /** `true` se existe pelo menos mais um documento para lá desta página. */
  hasMore?: boolean
} | null
```

`offset` passa a opcional para que o código antigo (que o preenche) continue a compilar e o novo (que não o preenche) também. Não remover.

- [ ] **Step 2: Criar `src/core/interfaces/IBaseRepository.ts`**

```ts
import type { ListResponseType } from '@/interfaces/IApiResponse'

export interface QueryOptions<T> {
  /** Máximo de documentos a devolver. Omisso: 50. */
  limit?: number
  /** Cursor: ID do último documento da página anterior. */
  after?: string | null
  /** Campo de ordenação. Omisso: `created_at`. */
  orderBy?: keyof T
  orderDirection?: 'asc' | 'desc'
  /** Filtros de igualdade. Valores `undefined` ou `''` são ignorados. */
  filters?: Partial<T>
  /** Pesquisa por prefixo sobre o `searchField` do DAO. */
  searchTerm?: string
  /** Pedir o total da colecção. Custa 1 leitura agregada. Omisso: false. */
  withTotal?: boolean
}

export interface ListenOptions<T> {
  limit?: number
  orderBy?: keyof T
  orderDirection?: 'asc' | 'desc'
  filters?: Partial<T>
}

/**
 * Contrato único de acesso a dados. `T` é sempre a **Entity** — a conversão
 * Doc→Entity é responsabilidade do converter, dentro do DAO.
 *
 * Todos os métodos `listen*` devolvem a função de unsubscribe.
 */
export interface IBaseRepository<T extends { id: string }> {
  // ---- Leitura ----
  getAll(options?: QueryOptions<T>): Promise<ListResponseType<T[]>>
  getById(id: string): Promise<T | null>
  getAllByField(
    field: keyof T,
    value: unknown,
    options?: Omit<QueryOptions<T>, 'filters'>
  ): Promise<ListResponseType<T[]>>
  getOneByField(field: keyof T, value: unknown): Promise<T | null>
  count(filters?: Partial<T>): Promise<number>

  // ---- Escrita ----
  create(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>

  // ---- Realtime ----
  listenById(
    id: string,
    onUpdate: (data: T | null) => void,
    onError?: (err: Error) => void
  ): () => void

  listenAll(
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options?: ListenOptions<T>
  ): () => void

  listenAllByField(
    field: keyof T,
    value: unknown,
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options?: Omit<ListenOptions<T>, 'filters'>
  ): () => void
}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc -b
echo "exit=$?"
```

Expected: `exit=0`. Se falhar em ficheiros que usam `pagination.offset`, é porque algum sítio o lê como obrigatório — corrigir esse sítio para tolerar `undefined`, não reverter o tipo.

- [ ] **Step 4: Correr toda a suite (nada pode ter partido)**

```bash
npm run test
```

Expected: todos os testes das Tasks 1–3 passam.

- [ ] **Step 5: Commit**

```bash
git add src/core/interfaces/IBaseRepository.ts src/interfaces/IApiResponse.ts
git commit -m "feat: adicionar IBaseRepository e paginacao por cursor"
```

---

## Task 5: `VehicleDoc` + `vehicleConverter`

**Files:**

- Modify: `src/interfaces/IVehicle.ts` (só acrescentar)
- Modify: `src/core/entities/Vehicle.ts` (só acrescentar)
- Test: `src/core/entities/__tests__/Vehicle.test.ts`

**Interfaces:**

- Consumes: `toDate` de `@/helpers/firestore` (Task 3).
- Produces:
  - `interface VehicleDoc` em `@/interfaces/IVehicle` — forma crua do documento Firestore, com `created_at`/`updated_at` como `Timestamp | null`.
  - `const vehicleConverter: FirestoreDataConverter<VehicleEntity>` exportado de `@/core/entities/Vehicle`. A Task 9 passa-o ao `BaseFirebaseDAO`.

⚠️ **`VehicleInterface` não muda.** É consumido por `Driver.ts`, `IDriver.ts`, `mockData.ts` e `DriverDetails.tsx`.

- [ ] **Step 1: Escrever os testes do converter**

Create `src/core/entities/__tests__/Vehicle.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import type { QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'
import { VehicleEntity, vehicleConverter } from '@/core/entities/Vehicle'

/** Snapshot mínimo — só o que o converter usa. */
function snapshotOf(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: (_options?: SnapshotOptions) => data
  } as unknown as QueryDocumentSnapshot
}

describe('vehicleConverter.fromFirestore', () => {
  it('converte Timestamp em Date', () => {
    const created = new Date('2026-01-15T10:00:00.000Z')

    const entity = vehicleConverter.fromFirestore(
      snapshotOf('veh-1', {
        id: 'veh-1',
        user_id: 'usr-1',
        type: 'car',
        brand: 'Toyota',
        model: 'Corolla',
        color: 'preto',
        plate: 'LD-11-11-AA',
        status: 'validated',
        created_at: Timestamp.fromDate(created),
        updated_at: null
      }),
      {}
    )

    expect(entity).toBeInstanceOf(VehicleEntity)
    expect(entity.created_at).toBeInstanceOf(Date)
    expect(entity.created_at).toEqual(created)
    expect(entity.updated_at).toBeUndefined()
  })

  it('usa o id do snapshot mesmo que o campo id falte no documento', () => {
    const entity = vehicleConverter.fromFirestore(
      snapshotOf('veh-2', { plate: 'LD-22-22-BB' }),
      {}
    )

    expect(entity.id).toBe('veh-2')
  })

  it('aplica defaults a campos em falta', () => {
    const entity = vehicleConverter.fromFirestore(
      snapshotOf('veh-3', { plate: 'LD-33-33-CC' }),
      {}
    )

    expect(entity.status).toBe('under_analysis')
    expect(entity.created_at).toBeInstanceOf(Date)
  })
})

describe('vehicleConverter.toFirestore', () => {
  it('não escreve o campo id dentro do documento duas vezes nem perde campos', () => {
    const entity = new VehicleEntity({
      id: 'veh-1',
      user_id: 'usr-1',
      type: 'car',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'preto',
      plate: 'LD-11-11-AA',
      status: 'validated'
    })

    const raw = vehicleConverter.toFirestore(entity) as Record<string, unknown>

    expect(raw.plate).toBe('LD-11-11-AA')
    expect(raw.id).toBe('veh-1')
  })
})
```

- [ ] **Step 2: Correr — tem de falhar**

```bash
npm run test -- src/core/entities/__tests__/Vehicle.test.ts
```

Expected: FAIL — `vehicleConverter` não é exportado.

- [ ] **Step 3: Acrescentar `VehicleDoc` a `src/interfaces/IVehicle.ts`**

Ficheiro completo depois da alteração (o `VehicleInterface` existente fica intacto):

```ts
import type { Timestamp } from 'firebase/firestore'
import type { VehicleStatusEnumType, VehicleType } from '@/types/enum'

export interface VehicleInterface {
  id: string
  user_id: string
  type: VehicleType
  brand: string
  model: string
  color: string
  plate: string
  status: VehicleStatusEnumType
  image?: string
  created_at?: Date
  updated_at?: Date
}

/**
 * Forma CRUA do documento em `vehicles`, tal como o Firestore o devolve.
 * Difere de `VehicleInterface` nas datas: aqui são `Timestamp`.
 * Só o converter deve tocar neste tipo.
 */
export interface VehicleDoc {
  id?: string
  user_id?: string
  type?: VehicleType
  brand?: string
  model?: string
  color?: string
  plate?: string
  status?: VehicleStatusEnumType
  image?: string
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
}
```

- [ ] **Step 4: Acrescentar o converter a `src/core/entities/Vehicle.ts`**

Ficheiro completo depois da alteração. A classe passa a aceitar `Partial` com `id` obrigatório e a aplicar defaults; `created_at`/`updated_at` passam a `Date | null`.

```ts
// core/entities/Vehicle.ts
import type { FirestoreDataConverter } from 'firebase/firestore'
import type { VehicleDoc, VehicleInterface } from '@/interfaces/IVehicle'
import type { VehicleStatusEnumType, VehicleType } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

export type VehicleEntityParams = Partial<
  Omit<VehicleInterface, 'id' | 'created_at' | 'updated_at'>
> & {
  id: string
  created_at?: Date | null
  updated_at?: Date | null
}

export class VehicleEntity implements VehicleInterface {
  id: string
  user_id: string
  type: VehicleType
  brand: string
  model: string
  color: string
  plate: string
  status: VehicleStatusEnumType
  image?: string
  created_at: Date
  updated_at?: Date

  constructor(params: VehicleEntityParams) {
    this.id = params.id
    this.user_id = params.user_id ?? ''
    this.type = params.type ?? 'car'
    this.brand = params.brand ?? ''
    this.model = params.model ?? ''
    this.color = params.color ?? ''
    this.plate = params.plate ?? ''
    this.status = params.status ?? 'under_analysis'
    this.image = params.image
    this.created_at = params.created_at ?? new Date()
    // Fronteira de ausência: o Firestore guarda `null`, a aplicação usa
    // `undefined` — um só valor de ausência, igual ao resto do codebase.
    this.updated_at = params.updated_at ?? undefined
  }
}

/** Fronteira única entre o documento Firestore e a aplicação. */
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

- [ ] **Step 5: Correr — tem de passar**

```bash
npm run test -- src/core/entities/__tests__/Vehicle.test.ts
```

Expected: `4 passed`.

- [ ] **Step 6: Verificar tipos**

```bash
npx tsc -b
echo "exit=$?"
```

Expected: `exit=0`.

`VehicleEntity` volta a declarar `implements VehicleInterface` — e isso é
deliberado: é o compilador a garantir que a entidade continua utilizável em todos
os sítios que hoje esperam a interface (`Driver.ts`, `IDriver.ts`, `mockData.ts`,
`DriverDetails.tsx`).

Isto só funciona porque `updated_at` é `Date | undefined` e não `Date | null`.
`null` **não** satisfaz `Date | undefined`, e usá-lo obriga a alterar em cascata
`DriverDetails.tsx`, `IDriver.ts` e `DriverEntity`. O `null` fica onde pertence —
no documento Firestore — e o converter normaliza-o para `undefined` à entrada.

Se o `tsc` acusar, **reportar** o ficheiro e a linha em vez de alargar tipos.

- [ ] **Step 7: Correr toda a suite e commitar**

```bash
npm run test
git add src/interfaces/IVehicle.ts src/core/entities/Vehicle.ts src/core/entities/__tests__
git commit -m "feat: adicionar VehicleDoc e vehicleConverter"
```

---

## Task 6: `BaseFirebaseDAO` — leitura

**Files:**

- Create: `src/modules/Api/firebase/BaseFirebaseDAO.ts`
- Test: `src/modules/Api/firebase/__tests__/baseFirebaseDao.read.test.ts`

**Interfaces:**

- Consumes: `IBaseRepository`, `QueryOptions`, `ListenOptions` (Task 4); `toAppError` (Task 3); `db` de `@/config/firebase.config`; `generateId` de `@/helpers/generateId`.
- Produces: `abstract class BaseFirebaseDAO<T extends { id: string }> implements IBaseRepository<T>` com o construtor
  `constructor(path: string, converter: FirestoreDataConverter<T>, idPrefix: string, searchField?: keyof T & string)`
  e os campos protegidos `ref`, `path`, `idPrefix`, `searchField`, mais `protected fail(op: string, err: unknown): never`.
  Nesta task só os métodos de leitura existem; as Tasks 7 e 8 acrescentam escrita e realtime **ao mesmo ficheiro**.

⚠️ **`erasableSyntaxOnly`**: nada de parameter properties no construtor.

- [ ] **Step 1: Escrever os testes de leitura**

Create `src/modules/Api/firebase/__tests__/baseFirebaseDao.read.test.ts`:

```ts
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { BaseFirebaseDAO } =
  await import('@/modules/Api/firebase/BaseFirebaseDAO')
const { VehicleEntity, vehicleConverter } =
  await import('@/core/entities/Vehicle')

const COLLECTION = 'test_vehicles'

class TestDAO extends BaseFirebaseDAO<InstanceType<typeof VehicleEntity>> {
  constructor() {
    super(COLLECTION, vehicleConverter, 'veh', 'plate')
  }
}

/** Igual ao TestDAO mas sem o 4º argumento — usado para provar que a
 *  pesquisa falha alto em vez de devolver a colecção inteira. */
class NoSearchDAO extends BaseFirebaseDAO<InstanceType<typeof VehicleEntity>> {
  constructor() {
    super(COLLECTION, vehicleConverter, 'veh')
  }
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

describe('BaseFirebaseDAO — leitura', () => {
  let dao: TestDAO
  let noSearchDao: NoSearchDAO

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new TestDAO()
    noSearchDao = new NoSearchDAO()
  })

  it('getAll ordena por created_at desc por omissão', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'BBB', created_at: ts('2026-06-01') })
    await seed('veh-c', { plate: 'CCC', created_at: ts('2026-03-01') })

    const res = await dao.getAll()

    expect(res.data.map(v => v.id)).toEqual(['veh-b', 'veh-c', 'veh-a'])
  })

  it('getAll respeita orderBy e orderDirection', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'BBB', created_at: ts('2026-06-01') })

    const res = await dao.getAll({
      orderBy: 'created_at',
      orderDirection: 'asc'
    })

    expect(res.data.map(v => v.id)).toEqual(['veh-a', 'veh-b'])
  })

  it('getAll converte Timestamp em Date', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })

    const res = await dao.getAll()

    expect(res.data[0].created_at).toBeInstanceOf(Date)
  })

  it('getAll aplica filtros de igualdade', async () => {
    await seed('veh-a', {
      plate: 'AAA',
      status: 'validated',
      created_at: ts('2026-01-01')
    })
    await seed('veh-b', {
      plate: 'BBB',
      status: 'rejected',
      created_at: ts('2026-02-01')
    })

    const res = await dao.getAll({ filters: { status: 'validated' } })

    expect(res.data.map(v => v.id)).toEqual(['veh-a'])
  })

  it('getAll ignora filtros com valor undefined ou string vazia', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })

    const res = await dao.getAll({
      filters: { status: undefined, brand: '' } as never
    })

    expect(res.data).toHaveLength(1)
  })

  it('getAll pagina por cursor sem repetir nem saltar documentos', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'BBB', created_at: ts('2026-02-01') })
    await seed('veh-c', { plate: 'CCC', created_at: ts('2026-03-01') })

    const page1 = await dao.getAll({ limit: 2 })
    expect(page1.data.map(v => v.id)).toEqual(['veh-c', 'veh-b'])
    expect(page1.pagination?.hasMore).toBe(true)
    expect(page1.pagination?.cursor).toBe('veh-b')

    const page2 = await dao.getAll({
      limit: 2,
      after: page1.pagination?.cursor
    })
    expect(page2.data.map(v => v.id)).toEqual(['veh-a'])
    expect(page2.pagination?.hasMore).toBe(false)
  })

  it('getAll não devolve total por omissão, e devolve com withTotal', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'BBB', created_at: ts('2026-02-01') })

    expect((await dao.getAll({ limit: 1 })).pagination?.total).toBeUndefined()
    expect(
      (await dao.getAll({ limit: 1, withTotal: true })).pagination?.total
    ).toBe(2)
  })

  it('getAll devolve lista vazia em colecção vazia', async () => {
    const res = await dao.getAll()

    expect(res.data).toEqual([])
    expect(res.pagination?.hasMore).toBe(false)
    expect(res.pagination?.cursor).toBeNull()
  })

  it('getAll faz pesquisa por prefixo no searchField', async () => {
    await seed('veh-a', { plate: 'ld-11-11-aa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bg-22-22-bb', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ searchTerm: 'LD-11' })

    expect(res.data.map(v => v.id)).toEqual(['veh-a'])
  })

  it('getAll devolve hasMore false quando o total é exactamente o limite', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ limit: 2 })

    expect(res.data.map(v => v.id)).toEqual(['veh-b', 'veh-a'])
    expect(res.pagination?.hasMore).toBe(false)
  })

  it('getAll falha quando o documento do cursor já não existe', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })

    const page1 = await dao.getAll({ limit: 1 })
    const cursor = page1.pagination?.cursor as string
    await dao.delete(cursor)

    // Não pode reiniciar na página 1 em silêncio.
    await expect(dao.getAll({ limit: 1, after: cursor })).rejects.toMatchObject({
      code: 'not-found'
    })
  })

  it('getAll falha quando se pesquisa num DAO sem searchField', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    await expect(
      noSearchDao.getAll({ searchTerm: 'aaa' })
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('getById devolve a entidade e null quando não existe', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })

    expect((await dao.getById('veh-a'))?.plate).toBe('AAA')
    expect(await dao.getById('nao-existe')).toBeNull()
  })

  it('getAllByField filtra pelo campo indicado', async () => {
    await seed('veh-a', {
      plate: 'AAA',
      user_id: 'usr-1',
      created_at: ts('2026-01-01')
    })
    await seed('veh-b', {
      plate: 'BBB',
      user_id: 'usr-2',
      created_at: ts('2026-02-01')
    })

    const res = await dao.getAllByField('user_id', 'usr-1')

    expect(res.data.map(v => v.id)).toEqual(['veh-a'])
  })

  it('getOneByField devolve o primeiro resultado ou null', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })

    expect((await dao.getOneByField('plate', 'AAA'))?.id).toBe('veh-a')
    expect(await dao.getOneByField('plate', 'ZZZ')).toBeNull()
  })

  it('count devolve o total, com e sem filtros', async () => {
    await seed('veh-a', {
      plate: 'AAA',
      status: 'validated',
      created_at: ts('2026-01-01')
    })
    await seed('veh-b', {
      plate: 'BBB',
      status: 'rejected',
      created_at: ts('2026-02-01')
    })

    expect(await dao.count()).toBe(2)
    expect(await dao.count({ status: 'validated' })).toBe(1)
  })
})
```

- [ ] **Step 2: Correr — tem de falhar**

```bash
npm run test -- src/modules/Api/firebase/__tests__/baseFirebaseDao.read.test.ts
```

Expected: FAIL — `Failed to resolve import "@/modules/Api/firebase/BaseFirebaseDAO"`.

- [ ] **Step 3: Implementar a parte de leitura do `BaseFirebaseDAO`**

Create `src/modules/Api/firebase/BaseFirebaseDAO.ts`:

```ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  startAfter,
  getCountFromServer
} from 'firebase/firestore'
import type {
  CollectionReference,
  FirestoreDataConverter,
  QueryConstraint
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type {
  IBaseRepository,
  ListenOptions,
  QueryOptions
} from '@/core/interfaces/IBaseRepository'
import { AppError, toAppError } from '@/domain/errors/AppError'

/** Sentinela de fim de intervalo para pesquisa por prefixo no Firestore. */
const PREFIX_END = '\uf8ff'

export abstract class BaseFirebaseDAO<T extends { id: string }> implements Pick<
  IBaseRepository<T>,
  'getAll' | 'getById' | 'getAllByField' | 'getOneByField' | 'count'
> {
  protected readonly ref: CollectionReference<T>
  protected readonly path: string
  protected readonly idPrefix: string
  protected readonly searchField?: keyof T & string

  /**
   * @param path        path da colecção — sempre vindo de `firebaseCollections`
   * @param converter   fronteira Doc ↔ Entity
   * @param idPrefix    prefixo dos IDs gerados no cliente (ex.: 'veh')
   * @param searchField campo usado no prefix-search. TEM de estar gravado em
   *                    minúsculas no documento e ter índice.
   */
  constructor(
    path: string,
    converter: FirestoreDataConverter<T>,
    idPrefix: string,
    searchField?: keyof T & string
  ) {
    this.path = path
    this.idPrefix = idPrefix
    this.searchField = searchField
    this.ref = collection(db, path).withConverter(converter)
  }

  /** Todos os erros do Firestore passam por aqui: contexto + código legível. */
  protected fail(op: string, err: unknown): never {
    throw toAppError(err, `[${this.path}.${op}]`)
  }

  protected constraints(
    options: QueryOptions<T> | ListenOptions<T>
  ): QueryConstraint[] {
    const constraints: QueryConstraint[] = []

    if (options.filters) {
      for (const [field, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== '') {
          constraints.push(where(field, '==', value))
        }
      }
    }

    const term =
      'searchTerm' in options
        ? options.searchTerm?.trim().toLowerCase()
        : undefined

    if (term) {
      // Pesquisar num DAO que não declarou `searchField` devolveria a colecção
      // inteira sem filtro — a caixa de pesquisa parece funcionar e mostra
      // tudo. Falhar alto é a única forma de a má configuração aparecer.
      if (!this.searchField) {
        throw new AppError(
          'failed-precondition',
          `[${this.path}] não suporta pesquisa: o DAO não declarou searchField.`
        )
      }
      // Um range obriga o primeiro orderBy a ser no mesmo campo — por isso a
      // pesquisa ignora o orderBy pedido.
      constraints.push(orderBy(this.searchField))
      constraints.push(where(this.searchField, '>=', term))
      constraints.push(where(this.searchField, '<=', term + PREFIX_END))
    } else {
      constraints.push(
        orderBy(
          (options.orderBy as string) ?? 'created_at',
          options.orderDirection ?? 'desc'
        )
      )
    }

    return constraints
  }

  async getAll(options: QueryOptions<T> = {}): Promise<ListResponseType<T[]>> {
    try {
      const limitValue = options.limit ?? 50
      const base = query(this.ref, ...this.constraints(options))

      let total: number | undefined
      if (options.withTotal) {
        total = (await getCountFromServer(base)).data().count
      }

      // Lê-se limit+1 para saber se há página seguinte sem uma segunda query.
      const cursorSnap = options.after
        ? await getDoc(doc(this.ref, options.after))
        : null

      if (options.after && !cursorSnap?.exists()) {
        // Sem isto, um cursor cujo documento foi entretanto apagado reinicia
        // em silêncio na página 1 — indistinguível do fim da lista para quem
        // chama. Melhor falhar e deixar a UI recomeçar a paginação.
        throw new AppError(
          'not-found',
          `[${this.path}] cursor inválido: o documento "${options.after}" já não existe.`
        )
      }

      const paged = cursorSnap
        ? query(base, startAfter(cursorSnap), fbLimit(limitValue + 1))
        : query(base, fbLimit(limitValue + 1))

      const snap = await getDocs(paged)
      const hasMore = snap.docs.length > limitValue
      const docs = hasMore ? snap.docs.slice(0, limitValue) : snap.docs
      const data = docs.map(d => d.data())

      return {
        data,
        pagination: {
          limit: limitValue,
          count: data.length,
          total,
          cursor: data.length ? data[data.length - 1].id : null,
          hasMore
        }
      }
    } catch (err) {
      this.fail('getAll', err)
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const snap = await getDoc(doc(this.ref, id))
      return snap.exists() ? snap.data() : null
    } catch (err) {
      this.fail('getById', err)
    }
  }

  async getAllByField(
    field: keyof T,
    value: unknown,
    options: Omit<QueryOptions<T>, 'filters'> = {}
  ): Promise<ListResponseType<T[]>> {
    return this.getAll({
      ...options,
      filters: { [field]: value } as Partial<T>
    })
  }

  async getOneByField(field: keyof T, value: unknown): Promise<T | null> {
    try {
      const snap = await getDocs(
        query(this.ref, where(field as string, '==', value), fbLimit(1))
      )
      return snap.empty ? null : snap.docs[0].data()
    } catch (err) {
      this.fail('getOneByField', err)
    }
  }

  async count(filters?: Partial<T>): Promise<number> {
    try {
      const constraints = filters
        ? Object.entries(filters)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([f, v]) => where(f, '==', v))
        : []
      return (await getCountFromServer(query(this.ref, ...constraints))).data()
        .count
    } catch (err) {
      this.fail('count', err)
    }
  }
}
```

> **Onde está a "suite de contrato":** os testes desta task e das Tasks 7–8 correm
> contra um `TestDAO` genérico que só estende `BaseFirebaseDAO` — logo, testam o
> motor, não o veículo. Como cada um dos outros 19 DAOs será igualmente um
> construtor de 12 linhas sobre este motor, estes testes cobrem-nos a todos. Não
> vale a pena parametrizar a suite antes de haver um segundo DAO migrado.

> Nota: o `implements Pick<IBaseRepository<T>, …>` é temporário — nas Tasks 7 e 8 passa a `implements IBaseRepository<T>` completo. Isto mantém o `tsc` verde entre tasks.

- [ ] **Step 4: Correr — tem de passar**

```bash
npm run test -- src/modules/Api/firebase/__tests__/baseFirebaseDao.read.test.ts
```

Expected: `16 passed`.

Se o teste de pesquisa por prefixo ou o de filtro+ordenação falhar com `failed-precondition`, o emulador precisa de um índice composto. O emulador normalmente cria-os automaticamente; se não criar, a mensagem de erro traz o URL — **reportar** em vez de remover o teste.

- [ ] **Step 5: Verificar tipos e commitar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
git add src/modules/Api/firebase/BaseFirebaseDAO.ts src/modules/Api/firebase/__tests__/baseFirebaseDao.read.test.ts
git commit -m "feat: BaseFirebaseDAO com leitura e paginacao por cursor"
```

---

## Task 7: `BaseFirebaseDAO` — escrita

**Files:**

- Modify: `src/modules/Api/firebase/BaseFirebaseDAO.ts`
- Test: `src/modules/Api/firebase/__tests__/baseFirebaseDao.write.test.ts`

**Interfaces:**

- Consumes: tudo o que a Task 6 produziu.
- Produces: `create(data, id?)`, `update(id, data)`, `delete(id)` no `BaseFirebaseDAO`.

- [ ] **Step 1: Escrever os testes de escrita**

Create `src/modules/Api/firebase/__tests__/baseFirebaseDao.write.test.ts`:

```ts
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { BaseFirebaseDAO } =
  await import('@/modules/Api/firebase/BaseFirebaseDAO')
const { VehicleEntity, vehicleConverter } =
  await import('@/core/entities/Vehicle')

const COLLECTION = 'test_vehicles'

class TestDAO extends BaseFirebaseDAO<InstanceType<typeof VehicleEntity>> {
  constructor() {
    super(COLLECTION, vehicleConverter, 'veh', 'plate')
  }
}

const NEW_VEHICLE = {
  user_id: 'usr-1',
  type: 'car',
  brand: 'Toyota',
  model: 'Corolla',
  color: 'preto',
  plate: 'ld-11-11-aa',
  status: 'under_analysis'
} as never

describe('BaseFirebaseDAO — escrita', () => {
  let dao: TestDAO

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new TestDAO()
  })

  it('create gera um id com o prefixo do DAO', async () => {
    const created = await dao.create(NEW_VEHICLE)

    expect(created.id).toMatch(/^veh-/)
  })

  it('create aceita um id explícito', async () => {
    const created = await dao.create(NEW_VEHICLE, 'veh-fixo')

    expect(created.id).toBe('veh-fixo')
  })

  it('create grava o id também dentro do documento', async () => {
    const created = await dao.create(NEW_VEHICLE)

    const raw = await getDoc(doc(testDb, `${COLLECTION}/${created.id}`))

    expect(raw.data()?.id).toBe(created.id)
  })

  it('create devolve created_at como Date resolvida pelo servidor', async () => {
    const created = await dao.create(NEW_VEHICLE)

    expect(created.created_at).toBeInstanceOf(Date)
    // O DAO grava `null`; o converter normaliza para `undefined`.
    expect(created.updated_at).toBeUndefined()
  })

  it('create descarta campos undefined em vez de rebentar', async () => {
    const created = await dao.create({ ...(NEW_VEHICLE as object), image: undefined } as never)

    expect(created.image).toBeUndefined()
  })

  it('create preserva valores null', async () => {
    await dao.create(
      { ...(NEW_VEHICLE as object), image: null } as never,
      'veh-null'
    )

    const raw = await getDoc(doc(testDb, `${COLLECTION}/veh-null`))

    expect(raw.data()?.image).toBeNull()
  })

  it('update altera o campo e preenche updated_at', async () => {
    await dao.create(NEW_VEHICLE, 'veh-a')

    const updated = await dao.update('veh-a', { status: 'validated' })

    expect(updated.status).toBe('validated')
    expect(updated.updated_at).toBeInstanceOf(Date)
  })

  it('update não deixa alterar id nem created_at', async () => {
    await setDoc(doc(testDb, `${COLLECTION}/veh-a`), {
      id: 'veh-a',
      plate: 'aaa',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    const updated = await dao.update('veh-a', {
      id: 'veh-hackeado',
      created_at: new Date('2030-01-01'),
      status: 'validated'
    } as never)

    expect(updated.id).toBe('veh-a')
    expect(updated.created_at).toEqual(new Date('2026-01-01'))
  })

  it('update falha com AppError quando o documento não existe', async () => {
    await expect(
      dao.update('nao-existe', { status: 'validated' })
    ).rejects.toThrow(/test_vehicles.update/)
  })

  it('delete remove o documento', async () => {
    await dao.create(NEW_VEHICLE, 'veh-a')

    await dao.delete('veh-a')

    expect(await dao.getById('veh-a')).toBeNull()
  })
})
```

- [ ] **Step 2: Correr — tem de falhar**

```bash
npm run test -- src/modules/Api/firebase/__tests__/baseFirebaseDao.write.test.ts
```

Expected: FAIL — `dao.create is not a function`.

- [ ] **Step 3: Acrescentar os imports de escrita**

Em `src/modules/Api/firebase/BaseFirebaseDAO.ts`, acrescentar ao import de `firebase/firestore` (bloco de valores) os nomes `setDoc`, `updateDoc`, `deleteDoc`, `serverTimestamp`. E acrescentar o import do helper:

```ts
import { generateId } from '@/helpers/generateId'
```

- [ ] **Step 4: Acrescentar os métodos de escrita à classe**

Colar dentro da classe, a seguir a `count()`:

```ts
  async create(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ): Promise<T> {
    try {
      const newId = id ?? generateId(this.idPrefix)

      await setDoc(doc(this.ref, newId), {
        ...(data as object),
        id: newId,
        created_at: serverTimestamp(),
        updated_at: null
      } as unknown as T)

      // Read-back: devolve o que ficou realmente gravado (com o created_at do
      // servidor resolvido), não uma reconstrução optimista que diverge.
      const created = await this.getById(newId)
      if (!created) {
        this.fail(
          'create',
          new AppError('not-found', 'documento não encontrado após criação')
        )
      }
      return created
    } catch (err) {
      this.fail('create', err)
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      // `id` e `created_at` são imutáveis: descartados em silêncio.
      const rest = { ...(data as Record<string, unknown>) }
      delete rest.id
      delete rest.created_at

      await updateDoc(doc(this.ref, id), {
        ...rest,
        updated_at: serverTimestamp()
      })

      const updated = await this.getById(id)
      if (!updated) {
        this.fail(
          'update',
          new AppError('not-found', 'documento não encontrado após update')
        )
      }
      return updated
    } catch (err) {
      this.fail('update', err)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.ref, id))
    } catch (err) {
      this.fail('delete', err)
    }
  }
```

- [ ] **Step 4b: Ligar `ignoreUndefinedProperties` na config de produção**

Os DAOs antigos removiam `undefined` à mão (`sanitize()`); o `BaseFirebaseDAO`
não o faz — depende desta flag. Sem ela, `create({ image: undefined })` passa nos
testes (o harness já a liga) e **rebenta em produção** com
`Unsupported field value: undefined`.

Em `src/config/firebase.config.ts`, trocar `getFirestore` por
`initializeFirestore` com a opção:

```ts
import { initializeFirestore } from 'firebase/firestore'
```

```ts
// ignoreUndefinedProperties elimina o sanitize() manual de cada DAO: o
// Firestore passa a descartar `undefined` em vez de rejeitar a escrita.
// `null` continua a ser gravado — é um valor legítimo.
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
})
```

`initializeFirestore` tem de correr antes de qualquer `getFirestore(app)`. Este
ficheiro é o único ponto de inicialização, por isso basta a troca — mas confirmar
com `grep -rn "getFirestore" src` que não sobra nenhuma outra chamada.

```bash
grep -rn "getFirestore" src
npx tsc -b && echo "tsc ok"
```

Expected: só o import antigo (agora removido) aparecia; `exit=0`.

- [ ] **Step 5: Alargar o `implements`**

Substituir a linha do `implements` por:

```ts
export abstract class BaseFirebaseDAO<T extends { id: string }>
  implements Pick<
    IBaseRepository<T>,
    | 'getAll'
    | 'getById'
    | 'getAllByField'
    | 'getOneByField'
    | 'count'
    | 'create'
    | 'update'
    | 'delete'
  >
{
```

- [ ] **Step 6: Correr — tem de passar**

```bash
npm run test -- src/modules/Api/firebase/__tests__/baseFirebaseDao.write.test.ts
```

Expected: `10 passed`.

- [ ] **Step 7: Verificar tipos e commitar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
git add src/modules/Api/firebase/BaseFirebaseDAO.ts src/modules/Api/firebase/__tests__/baseFirebaseDao.write.test.ts
git commit -m "feat: BaseFirebaseDAO com escrita, read-back e campos imutaveis"
```

---

## Task 8: `BaseFirebaseDAO` — realtime

**Files:**

- Modify: `src/modules/Api/firebase/BaseFirebaseDAO.ts`
- Test: `src/modules/Api/firebase/__tests__/baseFirebaseDao.realtime.test.ts`

**Interfaces:**

- Consumes: tudo o que as Tasks 6 e 7 produziram.
- Produces: `listenById`, `listenAll`, `listenAllByField`. `BaseFirebaseDAO` passa a `implements IBaseRepository<T>` sem `Pick`.

- [ ] **Step 1: Escrever os testes de realtime**

Create `src/modules/Api/firebase/__tests__/baseFirebaseDao.realtime.test.ts`:

```ts
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi
} from 'vitest'
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { BaseFirebaseDAO } =
  await import('@/modules/Api/firebase/BaseFirebaseDAO')
const { VehicleEntity, vehicleConverter } =
  await import('@/core/entities/Vehicle')

const COLLECTION = 'test_vehicles'

class TestDAO extends BaseFirebaseDAO<InstanceType<typeof VehicleEntity>> {
  constructor() {
    super(COLLECTION, vehicleConverter, 'veh', 'plate')
  }
}

/** Expõe o helper protegido para se poderem testar as duas ramificações.
 *  Um erro real de stream não é accionável a partir deste repo — dependeria
 *  das Security Rules — e `doc(ref, '')` rebenta antes do `onSnapshot`. */
class ErrorProbeDAO extends BaseFirebaseDAO<InstanceType<typeof VehicleEntity>> {
  constructor() {
    super(COLLECTION, vehicleConverter, 'veh', 'plate')
  }

  probe(op: string, err: unknown, onError?: (e: Error) => void): void {
    this.onListenError(op, err, onError)
  }
}

const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

/** Espera até `predicate` ser verdadeiro ou rebentar por timeout. */
async function waitFor(predicate: () => boolean, timeoutMs = 5000) {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs)
      throw new Error('timeout à espera do snapshot')
    await new Promise(r => setTimeout(r, 25))
  }
}

describe('BaseFirebaseDAO — realtime', () => {
  let dao: TestDAO
  let probe: ErrorProbeDAO
  const unsubs: Array<() => void> = []

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new TestDAO()
    probe = new ErrorProbeDAO()
  })

  afterEach(() => {
    unsubs.splice(0).forEach(u => u())
  })

  it('listenById emite o estado inicial e cada alteração', async () => {
    await seed('veh-a', {
      plate: 'aaa',
      status: 'under_analysis',
      created_at: ts('2026-01-01')
    })

    const seen: Array<string | undefined> = []
    unsubs.push(dao.listenById('veh-a', v => seen.push(v?.status)))

    await waitFor(() => seen.length === 1)
    await updateDoc(doc(testDb, `${COLLECTION}/veh-a`), { status: 'validated' })
    await waitFor(() => seen.length === 2)

    expect(seen).toEqual(['under_analysis', 'validated'])
  })

  it('listenById emite null quando o documento é apagado', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    const seen: Array<unknown> = []
    unsubs.push(dao.listenById('veh-a', v => seen.push(v)))

    await waitFor(() => seen.length === 1)
    await deleteDoc(doc(testDb, `${COLLECTION}/veh-a`))
    await waitFor(() => seen.length === 2)

    expect(seen[1]).toBeNull()
  })

  it('listenAll emite a lista completa a cada alteração', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    const seen: string[][] = []
    unsubs.push(dao.listenAll(list => seen.push(list.map(v => v.id))))

    await waitFor(() => seen.length === 1)
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })
    await waitFor(() => seen.length === 2)

    expect(seen[0]).toEqual(['veh-a'])
    expect(seen[1]).toEqual(['veh-b', 'veh-a'])
  })

  it('listenAll reage a updates E a deletes', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })

    const seen: string[][] = []
    unsubs.push(dao.listenAll(list => seen.push(list.map(v => v.id))))

    await waitFor(() => seen.length === 1)
    await deleteDoc(doc(testDb, `${COLLECTION}/veh-b`))
    await waitFor(() => seen.length === 2)

    expect(seen[1]).toEqual(['veh-a'])
  })

  it('listenAll aplica o limite', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })
    await seed('veh-c', { plate: 'ccc', created_at: ts('2026-03-01') })

    const seen: string[][] = []
    unsubs.push(
      dao.listenAll(list => seen.push(list.map(v => v.id)), undefined, {
        limit: 2
      })
    )

    await waitFor(() => seen.length === 1)

    expect(seen[0]).toEqual(['veh-c', 'veh-b'])
  })

  it('listenAllByField filtra pelo campo', async () => {
    await seed('veh-a', {
      plate: 'aaa',
      user_id: 'usr-1',
      created_at: ts('2026-01-01')
    })
    await seed('veh-b', {
      plate: 'bbb',
      user_id: 'usr-2',
      created_at: ts('2026-02-01')
    })

    const seen: string[][] = []
    unsubs.push(
      dao.listenAllByField('user_id', 'usr-1', list =>
        seen.push(list.map(v => v.id))
      )
    )

    await waitFor(() => seen.length === 1)

    expect(seen[0]).toEqual(['veh-a'])
  })

  it('onListenError chama o onError quando existe, sem escrever na consola', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const received: Error[] = []
    try {
      probe.probe('listenAll', { code: 'firestore/permission-denied' }, e =>
        received.push(e)
      )
      expect(received).toHaveLength(1)
      expect((received[0] as { code?: string }).code).toBe('permission-denied')
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })

  it('onListenError regista na consola quando não há onError', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      probe.probe('listenAll', { code: 'firestore/permission-denied' })

      // Sem isto o erro desaparecia por completo e o listener morria em
      // silêncio — a UI apenas deixava de actualizar.
      expect(spy).toHaveBeenCalledTimes(1)
      expect(String(spy.mock.calls[0][0])).toContain('[test_vehicles.listenAll]')
    } finally {
      spy.mockRestore()
    }
  })

  it('o unsubscribe pára de emitir', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    const seen: string[][] = []
    const unsubscribe = dao.listenAll(list => seen.push(list.map(v => v.id)))

    await waitFor(() => seen.length === 1)
    unsubscribe()

    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })
    await new Promise(r => setTimeout(r, 500))

    expect(seen).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Correr — tem de falhar**

```bash
npm run test -- src/modules/Api/firebase/__tests__/baseFirebaseDao.realtime.test.ts
```

Expected: FAIL — `dao.listenById is not a function`.

- [ ] **Step 3: Acrescentar `onSnapshot` aos imports**

Em `src/modules/Api/firebase/BaseFirebaseDAO.ts`, acrescentar `onSnapshot` ao import de valores de `firebase/firestore`, e `Query` ao import de tipos.

- [ ] **Step 4: Acrescentar os métodos de realtime à classe**

Colar dentro da classe, a seguir a `delete()`:

```ts
  /**
   * Um listener sem `onError` morrer em silêncio é caríssimo de diagnosticar:
   * a UI só pára de actualizar. Sem handler, pelo menos regista.
   */
  protected onListenError(
    op: string,
    err: unknown,
    onError?: (err: Error) => void
  ): void {
    const appError = toAppError(err, `[${this.path}.${op}]`)
    if (onError) {
      onError(appError)
      return
    }
    console.error(appError.message, appError)
  }

  listenById(
    id: string,
    onUpdate: (data: T | null) => void,
    onError?: (err: Error) => void
  ): () => void {
    return onSnapshot(
      doc(this.ref, id),
      snap => onUpdate(snap.exists() ? snap.data() : null),
      err => this.onListenError('listenById', err, onError)
    )
  }

  listenAll(
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options: ListenOptions<T> = {}
  ): () => void {
    // Limite por omissão: um listener sem travão lê a colecção inteira a cada
    // alteração e paga 1 leitura por documento.
    const limitValue = options.limit ?? 50
    const q: Query<T> = query(
      this.ref,
      ...this.constraints(options),
      fbLimit(limitValue)
    )

    return onSnapshot(
      q,
      // Os documentos vêm no próprio snapshot — nunca re-fazer a query aqui.
      snap => onUpdate(snap.docs.map(d => d.data())),
      err => this.onListenError('listenAll', err, onError)
    )
  }

  listenAllByField(
    field: keyof T,
    value: unknown,
    onUpdate: (data: T[]) => void,
    onError?: (err: Error) => void,
    options: Omit<ListenOptions<T>, 'filters'> = {}
  ): () => void {
    return this.listenAll(onUpdate, onError, {
      ...options,
      filters: { [field]: value } as Partial<T>
    })
  }
```

- [ ] **Step 5: Fechar o `implements`**

Substituir o bloco `implements Pick<...>` por:

```ts
export abstract class BaseFirebaseDAO<T extends { id: string }>
  implements IBaseRepository<T>
{
```

- [ ] **Step 6: Correr — tem de passar**

```bash
npm run test -- src/modules/Api/firebase/__tests__/baseFirebaseDao.realtime.test.ts
```

Expected: `9 passed`.

- [ ] **Step 7: Verificar tipos e commitar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
git add src/modules/Api/firebase/BaseFirebaseDAO.ts src/modules/Api/firebase/__tests__/baseFirebaseDao.realtime.test.ts
git commit -m "feat: BaseFirebaseDAO com realtime e IBaseRepository completo"
```

---

## Task 9: Migrar o `FirebaseVehicleDAO`

O momento da verdade: 196 linhas passam a 12, e a caracterização da Task 2 é reescrita para o comportamento novo.

**Files:**

- Modify: `src/core/interfaces/IVehicleRepository.ts`
- Modify: `src/modules/Api/firebase/vehicle.dao.ts`
- Delete: `src/modules/Api/firebase/__tests__/vehicle.dao.legacy.test.ts`
- Create: `src/modules/Api/firebase/__tests__/vehicle.dao.test.ts`

**Interfaces:**

- Consumes: `BaseFirebaseDAO` (Tasks 6–8), `vehicleConverter` (Task 5), `IBaseRepository` (Task 4).
- Produces: `FirebaseVehicleDAO extends BaseFirebaseDAO<VehicleEntity> implements IVehicleRepository`, com a assinatura nova (`getAll(options?)`). A Task 11 consome-a via `ApiRepository.vehicles`.

⚠️ Esta task **quebra** `src/services/vehicle.service.ts`, que chama `getAll(limit, offset, searchTerm, filters)`. É esperado. A Task 11 substitui esse service; para manter o `tsc` verde no intervalo, o Step 5 adapta o service com uma chamada equivalente.

- [ ] **Step 1: Reduzir o port**

Substituir todo o conteúdo de `src/core/interfaces/IVehicleRepository.ts` por:

```ts
// core/interfaces/IVehicleRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { VehicleEntity } from '../entities/Vehicle'

export interface IVehicleRepository extends IBaseRepository<VehicleEntity> {}
```

- [ ] **Step 2: Reescrever o DAO**

Substituir todo o conteúdo de `src/modules/Api/firebase/vehicle.dao.ts` por:

```ts
// modules/Api/firebase/vehicle.dao.ts
import type { IVehicleRepository } from '@/core/interfaces/IVehicleRepository'
import { VehicleEntity, vehicleConverter } from '@/core/entities/Vehicle'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseVehicleDAO
  extends BaseFirebaseDAO<VehicleEntity>
  implements IVehicleRepository
{
  constructor() {
    // O 4º argumento é o campo de prefix-search. `plate` só funciona se as
    // matrículas estiverem gravadas em minúsculas — ver o teste de pesquisa.
    super(firebaseCollections.vehicles.root, vehicleConverter, 'veh', 'plate')
  }
}
```

- [ ] **Step 3: Apagar a caracterização do legado**

```bash
git rm src/modules/Api/firebase/__tests__/vehicle.dao.legacy.test.ts
```

- [ ] **Step 4: Escrever os testes do DAO novo**

Create `src/modules/Api/firebase/__tests__/vehicle.dao.test.ts`. São os mesmos cenários da Task 2, agora com o comportamento **corrigido** — repare nos dois últimos, que invertem os bugs documentados.

```ts
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseVehicleDAO } =
  await import('@/modules/Api/firebase/vehicle.dao')

const COLLECTION = 'vehicles'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseVehicleDAO', () => {
  let dao: InstanceType<typeof FirebaseVehicleDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseVehicleDAO()
  })

  it('aponta para a colecção vehicles', async () => {
    await seed('veh-a', { plate: 'ld-11-11-aa', created_at: ts('2026-01-01') })

    expect((await dao.getById('veh-a'))?.plate).toBe('ld-11-11-aa')
  })

  it('getAll ordena por created_at desc (igual ao legado)', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-06-01') })

    expect((await dao.getAll()).data.map(v => v.id)).toEqual(['veh-b', 'veh-a'])
  })

  it('getById devolve null quando não existe (igual ao legado)', async () => {
    expect(await dao.getById('nao-existe')).toBeNull()
  })

  it('getOneByField encontra por matrícula exacta (igual ao legado)', async () => {
    await seed('veh-a', { plate: 'ld-11-11-aa', created_at: ts('2026-01-01') })

    expect((await dao.getOneByField('plate', 'ld-11-11-aa'))?.id).toBe('veh-a')
  })

  it('create gera id com prefixo veh- (igual ao legado)', async () => {
    const created = await dao.create({
      user_id: 'usr-1',
      type: 'car',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'preto',
      plate: 'ld-33-33-cc',
      status: 'under_analysis'
    } as never)

    expect(created.id).toMatch(/^veh-/)
    expect((await dao.getById(created.id))?.plate).toBe('ld-33-33-cc')
  })

  it('update e delete funcionam (igual ao legado)', async () => {
    await seed('veh-a', {
      plate: 'aaa',
      status: 'under_analysis',
      created_at: ts('2026-01-01')
    })

    expect((await dao.update('veh-a', { status: 'validated' })).status).toBe(
      'validated'
    )

    await dao.delete('veh-a')
    expect(await dao.getById('veh-a')).toBeNull()
  })

  // ─────────── Os dois bugs da Task 2, agora corrigidos ───────────

  it('CORRIGIDO: created_at volta como Date, não como Timestamp', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    const found = await dao.getById('veh-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
  })

  it('CORRIGIDO: a pesquisa por matrícula encontra o veículo', async () => {
    await seed('veh-a', { plate: 'ld-11-11-aa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bg-22-22-bb', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ searchTerm: 'LD-11' })

    expect(res.data.map(v => v.id)).toEqual(['veh-a'])
  })
})
```

- [ ] **Step 5: Adaptar `vehicle.service.ts` à assinatura nova (temporário)**

O service é apagado na Task 11, mas até lá tem de compilar. Substituir **apenas** os corpos de `getAll` e `getAllByField`:

```ts
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<VehicleEntity>
  ): Promise<ListResponseType<VehicleEntity[]>> {
    void offset // paginação por offset foi substituída por cursor
    try {
      return await vehicleRepository.getAll({ limit, searchTerm, filters })
    } catch (error: any) {
      console.error('Erro ao buscar veículos:', error)
      throw new Error(error.message || 'Erro ao buscar veículos')
    }
  }
```

```ts
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<VehicleEntity[]>> {
    void offset
    try {
      const { data, pagination } = await vehicleRepository.getAllByField(
        field as keyof VehicleEntity,
        value,
        { limit }
      )
      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar veículo pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar veículo')
    }
  }
```

E substituir os corpos de `getOneByField` e `create`:

```ts
  async getOneByField(
    field: string,
    value: any
  ): Promise<VehicleEntity | null> {
    try {
      return await vehicleRepository.getOneByField(
        field as keyof VehicleEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar vehicle por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar vehicle')
    }
  }

  async create(vehicle: Omit<VehicleEntity, 'id'>): Promise<VehicleEntity> {
    try {
      return await vehicleRepository.create(vehicle as never)
    } catch (error: any) {
      console.error('Erro ao criar veículo:', error)
      throw new Error(error.message || 'Erro ao criar veículo')
    }
  }
```

- [ ] **Step 6: Correr — tem de passar**

```bash
npm run test -- src/modules/Api/firebase/__tests__/vehicle.dao.test.ts
```

Expected: `8 passed`.

- [ ] **Step 7: Verificar tipos, toda a suite, e commitar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
git add -A src/core/interfaces/IVehicleRepository.ts src/modules/Api/firebase src/services/vehicle.service.ts
git commit -m "refactor: FirebaseVehicleDAO passa a estender BaseFirebaseDAO"
```

---

## Task 10: `ApiFactory` com getters lazy

**Files:**

- Modify: `src/modules/Api/index.ts`
- Test: `src/modules/Api/__tests__/apiFactory.test.ts`

**Interfaces:**

- Consumes: `FirebaseVehicleDAO` (Task 9), `IVehicleRepository`.
- Produces: `export const ApiRepository` com o getter `vehicles: IVehicleRepository`. A Task 11 consome `ApiRepository.vehicles`.

⚠️ **Todos os exports existentes** (`userRepository`, `vehicleRepository`, …) **mantêm-se intactos** — 19 services dependem deles.

- [ ] **Step 1: Escrever o teste**

Create `src/modules/Api/__tests__/apiFactory.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { ApiRepository } = await import('@/modules/Api')
const { FirebaseVehicleDAO } =
  await import('@/modules/Api/firebase/vehicle.dao')

describe('ApiFactory', () => {
  it('devolve a implementação Firebase de vehicles', () => {
    expect(ApiRepository.vehicles).toBeInstanceOf(FirebaseVehicleDAO)
  })

  it('memoiza: dois acessos devolvem a mesma instância', () => {
    expect(ApiRepository.vehicles).toBe(ApiRepository.vehicles)
  })
})
```

- [ ] **Step 2: Correr — tem de falhar**

```bash
npm run test -- src/modules/Api/__tests__/apiFactory.test.ts
```

Expected: FAIL — `ApiRepository` não é exportado.

- [ ] **Step 3: Acrescentar o `ApiFactory` ao fim de `src/modules/Api/index.ts`**

Não remover nada do ficheiro. Acrescentar no fim:

```ts
// ─────────────── ApiFactory (padrão novo — ver docs/superpowers/plans) ───────────────
// Instancia à primeira utilização e memoiza. Substitui gradualmente os
// exports acima, que criam as ~20 instâncias no momento do import.

class ApiFactory {
  private cache = new Map<string, unknown>()

  private resolve<T>(key: string, make: () => T): T {
    if (!this.cache.has(key)) this.cache.set(key, make())
    return this.cache.get(key) as T
  }

  get vehicles(): IVehicleRepository {
    return this.resolve('vehicles', () => new FirebaseVehicleDAO())
  }
}

export const ApiRepository = new ApiFactory()
```

`IVehicleRepository` e `FirebaseVehicleDAO` já estão importados no topo do ficheiro — confirmar antes de acrescentar imports duplicados (`noUnusedLocals` não apanha duplicados, mas o ESLint apanha).

- [ ] **Step 4: Correr — tem de passar**

```bash
npm run test -- src/modules/Api/__tests__/apiFactory.test.ts
```

Expected: `2 passed`.

- [ ] **Step 5: Verificar tipos e commitar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
git add src/modules/Api/index.ts src/modules/Api/__tests__
git commit -m "feat: adicionar ApiFactory com getters lazy"
```

---

## Task 11: `BaseUseCase` + `vehicleUseCase`

**Files:**

- Create: `src/domain/usecases/BaseUseCase.ts`
- Create: `src/domain/usecases/vehicleUseCase.ts`
- Test: `src/domain/usecases/__tests__/vehicleUseCase.test.ts`

**Interfaces:**

- Consumes: `ApiRepository.vehicles` (Task 10), `AppError`/`toAppError` (Task 3), `QueryOptions` (Task 4).
- Produces:
  - `abstract class BaseUseCase` com `protected abstract readonly context: string` e `protected run<T>(op: string, fn: () => Promise<T>): Promise<T>`
  - `export const vehicleUseCase` com `executeGetAll(options?)`, `executeGetById(id)`, `executeGetAllByField(field, value, options?)`, `executeGetOneByField(field, value)`, `executeCreate(data)`, `executeUpdate(id, data)`, `executeDelete(id)`.
    A Task 12 consome estes nomes.

⚠️ **`erasableSyntaxOnly`**: `BaseUseCase` não pode usar parameter properties.

- [ ] **Step 1: Escrever os testes**

Create `src/domain/usecases/__tests__/vehicleUseCase.test.ts`:

```ts
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { vehicleUseCase } = await import('@/domain/usecases/vehicleUseCase')
const { AppError } = await import('@/domain/errors/AppError')

const COLLECTION = 'vehicles'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('vehicleUseCase', () => {
  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
  })

  it('executeGetAll delega no repositório', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    expect((await vehicleUseCase.executeGetAll()).data.map(v => v.id)).toEqual([
      'veh-a'
    ])
  })

  it('executeGetById devolve null quando não existe', async () => {
    expect(await vehicleUseCase.executeGetById('nao-existe')).toBeNull()
  })

  it('executeCreate rejeita matrícula vazia com AppError', async () => {
    await expect(
      vehicleUseCase.executeCreate({
        user_id: 'usr-1',
        type: 'car',
        brand: 'Toyota',
        model: 'Corolla',
        color: 'preto',
        plate: '   ',
        status: 'under_analysis'
      } as never)
    ).rejects.toBeInstanceOf(AppError)
  })

  it('executeCreate normaliza a matrícula para minúsculas', async () => {
    const created = await vehicleUseCase.executeCreate({
      user_id: 'usr-1',
      type: 'car',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'preto',
      plate: 'LD-11-11-AA',
      status: 'under_analysis'
    } as never)

    expect(created.plate).toBe('ld-11-11-aa')
  })

  it('os erros saem sempre como AppError com contexto', async () => {
    await expect(
      vehicleUseCase.executeUpdate('nao-existe', { status: 'validated' })
    ).rejects.toBeInstanceOf(AppError)
  })
})
```

- [ ] **Step 2: Correr — tem de falhar**

```bash
npm run test -- src/domain/usecases/__tests__/vehicleUseCase.test.ts
```

Expected: FAIL — módulo `@/domain/usecases/vehicleUseCase` não existe.

- [ ] **Step 3: Criar `src/domain/usecases/BaseUseCase.ts`**

```ts
import { toAppError } from '@/domain/errors/AppError'

/**
 * Substitui o try/catch + console.error copiado em cada método de cada
 * service. O usecase concreto só escreve a regra de negócio.
 */
export abstract class BaseUseCase {
  protected abstract readonly context: string

  protected async run<T>(op: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (err) {
      throw toAppError(err, `[${this.context}.${op}]`)
    }
  }
}
```

- [ ] **Step 4: Criar `src/domain/usecases/vehicleUseCase.ts`**

```ts
import { ApiRepository } from '@/modules/Api'
import { BaseUseCase } from './BaseUseCase'
import { AppError } from '@/domain/errors/AppError'
import type { VehicleEntity } from '@/core/entities/Vehicle'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'
import type { ListResponseType } from '@/interfaces/IApiResponse'

type NewVehicle = Omit<VehicleEntity, 'id' | 'created_at' | 'updated_at'>

export class VehicleUseCase extends BaseUseCase {
  protected readonly context = 'VehicleUseCase'

  private get repository() {
    return ApiRepository.vehicles
  }

  executeGetAll(
    options?: QueryOptions<VehicleEntity>
  ): Promise<ListResponseType<VehicleEntity[]>> {
    return this.run('getAll', () => this.repository.getAll(options))
  }

  executeGetById(id: string): Promise<VehicleEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetAllByField(
    field: keyof VehicleEntity,
    value: unknown,
    options?: Omit<QueryOptions<VehicleEntity>, 'filters'>
  ): Promise<ListResponseType<VehicleEntity[]>> {
    return this.run('getAllByField', () =>
      this.repository.getAllByField(field, value, options)
    )
  }

  executeGetOneByField(
    field: keyof VehicleEntity,
    value: unknown
  ): Promise<VehicleEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeCreate(data: NewVehicle): Promise<VehicleEntity> {
    return this.run('create', async () => {
      const plate = data.plate?.trim().toLowerCase() ?? ''
      if (!plate) {
        throw new AppError('failed-precondition', 'A matrícula é obrigatória.')
      }
      // Normalizar em minúsculas é o que faz a pesquisa por prefixo funcionar.
      return this.repository.create({ ...data, plate })
    })
  }

  executeUpdate(
    id: string,
    data: Partial<VehicleEntity>
  ): Promise<VehicleEntity> {
    return this.run('update', () => {
      const patch = data.plate
        ? { ...data, plate: data.plate.trim().toLowerCase() }
        : data
      return this.repository.update(id, patch)
    })
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }
}

export const vehicleUseCase = new VehicleUseCase()
```

- [ ] **Step 5: Correr — tem de passar**

```bash
npm run test -- src/domain/usecases/__tests__/vehicleUseCase.test.ts
```

Expected: `5 passed`.

- [ ] **Step 6: Verificar tipos e commitar**

```bash
npx tsc -b && echo "tsc ok"
npm run test
git add src/domain/usecases
git commit -m "feat: adicionar BaseUseCase e vehicleUseCase"
```

---

## Task 12: Migrar o `VehicleViewModel` e fechar o slice

**Files:**

- Modify: `src/viewModels/VehicleViewModel.ts`
- Delete: `src/services/vehicle.service.ts`
- Verify: `src/pages/main/Drivers/DriverDetails.tsx` (ler; só alterar se o `tsc` acusar)

**Interfaces:**

- Consumes: `vehicleUseCase` (Task 11).
- Produces: `useVehiclesViewModel` mantém **exactamente** a mesma API pública: `{ vehicles, pagination, loading, error, refresh, fetchAllVehiclesByField, fetchOneVehicleByField, createVehicle, updateVehicle, deleteVehicle, fetchVehicleById }`. `DriverDetails.tsx` usa `fetchAllVehiclesByField` e `updateVehicle` e não pode notar a diferença.

- [ ] **Step 1: Ler o único consumidor**

```bash
sed -n '60,80p;110,175p' src/pages/main/Drivers/DriverDetails.tsx
```

Confirmar que só usa `fetchAllVehiclesByField` e `updateVehicle`, e anotar como os chama.

- [ ] **Step 2: Reescrever o ViewModel**

Substituir todo o conteúdo de `src/viewModels/VehicleViewModel.ts` por:

```ts
// viewModels/VehicleViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehicleUseCase } from '@/domain/usecases/vehicleUseCase'
import type { VehicleEntity } from '@/core/entities/Vehicle'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { withAudit } from '@/services/audit.service'

type NewVehicle = Omit<VehicleEntity, 'id' | 'created_at' | 'updated_at'>

/** Query-key factory — invalidações precisas em vez de arrasar a raiz. */
export const VEHICLE_KEYS = {
  all: ['vehicles'] as const,
  lists: () => [...VEHICLE_KEYS.all, 'list'] as const,
  list: (options: unknown) => [...VEHICLE_KEYS.lists(), { options }] as const,
  details: () => [...VEHICLE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VEHICLE_KEYS.details(), id] as const
}

export function useVehiclesViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<VehicleEntity>
) {
  const queryClient = useQueryClient()

  // `offset` mantém-se na assinatura por compatibilidade com os chamadores,
  // mas a paginação passou a ser por cursor (ver QueryOptions.after).
  void offset

  const options: QueryOptions<VehicleEntity> = { limit, searchTerm, filters }

  const {
    data: vehiclesResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<VehicleEntity[]>>({
    queryKey: VEHICLE_KEYS.list(options),
    queryFn: () => vehicleUseCase.executeGetAll(options),
    staleTime: 1000 * 60
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: VEHICLE_KEYS.all })

  const fetchAllVehiclesByField = async (
    field: string,
    value: any,
    limitValue?: number
  ) => {
    try {
      return await vehicleUseCase.executeGetAllByField(
        field as keyof VehicleEntity,
        value,
        { limit: limitValue }
      )
    } catch (err) {
      console.error('Erro ao buscar veículos por campo:', err)
      return null
    }
  }

  const createVehicle = useMutation({
    mutationFn: (vehicle: NewVehicle) =>
      withAudit(() => vehicleUseCase.executeCreate(vehicle), {
        action: 'create',
        module: 'vehicles',
        description: `Criou novo veículo: ${vehicle.plate}`,
        target_type: 'vehicle',
        target_label: vehicle.plate,
        new_data: vehicle
      }),
    onSuccess: invalidate
  })

  const updateVehicle = useMutation({
    mutationFn: async ({
      id,
      vehicle
    }: {
      id: string
      vehicle: Partial<VehicleEntity>
    }) => {
      const previous_data = await vehicleUseCase
        .executeGetById(id)
        .catch(() => null)

      return withAudit(() => vehicleUseCase.executeUpdate(id, vehicle), {
        action: 'update',
        module: 'vehicles',
        description: `Atualizou veículo - ID: ${id}`,
        target_id: id,
        target_type: 'vehicle',
        previous_data: previous_data || undefined,
        new_data: vehicle
      })
    },
    onSuccess: invalidate
  })

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await vehicleUseCase
        .executeGetById(id)
        .catch(() => null)

      return withAudit(() => vehicleUseCase.executeDelete(id), {
        action: 'delete',
        module: 'vehicles',
        description: `Excluiu veículo - ID: ${id}`,
        target_id: id,
        target_type: 'vehicle',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: invalidate
  })

  const fetchVehicleById = async (id: string) => {
    try {
      return await vehicleUseCase.executeGetById(id)
    } catch (err) {
      console.error('Erro ao buscar veículo:', err)
      return null
    }
  }

  const fetchOneVehicleByField = async (
    field: keyof VehicleEntity,
    value: string
  ) => {
    try {
      return await vehicleUseCase.executeGetOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar veículo por campo:', err)
      return null
    }
  }

  return {
    vehicles: vehiclesResponse?.data ?? [],
    pagination: vehiclesResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllVehiclesByField,
    fetchOneVehicleByField,

    createVehicle,
    updateVehicle,
    deleteVehicle,
    fetchVehicleById
  }
}
```

- [ ] **Step 3: Apagar o service**

```bash
git rm src/services/vehicle.service.ts
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc -b
echo "exit=$?"
```

Expected: `exit=0`.

Se o `tsc` acusar aqui, será por `fetchAllVehiclesByField` ter perdido o 4º parâmetro `offset`: ajustar a **chamada** em `DriverDetails.tsx`, não a assinatura do ViewModel.

- [ ] **Step 5: Correr toda a suite**

```bash
npm run test
```

Expected: todos os ficheiros passam. Total esperado: 8 ficheiros de teste.

- [ ] **Step 6: Confirmar que a app compila**

```bash
npm run build
echo "exit=$?"
```

Expected: `exit=0`.

- [ ] **Step 7: Smoke manual (o único passo que exige o browser)**

```bash
npm run dev
```

Abrir o painel, entrar em **Motoristas → detalhe de um motorista**, e confirmar:

1. A lista de veículos do motorista aparece (usa `fetchAllVehiclesByField`).
2. Definir um veículo como principal grava e a lista actualiza (usa `updateVehicle`).
3. As datas dos veículos aparecem formatadas, sem `Invalid Date` nem erro na consola.

Registar o resultado dos 3 pontos no relatório da task.

- [ ] **Step 8: Commit**

```bash
git add -A src/viewModels/VehicleViewModel.ts src/services src/pages
git commit -m "refactor: VehicleViewModel passa a usar vehicleUseCase e remove vehicle.service"
```

---

## Fecho

Ao fim da Task 12:

- `vehicle` atravessa o padrão completo: Doc → Entity+Converter → port → `BaseFirebaseDAO` → ApiFactory → UseCase → ViewModel.
- 8 ficheiros de teste, todos verdes, incluindo contra o emulador.
- Dois bugs reais corrigidos (Timestamp na UI, pesquisa de matrícula).
- `vehicle.dao.ts` passou de 196 para 12 linhas.
- Os restantes 19 DAOs continuam a funcionar, intocados.

O passo seguinte — replicar pelas outras 19 entidades — é outro plano, e é aí que `BaseFirebaseDAO` paga o investimento. Não o começar antes de o smoke manual da Task 12 passar.
