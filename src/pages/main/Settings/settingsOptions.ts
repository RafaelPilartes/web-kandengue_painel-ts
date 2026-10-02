/**
 * As secções do ecrã de configurações.
 *
 * Estava declarado duas vezes — no `index.tsx` e no `Sidebar.tsx` — e
 * acrescentar uma secção obrigava a lembrar dos dois sítios. Uma secção nova
 * que só entrasse num deles compilava e não aparecia.
 */
export type SettingsOption =
  | 'tariffs'
  | 'payouts'
  | 'general'
  | 'referral'
  | 'appVersions'
  | 'walletTopup'
