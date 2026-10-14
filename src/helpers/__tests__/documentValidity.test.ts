import { describe, expect, it } from 'vitest'
import {
  diaEmLuanda,
  estaCaducado,
  fimDoDiaEmLuanda,
  rotuloValidade
} from '../documentValidity'

/**
 * A validade de um documento.
 *
 * ⚠️ **O que estes casos protegem é um dia de trabalho de um motorista.** Um
 * `<input type='date'>` devolve `'2027-03-31'` e um `new Date(valor)` faz
 * disso a meia-noite UTC; a lib compara instantes, por isso a apólice
 * 'válida até 31/03' caducava às 00:00:01 do dia 31. Angola é UTC+1.
 */
describe('fimDoDiaEmLuanda', () => {
  it('devolve o último instante do dia escolhido, na hora de Luanda', () => {
    const d = fimDoDiaEmLuanda('2027-03-31')
    // 23:59:59.999 em Luanda (UTC+1) são 22:59:59.999 UTC do mesmo dia.
    expect(d?.toISOString()).toBe('2027-03-31T22:59:59.999Z')
  })

  it('o dia escolhido conta todo, e o seguinte não', () => {
    const limite = fimDoDiaEmLuanda('2026-10-14') as Date
    // Meio-dia em Luanda no dia 14: ainda vale.
    const meioDia14 = new Date('2026-10-14T11:00:00Z')
    expect(limite.getTime() > meioDia14.getTime()).toBe(true)
    // Uma da manhã em Luanda do dia 15 (= 00:00Z do dia 15): já não.
    const madrugada15 = new Date('2026-10-15T00:00:00Z')
    expect(limite.getTime() > madrugada15.getTime()).toBe(false)
  })

  it('uma data que o calendário não tem não é validade', () => {
    for (const valor of ['2026-02-31', '2026-13-01', '2026-00-10']) {
      expect(fimDoDiaEmLuanda(valor), valor).toBeNull()
    }
  })

  it('lixo à entrada devolve null, não uma data inventada', () => {
    for (const valor of ['', '  ', '31/03/2027', '2027-3-1', 'amanhã']) {
      expect(fimDoDiaEmLuanda(valor), valor).toBeNull()
    }
  })

  // Ida e volta: o que se grava mostra-se como o dia que o admin escolheu.
  it('o dia volta inteiro no `diaEmLuanda`', () => {
    for (const dia of ['2026-10-14', '2027-01-01', '2026-12-31']) {
      expect(diaEmLuanda(fimDoDiaEmLuanda(dia) as Date), dia).toBe(dia)
    }
  })
})

describe('estaCaducado', () => {
  const agora = new Date('2026-10-14T12:00:00Z')

  it('sem validade, nunca caduca', () => {
    expect(estaCaducado({}, agora)).toBe(false)
    expect(estaCaducado({ expires_at: undefined }, agora)).toBe(false)
  })

  it('usa a mesma comparação da lib: `expires_at > now`', () => {
    expect(
      estaCaducado({ expires_at: new Date('2026-10-14T12:00:01Z') }, agora)
    ).toBe(false)
    expect(estaCaducado({ expires_at: agora }, agora)).toBe(true)
    expect(
      estaCaducado({ expires_at: new Date('2026-10-14T11:59:59Z') }, agora)
    ).toBe(true)
  })

  /*
   * ⚠️ O caso que a conversão existe para evitar: a meia-noite do próprio dia
   * conta como caducada. É o que acontece a quem grave a data crua.
   */
  it('a meia-noite do dia conta como caducada — e o fim do dia não', () => {
    expect(
      estaCaducado({ expires_at: new Date('2026-10-14T00:00:00Z') }, agora)
    ).toBe(true)
    expect(
      estaCaducado(
        { expires_at: fimDoDiaEmLuanda('2026-10-14') as Date },
        agora
      )
    ).toBe(false)
  })
})

describe('rotuloValidade', () => {
  const agora = new Date('2026-10-14T12:00:00Z')

  it('diz o dia, e se já passou', () => {
    expect(
      rotuloValidade(
        { expires_at: fimDoDiaEmLuanda('2027-03-31') as Date },
        agora
      )
    ).toEqual({
      texto: 'válido até 2027-03-31',
      caducado: false
    })
    expect(
      rotuloValidade(
        { expires_at: fimDoDiaEmLuanda('2026-01-05') as Date },
        agora
      )
    ).toEqual({
      texto: 'caducou 2026-01-05',
      caducado: true
    })
  })

  it('sem validade, di-lo em vez de inventar uma data', () => {
    expect(rotuloValidade({}, agora)).toEqual({
      texto: 'sem validade',
      caducado: false
    })
  })
})
