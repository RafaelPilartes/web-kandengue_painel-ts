# Services → UseCases: Lote 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Converter `driver` e `ride` — os maiores dos que mapeiam um DAO, e os únicos com efeitos secundários e tempo real.

**Architecture:** Seguem o `vehicleUseCase`, mas cada um traz uma coisa que os lotes anteriores não tinham: o `driver` expõe um listener em tempo real, e o `ride` tem um efeito secundário no `update`.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto

Onze usecases contra onze services, 185 testes. Este lote leva os dois que a fundação assinalou como merecendo leitura cuidada — e a leitura confirmou que merecem, por razões diferentes das que eu supunha.

### O `ride.update` tem um efeito secundário, e é duplicado

Em `ride.service.ts:111-116`:

```ts
if (ride.status === 'completed' && updatedRide.driver?.id) {
  missionService.updateDriverProgress(updatedRide.driver.id).catch(err => {
    console.error('Erro ao atualizar progresso de missões:', err)
  })
}
```

Quando um admin marca uma corrida como concluída, o painel recalcula o progresso das missões do motorista. **O trigger do servidor faz o mesmo** — `on-ride-updated.ts:248` chama `MissionProgressService.updateDriverProgress` na mesma transição de estado.

Portanto, uma corrida concluída pelo painel dispara os dois caminhos. **Verifiquei se isso corrompe: não corrompe.** O `processMissionProgress` do painel recalcula do zero — consulta as corridas concluídas do motorista e deriva a contagem, em vez de incrementar. Correr duas vezes dá o mesmo resultado.

É desperdício, não corrupção. **Portar como está** e registar no relatório. Remover um dos dois caminhos é decisão de arquitectura, não de conversão estrutural — e a escolha errada deixaria o progresso por actualizar.

Nota também que o erro é engolido para a consola: a corrida actualiza-se na mesma se o progresso falhar. Manter essa escolha.

### O `driver` tem tempo real

`driver.service.ts:148` expõe `listenOnlineDrivers`, consumido em `DriverViewModel.ts:212`. Devolve a função de cancelamento da subscrição — o ViewModel usa-a para limpar o listener.

Um usecase pode expor um listener: o `BaseUseCase.run()` é para operações assíncronas que devolvem valor, e um listener não é isso. **Delegar directamente, sem `run()`**, e devolver a função de cancelamento intacta. Se ela se perder, o listener fica pendurado e o painel acumula subscrições.

### O resto é a forma conhecida

`driver` tem `getByEmail` e `softDelete` — a mesma dupla do `users`, já convertido no lote 2. `ride` é CRUD puro além do efeito secundário.

## Global Constraints

- **Não mudar comportamento.** Os 185 testes são a rede.
- **O efeito secundário do `ride.update` tem de sobreviver**, incluindo o erro engolido.
- **A função de cancelamento do `listenOnlineDrivers` tem de chegar ao ViewModel intacta.**
- **Nada de `field: string` nem `as keyof`** — usar `FieldPath<T>` de `@/core/interfaces/IBaseRepository`.
- **O repositório vem do `ApiRepository`**, nunca de `@/modules/Api` nem de `@/modules/Api/firebase/*`.
- **Não tocar no `audit.service.ts` nem no `withAudit`.**
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **185**. Emulador na porta **8090**.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## Task 1: `driver`

**Files:**
- Create: `src/domain/usecases/driverUseCase.ts`
- Delete: `src/services/driver.service.ts`
- Modify: `src/viewModels/DriverViewModel.ts` e outros consumidores

- [ ] **Step 1: Ler antes de converter**

```bash
cat src/services/driver.service.ts
grep -rn "driver.service\|DriverService" src/
sed -n '205,225p' src/viewModels/DriverViewModel.ts
```

- [ ] **Step 2: Converter**

O modelo mais próximo é `src/domain/usecases/userUseCase.ts` — tem a mesma dupla `getByEmail` + `softDelete`.

Para o listener:

```ts
  /**
   * Devolve a função de cancelamento — não passa pelo `run()`, que é para
   * operações que devolvem valor. Perder esta função deixa o listener
   * pendurado e o painel a acumular subscrições.
   */
  executeListenOnlineDrivers(
    onUpdate: (drivers: DriverEntity[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    return this.repository.listenOnlineDrivers(onUpdate, onError)
  }
```

Confirmar a assinatura exacta no DAO antes de escrever — ele foi migrado no lote 3 dos DAOs e manteve este método.

- [ ] **Step 3: Repontar, apagar, verificar**

```bash
git rm src/services/driver.service.ts
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: driverUseCase substitui driver.service"
```

---

## Task 2: `ride`

**Files:**
- Create: `src/domain/usecases/rideUseCase.ts`
- Delete: `src/services/ride.service.ts`
- Modify: os ViewModels que o consomem

- [ ] **Step 1: Ler o `update` com atenção**

```bash
sed -n '105,125p' src/services/ride.service.ts
```

- [ ] **Step 2: Converter, preservando o efeito secundário**

```ts
  executeUpdate(id: string, ride: Partial<RideEntity>): Promise<RideEntity> {
    return this.run('update', async () => {
      const updated = await this.repository.update(id, ride)

      // Recalcula o progresso das missões quando a corrida conclui.
      // O trigger `onRideUpdated` do servidor faz o mesmo — é redundante,
      // mas o cálculo recomeça do zero (não incrementa), portanto correr
      // duas vezes dá o mesmo resultado. O erro é engolido de propósito:
      // a corrida actualiza-se na mesma se o progresso falhar.
      if (ride.status === 'completed' && updated.driver?.id) {
        missionUseCase
          .executeUpdateDriverProgress(updated.driver.id)
          .catch(err => {
            console.error('Erro ao atualizar progresso de missões:', err)
          })
      }

      return updated
    })
  }
```

**Atenção à dependência:** o `mission.service.ts` ainda não foi convertido. Se o `rideUseCase` precisar dele, tem duas saídas — chamar o `missionService` actual, ou converter o `mission` primeiro. **Escolher a primeira**: chamar o service existente mantém a task pequena, e o `mission` converte-se num lote próprio. Registar a dependência no relatório.

- [ ] **Step 3: Repontar, apagar, verificar e commit**

```bash
git rm src/services/ride.service.ts
npx tsc -b && npm run test && npm run build
git commit -m "refactor: rideUseCase substitui ride.service"
```

---

## Task 3: Verificação do lote

**Files:** nenhum a modificar.

- [ ] **Step 1: Contagens**

```bash
ls src/domain/usecases/*UseCase.ts | wc -l
ls src/services/*.service.ts | wc -l
grep -l "offsetToCursor" src/services/*.service.ts | wc -l
```

Expected: **13** usecases, **9** services, **3** cópias do `offsetToCursor` (eram 5).

- [ ] **Step 2: O efeito secundário sobreviveu**

```bash
grep -n "updateDriverProgress\|completed" src/domain/usecases/rideUseCase.ts
```

Expected: a condição `status === 'completed'` e a chamada ao progresso. Se desapareceram, a conversão achatou a orquestração.

- [ ] **Step 3: O listener devolve a função de cancelamento**

```bash
grep -n -A3 "ListenOnlineDrivers" src/domain/usecases/driverUseCase.ts
```

Expected: um `return` directo, sem `run()` e sem `await`.

- [ ] **Step 4: Camadas e castings**

```bash
grep -rn "from '@/modules/Api'" src/domain/usecases/
grep -n "as keyof\|field: string" src/domain/usecases/*.ts || echo "(limpo)"
```

Expected: ambos sem resultados.

- [ ] **Step 5: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 6: Relatório**

Sem commit. Registar quantos consumidores cada conversão tocou, como ficou a dependência do `rideUseCase` no `missionService`, e se o listener foi testado.

---

## Fecho

Treze usecases contra nove services.

Sobram: `wallet` e `withdrawal` (ambos só-leitura, o que sugere que os usecases também o devam ser), `promotion`, `mission`, `appConfig`, `files`, `auth`, e os dois que não são usecases de entidade — `audit` com o `withAudit` de 57 consumidores, e `finance` que agrega dois DAOs.
