import { describe, expect, it } from 'vitest'
import { ApiError, mapApiError, missingRequirements, semMarcacao } from '../apiError'

/**
 * O contrato de erro da API, do lado do painel.
 *
 * ⚠️ **A regra que isto guarda é a do §0A:** a `message` de uma validação ou
 * de um erro técnico **nunca** vai para um ecrã. Foi por um canal sem esta
 * separação que `body/code Code must contain only A-Z…` chegou ao ecrã de um
 * passageiro.
 */
const erro = (over: Partial<{
  message: string
  status: number | null
  code: string | null
  userMessage: string | null
  details: unknown
}> = {}) =>
  new ApiError(
    over.message ?? 'Validation error',
    over.status === undefined ? 400 : over.status,
    over.code ?? null,
    over.userMessage ?? null,
    over.details ?? null
  )

describe('mapApiError', () => {
  it('a `user_message` do negócio é a que se mostra, tal e qual', () => {
    expect(
      mapApiError(erro({ userMessage: 'Faltam requisitos para Moto Táxi.' }))
    ).toBe('Faltam requisitos para Moto Táxi.')
  })

  it('sem `user_message`, a frase é do estado — e nunca a técnica', () => {
    const tecnica = 'body/service Invalid enum value'
    expect(mapApiError(erro({ message: tecnica, status: 400 }))).not.toContain(
      'enum'
    )
    expect(mapApiError(erro({ status: 401 }))).toMatch(/sessão expirou/i)
    expect(mapApiError(erro({ status: 403 }))).toMatch(/permissão/i)
    expect(mapApiError(erro({ status: 409 }))).toMatch(/estado mudou/i)
    expect(mapApiError(erro({ status: 429 }))).toMatch(/pedidos/i)
    expect(mapApiError(erro({ status: 503 }))).toMatch(/servidor falhou/i)
  })

  it('sem resposta do servidor, di-lo', () => {
    expect(mapApiError(erro({ status: null }))).toMatch(/ligação/i)
  })

  // Um erro que não é da API (um `Error` do SDK do Firestore, por exemplo)
  // mantém a sua mensagem: aí ela é tudo o que há.
  it('um erro que não é `ApiError` passa a mensagem dele', () => {
    expect(mapApiError(new Error('permission-denied'))).toBe('permission-denied')
    expect(mapApiError(undefined, 'genérica')).toBe('genérica')
  })
})

describe('missingRequirements', () => {
  const comFalta = (missing: unknown) =>
    erro({ code: 'SERVICE_REQUIREMENTS_NOT_MET', details: { missing } })

  it('lê a lista do `details` da recusa', () => {
    const lista = [
      { key: 'insurance', label: 'Seguro', kind: 'document', detalhe: 'não foi submetido' },
      { key: 'extra_helmet', label: 'Capacete extra', kind: 'manual', detalhe: 'exige confirmação explícita' }
    ]
    expect(missingRequirements(comFalta(lista))).toEqual(lista)
  })

  it('outro erro qualquer não traz requisitos', () => {
    expect(missingRequirements(erro({ code: 'NOT_FOUND' }))).toEqual([])
    expect(missingRequirements(new Error('qualquer'))).toEqual([])
  })

  /*
   * ⚠️ **Não inventa nada.** Se uma versão mais nova da API mudar a forma do
   * `details`, o painel mostra a frase dela em vez de uma lista meia lida.
   */
  it('um `details` com outra forma devolve vazio', () => {
    for (const lixo of [null, {}, { missing: 'seguro' }, { missing: [1, 2] }]) {
      expect(missingRequirements(comFalta((lixo as { missing?: unknown })?.missing)), JSON.stringify(lixo)).toEqual([])
    }
  })

  it('filtra as entradas sem `key` ou `label`', () => {
    const r = missingRequirements(
      comFalta([{ key: 'insurance', label: 'Seguro' }, { key: 'x' }, {}])
    )
    expect(r).toHaveLength(1)
  })
})

describe('semMarcacao', () => {
  /*
   * A API escreve ênfase em markdown porque os mesmos textos vão para logs e
   * para respostas HTTP. O painel rende texto simples.
   */
  it('tira os asteriscos e as apóstrofes de código', () => {
    expect(semMarcacao('aprovado mas **caducado**')).toBe('aprovado mas caducado')
    expect(semMarcacao('a distância **estimada** da `cotação`')).toBe(
      'a distância estimada da cotação'
    )
  })

  it('um texto sem marcação fica igual', () => {
    expect(semMarcacao('não foi submetido')).toBe('não foi submetido')
  })
})
