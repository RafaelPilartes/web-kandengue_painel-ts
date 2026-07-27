# Kandengue Shared Migration (web-kandengue_painel-ts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `web-kandengue_painel-ts` to consume the already-released `@rafaelpilartes/kandengue-shared` v1.0.0 package instead of its own local duplicate types in `src/interfaces/IPromotion.ts`, matching the migration already completed in `node-fastify-kandengue_atrevido-ts`.

**Architecture:** The local `IPromotion.ts` file is reduced to only `IReferralSettings` (out of scope for the shared package, per the approved spec). The `PromotionEntity`/`PromotionUsageEntity`/`ReferralEarningEntity`/`WithdrawalRequestEntity` classes stay local (they're this repo's own translation layer between Firestore data and typed objects) but now `implements` the shared package's interfaces instead of the local ones. Every other consumer that imported a moved type/alias switches its import to the correct `@rafaelpilartes/kandengue-shared/<subpath>`.

**Tech Stack:** TypeScript ~5.8.3 (project references, `tsc -b`), Vite 7, `firebase` client SDK v12. This repo has **no automated test suite** (`package.json` has no `test` script) — verification is `tsc -b --force` plus a manual dev-server smoke test, not TDD red/green cycles.

## Global Constraints

- Package already exists and is released: `@rafaelpilartes/kandengue-shared` v1.0.0, installed via `"github:RafaelPilartes/lib_npm-kandengue_shared-ts#v1.0.0"`. **No new version of the shared package is needed for this migration** — v1.0.0 already contains every type this repo needs, including `AllowedUser`.
- `IReferralSettings` stays local (out of scope for the shared package, same as node-fastify's `ReferralSettings`) — do not touch `IAppConfigRepository.ts`, `appConfig.dao.ts`, `appConfig.service.ts`, `ReferralSettingsViewModel.ts`, or `ReferralSettings.tsx`.
- `PromotionEntity`, `PromotionUsageEntity`, `ReferralEarningEntity`, `WithdrawalRequestEntity` (the classes in `src/core/entities/Promotion.ts`) are this repo's own code and are **not** deleted — only their `implements` clause and imports change, to point at the shared package's interfaces instead of the local ones.
- **Real bug fix required, not just an import swap:** `IPromotionUsage.driver_cancel_count: number` (scalar) is stale — node-fastify's equivalent field was corrected to `driver_cancel_counts: Record<string, number>` (keyed by driver ID) during an earlier code-review pass, and that fix is what the shared package's `PromotionUsage.driver_cancel_counts` reflects. This repo's `PromotionUsageEntity` class must be updated to match (field rename, and the constructor's `?? 0` default becomes `?? {}`). The only two references are both inside `src/core/entities/Promotion.ts` (interface declaration line 64 and constructor line 79) — confirmed via repo-wide grep, no other file reads this field.
- Verify with `tsc -b --force` (the project's real build command via project references) — not `tsc --noEmit -p .`, which does not correctly enforce this project's `noUnusedLocals`/`noUnusedParameters` settings the same way (a gap discovered and fixed earlier this session on a sibling repo with the same tsconfig project-references structure).
- Bundler module resolution (`moduleResolution: "bundler"` in `tsconfig.app.json`) resolves the shared package's `exports` map via its `"import"`/`"types"` conditions — no changes needed to the shared package itself for this to work.

---

### Task 1: Migrate all promotion/referral/withdrawal types to the shared package

**Files:**
- Modify: `/Users/user/Projects/Kandebgue/web-kandengue_painel-ts/package.json`
- Modify: `src/interfaces/IPromotion.ts` (reduce to only `IReferralSettings`)
- Modify: `src/core/entities/Promotion.ts` (all 4 entity classes)
- Modify: `src/core/interfaces/IPromotionRepository.ts`
- Modify: `src/core/interfaces/IWithdrawalRepository.ts`
- Modify: `src/modules/Api/firebase/promotion.dao.ts`
- Modify: `src/modules/Api/firebase/withdrawal.dao.ts`
- Modify: `src/services/promotion.service.ts`
- Modify: `src/services/withdrawal.service.ts`
- Modify: `src/viewModels/WithdrawalViewModel.ts`
- Modify: `src/pages/main/Referral/Withdrawals.tsx`
- Modify: `src/pages/main/Promotions/PromotionForm.tsx`

**Interfaces:**
- Consumes: `@rafaelpilartes/kandengue-shared/promotion` (`Promotion`, `PromotionType`, `PromotionRules`, `AllowedUser`, `ReferralConfig`, `ReferralRewardType`, `RideKind`, `RidePaymentMethod`), `@rafaelpilartes/kandengue-shared/usage` (`PromotionUsage`, `PromotionUsageStatus`, `CancellationRecord`), `@rafaelpilartes/kandengue-shared/referral` (`ReferralEarning`, `EarningStatus`), `@rafaelpilartes/kandengue-shared/withdrawal` (`WithdrawalRequest`, `WithdrawalStatus`, `PaymentDetails`). (`AllowedCities`, `CancelledBy`, `CityMatchMode` exist in the shared package but were never named types in this repo — they were inline literals — so no file here imports them by name.)
- Produces: nothing new — this task only removes duplication and rewires imports. The deliverable is the whole repo type-checking clean under `tsc -b --force`, with zero remaining local declarations of any of these types outside `IReferralSettings`.

This task does everything in one pass — trim the interfaces file, migrate the entities, and fix every downstream consumer — so the repo never sits on a commit with a broken build mid-task.

- [ ] **Step 1: Install the package**

```bash
cd /Users/user/Projects/Kandebgue/web-kandengue_painel-ts
npm install "@rafaelpilartes/kandengue-shared@github:RafaelPilartes/lib_npm-kandengue_shared-ts#v1.0.0"
```

- [ ] **Step 2: Reduce `src/interfaces/IPromotion.ts` to only the locally-owned type**

Replace the entire file content with:

```ts
export interface IReferralSettings {
  minimum_withdrawal_amount: number
  updated_by: string
  updated_at: Date
}
```

- [ ] **Step 3: Migrate `src/core/entities/Promotion.ts`**

Replace the whole file with:

```ts
import type {
  Promotion,
  PromotionRules,
  PromotionType,
  ReferralConfig,
  ReferralRewardType
} from '@rafaelpilartes/kandengue-shared/promotion'
import type {
  CancellationRecord,
  PromotionUsage,
  PromotionUsageStatus
} from '@rafaelpilartes/kandengue-shared/usage'
import type { EarningStatus, ReferralEarning } from '@rafaelpilartes/kandengue-shared/referral'
import type {
  PaymentDetails,
  WithdrawalRequest,
  WithdrawalStatus
} from '@rafaelpilartes/kandengue-shared/withdrawal'

export class PromotionEntity implements Promotion {
  id: string
  code: string
  type: PromotionType
  value: number
  max_discount?: number
  min_ride_value?: number
  usage_limit_total?: number
  usage_limit_per_user?: number
  used_count_approx: number
  reserved_count_approx: number
  valid_from: Date
  valid_until: Date
  active: boolean
  rules: PromotionRules
  referral?: ReferralConfig
  created_by: string
  created_at: Date

  constructor(params: Promotion) {
    this.id = params.id
    this.code = params.code
    this.type = params.type
    this.value = params.value
    this.max_discount = params.max_discount
    this.min_ride_value = params.min_ride_value
    this.usage_limit_total = params.usage_limit_total
    this.usage_limit_per_user = params.usage_limit_per_user
    this.used_count_approx = params.used_count_approx ?? 0
    this.reserved_count_approx = params.reserved_count_approx ?? 0
    this.valid_from = params.valid_from
    this.valid_until = params.valid_until
    this.active = params.active
    this.rules = params.rules ?? {}
    this.referral = params.referral
    this.created_by = params.created_by
    this.created_at = params.created_at
  }
}

export class PromotionUsageEntity implements PromotionUsage {
  id: string
  promotion_id: string
  user_id: string
  ride_id: string | null
  status: PromotionUsageStatus
  discount_applied: number
  device_id?: string | null
  grace_cancel_count: number
  driver_cancel_counts: Record<string, number>
  cancellation_history: CancellationRecord[]
  expires_at: Date | null
  created_at: Date
  updated_at: Date

  constructor(params: PromotionUsage) {
    this.id = params.id
    this.promotion_id = params.promotion_id
    this.user_id = params.user_id
    this.ride_id = params.ride_id
    this.status = params.status
    this.discount_applied = params.discount_applied ?? 0
    this.device_id = params.device_id
    this.grace_cancel_count = params.grace_cancel_count ?? 0
    this.driver_cancel_counts = params.driver_cancel_counts ?? {}
    this.cancellation_history = params.cancellation_history ?? []
    this.expires_at = params.expires_at
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}

export class ReferralEarningEntity implements ReferralEarning {
  id: string
  referrer_user_id: string
  referred_user_id: string
  promotion_id: string
  ride_id: string
  reward_type: ReferralRewardType
  reward_value: number
  reward_amount: number
  status: EarningStatus
  requested_at?: Date | null
  paid_at?: Date | null
  created_at: Date

  constructor(params: ReferralEarning) {
    this.id = params.id
    this.referrer_user_id = params.referrer_user_id
    this.referred_user_id = params.referred_user_id
    this.promotion_id = params.promotion_id
    this.ride_id = params.ride_id
    this.reward_type = params.reward_type
    this.reward_value = params.reward_value
    this.reward_amount = params.reward_amount
    this.status = params.status
    this.requested_at = params.requested_at
    this.paid_at = params.paid_at
    this.created_at = params.created_at
  }
}

export class WithdrawalRequestEntity implements WithdrawalRequest {
  id: string
  user_id: string
  earning_ids: string[]
  total_amount: number
  status: WithdrawalStatus
  payment_details: PaymentDetails
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: Date
  paid_at?: Date
  created_at: Date

  constructor(params: WithdrawalRequest) {
    this.id = params.id
    this.user_id = params.user_id
    this.earning_ids = params.earning_ids ?? []
    this.total_amount = params.total_amount
    this.status = params.status
    this.payment_details = params.payment_details
    this.admin_notes = params.admin_notes
    this.reviewed_by = params.reviewed_by
    this.reviewed_at = params.reviewed_at
    this.paid_at = params.paid_at
    this.created_at = params.created_at
  }
}
```

This is the one place the `driver_cancel_count` → `driver_cancel_counts` fix happens (field declaration and constructor default both updated). `AllowedUser` is deliberately **not** imported here — none of the 4 entity classes reference it, and this project has `noUnusedLocals: true`, so an unused import would fail the build. `AllowedUser` is imported directly from the shared package in each of the 3 files that actually need it (Steps 4, 6, 8 below) — confirmed via repo-wide grep that only `PromotionEntity`, `PromotionUsageEntity`, `ReferralEarningEntity`, `WithdrawalRequestEntity` are ever imported from `@/core/entities/Promotion`, nothing else.

- [ ] **Step 4: Fix `src/core/interfaces/IPromotionRepository.ts`**

Replace:
```ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { IAllowedUser } from '@/interfaces/IPromotion'
import {
  PromotionEntity,
  PromotionUsageEntity
} from '../entities/Promotion'
```
with:
```ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/promotion'
import {
  PromotionEntity,
  PromotionUsageEntity
} from '../entities/Promotion'
```
And update the `listAllowedUsers` return type from `Promise<IAllowedUser[]>` to `Promise<AllowedUser[]>`.

- [ ] **Step 5: Fix `src/core/interfaces/IWithdrawalRepository.ts`**

Replace:
```ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { WithdrawalStatus } from '@/interfaces/IPromotion'
```
with:
```ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
```

- [ ] **Step 6: Fix `src/modules/Api/firebase/promotion.dao.ts`**

Replace:
```ts
import type { IAllowedUser } from '@/interfaces/IPromotion'
```
with:
```ts
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/promotion'
```
And update `listAllowedUsers`'s return type from `Promise<IAllowedUser[]>` to `Promise<AllowedUser[]>` (the method body's return object shape is unchanged — `{ user_id, added_at, added_by }` already matches `AllowedUser`'s shape exactly).

- [ ] **Step 7: Fix `src/modules/Api/firebase/withdrawal.dao.ts`**

Replace:
```ts
import type { WithdrawalStatus } from '@/interfaces/IPromotion'
```
with:
```ts
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
```

- [ ] **Step 8: Fix `src/services/promotion.service.ts`**

Replace:
```ts
import type { IAllowedUser } from '@/interfaces/IPromotion'
```
with:
```ts
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/promotion'
```
And update `listAllowedUsers`'s return type from `Promise<IAllowedUser[]>` to `Promise<AllowedUser[]>`.

- [ ] **Step 9: Fix `src/services/withdrawal.service.ts`**

Replace:
```ts
import type { WithdrawalStatus } from '@/interfaces/IPromotion'
```
with:
```ts
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
```

- [ ] **Step 10: Fix `src/viewModels/WithdrawalViewModel.ts`**

Replace:
```ts
import type { WithdrawalStatus } from '@/interfaces/IPromotion'
```
with:
```ts
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
```

- [ ] **Step 11: Fix `src/pages/main/Referral/Withdrawals.tsx`**

Replace:
```ts
import type { WithdrawalStatus } from '@/interfaces/IPromotion'
```
with:
```ts
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
```

- [ ] **Step 12: Fix `src/pages/main/Promotions/PromotionForm.tsx`**

Replace:
```ts
import type {
  PromotionType,
  RideKind,
  RidePaymentMethod
} from '@/interfaces/IPromotion'
```
with:
```ts
import type {
  PromotionType,
  RideKind,
  RidePaymentMethod
} from '@rafaelpilartes/kandengue-shared/promotion'
```

- [ ] **Step 13: Type-check**

```bash
cd /Users/user/Projects/Kandebgue/web-kandengue_painel-ts
npx tsc -b --force
```
Expected: exits 0, zero errors.

- [ ] **Step 14: Confirm no remaining references to the moved types**

```bash
grep -rn "from '@/interfaces/IPromotion'" src/
```
Expected: only the 4 files that use `IReferralSettings` (`IAppConfigRepository.ts`, `appConfig.dao.ts`, `appConfig.service.ts`, `ReferralSettingsViewModel.ts`) — no other file should appear.

- [ ] **Step 15: Commit**

```bash
git add package.json package-lock.json src/interfaces/IPromotion.ts src/core/entities/Promotion.ts src/core/interfaces/IPromotionRepository.ts src/core/interfaces/IWithdrawalRepository.ts src/modules/Api/firebase/promotion.dao.ts src/modules/Api/firebase/withdrawal.dao.ts src/services/promotion.service.ts src/services/withdrawal.service.ts src/viewModels/WithdrawalViewModel.ts src/pages/main/Referral/Withdrawals.tsx src/pages/main/Promotions/PromotionForm.tsx
git commit -m "refactor: migrate to kandengue-shared, fix driver_cancel_count -> driver_cancel_counts drift"
```

---

### Task 2: Full verification and manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Clean type-check from a fresh state**

```bash
cd /Users/user/Projects/Kandebgue/web-kandengue_painel-ts
rm -f node_modules/.tmp/tsconfig.app.tsbuildinfo node_modules/.tmp/tsconfig.node.tsbuildinfo
npx tsc -b --force
```
Expected: exits 0, zero errors.

- [ ] **Step 2: Production build**

```bash
npm run build
```
Expected: `tsc -b && vite build` exits 0.

- [ ] **Step 3: Confirm no orphaned references anywhere in the repo**

```bash
grep -rn "IPromotionUsage\|IReferralEarning\|IWithdrawalRequest\|driver_cancel_count\b" src/ 2>/dev/null
```
Expected: no output (`driver_cancel_count\b` with a word boundary must not match the now-correct `driver_cancel_counts`).

- [ ] **Step 4: Manual smoke test in the browser**

```bash
npm run dev
```
Open the dev server URL and check, with real or emulator data:
- `/promotions` list page loads without console errors, statuses/types render correctly.
- Open one promotion's detail page — usages list and allowed-users list render.
- Create/edit a promotion via the form — submit succeeds.
- `/referral/withdrawals` list page loads, status filter works.
- Open one withdrawal's detail page — linked earnings render, approve/reject/mark-as-paid actions work.

Since this repo has no automated test suite, this manual pass is the only functional verification beyond type-checking — do not skip it.

- [ ] **Step 5: Report**

No commit expected from this task unless the smoke test surfaces an issue requiring a fix (in which case, fix it, re-run Steps 1-4, and commit the fix separately with its own message describing what broke and why).

---

## Self-Review

**Spec coverage:**
- "Migração dos consumidores" step 2 (web-painel) → Tasks 1-2 fully cover it: package installed, `IPromotion.ts` reduced to only the out-of-scope `IReferralSettings`, all 4 entity classes migrated, all 9 downstream consumer files fixed.
- Real schema drift (`driver_cancel_count` vs `driver_cancel_counts`) found by reading the actual current file content rather than assuming a 1:1 rename — fixed in Task 1 Step 3, the only place it's declared.
- No new shared-package release needed — confirmed `AllowedUser` and every other required export already ships in v1.0.0.
- No test suite exists in this repo — Task 2 substitutes `tsc -b --force` plus an explicit manual browser smoke-test checklist, instead of a TDD red/green cycle that doesn't apply here.

**Placeholder scan:** no TBD/TODO, no "add error handling" style steps — every step shows the full file content or an exact before/after diff.

**Type consistency:** `PromotionUsageEntity.driver_cancel_counts: Record<string, number>` (Task 1 Step 3) matches the shared package's `PromotionUsage.driver_cancel_counts` exactly (same shape as the already-migrated node-fastify side). `AllowedUser` is imported directly from the shared package in every consumer that needs it (`IPromotionRepository.ts`, `promotion.dao.ts`, `promotion.service.ts`) rather than re-exported through `Promotion.ts`, avoiding an unnecessary indirection.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-27-kandengue-shared-migration.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
