import { describe, expect, it } from 'vitest'
import { fitItemCount, ITEM_GAP, MORE_BUTTON_WIDTH } from '../navOverflow'

describe('fitItemCount', () => {
  it('shows every item when they all fit', () => {
    expect(fitItemCount([100, 100, 100], 400)).toBe(3)
  })

  /*
   * The gaps count. Three items of 100 with `gap-x-1` need 308, not 300 — and
   * the row is `overflow-hidden`, so ignoring them did not grow the bar, it
   * cut the last label in half.
   */
  it('shows every item when they fill the row exactly, gaps included', () => {
    expect(fitItemCount([100, 100, 100], 308)).toBe(3)
    expect(fitItemCount([100, 100, 100], 307)).toBe(2)
  })

  it('keeps room for "Mais", and for the gap before it', () => {
    // 2 items = 204; + gap + "Mais" = 280. A third would need 384 + 76.
    expect(fitItemCount([100, 100, 100, 100], 390)).toBe(3)
    expect(fitItemCount([100, 100, 100, 100], 383)).toBe(2)
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
      const needsMore = count < widths.length
      // What the row really costs: the items, the gap between each pair, and
      // "Mais" with its own gap when anything overflowed.
      const used =
        count * 110 +
        Math.max(0, count - 1) * ITEM_GAP +
        (needsMore ? ITEM_GAP + MORE_BUTTON_WIDTH : 0)
      expect(used).toBeLessThanOrEqual(available)
    }
  })
})
