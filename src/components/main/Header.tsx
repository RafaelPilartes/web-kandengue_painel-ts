import {
  AlignLeft,
  AlignRight,
  Bell,
  DoorOpen,
  Maximize,
  User
} from 'lucide-react'
import { useContext } from 'react'
import { AppContext } from '../../provider/AppProvider'
import { DropdownUser } from '../DropdownUser'
import { useUserStore } from '../../stores/userStore'
import DarkModeSwitcher from './DarkModeSwitcher'
import { Link } from 'react-router-dom'
import { routsNameMain } from '../../data/routsName'
import { DropdownInfo } from '../DropdownInfo'
import { Chat } from 'phosphor-react'

export const Header = () => {
  const { currentUserData, removeUser } = useUserStore()

  const { menuIsVisible, setMenuIsVisible } = useContext(AppContext)

  const logOut = () => {
    removeUser()
  }

  const options = [
    {
      icon: <User />,
      label: `${currentUserData?.name}`,
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
      currentUserData?.photo ||
      'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png',
    name: `${currentUserData?.name}`,
    function: 'User'
  }
  const notificationList = [
    {
      photo:
        'https://www.shutterstock.com/image-vector/illustration-church-bell-isolated-on-600nw-2513620643.jpg',
      title: 'Sistema iniciado com sucesso',
      link: 'null',
      date: '04 de Outubro 2023 - 08:30'
    }
  ]

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }

  return (
    <>
      <header className="fixed z-[2] h-20 top-0 left-0 w-full font-semibold bg-light dark:bg-dark border-b-[1px] border-gray-200 dark:border-gray-700">
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
              <img src="/logo/logo.png" alt="Logo" className="max-w-[10rem] " />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-4 border-r-[2px] pr-6 border-gray-200 dark:border-zinc-400/60">
              {/* <!-- Dark Mode Toggler --> */}
              <DarkModeSwitcher />
              {/* <!-- Dark Mode Toggler --> */}
            </div>

            <div className="flex items-center justify-center gap-4">
              <Link
                to={routsNameMain.chat.index}
                className="w-10 h-10  bg-gray-100/40 dark:bg-gray-500/60 border border-gray-200/30 dark:border-gray-500/60 rounded-full flex items-center justify-center transition-all duration-300 hover:text-primary-200 p-2 "
              >
                <Chat size={20} />
              </Link>
              <button
                onClick={toggleFullScreen}
                className="w-10 h-10  bg-gray-100/40 dark:bg-gray-500/60 border border-gray-200/30 dark:border-gray-500/60 rounded-full flex items-center justify-center transition-all duration-300 hover:text-primary-200 p-2 "
              >
                <Maximize size={20} />
              </button>

              <DropdownInfo
                title="notificações"
                icon={Bell}
                link={`${routsNameMain.home}`}
                options={notificationList}
              />

              <DropdownUser user={useInfo} options={options} />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
