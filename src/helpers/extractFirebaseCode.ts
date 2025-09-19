export function extractFirebaseCode(error: any): string | null {
  if (!error?.message) return null

  const match = error.message.match(/\(([^)]+)\)/) // pega o texto dentro dos ()
  return match ? match[1] : null
}
