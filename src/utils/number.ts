/*
 * ⚠️ **This file no longer implements anything.** It held an Intl formatter
 * with locale **en-US** -- "1,234.00" -- while both apps had their own
 * hand-rolled version and a third helper put the currency in front. Three
 * implementations of one decision: how much a ride costs, written down.
 *
 * `formatKwanza` from the lib writes "4 136 Kz". The alias keeps the old name
 * and the old signature for the 70-odd call sites that print the number next
 * to a column header already saying Kz.
 */
import { formatAmount } from '@rafaelpilartes/kandengue-shared/functions'

export { formatAmount, formatKwanza } from '@rafaelpilartes/kandengue-shared/functions'

/**
 * The number alone, in the Angolan form: `4 136,00`.
 *
 * @deprecated prefer `formatKwanza`, which carries the currency.
 */
export const formatMoney = (val: number, decimals: number = 2) =>
  formatAmount(val, { decimals })
