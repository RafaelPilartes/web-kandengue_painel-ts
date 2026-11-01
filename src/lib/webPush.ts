import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import type { Messaging } from 'firebase/messaging'
import { app, firebaseConfig } from '@/config/firebase.config'

/**
 * Push do browser para o painel.
 *
 * ── O que é preciso, e o que acontece sem isso ──
 * A `VITE_FIREBASE_VAPID_KEY` é a chave pública de Web Push do projecto, que
 * se gera uma vez na consola do Firebase. Sem ela, `getToken` não devolve
 * token nenhum — por isso o painel não oferece o botão em vez de o oferecer e
 * falhar.
 *
 * ── Porque é que a permissão não se pede ao abrir ──
 * Um pedido de permissão sem um gesto é recusado por omissão em quase todos os
 * browsers e, pior, fica recusado: o Chrome não volta a perguntar e a pessoa
 * tem de ir às definições do site. Por isso só se pede quando alguém carrega
 * no botão.
 */
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

/** O push só existe onde há service worker, Notification e PushManager. */
export function pushIsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window &&
    'PushManager' in window
  )
}

export function pushIsConfigured(): boolean {
  return !!VAPID_KEY
}

export function permissionState(): NotificationPermission | 'unsupported' {
  if (!pushIsSupported()) return 'unsupported'
  return Notification.permission
}

/*
 * A configuração viaja no URL do worker: ele não passa pelo Vite e não tem
 * `import.meta.env`. Ver o comentário no próprio ficheiro.
 */
function workerUrl(): string {
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey ?? '',
    authDomain: firebaseConfig.authDomain ?? '',
    projectId: firebaseConfig.projectId ?? '',
    storageBucket: firebaseConfig.storageBucket ?? '',
    messagingSenderId: firebaseConfig.messagingSenderId ?? '',
    appId: firebaseConfig.appId ?? ''
  })
  return `/firebase-messaging-sw.js?${params.toString()}`
}

let messagingInstance: Messaging | null = null
function messaging(): Messaging {
  if (!messagingInstance) messagingInstance = getMessaging(app)
  return messagingInstance
}

/**
 * Pede a permissão e devolve o token deste browser, ou `null`.
 *
 * ⚠️ Chamar só a partir de um gesto do utilizador.
 */
export async function enablePush(): Promise<string | null> {
  if (!pushIsSupported() || !VAPID_KEY) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.register(workerUrl())
  const token = await getToken(messaging(), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration
  })
  return token || null
}

/**
 * Mensagens que chegam com o separador em primeiro plano.
 *
 * O browser NÃO desenha nada neste caso — é por isso que isto existe: sem ele,
 * um push que chega com o painel aberto não dá sinal nenhum. Aqui serve para
 * voltar a ler o sino, que é onde a notificação já está.
 */
export function onPushWhileOpen(handler: () => void): () => void {
  if (!pushIsSupported() || !VAPID_KEY) return () => {}
  return onMessage(messaging(), () => handler())
}

/**
 * Tira este browser do push, ao terminar a sessão.
 *
 * ⚠️ Existe por causa de um browser partilhado. Sem isto, o token de quem
 * saiu continua registado: as notificações dele — com os títulos das tarefas
 * dele — passavam a ser desenhadas por cima da sessão da pessoa seguinte, que
 * via "Desligar as notificações neste dispositivo" sem nunca as ter ligado e
 * nunca recebia as suas.
 *
 * Nunca lança: terminar sessão não pode falhar porque a API não respondeu.
 */
export async function forgetPushToken(
  unregister: (token: string) => Promise<unknown>
): Promise<void> {
  try {
    const token = localStorage.getItem('kandengue-push-token')
    if (!token) return
    localStorage.removeItem('kandengue-push-token')
    await unregister(token)
  } catch {
    // Já saiu; o token morre sozinho na primeira falha de envio.
  }
}
