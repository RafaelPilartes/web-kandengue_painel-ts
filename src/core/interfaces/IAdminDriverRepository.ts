import type { RideType } from '@/types/enum'

/**
 * A requirement a driver is missing for a service, exactly as the API returns
 * it inside the `details` of a refusal (3.7).
 *
 * ⚠️ **Not recomputed in the panel.** The server is what evaluates it, against
 * the lib's `SERVICE_REQUIREMENTS` — and that is why the route exists: the
 * check used to live on the screen, and a screen is not a guarantee (anyone
 * who opened the browser console could approve themselves). The panel
 * **shows** what the server said.
 *
 * ⚠️ **The detail arrives under two names, for one deploy only** (3.10f).
 *
 * `detalhe` is the key the API has sent since 3.7 and still sends; `detail`
 * is the English one the 3.10 API adds. Both carry the same text.
 *
 * Why both instead of a swap: this panel ships by **upload**, not by deploy,
 * so "both ends in the same deploy" is minutes rather than an instant. With
 * one key the order would matter and the gap would show the admin a list of
 * missing requirements with no explanation. With both, the order does not
 * matter and there is no gap.
 *
 * ⚠️ **`detalhe` goes away in the round after this one**, once an API that
 * only sends `detail` is in production. Until then it is the fallback, and
 * `requirementDetail` below is the only place that knows about either.
 */
export interface MissingRequirement {
  /** The stable key — this is what goes into the audit log. */
  key: string
  /** What the admin reads. */
  label: string
  kind: 'document' | 'vehicle' | 'manual'
  /** Why: "não foi submetido", "aprovado mas **caducado**", "está em pending". */
  detail?: string
  /** The same text, under the older Portuguese key. See the note above. */
  detalhe?: string
}

/**
 * The detail text, from whichever key the API sent.
 *
 * One function so the two-key window lives in exactly one place: removing
 * `detalhe` later is then a two-line change here, not a hunt through screens.
 * Returns an empty string rather than undefined so a caller can render it
 * without a guard -- a missing detail is a requirement with no explanation,
 * which is survivable; a crash in the approval screen is not.
 */
export function requirementDetail(requirement: MissingRequirement): string {
  return requirement.detail ?? requirement.detalhe ?? ''
}

export interface ServiceResult {
  driver_id: string
  services: RideType[]
  /** `false` when it was already so — the call was a no-op, not an error. */
  changed: boolean
}

export interface DocumentDecisionResult {
  id: string
  status: 'approved' | 'rejected'
  changed: boolean
}

/**
 * Approving services and deciding documents — the four routes of sub-phase
 * 3.7.
 *
 * They replace direct panel writes to Firestore: `drivers.services` and
 * `documents.status`. The phase 7 rules will deny those to the client; this
 * interface is the right path, built first.
 */
export interface IAdminDriverRepository {
  /**
   * Adds a service, **if the requirements are met**.
   *
   * Refuses with `SERVICE_REQUIREMENTS_NOT_MET` and the list of what is
   * missing inside `details` — see `missingRequirements` in `apiError`.
   *
   * `confirmations` are the keys of the **manual** requirements the admin is
   * confirming in this request (the moto-taxi spare helmet). Without them the
   * approval is refused: the only proof that someone saw the helmet is that
   * confirmation, and it lands in `auditLogs` with the name of whoever gave
   * it.
   */
  addService(
    driverId: string,
    service: RideType,
    confirmations: string[]
  ): Promise<ServiceResult>

  /** Removing is never blocked. What is required is the record of who did it. */
  removeService(driverId: string, service: RideType): Promise<ServiceResult>

  /**
   * Approves a document, with an optional expiry date.
   *
   * ⚠️ **The expiry is stored as the end of the chosen day**, Luanda time —
   * see `endOfDayInLuanda`. The lib compares instants (`expires_at > now`), so
   * midnight on the 13th expires at 00:00:01 on the 13th and the driver loses
   * the day the policy still covers.
   */
  approveDocument(
    documentId: string,
    expiresAt?: Date
  ): Promise<DocumentDecisionResult>

  /**
   * Rejects a document, **with a mandatory reason**.
   *
   * The reason goes to `feedback`, which is the field the **driver** sees. The
   * panel used to write `{status: 'rejected'}` and never `feedback`: the driver
   * got a "rejected" with no idea what to fix, and resubmitted the same
   * document.
   */
  rejectDocument(
    documentId: string,
    reason: string
  ): Promise<DocumentDecisionResult>
}
