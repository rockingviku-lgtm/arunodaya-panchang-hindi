import { calculatePanchang, geocodePanchangPlace, formatPanchangTime, formatPanchangDateTime } from './panchak-engine.js';
import { SwissEphemeris, HouseSystem, SiderealMode, Planet } from '@swisseph/browser';

const SIGNS = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन'];
const $ = (s) => document.querySelector(s);
let swePromise;
function getSwe(){ if(!swePromise) swePromise=(async()=>{const swe=new SwissEphemeris();await swe.init();swe.setSiderealMode(SiderealMode.Lahiri);return swe;})();return swePromise; }
function offsetForZone(dateText, zone){
  try {
    const d = new Date(`${dateText}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(d);
    const label = parts.find(p=>p.type==='timeZoneName')?.value || 'GMT+5:30';
    const m = label.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if(!m) return 330;
    return (m[1]==='-'?-1:1)*(Number(m[2])*60+Number(m[3]||0));
  } catch { return 330; }
}
function dateShift(date, days){ const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10); }
function localClock(date, offset){ const x=new Date(date.getTime()+offset*60000);return `${String(x.getUTCHours()).padStart(2,'0')}:${String(x.getUTCMinutes()).padStart(2,'0')}`; }
async function lagnaWindows(date, place, offset){
  const swe=await getSwe();
  const today=await calculatePanchang({date,lat:place.lat,lon:place.lon,timezoneMinutes:offset,place:place.name});
  const nextDate=dateShift(date,1);
  const tomorrow=await calculatePanchang({date:nextDate,lat:place.lat,lon:place.lon,timezoneMinutes:offset,place:place.name});
  if(!today.sunrise||!tomorrow.sunrise) return [];
  const start=today.sunrise.getTime(), end=tomorrow.sunrise.getTime();
  const ascAt=(ms)=>{
    const jd=swe.dateToJulianDay(new Date(ms));
    const ayan=swe.getAyanamsa(jd);
    const houses=swe.calculateHouses(jd,Number(place.lat),Number(place.lon),HouseSystem.WholeSign);
    return ((houses.ascendant-ayan)%360+360)%360;
  };
  const windows=[]; let lastMs=start, lastSign=Math.floor(ascAt(start)/30), currentStart=start;
  // Five-minute sampling, then binary-search each sign transition to within about one second.
  for(let ms=start+5*60000;ms<=end+5*60000;ms+=5*60000){
    const sample=Math.min(ms,end), sign=Math.floor(ascAt(sample)/30);
    if(sign!==lastSign){
      let lo=lastMs,hi=sample;
      for(let i=0;i<28;i++){const mid=(lo+hi)/2;if(Math.floor(ascAt(mid)/30)===lastSign)lo=mid;else hi=mid;}
      const boundary=(lo+hi)/2;
      windows.push({sign:lastSign,start:new Date(currentStart),end:new Date(boundary)});
      currentStart=boundary;lastSign=sign;
    }
    lastMs=sample;
    if(sample===end) break;
  }
  windows.push({sign:lastSign,start:new Date(currentStart),end:new Date(end)});
  return windows;
}
function safeText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function timeRange(item, offset){return `${formatPanchangTime(item.start,offset)} – ${formatPanchangTime(item.end,offset)}`;}

const TITHI_NAMES = ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पञ्चमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा'];
const LUNAR_MONTHS = ['वैशाख','ज्येष्ठ','आषाढ़','श्रावण','भाद्रपद','आश्विन','कार्तिक','मार्गशीर्ष','पौष','माघ','फाल्गुन','चैत्र'];
function norm360(n){return ((n%360)+360)%360;}
function lunarMonthAtDate(date, place, offset){
  return getSwe().then(swe=>{
    const [y,m,d]=date.split('-').map(Number);
    const ref=new Date(Date.UTC(y,m-1,d,12)-offset*60000);
    const sunMoonAngle=dt=>{const jd=swe.dateToJulianDay(dt);const ayan=swe.getAyanamsa(jd);const sun=swe.calculatePosition(jd,Planet.Sun).longitude-ayan;const moon=swe.calculatePosition(jd,Planet.Moon).longitude-ayan;return norm360(moon-sun);};
    // Find the most recent conjunction (new moon), i.e. elongation wraps from ~360° to 0°.
    let later=new Date(ref), laterAngle=sunMoonAngle(later), bracket=null;
    for(let hours=6;hours<=36*24;hours+=6){
      const earlier=new Date(ref.getTime()-hours*3600000), a=sunMoonAngle(earlier);
      if(laterAngle<30 && a>330){bracket={lo:earlier.getTime(),hi:later.getTime()};break;}
      later=earlier;laterAngle=a;
    }
    if(!bracket) return null;
    let lo=bracket.lo,hi=bracket.hi;
    // Before conjunction elongation is near 360°; after conjunction it is near 0°.
    for(let i=0;i<42;i++){const mid=(lo+hi)/2;if(sunMoonAngle(new Date(mid))>180)lo=mid;else hi=mid;}
    const newMoon=new Date((lo+hi)/2), jd=swe.dateToJulianDay(newMoon), ayan=swe.getAyanamsa(jd);
    const sunSign=Math.floor(norm360(swe.calculatePosition(jd,Planet.Sun).longitude-ayan)/30);
    // In the amanta convention, the lunar month is named for the next solar sign.
    return LUNAR_MONTHS[(sunSign+1)%12];
  });
}
function dynamicFestivalNames(date,data,month){
  const idx=Number(data?.tithi?.index); if(!Number.isInteger(idx)) return [];
  const names=[];
  const add=(condition,name)=>{if(condition)names.push(name);};
  add(month==='चैत्र'&&idx===0,'चैत्र नवरात्रि आरंभ / गुड़ी पड़वा के आसपास');
  add(month==='चैत्र'&&idx===8,'राम नवमी');
  add(month==='वैशाख'&&idx===2,'अक्षय तृतीया');
  add(month==='आषाढ़'&&idx===14,'गुरु पूर्णिमा');
  add(month==='श्रावण'&&idx===14,'श्रावण पूर्णिमा / रक्षाबंधन (स्थानीय निर्णय से पुष्टि करें)');
  add(month==='भाद्रपद'&&idx===3,'गणेश चतुर्थी');
  add(month==='भाद्रपद'&&idx===22,'श्रीकृष्ण जन्माष्टमी (निशीथ/रोहिणी नियम से पुष्टि करें)');
  add(month==='आश्विन'&&idx===0,'शारदीय नवरात्रि आरंभ');
  add(month==='आश्विन'&&idx===9,'विजयादशमी / दशहरा');
  add(month==='कार्तिक'&&idx===29,'दीपावली / लक्ष्मी पूजन (प्रदोष/अमावस्या नियम से पुष्टि करें)');
  add(month==='फाल्गुन'&&idx===14,'होलिका दहन / फाल्गुन पूर्णिमा');
  add(month==='फाल्गुन'&&idx===28,'महाशिवरात्रि (निशीथ काल से पुष्टि करें)');
  add(month==='माघ'&&idx===3,'वसंत पंचमी / सरस्वती पूजा (पंचमी तिथि से पुष्टि करें)');
  add(month==='माघ'&&idx===29,'मौनी अमावस्या');
  add(month==='पौष'&&idx===14,'पौष पूर्णिमा');
  add(month==='कार्तिक'&&idx===14,'कार्तिक पूर्णिमा / देव दीपावली');
  add(month==='भाद्रपद'&&idx===0,'गणेशोत्सव आरंभ के आसपास');
  return [...new Set(names)];
}
function renderObservances(date,data,annual=[]){
  const names=[];
  const idx=Number(data?.tithi?.index);
  if(Number.isInteger(idx) && idx>=0 && idx<30){
    const isShukla=idx<15, day=idx%15, label=TITHI_NAMES[day] || 'तिथि';
    if(day===10) names.push('एकादशी व्रत (स्थानीय वैष्णव/स्मार्त निर्णय अलग हो सकता है)');
    if(day===12) names.push('प्रदोष व्रत की तिथि (त्रयोदशी)');
    if(day===14) names.push(isShukla?'पूर्णिमा व्रत':'अमावस्या / दर्श अमावस्या');
    if(day===3) names.push(isShukla?'विनायक चतुर्थी व्रत':'संकष्टी चतुर्थी व्रत (चंद्रोदय से पुष्टि करें)');
    if(!isShukla && day===13) names.push('मासिक शिवरात्रि (निशीथ काल से पुष्टि करें)');
    if(day===7) names.push(isShukla?'दुर्गाष्टमी / मासिक दुर्गाष्टमी':'कालाष्टमी');
    if(day===8 && isShukla) names.push('मासिक दुर्गा नवमी');
    if(day===6 && isShukla) names.push('मासिक स्कन्द षष्ठी');
    if(day===11) names.push('द्वादशी व्रत / पारण का दिन (एकादशी नियम से पुष्टि करें)');
    if(day===1 && isShukla) names.push('चंद्र दर्शन / द्वितीया तिथि के observances');
  }
  const all=[...annual,...names].filter((v,i,a)=>a.indexOf(v)===i);
  if(!all.length) return '<div class="observance-list"><p class="daily-note">इस तारीख पर कोई प्रमुख पर्व संकेत नहीं मिला। मासिक तिथि-आधारित व्रत-संकेत नीचे दिख सकते हैं।</p></div>';
  return `<div class="observance-list">${all.map((name,i)=>`<div class="observance-item"><span class="observance-icon">${i<annual.length?'🪔':'ॐ'}</span><div><b>${safeText(name)}</b><small>${i<annual.length?'खगोलीय तिथि और चंद्र-मास से स्वतः गणना · क्षेत्रीय तारीख अलग हो सकती है':'आज की सूर्योदय तिथि पर आधारित मासिक व्रत-संकेत'}</small></div></div>`).join('')}<p class="daily-disclaimer">महत्वपूर्ण: पर्व-संकेत हर वर्ष पंचांग की गणना से स्वतः बदलते हैं; यह प्रकाशित स्थानीय पंचांग का विकल्प नहीं है। एकादशी, जन्माष्टमी, शिवरात्रि, करवा चौथ, दीपावली आदि के अंतिम निर्णय में चंद्रोदय, प्रदोष, निशीथ, पारण, अधिमास और स्थानीय परंपरा लागू हो सकती है। पूजा से पहले स्थानीय पंचांग से मिलान करें।</p></div>`;
}
export async function loadDailyOverview(date){
  const host=$('#daily-overview'); if(!host) return;
  const cityInput=$('#daily-city'); const chosenDate=date || new Date().toISOString().slice(0,10);
  const city=(cityInput?.value||localStorage.getItem('arunodayaDailyCity')||'Lucknow, India').trim();
  host.innerHTML='<div class="daily-loading"><span class="daily-spinner"></span><b>आज का पंचांग और उदय लग्न निकाला जा रहा है…</b><small>स्थान और स्थानीय समय के अनुसार गणना हो रही है।</small></div>';
  try{
    const place=await geocodePanchangPlace(city);
    const offset=offsetForZone(chosenDate,place.timezone||'Asia/Kolkata');
    const data=await calculatePanchang({date:chosenDate,lat:place.lat,lon:place.lon,timezoneMinutes:offset,place:place.name});
    const windows=await lagnaWindows(chosenDate,place,offset);
    localStorage.setItem('arunodayaDailyCity',city);
    const fmtDate=new Intl.DateTimeFormat('hi-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${chosenDate}T12:00:00`));
    const item=(label,value,end)=>`<div class="daily-fact"><small>${label}</small><b>${value}</b>${end?`<span>समाप्ति: ${formatPanchangDateTime(end,offset)}</span>`:''}</div>`;
    const period=(label,v)=>`<div class="daily-time-row"><span>${label}</span><b>${v?timeRange(v,offset):'गणना उपलब्ध नहीं'}</b></div>`;
    const lagnaRows=windows.map(w=>`<div class="daily-lagna-row"><span class="daily-zodiac">${SIGNS[w.sign]}</span><b>${SIGNS[w.sign]} लग्न</b><span>${timeRange(w,offset)}</span></div>`).join('');
    const panchak=data.panchak.active?`पंचक चल रहा है${data.panchak.end?` · समाप्ति ${formatPanchangDateTime(data.panchak.end,offset)}`:''}`:`पंचक नहीं चल रहा`;
    host.innerHTML=`<section class="daily-board">
      <div class="daily-board-head"><div><div class="daily-kicker">ARUNODAYA PANCHANG · DAILY</div><h2>आज का पंचांग और उदय लग्न</h2><p>${safeText(fmtDate)} · ${safeText(place.name)}</p></div><span class="daily-om">ॐ</span></div>
      <div class="daily-place-form"><label for="daily-city">शहर / स्थान</label><input id="daily-city" value="${safeText(city)}" placeholder="जैसे Lucknow, India"><button type="button" data-action="refresh-daily">आज का विवरण देखें</button></div>
      <div class="daily-subhead"><h3>दैनिक पंचांग</h3><span>${safeText(data.weekday)}</span></div>
      <div class="daily-facts">${item('तिथि',`${data.tithi.name} · ${data.tithi.paksha}`,data.tithi.end)}${item('नक्षत्र',`${data.nakshatra.name} · पद ${data.nakshatra.pada}`,data.nakshatra.end)}${item('योग',data.yoga.name,data.yoga.end)}${item('करण',data.karana.name,data.karana.end)}${item('सूर्योदय',formatPanchangTime(data.sunrise,offset))}${item('सूर्यास्त',formatPanchangTime(data.sunset,offset))}</div>
      <div class="daily-subhead"><h3>पंचक स्थिति</h3></div><p class="daily-note">${safeText(panchak)}</p>
      <div class="daily-subhead"><h3>उदय लग्न मुहूर्त</h3><span>आज के सूर्योदय से अगले सूर्योदय तक</span></div>
      <div class="daily-lagna-list">${lagnaRows||'<p>इस तारीख के लिए लग्न समय उपलब्ध नहीं है।</p>'}</div>
      <div class="daily-subhead"><h3>दिन के शुभ / अशुभ समय</h3></div><div class="daily-times">${period('राहुकाल',data.periods.rahu)}${period('गुलिक काल',data.periods.gulika)}${period('यमगण्ड',data.periods.yamaganda)}${period('अभिजीत मुहूर्त',data.periods.abhijit)}</div>
      <div class="daily-subhead"><h3>व्रत और त्योहार</h3><span>तिथि व चयनित तारीख के अनुसार</span></div>${renderObservances(chosenDate,data, dynamicFestivalNames(chosenDate,data, await lunarMonthAtDate(chosenDate,place,offset)))}
      <p class="daily-disclaimer">गणना लाहिरी अयनांश, Swiss Ephemeris और सूर्योदय के अनुमान पर आधारित है। क्षेत्रीय पंचांग परंपरा के अनुसार कुछ समय में अंतर हो सकता है।</p>
    </section>`;
    const refreshed=$('#daily-city');
    refreshed?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadDailyOverview(chosenDate);}});
  }catch(err){host.innerHTML=`<div class="daily-loading"><b>दैनिक गणना नहीं हो सकी</b><small>${safeText(err?.message||'शहर, इंटरनेट कनेक्शन और तारीख जाँचें।')}</small><button type="button" data-action="refresh-daily">फिर कोशिश करें</button></div>`;}
}
