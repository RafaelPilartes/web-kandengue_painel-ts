# Estrutura de Pastas — Painel Administrativo

## Árvore Completa

```
web-kandengue_painel-ts/
│
├── public/                      # Assets públicos (favicon, imagens estáticas)
├── src/
│   ├── App.tsx                   # Componente raiz + configuração de rotas
│   ├── main.tsx                  # Entry point (ReactDOM.render)
│   │
│   ├── core/                     # ★ Domain Layer — puro, sem side effects
│   │   ├── entities/            # Classes de domínio com validação
│   │   │   ├── Ride.ts
│   │   │   ├── Driver.ts
│   │   │   ├── User.ts
│   │   │   ├── Wallet.ts
│   │   │   ├── Transaction.ts
│   │   │   ├── WalletTopupRequest.ts
│   │   │   ├── Mission.ts
│   │   │   ├── MissionProgress.ts
│   │   │   ├── Notification.ts
│   │   │   ├── Application.ts
│   │   │   ├── Document.ts
│   │   │   ├── Vehicle.ts
│   │   │   ├── RideRate.ts
│   │   │   ├── RideTracking.ts
│   │   │   └── Admin.ts
│   │   └── interfaces/          # Contratos TypeScript (I{Nome}.ts)
│   │
│   ├── modules/                  # Módulos de integração externa
│   │   └── Api/
│   │       ├── firebase/        # Implementações DAO Firebase
│   │       ├── rest/            # Implementações DAO REST (API Fastify)
│   │       └── index.ts         # Factory de permuta
│   │
│   ├── services/                 # ★ Regras de negócio por domínio
│   │   ├── ride.service.ts
│   │   ├── driver.service.ts
│   │   ├── users.service.ts
│   │   ├── finance.service.ts
│   │   ├── audit.service.ts
│   │   ├── auth.service.ts
│   │   ├── notification.service.ts
│   │   ├── mission.service.ts
│   │   ├── rideTracking.service.ts
│   │   ├── document.service.ts
│   │   ├── transaction.service.ts
│   │   ├── wallet.service.ts
│   │   ├── rideRate.service.ts
│   │   ├── walletTopupRequest.service.ts
│   │   ├── vehicle.service.ts
│   │   ├── applications.service.ts
│   │   ├── admins.service.ts
│   │   └── files.service.ts
│   │
│   ├── viewModels/               # ★ ViewModel Layer (React Query + Zustand)
│   │   ├── auth.viewmodel.ts
│   │   ├── ride.viewmodel.ts
│   │   ├── driver.viewmodel.ts
│   │   ├── finance.viewmodel.ts
│   │   ├── dashboard.viewmodel.ts
│   │   └── ...
│   │
│   ├── pages/                    # Telas do dashboard
│   │   ├── main/
│   │   │   ├── home.tsx          # Dashboard principal (métricas)
│   │   │   ├── login.tsx
│   │   │   ├── Drivers/          # Gestão de motoristas
│   │   │   ├── Passengers/       # Gestão de passageiros
│   │   │   ├── Rides/            # Histórico de corridas
│   │   │   ├── Finance/          # Financeiro
│   │   │   ├── Finances/         # Sub-módulos financeiros
│   │   │   ├── Application/      # Candidaturas
│   │   │   ├── Missions/         # Missões e desafios
│   │   │   ├── Notifications/    # Push notifications admin
│   │   │   ├── AuditLogs/        # Logs de auditoria
│   │   │   ├── Metrics/          # Métricas avançadas
│   │   │   ├── Settings/         # Configurações (tarifas, etc.)
│   │   │   └── Admin/            # Gestão de admins
│   │   └── 404.tsx
│   │
│   ├── components/               # Componentes reutilizáveis globais
│   │   ├── ui/                  # Botões, badges, inputs, modais
│   │   ├── charts/              # Componentes Chart.js
│   │   ├── maps/                # Componentes Leaflet
│   │   ├── tables/              # DataTables com paginação
│   │   └── drawers/             # Side panels de detalhes
│   │
│   ├── layout/                   # Estrutura base do dashboard
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── DashboardLayout.tsx
│   │
│   ├── hook/                     # Custom hooks globais
│   ├── routes/                   # React Router configuração
│   ├── stores/                   # Zustand stores
│   ├── config/                   # Firebase config, env
│   ├── constants/                # Constantes globais
│   ├── helpers/                  # Funções auxiliares
│   ├── utils/                    # Utilitários gerais
│   ├── types/                    # TypeScript types e enums
│   ├── interfaces/               # Interfaces adicionais
│   ├── data/                     # Dados estáticos (opções de select, labels)
│   ├── lib/                      # Configurações de bibliotecas (Chart.js, etc.)
│   ├── styles/                   # CSS global e utilitários Tailwind
│   └── provider/                 # Providers globais (React Query, etc.)
│
├── index.html                    # HTML entry point (Vite)
├── vite.config.ts                # Configuração Vite
├── tailwind.config.js            # Tailwind CSS
├── tsconfig.json
└── package.json
```

## Convenções por Pasta

| Pasta          | Deve conter                                 | Não deve conter                                     |
| -------------- | ------------------------------------------- | --------------------------------------------------- |
| `core/`        | Entities e interfaces puras                 | Código com side effects ou imports de libs externas |
| `services/`    | Regras de negócio + chamadas a repositórios | Lógica de UI ou renderização                        |
| `viewModels/`  | React Query hooks + Zustand mutations       | Código de JSX                                       |
| `pages/`       | Composição de componentes + ViewModel hooks | Lógica de negócio directa                           |
| `components/`  | Componentes reutilizáveis                   | Estado global                                       |
| `modules/Api/` | DAOs Firebase e REST                        | Lógica de negócio                                   |

---

**Anterior**: [01 — Arquitectura](01-architecture.md) | **Próximo**: [03 — Tech Stack](03-tech-stack.md)
