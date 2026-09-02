# O Motor Deixa de Depender do `withConverter` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task a task. Os passos usam `- [ ]` para acompanhamento.

**Goal:** Pôr o `BaseFirebaseDAO` a aplicar a conversão ele próprio, em vez de a delegar no `withConverter` do SDK — para que o mesmo motor sirva o React Native, onde essa API não existe.

**Architecture:** A referência da colecção deixa de ser convertida. O motor guarda o converter e chama `fromFirestore` nos cinco sítios onde lê. A escrita não muda.

**Tech Stack:** React 19 + Vite 7, Firestore client SDK v12, Vitest com emulador na porta 8090.

## Contexto: porque é que isto tem de mudar

O documento de arquitectura assenta na premissa de que o `@react-native-firebase` v23 expõe a mesma API modular do SDK web, e que por isso um só motor serve os quatro frontends. **Fui verificar antes de portar nada.**

As quinze funções que o motor importa — `collection`, `doc`, `getDoc`, `getDocs`, `query`, `where`, `orderBy`, `limit`, `startAfter`, `getCountFromServer`, `setDoc`, `updateDoc`, `deleteDoc`, `serverTimestamp`, `onSnapshot` — **existem todas** no `@react-native-firebase/firestore` v23.5.0, com os mesmos nomes. Nessa parte a premissa é verdadeira.

**Mas o `withConverter` não existe.** Nem o `FirestoreDataConverter`. Confirmei por três caminhos, depois de validar o método contra o SDK web, onde ambos aparecem. Zero ocorrências no pacote inteiro.

E é sobre isso que o motor assenta:

```ts
this.ref = collection(db, path).withConverter(converter)
```

Sem essa linha resolvida, nada do que foi migrado no painel corre numa app.

### O que torna isto barato

O cabeçalho do próprio motor já exige que o `toFirestore` seja **identidade em forma**, porque o `updateDoc` não o corre e o `setDoc` corre — um converter que renomeasse campos escreveria formas diferentes nos dois caminhos.

Verifiquei os dezoito converters do painel: **todos** são `return { ...x }`. Sem excepção.

Portanto o `toFirestore` já era um no-op na prática, e largar o `withConverter` **não perde nada na escrita**. Só o lado da leitura precisa de conversão explícita, e são cinco sítios.

### O problema que isto resolve nas apps, de caminho

Os DAOs das apps hoje fazem `docSnap.data() as VehicleEntity` — um casting cru. Os `Timestamp` do Firestore chegam ao código como se fossem `Date`, e o compilador aceita a mentira.

É a mesma classe de erro que os converters eliminaram no painel. Escrevê-los para as apps resolve as duas coisas de uma vez.

## Global Constraints

- **Não mudar comportamento.** Os **185** testes existentes são a rede, e cobrem leitura, escrita, tempo real e paginação por cursor. Se algum precisar de mudar, algo se partiu — parar e reportar.
- **Não tocar nos converters das entidades.** A sua forma não muda; só muda quem os chama.
- **Não tocar nos DAOs concretos.** O construtor deles continua igual.
- **`erasableSyntaxOnly`**, **`verbatimModuleSyntax`**, **`noUnusedLocals`**, `strict`. Verificar com **`npx tsc -b`**.
- Testes: `npm run test`, baseline **185**. Emulador na porta **8090**.
- Aspas simples, sem ponto e vírgula, 2 espaços. Comentários em português.

---

## Task 1: O motor converte por si

**Files:**
- Modify: `src/modules/Api/firebase/BaseFirebaseDAO.ts`

- [ ] **Step 1: Ler os sítios que mudam**

```bash
grep -n "withConverter\|\.data()\|this.ref" src/modules/Api/firebase/BaseFirebaseDAO.ts
```

São cinco leituras de entidade — `getAll`, `getById`, `getOneByField`, `listenById`, `listenAll` — e duas contagens (`getCountFromServer`), que devolvem `{ count }` e **não** passam pelo converter.

- [ ] **Step 2: Guardar o converter em vez de o aplicar à referência**

```ts
  protected readonly ref: CollectionReference   // já não é CollectionReference<T>
  protected readonly converter: FirestoreDataConverter<T>
```

E no construtor:

```ts
    this.converter = converter
    this.ref = collection(db, path)
```

**Porquê:** o `withConverter` não existe no `@react-native-firebase`. Aplicar a conversão aqui mantém um só motor para os quatro repositórios.

- [ ] **Step 3: Um ponto único de conversão**

```ts
  /**
   * Fronteira Doc → Entity. Substitui o que o `withConverter` fazia por
   * baixo, e existe para o mesmo motor correr no React Native, onde essa
   * API do SDK web não existe.
   */
  protected toEntity(snap: DocumentSnapshot | QueryDocumentSnapshot): T {
    return this.converter.fromFirestore(snap as QueryDocumentSnapshot, {})
  }
```

Confirmar os tipos exactos que o `fromFirestore` do SDK espera antes de escrever — a assinatura leva o snapshot e as `SnapshotOptions`.

- [ ] **Step 4: Trocar os cinco sítios**

`d.data()` passa a `this.toEntity(d)`. **Não tocar** nas duas contagens: `(await getCountFromServer(base)).data().count` continua igual, porque não é uma entidade.

Atenção ao `getById` e ao `listenById`, que testam `snap.exists()` antes de converter — essa guarda mantém-se.

- [ ] **Step 5: A escrita não muda**

O `setDoc` e o `updateDoc` recebem objectos simples e continuam iguais. Os dezoito converters são `return { ...x }`, portanto o `toFirestore` já não fazia nada.

**Se algum teste de escrita falhar, é sinal de que um converter não era identidade** — parar e reportar qual.

- [ ] **Step 6: Verificar**

```bash
npx tsc -b && npm run test && npm run build
```

Expected: **185 testes**, sem nenhum alterado. É o critério desta task.

- [ ] **Step 7: Commit**

```bash
git add src/modules/Api/firebase/BaseFirebaseDAO.ts
git commit -m "refactor: o motor aplica a conversao, sem depender do withConverter"
```

---

## Task 2: Provar que o motor já não depende dessa API

**Files:**
- Modify: `src/modules/Api/firebase/__tests__/baseFirebaseDao.read.test.ts`

Sem isto, alguém volta a introduzir o `withConverter` sem reparar, e a portabilidade perde-se em silêncio.

- [ ] **Step 1: Um teste que falha se a dependência voltar**

O motor não pode voltar a chamar `withConverter`. A forma mais directa de o fixar é um teste que lê o próprio ficheiro:

```ts
it('o motor não usa withConverter — o React Native não o tem', async () => {
  const fonte = await readFile(
    new URL('../BaseFirebaseDAO.ts', import.meta.url),
    'utf8'
  )
  expect(fonte).not.toContain('withConverter')
})
```

Um teste que lê código-fonte é invulgar, e aqui justifica-se: a propriedade a garantir é sobre **que API o motor usa**, não sobre o que ele devolve. Nenhum teste de comportamento a apanharia.

- [ ] **Step 2: Verificar e commit**

```bash
npm run test
git add src/modules/Api/firebase/__tests__/baseFirebaseDao.read.test.ts
git commit -m "test: fixar que o motor nao volta a depender do withConverter"
```

---

## Task 3: Verificação

**Files:** nenhum a modificar.

- [ ] **Step 1: A dependência desapareceu**

```bash
grep -rn "withConverter" src/ || echo "(limpo)"
```

Expected: sem resultados em todo o `src/`.

- [ ] **Step 2: Os testes não foram alterados**

```bash
git diff --stat main..HEAD -- src/modules/Api/firebase/__tests__/
```

Expected: só o ficheiro que a Task 2 acrescenta. Se algum teste de comportamento mudou, o refactor mudou comportamento.

- [ ] **Step 3: Os DAOs e os converters não foram tocados**

```bash
git diff --name-only main..HEAD -- src/core/entities/ src/modules/Api/firebase/*.dao.ts
```

Expected: **vazio**.

- [ ] **Step 4: Suite e build**

```bash
npx tsc -b && npm run test && npm run build
```

- [ ] **Step 5: Relatório**

Sem commit. Registar se algum teste de escrita falhou (o que indicaria um converter não-identidade), e quais tipos do SDK tiveram de mudar no motor.

---

## Fecho

O motor deixa de depender de uma API que só existe no SDK web.

O passo seguinte é o que esta mudança destranca: portar o `BaseFirebaseDAO` para uma das apps e migrar **um** DAO simples, com o seu converter. Só então se saberá o que mais difere — o `ignoreUndefinedProperties`, que não encontrei no `initializeFirestore` do RNFirebase e que foi o que permitiu ao painel eliminar o `sanitize()`, é o próximo candidato a surpresa.
