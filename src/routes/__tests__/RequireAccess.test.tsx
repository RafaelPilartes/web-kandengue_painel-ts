// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const access = vi.hoisted(() => ({
  current: {
    isLoading: false,
    isError: false,
    level: 'member' as string | null,
    department: null,
    can: (_p: string): boolean => false
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
    access.current = { ...access.current, level: 'member', can: p => p === 'view_rides' }
    at('/rides')
    expect(screen.getByText('conteúdo')).toBeTruthy()
  })

  it('shows "no access" instead of a page the admin cannot use', () => {
    access.current = { ...access.current, level: 'member', can: () => false }
    at('/rides')
    expect(screen.getByText('Sem acesso a esta página')).toBeTruthy()
    expect(screen.queryByText('conteúdo')).toBeNull()
  })

  it('sends someone without view_dashboard from the home page to their tasks', () => {
    access.current = { ...access.current, level: 'member', can: () => false }
    at('/')
    expect(screen.getByText('tarefas')).toBeTruthy()
  })

  it('tells an admin without a level that no access was assigned, even on open pages', () => {
    access.current = { ...access.current, level: null, can: () => false }
    at('/work/projects')
    expect(screen.getByText('A sua conta ainda não tem acessos atribuídos')).toBeTruthy()
  })

  it('fails closed when the API cannot confirm the access', () => {
    access.current = { ...access.current, isError: true, level: 'direction', can: () => true }
    at('/rides')
    expect(screen.getByText('Não foi possível confirmar os seus acessos')).toBeTruthy()
  })
})
