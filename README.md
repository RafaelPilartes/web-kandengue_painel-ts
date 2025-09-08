# 📦 Kandengue Atrevido – Dashboard (Admin Panel)

Este projeto é o **Painel Administrativo** do **Kandengue Atrevido**, uma plataforma de gestão de entregas.  
Aqui os administradores podem **monitorar entregas em tempo real, gerenciar motoristas, acompanhar finanças e configurar tarifas do sistema**.

---

## ✅ Features da Dashboard

- 📊 **Overview** – Entregas do dia, faturamento, motoristas ativos
- 🚚 **Monitoramento em Tempo Real** – Mapa com entregas ativas
- 👤 **Gestão de Motoristas** – Aprovação, documentos, corridas, avaliações
- 📦 **Gestão de Entregas** – Histórico, cancelamentos, relatórios
- 💰 **Financeiro** – Tarifas, ganhos, pagamentos
- ⚙️ **Configurações** – Tarifas, percentuais, notificações

---

## 🔮 Futuro

- Suporte a **REST API** (alternável via `modules/Api/index.ts`)
- Integração com **Mapbox ou Google Maps** para rastreamento em tempo real
- Sistema de **notificações push** para Admins

---

## 🚀 Tecnologias

- **React + TypeScript**
- **React Query** – Gerenciamento de dados assíncronos
- **Firebase** – Autenticação e Banco de Dados (pode ser substituído futuramente por REST API)
- **Arquitetura Clean-like** (com `services`, `viewmodels`, `dao`, `entities`)

---

## 📂 Estrutura do Projeto

📦 kandengue-dashboard  
├── .env # Variáveis de ambiente  
│  
└── src/  
├── config/  
│ └── firebase.config.ts # Configuração do Firebase SDK  
│  
├── core/  
│ ├── entities/ # Modelos de domínio (User, Driver, Delivery, etc.)  
│ └── interfaces/ # Interfaces de Repositories (contratos)  
│  
├── modules/  
│ └── Api/  
│ ├── firebase/ # Implementação DAO Firebase  
│ ├── rest/ # Implementação DAO REST (futuro)  
│ └── index.ts # Factory para alternar Firebase ↔ REST  
│  
├── services/  
│ └── users.service.ts # Regras de negócio (ex: UserService)  
│  
├── viewmodels/  
│ ├── users.viewmodel.ts # Hooks (useUsers, useCreateUser, etc.)  
│ └── auth.viewmodel.ts # Hooks (useAuth, login, logout, etc.)  
│  
├── pages/ # Páginas da Dashboard  
│ ├── LoginPage.tsx  
│ ├── DashboardPage.tsx  
│ ├── DriversPage.tsx  
│ ├── DeliveriesPage.tsx  
│ └── FinancePage.tsx  
│  
├── components/ # Componentes compartilhados  
│ ├── Navbar.tsx  
│ ├── Sidebar.tsx  
│ ├── DataTable.tsx  
│ └── LoadingSpinner.tsx  
│  
└── main.tsx / App.tsx # Entrada da aplicação

---

## 🔑 Variáveis de Ambiente (`.env`)

```env
VITE_FIREBASE_API_KEY=xxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxxxxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxx
VITE_FIREBASE_APP_ID=xxxxxxx
```

## 📐 Fluxo Arquitetural

1. **View (pages/components)**

   - Renderiza UI, chama o **ViewModel**.

2. **ViewModel (hooks)**

   - Usa **React Query** (`useQuery`, `useMutation`) para buscar dados do Service.
   - Controla estados (loading, error, success).

3. **Service (regras de negócio)**

   - Aplica validações, chama **Repository** para acesso a dados.

4. **Repository (DAO – Firebase ou REST)**

   - Implementação real de persistência.
   - Exemplo: `userRepository.getAll()` pode vir do **Firebase** hoje, ou de uma **API REST** amanhã.

5. **Entities (domínio)**
   - Tipos fortes (`User`, `Driver`, `Delivery`) que definem o core do negócio.

---

## 🛠️ Scripts

```bash
# Instalar dependências
npm install

# Rodar em dev
npm run dev

# Build para produção
npm run build

# Lint
npm run lint
```
