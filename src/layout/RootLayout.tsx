import { Outlet } from 'react-router-dom'
import { Header } from '../components/main/Header'
import { useContext } from 'react'
import { AppContext } from '../provider/AppProvider'
import { Slide } from '../components/main/Slide'
import { ModalMenuMobile } from '../components/modal/ModalMenuMobile'

function RootLayout() {
  const { menuIsVisible, setMenuIsVisible } = useContext(AppContext)
  return (
    <>
      {menuIsVisible && (
        <ModalMenuMobile
          menuIsVisible={menuIsVisible}
          setMenuIsVisible={setMenuIsVisible}
        />
      )}

      <div className="w-full h-full text-baseTxtDark dark:text-baseTxtLight bg-baseBgLight dark:bg-baseBgDark">
        {/* Header */}
        <Header />

        {/* Main */}
        <div className="relative h-full min-w-s-1120:mt-20 max-w-s-1120:mt-8 flex flex-row items-start justify-center">
          <div className="max-w-s-1120:hidden">
            <Slide />
          </div>

          <div className={`container w-full h-full mt-12 flex-1 p-8`}>
            {/* Main */}
            <Outlet />

            {/* Footer */}
            <div className="flex flex-row justify-start items-center gap-2 mt-8 text-primary-200">
              <span className="opacity-60">Created by</span>
              <a
                href="http://tchossysolution.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Tchossy Solution
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default RootLayout
