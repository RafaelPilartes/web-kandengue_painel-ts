import type { RideInterface } from '@/interfaces/IRide'

/**
 * Os telefones de uma corrida, e de onde cada um veio.
 *
 * ── Porque existe ──
 * Desde a sub-fase 3.2 os contactos vivem em
 * `rides/{id}/private/contacts` — um documento à parte, legível pelo
 * passageiro dono, pelo motorista atribuído e pelo admin. As corridas
 * anteriores **não migram** (decisão do §0A), e por isso o painel tem de ler
 * os dois sítios: o documento privado primeiro, a cópia embutida na corrida
 * como recuo.
 *
 * ⚠️ **A origem vai no resultado de propósito.** Um telefone que falta e um
 * telefone que veio da cópia antiga são coisas diferentes para quem está a
 * tentar ligar a alguém: o primeiro não existe, o segundo pode estar velho.
 * Sem esta distinção, o ecrã mostrava "não disponível" nos dois casos.
 */
export type OrigemContacto = 'privado' | 'corrida' | null

export type Contacto = {
  valor: string | null
  origem: OrigemContacto
}

export type ContactosDaCorrida = {
  passageiro: Contacto
  motorista: Contacto
  remetente: Contacto
  destinatario: Contacto
}

/** Os campos do documento `private/contacts`, como o servidor os escreve. */
export type ContactosPrivados = {
  passenger_phone?: string
  driver_phone?: string
  sender_phone?: string
  receiver_phone?: string
}

const limpo = (v: unknown): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

const escolhe = (
  doPrivado: unknown,
  daCorrida: unknown
): Contacto => {
  const p = limpo(doPrivado)
  if (p) return { valor: p, origem: 'privado' }
  const c = limpo(daCorrida)
  if (c) return { valor: c, origem: 'corrida' }
  return { valor: null, origem: null }
}

/**
 * Junta os dois sítios, com o privado a ganhar.
 *
 * O privado ganha porque é o que o **servidor** escreve: o `driver_phone` vem
 * do aceite (ou da sincronização do trigger) e é o do motorista que está
 * mesmo na corrida. A cópia em `ride.driver.phone` é um retrato do momento em
 * que a app o escreveu, e numa corrida reatribuída pode ser de outra pessoa.
 */
export function contactosDaCorrida(input: {
  contacts: ContactosPrivados | null
  ride: Pick<RideInterface, 'user' | 'driver' | 'details'> | null
}): ContactosDaCorrida {
  const { contacts, ride } = input
  const detalhes = ride?.details as
    | {
        sender?: { phone?: string }
        receiver?: { phone?: string }
      }
    | undefined

  return {
    passageiro: escolhe(contacts?.passenger_phone, ride?.user?.phone),
    motorista: escolhe(contacts?.driver_phone, ride?.driver?.phone),
    remetente: escolhe(contacts?.sender_phone, detalhes?.sender?.phone),
    destinatario: escolhe(contacts?.receiver_phone, detalhes?.receiver?.phone)
  }
}

/** O que se mostra quando não há telefone nenhum. */
export const SEM_CONTACTO = 'Não disponível'

/** O texto do `title`, para quem passar o rato por cima. */
export function explicaOrigem(c: Contacto): string | undefined {
  if (!c.valor) return 'Não está nos contactos da corrida nem na cópia antiga.'
  if (c.origem === 'corrida') {
    return 'Copiado da corrida (anterior aos contactos privados) — pode estar velho.'
  }
  return undefined
}
