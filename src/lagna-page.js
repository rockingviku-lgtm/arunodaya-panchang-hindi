import "./style.css";
import { loadDailyOverview } from "./daily-overview.js";
const city=document.querySelector("#daily-city");
const date=document.querySelector("#lagna-date");
const status=document.querySelector("#location-status");
const todayLocal=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
date.value=todayLocal();
function render(){localStorage.setItem("arunodayaDailyCity",city.value.trim()||"Lucknow, India");loadDailyOverview(date.value||todayLocal());}
document.querySelector("#show-lagna").addEventListener("click",render);
city.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();render();}});
date.addEventListener("change",render);
document.querySelector("#use-location").addEventListener("click",()=>{
 if(!navigator.geolocation){status.textContent="इस ब्राउज़र में लोकेशन उपलब्ध नहीं है। शहर का नाम लिखें।";return;}
 status.textContent="लोकेशन प्राप्त की जा रही है…";
 navigator.geolocation.getCurrentPosition(async pos=>{
   try{
    const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
    const r=await fetch(url,{headers:{Accept:"application/json"}});if(!r.ok)throw new Error();const j=await r.json();
    const a=j.address||{};const place=[a.city||a.town||a.village||a.county,a.state,a.country].filter(Boolean).join(", ");
    if(!place)throw new Error();city.value=place;status.textContent=`लोकेशन मिली: ${place}`;render();
   }catch{status.textContent="लोकेशन का शहर नाम नहीं मिल पाया। कृपया शहर खुद लिखें।";}
 },()=>{status.textContent="लोकेशन अनुमति नहीं मिली। शहर का नाम लिखें।";},{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
});
render();
