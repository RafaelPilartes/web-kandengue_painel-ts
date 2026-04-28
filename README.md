# Kandengue Painel — Dashboard Admin

**Painel de Controlo Administrativo** para a plataforma Kandengue.

Uma aplicação web moderna (SPA) construída com React, Vite e Tailwind CSS, focada na operação, monitorização e gestão global do ecossistema de ride-hailing (aprovação de motoristas, histórico de corridas, pagamentos, estatísticas e resolução de litígios).

---

## Stack Principal

| Camada        | Tecnologia                            |
| ------------- | ------------------------------------- |
| Framework web | React 18.x + Vite 5.x                 |
| Linguagem     | TypeScript 5.x (strict mode)          |
| Estado        | Zustand + TanStack React Query        |
| UI / Estilos  | Tailwind CSS + Flowbite (Componentes) |
| Backend       | Firebase (Auth, Firestore, Storage)   |
| Mapas         | Leaflet + react-leaflet               |
| Gráficos      | Chart.js + react-chartjs-2            |
| Exportações   | ExcelJS (Excel) + jsPDF (PDF)         |
| Ícones        | React Icons / Lucide                  |
| Linter        | ESLint + Prettier                     |

---

## Arquitetura de Alto Nível

O projeto segue Clean Architecture com o padrão **MVVM (Model-View-ViewModel)** adaptado para o ecossistema React.

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  View (Page)    │───▶│  ViewModel       │───▶│  Service         │
│  (UI / Tailwind)│◀───│  (React Query)   │◀───│  (Lógica de Neg.)│
└─────────────────┘    └──────────────────┘    └──────────────────┘
                              ▲                          │
                              │                          ▼
                       ┌──────────────┐        ┌──────────────────┐
                       │ Zustand Store│        │  Repository      │
                       │ (Filtros UI) │        │  (Firebase DAO)  │
                       └──────────────┘        └──────────────────┘
```

---

## Quick Start

### Pré-requisitos

- **Node.js** ≥ 18
- **npm** ≥ 9

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/RafaelPilartes/web-kandengue_painel-ts.git
cd web-kandengue_painel-ts

# Instalar dependências
npm install
```

### Configurar variáveis de ambiente e Firebase

1. Copia o ficheiro `.env.example` para `.env`.
2. Adiciona as credenciais Web do teu projeto Firebase.

```bash
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

> **Nota:** O Painel requer uma conta de administrador Firebase válida com atributo `role: "admin"` no Firestore para permitir o acesso após o login.

### Executar localmente

```bash
# Iniciar servidor de desenvolvimento com Hot Module Replacement
npm run dev
```

---

## Comandos Principais

| Comando           | Descrição                                                  |
| ----------------- | ---------------------------------------------------------- |
| `npm run dev`     | Inicia o servidor Vite para desenvolvimento                |
| `npm run build`   | Compila o projeto otimizado para a pasta `dist/`           |
| `npm run preview` | Serve a pasta `dist/` localmente para testar o build final |
| `npm run lint`    | Executa a verificação de código com o ESLint               |

---

## Troubleshooting Rápido

| Problema                             | Solução                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| Mapa (Leaflet) a cinzento / quebrado | Garantir a importação do CSS no entry point: `import 'leaflet/dist/leaflet.css'` |
| Erro "Acesso não autorizado"         | O teu UID do Auth deve existir na coleção `users` com o campo `role: "admin"`    |
| Exportação Excel a falhar            | Confirmar que tens o plugin `file-saver` instalado e importado correctamente     |
| Dados não actualizam                 | O React Query cacheia dados por default. Verificar o `staleTime` da cache local  |

> Ver [docs/09-troubleshooting.md](docs/09-troubleshooting.md) para a lista completa de problemas.

---

## Documentação Detalhada

A base de conhecimento completa e regras de engenharia deste projeto estão organizadas na pasta `docs/`:

| Documento                                                | Conteúdo                                            |
| -------------------------------------------------------- | --------------------------------------------------- |
| [00 — Visão Geral](docs/00-overview.md)                  | Contexto e listagem dos Módulos do Dashboard        |
| [01 — Arquitetura](docs/01-architecture.md)              | Detalhe do padrão MVVM e Services                   |
| [02 — Estrutura de Pastas](docs/02-project-structure.md) | Organização de ficheiros e pastas                   |
| [03 — Tecnologias](docs/03-tech-stack.md)                | Ferramentas, bibliotecas e exportações              |
| [04 — Setup Local](docs/04-setup-local.md)               | Passos de instalação                                |
| [05 — Firebase](docs/05-firebase.md)                     | Queries operacionais e gestão de Admin Auth         |
| [06 — Gestão de Estado](docs/06-state-management.md)     | Cache com React Query e Filtros com Zustand         |
| [07 — Exportações](docs/07-export.md)                    | Como gerar e configurar Excel/PDF                   |
| [08 — Padrões de Código](docs/08-code-standards.md)      | Nomenclatura, MVVM Rules e Componentes (DataTables) |
| [09 — Troubleshooting](docs/09-troubleshooting.md)       | Resolução de bugs comuns do mapa e exportações      |
| [10 — Roadmap](docs/10-roadmap.md)                       | Próximas funcionalidades planeadas para o Dashboard |

> **Dica de Negócio:** Para visualizar como o Painel Admin se integra com a API Fastify e Apps Mobile, consulte a **Bíblia Técnica** transversal em `../_documentation/`.

---

## Licença

Este projeto é proprietário e pertence à **Kandengue**. Todos os direitos reservados.
