/**
 * Vive agora em `@rafaelpilartes/kandengue-shared/id`.
 *
 * Usava `crypto.randomUUID().slice(0, 8)`; a lib usa `getRandomValues`, que
 * existe nos tres ambientes. Mesmo formato, mesmos 32 bits.
 */
export { generateId } from '@rafaelpilartes/kandengue-shared/id'
