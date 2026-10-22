# Arunodaya Panchang — custom date build

Mobile-first Vite site with calendar date pickers for birth chart and date-based panchang estimate.

## Cloudflare Pages
- Framework preset: None / Other / Vite (if listed)
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/`

## Important
- Keep paths lowercase: `src/main.js` and `src/style.css`.
- Panchang output is an approximate snapshot at the selected time, not a certified daily Panchang. Accurate tithi/nakshatra boundary times require location-specific sunrise and transition calculations.
- Birth chart results depend on correct local time, UTC offset and coordinates.
- Review `@swisseph/browser` AGPL-3.0 license before commercial/closed-source use.
