export function transformedText(text: string) {
  // Colocar o texto em minúsculo
  let lowercaseText = text.toLowerCase()

  // Remover acentos
  let normalizedText = lowercaseText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // Remover espaços e substituir por underline
  let cleanedText = normalizedText
    .replace(/[^\w\s.-]|_/g, '')
    .replace(/\s+/g, '_')

  return cleanedText
}

export function shortenString(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + ''
  }
  return text
}
