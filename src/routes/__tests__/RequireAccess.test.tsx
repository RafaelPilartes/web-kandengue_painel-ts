// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const access = vi.hoisted(() => ({
  current: {
    isLoading: false,
    isError: false,
    isDirection: false,
    department: null as { id: string; name: string } | null,
    // A profile is what the guard looks for: an account with neither mark nor
    // profile is the "unassigned" case.
    profile: { id: 'p1', name: 'Atendimento' } as {
      id: string
      name: string
    } | null,
    access: {
      isDirection: false,
      departmentId: null,
      profileId: 'p1',
      permissions: [] as string[]
    },
    can: (() => false) as (p: string) => boolean
  }
}))

vi.mock('@/hooks/useAccess', () => ({ useAccess: () => access.current }))
// PrivateRoute pulls Firebase in through these; the guard needs none of it.
vi.mock('@/viewModels/AdminViewModel', () => ({ useAdminsViewModel: () => ({}) }))
vi.mock('@/observability/audit', () => ({ auditService: {} }))
vi.mock('@/stores/userStore', () => ({ useAdminStore: () => ({}) }))

const { RequireAccess } = await import('../PrivateRoute')

function at(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/work/tasks" element={<p>tarefas</p>} />
        <Route
          path="*"
          element={
            <RequireAccess>
              <p>conteúdo</p>
            </RequireAccess>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(cleanup)

describe('RequireAccess', () => {
  it('shows the page when the department grants its permission', () => {
    access.current = { ...access.current, can: p => p === 'view_rides' }
    at('/rides')
    expect(screen.getByText('conteúdo')).toBeTruthy()
  })

  it('shows "no access" instead of a page the admin cannot use', () => {
    access.current = { ...access.current, can: () => false }
    at('/rides')
    expect(screen.getByText('Sem acesso a esta página')).toBeTruthy()
    expect(screen.queryByText('conteúdo')).toBeNull()
  })

  /*
   * This used to bounce to /work/tasks. The home page is open now, because it
   * carries the greeting and the admin's own tasks and deadlines — being sent
   * somewhere else told them nothing.
   */
  it('opens the home page for an admin with no permission at all', () => {
    access.current = { ...access.current, can: () => false }
    at('/')
    expect(screen.getByText('conteúdo')).toBeTruthy()
  })

  it('tells an admin with no mark and no profile that no access was assigned, even on open pages', () => {
    access.current = { ...access.current, profile: null, can: () => false }
    at('/work/projects')
    expect(screen.getByText('A sua conta ainda não tem acessos atribuídos')).toBeTruthy()
  })

  it('fails closed when the API cannot confirm the access', () => {
    access.current = { ...access.current, isError: true, can: () => true }
    at('/rides')
    expect(screen.getByText('Não foi possível confirmar os seus acessos')).toBeTruthy()
  })
})
