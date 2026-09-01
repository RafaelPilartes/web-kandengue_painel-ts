import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { FirestoreDataConverter } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { AppendOnlyDAO } = await import('@/modules/Api/firebase/AppendOnlyDAO')
const { ReadOnlyDAO } = await import('@/modules/Api/firebase/ReadOnlyDAO')
const { AppError } = await import('@/domain/errors/AppError')

interface Fixture {
  id: string
  note: string
}

const converter: FirestoreDataConverter<Fixture> = {
  toFirestore(fixture) {
    return { ...fixture }
  },
  fromFirestore(snapshot, options) {
    return snapshot.data(options) as Fixture
  }
}

const APPEND_ONLY_COLLECTION = 'daoVariantsAppendOnly'
const READ_ONLY_COLLECTION = 'daoVariantsReadOnly'

class FixtureAppendOnlyDAO extends AppendOnlyDAO<Fixture> {
  constructor() {
    super(APPEND_ONLY_COLLECTION, converter, 'fx')
  }
}

class FixtureReadOnlyDAO extends ReadOnlyDAO<Fixture> {
  constructor() {
    super(READ_ONLY_COLLECTION, converter, 'fx')
  }
}

async function seed(collectionPath: string, id: string, note: string) {
  await setDoc(doc(testDb, `${collectionPath}/${id}`), { id, note })
}

describe('AppendOnlyDAO', () => {
  let dao: FixtureAppendOnlyDAO

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(APPEND_ONLY_COLLECTION)
    dao = new FixtureAppendOnlyDAO()
  })

  it('create funciona normalmente', async () => {
    const created = await dao.create({ note: 'primeira escrita' } as never)
    expect(created.note).toBe('primeira escrita')

    const found = await dao.getById(created.id)
    expect(found?.note).toBe('primeira escrita')
  })

  it('update lança AppError(failed-precondition) e não altera o registo', async () => {
    await seed(APPEND_ONLY_COLLECTION, 'fx-a', 'original')

    await expect(dao.update('fx-a', { note: 'alterado' } as never)).rejects.toThrow(
      AppError
    )
    await expect(
      dao.update('fx-a', { note: 'alterado' } as never)
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    // O que interessa: nada foi escrito — o registo continua como estava.
    const snap = await getDoc(doc(testDb, `${APPEND_ONLY_COLLECTION}/fx-a`))
    expect(snap.data()?.note).toBe('original')
  })

  it('delete lança AppError(failed-precondition) e não remove o registo', async () => {
    await seed(APPEND_ONLY_COLLECTION, 'fx-a', 'original')

    await expect(dao.delete('fx-a')).rejects.toThrow(AppError)
    await expect(dao.delete('fx-a')).rejects.toMatchObject({
      code: 'failed-precondition'
    })

    const snap = await getDoc(doc(testDb, `${APPEND_ONLY_COLLECTION}/fx-a`))
    expect(snap.exists()).toBe(true)
    expect(snap.data()?.note).toBe('original')
  })
})

describe('ReadOnlyDAO', () => {
  let dao: FixtureReadOnlyDAO

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(READ_ONLY_COLLECTION)
    dao = new FixtureReadOnlyDAO()
  })

  it('create lança AppError(failed-precondition) e não escreve nada', async () => {
    await expect(dao.create({ note: 'novo' } as never)).rejects.toThrow(
      AppError
    )
    await expect(dao.create({ note: 'novo' } as never)).rejects.toMatchObject({
      code: 'failed-precondition'
    })

    const all = await dao.getAll()
    expect(all.data).toHaveLength(0)
  })

  it('update lança AppError(failed-precondition) e não altera o registo', async () => {
    await seed(READ_ONLY_COLLECTION, 'fx-b', 'original')

    await expect(dao.update('fx-b', { note: 'alterado' } as never)).rejects.toThrow(
      AppError
    )
    await expect(
      dao.update('fx-b', { note: 'alterado' } as never)
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    const snap = await getDoc(doc(testDb, `${READ_ONLY_COLLECTION}/fx-b`))
    expect(snap.data()?.note).toBe('original')
  })

  it('delete lança AppError(failed-precondition) e não remove o registo', async () => {
    await seed(READ_ONLY_COLLECTION, 'fx-b', 'original')

    await expect(dao.delete('fx-b')).rejects.toThrow(AppError)
    await expect(dao.delete('fx-b')).rejects.toMatchObject({
      code: 'failed-precondition'
    })

    const snap = await getDoc(doc(testDb, `${READ_ONLY_COLLECTION}/fx-b`))
    expect(snap.exists()).toBe(true)
    expect(snap.data()?.note).toBe('original')
  })
})
