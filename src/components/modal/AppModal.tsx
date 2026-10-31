import { useEffect, useId } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import ReactModal from 'react-modal'

import { cn } from '@/lib/tailwind-merge'

/*
 * `setAppElement` diz ao react-modal o que esconder dos leitores de ecrã
 * enquanto o modal está aberto (`aria-hidden` na raiz da aplicação).
 *
 * Sem isto, a biblioteca avisa na consola — e o que se fazia era calá-la com
 * `ariaHideApp={false}` em cada um dos onze modais, que é desligar a função
 * em vez de a configurar. O resultado era um leitor de ecrã a ler o modal e
 * a página por baixo ao mesmo tempo.
 */
if (typeof document !== 'undefined' && document.getElementById('root')) {
  ReactModal.setAppElement('#root')
}

/*
 * Acima do cabeçalho (`z-20`) e da barra lateral (`z-[19]`). O valor antigo
 * era `zIndex: 10`, e por isso o modal abria POR BAIXO dos dois.
 *
 * Fica abaixo dos toasts do react-toastify (9999), que é onde devem estar:
 * um aviso tem de se ver mesmo com um modal aberto.
 */
const Z_INDEX = 'z-[1000]'

/*
 * The page behind a modal does not scroll: see `.ReactModal__Body--open` in
 * global.css.
 *
 * ── Why the panel counts the open modals itself ──
 * react-modal already reference-counts `bodyOpenClassName`, and that counter
 * LEAKS. Its `ModalPortal.componentWillUnmount` only gives the reference back
 * when `this.state.isOpen` is already true, and that state only becomes true
 * after the `setState` inside `open()` has flushed. React's StrictMode mounts
 * every component, unmounts it and mounts it again — so the first mount adds
 * a reference and the simulated unmount drops none. The counter ends at 2 for
 * one modal, closing it brings it down to 1, the class never comes off and the
 * page stays frozen until a reload.
 *
 * Measured on 2026-10-31: after closing the "Cadastrar administrador" modal,
 * `document.querySelectorAll('[role=dialog]').length` was 0 while
 * `getComputedStyle(document.body).overflow` was still `hidden`, and a
 * PageDown moved the page 0 px (571 px before the modal was ever opened).
 *
 * An effect is the right place because React guarantees the cleanup of the
 * first effect runs before the second one — so the count comes back to zero
 * under StrictMode, and `bodyOpenClassName={null}` keeps react-modal's own
 * counter out of the way.
 *
 * The counter is module-level on purpose: with two modals stacked, the page
 * must stay locked until the LAST one closes.
 */
const BODY_OPEN_CLASS = 'ReactModal__Body--open'

let openModals = 0

/** Exported for the tests, which need a clean count between cases. */
export function resetScrollLockForTests() {
  openModals = 0
  document.body.classList.remove(BODY_OPEN_CLASS)
}

function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return

    openModals += 1
    document.body.classList.add(BODY_OPEN_CLASS)

    return () => {
      openModals -= 1
      if (openModals <= 0) {
        openModals = 0
        document.body.classList.remove(BODY_OPEN_CLASS)
      }
    }
  }, [isOpen])
}

export type ModalVariant = 'center' | 'drawer'

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl'
} as const

export interface AppModalProps {
  isOpen: boolean
  onClose: () => void
  /** Vai para um `<h2>` de verdade, e é o que o leitor de ecrã anuncia. */
  title: string
  description?: string
  size?: keyof typeof sizes
  /**
   * `drawer` (the default) slides in from the right at full height: forms
   * and details read top to bottom and the page stays in view. `center` is
   * for a short confirmation that must stop the admin.
   */
  variant?: ModalVariant
  /** Rodapé fixo, fora da área que faz scroll. */
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Casca partilhada dos modais do painel.
 *
 * O posicionamento é feito com `className`/`overlayClassName`, e não com o
 * objecto `style` do react-modal. A diferença importa: com `style`, o
 * elemento de conteúdo ficava à largura do overlay inteiro, e um clique
 * "fora" da caixa acertava nele — por isso `shouldCloseOnOverlayClick` nunca
 * disparava. Assim, o elemento de conteúdo **é** a caixa, e o que está à
 * volta é overlay a sério.
 */
export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  variant = 'drawer',
  footer,
  children,
  className
}: AppModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const isDrawer = variant === 'drawer'

  useBodyScrollLock(isOpen)


  const painel = cn(
    'flex w-full flex-col overflow-hidden bg-light outline-none dark:bg-dark',
    // A animação de entrada vive em `global.css` — ver a nota lá.
    isDrawer
      ? [
          'modal-panel--drawer h-full max-h-full border-l border-gray-200 shadow-[-16px_0_48px_-12px_rgba(15,23,42,0.25)]',
          'dark:border-gray-700 dark:shadow-[-16px_0_48px_-12px_rgba(0,0,0,0.6)]',
          'sm:rounded-l-xl',
          sizes[size]
        ]
      : [
          'modal-panel--center max-h-[min(85vh,48rem)] rounded-xl border border-gray-200 shadow-xl shadow-gray-900/20',
          'dark:border-gray-700 dark:shadow-black/50',
          sizes[size]
        ],
    className
  )

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      // The lock is `useBodyScrollLock`'s: react-modal's own counter leaks
      // under StrictMode. See the note above it.
      bodyOpenClassName={null}
      overlayClassName={cn(
        'modal-overlay fixed inset-0 flex bg-gray-950/40 dark:bg-black/60',
        Z_INDEX,
        isDrawer ? 'justify-end' : 'items-center justify-center p-4'
      )}
      className={painel}
      aria={{
        labelledby: titleId,
        describedby: description ? descriptionId : undefined
      }}
    >
      <header className="flex shrink-0 flex-row items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="min-w-0 py-0.5">
          <h2
            id={titleId}
            className="text-lg font-semibold leading-snug text-dark [text-wrap:balance] dark:text-light"
          >
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className="mt-1 max-w-[60ch] text-sm text-gray-600 dark:text-gray-300"
            >
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="-mr-2 shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-light"
        >
          <X size={20} aria-hidden />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-6 py-5">
        {children}
      </div>

      {footer && (
        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-baseBgDark/40">
          {footer}
        </footer>
      )}
    </ReactModal>
  )
}

export default AppModal
