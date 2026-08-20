# Follow-up: dois caminhos de escrita de saldo que a Fase 2 não cobriu

> Encontrados na verificação final da Fase 2 (branch `feat/painel-money-endpoints`).
> Ambos são pré-existentes. **Têm de ser resolvidos antes da Fase 4**, porque as
> Security Rules vão tornar impossível escrever `wallets` a partir do cliente —
> e estes dois caminhos partem nesse momento.

## 1. `payMissionBonus` — `src/services/mission.service.ts:222`

Chamado por `markProgressAsPaid` quando um bónus de missão é pago "via wallet".

O mesmo anti-padrão que a Fase 2 apagou do `updateBalanceAndAddTransaction`:

```ts
await transactionRepository.create(transaction)          // escrita 1
const newBalance = (wallet.balance || 0) + mission.reward // cálculo em JS
await walletRepository.update(wallet.id!, { balance: newBalance }) // escrita 2
```

- Duas escritas independentes: se a segunda falhar, fica um registo de
  transacção sem dinheiro creditado.
- Valor absoluto em vez de incremento: duas operações concorrentes perdem uma.
- Sem guarda de idempotência: pagar o mesmo progresso duas vezes credita duas vezes.

**Resolução:** endpoint admin na API, no molde do `approveTopup` — transacção
única, guarda de idempotência sobre `progress.is_paid`, entrada em
`walletAuditLogs`. Depois o painel chama-o.

## 2. Edição directa de saldo — `src/pages/main/Finances/components/ModalEdit.tsx`

Um formulário onde o admin escreve um `balance` arbitrário, gravado directamente
no Firestore via `WalletService` → `walletRepository.update`.

Pior que o caso anterior: não é um movimento calculado, é definir o saldo à mão,
**sem qualquer registo de transacção**. Um saldo pode mudar sem deixar rasto em
`transactions` nem em `walletAuditLogs`.

O `ModalCreate.tsx` tem o mesmo problema ao criar uma carteira com saldo inicial.

**Resolução — decidir primeiro se a funcionalidade deve existir:**

- Se sim, tem de ser um *ajuste* com motivo obrigatório, registado como
  transacção de categoria própria e em `walletAuditLogs`, através de um endpoint.
- Se não, remover o campo do formulário e deixar o saldo mudar apenas por
  movimentos reais.

A segunda hipótese é a mais defensável: um saldo que só muda por transacções é
reconciliável; um que pode ser escrito à mão não é.

## Ordem sugerida

Ambos precisam de endpoint novo, portanto é trabalho de API (molde da Fase 1)
seguido de painel (molde da Fase 2) — não um remendo dentro da Fase 3.
