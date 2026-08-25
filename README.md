# Motera 3D

**Unofficial procedural 3D Narendra Modi Stadium seat-view explorer.**

Motera 3D is a noncommercial experimental recreation of Narendra Modi Stadium in Ahmedabad. It generates the cricket ground, two-tier seating bowl, roof structure, hospitality/media bands, aisles, vomitories, railings, and thousands of selectable seat instances in the browser.

> **Accuracy:** This is not an official Gujarat Cricket Association ticket map and does not contain authoritative section, row, seat, pricing, availability, or ticket inventory data. Generated seat IDs are prototype navigation identifiers only.

## Current experience

- Procedural cricket oval based on the publicly stated **180 × 150 yard** field dimensions
- Two principal seating tiers and an extended-capacity reference of **132,000**
- Stable generated seat IDs across device classes, with adaptive pixel ratio and close-range seat-back detail LOD
- Section → Row → Seat navigation backed by the same generated seat metadata as direct 3D picking
- Interactive 2D minimap synchronized with section highlighting and the selected seat
- Animated approximate first-person seat views with a small high-detail nearby-chair layer (pan, back, and armrests)
- Direct seat picking, Random Seat, keyboard controls, wheel zoom, drag orbit, and touch pinch-to-zoom
- Shareable `?seat=` URLs for generated seats
- Procedural roof/cable structure, LED ring, scoreboards, hospitality/media areas, aisles, vomitories, and railings
- WebGL/library failure fallback
- Responsive layouts for desktop, tablet, short screens, and mobile

## Public architectural references

The recreation is calibrated from public information rather than confidential drawings or ticket inventory:

- [Gujarat Cricket Association — Narendra Modi Stadium](https://gujaratcricketassociation.com/narendra-modi-stadium/)
- [Populous — Narendra Modi Stadium](https://populous.com/showcases/narendra-modi-stadium)

Those references support broad characteristics such as the field dimensions, two-tier bowl, overall capacity context, and architectural language. They do **not** provide a public seat-by-seat database, so Motera 3D intentionally does not claim seat-level accuracy.

## Run locally

This fork uses zero-dependency Node tooling for the local static app.

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal.

Run the repository's zero-dependency static/procedural regression checks:

```bash
npm run check
```

To create a deployable `dist/` folder:

```bash
npm run build
npm run preview
```

Node.js 18+ is recommended.

The GitHub Actions workflow runs `npm ci`, `npm run check`, `npm run build`, and a local preview smoke test on pushes and pull requests.

## Controls

| Action | Control |
| --- | --- |
| Orbit stadium | Drag |
| Zoom | Mouse wheel, +/- controls, or two-finger pinch |
| Select seat | Click/tap a rendered seat |
| Select section | Navigator or minimap |
| Enter seat view | “View from seat”, double-click, or Enter |
| Look around from seat | Drag |
| Leave seat view | Escape or “Back to stadium” |
| Reset overview | R or reset button |
| Share generated seat | Share button |

## Shareable generated seats

Selecting a generated seat updates the URL:

```text
?seat=L01-R10-S24
```

Opening a valid generated-seat URL restores that seat after the procedural bowl is built. This is a prototype identifier, not an official ticket reference.

## Performance strategy

The stadium uses section-level `THREE.InstancedMesh` groups rather than one mesh per chair. Section-level bounding spheres improve frustum rejection and ray-picking locality. On mobile devices, pixel ratio and seat-back detail density are reduced without changing the generated pan-seat ID set. On low-resource devices, backrest instances can be omitted entirely. Seat backrests are hidden at long camera distances and restored at closer ranges or in seat view when available.

## Authoritative seat data

A true seat-accurate digital twin requires authoritative venue/ticketing data such as CAD/BIM geometry plus the real section/row/seat inventory. Until such data is supplied with permission, generated IDs remain approximate and the UI labels them accordingly.

## Project structure

```text
index.html             # Complete browser experience
public/favicon.svg     # Motera 3D favicon
scripts/build.mjs      # Zero-dependency static build
scripts/serve.mjs      # Zero-dependency dev/preview server
.github/workflows/ci.yml # Continuous validation
scripts/check.mjs      # Static/procedural regression checks
LICENSE.md             # Upstream community license
COMMERCIAL-LICENSE.md  # Upstream commercial-use information
THIRD_PARTY_NOTICES.md # Third-party notices
```

## Licensing and attribution

This repository is derived from **StadiView** by **thebuggeddev** and retains the required notices. The community license is the **PolyForm Noncommercial License 1.0.0**; see [`LICENSE.md`](LICENSE.md).

Commercial use requires separate permission under the terms described in [`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md). Third-party libraries remain subject to their own licenses; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Motera 3D is an unofficial project and is not affiliated with or endorsed by Gujarat Cricket Association, Narendra Modi Stadium, or Populous.
