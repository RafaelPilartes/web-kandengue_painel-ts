/**
 * How many navigation items fit in one row, and how much room "Mais" needs.
 *
 * Pure on purpose: the row that wraps onto a second line and grows over the
 * page is the defect of 2026-10-31, and the arithmetic that stops it should be
 * provable without a browser.
 */

/** Room kept for the "Mais" button whenever anything overflows. */
export const MORE_BUTTON_WIDTH = 72

export function fitItemCount(
  widths: number[],
  available: number,
  moreWidth: number = MORE_BUTTON_WIDTH
): number {
  if (!widths.length) return 0

  const total = widths.reduce((sum, width) => sum + width, 0)
  // Everything fits: no "Mais", so no room kept for it.
  if (total <= available) return widths.length

  let used = 0
  let count = 0
  for (const width of widths) {
    if (used + width > available - moreWidth) break
    used += width
    count += 1
  }
  /*
   * At least one item always shows. A row holding nothing but "Mais" reads as
   * a broken page, and the row is hidden below 1120 px anyway — the drawer
   * takes over there.
   */
  return Math.max(count, 1)
}
