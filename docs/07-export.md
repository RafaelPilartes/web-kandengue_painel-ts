# Exportação de Relatórios — Painel Administrativo

## Formatos Suportados

| Formato         | Biblioteca | Uso                                                |
| --------------- | ---------- | -------------------------------------------------- |
| Excel (`.xlsx`) | ExcelJS    | Dados tabulares (corridas, transações, motoristas) |
| PDF             | jsPDF      | Relatórios formatados com cabeçalho e rodapé       |

---

## Exportação Excel (ExcelJS)

```typescript
// services/finance.service.ts
async exportRidesToExcel(rides: RideInterface[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Corridas');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 20 },
    { header: 'Passageiro', key: 'passenger', width: 25 },
    { header: 'Motorista', key: 'driver', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Total (AOA)', key: 'total', width: 15 },
    { header: 'Ganho Motorista', key: 'driver_earnings', width: 18 },
    { header: 'Data', key: 'created_at', width: 20 },
  ];

  rides.forEach(ride => {
    sheet.addRow({
      id: ride.id,
      passenger: ride.user.name,
      driver: ride.driver?.name ?? '—',
      status: ride.status,
      total: ride.fare.total,
      driver_earnings: ride.fare.payouts.driver_earnings,
      created_at: ride.created_at?.toLocaleDateString('pt-AO'),
    });
  });

  // Fazer download
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'corridas.xlsx');
}
```

---

## Exportação PDF (jsPDF)

```typescript
// services/finance.service.ts
exportFinancialReport(data: FinancialReportData): void {
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(18);
  doc.text('Relatório Financeiro — Kandengue', 20, 20);

  // Período
  doc.setFontSize(12);
  doc.text(`Período: ${data.startDate} — ${data.endDate}`, 20, 35);

  // Métricas
  doc.text(`Total de corridas: ${data.totalRides}`, 20, 50);
  doc.text(`Faturamento total: ${data.totalRevenue} AOA`, 20, 60);
  doc.text(`Ganhos motoristas: ${data.driversEarnings} AOA`, 20, 70);

  doc.save('relatorio-financeiro.pdf');
}
```

---

## Onde é Triggado

Cada secção do dashboard tem botões de exportação:

| Secção       | Formatos   |
| ------------ | ---------- |
| Rides        | Excel, PDF |
| Finance      | Excel, PDF |
| Drivers      | Excel      |
| Transactions | Excel      |

---

**Anterior**: [06 — Gestão de Estado](06-state-management.md) | **Próximo**: [08 — Padrões de Código](08-code-standards.md)
