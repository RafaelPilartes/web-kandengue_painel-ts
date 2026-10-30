// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { PeoplePicker } from '../people-picker'

const PEOPLE = [
  { id: 'rafael', name: 'Rafael Pilartes', hint: 'Tecnologia e Inovação' },
  { id: 'batilcia', name: 'Batílcia Gonçalves', hint: 'Tecnologia e Inovação' },
  { id: 'sebastiao', name: 'Sebastião Gomes', hint: 'Segurança' }
]

let last: string[] = []
function Harness({ max, initial = [] }: { max?: number; initial?: string[] }) {
  const [value, setValue] = useState<string[]>(initial)
  last = value
  return (
    <PeoplePicker
      label="Pessoas"
      options={PEOPLE}
      value={value}
      max={max}
      onChange={ids => {
        last = ids
        setValue(ids)
      }}
    />
  )
}

afterEach(cleanup)

describe('PeoplePicker', () => {
  it('finds a person without accents and adds them with Enter', () => {
    render(<Harness />)
    const box = screen.getByRole('combobox', { name: 'Pessoas' })
    fireEvent.change(box, { target: { value: 'batilcia' } })
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
      'BGBatílcia GonçalvesTecnologia e Inovação'
    ])
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(last).toEqual(['batilcia'])
    expect(
      screen.getByRole('button', { name: 'Tirar Batílcia Gonçalves' })
    ).toBeTruthy()
  })

  it('keeps chosen people out of the list, in the order chosen', () => {
    render(<Harness />)
    const box = screen.getByRole('combobox', { name: 'Pessoas' })
    fireEvent.focus(box)
    fireEvent.click(screen.getByText('Sebastião Gomes'))
    fireEvent.click(screen.getByText('Rafael Pilartes'))
    expect(last).toEqual(['sebastiao', 'rafael'])
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('takes the last one out with Backspace on an empty box', () => {
    render(<Harness initial={['rafael', 'batilcia']} />)
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Backspace' })
    expect(last).toEqual(['rafael'])
  })

  it('stops at the maximum and says so', () => {
    render(<Harness max={2} initial={['rafael', 'batilcia']} />)
    expect((screen.getByRole('combobox') as HTMLInputElement).disabled).toBe(
      true
    )
    expect(screen.getByText('Chegou ao máximo de 2 pessoas.')).toBeTruthy()
  })
})
