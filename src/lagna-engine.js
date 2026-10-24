import { SwissEphemeris, HouseSystem, SiderealMode } from '@swisseph/browser';
import { calculatePanchang, formatPanchangTime } from './panchak-engine.js';

export const RASHIS = [
  {name:'मेष',symbol:'♈'},{name:'वृषभ',symbol:'♉'},{name:'मिथुन',symbol:'♊'},
  {name:'कर्क',symbol:'♋'},{name:'सिंह',symbol:'♌'},{name:'कन्या',symbol:'♍'},
  {name:'तुला',symbol:'♎'},{name:'वृश्चिक',symbol:'♏'},{name:'धनु',symbol:'♐'},
  {name:'मकर',symbol:'♑'},{name:'कुंभ',symbol:'♒'},{name:'मीन',symbol:'♓'}
];
let swePromise;
async function ephemeris(){ if(!swePromise) swePromise=(async()=>{const s=new SwissEphemeris();await s.init();s.setSiderealMode(SiderealMode.Lahiri);return s;})();return swePromise; }
function dateShift(date,days){const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function zoneOffset(date,zone='Asia/Kolkata'){try{const p=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(new Date(`${date}T12:00:00Z`));const s=p.find(x=>x.type==='timeZoneName')?.value||'GMT+5:30';const m=s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);return m?(m[1]==='-'?-1:1)*(+m[2]*60+ +(m[3]||0)):330;}catch{return 330;}}
export async function getLagnaData({date,place,timezone='Asia/Kolkata'}){
 const offset=zoneOffset(date,timezone);const next=dateShift(date,1);
 const [today,tomorrow,swe]=await Promise.all([
  calculatePanchang({date,lat:place.lat,lon:place.lon,timezoneMinutes:offset,place:place.name}),
  calculatePanchang({date:next,lat:place.lat,lon:place.lon,timezoneMinutes:offset,place:place.name}),ephemeris()
 ]);
 if(!today.sunrise||!tomorrow.sunrise)throw new Error('इस स्थान के लिए सूर्योदय नहीं निकाला जा सका।');
 const start=today.sunrise.getTime(),end=tomorrow.sunrise.getTime();
 const signAt=ms=>{const jd=swe.dateToJulianDay(new Date(ms));const ayan=swe.getAyanamsa(jd);const h=swe.calculateHouses(jd,+place.lat,+place.lon,HouseSystem.Placidus);return Math.floor((((h.ascendant-ayan)%360+360)%360)/30);};
 const windows=[];let cursor=start;let sign=signAt(cursor);const step=60_000;
 for(let ms=start+step;ms<=end+step;ms+=step){const sample=Math.min(ms,end);const s=signAt(sample);if(s!==sign){let lo=cursor,hi=sample;for(let i=0;i<36;i++){const mid=(lo+hi)/2;if(signAt(mid)===sign)lo=mid;else hi=mid;}const boundary=(lo+hi)/2;windows.push({sign,start:new Date(cursor),end:new Date(boundary)});cursor=boundary;sign=signAt(Math.min(end,boundary+1500));}cursor=sample;if(sample===end)break;}
 if(cursor<end)windows.push({sign,start:new Date(cursor),end:new Date(end)});
 return {date,place,timezone,offset,sunrise:today.sunrise,sunset:today.sunset,windows,tithi:today.tithi,nakshatra:today.nakshatra,yoga:today.yoga,karana:today.karana,weekday:today.weekday,periods:today.periods,panchak:today.panchak,formatTime:d=>formatPanchangTime(d,offset),currentWindow:windows.find(w=>Date.now()>=w.start.getTime()&&Date.now()<w.end.getTime())||null};
}
export { zoneOffset };
