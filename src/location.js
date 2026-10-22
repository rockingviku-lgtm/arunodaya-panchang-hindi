
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchBirthPlaces(query) {
  const name = String(query || "").trim();

  if (name.length < 2) return [];

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("जन्मस्थान खोजने में समस्या हुई। दोबारा कोशिश करें।");
  }

  const data = await response.json();

  return (data.results || []).map(place => ({
    name: place.name,
    country: place.country || "",
    region: place.admin1 || "",
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    timezone: place.timezone || "UTC"
  }));
}

export function getBirthTimezoneOffset(dateText, timeText, timezone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText || "")) {
    throw new Error("जन्म तारीख YYYY-MM-DD प्रारूप में भरें।");
  }

  if (!/^\d{2}:\d{2}$/.test(timeText || "")) {
    throw new Error("जन्म समय सही भरें।");
  }

  const [year, month, day] = dateText.split("-").map(Number);
  const [hour, minute] = timeText.split(":").map(Number);

  const localCheck = new Date(Date.UTC(year, month - 1, day));

  if (
    localCheck.getUTCFullYear() !== year ||
    localCheck.getUTCMonth() !== month - 1 ||
    localCheck.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    throw new Error("जन्म तारीख या समय मान्य नहीं है।");
  }

  if (!timezone || typeof timezone !== "string") {
    throw new Error("जन्मस्थान का टाइम ज़ोन उपलब्ध नहीं है।");
  }

  // Find the UTC offset applicable to the birth date and time.
  const wallClockAsUTC = Date.UTC(
    year, month - 1, day, hour, minute
  );

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(wallClockAsUTC))
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  );

  // Determine the offset at the approximate UTC instant.
  const utcInstant = new Date(wallClockAsUTC);
  const utcParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  const utc = Object.fromEntries(
    utcParts.formatToParts(utcInstant)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  );

  const localAsUTC = Date.UTC(
    parts.year, parts.month - 1, parts.day,
    parts.hour, parts.minute
  );

  const utcAsUTC = Date.UTC(
    utc.year, utc.month - 1, utc.day,
    utc.hour, utc.minute
  );

  return Math.round((localAsUTC - utcAsUTC) / 60000);
}
