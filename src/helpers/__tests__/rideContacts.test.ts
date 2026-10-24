import { describe, expect, it } from 'vitest'
import {
  explainSource,
  type PrivateContacts,
  rideContacts
} from '../rideContacts'
import type { RideInterface } from '@/interfaces/IRide'

/**
 * The phone numbers of a ride, and where they came from.
 *
 * ⚠️ **What these cases protect is a phone call.** The operator needs to reach
 * someone, and rides older than 3.2 have no private document — if the panel
 * read only one of the two places, half the rides would show no contact at
 * all.
 */
const aRide = (over: Record<string, unknown> = {}) =>
  ({
    user: { id: 'us-1', name: 'Ana', phone: '+244900000001' },
    driver: { id: 'dri-1', name: 'Bruno', phone: '+244900000002' },
    details: {
      sender: { name: 'Carlos', phone: '+244900000003' },
      receiver: { name: 'Dora', phone: '+244900000004' }
    },
    ...over
  }) as unknown as RideInterface

const privateContacts: PrivateContacts = {
  passenger_phone: '+244911111111',
  driver_phone: '+244922222222',
  sender_phone: '+244933333333',
  receiver_phone: '+244944444444'
}

describe('rideContacts', () => {
  /*
   * ⚠️ **The private document wins, for a concrete reason:** `driver_phone` is
   * written by the server on accept, while `ride.driver.phone` is the snapshot
   * of the moment the app wrote it — on a reassigned ride it may belong to
   * someone else.
   */
  it('prefers the private document over the copy in the ride', () => {
    const c = rideContacts({ contacts: privateContacts, ride: aRide() })
    expect(c.passenger).toEqual({ value: '+244911111111', source: 'private' })
    expect(c.driver).toEqual({ value: '+244922222222', source: 'private' })
    expect(c.sender.source).toBe('private')
    expect(c.receiver.source).toBe('private')
  })

  // Rides older than 3.2 have no document — and are not migrated (§0A).
  /*
   * ⚠️ **Virou de sentido a 2026-10-24.** Só o motorista recua para o
   * documento da corrida: a API deixou de escrever `user.phone`,
   * `details.sender.phone` e `details.receiver.phone`, e o script de remoção
   * copia o que falta para `private/contacts` antes de apagar. O
   * `ride.driver.phone` **continua** a ser escrito, e é o único recuo que
   * resta.
   */
  it('only the driver falls back to the ride; the rest come from the private doc', () => {
    const c = rideContacts({ contacts: null, ride: aRide() })
    expect(c.driver).toEqual({ value: '+244900000002', source: 'ride' })
    expect(c.passenger.value).toBeNull()
    expect(c.sender.value).toBeNull()
    expect(c.receiver.value).toBeNull()
  })

  // The real case: the document exists, but no driver has accepted yet.
  it('mixes both: what the private document lacks comes from the ride', () => {
    const c = rideContacts({
      contacts: { passenger_phone: '+244911111111' },
      ride: aRide()
    })
    expect(c.passenger.source).toBe('private')
    expect(c.driver).toEqual({ value: '+244900000002', source: 'ride' })
  })

  it('says so when there is no phone anywhere, instead of showing blank', () => {
    const c = rideContacts({
      contacts: null,
      ride: aRide({ driver: { id: 'dri-1', name: 'Bruno' }, details: {} })
    })
    expect(c.driver).toEqual({ value: null, source: null })
    expect(c.receiver).toEqual({ value: null, source: null })
  })

  // An empty or whitespace-only field is not a phone number.
  it('treats an empty string as absent — and only the driver has a fallback', () => {
    const c = rideContacts({
      contacts: { driver_phone: '   ', passenger_phone: '' },
      ride: aRide()
    })
    expect(c.driver).toEqual({ value: '+244900000002', source: 'ride' })
    expect(c.passenger.value).toBeNull()
  })

  it('survives a ride with nothing in it', () => {
    const c = rideContacts({ contacts: null, ride: null })
    expect(c.passenger.value).toBeNull()
    expect(c.driver.value).toBeNull()
  })
})

describe('explainSource', () => {
  it('warns when the number came from the old copy', () => {
    expect(explainSource({ value: '+2449', source: 'ride' })).toMatch(
      /pode estar velho/
    )
  })

  it('says nothing when it came from the private document', () => {
    expect(explainSource({ value: '+2449', source: 'private' })).toBeUndefined()
  })

  it('explains the absence', () => {
    expect(explainSource({ value: null, source: null })).toMatch(/nem na cópia/)
  })
})
