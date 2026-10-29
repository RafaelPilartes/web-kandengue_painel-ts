import { useId } from 'react'
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
      // The page behind stops scrolling: see `.ReactModal__Body--open` in global.css.
      bodyOpenClassName="ReactModal__Body--open"
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
