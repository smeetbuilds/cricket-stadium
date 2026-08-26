# Motera 3D

**Unofficial procedural 3D Narendra Modi Stadium seat-view explorer.**

Motera 3D is a noncommercial experimental recreation of Narendra Modi Stadium in Ahmedabad. It generates the cricket ground, two-tier seating bowl, roof structure, hospitality/media bands, aisles, vomitories, railings, and thousands of selectable seat instances in the browser.

> **Accuracy:** This is not an official Gujarat Cricket Association ticket map and does not contain authoritative section, row, seat, pricing, availability, or ticket inventory data. Block/Bay labels are calibrated from the supplied seating reference, row letters are positional mappings, and generated seat identities remain prototype navigation data.

## Current experience

- Procedural cricket oval based on the publicly stated **180 × 150 yard** field dimensions
- Two principal seating tiers and an extended-capacity reference of **132,000**
- Stable generated internal seat IDs across device classes, with adaptive pixel ratio and close-range seat-back detail LOD
- Visible **Block → Bay → mapped Row → generated Bay Seat** navigation over the existing 3D bowl
- Bay-wide navigation indexes all rendered seats that fall inside the chosen Block/Bay, even when a Bay spans multiple internal render sections
- Interactive 2D reference minimap synchronized with Block/Bay focus, selected seat, and camera orientation
- Animated approximate first-person seat views with a small high-detail nearby-chair layer (pan, back, and armrests)
- Direct seat picking, mapped Random Seat, keyboard controls, wheel zoom, drag orbit, and touch pinch-to-zoom
- Shareable `?seat=` URLs that preserve the stable internal generated seat identity
- Procedural roof/cable structure, LED ring, scoreboards, hospitality/media areas, aisles, vomitories, and railings
- WebGL/library failure fallback
- Responsive layouts for desktop, tablet, short screens, and mobile

## Public architectural references

The recreation is calibrated from public information rather than confidential drawings or ticket inventory:

- [Gujarat Cricket Association — Narendra Modi Stadium](https://gujaratcricketassociation.com/narendra-modi-stadium/)
- [Populous — Narendra Modi Stadium](https://populous.com/showcases/narendra-modi-stadium)

Those references support broad characteristics such as the field dimensions, two-tier bowl, overall capacity context, and architectural language. They do **not** provide a public seat-by-seat database, so Motera 3D intentionally does not claim seat-level accuracy.

## Run locally

The project uses zero npm runtime dependencies for its Node build tooling. The browser runtime currently loads pinned Three.js r128 and GSAP 3.12.5 assets from cdnjs.

Use **Node.js 20.11+**. The repository and manual CI currently run comfortably on Node 22, while Vercel may use a newer compatible release.

```bash
npm install
npm run dev
```

`npm run dev` first builds the same production output used by Vercel and then serves `dist/`, so local development no longer serves a different pre-transform application.

Run the full source + production regression chain:

```bash
npm run check
```

Create and preview a deployable `dist/` folder directly:

```bash
npm run build
npm run preview
```

The GitHub Actions workflow is intentionally manual-only (`workflow_dispatch`). When started, it runs `npm ci`, `npm run check`, and a local preview smoke test. Normal `main` pushes rely on the Vercel production build, whose build command runs the ordered transform pipeline plus the UI/UX, responsive, performance, browser/runtime, and consolidated regression validators.

## Controls

| Action | Control |
| --- | --- |
| Orbit stadium | Drag |
| Zoom | Mouse wheel, +/- controls, or two-finger pinch |
| Select seat | Click/tap a rendered seat |
| Select seating area | Block/Bay navigator or minimap |
| Enter seat view | “View from seat”, double-click on a seat, or Enter when focus is outside form controls |
| Look around from seat | Drag |
| Leave seat view | Escape or “Back to stadium” |
| Reset overview | R or reset button |
| Share generated seat | Share button |

## Shareable generated seats

Selecting a generated seat updates the URL using the stable internal rendering identity:

```text
?seat=L01-R10-S24
```

Opening a valid generated-seat URL restores that exact generated chair after the procedural bowl is built. The visible Block/Bay and generated Bay Seat labels are recalculated from that chair's position. The URL is a prototype identifier, not an official ticket reference.

## Seating-map architecture

The project intentionally separates rendering identity from seating-reference metadata:

- `Lxx/Uxx` section IDs remain internal rendering/raycast buckets.
- Block/Bay metadata is calculated from the chair's physical angle around the existing bowl.
- A Bay-wide index gathers matching chairs across every internal render section intersecting that Bay.
- Visible generated Bay Seat numbers are ordered within the selected Bay row while stable URL IDs remain unchanged.
- Seats outside mapped Block/Bay ranges can still exist for visual continuity but are not used by Random Seat.

This separation prevents seating-reference changes from rebuilding or destabilizing the stadium geometry.

## Performance strategy

The stadium uses section-level `THREE.InstancedMesh` groups rather than one mesh per chair. Section-level world-space bounding spheres improve ray-picking locality. On mobile devices, pixel ratio and seat-back detail density are reduced without changing the generated pan-seat ID set. On low-resource devices, backrest instances can be omitted entirely. Seat backrests are hidden at long camera distances and restored at closer ranges or in seat view when available.

Rendering is invalidation-driven. The selected-seat marker now pulses for a bounded interval instead of keeping the full WebGL scene in a permanent animation loop.

## Authoritative seat data

A true seat-accurate digital twin requires authoritative venue/ticketing data such as CAD/BIM geometry plus the real Block/Bay/Row/Seat inventory. Until such data is supplied with permission, row letters remain positional mappings and visible seat numbers remain generated rather than claimed official.

## Project structure

```text
index.html                         # Base browser experience before production transforms
public/favicon.svg                 # Motera 3D favicon
scripts/build.mjs                  # Initial static build/compatibility transform
scripts/build-pipeline.mjs         # Authoritative ordered production build orchestrator
scripts/pipeline-stages.mjs        # Transform/validator stage manifest
scripts/sanitize-generated-css.mjs # Final CSS sanitation entry point
scripts/stability-hardening.mjs    # Phase 19 non-visual final output hardening
scripts/validate-*.mjs             # Final UI, responsive, performance, browser and regression guards
scripts/serve.mjs                  # Zero-dependency preview/static server
scripts/check.mjs                  # Source static/procedural regression checks
.github/workflows/ci.yml           # Manual-only validation workflow
LICENSE.md                         # Upstream community license
COMMERCIAL-LICENSE.md              # Upstream commercial-use information
THIRD_PARTY_NOTICES.md             # Third-party notices
```

## Licensing and attribution

This repository is derived from **StadiView** by **thebuggeddev** and retains the required notices. The community license is the **PolyForm Noncommercial License 1.0.0**; see [`LICENSE.md`](LICENSE.md).

Commercial use requires separate permission under the terms described in [`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md). Third-party libraries remain subject to their own licenses; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Motera 3D is an unofficial project and is not affiliated with or endorsed by Gujarat Cricket Association, Narendra Modi Stadium, or Populous.
