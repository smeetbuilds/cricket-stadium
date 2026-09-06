# Motera 3D — Phase 27 Public-Reference Fidelity

Release scope: unofficial, noncommercial, procedural Narendra Modi Stadium / Motera 3D seat-view explorer.

This document records the current implementation after the public-reference fidelity pass. **PASS** means implemented and protected by the build/regression pipeline. **CONSTRAINED** means the implementation is intentionally approximate because authoritative venue data, permissions, or physical-device acceptance testing are still required. **DEFERRED** means the work belongs in a separate architecture/dependency migration.

## Current release status

| Criterion | Status | Closure |
| --- | --- | --- |
| Published cricket field | PASS | Runtime preserves the public **180 × 150 yard** field dimensions and the dedicated pitch/crease/wicket/boundary/30-yard-circle rendering. |
| Two-tier bowl capacity calibration | PASS | Procedural bowl depth is increased to 38 lower + 41 upper rows, producing **109,910 interactive chairs**, close to the public 110,000 seated-capacity figure without shrinking chair pitch. |
| Extended-capacity labeling | PASS | The interactive UI no longer presents 132,000 as the generated chair count; 132,000 remains documentation-only extended-capacity context. |
| Bowl geometry accuracy | CONSTRAINED | Tier depth and capacity are materially closer to the real venue, but exact risers, radii, aisle widths, vomitories, seat coordinates and sector boundaries require CAD/BIM or survey data. |
| Vomitory rhythm | PASS | Mechanically repeated every-four-section tunnel placement is replaced by an irregular balanced pattern; exact venue positions remain constrained by unavailable authoritative geometry. |
| Tensile-roof character | PASS | Flat-annulus treatment is replaced by a shaped tensile surface with inner tension-ring treatment, paired outer compression-ring treatment, radial ridge/valley cables and an inner catwalk. |
| Roof engineering accuracy | CONSTRAINED | The roof now follows the real structural language, but cable nodes, membrane prestress, member sizing and exact support coordinates are not engineering-grade. |
| Roof/bowl structural separation | PASS | Perimeter V-column treatment now rises from concourse level to the roof rather than visually supporting the roof from grade through the seating bowl. |
| North arrival sequence | PASS | A public-reference arrival ramp rises approximately 12 m to an elevated podium with a vehicular zone represented below. |
| Stadium campus context | PASS | The surrounding campus is expanded to a roughly 60-acre-scale procedural footprint with three practice-ground representations, academy massing and a service-road layer. |
| Exact site plan | CONSTRAINED | Practice-ground, academy, circulation and podium placement are approximate until survey/site-plan data is available. |
| South pavilion/hospitality massing | PASS | The previous over-specific invented multi-storey pavilion is replaced with a simpler restrained hospitality volume. |
| Pavilion dimensional accuracy | CONSTRAINED | Exact pavilion/club/hospitality geometry still requires authoritative drawings. |
| Block/Bay navigation | PASS | Every configured Block/Bay is indexed across render sections intersecting the mapped Bay. |
| Row labels / seat inventory | CONSTRAINED | Row letters remain positional mappings and generated seat numbers are not official ticket inventory. |
| Stable generated seat URL contract | PASS | `Lxx/Uxx-Rxx-Sxx` identifiers remain the internal generated identity format; the project does not claim that these IDs correspond to official seats. |
| Seat picking / seat-view switching | PASS | Existing raycast prefilter, seat selection, seat camera transitions, in-place seat switching and share flow remain protected by regression checks. |
| Performance budget | PASS | The 109,910-chair model is explicitly budgeted for interactive-seat count, per-section instances, instance attributes, draw calls, framebuffer size and shadow-map policy. |
| Rendering lifecycle | PASS | Invalidation-driven rendering, bounded marker animation, hidden-tab recovery, BFCache handling and WebGL context recovery remain protected. |
| Responsive/accessibility shell | PASS | Existing mobile/tablet/short-screen guards and accessible Block/Bay controls remain in the validation chain. |
| Live deployment | PENDING | Phase 27 remains on its fidelity branch until Vercel preview build/validation succeeds and the change is merged to `main`. |
| Physical cross-browser/device QA | CONSTRAINED | Code-level safeguards exist; acceptance on real Safari/iOS, Firefox, Android and multiple GPU classes remains external. |
| Authoritative digital twin | CONSTRAINED | A genuine seat-accurate digital twin requires permitted CAD/BIM, survey information and official Block/Bay/Row/Seat inventory. |
| CDN runtime dependencies | DEFERRED | Three.js r128 and GSAP 3.12.5 remain pinned on cdnjs; self-hosting/SRI/CSP belongs in a dedicated dependency migration. |
| Three.js modernization | DEFERRED | Upgrade from r128 should be performed separately with browser regression testing. |
| Source architecture consolidation | DEFERRED | The ordered text-transform build remains in place; conversion to canonical modular source is a separate architecture migration. |
| Commercial rights | CONSTRAINED | The code remains derived from StadiView under the repository's noncommercial/community licensing terms; commercial use needs appropriate rights or a clean-room replacement. |

## Phase 27 acceptance criteria

Phase 27 is acceptable for merge only when the complete production build succeeds, all read-only validators pass, the preview serves the generated Motera 3D application, and no existing Block/Bay, seat-picking, camera, responsive, browser-runtime or performance invariant regresses.

Passing Phase 27 means **a substantially closer public-reference recreation**. It does not mean the project has become an official Gujarat Cricket Association model or an engineering/survey-grade digital twin.
