import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  testDb,
  assertEmulatorRunning,
  clearCollection
} from '@/test/firebase.emulator'

describe('emulador Firestore', () => {
  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection('__smoke')
  })

  it('escreve e lê um documento', async () => {
    await setDoc(doc(testDb, '__smoke/doc-1'), { name: 'Kandengue', n: 42 })

    const snap = await getDoc(doc(testDb, '__smoke/doc-1'))

    expect(snap.exists()).toBe(true)
    expect(snap.data()).toEqual({ name: 'Kandengue', n: 42 })
  })

  it('clearCollection apaga os documentos', async () => {
    await setDoc(doc(testDb, '__smoke/doc-2'), { a: 1 })
    await clearCollection('__smoke')

    const snap = await getDoc(doc(testDb, '__smoke/doc-2'))

    expect(snap.exists()).toBe(false)
  })
})
