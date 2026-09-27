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
   * `center` é a caixa ao meio; `drawer` entra da direita e ocupa a altura
   * toda — assenta melhor em ecrãs de consulta, onde se lê de cima a baixo.
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
  size = 'lg',
  variant = 'center',
  footer,
  children,
  className
}: AppModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const isDrawer = variant === 'drawer'


  const painel = cn(
    'flex w-full flex-col overflow-hidden bg-white shadow-2xl outline-none dark:bg-dark',
    // A animação de entrada vive em `global.css` — ver a nota lá.
    isDrawer
      ? ['modal-panel--drawer h-full max-h-full rounded-l-xl', sizes[size]]
      : ['modal-panel--center max-h-[85vh] rounded-xl', sizes[size]],
    className
  )

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      overlayClassName={cn(
        'modal-overlay fixed inset-0 flex bg-black/60',
        Z_INDEX,
        isDrawer ? 'justify-end' : 'items-center justify-center p-4',
      )}
      className={painel}
      aria={{
        labelledby: titleId,
        describedby: description ? descriptionId : undefined
      }}
    >
      <header className="flex shrink-0 flex-row items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-600">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="truncate text-xl font-medium text-dark dark:text-light"
          >
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className="mt-1 text-sm text-gray-500 dark:text-gray-400"
            >
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="shrink-0 rounded-lg p-2 text-dark transition-colors hover:bg-gray-200 dark:text-light dark:hover:bg-gray-500/20"
        >
          <X size={20} aria-hidden />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth p-6">
        {children}
      </div>

      {footer && (
        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-600">
          {footer}
        </footer>
      )}
    </ReactModal>
  )
}

export default AppModal
