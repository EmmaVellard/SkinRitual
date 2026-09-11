# Online skincare guidance: investigation and recommended next step

Checked September 10, 2026. The app currently provides local observations and optional links to reviewed sources. It does not send usage history or fetch live recommendations.

## What the current app can reasonably say

It can identify repeated skips, show recent recorded use, identify unspecified product variants, and suggest reviewing the optional-step budget. These are scheduling observations. It cannot infer skin response, suitability, or treatment effectiveness from checkmarks. A high score is not evidence that a regimen is safe or effective.

The American Academy of Dermatology discusses harm from overusing exfoliating products promoted through social trends. That supports separating popularity from personalized guidance, rather than ranking new actives by trendiness. [AAD guidance](https://www.aad.org/public/everyday-care/skin-care-basics/care/skin-care-in-your-20s).

The official SKIN1004 clay-mask page provides product identity, ingredient list, and usage directions. It is useful for factual matching but also contains manufacturer claims; it should not be treated as independent clinical evidence. [Official product page](https://www.skin1004.com/products/poremizing-quick-clay-stick-mask).

## Smallest useful online extension

1. Maintain a small, reviewed product-information file with exact name/variant/market, official URL, ingredient text as published, source type, last checked date, and a plain-language description of what is known or missing. Start with this cabinet rather than an open marketplace.
2. Bundle that file with the app. Updates can be published through GitHub Pages, keeping matching local, offline-capable, and free of secret credentials.
3. If independent refresh is useful, offer an explicit “Check product information updates” button fetching that same-origin, versioned file. Show when it was last checked and retain the previous copy offline. This does not require a backend or uploading personal data.
4. Compare functional overlap, incomplete labels, and user-defined scheduling rules first. Do not infer new incompatibilities or recommend stronger treatments from ingredient names or popularity.
5. Add a separate dated “Reading” section if trends are wanted, each labeled as professional guidance, manufacturer information, or commentary. No automatic routine changes from headlines.

## Why not scrape the web directly from the phone?

GitHub Pages serves static files; it does not provide an application server for private credentials or arbitrary scraping. [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Browser requests to other sites depend on those sites’ CORS permissions. An arbitrary manufacturer's web page is not a reliable browser-readable API. This is a technical constraint, not evidence that a product source is trustworthy or untrustworthy. [MDN CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

An API that requires a secret would need a separate server-side service or a build-time update process. Do not put credentials in the app. No specific licensed product-data API has been selected or verified in this investigation; coverage, exact variants, terms, provenance, and update frequency would need evaluation before choosing one.

## What is still missing for “fits me” recommendations

The generic COSRX cleanser, Beauty of Joseon sunscreen, and SKIN1004 oil/foam need exact variant names before ingredient comparison. Skin preferences and reported tolerability would also be needed; the app currently records neither. Even with those inputs, treatment decisions remain outside a scheduling app’s scope. Differin and Cutacnyl are not enabled or intensified automatically.

The bundled reviewed guide and local cabinet-based Advice page are now implemented. Independent online refresh and live trends remain proposed. Progress focuses on recorded usage. Opening a source uses the internet and the destination has its own privacy practices; no user history is added to the URL or transmitted by the app.

## Review scope, September 10, 2026

`lib/product-guidance.ts` contains the source link and review boundary for every starter entry. Confirmed named cosmetic pages: Centella Ampoule, international Hyalu-Cica Water-Fit Sun Serum, Probio-Cica eye cream, Niacinamide 10, clay stick mask, Dark Spot Pad, and Deep Vita C cream. These are manufacturer descriptions, not independent efficacy findings.

Uncertain: Air-Fit Light is present in the official related-product listing but its full page could not be retrieved; no SPF or ingredient list was invented. Medicube standard Zero Pore Pad is documented but Mild versus standard needs confirmation. COSRX, Beauty of Joseon and SKIN1004 oil/foam have only possible-match pages, clearly labeled. Differin’s 0.1% gel and Cutacnyl’s 2.5% leaflets support their medication identity, but the user’s formulation and strengths are unknown. No treatment dose was assigned.

The niacinamide manufacturer lists a spicule-containing formula and gradual introduction. The app uses the user-requested evening assignment and an editable conservative default, without automatic escalation.

Advice distinguishes cabinet coverage from usage and suitability. Missing basic-role settings are actionable; the optional plain-moisturizer suggestion applies only when the active moisturizer is the known brightening Medicube cream. Unknown creams do not get classified as plain or unsuitable. A goal selector changes only the products compared, not schedules or medical recommendations.


## Morning cleansing and cream timing — checked September 11, 2026

- [Cleveland Clinic](https://health.clevelandclinic.org/how-often-should-you-wash-your-face): morning water-only washing may suit dry or sensitive skin, while a cleanser is used at night. This does not establish a facial mist as a cleansing substitute or identify the user's skin type. The user confirmed SKIN1004 Hyalu-Cica Cloudy Mist. Its [manufacturer page](https://www.skin1004.com/products/skin1004-madagascar-centella-hyalu-cica-cloudy-mist) describes moisturizing care and use at 20–30 cm, one or two sprays; it is not a cleanser.
- [AAD](https://www.aad.org/public/everyday-care/skin-care-basics/care/face-washing-101): general guidance is gentle cleansing morning and night and after heavy sweating. Morning cleansing needs are therefore not replaced by a universal mist-first rule.
- [Medicube Deep Vita C](https://medicube.us/products/deep-vita-c-capsule-cream): directions and FAQ allow morning and evening use, after serum, with sunscreen in the morning. No nighttime superiority is established by these directions. Keep the editable both-period assignment.

Manual morning cleanser swaps can explicitly choose the linked SKIN1004 oil/foam pair. This overrides only the pair's time assignment for that one routine, retaining availability, spacing, frequency and intensity checks. Automatic scheduling remains evening-only.
