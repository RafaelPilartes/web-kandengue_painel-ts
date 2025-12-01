// Extrai o código de erro (suporta objetos e strings; reconhece () e [])
export function extractFirebaseCode(error: any): string | null {
  if (error == null) return null

  // Se for objeto e tiver 'code' já pronto
  if (typeof error === 'object') {
    if (typeof error.code === 'string' && error.code.trim() !== '') {
      return error.code.trim()
    }

    // Se tiver message, trabalhe com ele abaixo
    if (typeof error.message === 'string') {
      return extractCodeFromString(error.message)
    }

    // Se não tiver message, converte o objeto para string e tenta extrair
    try {
      const txt = JSON.stringify(error)
      return extractCodeFromString(txt)
    } catch {
      return null
    }
  }

  // Se for string pura
  if (typeof error === 'string') {
    return extractCodeFromString(error)
  }

  return null
}

function extractCodeFromString(text: string): string | null {
  if (!text || typeof text !== 'string') return null
  const t = text.trim()

  // 1) Procura primeiro por colchetes: [auth/invalid-credential]
  const bracketMatch = t.match(/\[([^\]]+?)\]/)
  if (bracketMatch && bracketMatch[1]) {
    return bracketMatch[1].trim()
  }

  // 2) Procura parênteses: (auth/invalid-credential)
  const parenMatch = t.match(/\(([^)]+?)\)/)
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].trim()
  }

  // 3) Procura padrões do tipo 'auth/xxxx' ou 'database/xxxx' ou 'storage/xxxx'
  const slashPattern = t.match(
    /(auth\/[a-z0-9-_.]+|database\/[a-z0-9-_.]+|storage\/[a-z0-9-_.]+|functions\/[a-z0-9-_.]+)/i
  )
  if (slashPattern && slashPattern[1]) {
    return slashPattern[1].toLowerCase().trim()
  }

  // 4) Procura códigos genéricos com hífen (ex: permission-denied, not-found)
  const genericPattern = t.match(/\b([a-z]+-[a-z0-9-]+)\b/i)
  if (genericPattern && genericPattern[1]) {
    return genericPattern[1].toLowerCase().trim()
  }

  // 5) Se a string inteira for um código válido (ex.: 'auth/invalid-credential' ou 'permission-denied')
  const wholeTrim = t.replace(/^['"]|['"]$/g, '').trim()
  if (
    /^(auth\/[a-z0-9-_.]+|database\/[a-z0-9-_.]+|storage\/[a-z0-9-_.]+|functions\/[a-z0-9-_.]+|[a-z]+-[a-z0-9-]+)$/i.test(
      wholeTrim
    )
  ) {
    return wholeTrim.toLowerCase()
  }

  return null
}
