# web-kandengue_painel-ts — Painel Admin

Dashboard web para administradores gerirem motoristas, passageiros, corridas, finanças e missões da plataforma Kandengue.

---

## Stack e Versões

| Tecnologia                 | Versão                   |
| -------------------------- | ------------------------ |
| React                      | ^19.1.1                  |
| TypeScript                 | ~5.8.3                   |
| Vite                       | ^7.1.2                   |
| firebase (client SDK)      | ^12.2.1                  |
| TanStack React Query       | ^5.87.1                  |
| Zustand                    | ^5.0.8                   |
| React Router DOM           | ^7.8.2                   |
| Zod                        | ^4.1.5                   |
| Tailwind CSS               | ^3.4.17                  |
| Chart.js + react-chartjs-2 | ^4.5.0 / ^5.3.0          |
| Leaflet + react-leaflet    | ^1.9.4 / ^5.0.0          |
| Framer Motion              | ^12.23.12                |
| ExcelJS + jsPDF            | exportação de relatórios |

---

## Como Rodar Localmente

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build
npm run preview   # preview da build
```

## Versão

Semver no `package.json`: **patch** corrige, **minor** acrescenta ecrãs ou
campos sem partir nada, **major** muda o que o admin espera (fluxos, dados).
Sobe no commit que fecha a fase, com tag `vX.Y.Z`. A versão vai no
`<meta name="app-version">` do `index.html` gerado (plugin em
`vite.config.ts`): depois de um upload, `curl -s <url> | grep app-version`
diz o que está em produção. Regra comum: `CLAUDE.md` da raiz do ecossistema.

## Deploy (cPanel, manual)

**Domínio: `https://painel.kandengueatrevido.ao`** — estava por escrever, e
sem ele não se conseguia correr a verificação que esta secção manda fazer.

Alojamento cPanel (Apache), no mesmo alojamento do site; sem deploy
automático. `npm run build` gera `dist/`; sobe o **conteúdo** de `dist/`
para o `public_html` do domínio do painel, incluindo o `.htaccess` (oculto),
que faz o redirect das rotas da SPA para o `index.html`. O
`.env.production` (versionado, sem segredos) fixa `VITE_API_URL` no Railway
— o `.env` local aponta ao Fastify de desenvolvimento e, sem ele, o bundle
levava `localhost:3000`. As variáveis `VITE_FIREBASE_*` continuam a vir do
`.env` local.

> ⚠️ **O `index.html` é o ficheiro que se esquece.** A 2026-10-06 os
> `assets/` subiram e o `index.html` ficou o da build anterior: o bundle novo
> estava no servidor e o painel continuava a carregar o antigo, porque é o
> `index.html` que diz qual carregar. Arrastar a pasta no gestor do cPanel
> deixa de fora os dois ficheiros da raiz — o `index.html` e o `.htaccess`.
>
> **A verificação não é "o bundle existe"**, é:
>
> ```bash
> curl -s https://painel.kandengueatrevido.ao | grep app-version
> curl -s -D - -o /dev/null https://painel.kandengueatrevido.ao | grep -i last-modified
> ```
>
> O `app-version` tem de ser o da build, e o `last-modified` tem de ser de
> agora. Confirmar também que uma rota interna aberta directamente
> (`/rides/fare-review`) dá 200 e não 404 — é o `.htaccess` a funcionar.

---

## Variáveis de Ambiente

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_GOOGLE_API_KEY=
```

---

## Convenções

### Estrutura `src/`

```
src/
├── modules/Api/firebase/   # DAOs Firestore (classes singleton)
├── modules/Api/rest/       # cliente axios → API Fastify
├── pages/main/
│   ├── Admin/ Drivers/ Passengers/ Rides/
│   ├── Finance/ Finances/ Metrics/
│   ├── Missions/ Notifications/ AuditLogs/
│   ├── Application/ Settings/
│   └── home.tsx + login.tsx
├── components/ layout/ routes/
├── stores/          # Zustand
├── viewModels/      # lógica por página
├── config/          # firebase.config.ts
└── helpers/ types/ utils/
```

- Auth protegida pela collection `admins`
- Exportação Excel (ExcelJS) e PDF (jsPDF + html2canvas)
- Mapas de corridas com Leaflet

---

## Schema source-of-truth

`PromotionEntity`, `PromotionUsageEntity`, `ReferralEarningEntity` e
`WithdrawalRequestEntity`, com as interfaces que cumprem, vivem em
`@rafaelpilartes/kandengue-shared/entities`. Os ficheiros em
`src/core/entities/` só guardam o converter. Mudar um tipo é mudá-lo na lib,
publicar uma tag nova e subir a dependência nos cinco repositórios.

O documento **`08 — Firestore Schema`** continua a ser a fonte de verdade do
schema do Firestore; a lib é a fonte de verdade dos tipos.

> ⚠️ **As promoções escrevem-se pela API** (`/api/v1/admin/promotions*`), não
> aqui. `promotions` e tudo o que está por baixo — o documento, os
> `counters/shard_*` e os `allowed_users` — estão `allow write: if false` nas
> regras, **admin incluído**. O `FirebasePromotionDAO` é só de leitura
> (`getByCode`, `listAllowedUsers`, `listUsages` e o que o motor traz); as
> escritas vivem no `AdminPromotionDAO` (`modules/Api/rest/`). A criação do
> documento e dos 10 shards é uma transacção única no servidor, com o registo
> de auditoria dentro dela.
>
> Não reintroduzir escritas em `promotions` no cliente: a razão de isto ter
> mudado é que o `valid_until` da `RAFAEL11` passou de Junho para Outubro sem
> uma linha em `auditLogs`. Promoções são dinheiro.

> ⚠️ As operações de dinheiro do admin — aprovar carregamento, e aprovar /
> rejeitar / marcar-pago um saque — vivem na API (`/api/v1/admin/...`), não
> no painel. Correm numa transação única e idempotente, e registam em
> `walletAuditLogs` dentro dessa transação. Não reintroduzir escritas de
> saldo, transação ou estado de saque no cliente.

> ⚠️ **Auditoria: nas escritas que vão pela API, não usar `withAudit`.** O
> servidor escreve em `auditLogs` dentro da transacção da alteração — o
> registo não pode existir sem a alteração. O `withAudit` do
> `src/observability/audit.ts` corre no browser, depois da escrita, falha em
> silêncio e não escreve nada sem `auditService.setAdmin`: somá-lo a uma
> escrita da API dá duas linhas por alteração, uma delas pior. Continua a
> valer para o que ainda escreve directamente no Firestore.
>
> ⚠️ **E há uma excepção, que é os preços.** A gravação de um perfil
> (`PUT /api/v1/admin/pricing/profiles`) audita na API, mas em
> **`pricingAuditLogs`** — com o antes e o depois campo a campo, na mesma
> transacção — e **não** em `auditLogs`. Como **nenhum ecrã do painel lê
> `pricingAuditLogs`**, o `usePricingProfilesViewModel` escreve **também** a
> linha de `auditLogs`: não é um duplicado, é a única entrada visível de quem
> mexeu num preço, porque o ecrã de auditoria lê `auditLogs`
> (`auditLog.dao.ts:17`).
>
> **Não tirar esse `withAudit`** sem primeiro haver um ecrã para
> `pricingAuditLogs` — está nos pendentes do `progress.md`, sem prioridade.
> Decisão de 2026-10-24, com a medição, em `decisions.md`.

---

## Conexão Firebase

Usa `firebase` client SDK v12 (Auth + Firestore + Storage).

**Collections principais:**

`admins`, `users`, `drivers`, `vehicles`, `rides`, `rideTrackings`, `rideRates`, `wallets`, `topupRequests`, `transactions`, `notifications`, `documents`, `complaints`, `applications`, `missions`, `missionProgress`, `auditLogs`, `walletAuditLogs`

---

## Como se Conecta com as Outras Partes

- **API Fastify**: REST para envio de push notifications
- **Apps**: partilha as mesmas collections Firestore
- **Website**: lê `applications` criadas pelo website público

---

## Língua — código em inglês, português só no que o utilizador lê

**Decidido a 2026-10-14. Vale para todos os sete pacotes.**

| | Língua |
| --- | --- |
| identificadores (variáveis, funções, tipos, interfaces, constantes) | **inglês** |
| nomes de ficheiros e de pastas | **inglês** |
| **comentários** | **inglês** |
| nomes de testes (`describe`/`it`) | **inglês** |
| mensagens de commit | **inglês** |
| texto que o utilizador lê — ecrãs, pushes, `user_message`, etiquetas | **português** |
| `HANDOFF.md`, `decisions.md`, `progress.md` | **português** |

A linha que separa as duas colunas é **quem lê**: se um utilizador, um
passageiro, um motorista ou um administrador lê a frase, ela é em português; se
quem a lê é quem mexe no código, é em inglês.

```ts
// ✅ o identificador em inglês, o valor em português
export const NO_CONTACT_LABEL = 'Não disponível'

// ✅ uma mensagem de negócio é texto de pessoa: fica em português
throw new BusinessError('Esta corrida já passou da recolha.')
```

⚠️ **Mudou a 2026-10-14, e antes disso a convenção era o contrário**
(comentários e nomes de domínio em português). Por isso o código tem as duas
formas, e isso **não é descuido**: a renomeação faz-se por fases, com as
suites a provar que nada mudou de comportamento — está no `HANDOFF.md`, §0AH.
Código **novo** segue esta regra desde já.

⚠️ **Um nome que viaja na rede não se renomeia sozinho.** Um campo de um
documento do Firestore, uma chave de um corpo HTTP ou um valor de um `enum`
que já está gravado são **contrato**, não identificador: mudam com uma
migração ou numa subida major combinada entre as duas pontas, nunca num
`rename` de um lado só.
