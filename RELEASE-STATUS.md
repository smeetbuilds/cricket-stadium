# Motera 3D — Phase 19 Stability Hardening

Release scope: unofficial, noncommercial, procedural Narendra Modi Stadium / Motera 3D seat-view explorer.

This document records what is implemented in the current engineering scope, what is deliberately approximate because authoritative venue data is unavailable, and which larger changes are intentionally deferred because they carry higher regression risk.

## Status definitions

- **PASS** — implemented and protected by the production build/regression pipeline.
- **CONSTRAINED** — the software behaves intentionally, but official accuracy, broader use, or physical-device guarantees require external data, permissions, or acceptance testing.
- **DEFERRED** — intentionally excluded from this stability tranche because it changes architecture, runtime-library generation, or visual design and therefore needs a separate migration phase.

## Current release status

| Criterion | Status | Closure |
| --- | --- | --- |
| Live Vercel production deployment | PASS | `main` builds the production transform/validation chain before Vercel serves `dist/`. |
| Stadium look, geometry, camera, controls and responsive shell | PASS | Phase 19 does not alter bowl geometry, seat XYZ data, roof, field, camera math, raycast geometry, visual tokens or layout dimensions. |
| Block/Bay navigation | PASS | Every configured Block/Bay is indexed across all internal render sections that physically intersect that Bay instead of using only one centre section. |
| Bay seat selection | PASS | Visible generated Bay Seat numbers are unique within each mapped Bay row; stable internal `Lxx/Uxx-Rxx-Sxx` identities remain unchanged for URLs and raycast identity. |
| Random Seat | PASS | Random selection uses mapped non-pavilion Block/Bay chairs instead of the entire procedural seat pool. |
| Direct 3D seat picking | PASS | Existing chair picking remains available, including visual-continuity seats outside mapped ticket-style areas; those areas continue to be clearly described as approximate/non-official. |
| Row labels | CONSTRAINED | Row letters remain positional mappings because the supplied row ranges and the fixed procedural row geometry are not a one-to-one authoritative seat manifest. |
| Official seat inventory | CONSTRAINED | A true official Block/Bay/Row/Seat database requires authoritative venue/ticketing data and ideally CAD/BIM geometry. |
| Seat-view entry and in-place switching | PASS | Existing camera transition behavior is retained; reset no longer competes with a simultaneous leave-camera tween. |
| Double-click seat entry | PASS | Seat view only opens when the current double-click actually hits a seat; stale prior selection no longer triggers entry. |
| Keyboard interaction | PASS | Global R/Enter shortcuts no longer fire while a form control/button is focused. |
| Share flow | PASS | Share now has a bounded pending state and prevents duplicate concurrent share attempts. |
| Invalid shared-seat URL | PASS | Invalid or no-longer-existing generated seat URLs surface a visible seat-link message instead of failing silently. |
| Idle rendering | PASS | The selected-seat marker pulse is bounded; selecting a chair no longer keeps the full WebGL renderer running indefinitely just to animate the marker. |
| Local/production parity | PASS | `npm run dev` now builds and serves `dist/`, matching the same production transform chain used by Vercel. |
| Local server behavior | PASS | Malformed URLs return 400, traversal is rejected, unsupported methods return 405, missing files return 404, and missing assets no longer silently receive `index.html`. |
| Node runtime declaration | PASS | Tooling now requires Node 20.11+ to match its actual use of `import.meta.dirname`. |
| Source + production regression command | PASS | `npm run check` runs source checks and then the complete production build/regression pipeline. |
| GitHub Actions | CONSTRAINED | The repository workflow remains manual-only; Vercel production builds still execute the complete build validators on `main`. |
| Browser/runtime safeguards | PASS | Existing WebGL context, BFCache, pointer-capture, orientation, reduced-motion and hidden-tab recovery remain protected. |
| Physical cross-browser/device QA | CONSTRAINED | Code-level guards exist, but real Safari/iOS, Firefox, Android and GPU/device-lab acceptance testing remains external. |
| Accessibility semantics | PASS | The page now has a non-visual H1 and the canvas minimap points keyboard/screen-reader users to the accessible Block/Bay selectors without changing layout. |
| CDN runtime dependencies | DEFERRED | Three.js r128 and GSAP 3.12.5 remain pinned on cdnjs in this tranche. Self-hosting/SRI/CSP should be handled as a separate dependency migration with browser regression testing. |
| Three.js modernization | DEFERRED | r128 → current Three.js is intentionally not mixed into a no-regression stability pass. Upgrade incrementally in a dedicated migration phase. |
| Source architecture consolidation | DEFERRED | The multi-stage text-transform build remains in place for this stability release. Replacing it with canonical modular source files is a separate architecture migration. |
| UI typography/minimap redesign | DEFERRED | No visual redesign is included because the explicit priority of this phase is to preserve current UI/UX and responsiveness. |
| Commercial rights | CONSTRAINED | Community code remains PolyForm Noncommercial 1.0.0-derived; commercial use requires the appropriate separate permission/clean-room replacement. |

## Phase 19 closure

Phase 19 is a **non-visual production-stability tranche**. Its purpose is to remove verified functional and correctness defects without changing the existing stadium appearance or responsive design.

The larger deferred items above are not silently treated as completed. They require separate migration phases because they materially change runtime dependencies, build architecture, or visual presentation and need their own regression acceptance criteria.
