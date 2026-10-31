import { describe, expect, it } from 'vitest'
import { filterMenu, permissionFor } from '../access'

describe('permissionFor', () => {
  it('maps each screen to its permission, specific paths first', () => {
    expect(permissionFor('/')).toBe('view_dashboard')
    expect(permissionFor('/rides')).toBe('view_rides')
    expect(permissionFor('/rides/view/abc')).toBe('view_rides')
    expect(permissionFor('/rides/realtime')).toBe('view_realtime_map')
    expect(permissionFor('/rides/fare-review')).toBe('review_fares')
    expect(permissionFor('/wallet/topup/request')).toBe('manage_topup_requests')
    expect(permissionFor('/wallet')).toBe('manage_wallet')
    expect(permissionFor('/finance/balances')).toBe('manage_drivers')
    expect(permissionFor('/users/admins')).toBe('manage_admins')
    expect(permissionFor('/departments')).toBe('manage_departments')
  })

  it('does not match a prefix inside another word', () => {
    expect(permissionFor('/ridesharing')).toBeNull()
  })

  it('leaves the work module open to every admin', () => {
    expect(permissionFor('/work/tasks')).toBeNull()
  })
})

describe('filterMenu', () => {
  const menu = [
    { label: 'Dashboard', to: '/' },
    {
      label: 'Corridas',
      to: '/',
      subMenus: [
        { label: 'Todas', to: '/rides' },
        { label: 'Tempo real', to: '/rides/realtime' }
      ]
    },
    {
      label: 'Financeiro',
      to: '/',
      subMenus: [{ label: 'Carteira', to: '/wallet' }]
    },
    { label: 'Trabalho', to: '/work/tasks' }
  ]

  it('keeps only what a member with view_rides can open', () => {
    const can = (p: string) => p === 'view_rides'
    expect(filterMenu(menu, can)).toEqual([
      {
        label: 'Corridas',
        to: '/',
        subMenus: [{ label: 'Todas', to: '/rides' }]
      },
      { label: 'Trabalho', to: '/work/tasks' }
    ])
  })

  it('shows work reports to managers and direction, not to members', () => {
    const work = [
      {
        label: 'Trabalho',
        to: '/',
        subMenus: [
          { label: 'Tarefas', to: '/work/tasks' },
          { label: 'Relatórios', to: '/work/reports' }
        ]
      }
    ]
    // Work reports follow `view_department_reports` now, or the mark.
    expect(
      filterMenu(work, () => false, { isDirection: false })[0].subMenus?.map(
        s => s.label
      )
    ).toEqual(['Tarefas'])
    expect(
      filterMenu(
        work,
        p => p === 'view_department_reports',
        { isDirection: false }
      )[0].subMenus?.map(s => s.label)
    ).toEqual(['Tarefas', 'Relatórios'])
    expect(
      filterMenu(work, () => false, { isDirection: true })[0].subMenus?.map(
        s => s.label
      )
    ).toEqual(['Tarefas', 'Relatórios'])
  })

  it('keeps everything for someone who can do everything', () => {
    expect(filterMenu(menu, () => true)).toEqual(menu)
  })
})

describe('every screen has a rule (review #10)', () => {
  // Open on purpose: the login, the work module (the level decides inside),
  // and two names with no screen behind them.
  const OPEN = ['/login', '/admin', '/chat']
  const paths = (node: unknown): string[] =>
    typeof node === 'string'
      ? [node]
      : node && typeof node === 'object'
        ? Object.values(node).flatMap(paths)
        : []

  it('fails when a path in routsNameMain has no permission rule', async () => {
    const { routsNameMain } = await import('@/constants/routsName')
    const unruled = paths(routsNameMain)
      .filter(p => !p.endsWith('/')) // the `…Str` prefixes used to build links
      .filter(p => !OPEN.includes(p) && !p.startsWith('/work/'))
      .filter(p => permissionFor(p) === null)
    expect(unruled).toEqual([])
  })
})
