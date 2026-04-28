# Tech Stack — Painel Administrativo

## Stack Principal

| Camada        | Tecnologia | Versão |
| ------------- | ---------- | ------ |
| Framework web | React      | 18.x   |
| Bundler       | Vite       | 5.x    |
| Linguagem     | TypeScript | 5.x    |

## UI e Estilização

| Lib                  | Uso                                               |
| -------------------- | ------------------------------------------------- |
| Tailwind CSS         | Utilitários CSS                                   |
| Flowbite             | Componentes Tailwind (tabelas, modais, dropdowns) |
| React Icons / Lucide | Ícones                                            |
| React Hot Toast      | Notificações in-app                               |

## State Management e Data Fetching

| Lib                  | Uso                                                 |
| -------------------- | --------------------------------------------------- |
| TanStack React Query | Server state — corridas, motoristas, finanças       |
| Zustand              | Estado global de UI (filtros, selecções, paginação) |

## Firebase

| Módulo             | Uso                           |
| ------------------ | ----------------------------- |
| firebase/firestore | Queries e listeners (web SDK) |
| firebase/auth      | Autenticação admin            |
| firebase/storage   | Upload de documentos          |

## Mapas

| Lib           | Uso                                          |
| ------------- | -------------------------------------------- |
| Leaflet       | Visualização de rotas de corridas no browser |
| react-leaflet | Bindings React para Leaflet                  |

## Gráficos

| Lib             | Uso                             |
| --------------- | ------------------------------- |
| Chart.js        | Gráficos de métricas e finanças |
| react-chartjs-2 | Bindings React para Chart.js    |

## Exportação de Relatórios

| Lib     | Uso                              |
| ------- | -------------------------------- |
| ExcelJS | Exportação de dados para `.xlsx` |
| jsPDF   | Geração de relatórios em PDF     |

## HTTP e Rede

| Lib   | Uso                                                     |
| ----- | ------------------------------------------------------- |
| Axios | Chamadas à API Fastify (notificações, pagamentos admin) |

## Routing

| Lib              | Uso            |
| ---------------- | -------------- |
| React Router DOM | Roteamento SPA |

---

**Anterior**: [02 — Estrutura de Pastas](02-project-structure.md) | **Próximo**: [04 — Setup Local](04-setup-local.md)
