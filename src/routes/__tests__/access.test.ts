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

  it('keeps everything for someone who can do everything', () => {
    expect(filterMenu(menu, () => true)).toEqual(menu)
  })
})
