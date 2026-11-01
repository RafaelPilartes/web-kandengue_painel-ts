import { useContext, useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../components/main/Header'
import { AppContext } from '../provider/AppProvider'
import { Slide } from '../components/main/Slide'
import { ModalMenuMobile } from '../components/modal/ModalMenuMobile'

/**
 * The header and the navigation are ONE pinned bar, and the page reserves the
 * height that bar actually has.
 *
 * ── What this replaces, and why ──
 * The header was `fixed` with `h-20`, the navigation was separately `fixed`
 * with a height that grew as links wrapped onto more rows, and the content
 * reserved `mt-20 + mt-12` — a constant. Measured on 2026-10-31: at 1440 px the
 * bar ended 5 px below where the content began, and at 1224 px, where the
 * navigation took two rows, 41 px of the page was underneath it.
 *
 * Reserving a measured height is what makes "never covers content" true at any
 * width and for any number of links, instead of true for the number of links
 * that happened to exist when the margin was typed. `Slide` keeps the row count
 * at one; this keeps the arithmetic honest even if the row height changes —
 * another font, a browser zoom, a notification badge.
 */
function RootLayout() {
  const { menuIsVisible, setMenuIsVisible } = useContext(AppContext)
  const chromeRef = useRef<HTMLDivElement>(null)
  const [chromeHeight, setChromeHeight] = useState(80)

  useEffect(() => {
    const chrome = chromeRef.current
    if (!chrome) return
    const read = () => setChromeHeight(chrome.offsetHeight)
    read()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(read)
    observer.observe(chrome)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {menuIsVisible && (
        <ModalMenuMobile
          menuIsVisible={menuIsVisible}
          setMenuIsVisible={setMenuIsVisible}
        />
      )}

      <div className="w-full h-full text-baseTxtDark dark:text-baseTxtLight bg-baseBgLight dark:bg-baseBgDark">
        <div
          ref={chromeRef}
          className="fixed z-20 top-0 left-0 w-full bg-light dark:bg-dark"
        >
          <Header />
          {/* Below 1120 px the navigation is the drawer, not this bar. */}
          <div className="max-w-s-1120:hidden">
            <Slide />
          </div>
        </div>

        <div
          className="relative h-full flex flex-row items-start justify-center"
          style={{ paddingTop: chromeHeight }}
        >
          <div className="container w-full h-full flex-1 p-8">
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
