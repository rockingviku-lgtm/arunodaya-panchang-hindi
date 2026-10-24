import { calculatePanchang, geocodePanchangPlace } from './panchak-engine.js';
import { zoneOffset } from './lagna-engine.js';

// Festival dates require observance-specific rules (sunrise, madhyahna, pradosh,
// moonrise, etc.). This module deliberately does not invent dates when no vetted
// annual source/rule set is configured.
export async function getFestivalDay({date,city='Lucknow, India'}){
 const place=await geocodePanchangPlace(city);const timezone=place.timezone||'Asia/Kolkata';const offset=zoneOffset(date,timezone);
 const panchang=await calculatePanchang({date,lat:place.lat,lon:place.lon,timezoneMinutes:offset,place:place.name});
 return {date,place,timezone,offset,panchang,festivals:[],sourceStatus:'needs-verified-observance-rules'};
}
