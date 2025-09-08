import { v4 as uuidv4 } from 'uuid'
import { shortenString, transformedText } from './formattedString'

export function randomId(): string {
  const id = uuidv4()
  return id
}
export function generateUUIDWithMax(maxNumber: number) {
  if (maxNumber <= 0) {
    throw new Error('O número máximo deve ser maior que zero.')
  }

  // Gera um UUIDv4
  const uuid = uuidv4()

  // Converte o UUID para um número inteiro
  const uuidInt = parseInt(uuid.replace(/-/g, ''), 16)

  // Calcula o número dentro do intervalo máximo
  const generatedNumber = uuidInt % maxNumber

  return generatedNumber
}
export function generateSecretKey(nameUser: string) {
  const secret_key = `${transformedText(nameUser)}${shortenString(
    randomId(),
    5
  )}`

  return secret_key
}
export function generateDocId() {
  const docId = randomId()

  return docId
}
