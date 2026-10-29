import { describe, expect, it, vi } from 'vitest'

// shared.ts also holds the module's hook, which reaches Firebase through these.
vi.mock('@/hooks/useAccess', () => ({ useAccess: () => ({}) }))
vi.mock('@/stores/userStore', () => ({ useAdminStore: () => '' }))
vi.mock('@/viewModels/AccessViewModel', () => ({
  useAdminDirectory: () => ({ admins: [] }),
  useDepartments: () => ({ departments: [] })
}))

const { projectPeople, stepProgress } = await import('../shared')

const step = (done: boolean) => ({
  id: String(Math.random()),
  text: 'x',
  assignee_id: null,
  done,
  done_by: null,
  done_at: null
})

describe('work helpers', () => {
  it('counts ticked steps over all steps', () => {
    expect(stepProgress({ checklist: [] })).toEqual({ done: 0, total: 0 })
    expect(
      stepProgress({ checklist: [step(true), step(false), step(true)] })
    ).toEqual({ done: 2, total: 3 })
  })

  it("puts a project's owner first, then everyone on its tasks once", () => {
    const project = { owner_id: 'geovani' } as Parameters<
      typeof projectPeople
    >[0]
    const tasks = [
      { assignee_ids: ['rafael', 'batilcia'] },
      { assignee_ids: ['batilcia', 'geovani', 'sebastiao'] },
      { assignee_ids: [] }
    ] as unknown as Parameters<typeof projectPeople>[1]
    expect(projectPeople(project, tasks)).toEqual([
      'geovani',
      'rafael',
      'batilcia',
      'sebastiao'
    ])
  })
})
