/**
 * Arunodaya Panchang — Panchak Engine
 * Uses Astronomy Engine's lunar ecliptic longitude plus an approximate Lahiri ayanamsha.
 * Install: npm install astronomy-engine
 *
 * Panchak is treated as the sidereal Moon interval 293°20'–360°:
 * Dhanishta (last 2 padas), Shatabhisha, Purva Bhadrapada,
 * Uttara Bhadrapada and Revati.
 *
 * NOTE: The ayanamsha formula below is an approximation. For publication-grade
 * Panchang timings, replace it with a validated Lahiri ayanamsha / Swiss Ephemeris
 * implementation and compare against a trusted regional Panchang.
 */
import { EclipticGeoMoon } from "astronomy-engine";

const DEG = Math.PI / 180;
const NAKSHATRA_SPAN = 360 / 27;
const PANCHAK_START = 293 + 20 / 60;

const NAKSHATRAS = [
  "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा",
  "पुनर्वसु", "पुष्य", "आश्लेषा", "मघा", "पूर्वा फाल्गुनी", "उत्तरा फाल्गुनी",
  "हस्त", "चित्रा", "स्वाती", "विशाखा", "अनुराधा", "ज्येष्ठा",
  "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", "धनिष्ठा", "शतभिषा",
  "पूर्वाभाद्रपद", "उत्तराभाद्रपद", "रेवती"
];

function norm360(value) {
  return ((value % 360) + 360) % 360;
}

// Approximate Lahiri ayanamsha in degrees around J2000.
function approximateLahiriAyanamsha(date) {
  const year = date.getUTCFullYear() +
    (date.getUTCMonth() + 0.5) / 12 +
    (date.getUTCDate() - 1) / 365.2422 / 12;
  return 23.8531 + (year - 2000) * 0.013968;
}

export function getSiderealMoonLongitude(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date supplied to Panchak Engine.");
  const tropical = EclipticGeoMoon(date).elon;
  return norm360(tropical - approximateLahiriAyanamsha(date));
}

export function getNakshatraInfo(siderealLongitude) {
  const longitude = norm360(Number(siderealLongitude));
  const index = Math.floor(longitude / NAKSHATRA_SPAN);
  const within = longitude - index * NAKSHATRA_SPAN;
  const pada = Math.min(4, Math.floor(within / (NAKSHATRA_SPAN / 4)) + 1);
  return {
    index,
    name: NAKSHATRAS[index],
    pada,
    longitude: Number(longitude.toFixed(5)),
    degreesInNakshatra: Number(within.toFixed(5))
  };
}

export function isPanchakAt(dateInput) {
  const longitude = getSiderealMoonLongitude(dateInput);
  const nakshatra = getNakshatraInfo(longitude);
  return {
    active: longitude >= PANCHAK_START,
    longitude,
    nakshatra,
    panchakNakshatra: longitude >= PANCHAK_START ? nakshatra.name : null
  };
}

function findCrossing(startDate, endDate, targetLongitude, increasing, iterations = 30) {
  let lo = startDate.getTime();
  let hi = endDate.getTime();
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    const lon = getSiderealMoonLongitude(new Date(mid));
    const passed = increasing ? lon >= targetLongitude : lon < targetLongitude;
    if (passed) hi = mid;
    else lo = mid;
  }
  return new Date((lo + hi) / 2);
}

/**
 * Returns the current Panchak interval or the next one.
 * Uses a coarse scan followed by binary search for boundary times.
 */
export function getPanchakDetails(nowInput = new Date()) {
  const now = nowInput instanceof Date ? new Date(nowInput) : new Date(nowInput);
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid date supplied to Panchak Engine.");

  const activeNow = isPanchakAt(now).active;
  const scanStepMs = 30 * 60 * 1000;
  const maxSearchMs = 9 * 24 * 60 * 60 * 1000;

  let previousTime = new Date(now.getTime());
  let previousState = isPanchakAt(previousTime).active;
  let start = null;
  let end = null;

  // Find a start boundary in the past if currently active.
  if (activeNow) {
    for (let t = now.getTime() - scanStepMs; t >= now.getTime() - maxSearchMs; t -= scanStepMs) {
      const current = new Date(t);
      const state = isPanchakAt(current).active;
      if (!state) {
        start = findCrossing(current, previousTime, PANCHAK_START, true);
        break;
      }
      previousTime = current;
      previousState = state;
    }
    // Find the end boundary in the future.
    previousTime = new Date(now.getTime());
    for (let t = now.getTime() + scanStepMs; t <= now.getTime() + maxSearchMs; t += scanStepMs) {
      const current = new Date(t);
      if (!isPanchakAt(current).active) {
        end = findCrossing(previousTime, current, 360, false);
        break;
      }
      previousTime = current;
    }
  } else {
    // Find the next entry into the Panchak longitude range.
    previousTime = new Date(now.getTime());
    for (let t = now.getTime() + scanStepMs; t <= now.getTime() + maxSearchMs; t += scanStepMs) {
      const current = new Date(t);
      if (isPanchakAt(current).active) {
        start = findCrossing(previousTime, current, PANCHAK_START, true);
        break;
      }
      previousTime = current;
    }
    if (start) {
      previousTime = new Date(start.getTime());
      for (let t = start.getTime() + scanStepMs; t <= start.getTime() + maxSearchMs; t += scanStepMs) {
        const current = new Date(t);
        if (!isPanchakAt(current).active) {
          end = findCrossing(previousTime, current, 360, false);
          break;
        }
        previousTime = current;
      }
    }
  }

  return {
    active: activeNow,
    currentLongitude: Number(getSiderealMoonLongitude(now).toFixed(5)),
    currentNakshatra: getNakshatraInfo(getSiderealMoonLongitude(now)),
    start: start ? start.toISOString() : null,
    end: end ? end.toISOString() : null,
    calculation: "Astronomy Engine Moon position + approximate Lahiri ayanamsha",
    accuracyNote: "Indicative calculation; verify timings against a trusted Panchang before relying on religious observance."
  };
}
