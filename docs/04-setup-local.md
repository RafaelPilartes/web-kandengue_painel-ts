# Setup Local — Painel Administrativo

## Pré-requisitos

| Ferramenta | Versão mínima |
| ---------- | ------------- |
| Node.js    | ≥ 18.x        |
| npm        | ≥ 9.x         |

---

## 1. Instalar Dependências

```bash
cd web-kandengue_painel-ts
npm install
```

---

## 2. Configurar Variáveis de Ambiente

Criar o ficheiro `.env` na raiz do projecto:

```bash
cp .env.example .env  # se existir, ou criar manualmente
```

Preencher com as credenciais Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=http://localhost:3000   # URL da API Fastify local
```

> ⚠️ Todas as variáveis de ambiente web usam o prefixo `VITE_` para serem expostas pelo Vite.

---

## 3. Executar em Desenvolvimento

```bash
npm run dev
```

O dashboard fica disponível em: `http://localhost:5173`

---

## 4. Criar Utilizador Admin

O acesso ao dashboard requer um utilizador com `role: 'admin'` no Firestore.

Para criar o primeiro admin:

1. Criar utilizador no Firebase Console (Authentication → Add user)
2. No Firestore, criar documento em `users/{uid}`:
   ```json
   {
     "name": "Admin Kandengue",
     "email": "admin@kandengue.com",
     "role": "admin",
     "status": "active"
   }
   ```
3. Fazer login no dashboard com esse email/password

---

## 5. Scripts Disponíveis

| Comando           | Descrição                              |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento (Vite HMR) |
| `npm run build`   | Build de produção em `dist/`           |
| `npm run preview` | Preview do build de produção           |
| `npm run lint`    | ESLint                                 |

---

## 6. Verificação

Após login:

- [ ] Dashboard home carrega com métricas
- [ ] Sidebar com todas as secções visíveis
- [ ] Lista de corridas carrega do Firestore
- [ ] Lista de motoristas carrega do Firestore
- [ ] Gráficos financeiros renderizam

---

**Anterior**: [03 — Tech Stack](03-tech-stack.md) | **Próximo**: [05 — Firebase](05-firebase.md)
