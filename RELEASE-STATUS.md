# Motera 3D — Phase 29 Ahmedabad Reference Correction

Release scope: unofficial, noncommercial, procedural Narendra Modi Stadium / Motera 3D seat-view explorer.

This document records the implementation after the Ahmedabad-only reference correction. **PASS** means implemented and protected by the production build/regression pipeline. **CONSTRAINED** means the implementation is intentionally approximate because authoritative venue data, permissions, or physical-device acceptance testing are still required. **DEFERRED** means the work belongs in a separate architecture/dependency migration. **PENDING** means implemented on the Phase 29 branch and awaiting the current validation/merge step. **BLOCKED** means code is valid but an external service/account condition prevents delivery.

## Current release status

| Criterion | Status | Closure |
| --- | --- | --- |
| Published cricket field | PASS | Runtime preserves the public **180 × 150 yard** field dimensions and dedicated pitch/crease/wicket/boundary/30-yard-circle rendering. |
| Two-tier bowl capacity calibration | PASS | Procedural bowl depth remains 38 lower + 41 upper rows, producing **109,910 interactive chairs**, close to the public 110,000 seated-capacity figure without shrinking chair pitch. |
| Capacity-label consistency | PASS | Normal UI and WebGL-failure fallback both present **110,000 seated capacity**; 132,000 remains documentation-only extended-capacity context. |
| Bowl geometry accuracy | CONSTRAINED | Tier depth and density are materially closer to the real venue, but exact risers, rake, radii, aisle widths, vomitories, seat coordinates and sector boundaries require CAD/BIM or survey data. |
| Tensile-roof character | PASS | Runtime preserves the shaped PTFE-style tensile surface, single inner tension-ring treatment, paired outer compression-ring treatment, radial ridge/valley cables and catwalk. |
| Outer compression ring | PASS | Phase 29 removes Phase 28's invented tall roof crown and replaces it with shallow bracing between the already-modeled **bi-chord** compression-ring levels documented by Walter P Moore. |
| Roof ring lighting | PASS | Phase 29 removes the continuous glowing-strip approximation and represents the documented **580 Philips ArenaVision luminaires** as distributed instanced fixtures around the catwalk. |
| Roof engineering accuracy | CONSTRAINED | Roof topology follows the documented structural language, but exact cable nodes, membrane prestress, drainage geometry, member sizes and support coordinates are not engineering-grade. |
| Roof/bowl structural separation | PASS | Perimeter V-column treatment remains visually independent from the concrete seating bowl and rises from concourse level. |
| Ahmedabad façade provenance | PASS | Phase 29 removes the generic five-wave ribbon interpretation and replaces it with a **doubly-curved segmented aluminium skin** on tube backing, consistent with HIFAB/SSMB descriptions of the Ahmedabad stadium façade. |
| Façade dimensional/finish accuracy | CONSTRAINED | Exact panel sizes, finish colour, eye-profile geometry, extent and placement still require façade shop drawings or CAD; the current warm aluminium material and pavilion-arc placement are visual approximations. |
| South pavilion/hospitality massing | PASS | The three-level public-reference pavilion treatment remains in place. |
| Pavilion dimensional accuracy | CONSTRAINED | Exact pavilion/club/hospitality floor plates and structural geometry still require authoritative drawings. |
| North arrival sequence | PASS | Public-reference arrival ramp remains approximately 12 m to an elevated podium with a vehicular zone represented below. |
| Stadium campus context | PASS | Procedural campus, academy and three practice-ground representations remain present. |
| Exact site plan | CONSTRAINED | Practice-ground, academy, circulation and podium placement are approximate until survey/site-plan data is available. |
| Reference provenance rules | PASS | `REFERENCE-SOURCES.md` now requires geometry-driving references to explicitly identify Narendra Modi Stadium / Motera Stadium in Ahmedabad and forbids visually similar or unlabeled stadium imagery as evidence. |
| Block/Bay navigation | PASS | Every configured Block/Bay remains indexed across render sections intersecting the mapped Bay. |
| Row labels / seat inventory | CONSTRAINED | Row letters remain positional mappings and generated seat numbers are not official ticket inventory. |
| Stable generated seat URL contract | PASS | `Lxx/Uxx-Rxx-Sxx` identifiers remain the internal generated identity format. |
| Seat picking / seat-view switching | PASS | Existing raycast prefilter, selection, camera transitions, in-place seat switching and share flow remain protected by regression checks. |
| Performance budget | PASS | Phase 29 corrects the Phase 28 draw-call underestimate by explicitly counting the 49-mesh pavilion plus corrected façade, backing, compression bracing and instanced lighting. Current conservative model remains inside the 1600/1775 overview/seat-mode ceilings. |
| Rendering lifecycle | PASS | Invalidation-driven rendering, bounded marker animation, hidden-tab recovery, BFCache handling and WebGL context recovery remain protected. |
| Responsive/accessibility shell | PASS | Existing mobile/tablet/short-screen guards and accessible Block/Bay controls remain in the validation chain. |
| Automatic GitHub validation | PASS | Validation runs automatically on PRs to `main` and pushes to `main`, with manual dispatch retained. |
| Phase 29 branch validation | PENDING | The full `npm run check` + preview smoke test must pass on the Phase 29 PR before merge. |
| Phase 28 production deployment | BLOCKED | Vercel previously reported the account build-rate limit, so the live production alias may still serve Phase 27 until a new production deployment is accepted. |
| Physical cross-browser/device QA | CONSTRAINED | Code-level safeguards exist; acceptance on real Safari/iOS, Firefox, Android and multiple GPU classes remains external. |
| Authoritative digital twin | CONSTRAINED | A genuine seat-accurate digital twin requires permitted CAD/BIM, survey information and official Block/Bay/Row/Seat inventory. |
| CDN runtime dependencies | DEFERRED | Three.js r128 and GSAP 3.12.5 remain pinned on cdnjs; self-hosting/SRI/CSP belongs in a dedicated dependency migration. |
| Three.js modernization | DEFERRED | Upgrade from r128 should be performed separately with browser regression testing. |
| Source architecture consolidation | DEFERRED | The ordered text-transform build remains in place; conversion to canonical modular source is a separate architecture migration. |
| Commercial rights | CONSTRAINED | The code remains derived from StadiView under the repository's noncommercial/community licensing terms; commercial use needs appropriate rights or a clean-room replacement. |

## Phase 29 acceptance criteria

Phase 29 is acceptable for merge only when the complete production build succeeds, final generated JavaScript compiles, all read-only validators pass, the preview smoke test serves the generated Motera 3D application, and no existing Block/Bay, seat-picking, camera, responsive, browser-runtime or performance invariant regresses.

Passing Phase 29 means the model's exterior/roof references are more defensible and specifically tied to **Narendra Modi Stadium, Ahmedabad**. It still does not make the project an official GCA model, façade shop model, structural engineering model or survey-grade digital twin.