import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { adminAccessDAO } from '@/modules/Api/rest/adminAccess.dao'
import {
  enablePush,
  onPushWhileOpen,
  permissionState,
  pushIsConfigured,
  pushIsSupported
} from '@/lib/webPush'
import { showToast } from '@/utils/toasts'

/** Where the token of THIS browser is remembered, so it can be unregistered. */
const TOKEN_KEY = 'kandengue-push-token'

export type PushState =
  | 'unsupported'
  | 'unconfigured'
  | 'default'
  | 'granted'
  | 'denied'

/**
 * Browser push for the signed-in admin.
 *
 * ⚠️ `enable` must be called from a user gesture. A permission prompt without
 * one is refused by default in most browsers and, worse, STAYS refused —
 * Chrome does not ask again and the person has to go into the site settings.
 * That is why nothing here runs on mount except the foreground listener.
 */
export function useWebPush() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<PushState>(() => read())
  const [isWorking, setIsWorking] = useState(false)

  function read(): PushState {
    if (!pushIsSupported()) return 'unsupported'
    if (!pushIsConfigured()) return 'unconfigured'
    const permission = permissionState()
    return permission === 'unsupported' ? 'unsupported' : permission
  }

  /*
   * A push that arrives with the tab in front draws nothing by itself — the
   * browser only draws the background ones. Re-reading the bell is what makes
   * it appear, and it is where the notification already is.
   */
  useEffect(() => {
    return onPushWhileOpen(() => {
      queryClient.invalidateQueries({ queryKey: ['work-notifications'] })
    })
  }, [queryClient])

  const enable = useCallback(async () => {
    setIsWorking(true)
    try {
      const token = await enablePush()
      if (!token) {
        setState(read())
        showToast(
          'error',
          Notification.permission === 'denied'
            ? 'As notificações estão bloqueadas para este site. Tem de as permitir nas definições do browser.'
            : 'Não foi possível activar as notificações neste browser.'
        )
        return
      }
      await adminAccessDAO.registerDevice(token)
      localStorage.setItem(TOKEN_KEY, token)
      setState('granted')
      showToast('success', 'Notificações activadas neste dispositivo.')
    } catch (error) {
      showToast('error', (error as Error).message)
    } finally {
      setIsWorking(false)
    }
  }, [])

  const disable = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    setIsWorking(true)
    try {
      await adminAccessDAO.unregisterDevice(token)
      localStorage.removeItem(TOKEN_KEY)
      showToast('success', 'Este dispositivo deixa de receber notificações.')
    } catch (error) {
      showToast('error', (error as Error).message)
    } finally {
      setIsWorking(false)
      /*
       * The permission itself stays granted: only the browser's settings can
       * take it back. What changes is that the API has no token for it.
       */
      setState(read())
    }
  }, [])

  const isRegistered =
    state === 'granted' && !!localStorage.getItem(TOKEN_KEY)

  return { state, isRegistered, isWorking, enable, disable }
}
