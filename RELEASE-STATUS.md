# Motera 3D — Phase 28 Public-Reference Completion

Release scope: unofficial, noncommercial, procedural Narendra Modi Stadium / Motera 3D seat-view explorer.

This document records the implementation after the Phase 28 reference-completion pass. **PASS** means implemented and protected by the production build/regression pipeline. **CONSTRAINED** means the implementation is intentionally approximate because authoritative venue data, permissions, or physical-device acceptance testing are still required. **DEFERRED** means the work belongs in a separate architecture/dependency migration. **PENDING** means implemented on the release branch but awaiting the current PR validation/merge/deployment step.

## Current release status

| Criterion | Status | Closure |
| --- | --- | --- |
| Published cricket field | PASS | Runtime preserves the public **180 × 150 yard** field dimensions and the dedicated pitch/crease/wicket/boundary/30-yard-circle rendering. |
| Two-tier bowl capacity calibration | PASS | Procedural bowl depth is 38 lower + 41 upper rows, producing **109,910 interactive chairs**, close to the public 110,000 seated-capacity figure without shrinking chair pitch. |
| Capacity-label consistency | PASS | Normal UI and WebGL-failure fallback both present **110,000 seated capacity**; 132,000 remains documentation-only extended-capacity context. |
| Bowl geometry accuracy | CONSTRAINED | Tier depth and density are materially closer to the real venue, but exact risers, rake, radii, aisle widths, vomitories, seat coordinates and sector boundaries require CAD/BIM or survey data. |
| Vomitory rhythm | PASS | Mechanically repeated every-four-section tunnel placement is replaced by an irregular balanced pattern; exact venue positions remain constrained by unavailable authoritative geometry. |
| Tensile-roof character | PASS | Flat-annulus treatment is replaced by a shaped tensile surface with inner tension-ring treatment, paired outer compression-ring treatment, radial ridge/valley cables and an inner catwalk. |
| Roof perimeter silhouette | PASS | Phase 28 adds a visible triangulated outer perimeter truss and continuous inner roof-edge light ring to better match public exterior/interior references. |
| Roof engineering accuracy | CONSTRAINED | Roof topology follows the real structural language, but cable nodes, membrane prestress, drainage geometry, member sizing and exact support coordinates are not engineering-grade. |
| Roof/bowl structural separation | PASS | Perimeter V-column treatment rises from concourse level to the roof rather than visually supporting the roof from grade through the seating bowl. |
| Signature bronze/gold façade | PASS | Phase 28 restores the real undulating bronze/gold wave/eye architectural identity that Phase 27 incorrectly removed, with a curved glazed entrance treatment. |
| Façade dimensional/panel accuracy | CONSTRAINED | Wave amplitude, panel subdivision, entrance span and exact curvature are reconstructed from public imagery rather than façade shop drawings. |
| South pavilion/hospitality massing | PASS | The Phase 27 placeholder is replaced by a public-reference three-level pavilion treatment with glazing/deck bands. |
| Pavilion dimensional accuracy | CONSTRAINED | Exact pavilion/club/hospitality floor plates and structural geometry still require authoritative drawings. |
| North arrival sequence | PASS | A public-reference arrival ramp rises approximately 12 m to an elevated podium with a vehicular zone represented below. |
| Stadium campus context | PASS | The surrounding campus is expanded to a roughly 60-acre-scale procedural footprint with three practice-ground representations, academy massing and a service-road layer. |
| Exact site plan | CONSTRAINED | Practice-ground, academy, circulation and podium placement are approximate until survey/site-plan data is available. |
| Block/Bay navigation | PASS | Every configured Block/Bay is indexed across render sections intersecting the mapped Bay. |
| Row labels / seat inventory | CONSTRAINED | Row letters remain positional mappings and generated seat numbers are not official ticket inventory. |
| Stable generated seat URL contract | PASS | `Lxx/Uxx-Rxx-Sxx` identifiers remain the internal generated identity format; the project does not claim that these IDs correspond to official seats. |
| Seat picking / seat-view switching | PASS | Existing raycast prefilter, seat selection, seat camera transitions, in-place seat switching and share flow remain protected by regression checks. |
| Performance budget | PASS | The 109,910-chair model plus Phase 28 exterior additions are explicitly budgeted for interactive-seat count, per-section instances, instance attributes, draw calls, HTML size, framebuffer size and shadow-map policy. |
| Rendering lifecycle | PASS | Invalidation-driven rendering, bounded marker animation, hidden-tab recovery, BFCache handling and WebGL context recovery remain protected. |
| Responsive/accessibility shell | PASS | Existing mobile/tablet/short-screen guards and accessible Block/Bay controls remain in the validation chain. |
| Automatic GitHub validation | PENDING | Workflow now runs `npm run check` and preview smoke testing on PRs to `main`, pushes to `main`, and manual dispatch; this release must demonstrate a successful run before merge. |
| Phase 27 live production | PASS | Merge commit `72c3a200e5ee23616ff30f123c3a1aacfbb8ca17` is live on Vercel production. |
| Phase 28 production deployment | PENDING | Vercel currently reports a build-rate-limit status for branch previews; Phase 28 must pass GitHub validation, merge to `main`, and then be verified on the production alias. |
| Physical cross-browser/device QA | CONSTRAINED | Code-level safeguards exist; acceptance on real Safari/iOS, Firefox, Android and multiple GPU classes remains external. |
| Authoritative digital twin | CONSTRAINED | A genuine seat-accurate digital twin requires permitted CAD/BIM, survey information and official Block/Bay/Row/Seat inventory. |
| CDN runtime dependencies | DEFERRED | Three.js r128 and GSAP 3.12.5 remain pinned on cdnjs; self-hosting/SRI/CSP belongs in a dedicated dependency migration. |
| Three.js modernization | DEFERRED | Upgrade from r128 should be performed separately with browser regression testing. |
| Source architecture consolidation | DEFERRED | The ordered text-transform build remains in place; conversion to canonical modular source is a separate architecture migration. |
| Commercial rights | CONSTRAINED | The code remains derived from StadiView under the repository's noncommercial/community licensing terms; commercial use needs appropriate rights or a clean-room replacement. |

## Phase 28 acceptance criteria

Phase 28 is acceptable for merge when the complete production build succeeds, all read-only validators pass, the preview smoke test serves the generated Motera 3D application, and no existing Block/Bay, seat-picking, camera, responsive, browser-runtime or performance invariant regresses.

Passing Phase 28 means **a more faithful public-reference recreation with corrected exterior identity and roof silhouette**. It does not mean the project has become an official Gujarat Cricket Association model or an engineering/survey-grade digital twin.