export function translateDayToPortuguese(day: string): string {
  const lowerCaseDay = day.toLocaleLowerCase()
  const daysOfWeek: Record<string, string> = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }

  return daysOfWeek[lowerCaseDay] || 'Dia inválido'
}
