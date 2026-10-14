import { describe, expect, it } from 'vitest'
import {
  contactosDaCorrida,
  explicaOrigem,
  type ContactosPrivados
} from '../rideContacts'
import type { RideInterface } from '@/interfaces/IRide'

/**
 * Os telefones de uma corrida, e de onde vieram.
 *
 * ⚠️ **O que estes casos protegem é uma chamada telefónica.** O operador
 * precisa de falar com alguém, e as corridas anteriores à 3.2 não têm o
 * documento privado — se o painel lesse só um dos sítios, metade das corridas
 * ficava sem contacto nenhum.
 */
const corrida = (over: Record<string, unknown> = {}) =>
  ({
    user: { id: 'us-1', name: 'Ana', phone: '+244900000001' },
    driver: { id: 'dri-1', name: 'Bruno', phone: '+244900000002' },
    details: {
      sender: { name: 'Carlos', phone: '+244900000003' },
      receiver: { name: 'Dora', phone: '+244900000004' }
    },
    ...over
  }) as unknown as RideInterface

const privados: ContactosPrivados = {
  passenger_phone: '+244911111111',
  driver_phone: '+244922222222',
  sender_phone: '+244933333333',
  receiver_phone: '+244944444444'
}

describe('contactosDaCorrida', () => {
  /*
   * ⚠️ **O privado ganha, e a razão é concreta:** o `driver_phone` é escrito
   * pelo servidor no aceite, e o `ride.driver.phone` é o retrato do momento
   * em que a app o escreveu — numa corrida reatribuída pode ser de outra
   * pessoa.
   */
  it('o documento privado ganha à cópia da corrida', () => {
    const c = contactosDaCorrida({ contacts: privados, ride: corrida() })
    expect(c.passageiro).toEqual({ valor: '+244911111111', origem: 'privado' })
    expect(c.motorista).toEqual({ valor: '+244922222222', origem: 'privado' })
    expect(c.remetente.origem).toBe('privado')
    expect(c.destinatario.origem).toBe('privado')
  })

  // As corridas anteriores à 3.2 não têm o documento — e não migram (§0A).
  it('sem documento privado, recua para a corrida', () => {
    const c = contactosDaCorrida({ contacts: null, ride: corrida() })
    expect(c.passageiro).toEqual({ valor: '+244900000001', origem: 'corrida' })
    expect(c.motorista).toEqual({ valor: '+244900000002', origem: 'corrida' })
    expect(c.remetente.valor).toBe('+244900000003')
    expect(c.destinatario.valor).toBe('+244900000004')
  })

  // O caso real: o documento existe, mas o motorista ainda não aceitou.
  it('mistura os dois: o que falta no privado vem da corrida', () => {
    const c = contactosDaCorrida({
      contacts: { passenger_phone: '+244911111111' },
      ride: corrida()
    })
    expect(c.passageiro.origem).toBe('privado')
    expect(c.motorista).toEqual({ valor: '+244900000002', origem: 'corrida' })
  })

  it('sem telefone em sítio nenhum, di-lo em vez de mostrar vazio', () => {
    const c = contactosDaCorrida({
      contacts: null,
      ride: corrida({ driver: { id: 'dri-1', name: 'Bruno' }, details: {} })
    })
    expect(c.motorista).toEqual({ valor: null, origem: null })
    expect(c.destinatario).toEqual({ valor: null, origem: null })
  })

  // Um campo vazio ou com espaços não é um telefone.
  it('string vazia conta como ausente, e o recuo funciona', () => {
    const c = contactosDaCorrida({
      contacts: { driver_phone: '   ', passenger_phone: '' },
      ride: corrida()
    })
    expect(c.motorista).toEqual({ valor: '+244900000002', origem: 'corrida' })
    expect(c.passageiro).toEqual({ valor: '+244900000001', origem: 'corrida' })
  })

  it('uma corrida sem nada não rebenta', () => {
    const c = contactosDaCorrida({ contacts: null, ride: null })
    expect(c.passageiro.valor).toBeNull()
    expect(c.motorista.valor).toBeNull()
  })
})

describe('explicaOrigem', () => {
  it('avisa quando o telefone vem da cópia antiga', () => {
    expect(explicaOrigem({ valor: '+2449', origem: 'corrida' })).toMatch(
      /pode estar velho/
    )
  })

  it('não diz nada quando vem do documento privado', () => {
    expect(explicaOrigem({ valor: '+2449', origem: 'privado' })).toBeUndefined()
  })

  it('explica a ausência', () => {
    expect(explicaOrigem({ valor: null, origem: null })).toMatch(/nem na cópia/)
  })
})
