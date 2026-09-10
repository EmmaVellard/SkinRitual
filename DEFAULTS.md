# Starter cabinet and scheduling defaults

All 15 products are created together in a blank cabinet. Every classification and scheduling setting is editable. No opening dates, PAO values, expiration dates, strengths, or medical application instructions are invented. Seeding is an atomic, one-time operation with an initialization marker: existing products or history prevent seeding, and deleting seeded products does not bring them back. Empty pre-upgrade cabinets without history receive the starter set once.

| Product | Category | Functional roles | Time | Core / optional | Scheduling defaults |
|---|---|---|---|---|---|
| SKIN1004 Madagascar Centella Ampoule | Serum / ampoule | soothing, hydrating | Both | Optional | Rotate |
| SKIN1004 Hyalu-Cica Water-Fit Sun Serum | Sunscreen | sunscreen | Morning | Core | Choose one sunscreen |
| SKIN1004 Centella Air-Fit Suncream Light | Sunscreen | sunscreen | Morning | Core | Choose one sunscreen |
| SKIN1004 Probio-Cica Bakuchiol Eye Cream | Eye cream | eye_treatment | Evening | Optional | Rotate; no retinoid classification inferred |
| SKIN1004 Niacinamide 10 Boosting Shot Ampoule | Serum / ampoule | brightening | Both | Optional | Rotate with brightening pad |
| SKIN1004 Poremizing Quick Clay Stick Mask | Mask | pore_mask | Evening | Optional, intensive | Max 1 use / rolling 7 days; minimum 6 days apart |
| SKIN1004 Tone Brightening Dark Spot Ampoule Pad | Pad | brightening | Both | Optional | Rotate with niacinamide; at most one pad |
| Medicube Zero Pore Pad | Pad | pore_exfoliating | Evening | Optional, intensive | Max 2 uses / rolling 7 days; minimum 3 days apart |
| Medicube Deep Vita C Capsule Cream | Moisturizer | moisturizer, brightening | Both | Core | Moisturizer slot; secondary brightening does not exclude serum |
| Beauty of Joseon sunscreen | Sunscreen | sunscreen | Morning | Core | Choose one sunscreen; exact variant unspecified |
| COSRX cleanser | Cleanser | second_cleanse | Both | Core | Max 2 uses / rolling 7 days; minimum 3 days apart; no minimum usage guarantee |
| SKIN1004 cleansing oil | Cleansing oil / balm | first_cleanse | Evening | Core | Linked to foam; selected together only if both eligible |
| SKIN1004 cleansing foam | Cleanser | second_cleanse | Evening | Core | Immediately after linked oil; may serve as standalone cleanser if oil unavailable |
| Differin | Treatment | retinoid_treatment | Evening | Optional, intensive | Automatic suggestions OFF; schedule must be user-configured |
| Cutacnyl | Treatment | acne_treatment | Evening | Optional, intensive | Automatic suggestions OFF; application area: chin |

“Intensive” is a scheduling flag, not a finding about irritation or safety. Other starter products use the gentle scheduling flag; it does not assert tolerability. Maxima are editable app defaults, not recommended treatment frequencies. Products without limits remain subject to rotation, duplicate groups, and optional-step budgets.

## Functional roles and duplicate groups

Roles: first_cleanse, second_cleanse, gentle_cleanse, hydrating, soothing, brightening, pore_exfoliating, pore_mask, eye_treatment, acne_treatment, retinoid_treatment, moisturizer, sunscreen. `gentle_cleanse` is available for manual classification but not inferred for the unspecified COSRX cleanser.

At most one selection per function group: sunscreen; oil cleanser; water-based cleanser; moisturizer; pad; eye product; mask; brightening leave-on step; soothing/hydrating ampoule. Products can occupy multiple groups (the brightening pad occupies both pad and brightening). Primary use matters: brightening cream remains a moisturizer. Soothing and brightening ampoules may coexist within the optional budget.

## Ordering

Role/category derives: first cleanse → water cleanse → rinse-off mask → tone/pad → serum/ampoule → treatment → eye care → moisturizer → protect. Product time assignment narrows the sequence for morning or evening. The form shows named routine steps, offers automatic or explicit step selection, and hides optional numeric ordering under Advanced ordering. Existing numeric orders are preserved until the user selects automatic ordering. A linked oil/foam pair stays adjacent even with an override.

## Rotation and intensity

Completed steps, including in unfinished routines, count as uses. Unchecked/skipped steps and future timestamps do not. Least recently used wins; never-used products rank first, with stable product IDs breaking ties. Scores do not depend on input list order or on AI. New routines use updated history; started routines retain their stored steps and explanations.

Hard filters: status, morning/evening assignment, automatic-suggestion opt-in, elapsed spacing, and rolling seven-day caps. A completed double-cleanse pair is selected before standalone cleanser alternatives. Core groups are selected before optional candidates. Optional candidates must fit duplicate-function, intensity, same-day pore, and step-count limits. Declining one candidate leaves room for the next eligible one.

Default maximum: one optional morning step, two optional evening steps. Evening budget is editable from 0–3; morning uses at most one, or zero if the configured optional budget is zero. Core steps remain subject to function groups and hard eligibility constraints.

Routine intensity: gentle permits zero intensive products; normal permits one; active permits two. All intensity flags and the routine mode are editable. The separate default same-day pore rule excludes a pore mask after an exfoliating pore pad, and vice versa, including completed steps in today's other routine. Turning off this rule does not turn off the intensity budget.

## Conservative classification

Beauty of Joseon sunscreen, COSRX cleanser, and SKIN1004 oil/foam have unspecified exact variants. Only the supplied broad functions are used; no actives, concentrations, or extra compatibility properties are guessed. The eye cream is an eye step, not assumed equivalent to a retinoid treatment. Differin and Cutacnyl receive only the requested roles, evening assignment, and chin area for Cutacnyl; scheduling opt-in is required.

## Current boundaries

No AI, ingredient inference, medical decisions, external product lookups, or backend. General arbitrary conflict/dependency editing and history correction are still later work. The implemented controls edit the specific requested routine budgets, roles, frequency limits, and oil/foam link. The same-day pore rule consults current product roles; changing or deleting a product can change how old uses are classified. Started checklists are intentionally not regenerated.
