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

> A criação de promoções pré-cria os shards `counters/shard_0..9` no
> `FirebasePromotionDAO.create()`. É conveniência idempotente, não um
> invariante: todas as escritas em shards usam `set(..., { merge: true })`,
> que cria o documento se faltar, e `used_count_approx` já nasce a `0` no
> próprio documento da promoção. O risco real dos contadores está na janela
> de reconciliação de 60s do `syncPromoCounters`, não na criação.

> ⚠️ As operações de dinheiro do admin — aprovar carregamento, e aprovar /
> rejeitar / marcar-pago um saque — vivem na API (`/api/v1/admin/...`), não
> no painel. Correm numa transação única e idempotente, e registam em
> `walletAuditLogs` dentro dessa transação. Não reintroduzir escritas de
> saldo, transação ou estado de saque no cliente.

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
