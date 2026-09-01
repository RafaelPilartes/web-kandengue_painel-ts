# Services → UseCases: a Fundação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Preparar o terreno para converter os 19 services em usecases — completar o factory, centralizar o helper duplicado 14 vezes, e converter os três primeiros como prova.

**Architecture:** O `ApiRepository` passa a expor os 17 DAOs migrados. O `BaseUseCase` ganha a tradução de `offset` para cursor que hoje está copiada em catorze ficheiros.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

O painel tem os 17 DAOs migrados para o motor, mas a camada acima ficou por fazer: **20 services** onde o documento de arquitectura e as duas apps RN usam **usecases**.

Não foi decisão — foi omissão. O piloto do `vehicle` fez a fatia vertical completa (DAO, converter, factory, usecase, e o `vehicle.service.ts` desapareceu), mas os cinco lotes seguintes replicaram só a metade de baixo. Cada plano dizia *"nenhum ViewModel pode ser tocado"*, e renomear a camada obriga a mexer nos 24 ficheiros que importam de `@/services`. A restrição manteve os lotes revisíveis, mas ninguém registou a dívida.

O resultado é o painel a ser o único repo desalinhado — as apps têm 20 e 18 usecases, zero services — e inconsistente consigo próprio, com um usecase no meio de vinte services.

### O que a análise encontrou

**O factory está quase vazio.** O `ApiRepository` expõe **2** entradas (`vehicles`, `missionProgress`) para 17 DAOs. Tudo o resto vem do barrel `@/modules/Api`, que instancia os 20 repositórios de forma **ansiosa**, no import. O factory existe precisamente para os instanciar só quando são usados.

**O `offsetToCursor` está copiado em 14 services.** Comparei três cópias: diferem **apenas** no tipo da entidade e no nome do repositório — a lógica é idêntica. É duplicação mecânica, não divergência, portanto centralizar é seguro.

**O `finance.service.ts` importa DAOs directamente** (`@/modules/Api/firebase/ride.dao`), saltando barrel e factory. Terceira forma de obter um repositório no mesmo código.

**O `withAudit` não é um usecase.** Vive no `audit.service.ts`, tem **57 consumidores** nos ViewModels, e é uma preocupação transversal — embrulha qualquer operação para a registar. Não se converte; fica onde está.

## Global Constraints

- **Não mudar comportamento.** Esta fundação e as três conversões são estruturais; os 181 testes existentes são a rede.
- **Não tocar no `withAudit`** nem no `audit.service.ts` — são transversais e vêm depois, se vierem.
- **Um usecase por entidade**, com métodos `executeXxx`, seguindo `vehicleUseCase`.
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **181**. Emulador na porta **8090**.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## O modelo, que já existe

`src/domain/usecases/vehicleUseCase.ts` é a referência. Repara em três coisas:

```ts
export class VehicleUseCase extends BaseUseCase {
  protected readonly context = 'VehicleUseCase'

  private get repository() {
    return ApiRepository.vehicles      // ← factory, não barrel
  }

  executeCreate(data: NewVehicle): Promise<VehicleEntity> {
    return this.run('create', async () => {
      const plate = data.plate?.trim().toLowerCase() ?? ''
      if (!plate) {
        throw new AppError('failed-precondition', 'A matrícula é obrigatória.')
      }
      return this.repository.create({ ...data, plate })
    })
  }
}

export const vehicleUseCase = new VehicleUseCase()
```

O `run()` do `BaseUseCase` substitui o `try/catch` + `console.error` que cada método de cada service repete. E o usecase **guarda regras de negócio** — a normalização da matrícula é o que faz a pesquisa por prefixo funcionar.

---

## Task 1: Completar o factory

**Files:**
- Modify: `src/modules/Api/factory.ts`

**Interfaces:**
- Produces: `ApiRepository.<entidade>` para os 17 DAOs migrados. As Tasks 3–5 consomem-no.

- [ ] **Step 1: Ver o que existe e o que falta**

```bash
cat src/modules/Api/factory.ts
grep -cE "^export const" src/modules/Api/index.ts
ls src/modules/Api/firebase/*.dao.ts
```

- [ ] **Step 2: Acrescentar as entradas em falta**

Seguir exactamente o padrão já lá:

```ts
  private _vehicles?: IVehicleRepository
  get vehicles(): IVehicleRepository {
    return (this._vehicles ??= new FirebaseVehicleDAO())
  }
```

Uma entrada por DAO migrado. **Os três não migrados** — `appConfig`, `file`, `promotion` — também entram, para o factory ser a via única; usam os seus tipos actuais.

O `??=` é o que torna a instanciação preguiçosa: o DAO só nasce quando alguém lhe toca.

- [ ] **Step 3: Verificar**

```bash
npx tsc -b && npm run test
```

Expected: 181 testes. Nada consome as entradas novas ainda.

- [ ] **Step 4: Commit**

```bash
git add src/modules/Api/factory.ts
git commit -m "feat: factory expoe todos os repositorios, nao so dois"
```

---

## Task 2: O `offsetToCursor` no `BaseUseCase`

**Files:**
- Modify: `src/domain/usecases/BaseUseCase.ts`
- Create: `src/domain/usecases/__tests__/baseUseCase.test.ts`

- [ ] **Step 1: Ver uma das 14 cópias**

```bash
sed -n '/function offsetToCursor/,/^}/p' src/services/driver.service.ts
```

- [ ] **Step 2: Uma versão genérica**

Acrescentar ao `BaseUseCase` um helper protegido que recebe o repositório como argumento, em vez de o fechar por closure:

```ts
  /**
   * Traduz `offset` (paginação por registos saltados, da API antiga) para o
   * cursor por `id` que o motor espera.
   *
   * Estava copiado em catorze services, idêntico em todos menos no tipo da
   * entidade. O custo é o mesmo do código antigo: uma query de `offset`
   * documentos para descobrir onde começar.
   */
  protected async offsetToCursor<T extends { id: string }>(
    repository: { getAll(options: QueryOptions<T>): Promise<ListResponseType<T[]>> },
    base: Omit<QueryOptions<T>, 'limit' | 'after'>,
    offset: number
  ): Promise<string | undefined> {
    if (!offset) return undefined
    const skipped = await repository.getAll({ ...base, limit: offset })
    return skipped.data[skipped.data.length - 1]?.id
  }
```

Confirmar os nomes dos tipos importados (`QueryOptions`, `ListResponseType`) antes de escrever.

- [ ] **Step 3: Testar o helper**

Com um repositório falso (não é preciso emulador para este): `offset` zero devolve `undefined`; `offset` N devolve o ID do N-ésimo; `offset` para lá do fim devolve o último ID existente, e a chamada seguinte com esse cursor devolve vazio.

Esse último caso foi levantado como possível regressão durante o lote 1 e verificou-se **não** ser problema. Vale um teste que o fixe.

- [ ] **Step 4: Verificar e commit**

```bash
npx tsc -b && npm run test
git add src/domain/usecases/BaseUseCase.ts src/domain/usecases/__tests__/baseUseCase.test.ts
git commit -m "feat: BaseUseCase absorve o offsetToCursor duplicado em 14 services"
```

---

## Task 3: `rideRate` — o primeiro, e o mais simples

**Files:**
- Create: `src/domain/usecases/rideRateUseCase.ts`
- Delete: `src/services/rideRate.service.ts`
- Modify: os ViewModels que o consomem

Escolhido por ser pequeno e sem regras de negócio — prova a forma antes dos maiores.

- [ ] **Step 1: Ver o que existe**

```bash
cat src/services/rideRate.service.ts
grep -rn "rideRate.service\|RideRateService" src/
```

- [ ] **Step 2: Escrever o usecase**

Seguir o `vehicleUseCase`. O repositório vem de `ApiRepository`. O `try/catch` de cada método desaparece — o `run()` trata disso.

Se o service tiver `offsetToCursor`, usar o do `BaseUseCase`.

- [ ] **Step 3: Repontar os consumidores e apagar o service**

Trocar os imports nos ViewModels que o usam. **Aqui os ViewModels mudam** — é o ponto desta migração, ao contrário dos cinco lotes de DAOs.

```bash
git rm src/services/rideRate.service.ts
```

- [ ] **Step 4: Verificar e commit**

```bash
npx tsc -b && npm run test && npm run build
git commit -m "refactor: rideRateUseCase substitui rideRate.service"
```

---

## Task 4: `document`

Mesma forma da Task 3. Ler o service, converter, repontar, apagar.

- [ ] **Step 1: Converter e repontar**
- [ ] **Step 2: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: documentUseCase substitui document.service"
```

---

## Task 5: `notification`

Mesma forma. Este tem `offsetToCursor` — é a primeira prova de que o helper centralizado funciona no terreno.

- [ ] **Step 1: Converter usando o helper do `BaseUseCase`**
- [ ] **Step 2: Verificar e commit**

```bash
npx tsc -b && npm run test
git commit -m "refactor: notificationUseCase substitui notification.service"
```

---

## Task 6: Verificação

**Files:** nenhum a modificar.

- [ ] **Step 1: Quantos convertidos**

```bash
ls src/domain/usecases/*UseCase.ts | wc -l
ls src/services/*.service.ts | wc -l
```

Expected: **5** usecases (o `vehicle` mais os quatro novos… na verdade 4: vehicle, rideRate, document, notification), e **17** services.

- [ ] **Step 2: O helper substituiu cópias**

```bash
grep -l "offsetToCursor" src/services/*.service.ts | wc -l
```

Expected: **13** (era 14; o `notification` deixou de ter a sua).

- [ ] **Step 3: Ninguém salta o factory**

```bash
grep -rn "from '@/modules/Api/firebase/" src/domain/usecases/
```

Expected: **sem resultados** — os usecases usam o `ApiRepository`.

- [ ] **Step 4: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 5: Relatório**

Sem commit. Registar quantos consumidores cada conversão obrigou a tocar, e se algum service tinha lógica que não era simples delegação — isso muda o esforço dos lotes seguintes.

---

## Fecho

O factory passa a ser a via única, o helper duplicado catorze vezes vive num sítio, e três services viram usecases.

Sobram dezasseis, e o relatório desta fundação diz quanto custam. O `audit.service.ts` com o seu `withAudit` (57 consumidores) é transversal e fica de fora até haver decisão própria; o `finance.service.ts` agrega dados de dois DAOs e não é usecase de entidade nenhuma.
