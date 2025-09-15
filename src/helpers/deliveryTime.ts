/**
 * Converte "HH:mm" → minutos do dia
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Verifica se currentMinutes está dentro do intervalo [start, end],
 * considerando casos que atravessam a meia-noite.
 *
 * @param currentMinutes minutos atuais do dia (0–1439)
 * @param startMinutes hora de início em minutos (0–1439)
 * @param endMinutes hora de fim em minutos (0–1439)
 */
export function isWithinTimeRange(
  currentMinutes: number,
  startMinutes: number,
  endMinutes: number,
): boolean {
  // Caso normal: start < end (ex.: 06:30 até 17:30)
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  // Caso cruzando a meia-noite: start > end (ex.: 22:00 até 05:00)
  // Nesse caso, o intervalo é "start → 23:59" OU "00:00 → end"
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}
