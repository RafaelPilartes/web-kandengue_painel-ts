// Helper para gerar ID único
export const generateId = (t: string) => {
  // O sufixo aleatório de 3 dígitos colidia a ~1/1000 no mesmo milissegundo,
  // e `setDoc` sobrescreve sem falhar. Em colecções de escrita intensa
  // (rides, transactions) isso perde registos.
  return `${t ?? 'id'}-${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
}
