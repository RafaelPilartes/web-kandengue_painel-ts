import { initializeApp, deleteApp, getApps } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import {
  initializeFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

const PROJECT_ID = 'kandengue-atrevido-5740d'
const EMULATOR_HOST = '127.0.0.1'
const EMULATOR_PORT = 8090

const APP_NAME = 'kandengue-painel-tests'

function createApp(): FirebaseApp {
  const existing = getApps().find(a => a.name === APP_NAME)
  if (existing) return existing
  return initializeApp(
    { projectId: PROJECT_ID, apiKey: 'emulator-fake-key' },
    APP_NAME
  )
}

const app = createApp()

// ignoreUndefinedProperties espelha o que a config de produção passará a ter,
// para que os testes exercitem o mesmo comportamento de escrita.
export const testDb: Firestore = initializeFirestore(app, {
  ignoreUndefinedProperties: true
})

connectFirestoreEmulator(testDb, EMULATOR_HOST, EMULATOR_PORT)

const START_HINT =
  `Arranca o emulador com:\n` +
  `  firebase emulators:start --only firestore --project ${PROJECT_ID}\n` +
  `a partir de uma pasta cujo firebase.json declare a porta ${EMULATOR_PORT}.`

/**
 * Falha com uma mensagem accionável se o emulador não estiver a correr.
 * Sem isto, o erro é um timeout opaco de 20s.
 */
export async function assertEmulatorRunning(): Promise<void> {
  let body: string
  try {
    const res = await fetch(`http://${EMULATOR_HOST}:${EMULATOR_PORT}/`)
    body = (await res.text()).trim()
  } catch (err) {
    throw new Error(
      `Emulador Firestore inacessível em ${EMULATOR_HOST}:${EMULATOR_PORT}.\n` +
        `${START_HINT}\nCausa: ${(err as Error).message}`
    )
  }

  // O emulador Firestore responde exactamente "Ok" na raiz. Qualquer dev
  // server também devolve HTTP 200 — por isso valida-se o CORPO e não o
  // status, ou uma porta ocupada por outro processo passa por emulador.
  if (body !== 'Ok') {
    throw new Error(
      `A porta ${EMULATOR_PORT} está ocupada por outro serviço, não pelo ` +
        `emulador Firestore (resposta: "${body.slice(0, 60)}").\n${START_HINT}`
    )
  }
}

/** Apaga todos os documentos de uma colecção. Usar em beforeEach. */
export async function clearCollection(path: string): Promise<void> {
  const snap = await getDocs(collection(testDb, path))
  if (snap.empty) return
  const batch = writeBatch(testDb)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

/** Liberta a app do Firebase. Usar em afterAll do último ficheiro, se necessário. */
export async function destroyTestApp(): Promise<void> {
  await deleteApp(app)
}
