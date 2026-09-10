# Product and architecture

Update: the starter cabinet and role-based scheduling are now implemented. See [DEFAULTS.md](./DEFAULTS.md) for the current behavior and editable defaults. The remaining text preserves the original foundation plan; the proposed general rule store and preferred-frequency scoring below are not implemented.

## Scope and tradeoffs

The primary task is “What should I use on my skin right now?” Keep Today actionable and Cabinet editable. Add Rules and History navigation only as their features arrive. No rigid weekday scheduler, shopping, diagnosis, ingredient advice, AI, server, authentication, or progress tracking.

Next.js App Router + React + TypeScript + Tailwind, statically exported. IndexedDB via idb stores personal data; no API routes. Next.js adds build machinery compared with Vite but follows the requested stack and still exports ordinary static assets. Database access is lazy to keep server rendering browser-independent. Prefer small pure domain functions over a general rule interpreter or state framework.

## Data model

Implemented Product: UUID; brand; name; category; routineOrder (integer 0–999); timeOfDay (morning/evening/both); status (active/paused/finished); instruction; notes; openedDate (local YYYY-MM-DD or empty); paoMonths (nullable integer); expirationDate (local date or empty); createdAt and updatedAt (UTC timestamps).

Implemented RoutineLog: stable id `localDate:period`; date; timeOfDay; steps[]; completedAt (nullable timestamp); updatedAt. Each step snapshots productId, name, brand, category, instruction, order, completedAt, and skipped. Skipped is reserved for the later manual-skip flow and is not inferred from unchecked steps. This avoids parallel ID lists drifting out of sync. Product deletion retains snapshots. One session per local date and period is intentional for MVP.

Phase 2 adds Product.scheduling: preferredUsesPerWeek (nullable), minSpacingDays (default 0), maxUsesPerWeek (nullable). Null preferred frequency means flexible; no invented usage target. Track usage from completed steps, including incomplete routines, not from suggestions or session completion alone. Two completed sessions count as two uses.

Phase 3 adds a ProductRule store with a discriminated union, id, enabled, and timestamps:

- conflict: productIds tuple of two distinct IDs, scope morning/evening/both; symmetric.
- alternate: productIds array of at least two unique IDs; select at most one per routine.
- requires: productId, prerequisiteId; prerequisite must be selected earlier.
- after: productId, predecessorId; ordering only if both are selected.

Keep min spacing on Product rather than also encoding the same setting as a rule. Validate references, reject self-relations and dependency cycles, and flag dangling rules after product deletion. Rule labels must say that these are personal scheduling choices.

## Deterministic engine proposal (not implemented in Phase 1)

Inputs: explicit evaluation timestamp, local date, period, product snapshot, rules, actual completed-step history strictly before the evaluation timestamp. No hidden clock and no randomness.

1. Build usage counts and last-used times from completed steps. A skipped or unchecked product does not count as usage.
2. Filter inactive products, wrong period, spacing violations, and hard caps. Define minimum spacing as elapsed `N * 24h`; explain this in the future control. Define weekly caps as rolling preceding 168 hours, including today's previous uses. This avoids Monday resets and DST ambiguity.
3. Compute preference deficit: target uses in seven days minus actual rolling count. Rank never-used products first within equal deficit, then least recently used, then order and stable ID. Preferred frequency is a soft ranking input, not a medical instruction or a hard weekly ban; flexible products have no frequency target.
4. Apply alternating groups and conflicts in stable ranked order. For required dependencies, evaluate the prerequisite closure first; select the closure atomically only when all members pass hard limits and are compatible. If no feasible combination exists, skip it with an explicit reason. Do not force a category into an impossible routine.
5. Topologically order dependencies and after rules, using routineOrder and ID for ties. Reject cycles at rule editing; defend against invalid imported cycles in the engine.
6. Return selected steps and per-product structured reasons: code, related product IDs, observed counts/dates, and limit. Suggested/skipped explanation UI can format these without parsing prose.
7. Freeze the plan on first completion. Future checks do not rerun ranking. Unstarted plans may reflect cabinet changes.

Conflicts in the same routine also need to consider products already used in that session. Cross-session/day exclusion is a separate explicit future rule, never inferred from ingredients. Category does not imply exclusivity: two cleansers can be intentional. In Phase 2, only explicit groups select one item among alternatives.

## Risks and boundaries

- Storage eviction and origin changes: local-first is private, not a backup. Add validated JSON backup/restore before long-term reliance; stable hosting origin matters.
- Time and frequency: use explicit timezone/date semantics, test midnight/DST, and specify whether a limit counts applications or distinct days. This proposal counts applications.
- Contradictory rules: reject cycles, show exclusions, and never silently violate hard constraints to fill a routine.
- Over-selection: frequency alone cannot explain whether two products are alternatives. Require explicit alternating/conflict groups.
- Edits/deletion: preserve routine snapshots. An edit does not rewrite the record of what was used.
- PAO: add months with end-of-month clamping; use the earlier of PAO and printed expiration when both exist. Label source and date precision; a date is a recorded lifecycle reference, not proof of safety or a diagnosis. Missing opening date means no calculated PAO date.
- PWA: offline requires successful cache installation first. Home Screen and Safari may have separate storage. Device installation, keyboard interaction, VoiceOver, and offline update flow need real iPhone QA.
- Notifications: not part of MVP. iOS supports Web Push for Home Screen apps, but a local-only page cannot promise reliable scheduled reminders while closed. Revisit notification delivery architecture separately instead of adding a server now.

## Milestones and acceptance

1. Foundation (implemented): product CRUD/status, assignments/order, Today switching, checks/undo, IndexedDB, responsive shell, install metadata and offline production assets. Check persistence and snapshot behavior; no fabricated cabinet contents.
2. Scheduling: usage indexing, targets, spacing, rolling caps, alternating groups. Pure engine tests cover boundary instants, never-used items, same-day multiple sessions, and deterministic ordering.
3. Personal rules: conflicts, required products, ordering, validated editor and explanations. Test dependency closure and contradictory constraints.
4. Lifecycle: PAO calculations and contextual warnings, with precise source labels; no claim that product condition can be determined from dates.
5. History: date/period view, explicit skips, retrospective edits, basic usage counts. Corrections must feed engine history. Add versioned backup/restore before sustained daily use.

Later only: local photos, progress notes, ingredients and conservative external product information. No implementation now.

## References

- Next.js static exports: https://nextjs.org/docs/app/guides/static-exports
- WebKit Home Screen Web Push: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
