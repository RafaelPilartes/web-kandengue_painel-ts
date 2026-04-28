# Visão Geral — Painel Administrativo (Kandengue Dashboard)

## O que é

**Kandengue Dashboard** é o painel de controlo operacional do ecossistema Kandengue. Utilizado pela equipa de operações e suporte, oferece visibilidade profunda e controlo total sobre motoristas, passageiros, corridas, finanças e configurações do sistema.

## Problema que resolve

A equipa de operações precisa de:

1. **Monitorizar corridas** em tempo real e em histórico
2. **Aprovar motoristas** após validação de documentação
3. **Gerir finanças** — wallets, transações, tarifas
4. **Auditar** operações com logs detalhados
5. **Configurar** o sistema — tarifas, missões, notificações
6. **Exportar** relatórios em Excel e PDF

## Contexto no Ecossistema

- Lê da maioria das coleções Firestore em modo admin
- Comunica com a **API Fastify** para operações sensíveis (notificações, pagamentos)
- Não tem acesso de escrita a `rideTracking` — apenas leitura
- Usa Firebase Auth para autenticação (apenas utilizadores com `role: 'admin'`)

## Módulos do Dashboard

| Módulo            | Descrição                                                   |
| ----------------- | ----------------------------------------------------------- |
| **Home**          | Métricas do dia — corridas, faturamento, motoristas activos |
| **Drivers**       | Listagem, aprovação, documentos, corridas, avaliações       |
| **Passengers**    | Listagem, detalhes de viagem, histórico                     |
| **Rides**         | Histórico completo, mapeamento de rotas, cancelamentos      |
| **Finance**       | Wallets, transações, tarifas, ganhos por motorista          |
| **Applications**  | Candidaturas de novos motoristas                            |
| **Missions**      | Criação e gestão de missões/desafios para motoristas        |
| **Notifications** | Envio de push notifications para segmentos                  |
| **Audit Logs**    | Registo de todas as acções administrativas                  |
| **Settings**      | Tarifas (RideRates), configurações gerais                   |

---

**Próximo**: [01 — Arquitectura](01-architecture.md)
