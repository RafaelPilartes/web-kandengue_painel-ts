import { ShieldOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from './empty-state'

/** Shown instead of a page the admin cannot use. Says why and where to go. */
export function NoAccess({ unassigned = false }: { unassigned?: boolean }) {
  return (
    <div className="rounded-md bg-light dark:bg-dark">
      <EmptyState
        icon={<ShieldOff size={36} />}
        title={
          unassigned
            ? 'A sua conta ainda não tem acessos atribuídos'
            : 'Sem acesso a esta página'
        }
        description={
          unassigned
            ? 'Fale com a Direcção para lhe atribuírem um departamento e um nível.'
            : 'O seu departamento não tem permissão para esta área. Se precisa dela, peça à Direcção.'
        }
        action={
          <Link
            to="/work/tasks"
            className="inline-flex h-10 items-center rounded-lg bg-primary-200 px-4 text-sm font-medium text-white hover:bg-primary-400"
          >
            Ir para as minhas tarefas
          </Link>
        }
      />
    </div>
  )
}
