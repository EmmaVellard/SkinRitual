# Starter cabinet and scheduling defaults

All 17 products are created together in a blank cabinet. Every classification and scheduling setting is editable. No opening dates, PAO values, expiration dates, strengths, or medical application instructions are invented. Seeding is an atomic, one-time operation with an initialization marker: existing products or history prevent seeding, and deleting seeded products does not bring them back. Empty pre-upgrade cabinets without history receive the starter set once.

| Product | Category | Functional roles | Time | Core / optional | Scheduling defaults |
|---|---|---|---|---|---|
| SKIN1004 Madagascar Centella Ampoule | Serum / ampoule | soothing, hydrating | Both | Optional | Rotate |
| SKIN1004 Hyalu-Cica Water-Fit Sun Serum | Sunscreen | sunscreen | Morning | Core | Choose one sunscreen |
| SKIN1004 Probio-Cica Bakuchiol Eye Cream | Eye cream | eye_treatment | Evening | Optional | Rotate; no retinoid classification inferred |
| SKIN1004 Niacinamide 10 Boosting Shot Ampoule | Serum / ampoule | brightening | Evening | Optional, intensive | Max 2 uses / rolling 7 days; minimum 2 days apart; rotate with brightening pad |
| SKIN1004 Poremizing Quick Clay Stick Mask | Mask | pore_mask | Evening | Optional, intensive | Max 1 use / rolling 7 days; minimum 6 days apart |
| SKIN1004 Tone Brightening Dark Spot Ampoule Pad | Pad | brightening | Both | Optional, intensive | Max 3 uses / rolling 7 days; minimum 1 day apart; at most one pad |
| Medicube Zero Pore Pad | Pad | pore_exfoliating | Evening | Optional, intensive | Max 2 uses / rolling 7 days; minimum 3 days apart |
| Medicube Deep Vita C Capsule Cream | Moisturizer | moisturizer, brightening | Both | Core | Moisturizer slot; secondary brightening does not exclude serum |
| Beauty of Joseon Relief Sun: Rice + Probiotics | Sunscreen | sunscreen | Morning | Core | Choose one sunscreen; check market version |
| Round Lab 1025 Dokdo Cleanser | Cleanser | second_cleanse, gentle_cleanse | Both | Core | Max 2 uses / rolling 7 days; minimum 3 days apart; no minimum usage guarantee |
| SKIN1004 cleansing oil | Cleansing oil / balm | first_cleanse | Evening | Core | Linked to foam; selected together only if both eligible |
| SKIN1004 cleansing foam | Cleanser | second_cleanse | Evening | Core | Immediately after linked oil; may serve as standalone cleanser if oil unavailable |
| Dr.G R.E.D Blemish Clear Soothing Cream | Moisturizer | moisturizer, soothing | Both | Core | Rotate with other moisturizers |
| Avène Hydrance Light Hydrating Emulsion | Moisturizer | moisturizer, hydrating | Both | Core | Rotate with other moisturizers; non-SPF version assumed |
| Differin | Treatment | retinoid_treatment | Evening | Optional, intensive | Automatic suggestions OFF; schedule must be user-configured |
| Cutacnyl | Treatment | acne_treatment | Evening | Optional, intensive | Automatic suggestions OFF; application area: chin |

“Intensive” is a scheduling flag, not a finding about irritation or safety. Other starter products use the gentle scheduling flag; it does not assert tolerability. Maxima are editable app defaults, not recommended treatment frequencies. Products without limits remain subject to rotation, duplicate groups, and optional-step budgets.

## Functional roles and duplicate groups

Roles: first_cleanse, second_cleanse, gentle_cleanse, hydrating, soothing, brightening, pore_exfoliating, pore_mask, eye_treatment, acne_treatment, retinoid_treatment, moisturizer, sunscreen. Round Lab is assigned second_cleanse and gentle_cleanse.

At most one selection per function group: sunscreen; oil cleanser; water-based cleanser; moisturizer; pad; eye product; mask; brightening leave-on step; soothing/hydrating ampoule. Products can occupy multiple groups (the brightening pad occupies both pad and brightening). Primary use matters: brightening cream remains a moisturizer. Soothing and brightening ampoules may coexist within the optional budget.

## Ordering

Role/category derives: first cleanse → water cleanse → rinse-off mask → tone/pad → serum/ampoule → treatment → eye care → moisturizer → protect. Product time assignment narrows the sequence for morning or evening. The form shows named routine steps, offers automatic or explicit step selection, and shows optional numeric ordering under Advanced ordering. Existing numeric orders are preserved until the user selects automatic ordering. A linked oil/foam pair stays adjacent even with an override.

## Rotation and intensity

Completed steps, including in unfinished routines, count as uses. Unchecked/skipped steps and future timestamps do not. Least recently used wins; never-used products rank first, with stable product IDs breaking ties. Scores do not depend on input list order or on AI. New routines use updated history; started routines retain their stored steps and explanations.

Hard filters: status, morning/evening assignment, automatic-suggestion opt-in, elapsed spacing, and rolling seven-day caps. A completed double-cleanse pair is selected before standalone cleanser alternatives. Core groups are selected before optional candidates. Optional candidates must fit duplicate-function, intensity, same-day pore, and step-count limits. Declining one candidate leaves room for the next eligible one.

Default maximum: one optional morning step, two optional evening steps. Evening budget is editable from 0–3; morning uses at most one, or zero if the configured optional budget is zero. Core steps remain subject to function groups and hard eligibility constraints.

Routine intensity: gentle permits zero intensive products; normal permits one; active permits two. All intensity flags and the routine mode are editable. The separate default same-day pore rule excludes a pore mask after an exfoliating pore pad, and vice versa, including completed steps in today's other routine. Turning off this rule does not turn off the intensity budget.

## Conservative classification

Round Lab 1025 Dokdo Cleanser, Beauty of Joseon Relief Sun Rice + Probiotics, and SKIN1004 Light Cleansing Oil / Ampoule Foam now have named guides. Avène market version, Zero Pore Pad version and treatment strengths remain uncertain. The eye cream is an eye step, not assumed equivalent to a retinoid treatment. Differin and Cutacnyl receive only the requested roles, evening assignment, and chin area for Cutacnyl; scheduling opt-in is required.

## Current boundaries

No AI, ingredient inference, medical decisions, external product lookups, or backend. General arbitrary conflict/dependency editing is still later work. History correction, versioned backup/restore, eligible swaps, skip controls, day browsing, and recorded lifecycle-date notices are implemented. The implemented controls edit the specific requested routine budgets, roles, frequency limits, and oil/foam link. The same-day pore rule consults current product roles; changing or deleting a product can change how old uses are classified. Started checklists are intentionally not regenerated.


## Daily records and backups

Today supports past/current/future dates. Past/current changes save to that local date and period; future dates are read-only suggestions. Past checkbox uses are timestamped at 08:00/20:00 local time, and the history editor exposes each actual use time. Corrections use optimistic checks against the saved record to avoid overwriting a newer edit from another tab.

A skip freezes a checklist without counting a use. A swap validates against history and remaining steps, preserves used products, records the outgoing product as skipped, and adds the replacement unchecked. Linked oil/foam swap together to or from an eligible standalone cleanser. Persisted undo actions restore affected steps only and reject undo if those steps changed later. The history editor can still record what actually happened.

Backup version 1 stores products, settings, and routine snapshots. Import validates size, version, field types, dates, ranges, duplicate IDs, and step consistency before an atomic replacement transaction. A one-level local restore point supports undo. The existing initialization marker prevents reseeding after an empty import. No additional server or database version is required.

Lifecycle dates use calendar-month addition with month-end clamping. The earlier of PAO and printed expiration is shown, with source labels. Today highlights recorded dates within 30 days or past dates, excluding finished products. These notices do not change product scheduling eligibility.

## Week previews and Progress

Day browsing uses a seven-day strip and week arrows. Future dates within 31 days simulate intervening suggestions as if followed, exclusively in memory; they do not create routine logs. Actual routine selection still uses recorded history. Tests check that a projected week includes mask, pore-pad, and brightening slots without duplicate pore products or treatment opt-ins. Farther previews use only current history and are labeled tentative.

Progress is a self-reported follow-through ratio, not a skin score: used / (used + skipped + unchecked) in recorded routines, excluding unfinished sessions today and swapped-out products. Days without records stay unknown, with coverage shown separately. The new optional `replacedById` step field marks swaps for scoring and is validated on backup import; earlier swap reasons are also recognized.

Privacy, backups, and routine preferences now live in Settings. Explanations on Today only describe non-skipped steps currently in the routine. Online-guidance investigation is in `docs/ONLINE-GUIDANCE.md`; no personal data is sent to online services.

## Reviewed product information and Advice

The bundled product guide was reviewed September 10, 2026. Benefits and manufacturer usage are kept separate from editable personal notes and app scheduling. Names plus brands are matched, never seed IDs alone. Broad names, treatment strengths, and Air-Fit Light’s unavailable full page remain explicitly unconfirmed. The Advice page checks enabled time-specific basic roles, compares overlapping benefits and offers conditional changes. It does not infer a skin condition or auto-enable medication.

A one-time `evening-niacinamide-v1` migration moves matching existing niacinamide products to evenings. Only the old unrestricted gentle default is replaced with intensive / 2 uses weekly / 2 days apart; custom frequencies, enabled state, status and history are preserved. Later user edits remain editable and are not overwritten on reload.

Local automatic time is morning 05:00–16:59, evening 17:00–04:59. A manual period choice expires at the next local date or period boundary, or when returning to Today / Use current time. The current-time tab appears first.


## Cabinet update and language

The September cabinet correction replaces COSRX with Round Lab 1025 Dokdo Cleanser under the same ID, removes the recognized Air-Fit Light entry, adds DR.G and Avène once, and normalizes recognized names. Personal notes, dates, statuses and custom frequencies remain. Historical snapshots retain their original data; the UI uses current cabinet names when the product still exists. Intentional backup restores bypass migrations so they remain exact replacements.

Brightening pads use an editable active intensity, maximum 3 uses per rolling week and 1 day spacing. Evening pad preference prioritizes a due pad after 2 days, with duplicate, optional and intensity limits still enforced. Full-week projection tests cover masks, exfoliating pads and niacinamide.

Language is an optional en/fr preference in IndexedDB and backups. Display text uses a bundled French dictionary; product names and personal notes are never rewritten. Almost-empty flags and optional YesStyle URLs are local Product fields. Known product pages have reviewed YesStyle links, while medications have no invented retailer listing.

History and Progress share one weekly view. Benefits open independently of editing. Settings stacks preference cards vertically and displays all choices as buttons. Category filters use wrapping buttons, and Today supports almost-empty reminders. Product editor sections stay expanded.

Cloudy Mist (seed-18) is a hydrating/soothing optional mist for both periods, added once. Morning-start preference defaults to cleanser; mist-first excludes automatic cleansers and prioritizes an eligible hydrating mist within the optional budget. It does not change evening routines or infer cleansing benefits.
