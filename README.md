# Arunodaya Panchang

Mobile-first Vite website starter for a modern Hindi Panchang experience.

## Features in this starter
- Home page with daily Panchang entry point
- Date selector and month calendar
- Panchang, Muhurat and Kundli form pages
- Responsive dark navy and gold theme
- No backend/API keys required for the starter UI

## Important accuracy note
This starter is a user-interface and navigation foundation. It does **not** calculate verified tithi/nakshatra transitions, sunrise/sunset, Rahu Kaal, auspicious timings, planetary positions, Lagna, Navamsa, retrograde or Vargottama. Do not present placeholders as real astrological calculations. Connect a suitable, tested astronomical/Panchang engine and verify its licensing before production use.

## Build
```bash
npm install
npm run build
```
Vite output directory: `dist`

## Cloudflare Pages
- Framework preset: Vite (or None if required)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/` or blank
- Ensure the path is exactly `src/main.js` and `src/style.css` (lowercase `src`).
