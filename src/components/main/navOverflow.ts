/**
 * How many navigation items fit in one row, and how much room "Mais" needs.
 *
 * Pure on purpose: the row that wraps onto a second line and grows over the
 * page is the defect of 2026-10-31, and the arithmetic that stops it should be
 * provable without a browser.
 */

/** Room kept for the "Mais" button whenever anything overflows. */
export const MORE_BUTTON_WIDTH = 72

/**
 * The gap between two items, in pixels — Tailwind's `gap-x-1`.
 *
 * ⚠️ It has to be counted. Without it the sum was short by one gap per item:
 * ten items needed about 36 px more than the arithmetic allowed, and the row
 * is `overflow-hidden`, so the bar did not grow — the last label was simply
 * cut in half. Keep this in step with the class on the row in `Slide.tsx`.
 */
export const ITEM_GAP = 4

export function fitItemCount(
  widths: number[],
  available: number,
  moreWidth: number = MORE_BUTTON_WIDTH,
  gap: number = ITEM_GAP
): number {
  if (!widths.length) return 0

  const widthOf = (count: number) =>
    widths.slice(0, count).reduce((sum, w) => sum + w, 0) +
    Math.max(0, count - 1) * gap

  if (widthOf(widths.length) <= available) return widths.length

  let count = 0
  // Every count below the full set needs room for "Mais", and for the gap
  // before it.
  while (
    count < widths.length &&
    widthOf(count + 1) + gap + moreWidth <= available
  ) {
    count += 1
  }
  /*
   * At least one item always shows. A row holding nothing but "Mais" reads as
   * a broken page, and the row is hidden below 1120 px anyway — the drawer
   * takes over there.
   */
  return Math.max(count, 1)
}
