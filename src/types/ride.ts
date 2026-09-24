export type RideDetailsType = {
  receiver: {
    name: string
    phone: string
  }
  item: {
    type: string
    description: string
    quantity: number
    size: 'small' | 'medium' | 'large'
    weight?: number // opcional (kg)
  }
}

/**
 * Estes tipos vivem agora em `@rafaelpilartes/kandengue-shared/ride`.
 *
 * Estavam copiados a mao aqui e nas duas apps — identicos nos tres, e
 * portanto tres sitios para manter a mesma coisa. Re-exporta-se em vez de
 * mudar os imports: quem ja importava daqui continua a importar daqui, e a
 * fonte de verdade passa a ser uma so.
 */
export type {
  RateType,
  PayoutsType,
  LiveLocationType
} from '@rafaelpilartes/kandengue-shared/ride'
