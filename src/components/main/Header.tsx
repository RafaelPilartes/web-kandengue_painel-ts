import {
  AlignLeft,
  AlignRight,
  DoorOpen,
  Maximize,
  ScrollText,
  User
} from 'lucide-react'
import { useContext } from 'react'
import { AppContext } from '../../provider/AppProvider'
import { DropdownUser } from '../DropdownUser'
import { useAdminStore } from '../../stores/userStore'
import DarkModeSwitcher from './DarkModeSwitcher'
import { Link } from 'react-router-dom'
import { useAccess } from '@/hooks/useAccess'
import { NotificationBell } from './NotificationBell'
import { routsNameMain } from '../../constants/routsName'
import { Chat } from 'phosphor-react'
import { auditService } from '@/observability/audit'
import { useAuthViewModel } from '@/viewModels/AuthViewModel'
import { showToast } from '@/utils/toasts'
import { forgetPushToken } from '@/lib/webPush'
import { adminAccessDAO } from '@/modules/Api/rest/adminAccess.dao'

export const Header = () => {
  const { can } = useAccess()
  const { currentAdminData } = useAdminStore()

  const { menuIsVisible, setMenuIsVisible } = useContext(AppContext)

  const { logout } = useAuthViewModel()

  const logOut = async () => {
    await auditService.logLogout()

    /*
     * This browser stops receiving push BEFORE the session goes. On a shared
     * machine the token outlived the admin: their notifications — with their
     * task titles — were drawn over the next person's session, who saw
     * "Desligar as notificações neste dispositivo" without ever having turned
     * them on and never got their own.
     */
    await forgetPushToken(adminAccessDAO.unregisterDevice)

    try {
      // O signOut dispara onAuthChanged(null), e o useAuthSessionSync limpa o
      // store e a cache. Não limpar aqui à mão: se o signOut falhar, a sessão
      // do Firebase continua viva, e limpar localmente recriava exactamente a
      // dessincronização que este plano corrige.
      await logout()
    } catch {
      showToast('error', 'Não foi possível terminar a sessão. Tenta de novo.')
    }
  }

  const options = [
    {
      icon: <User />,
      label: `${currentAdminData?.name}`,
      onCLick: () => null
    },
    {
      icon: <DoorOpen />,
      label: 'Sair',
      onCLick: logOut
    }
  ]
  const useInfo = {
    photo:
      currentAdminData?.photo ||
      'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png',
    name: `${currentAdminData?.name}`,
    function: 'User'
  }

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }

  return (
    <>
      {/*
       * Not `fixed` any more: `RootLayout` pins the header and the navigation
       * together, as one bar, and reserves its MEASURED height. Two separately
       * fixed elements plus a constant margin is what let the navigation grow
       * over the page.
       */}
      <header className="h-20 w-full font-semibold bg-light dark:bg-dark border-b-[1px] border-gray-200 dark:border-gray-700">
        {/* Container */}
        <div className="h-20 py-4 container flex items-center justify-between ">
          <div className="flex items-center justify-center gap-4">
            {/* Menu Button */}
            <div className="flex items-center justify-center gap-4 min-w-s-1120:hidden">
              <button
                onClick={() => setMenuIsVisible(!menuIsVisible)}
                className="text-baseTxtDark dark:text-baseTxtLight"
              >
                {menuIsVisible && <AlignLeft />}
                {!menuIsVisible && <AlignRight />}
              </button>
            </div>

            <Link to={routsNameMain.home}>
              <img
                src="/logo/logo.png"
                alt="Kandengue Atrevido"
                className="max-w-[10rem] max-w-s-640:max-w-[7rem]"
              />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4 max-w-s-640:gap-2">
            <div className="flex items-center justify-center gap-4 border-r-[2px] pr-6 border-gray-200 dark:border-zinc-400/60 max-w-s-640:border-0 max-w-s-640:pr-0">
              {/* <!-- Dark Mode Toggler --> */}
              <DarkModeSwitcher />
              {/* <!-- Dark Mode Toggler --> */}
            </div>

            <div className="flex items-center justify-center gap-4">
              <Link
                to={routsNameMain.chat.index}
                className="max-w-s-640:hidden w-10 h-10  bg-gray-100/40 dark:bg-gray-500/60 border border-gray-200/30 dark:border-gray-500/60 rounded-full flex items-center justify-center transition-all duration-300 hover:text-primary-200 p-2 "
              >
                <Chat size={20} />
              </Link>

              {can('view_audit_logs') && (
                <Link
                  to={routsNameMain.logs.index}
                  title="Logs de Auditoria"
                  className="max-w-s-640:hidden w-10 h-10  bg-gray-100/40 dark:bg-gray-500/60 border border-gray-200/30 dark:border-gray-500/60 rounded-full flex items-center justify-center transition-all duration-300 hover:text-primary-200 p-2 "
                >
                  <ScrollText size={20} />
                </Link>
              )}

              <button
                onClick={toggleFullScreen}
                className="max-w-s-640:hidden w-10 h-10  bg-gray-100/40 dark:bg-gray-500/60 border border-gray-200/30 dark:border-gray-500/60 rounded-full flex items-center justify-center transition-all duration-300 hover:text-primary-200 p-2 "
              >
                <Maximize size={20} />
              </button>

              <NotificationBell />

              <DropdownUser user={useInfo} options={options} />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
