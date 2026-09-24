

/**
 * Os tipos acima vivem agora em `@rafaelpilartes/kandengue-shared/geo`.
 *
 * Eram identicos nos tres repositorios — verificado simbolo a simbolo, com
 * os membros das unioes ordenados. Re-exportam-se daqui para os imports
 * existentes continuarem a funcionar.
 */
export type {
  GeoLocationType,
  LocationType
} from '@rafaelpilartes/kandengue-shared/geo'
