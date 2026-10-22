# Arunodaya Panchang — Swiss Ephemeris Kundli update

This update preserves the supplied Vite starter pages and adds a browser-side Swiss Ephemeris calculation flow for the Kundli form.

## Included
- Birth chart (D1), Chandra Kundli, and Navamsa (D9) in a North Indian diamond-style layout.
- Rashi numbers and short Hindi planet labels in chart houses.
- Lahiri sidereal adjustment, ascendant, planet positions, retrograde indicator, and a planet position table.
- Birth form uses the selected timezone offset and entered coordinates.

## Build / deploy
1. Upload these files to the GitHub repository, keeping the folder paths unchanged.
2. Cloudflare Pages build command: `npm install && npm run build`
3. Build output directory: `dist`

## Important limitations
- This starter still does not calculate a full verified daily Panchang or Muhurat; those pages remain placeholders.
- The browser package's built-in Moshier ephemeris is used unless optional Swiss ephemeris data files are configured. Verify calculations against trusted chart software and known test charts before relying on them.
- Rahu uses Mean Node where available (True Node fallback); Ketu is set exactly opposite Rahu.
- Vargottama is determined by comparing the D1 sign with the calculated D9 sign.
- This implementation has been syntax-checked, but a full Vite production build could not be completed in this environment because dependency installation timed out. Run the build on GitHub/Cloudflare after upload and check the browser console.
- `@swisseph/browser` is published under AGPL-3.0. Review its license obligations before distributing or commercially operating the website.

## Dependency
`@swisseph/browser` (1.4.x)
