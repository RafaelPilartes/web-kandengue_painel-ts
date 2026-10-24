/**
 * As secções do ecrã de configurações.
 *
 * Estava declarado duas vezes — no `index.tsx` e no `Sidebar.tsx` — e
 * acrescentar uma secção obrigava a lembrar dos dois sítios. Uma secção nova
 * que só entrasse num deles compilava e não aparecia.
 *
 * ⚠️ **Saíram daqui `tariffs` e `payouts`.** Editavam `rideRates`, que é
 * legado: quem fixa preços desde o motor de preços é `pricingProfiles`, em
 * **Preços → Perfis**, escrito pela API. A regra passou `rideRates` a
 * `allow write: if false`, e deixar as abas dava um ecrã que falha ao gravar.
 */
export type SettingsOption =
  | 'general'
  | 'referral'
  | 'appVersions'
  | 'walletTopup'
  | 'regions'
