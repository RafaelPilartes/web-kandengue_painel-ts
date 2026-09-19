import { connectFirestoreEmulator } from 'firebase/firestore'
import { connectAuthEmulator } from 'firebase/auth'
import { connectStorageEmulator } from 'firebase/storage'
import { db, auth, storage } from '@/config/firebase.config'

/**
 * Liga o painel aos emuladores locais.
 *
 * Importado por `main.tsx`, e por isso corre antes de tudo o resto.
 *
 * ── Porque é que isto grita ──
 * O emulador é carregado de um export de produção: as contas têm o MESMO
 * uid e o MESMO email, e o token que ele emite traz o mesmo `aud`. Um
 * ecrã ligado ao emulador é indistinguível de um ligado à produção — até
 * alguma coisa divergir, e aí perde-se muito tempo a procurar no sítio
 * errado. Aconteceu: um login recusado porque as custom claims tinham
 * sido gravadas em produção e o painel lia do emulador.
 *
 * ── Porque é que o default é o emulador ──
 * Em desenvolvimento, apontar para produção por engano é pior do que o
 * contrário: escreve-se em dados reais. Por isso liga-se sozinho em DEV,
 * e quem quiser produção tem de o dizer explicitamente.
 */
const querProducao = import.meta.env.VITE_USE_EMULATOR === 'false'
const ligar = import.meta.env.DEV && !querProducao

if (ligar) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectStorageEmulator(storage, 'localhost', 9199)

  console.info(
    '%c[firebase] EMULADOR LOCAL',
    'background:#b45309;color:#fff;padding:2px 6px;border-radius:3px',
    '\n  Firestore → localhost:8080' +
      '\n  Auth      → localhost:9099' +
      '\n  Storage   → localhost:9199' +
      '\n\n  As contas e os dados são os do emulador, não os reais — mesmo' +
      '\n  que o uid e o email sejam iguais aos de produção.' +
      '\n  Para usar produção: VITE_USE_EMULATOR=false no .env'
  )
} else if (import.meta.env.DEV) {
  console.info(
    '%c[firebase] PRODUÇÃO',
    'background:#b91c1c;color:#fff;padding:2px 6px;border-radius:3px',
    '\n  VITE_USE_EMULATOR=false — está a escrever em dados REAIS.'
  )
}
