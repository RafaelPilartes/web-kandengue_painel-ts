import { describe, expect, it } from 'vitest'
import { fitItemCount, MORE_BUTTON_WIDTH } from '../navOverflow'

describe('fitItemCount', () => {
  it('shows every item when they all fit', () => {
    expect(fitItemCount([100, 100, 100], 400)).toBe(3)
  })

  it('shows every item when they fill the row exactly', () => {
    // No "Mais" means no room kept for it: the exact fit must not overflow.
    expect(fitItemCount([100, 100, 100], 300)).toBe(3)
  })

  it('keeps room for "Mais" as soon as anything overflows', () => {
    // 400 of items in 390 of row: "Mais" takes 72, leaving 318 — three fit.
    expect(fitItemCount([100, 100, 100, 100], 390)).toBe(3)
  })

  it('drops the items that do not fit, in order', () => {
    expect(fitItemCount([100, 100, 100, 100], 250)).toBe(1)
  })

  it('always shows at least one item, however narrow the row', () => {
    expect(fitItemCount([200, 200], 10)).toBe(1)
    expect(fitItemCount([200, 200], 0)).toBe(1)
  })

  it('returns nothing when there are no items', () => {
    expect(fitItemCount([], 1000)).toBe(0)
  })

  /*
   * The point of the whole thing: adding links must never add a row. However
   * many arrive, the count never exceeds what one row holds.
   */
  it('never grows past one row as links are added', () => {
    const available = 800
    const widths: number[] = []
    for (let i = 0; i < 40; i += 1) {
      widths.push(110)
      const count = fitItemCount(widths, available)
      const used = count * 110
      const needsMore = count < widths.length
      expect(used + (needsMore ? MORE_BUTTON_WIDTH : 0)).toBeLessThanOrEqual(
        available
      )
    }
  })
})
