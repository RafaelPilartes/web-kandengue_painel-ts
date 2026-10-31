/*
 * Service worker do push do painel.
 *
 * ── Porque é que a configuração vem no URL ──
 * Um service worker não passa pelo Vite: é servido tal e qual da raiz, e por
 * isso não tem `import.meta.env`. As alternativas eram escrever a
 * configuração aqui em literal — e então este ficheiro teria de ser gerado na
 * build, ou teria valores commitados que divergem do `.env` sem ninguém dar
 * por isso — ou recebê-la de quem o regista. É o que se faz: o painel regista
 * `/firebase-messaging-sw.js?apiKey=…&projectId=…`, e isto lê os parâmetros.
 *
 * Uma mudança na configuração passa a chegar aqui sozinha, e o repositório
 * não guarda nenhuma cópia que possa ficar velha.
 *
 * ── Porque é que tem de estar na raiz ──
 * O Firebase procura-o exactamente em `/firebase-messaging-sw.js`. Num
 * subdirectório, `getToken` falha com um erro que não diz isso.
 *
 * ⚠️ Não está em TypeScript nem passa pelo bundler, de propósito. Mudá-lo
 * obriga a subir o painel outra vez, e os browsers só o trocam no `update`
 * seguinte.
 */
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'
)
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js'
)

const params = new URL(self.location.href).searchParams
const config = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
}

/*
 * Sem configuração não se inicializa nada. Acontece quando o browser reavalia
 * o worker sem os parâmetros; inicializar com `null` rebentaria aqui dentro,
 * onde ninguém vê o erro.
 */
if (config.projectId && config.messagingSenderId) {
  firebase.initializeApp(config)
  const messaging = firebase.messaging()

  /*
   * Com um bloco `notification` no envio, o browser desenha a notificação
   * sozinho e este handler só trata do que vem em `data`. Desenhar outra aqui
   * daria DUAS por cada push.
   */
  messaging.onBackgroundMessage(payload => {
    if (payload.notification) return
    const { title, body, path } = payload.data ?? {}
    if (!title) return
    self.registration.showNotification(title, {
      body: body ?? '',
      icon: '/logo/favicon.png',
      badge: '/logo/favicon.png',
      data: { path: path ?? '/' }
    })
  })
}

/** Um clique abre o separador do painel que já esteja aberto, se houver. */
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const path =
    event.notification.data?.path ??
    event.notification.data?.FCM_MSG?.data?.path ??
    '/'
  const url = new URL(path, self.location.origin).href

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        for (const client of clients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      })
  )
})
