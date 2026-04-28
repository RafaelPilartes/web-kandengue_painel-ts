# Arquitectura — Painel Administrativo

## Padrão Arquitectural

O Dashboard segue **Feature-Based / Modular Architecture** apoiada em **MVVM** e **Clean Architecture**, com os **Princípios SOLID** aplicados em toda a codebase.

```
┌────────────────────────────────────────┐
│           Pages / Views                │
│   pages/main/{Feature}/               │
│   (apenas renderização e composição)  │
├────────────────────────────────────────┤
│         ViewModel Layer                │
│   viewModels/ (React Query + Zustand) │
│   (estado e data fetching por feature)│
├────────────────────────────────────────┤
│           Service Layer                │
│   services/ (regras de negócio admin) │
│   (transformações, cálculos, filtros) │
├────────────────────────────────────────┤
│     Repository / Module Layer          │
│   modules/Api/ (firebase/ + rest/)    │
│   (DAOs com permuta Firebase ↔ REST)  │
├────────────────────────────────────────┤
│           Core Layer                   │
│   core/entities/ + core/interfaces/  │
│   (domínio puro, partilhado)          │
└────────────────────────────────────────┘
```

## Fluxo de Dados

```
Page (ex: DriversPage)
  │
  ▼
ViewModel hook (useDriversViewModel)
  │  React Query → data fetching + cache
  │  Zustand → estado global (filtros, selecção)
  ▼
Service (driver.service.ts)
  │  Regras de negócio (ex: filtrar por status, calcular métricas)
  ▼
Repository (modules/Api/firebase/driver.firebase.ts)
  │  Queries Firestore com paginação
  ▼
Firestore (leitura) / API Fastify (operações admin)
```

## Serviços por Domínio

Cada domínio tem um serviço dedicado em `src/services/`:

| Serviço                   | Responsabilidade                               |
| ------------------------- | ---------------------------------------------- |
| `ride.service.ts`         | Histórico, filtros, métricas de corridas       |
| `driver.service.ts`       | Aprovação, documentos, métricas de motoristas  |
| `users.service.ts`        | Gestão de passageiros                          |
| `finance.service.ts`      | Wallets, transações, cálculos financeiros      |
| `audit.service.ts`        | Logs de auditoria, registo de acções           |
| `notification.service.ts` | Envio de push via API Fastify                  |
| `mission.service.ts`      | CRUD de missões e acompanhamento de progresso  |
| `rideTracking.service.ts` | Leitura de rotas para visualização no mapa     |
| `document.service.ts`     | Upload e aprovação de documentos de motoristas |
| `transaction.service.ts`  | Histórico de transações financeiras            |
| `wallet.service.ts`       | Gestão de wallets de motoristas                |
| `rideRate.service.ts`     | Configuração de tarifas                        |
| `applications.service.ts` | Candidaturas de novos motoristas               |

## Módulo Api/ — Padrão de Permuta

```
modules/Api/
  firebase/          ← implementação DAO via Firebase SDK
    ride.firebase.ts
    driver.firebase.ts
    ...
  rest/              ← implementação DAO via Axios (API Fastify)
    ride.rest.ts
    ...
  index.ts           ← factory: selecciona firebase ou rest
```

## Mapas Web (Leaflet)

O dashboard usa **Leaflet** (não Google Maps) para visualização de rotas no browser:

```
RideDetailsDrawer
  └── LeafletMap
        ├── PolylineLayer (rota percorrida)
        ├── PickupMarker
        └── DropoffMarker
```

---

**Anterior**: [00 — Visão Geral](00-overview.md) | **Próximo**: [02 — Estrutura de Pastas](02-project-structure.md)
