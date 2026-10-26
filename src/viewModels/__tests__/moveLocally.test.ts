import { describe, expect, it } from 'vitest'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { moveLocally } from '../WorkViewModel'

const task = (
  id: string,
  status: WorkTask['status'],
  position: number,
  department_id = 'ops'
) => ({ id, status, position, department_id }) as WorkTask

describe('moveLocally (the optimistic board move)', () => {
  it('inserts the card at the target position and renumbers the column', () => {
    const tasks = [
      task('a', 'todo', 0),
      task('b', 'in_progress', 0),
      task('c', 'in_progress', 1)
    ]
    const result = moveLocally(tasks, 'a', 'in_progress', 1)
    const column = result
      .filter(t => t.status === 'in_progress')
      .sort((x, y) => x.position - y.position)
    expect(column.map(t => [t.id, t.position])).toEqual([
      ['b', 0],
      ['a', 1],
      ['c', 2]
    ])
  })

  it('clamps a position past the end', () => {
    const result = moveLocally(
      [task('a', 'todo', 0), task('b', 'done', 0)],
      'a',
      'done',
      99
    )
    expect(result.find(t => t.id === 'a')).toMatchObject({
      status: 'done',
      position: 1
    })
  })

  it("leaves another department's column alone", () => {
    const tasks = [task('a', 'todo', 0), task('x', 'done', 0, 'it')]
    const result = moveLocally(tasks, 'a', 'done', 0)
    expect(result.find(t => t.id === 'x')?.position).toBe(0)
    expect(result.find(t => t.id === 'a')?.position).toBe(0)
  })
})
