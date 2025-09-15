// Helper para gerar ID único
export const generateId = (t: string) => {
  return `${t ?? 'id'}-${Date.now()}_${Math.floor(Math.random() * 1000)}`
}
