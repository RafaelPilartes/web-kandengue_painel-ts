import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { AccordionMenu } from '../accordion/AccordionMenu'
import React from 'react'
import dashItem from '@/constants/dash'
import { useAccess } from '@/hooks/useAccess'
import { filterMenu } from '@/routes/access'

interface ModalMenuMobileInterface {
  menuIsVisible: boolean
  setMenuIsVisible: (value: any) => void
}

export function ModalMenuMobile({
  menuIsVisible,
  setMenuIsVisible
}: ModalMenuMobileInterface) {
  const { can, level } = useAccess()
  const mapLinks = filterMenu(dashItem, can, level).map((item, index) => {
    return (
      <React.Fragment key={index}>
        {item.accordion && <AccordionMenu items={item} />}
        {!item.accordion && (
          <Link
            key={index}
            to={item.to}
            className="w-full flex items-start justify-start flex-col border-b-[0.1rem] border-gray-600 cursor-pointer"
          >
            <div className="w-full py-4 px-4 text-white text-left font-light text-sm group transition-all hover:text-primary-200">
              <span className="flex flex-row items-center justify-start gap-1 transition-all duration-300 group-hover:ml-2">
                {item.icon} {item.label}
              </span>
            </div>
          </Link>
        )}
      </React.Fragment>
    )
  })

  const openMenu = () => {
    setMenuIsVisible(!menuIsVisible)
  }

  return (
    <>
      <div
        className={`fixed z-50 top-0 left-0 bg-baseBgDark h-screen w-screen max-w-[20rem] overflow-auto transition-all duration-500 ${
          menuIsVisible && 'left-0'
        }`}
      >
        <div className="relative flex items-start justify-start flex-col gap-4">
          <button
            onClick={openMenu}
            className="absolute right-4 top-4 p-2 bg-primary-200 text-white rounded-md "
          >
            <X />
          </button>

          {/* Logo */}
          <div className="w-full px-4 py-2">
            <img
              src="/logo/logo.png"
              alt="Logo CCI"
              className="w-full max-w-s-xs max-w-[10.6rem] min-w-[8rem] "
            />
          </div>

          {/* List Links */}
          <ul className="w-full flex flex-col ">
            {mapLinks}

            {/* <li className="w-full flex items-start justify-start flex-col border-b-[0.1rem] border-gray-600">
              <a
                href={routsNameMain.registration.students}
                className="w-full py-4 px-4 text-left font-bold text-sm group transition-all hover:text-primary-200"
              >
                <span className="flex flex-row items-center justify-start gap-1 transition-all duration-300 group-hover:ml-2">
                  <HeartPulse size={14} className="z-10" /> Estudantes
                </span>
              </a>
            </li> */}
          </ul>
        </div>
      </div>

      <button
        onClick={openMenu}
        className={`fixed z-20 top-0 bg-gray-950/80 backdrop-blur-[0.2rem] h-screen opacity-0 transition-all duration-300 ${
          menuIsVisible && 'w-screen opacity-100'
        } `}
      />
    </>
  )
}
