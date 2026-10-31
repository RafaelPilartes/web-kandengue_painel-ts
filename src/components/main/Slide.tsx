import { MoreHorizontal } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Link } from 'react-router-dom'
import AccordionSidBar from '../accordion/AccordionSidBar'
import dashItem from '@/constants/dash'
import { useAccess } from '@/hooks/useAccess'
import { filterMenu } from '@/routes/access'
import { fitItemCount } from './navOverflow'

/*
 * The navigation is ONE row, always, and what does not fit goes into "Mais".
 *
 * ── The defect this replaces ──
 * The row used to be `flex-wrap` inside a `position: fixed` bar, while the page
 * content reserved a CONSTANT top margin. So every link added past the width of
 * the screen started a second row, the bar grew downwards, and the top of the
 * page went under it. Measured on 2026-10-31 with the ten links a Direction
 * account sees:
 *
 *   1440 px  bar 53 px (one row)   → 5 px of content covered
 *   1224 px  bar 89 px (two rows)  → 41 px of content covered
 *   1024 px  bar hidden (the drawer takes over below 1120 px)
 *
 * Note the 5 px at 1440: even one row did not fit the constant. Both halves are
 * fixed — the row count can no longer grow, and `RootLayout` reserves the
 * MEASURED height instead of a number someone typed.
 *
 * ── Why "Mais" and not a lateral navigation ──
 * A sidebar also solves it, and it was the other option on the table. This one
 * was chosen because it keeps the bar the owner approved, it touches this file
 * and the layout instead of the width of every page, and below 1120 px the
 * lateral form already exists as the drawer. The reason in full is in
 * `docs/decisions.md`, 2026-10-31.
 *
 * ── How the measuring works ──
 * A second row renders every item, invisible and out of the layout, and is
 * never clicked; the widths come from it. Item widths do not change with the
 * viewport — they are content-sized — so they are measured when the item set
 * changes, and only the arithmetic re-runs on resize. Measuring the visible row
 * instead would mean measuring items that are not rendered.
 */

export const Slide = () => {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null)
  const [moreIsOpen, setMoreIsOpen] = useState(false)

  const { can, level, access } = useAccess()
  // Memoised on the permissions array, which react-query keeps stable: the
  // measuring below must not re-run on every render.
  const items = useMemo(
    () => filterMenu(dashItem, can, level),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [access.permissions, level]
  )

  const rowRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const widthsRef = useRef<number[]>([])
  const moreRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(items.length)

  const recompute = useCallback(() => {
    const row = rowRef.current
    if (!row) return
    setVisibleCount(fitItemCount(widthsRef.current, row.clientWidth))
  }, [])

  // Measure first, then decide, before the browser paints: no flash of a
  // wrapped row.
  useLayoutEffect(() => {
    const measure = measureRef.current
    if (!measure) return
    widthsRef.current = [...measure.children].map(
      child => (child as HTMLElement).offsetWidth
    )
    recompute()
  }, [items, recompute])

  useEffect(() => {
    const row = rowRef.current
    if (!row || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(recompute)
    observer.observe(row)
    return () => observer.disconnect()
  }, [recompute])

  // Clicking anywhere else closes "Mais", like the accordions do.
  useEffect(() => {
    if (!moreIsOpen) return
    const onMouseDown = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreIsOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [moreIsOpen])

  const renderItem = (
    item: (typeof items)[number],
    index: number,
    interactive: boolean
  ) => {
    if (item.accordion) {
      return (
        <AccordionSidBar
          key={item.label}
          items={item}
          isActive={interactive && activeAccordion === index}
          toggle={() =>
            setActiveAccordion(activeAccordion === index ? null : index)
          }
        />
      )
    }
    return (
      <Link
        key={item.label}
        to={item.to}
        className="shrink-0 whitespace-nowrap py-2 px-3 flex items-center justify-between gap-2 hover:text-primary-200 dark:hover:text-primary-200 rounded-md transition-all duration-200"
        tabIndex={interactive ? undefined : -1}
      >
        <div className="flex flex-row items-center justify-start gap-3">
          <span>{item.icon}</span>
          <span className="flex text-sm">{item.label}</span>
        </div>
        {item.notification !== 0 && (
          <span className="w-6 h-6 text-black text-xs p-2 flex flex-row items-center justify-center rounded-full bg-blue-200">
            {item.notification}
          </span>
        )}
      </Link>
    )
  }

  const visible = items.slice(0, visibleCount)
  const overflow = items.slice(visibleCount)

  return (
    <nav
      aria-label="Navegação principal"
      className="relative w-full bg-light dark:bg-dark border-b-[1px] border-gray-200 dark:border-gray-700"
    >
      <div
        ref={rowRef}
        className="container w-full py-2 flex flex-row flex-nowrap items-center justify-center gap-x-1 overflow-hidden"
      >
        {visible.map((item, index) => renderItem(item, index, true))}

        {overflow.length > 0 && (
          <div ref={moreRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMoreIsOpen(open => !open)}
              aria-expanded={moreIsOpen}
              className="whitespace-nowrap py-2 px-3 flex items-center gap-2 rounded-md transition-all duration-200 hover:text-primary-200 dark:hover:text-primary-200"
            >
              <MoreHorizontal size={16} />
              <span className="flex text-sm">Mais</span>
            </button>

            {moreIsOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 max-h-[70vh] w-64 overflow-y-auto rounded-lg bg-white shadow dark:bg-gray-700">
                {/*
                 * A group inside "Mais" opens INLINE, as a heading with its
                 * links under it. The accordions of the bar hang a
                 * `position: fixed` panel off their own place in the viewport,
                 * and inside a dropdown that panel lands next to the list
                 * instead of under the group. One level of nested floating
                 * menus is also a worse thing to use than a list.
                 */}
                <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                  {overflow.map(item => (
                    <li key={item.label}>
                      {item.subMenus?.length ? (
                        <>
                          <p className="flex items-center gap-2 px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {item.icon}
                            {item.label}
                          </p>
                          <ul>
                            {item.subMenus.map(submenu => (
                              <li key={submenu.label}>
                                <Link
                                  to={submenu.to}
                                  onClick={() => setMoreIsOpen(false)}
                                  className="flex items-center gap-2 py-2 pl-8 pr-4 hover:text-primary-200 dark:text-gray-300 dark:hover:text-primary-200"
                                >
                                  {submenu.icon}
                                  <span>{submenu.label}</span>
                                  {submenu.notification !== 0 && (
                                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-xs text-black">
                                      {submenu.notification}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <Link
                          to={item.to}
                          onClick={() => setMoreIsOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:text-primary-200 dark:text-gray-300 dark:hover:text-primary-200"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/*
       * The measuring row: every item, out of the layout and out of the
       * accessibility tree. It is what the widths come from.
       */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 flex flex-row flex-nowrap opacity-0"
        style={{ visibility: 'hidden' }}
      >
        {items.map((item, index) => renderItem(item, index, false))}
      </div>
    </nav>
  )
}
