# Motera 3D

**Unofficial procedural 3D Narendra Modi Stadium seat-view explorer.**

Motera 3D is a noncommercial experimental recreation of Narendra Modi Stadium in Ahmedabad. It generates the cricket ground, two-tier seating bowl, tensile-roof approximation, hospitality/media bands, aisles, vomitories, railings, selectable seat instances, and public-reference site context in the browser.

**Live deployment:** https://cricket-stadium-eight.vercel.app

> **Accuracy:** This is not an official Gujarat Cricket Association ticket map, CAD/BIM model, or surveyed digital twin. It does not contain authoritative section, row, seat, pricing, availability, or ticket inventory data. Block/Bay labels are calibrated from the supplied seating reference, row letters are positional mappings, and generated seat identities remain prototype navigation data.

## Current experience

- Procedural cricket oval based on the publicly stated **180 × 150 yard** field dimensions
- Two principal seating tiers calibrated to about **109,910 rendered interactive chairs**, close to the publicly stated **110,000 seated capacity**; **132,000** remains an extended-capacity reference rather than the generated chair count
- Lower/upper bowl depth expanded without artificially shrinking chair pitch
- Irregularized vomitory rhythm instead of mechanically repeating the same opening every four render sections
- Cable-supported tensile-roof approximation with inner tension ring, outer compression-ring treatment, radial ridge/valley cables, and an inner catwalk
- Roof-support V-columns rising from concourse level rather than from grade, keeping roof and concrete-bowl systems visually independent
- Public-reference north arrival sequence with a ramp rising about **12 m** to an elevated podium and a vehicular zone below
- Enlarged stadium campus context, three practice-ground representations, and an academy/podium massing layer; exact site placement remains approximate without survey/CAD data
- Simplified south pavilion/hospitality massing that avoids claiming invented facade detail as authoritative architecture
- Stable generated internal seat IDs across device classes, with adaptive pixel ratio and close-range seat-back detail LOD
- Visible **Block → Bay → mapped Row → generated Bay Seat** navigation over the 3D bowl
- Bay-wide navigation indexes all rendered seats that fall inside the chosen Block/Bay, even when a Bay spans multiple internal render sections
- Interactive 2D reference minimap synchronized with Block/Bay focus, selected seat, and camera orientation
- Animated approximate first-person seat views with a small high-detail nearby-chair layer
- Direct seat picking, mapped Random Seat, keyboard controls, wheel zoom, drag orbit, and touch pinch-to-zoom
- Shareable `?seat=` URLs that preserve the stable internal generated seat identity
- WebGL/library failure fallback
- Responsive layouts for desktop, tablet, short screens, and mobile

## Public architectural references

The recreation is calibrated from public information rather than confidential drawings or ticket inventory:

- [Gujarat Cricket Association — Narendra Modi Stadium](https://gujaratcricketassociation.com/narendra-modi-stadium/)
- [Gujarat Cricket Association — About GCA](https://gujaratcricketassociation.com/about-gca/)
- [Populous — Narendra Modi Stadium](https://populous.com/preview/narendra-modi-stadium)
- [Walter P Moore — Narendra Modi Stadium Roof Design](https://www.walterpmoore.com/projects/narendra-modi-stadium-roof-design)

These public references support broad characteristics including the **110,000 seated-capacity design**, **132,000 extended capacity**, two-tier open bowl, approximately **30 m** tensile-roof cantilever, inner/outer roof-ring system, diagonal roof supports, north-side **12 m** arrival ramp/elevated podium, 76 corporate boxes, academy context, and three practice grounds.

They do **not** provide an authoritative seat-by-seat manifest, full stadium CAD/BIM geometry, exact public vomitory schedule, or survey-grade site coordinates. The project therefore treats the new architectural work as a substantially closer public-reference recreation, not an official digital twin.

## Run locally

The project uses zero npm runtime dependencies for its Node build tooling. The browser runtime currently loads pinned Three.js r128 and GSAP 3.12.5 assets from cdnjs.

Use **Node.js 20.11+**. The repository and manual CI run on modern Node versions; Vercel currently uses a compatible newer Node release.

```bash
npm install
npm run dev
```

`npm run dev` first builds the same production output used by Vercel and then serves `dist/`, so local development does not serve a different pre-transform application.

Run the full source + production regression chain:

```bash
npm run check
```

Create and preview a deployable `dist/` folder directly:

```bash
npm run build
npm run preview
```

The production build runs the ordered transform pipeline and then the UI/UX, responsive, performance, browser/runtime, and consolidated regression validators. Phase 27 is applied after the earlier visual-fidelity pass and before all read-only validators.

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

Opening a valid generated-seat URL restores the generated chair after the procedural bowl is built. The visible Block/Bay and generated Bay Seat labels are recalculated from that chair's position. The URL is a prototype identifier, not an official ticket reference.

Phase 27 increases bowl depth, so URLs retain the same stable **identity format and lookup contract**, but the underlying prototype is not a frozen official inventory and should not be treated as one.

## Seating-map architecture

The project intentionally separates rendering identity from seating-reference metadata:

- `Lxx/Uxx` section IDs remain internal rendering/raycast buckets.
- Block/Bay metadata is calculated from the chair's physical angle around the bowl.
- A Bay-wide index gathers matching chairs across every internal render section intersecting that Bay.
- Visible generated Bay Seat numbers are ordered within the selected Bay row while stable URL IDs remain unchanged.
- Seats outside mapped Block/Bay ranges can still exist for visual continuity but are not used by Random Seat.

This separation lets public seating-reference metadata evolve without pretending that the generated chairs are official inventory.

## Performance strategy

The stadium uses section-level `THREE.InstancedMesh` groups rather than one mesh per chair. The Phase 27 bowl contains about **109,910 interactive pan-seat instances** while remaining inside the production seat-instance memory budget. Section-level world-space bounding spheres improve ray-picking locality.

On mobile devices, pixel ratio and seat-back detail density are reduced. On low-resource devices, backrest instances can be omitted entirely. Seat backrests are hidden at long camera distances and restored at closer ranges or in seat view when available.

Rendering is invalidation-driven. The selected-seat marker pulses for a bounded interval instead of keeping the full WebGL scene in a permanent animation loop.

## Authoritative seat data

A true seat-accurate digital twin requires authoritative venue/ticketing data such as CAD/BIM geometry plus the real Block/Bay/Row/Seat inventory. Until such data is supplied with permission, row letters remain positional mappings and visible seat numbers remain generated rather than claimed official.

The same limitation applies to exact pavilion dimensions, vomitory positions, roof-node coordinates, practice-ground placement, and site circulation: public references can materially improve fidelity, but they cannot substitute for controlled venue drawings.

## Project structure

```text
index.html                           # Base browser experience before production transforms
public/favicon.svg                   # Motera 3D favicon
scripts/build.mjs                    # Initial static build/compatibility transform
scripts/build-pipeline.mjs           # Authoritative ordered production build orchestrator
scripts/pipeline-stages.mjs          # Transform/validator stage manifest
scripts/aerial-stadium-style.mjs     # Phase 26 visual/exterior fidelity pass
scripts/reference-fidelity.mjs       # Phase 27 bowl/roof/arrival/site fidelity pass
scripts/sanitize-generated-css.mjs   # CSS sanitation transform
scripts/stability-hardening.mjs      # Earlier non-visual stability hardening
scripts/validate-*.mjs               # Final UI, responsive, performance, browser and regression guards
scripts/serve.mjs                    # Zero-dependency preview/static server
scripts/check.mjs                    # Source static/procedural regression checks
.github/workflows/ci.yml             # Manual validation workflow
LICENSE.md                           # Upstream community license
COMMERCIAL-LICENSE.md                # Upstream commercial-use information
THIRD_PARTY_NOTICES.md               # Third-party notices
```

## Licensing and attribution

This repository is derived from **StadiView** by **thebuggeddev** and retains the required notices. The community license is the **PolyForm Noncommercial License 1.0.0**; see [`LICENSE.md`](LICENSE.md).

Commercial use requires separate permission under the terms described in [`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md). Third-party libraries remain subject to their own licenses; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Motera 3D is an unofficial project and is not affiliated with or endorsed by Gujarat Cricket Association, Narendra Modi Stadium, Populous, Walter P Moore, or Larsen & Toubro.
