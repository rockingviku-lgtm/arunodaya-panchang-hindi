# Arunodaya Panchang (browser starter)

Mobile-friendly Vite site using `@swisseph/browser` (WebAssembly) for in-browser planetary calculations.

## GitHub / Cloudflare Pages

- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- No Worker API is required for this starter.
- Node version: use a currently supported LTS version in Cloudflare build settings.

## Local development

```bash
npm install
npm run dev
```

## Important notes

- This starter uses the package's built-in Moshier ephemeris and sets Lahiri sidereal mode.
- User must enter correct latitude/longitude and UTC offset for birth location/time.
- Ascendant and sidereal conversion must be validated against a trusted panchang before production use. The starter is not a complete traditional Jyotish engine.
- Retrograde status is based on negative longitude speed.
- Vargottama is defined here as D1 sign matching D9 navamsa sign.
- The package `@swisseph/browser` is licensed AGPL-3.0. Review the license and its implications before publishing a commercial/closed-source website. A commercial license may be needed depending on your use.
- This is a clean starter package, not a copy of any previous website design or all features. Test the Cloudflare build before switching a live domain.
