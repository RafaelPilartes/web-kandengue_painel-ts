import { describe, expect, it } from 'vitest'
import {
  closedFareV2,
  compareQuotedToCharged,
  failedReservation,
  fareDistance,
  hasReviewFlag,
  needsFareReview,
  promotionReservationMissing,
  signedDeviationPercent,
  hasAnyReviewFlag,
  reviewFlagLabel
} from '@/helpers/fareReview'
import type { RideEntity } from '@/core/entities/Ride'

const distance = {
  used_km: 8.4,
  source: 'tracked' as const,
  estimated_km: 4.2,
  tracked_km: 8.4,
  deviation_percent: 100,
  review_required: true
}

const fareV2 = {
  total: 4323,
  breakdown: {
    base_fare: 750,
    distance_cost: 1680,
    wait_cost: 0,
    subtotal: 2430,
    insurance_fee: 122,
    gross_amount: 2552
  },
  payouts: { driver_earnings: 1944, company_earnings: 364, pension_fund: 122 },
  distance
}

/** A V1 que as corridas anteriores ao motor de preços trazem do telefone. */
const fareV1 = {
  total: 3000,
  breakdown: {
    base_fare: 750,
    distance_cost: 2000,
    wait_cost: 0,
    insurance_fee: 150
  },
  payouts: { driver_earnings: 2400, company_earnings: 450, pension_fund: 150 }
}

const ride = (fare?: unknown) => ({ fare }) as Pick<RideEntity, 'fare'>

describe('closedFareV2', () => {
  it('devolve a tarifa quando é V2 fechada pelo servidor', () => {
    expect(closedFareV2(ride(fareV2))?.distance?.used_km).toBe(8.4)
  })

  it('devolve null para uma corrida sem tarifa', () => {
    expect(closedFareV2(ride(undefined))).toBeNull()
  })

  /*
   * O caso que importa: em produção coexistem as duas formas. Uma V1 não tem
   * `distance`, logo não pode estar em revisão — e tratá-la como V2 daria
   * `undefined` a atravessar o ecrã.
   */
  it('devolve null para uma tarifa V1, que não tem distance', () => {
    expect(closedFareV2(ride(fareV1))).toBeNull()
  })
})

describe('needsFareReview', () => {
  it('é verdade só quando o servidor marcou', () => {
    expect(needsFareReview(ride(fareV2))).toBe(true)
    expect(
      needsFareReview(
        ride({ ...fareV2, distance: { ...distance, review_required: false } })
      )
    ).toBe(false)
  })

  it('uma corrida sem tarifa ou com V1 nunca precisa de revisão', () => {
    expect(needsFareReview(ride(undefined))).toBe(false)
    expect(needsFareReview(ride(fareV1))).toBe(false)
  })
})

describe('fareDistance', () => {
  it('devolve o bloco da distância, ou null', () => {
    expect(fareDistance(ride(fareV2))).toEqual(distance)
    expect(fareDistance(ride(fareV1))).toBeNull()
  })
})

describe('signedDeviationPercent', () => {
  /*
   * O `deviation_percent` gravado é absoluto. Para quem revê, saber se se
   * cobrou a mais ou a menos é metade da informação — e era o que faltava.
   */
  it('é positivo quando se cobrou mais do que o estimado', () => {
    expect(signedDeviationPercent(distance)).toBe(100)
  })

  it('é negativo quando se cobrou menos', () => {
    expect(
      signedDeviationPercent({ ...distance, used_km: 2.1, tracked_km: 2.1 })
    ).toBe(-50)
  })

  it('é zero quando bate certo', () => {
    expect(
      signedDeviationPercent({ ...distance, used_km: 4.2, tracked_km: 4.2 })
    ).toBe(0)
  })

  it('arredonda a uma décima, como o resto do motor', () => {
    expect(
      signedDeviationPercent({ ...distance, used_km: 4.5, tracked_km: 4.5 })
    ).toBe(7.1)
  })

  it('devolve null quando a estimada é zero — não divide por zero', () => {
    expect(signedDeviationPercent({ ...distance, estimated_km: 0 })).toBeNull()
  })
})

// ─────────────── O cotado contra o cobrado ───────────────

/*
 * Os números reais da verificação de produção de 2026-10-05: 14,1 km cotados
 * em 3 752 Kz, com a RAFAEL11 (40%) a dar 1 501 de desconto e 2 251 a pagar.
 */
const COTADO_COM_DESCONTO = {
  gross: 3752,
  discount: 1501,
  total: 2251,
  breakdown: fareV2.breakdown,
  pricing: {} as never
}

/** Uma estimativa anterior à lib 2.10.0: só `total`, sem `gross` nem `discount`. */
const COTADO_LEGADO = {
  total: 3752,
  breakdown: fareV2.breakdown,
  pricing: {} as never
}

const cobrado = (over: Record<string, number> = {}) => ({
  ...fareV2,
  total: 2251,
  breakdown: { ...fareV2.breakdown, gross_amount: 3752, discount: 1501, ...over }
})

const corrida = (fare?: unknown, estimated_fare?: unknown) =>
  ({ fare, estimated_fare }) as Pick<RideEntity, 'fare' | 'estimated_fare'>

describe('compareQuotedToCharged', () => {
  it('sem tarifa V2 não há nada a comparar', () => {
    expect(compareQuotedToCharged(corrida(undefined))).toBeNull()
    expect(compareQuotedToCharged(corrida(fareV1))).toBeNull()
  })

  it('devolve os três números de cada lado', () => {
    const c = compareQuotedToCharged(
      corrida(cobrado(), COTADO_COM_DESCONTO)
    )

    expect(c?.quoted).toEqual({ gross: 3752, discount: 1501, total: 2251 })
    expect(c?.charged).toEqual({ gross: 3752, discount: 1501, total: 2251 })
    expect(c?.grossDelta).toBe(0)
    expect(c?.totalDelta).toBe(0)
    expect(c?.discountNotApplied).toBe(false)
  })

  /**
   * ⚠️ **O caso que esta fase resolve.** A cotação mostrou 1 501 de desconto
   * e o fecho não aplicou nenhum: o cliente pagou 3 752 em vez de 2 251. A
   * diferença aparecia como desvio de tarifa, e não é — o bruto bate.
   */
  it('reconhece a reserva falhada, e o bruto bate', () => {
    const c = compareQuotedToCharged(
      corrida(
        cobrado({ discount: 0 }),
        COTADO_COM_DESCONTO
      )
    )

    expect(c?.discountNotApplied).toBe(true)
    // O bruto é o mesmo: a tarifa não se desviou.
    expect(c?.grossDelta).toBe(0)
    // O que o cliente paga é que mudou.
    expect(c?.charged.total).toBe(2251)
  })

  it('um fecho sem o campo `discount` conta como desconto zero', () => {
    const semCampo = { ...cobrado().breakdown }
    delete (semCampo as { discount?: number }).discount
    const c = compareQuotedToCharged(
      corrida({ ...fareV2, total: 3752, breakdown: semCampo }, COTADO_COM_DESCONTO)
    )

    expect(c?.charged.discount).toBe(0)
    expect(c?.discountNotApplied).toBe(true)
  })

  it('sem desconto cotado não há reserva falhada nenhuma', () => {
    const c = compareQuotedToCharged(
      corrida(
        { ...fareV2, total: 3752, breakdown: { ...fareV2.breakdown, gross_amount: 3752 } },
        COTADO_LEGADO
      )
    )

    expect(c?.discountNotApplied).toBe(false)
    expect(c?.quoted).toEqual({ gross: 3752, discount: 0, total: 3752 })
  })

  /**
   * As corridas criadas antes da lib 2.10.0 têm `estimated_fare` com `total`
   * e mais nada. Nessas o total **é** o bruto — é o `resolveEstimatedFare`
   * que o resolve, e ler o campo à mão dava um desconto que não existe.
   */
  it('uma estimativa legada resolve-se pelo total', () => {
    const c = compareQuotedToCharged(
      corrida(
        { ...fareV2, total: 4000, breakdown: { ...fareV2.breakdown, gross_amount: 4000 } },
        COTADO_LEGADO
      )
    )

    expect(c?.quoted).toEqual({ gross: 3752, discount: 0, total: 3752 })
    expect(c?.grossDelta).toBe(248)
  })

  it('um desvio de tarifa a sério aparece no bruto, com sinal', () => {
    const c = compareQuotedToCharged(
      corrida(
        { ...fareV2, total: 5000, breakdown: { ...fareV2.breakdown, gross_amount: 5000 } },
        COTADO_COM_DESCONTO
      )
    )

    expect(c?.grossDelta).toBe(1248)
    expect(c?.discountNotApplied).toBe(true)
  })

  it('cobrou-se menos: o desvio do bruto é negativo', () => {
    const c = compareQuotedToCharged(
      corrida(
        { ...fareV2, total: 3000, breakdown: { ...fareV2.breakdown, gross_amount: 3000, discount: 1501 } },
        COTADO_COM_DESCONTO
      )
    )

    expect(c?.grossDelta).toBe(-752)
    expect(c?.discountNotApplied).toBe(false)
  })

  it('sem estimativa gravada mostra só o cobrado', () => {
    const c = compareQuotedToCharged(corrida(cobrado(), undefined))

    expect(c?.quoted).toBeNull()
    expect(c?.grossDelta).toBeNull()
    expect(c?.totalDelta).toBeNull()
    expect(c?.discountNotApplied).toBe(false)
    expect(c?.charged.total).toBe(2251)
  })

  /*
   * O recuo do `gross_amount`: é obrigatório na V2 e a app passageira
   * escreve-o sempre, mas uma corrida antiga pode tê-lo perdido. Sem o
   * recuo, o bruto saía `undefined` e atravessava o ecrã.
   */
  it('sem `gross_amount` o bruto é o total mais o desconto', () => {
    const semBruto = { ...cobrado().breakdown }
    delete (semBruto as { gross_amount?: number }).gross_amount
    const c = compareQuotedToCharged(
      corrida({ ...fareV2, total: 2251, breakdown: semBruto }, COTADO_COM_DESCONTO)
    )

    expect(c?.charged.gross).toBe(3752)
  })
})

describe('promotionReservationMissing', () => {
  const comPromo = (over: Record<string, string | undefined>) =>
    over as Pick<RideEntity, 'promotion_id' | 'promotion_usage_id'>

  it('é verdade com código e sem reserva', () => {
    expect(
      promotionReservationMissing(comPromo({ promotion_id: 'RAFAEL11' }))
    ).toBe(true)
  })

  it('é falso quando a reserva existe', () => {
    expect(
      promotionReservationMissing(
        comPromo({ promotion_id: 'RAFAEL11', promotion_usage_id: 'pu-1' })
      )
    ).toBe(false)
  })

  it('é falso numa corrida sem promoção', () => {
    expect(promotionReservationMissing(comPromo({}))).toBe(false)
  })

  /**
   * Cobre o caso que os números não apanham: uma promoção cujo desconto foi
   * bloqueado pelo `min_ride_value` reserva sem descontar, e uma reserva
   * falhada aí não deixa diferença nenhuma nos valores.
   */
  it('apanha a reserva falhada mesmo sem desconto nenhum em jogo', () => {
    expect(
      promotionReservationMissing(comPromo({ promotion_id: 'MINIMO' }))
    ).toBe(true)
  })
})

describe('hasReviewFlag', () => {
  const comMarcas = (review_flags?: string[]) =>
    ({ review_flags }) as Pick<RideEntity, 'review_flags'>

  it('encontra a marca que lá está', () => {
    expect(
      hasReviewFlag(
        comMarcas(['promotion_reservation_failed']),
        'promotion_reservation_failed'
      )
    ).toBe(true)
  })

  it('é falso sem o campo, e com o campo vazio', () => {
    expect(
      hasReviewFlag(comMarcas(undefined), 'promotion_reservation_failed')
    ).toBe(false)
    expect(hasReviewFlag(comMarcas([]), 'promotion_reservation_failed')).toBe(
      false
    )
  })

  /*
   * O array existe para acomodar outros motivos. Uma marca que este painel
   * ainda não conhece não pode fazer as outras desaparecer.
   */
  it('convive com marcas que este código não conhece', () => {
    expect(
      hasReviewFlag(
        comMarcas(['motivo_do_futuro', 'promotion_reservation_failed']),
        'promotion_reservation_failed'
      )
    ).toBe(true)
  })
})

describe('failedReservation', () => {
  const corridaMarcada = (over: Record<string, unknown>) =>
    over as Pick<
      RideEntity,
      'review_flags' | 'promotion_id' | 'promotion_usage_id'
    >

  it('é verdade pela marca do servidor', () => {
    expect(
      failedReservation(
        corridaMarcada({ review_flags: ['promotion_reservation_failed'] })
      )
    ).toBe(true)
  })

  /**
   * O recuo: as corridas criadas antes de a marca existir não a têm, e
   * apanham-se pela mesma assinatura que o trigger usa — sem backfill.
   */
  it('é verdade pelo recuo, numa corrida anterior à marca', () => {
    expect(
      failedReservation(corridaMarcada({ promotion_id: 'RAFAEL11' }))
    ).toBe(true)
  })

  it('é falso quando a reserva existe e não há marca', () => {
    expect(
      failedReservation(
        corridaMarcada({
          promotion_id: 'RAFAEL11',
          promotion_usage_id: 'pu-1'
        })
      )
    ).toBe(false)
  })

  it('é falso numa corrida sem promoção nenhuma', () => {
    expect(failedReservation(corridaMarcada({}))).toBe(false)
  })

  /*
   * A marca ganha ao recuo: uma corrida marcada pelo servidor conta mesmo que
   * tenha uma `promotion_usage_id` (uma reserva que depois se cancelou, por
   * exemplo). É o servidor que sabe porque a marcou.
   */
  it('a marca ganha mesmo com a reserva presente', () => {
    expect(
      failedReservation(
        corridaMarcada({
          review_flags: ['promotion_reservation_failed'],
          promotion_id: 'RAFAEL11',
          promotion_usage_id: 'pu-1'
        })
      )
    ).toBe(true)
  })
})

/**
 * As marcas do servidor na fila de revisão.
 *
 * ⚠️ **O que estes testes guardam é que acrescentar uma marca à lib nunca
 * parte o painel.** Um `Record<RideReviewFlag, string>` exaustivo obrigava a
 * uma entrada por marca, e com isso cada marca nova na lib passava a ser uma
 * alteração **major** — partia a compilação daqui. Com um mapa parcial e um
 * valor por defeito, a marca nova aparece com o nome cru e ninguém fica
 * bloqueado.
 */
describe('as marcas do servidor', () => {
  it('qualquer marca põe a corrida na fila', () => {
    for (const flag of [
      'promotion_reservation_failed',
      'driver_ended_early',
      'force_completed',
      'completed_location_mismatch',
      'fare_estimated_fallback'
    ]) {
      expect(hasAnyReviewFlag({ review_flags: [flag] } as never), flag).toBe(
        true
      )
    }
  })

  it('sem marcas, ou com a lista vazia, não entra por aqui', () => {
    expect(hasAnyReviewFlag({} as never)).toBe(false)
    expect(hasAnyReviewFlag({ review_flags: [] } as never)).toBe(false)
  })

  it('as cinco marcas de hoje têm etiqueta em português', () => {
    expect(reviewFlagLabel('force_completed')).toBe(
      'Fecho forçado por um admin'
    )
    expect(reviewFlagLabel('fare_estimated_fallback')).toBe(
      'Cobrada pela distância estimada'
    )
    expect(reviewFlagLabel('driver_ended_early')).toBe(
      'Terminada antes do destino'
    )
    expect(reviewFlagLabel('completed_location_mismatch')).toBe(
      'Posição final em desacordo com o percurso'
    )
    expect(reviewFlagLabel('promotion_reservation_failed')).toBe(
      'Promoção não reservada'
    )
  })

  /*
   * **O teste que torna a regra verdadeira.** Uma marca que a lib acrescente
   * amanhã, e que este painel nunca viu, mostra-se com o nome dela — não
   * rebenta, não desaparece, e não obriga a subir o painel ao mesmo tempo que
   * a lib.
   */
  it('uma marca desconhecida mostra-se com o nome cru', () => {
    expect(reviewFlagLabel('uma_marca_que_ainda_nao_existe')).toBe(
      'uma_marca_que_ainda_nao_existe'
    )
    expect(reviewFlagLabel('')).toBe('')
  })
})
