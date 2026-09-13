(()=>{
const c=document.querySelector("#c"),ctx=c.getContext("2d");
ctx.imageSmoothingEnabled=true;

let W=7200,H=4200;const CELL=40;let COLS=Math.ceil(W/CELL),ROWS=Math.ceil(H/CELL);
const COLORS=["#4f8fd8","#d85b53","#62ad69","#d2a34d","#9a70d0","#49aaa5","#d47caf","#9b795b","#3f6f9f","#c9763f","#4f927f","#b45f7a","#7b8d42","#6c66b7","#b88b3e","#537c8a"];
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const lerp=(a,b,t)=>a+(b-a)*t, smooth=t=>t*t*(3-2*t);
let worldRngState=1;
function seedWorldRng(salt=0){worldRngState=((Math.floor(seed)||1)^(salt*2654435761))>>>0;if(!worldRngState)worldRngState=0x6d2b79f5}
function worldRandom(){worldRngState=(worldRngState+0x6D2B79F5)>>>0;let t=worldRngState;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}
const wrnd=(a,b)=>a+worldRandom()*(b-a),wpick=a=>a[Math.floor(worldRandom()*a.length)];
function iqNorm(iq){return clamp((iq-70)/60,0,1.55)}

let currentTool="select",active=0,selected=null,seed=Math.random()*99999,idSeq=1,toastTimer=null;
let camera={x:0,y:0,zoom:.25,minZoom:.16,maxZoom:2.1};
let drag={on:false,lastX:0,lastY:0};let paint={on:false,lastX:0,lastY:0,tool:null,changed:false};

const eras=[
 {name:"Tribal",min:0,icon:"🪵"},{name:"Antique",min:140,icon:"🏺"},{name:"Médiévale",min:380,icon:"🏰"},
 {name:"Industrielle",min:800,icon:"🏭"},{name:"Moderne",min:1500,icon:"🏙"},{name:"Avancée",min:2800,icon:"🚁"}
];
const techs=[["Agriculture",50],["Écriture",120],["Métallurgie",220],["Médecine",360],["Ingénierie",540],["Poudre",760],["Industrie",1000],["Électricité",1400],["Moteurs",1800],["Aviation",2250],["Informatique",2800],["Énergie atomique",3500]];
const buildings=[
 {name:"Hutte",era:0,type:"hut",beds:4},{name:"Ferme",era:0,type:"farm",beds:2},{name:"Maison",era:1,type:"house",beds:5},
 {name:"Atelier",era:1,type:"workshop",beds:1},{name:"Caserne",era:2,type:"barracks",beds:3},{name:"Hôtel de ville",era:2,type:"hall",beds:2},
 {name:"Hôpital",era:3,type:"hospital",beds:8},{name:"Usine",era:3,type:"factory",beds:0},{name:"Laboratoire",era:4,type:"lab",beds:0},
 {name:"Centrale",era:4,type:"power",beds:0},{name:"Aéroport",era:5,type:"airport",beds:0},{name:"Centre stratégique",era:5,type:"strategic",beds:0}
];
const weapons=[
 {name:"Bâton",era:0,power:1},{name:"Lance",era:0,power:1.4},{name:"Épée",era:1,power:2},{name:"Arc",era:1,power:2.2},
 {name:"Arbalète",era:2,power:2.7},{name:"Mousquet",era:2,power:3.4},{name:"Fusil",era:3,power:4.3},
 {name:"Mitrailleuse",era:3,power:5.2},{name:"Blindé",era:4,power:7.5},{name:"Hélicoptère",era:5,power:11},{name:"Missile stratégique",era:5,power:15}
];
const firstNamesM=["Ari","Lio","Noa","Milo","Tao","Néo","Eli","Soren","Kael","Ilan","Rian","Elio"];
const firstNamesF=["Ena","Sia","Lina","Iris","Yuna","Mira","Léa","Nara","Aya","Elia","Maë","Soli"];
const lastNames=["Val","Roc","Bel","Sol","Ren","Mar","Dor","Kai","Lun","Ser","Venn","Aster"];
const cityPrefixes=["Aster","Val","Nova","Rive","Mont","Sol","Lun","Roc","Bel","Ser","Or","Eden","Cendre","Aube","Grand"];
const citySuffixes=["ia","or","is","heim","bourg","polis","mar","val","dor","haven","mont","rive","grad","sur","on"];
const BUILD_COSTS={hut:{wood:8},farm:{wood:10},house:{wood:14},workshop:{wood:12,ore:4},barracks:{wood:16,ore:10},hall:{wood:20,ore:8},hospital:{wood:18,ore:10,goods:6},factory:{wood:15,ore:22},lab:{wood:12,ore:18,goods:10},power:{ore:25,oil:8},airport:{ore:40,oil:18,goods:15},strategic:{ore:50,oil:20,goods:20}};
let S;

function showToast(t){let e=$("eventToast");e.textContent=t;e.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),1700)}
function civ(i){return {id:i,name:"Peuple "+(i+1),color:COLORS[i%COLORS.length],style:"balanced",birthRate:1,ageProfile:"balanced",avgIQ:100,agg:42,disc:55,curiosity:55,coop:58,fertility:55,courage:55,science:0,tech:0,military:0,wealth:50,cities:1,kills:0,discoveries:[],
 doctrine:"adaptive",ideology:"mixed",autonomy:1,intent:"S'installer",stability:72,foodSecurity:70,waterSecurity:72,lastStrategyDay:0,relations:{},
 government:"Tribu",governmentLocked:false,policy:"balanced",approval:70,leaderId:null,nextElectionYear:6,treasury:100,warWeariness:0,
 leaderSinceDay:0,lastPowerChangeDay:-99999,politicalGraceUntil:0,lastSecessionDay:-99999,founderId:null,foundedYear:1,
 stock:{food:70,water:55,wood:45,ore:15,oil:0,goods:5},culture:{science:50,martial:50,trade:50,tradition:50}}}
function eraIndex(v){let n=0;for(let i=0;i<eras.length;i++)if(v.tech>=eras[i].min)n=i;return n}
function roleFor(v){
 let e=eraIndex(v),r=Math.random();
 if(e===0)return r<.03?"Chef de tribu":r<.08?"Guérisseur":r<.25?"Guerrier":pick(["Cueilleur","Chasseur","Artisan"]);
 if(e===1)return r<.03?"Chef":r<.08?"Médecin":r<.22?"Soldat":pick(["Fermier","Forgeron","Scribe"]);
 if(e===2)return r<.025?"Maire":r<.07?"Médecin":r<.22?"Chevalier":pick(["Fermier","Artisan","Marchand"]);
 if(e===3)return r<.02?"Maire":r<.07?"Médecin":r<.18?"Soldat":pick(["Ouvrier","Ingénieur","Scientifique"]);
 if(e===4)return r<.018?"Président":r<.07?"Médecin":r<.18?"Soldat":pick(["Ingénieur","Scientifique","Technicien"]);
 return r<.015?"Président":r<.055?"Médecin":r<.15?"Pilote":pick(["Scientifique","Ingénieur","Technicien"]);
}
function makePerson(ci,x0=null,y0=null,age=null,parents=[]){
 let v=S.civs[ci],sex=Math.random()<.5?"F":"M",band=W/S.civs.length;
 let iq=clamp(Math.round(v.avgIQ+rnd(-17,17)),55,165),baseIQ=iq;
 let strength=clamp(Math.round(50+rnd(-25,25)),1,100),charisma=clamp(Math.round(50+rnd(-30,30)),1,100);
 let aggression=clamp(Math.round(v.agg+rnd(-25,25)),1,100),curiosity=clamp(Math.round(v.curiosity+rnd(-25,25)),1,100);
 let fertility=clamp(Math.round(v.fertility+rnd(-25,25)),1,100),health=clamp(Math.round(75+rnd(-15,25)),30,100);
 return {id:idSeq++,ci,x:x0??rnd(ci*band+80,(ci+1)*band-80),y:y0??rnd(120,H-100),vx:rnd(-1,1),vy:rnd(-1,1),
  hp:health,hunger:rnd(65,100),age:age??ageForProfile(v.ageProfile||"balanced"),sex,role:roleFor(v),sick:false,cool:0,
  first:pick(sex==="M"?firstNamesM:firstNamesF),last:pick(lastNames),iq,baseIQ,strength,charisma,aggression,curiosity,fertility,
  loyalty:clamp(Math.round(60+rnd(-25,30)),1,100),courage:clamp(Math.round(v.courage+rnd(-25,25)),1,100),
  partner:null,home:null,children:[],parents:[...parents],pregnant:0,pregnancyPartner:null,nextFamilyCheckDay:(S?simDayIndex():0)+Math.floor(rnd(8,38)),relationship:0,mood:clamp(Math.round(rnd(45,90)),1,100),
  generation:parents.length?1:0,
  journal:[],memories:[],fame:0,influence:clamp(Math.round(charisma*.55+iqNorm(iq)*22+rnd(0,20)),1,100),
  ambition:clamp(Math.round(rnd(15,100)),1,100),rallyLeader:null,rallyUntil:0,
  lifeGoal:pick(["family","wealth","knowledge","power","explore","protect","peace"]),autonomy:1,
  stress:clamp(Math.round(rnd(5,35)),0,100),energy:clamp(Math.round(rnd(65,100)),0,100),hydration:rnd(72,100),environmentAdapt:0,currentIntent:"Vivre",
  cityId:null,coins:Math.round(rnd(5,25)),education:clamp(Math.round((iq-60)*.72+rnd(-8,12)),0,100),reputation:0,experience:0,armyId:null,
  scale:1,
  skin:pick(["#d9aa83","#c8946e","#a96f4f","#7b4b36","#e4b995"]),
  hair:pick(["#241912","#3a291f","#6b4d32","#b57b44","#d6b88b","#191919"]),
  clothes:v.color,
  outfitAccent:pick(["#d9c27a","#d8e1e5","#65452f","#9dc8d8","#a66b58"]),
  outfitStyle:"auto",outfitPattern:pick(["plain","plain","trim","stripe"]),headwear:"auto",
  hairStyle:pick(["short","short","long","curly","bald"])
 };
}
function pname(p){return `${p.first} ${p.last}`}
function ageForProfile(profile){
 let r=Math.random();
 if(profile==="young")return r<.34?Math.floor(rnd(0,16)):r<.92?Math.floor(rnd(16,42)):Math.floor(rnd(42,68));
 if(profile==="adult")return r<.08?Math.floor(rnd(0,16)):r<.90?Math.floor(rnd(18,48)):Math.floor(rnd(48,72));
 if(profile==="mixed")return Math.floor(rnd(0,82));
 // balanced: children + strong working/reproductive-age core + elders
 return r<.22?Math.floor(rnd(0,16)):r<.78?Math.floor(rnd(18,44)):r<.94?Math.floor(rnd(44,66)):Math.floor(rnd(66,82));
}
function civStyleBonus(v,kind){
 if(v.style==="science"&&kind==="science")return 1.22;
 if(v.style==="military"&&kind==="military")return 1.22;
 if(v.style==="wealth"&&kind==="wealth")return 1.20;
 if(v.style==="nature"&&kind==="fertility")return 1.15;
 return 1;
}
const IDEOLOGIES={
 mixed:{label:"Économie mixte",science:1,trade:1,privateIncome:1,stateIncome:1,food:1,industry:1,stability:0,approval:0,redistribution:.04},
 socialdem:{label:"Social-démocrate",science:1.05,trade:1.02,privateIncome:.96,stateIncome:1.10,food:1.06,industry:.98,stability:2,approval:3,redistribution:.18},
 socialist:{label:"Socialiste",science:1.04,trade:.92,privateIncome:.82,stateIncome:1.16,food:1.14,industry:1.04,stability:2,approval:2,redistribution:.32},
 communist:{label:"Communiste",science:1.02,trade:.74,privateIncome:.56,stateIncome:1.28,food:1.18,industry:1.13,stability:1,approval:0,redistribution:.52},
 capitalist:{label:"Capitaliste",science:1.08,trade:1.24,privateIncome:1.28,stateIncome:1.05,food:.98,industry:1.18,stability:-1,approval:-1,redistribution:.01},
 technocratic:{label:"Technocratique",science:1.30,trade:1.06,privateIncome:1.02,stateIncome:1.10,food:1,industry:1.10,stability:0,approval:0,redistribution:.05},
 green:{label:"Écologiste",science:1.08,trade:.94,privateIncome:.96,stateIncome:1.04,food:1.22,industry:.82,stability:2,approval:2,redistribution:.10},
 traditionalist:{label:"Traditionaliste",science:.86,trade:.92,privateIncome:.98,stateIncome:1.02,food:1.05,industry:.92,stability:5,approval:1,redistribution:.06}
};
function ideologyData(v){return IDEOLOGIES[v?.ideology]||IDEOLOGIES.mixed}
function ideologyLabel(v){return ideologyData(v).label}
function ideologyDescription(v){let d=ideologyData(v),parts=[];if(d.trade>1.1)parts.push("commerce et revenus privés favorisés");if(d.trade<.85)parts.push("commerce extérieur plus limité");if(d.redistribution>.25)parts.push("forte redistribution des fortunes individuelles");else if(d.redistribution>.12)parts.push("redistribution modérée");if(d.science>1.18)parts.push("recherche et éducation prioritaires");if(d.food>1.15)parts.push("agriculture et ressources essentielles favorisées");if(d.industry>1.12)parts.push("industrie renforcée");if(d.industry<.9)parts.push("industrie plus limitée");if(d.stability>=4)parts.push("bonus de stabilité");return parts.length?parts.join(" · "):"équilibre entre initiative privée, services publics et commerce"}
function ideologyMultiplier(v,key){return ideologyData(v)[key]??1}
function redistributeWealth(ci){
 let v=S.civs[ci],ideo=ideologyData(v),rate=ideo.redistribution||0;if(rate<=.01)return;let ps=S.people.filter(p=>p.ci===ci&&p.age>=16);if(ps.length<2)return;
 let avg=ps.reduce((n,p)=>n+(p.coins||0),0)/ps.length,pool=0;for(const p of ps){let excess=Math.max(0,(p.coins||0)-avg*1.25),take=excess*rate*.08;p.coins-=take;pool+=take}
 let lows=ps.filter(p=>(p.coins||0)<avg*.65);if(lows.length&&pool>0){let share=pool/lows.length;for(const p of lows)p.coins+=share}else v.treasury+=pool;
}
let story={cinematic:null,cinematicQueue:[],bubbles:[],eraWaves:[],lastAutoDay:0,nextAutoDay:0,worldEvents:[],replayMode:false,replayTimer:null,eventCooldowns:{},lastCinematicReal:0,lastCinematicByKey:{},suppressedEvents:[],tickerTimer:null,lastCrisisDay:-1};
let R={recording:true,snapshots:[],events:[],lastCaptureYear:0,liveState:null,playing:false};
let followPersonId=null,lastAutosaveReal=0,minimapDirty=true;
const TERR={canvas:document.createElement("canvas"),ctx:null,owners:null,contested:null,dirty:true};
TERR.ctx=TERR.canvas.getContext("2d");
const FAST_TERRAIN={canvas:document.createElement("canvas"),ctx:null,dirty:true};
FAST_TERRAIN.ctx=FAST_TERRAIN.canvas.getContext("2d",{alpha:false});
function markTerrainCacheDirty(){FAST_TERRAIN.dirty=true}
function rebuildFastTerrain(){
 if(!S?.grid?.length||!COLS||!ROWS)return;
 FAST_TERRAIN.canvas.width=COLS;FAST_TERRAIN.canvas.height=ROWS;
 let img=FAST_TERRAIN.ctx.createImageData(COLS,ROWS),data=img.data;
 for(let i=0;i<S.grid.length;i++){let hex=biomeColors[S.grid[i]?.type]||"#6d965b",n=parseInt(hex.slice(1),16),o=i*4;data[o]=(n>>16)&255;data[o+1]=(n>>8)&255;data[o+2]=n&255;data[o+3]=255}
 FAST_TERRAIN.ctx.putImageData(img,0,0);FAST_TERRAIN.dirty=false
}

function simStamp(){const sn=["Printemps","Été","Automne","Hiver"][S.season]||"";return `Année ${S.year} · ${sn} · Jour ${S.day}`}
function simDayIndex(){return (S.year-1)*360+S.season*90+(S.day-1)}

function calendarToMinutes(){
 return (((Math.max(1,S.year)-1)*360 + clamp(S.season||0,0,3)*90 + (clamp(S.day||1,1,90)-1))*1440) + clamp(Number(S.minute)||0,0,1439.999999);
}
function normalizeCalendarFromMinutes(total){
 total=Math.max(0,Number(total)||0);
 let wholeDays=Math.floor(total/1440);
 let minute=total-wholeDays*1440;
 let year=Math.floor(wholeDays/360)+1;
 let dayOfYear=wholeDays%360;
 let season=Math.floor(dayOfYear/90);
 let day=dayOfYear%90+1;
 S.elapsedMinutes=total;
 S.year=year;S.season=season;S.day=day;S.minute=minute;
}
function ensureElapsedTime(){
 if(!Number.isFinite(S.elapsedMinutes))S.elapsedMinutes=calendarToMinutes();
}
function advanceSimulationTime(minutes){
 ensureElapsedTime();
 let oldYear=S.year,oldSeason=S.season;
 normalizeCalendarFromMinutes(S.elapsedMinutes+Math.max(0,Number(minutes)||0));
 if(S.year!==oldYear||S.season!==oldSeason)weather();
}
function formattedClock(){
 let totalSeconds=Math.floor((Number(S.minute)||0)*60+1e-6);
 let hh=Math.floor(totalSeconds/3600)%24;
 let mm=Math.floor((totalSeconds%3600)/60);
 let ss=totalSeconds%60;
 let seasonName=["Printemps","Été","Automne","Hiver"][S.season]||"";
 let base=`📅 Année ${S.year} · ${seasonName} · Jour ${S.day} · 🕒 ${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
 if(story?.cinematic)return `${base}:${String(ss).padStart(2,"0")}`;
 return base;
}

function importanceLabel(score){return score>=90?"HISTORIQUE":score>=78?"MAJEUR":"IMPORTANT"}
function eventIcon(type){
 return ({war:"⚔",peace:"🕊",era:"🏛",tech:"💡",disaster:"🌪",disease:"🦠",coup:"👑",politics:"🏛",recovery:"🌤",death:"☠",birth:"👶",
 speech:"📣",migration:"🧳",economy:"📉",city:"🏙",family:"💞",diplomacy:"🤝",world:"🌍"})[type]||"◆";
}
function heuristicScore(t){
 if(/guerre|paix|ère |Catastrophe|coup|révolution|épid|météor|nuclé/i.test(t))return 86;
 if(/découvre|dirigeant|président|roi|chef/i.test(t))return 66;
 if(/Naissance/i.test(t))return 25;
 if(/couple|construit/i.test(t))return 16;
 return 40;
}
function personImportance(p){
 if(!p)return 0;let role=/Président|Chef|Maire/.test(p.role)?40:/Scientifique|Pilote|Chevalier/.test(p.role)?18:0;
 return clamp(role+p.charisma*.22+p.influence*.18+(p.fame||0)*.5,0,100);
}
function addPersonEvent(p,title,text,importance=50,tags=[]){
 if(!p)return;
 if(!p.journal)p.journal=[]; if(!p.memories)p.memories=[];
 let ev={stamp:simStamp(),year:S.year,day:S.day,title,text,importance,tags};
 p.journal.unshift(ev);if(p.journal.length>80)p.journal.length=80;
 if(importance>=60){p.memories.unshift({stamp:ev.stamp,text:title,importance});if(p.memories.length>24)p.memories.length=24}
 if(selected?.type==="person"&&selected.obj===p)renderPersonLife(p);
}
function renderWorldJournal(){
 let el=$("log"); if(!el)return; el.innerHTML="";
 let threshold=+$("journalImportance")?.value||70;
 let events=(story.worldEvents||[]).filter(e=>e.score>=threshold).slice(-180).reverse();
 for(const ev of events){
  let d=document.createElement("div");d.className="world-event "+(ev.score>=90?"historic":ev.score>=78?"major":"");
  d.innerHTML=`<div class="event-meta"><span>${eventIcon(ev.type)} ${importanceLabel(ev.score)}</span><span>${ev.stamp}</span></div><strong>${ev.title}</strong><div>${ev.text}</div>`;
  el.appendChild(d)
 }
 $("worldJournalCount").textContent=`${events.length} événements majeurs`;
}
function eventAllowed(key,cooldownDays=60){
 let now=simDayIndex(),last=story.eventCooldowns[key]??-1e9;
 if(now-last<cooldownDays)return false;story.eventCooldowns[key]=now;return true
}
function speedValue(){return +$("speed")?.value||1}
function timeScaleValue(){return +$("timeScale")?.value||1}
function highSpeedStory(){return speedValue()>=25||timeScaleValue()>=720}
function cinematicThreshold(){let base=+$("cinematicImportance")?.value||82,mode=$("cinematicMode")?.value||"smart";if(mode==="historic")return Math.max(92,base);if(mode==="smart"&&$("turboStoryGuard")?.checked){if(speedValue()>=100&&timeScaleValue()>=1440)return Math.max(96,base);if(speedValue()>=50||timeScaleValue()>=1440)return Math.max(93,base);if(speedValue()>=25||timeScaleValue()>=720)return Math.max(90,base)}return base}
function showHistoryTicker(ev,count=1){if(!ev||ev.score<65||story.cinematic)return;let box=$("historyTicker");if(!box)return;box.classList.remove("major","historic");if(ev.score>=90)box.classList.add("historic");else if(ev.score>=78)box.classList.add("major");$("historyTickerIcon").textContent=eventIcon(ev.type);$("historyTickerTitle").textContent=count>1?`${count} événements importants enregistrés`:ev.title;$("historyTickerText").textContent=count>1?`Dernier : ${ev.title} · ${ev.stamp}`:`${ev.text} · ${ev.stamp}`;box.classList.add("show");clearTimeout(story.tickerTimer);story.tickerTimer=setTimeout(()=>box.classList.remove("show"),3200)}
function suppressCinematic(ev){ev._suppressedReal=Date.now();story.suppressedEvents.push(ev);if(story.suppressedEvents.length>12)story.suppressedEvents.shift();let recent=story.suppressedEvents.filter(e=>Date.now()-(e._suppressedReal||0)<4500);showHistoryTicker(ev,recent.length)}
function canInterruptForEvent(ev){if(!$("autoCinematic")?.checked)return false;let mode=$("cinematicMode")?.value||"smart",threshold=cinematicThreshold();if(ev.score<threshold)return false;let now=Date.now(),cool=+$("cinematicCooldown")?.value||25000,key=`${ev.type}-${ev.ci??"world"}`;if(mode==="smart"&&$("turboStoryGuard")?.checked&&highSpeedStory())cool=Math.max(cool,32000);if(now-story.lastCinematicReal<cool&&!(ev.score>=99&&now-story.lastCinematicReal>10000))return false;let last=story.lastCinematicByKey[key]||0;if(mode==="smart"&&now-last<Math.max(cool*1.7,35000))return false;return true}
function requestCinematic(ev){if(!canInterruptForEvent(ev)){if(ev.score>=70)suppressCinematic(ev);return}if(story.cinematic){if(($("cinematicMode")?.value||"smart")!=="all"){suppressCinematic(ev);return}if(!story.cinematicQueue.length||ev.score>story.cinematicQueue[0].score)story.cinematicQueue=[ev];return}majorMoment(ev)}
function worldEvent(ev){
 ev={type:"world",title:"Événement",text:"",score:50,ci:null,x:null,y:null,personId:null,speech:null,...ev,stamp:simStamp(),year:S.year,day:S.day,simDay:simDayIndex()};
 story.worldEvents.push(ev);if(story.worldEvents.length>500)story.worldEvents.shift();
 if(ev.personId){let p=findPerson(ev.personId);if(p){p.fame=(p.fame||0)+Math.max(1,(ev.score-55)/15);addPersonEvent(p,ev.title,ev.text,ev.score,[ev.type])}}
 renderWorldJournal();
 if(R.recording&&ev.score>=65){R.events.push({...ev});if(ev.score>=80)captureReplaySnapshot(ev)}
 requestCinematic(ev)
 return ev;
}
function log(t){return worldEvent({title:t,text:t,type:"world",score:heuristicScore(t)})}

function leaderForCiv(ci){
 let v=S.civs[ci],explicit=v?.leaderId?findPerson(v.leaderId):null;if(explicit&&explicit.ci===ci)return explicit;
 let ps=S.people.filter(p=>p.ci===ci);if(!ps.length)return null;
 let leaders=ps.filter(p=>/Président|Chef|Maire|Roi|Reine/.test(p.role));
 let lead=(leaders.length?leaders:ps).sort((a,b)=>personImportance(b)-personImportance(a))[0]||null;if(v&&lead)v.leaderId=lead.id;return lead;
}
function speechFor(ev,p){
 let civn=S.civs[p.ci]?.name||"notre peuple";
 if(ev.type==="coup")return `Citoyens de ${civn}, un nouvel ordre commence aujourd’hui. Nous devons rester unis.`;
 if(ev.type==="politics")return `Notre société évolue. Ces décisions doivent préserver l’unité et l’avenir de ${civn}.`;
 if(ev.type==="recovery")return `La crise recule. Nous pouvons enfin reconstruire et reprendre une vie normale.`;
 if(ev.type==="war")return `Notre peuple est menacé. Restez unis : nous défendrons ${civn}.`;
 if(ev.type==="peace")return `Après les épreuves, la paix revient. Il est temps de reconstruire ensemble.`;
 if(ev.type==="disease")return `Une maladie se propage. Protégez vos proches et aidez les plus fragiles.`;
 if(ev.type==="disaster")return `Nous avons subi une catastrophe. Personne ne sera abandonné.`;
 if(ev.type==="era"||ev.type==="tech")return `Aujourd’hui marque une étape nouvelle. Le savoir de ${civn} nous ouvre un nouvel avenir.`;
 return `Ce moment changera notre histoire. Restons unis et avançons ensemble.`;
}
function startRally(ev){
 if(!$("autoSpeeches")?.checked)return;
 let ci=ev.ci;if(ci==null&&ev.personId)ci=findPerson(ev.personId)?.ci;
 if(ci==null)return;let leader=ev.personId?findPerson(ev.personId):leaderForCiv(ci);if(!leader)return;
 let until=S.tick+900;
 for(const p of S.people)if(p.ci===ci&&p.id!==leader.id&&(p.x-leader.x)**2+(p.y-leader.y)**2<1000*1000){p.rallyLeader=leader.id;p.rallyUntil=until}
 let text=ev.speech||speechFor(ev,leader);
 story.bubbles.push({personId:leader.id,text,name:pname(leader),until:Date.now()+(+$("cinematicDuration")?.value||7000)});
 addPersonEvent(leader,"Discours public",text,72,["speech"]);
}
function majorMoment(ev){
 if(!$("autoCinematic")?.checked)return;
 let focus=null;if(ev.personId)focus=findPerson(ev.personId);if(!focus&&ev.x!=null)focus={x:ev.x,y:ev.y};if(!focus&&ev.ci!=null)focus=leaderForCiv(ev.ci);
 story.lastCinematicReal=Date.now();story.lastCinematicByKey[`${ev.type}-${ev.ci??"world"}`]=story.lastCinematicReal;story.suppressedEvents=[];
 story.cinematic={ev,end:Date.now()+(+$("cinematicDuration")?.value||6500),focus,oldCamera:{...camera}};
 $("cinematicTitle").textContent=ev.title;$("cinematicText").textContent=ev.text;$("cinematicBanner").classList.add("show");document.body.classList.add("story-cinematic");
 startRally(ev);
}
function updateStoryFrame(){
 if(story.cinematic){
  let q=story.cinematic;
  if(Date.now()>q.end){story.cinematic=null;$("cinematicBanner").classList.remove("show");document.body.classList.remove("story-cinematic");let next=story.cinematicQueue.shift();if(next&&($("cinematicMode")?.value||"smart")==="all")setTimeout(()=>majorMoment(next),350);else if(next)suppressCinematic(next)}
  else if(q.focus){
   let fx=q.focus.x,fy=q.focus.y,targetZoom=Math.max(camera.zoom,Math.min(1.05,camera.maxZoom));
   camera.zoom=lerp(camera.zoom,targetZoom,.035);camera.x=lerp(camera.x,fx-c.width/(2*camera.zoom),.055);camera.y=lerp(camera.y,fy-c.height/(2*camera.zoom),.055);clampCamera()
  }
 }
 if(!story.cinematic&&followPersonId){let p=findPerson(followPersonId);if(p){camera.x=lerp(camera.x,p.x-c.width/(2*camera.zoom),.12);camera.y=lerp(camera.y,p.y-c.height/(2*camera.zoom),.12);clampCamera()}else{followPersonId=null;document.body.classList.remove("following")}}
 story.bubbles=story.bubbles.filter(b=>b.until>Date.now()&&findPerson(b.personId));
}
function drawSpeechBubbles(){
 document.querySelectorAll(".speech-bubble").forEach(e=>e.remove());
 let rect=c.getBoundingClientRect();
 for(const b of story.bubbles){
  let p=findPerson(b.personId);if(!p)continue;
  let sx=(p.x-camera.x)*camera.zoom/c.width*rect.width+rect.left;
  let sy=(p.y-camera.y)*camera.zoom/c.height*rect.height+rect.top;
  let d=document.createElement("div");d.className="speech-bubble";
  d.innerHTML=`<span class="speech-name">${b.name}</span>${b.text}`;
  d.style.left=`${clamp(sx-20,8,window.innerWidth-270)}px`;d.style.top=`${clamp(sy-90,55,window.innerHeight-150)}px`;
  document.body.appendChild(d)
 }
}


/* -------- Better coherent noise -------- */
function hash(ix,iy,s=0){
 let n=Math.sin(ix*127.1+iy*311.7+seed*.013+s*74.7)*43758.5453123;
 return n-Math.floor(n);
}
function valueNoise(x,y,s=0){
 let x0=Math.floor(x),y0=Math.floor(y),tx=smooth(x-x0),ty=smooth(y-y0);
 let a=hash(x0,y0,s),b=hash(x0+1,y0,s),c0=hash(x0,y0+1,s),d=hash(x0+1,y0+1,s);
 return lerp(lerp(a,b,tx),lerp(c0,d,tx),ty);
}
function fbm(x,y,s=0,oct=5){
 let sum=0,amp=.5,f=1,norm=0;
 for(let i=0;i<oct;i++){sum+=valueNoise(x*f,y*f,s+i*13)*amp;norm+=amp;f*=2;amp*=.5}
 return sum/norm;
}
const WORLD_SHAPES=["pangaea","greatIsland","continents","archipelago","shattered","inlandSea"];
function resolvedWorldShape(){let ui=$("worldShape")?.value||"auto";if(ui!=="auto")return ui;return WORLD_SHAPES[Math.floor(hash(17,31,778)*WORLD_SHAPES.length)%WORLD_SHAPES.length]}
function blobField(nx,ny,cx,cy,sx,sy){let dx=(nx-cx)/sx,dy=(ny-cy)/sy;return Math.exp(-(dx*dx+dy*dy)*2.1)}
function generateEmptyOcean(){
 S.grid=new Array(COLS*ROWS);for(let gy=0;gy<ROWS;gy++)for(let gx=0;gx<COLS;gx++)S.grid[gy*COLS+gx]={type:"water",elev:0,m:.78,t:.52};
 S.rivers=[];S.res=[];S.strategicZones=[];S.worldProfile={shape:"ocean",label:"Océan vierge",resourceRoll:0};minimapDirty=true;markTerritoryDirty()
}
function generateTerrain(){
 seedWorldRng(101);
 const seaUI=+$("seaLevel").value/100,rel=+$("relief").value/100,humUI=+$("humidity").value/100,tempUI=+$("temperature").value/100;
 const diversity=(+$("biomeDiversity")?.value||70)/100,mountainUI=(+$("mountainDensity")?.value||55)/100,forestUI=(+$("forestDensity")?.value||55)/100,desertUI=(+$("desertDensity")?.value||45)/100;
 let shape=resolvedWorldShape(),sea=0.38+(seaUI-.42)*.55,seaAdjust=0;
 if(shape==="archipelago")seaAdjust=.035;if(shape==="shattered")seaAdjust=.052;if(shape==="pangaea")seaAdjust=-.005;if(shape==="inlandSea")seaAdjust=-.005;
 sea+=seaAdjust;if(shape==="greatIsland")sea+=.018;S.worldProfile={shape,label:{pangaea:"Grande masse continentale",greatIsland:"Grande île",continents:"Continents",archipelago:"Archipel",shattered:"Îles fracturées",inlandSea:"Mer intérieure"}[shape]||shape,resourceRoll:S.worldProfile?.resourceRoll||0};
 S.grid=new Array(COLS*ROWS);let elevs=new Float32Array(COLS*ROWS),moists=new Float32Array(COLS*ROWS),temps=new Float32Array(COLS*ROWS);
 // Deterministic blob centers make every seed structurally different while keeping same-seed regeneration stable.
 let blobs=[];let blobCount=shape==="archipelago"?12:shape==="shattered"?18:shape==="continents"?4:2;
 for(let i=0;i<blobCount;i++)blobs.push({cx:.08+hash(i,3,311)*.84,cy:.08+hash(i,7,337)*.84,sx:(shape==="archipelago"?.09:shape==="shattered"?.07:.18)+hash(i,9,359)*(shape==="continents"?.12:.07),sy:(shape==="archipelago"?.08:shape==="shattered"?.065:.16)+hash(i,11,381)*(shape==="continents"?.11:.08)});
 for(let gy=0;gy<ROWS;gy++)for(let gx=0;gx<COLS;gx++){
   let nx=gx/(COLS-1),ny=gy/(ROWS-1),freq=shape==="shattered"?5.5:shape==="archipelago"?4.1:2.3;
   let continental=fbm(nx*freq,ny*freq,10,5),detail=fbm(nx*8.2,ny*8.2,25,4),ridge=1-Math.abs(fbm(nx*(5.2+rel*2.2),ny*(5.2+rel*2.2),60,4)*2-1);
   let edge=Math.pow(Math.max(Math.abs(nx-.5)*1.72,Math.abs(ny-.5)*1.64),2.25),shapeBias=0;
   if(shape==="pangaea"){let d=Math.hypot((nx-.5)/.72,(ny-.5)/.68);shapeBias=.145-d*.11-edge*.27}
   else if(shape==="greatIsland"){let cx=.5+(hash(3,4,731)-.5)*.08,cy=.5+(hash(5,7,733)-.5)*.08,d=Math.hypot((nx-cx)/(.56+hash(8,2,737)*.09),(ny-cy)/(.50+hash(9,3,739)*.08)),coast=(fbm(nx*5.6,ny*5.6,741,4)-.5)*.08;shapeBias=.19-d*.20+coast-edge*.12}
   else if(shape==="continents"){let b=Math.max(...blobs.map(q=>blobField(nx,ny,q.cx,q.cy,q.sx,q.sy)));shapeBias=(b-.22)*.18-edge*.11}
   else if(shape==="archipelago"){let b=Math.max(...blobs.map(q=>blobField(nx,ny,q.cx,q.cy,q.sx,q.sy)));shapeBias=(b-.22)*.25-edge*.08}
   else if(shape==="shattered"){let b=Math.max(...blobs.map(q=>blobField(nx,ny,q.cx,q.cy,q.sx,q.sy)));shapeBias=(b-.20)*.20+(fbm(nx*9,ny*9,411,3)-.5)*.11-edge*.055}
   else if(shape==="inlandSea"){let center=blobField(nx,ny,.5,.5,.25,.25);shapeBias=.155-edge*.07-center*.52}
   let e=continental*.61+detail*.19+ridge*.13*rel+shapeBias;
   elevs[gy*COLS+gx]=e;
   let moistureNoise=fbm(nx*(3.5+diversity*2.2),ny*(3.5+diversity*2.2),90,4),tempNoise=fbm(nx*(2.2+diversity*1.8),ny*(2.2+diversity*1.8),120,3);
   moists[gy*COLS+gx]=clamp(moistureNoise*(.54+.22*diversity)+humUI*(.46-.10*diversity),0,1);
   temps[gy*COLS+gx]=clamp(tempUI*.50+tempNoise*(.24+.14*diversity)-Math.abs(ny-.5)*(.34+.12*diversity),0,1);
 }
 for(let pass=0;pass<2;pass++){let copy=new Float32Array(elevs);for(let gy=1;gy<ROWS-1;gy++)for(let gx=1;gx<COLS-1;gx++){let sum=0,w=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let ww=(dx===0&&dy===0)?4:1;sum+=copy[(gy+dy)*COLS+gx+dx]*ww;w+=ww}elevs[gy*COLS+gx]=lerp(copy[gy*COLS+gx],sum/w,.32)}}
 let mountainThreshold=sea+.31-mountainUI*.095-rel*.055,forestThreshold=.74-forestUI*.28,desertMoist=.23+desertUI*.25,desertTemp=.70-desertUI*.12;
 for(let gy=0;gy<ROWS;gy++)for(let gx=0;gx<COLS;gx++){
   let idx=gy*COLS+gx,e=elevs[idx],m=moists[idx],t=temps[idx],type="plains";
   if(e<sea)type="water";
   else if(e<sea+.020)type="sand";
   else if(e>mountainThreshold)type=t<.30?"snow":"mountain";
   else if(t<.18+diversity*.06)type=m>.44?"tundra":"snow";
   else if(t>desertTemp&&m<desertMoist)type="desert";
   else if(t>.60&&m<.47&&diversity>.35)type="savanna";
   else if(m>.77-diversity*.10&&e<sea+.15&&diversity>.45)type="swamp";
   else if(m>forestThreshold)type="forest";
   S.grid[idx]={type,elev:e,m,t};
 }
 // Rivers use the deterministic world RNG; same seed + settings = same rivers.
 S.rivers=[];let highs=[],waterCells=[];
 for(let gy=2;gy<ROWS-2;gy++)for(let gx=2;gx<COLS-2;gx++){let q=S.grid[gy*COLS+gx];if(q.type==="water"){if((gx+gy)%2===0)waterCells.push([gx,gy])}else if(q.elev>mountainThreshold-.04)highs.push([gx,gy,q.elev])}
 highs.sort((a,b)=>b[2]-a[2]);let starts=[],riverCount=+$("rivers").value;
 function smoothRiver(points){let p=points;for(let pass=0;pass<2;pass++){let out=[p[0]];for(let i=0;i<p.length-1;i++){let a=p[i],b=p[i+1];out.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75})}out.push(p.at(-1));p=out}return p}
 for(let r=0;r<riverCount&&highs.length&&waterCells.length;r++){
   let pool=highs.slice(0,Math.min(650,highs.length)),start=pool.find(q=>starts.every(s=>Math.hypot(q[0]-s[0],q[1]-s[1])>16));if(!start)start=pool[Math.floor(worldRandom()*pool.length)];if(!start)break;starts.push(start);
   let mouth=waterCells.reduce((best,w)=>{let d=(w[0]-start[0])**2+(w[1]-start[1])**2;return !best||d<best.d?{w,d}:best},null)?.w;if(!mouth)continue;
   let gx=start[0],gy=start[1],seen=new Set(),path=[],prevDx=0,prevDy=0,maxDim=Math.max(COLS,ROWS);
   for(let k=0;k<260;k++){
     let idx=gy*COLS+gx,q=S.grid[idx];if(!q)break;path.push({x:gx*CELL+CELL/2,y:gy*CELL+CELL/2});if(q.type==="water"&&k>4)break;seen.add(idx);
     let best=null,bscore=Infinity,currentMouthDist=Math.hypot(gx-mouth[0],gy-mouth[1]);
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let xx=gx+dx,yy=gy+dy;if(xx<1||yy<1||xx>=COLS-1||yy>=ROWS-1)continue;let ii=yy*COLS+xx;if(seen.has(ii))continue;let qq=S.grid[ii],md=Math.hypot(xx-mouth[0],yy-mouth[1]),reverse=(prevDx||prevDy)&&dx*prevDx+dy*prevDy<-.1;let score=qq.elev*.62+(md/maxDim)*.48+(reverse?.020:0)+(md>currentMouthDist+.2?.012:0)+hash(xx,yy,700+r)*.0025;if(qq.type==="water")score-=.12;if(score<bscore){bscore=score;best=[xx,yy,dx,dy]}}
     if(!best)break;let cur=q.elev,next=S.grid[best[1]*COLS+best[0]].elev;if(next>cur+.052&&Math.hypot(best[0]-mouth[0],best[1]-mouth[1])>6&&k>12)break;[gx,gy,prevDx,prevDy]=best;
   }
   if(path.length>8){let simple=path.filter((_,i)=>i===0||i===path.length-1||i%2===0);S.rivers.push(smoothRiver(simple))}
 }
}
function terrainAt(px,py){return S.grid[clamp(Math.floor(py/CELL),0,ROWS-1)*COLS+clamp(Math.floor(px/CELL),0,COLS-1)]}
function landPoint(ci){
 let count=Math.max(1,S.civs.length),band=W/count;
 for(let k=0;k<1400;k++){let px=wrnd(ci*band+80,(ci+1)*band-80),py=wrnd(90,H-90),t=terrainAt(px,py).type;if(!["water","mountain","snow"].includes(t))return [px,py]}
 for(let k=0;k<1200;k++){let px=wrnd(80,W-80),py=wrnd(90,H-90),t=terrainAt(px,py).type;if(!["water","mountain","snow"].includes(t))return [px,py]}
 return [W/2,H/2]
}
function riverCellSet(){let set=new Set();for(const river of S.rivers||[])for(let i=0;i<river.length;i+=3){let p=river[i],gx=Math.floor(p.x/CELL),gy=Math.floor(p.y/CELL);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)set.add(`${gx+dx},${gy+dy}`)}return set}
function weightedResource(entries){let total=entries.reduce((n,q)=>n+q[1],0),r=worldRandom()*total;for(const [k,w] of entries){r-=w;if(r<=0)return k}return entries.at(-1)?.[0]||"food"}
function biomeResourceWeights(type,nearRiver=false){
 let w={plains:[["food",48],["water",nearRiver?26:13],["wood",18],["ore",14],["oil",4]],forest:[["wood",68],["food",16],["water",nearRiver?24:10],["ore",7],["oil",1]],mountain:[["ore",70],["wood",12],["water",nearRiver?15:5],["food",5],["oil",8]],desert:[["oil",48],["ore",34],["water",nearRiver?10:2],["food",3],["wood",1]],savanna:[["food",34],["wood",24],["water",nearRiver?25:8],["ore",14],["oil",10]],swamp:[["water",44],["food",26],["wood",25],["ore",5]],tundra:[["ore",35],["water",nearRiver?30:18],["wood",17],["oil",20],["food",8]],sand:[["water",nearRiver?28:9],["food",13],["wood",4],["ore",20],["oil",18]]};return w[type]||w.plains
}
function seedResources(){
 S.res=[];S.worldProfile=S.worldProfile||{};let roll=S.worldProfile.resourceRoll||0;seedWorldRng(303+roll*997);
 let den=+$("resourceDensity").value/100,cluster=(+$("resourceClustering")?.value||60)/100,riverCells=riverCellSet(),hotspots=[],hotCount=Math.round(8+cluster*24),hotAttempts=0;
 while(hotspots.length<hotCount&&hotAttempts<hotCount*40){hotAttempts++;let x=wrnd(40,W-40),y=wrnd(60,H-40),t=terrainAt(x,y).type;if(t==="water")continue;hotspots.push({x,y,type:weightedResource(biomeResourceWeights(t,false)),spread:180+wrnd(120,520)*(1-cluster*.55)})}
 let target=Math.floor(1600*den),attempts=0,maxAttempts=Math.max(2500,target*25);
 while(S.res.length<target&&attempts<maxAttempts){attempts++;let x,y;if(hotspots.length&&worldRandom()<.35+cluster*.48){let h=wpick(hotspots);x=clamp(h.x+wrnd(-h.spread,h.spread),20,W-20);y=clamp(h.y+wrnd(-h.spread,h.spread),45,H-20)}else{x=wrnd(20,W-20);y=wrnd(45,H-20)}let q=terrainAt(x,y);if(!q||q.type==="water")continue;let gx=Math.floor(x/CELL),gy=Math.floor(y/CELL),nearRiver=riverCells.has(`${gx},${gy}`),type=weightedResource(biomeResourceWeights(q.type,nearRiver));S.res.push({type,x,y,biome:q.type,quality:Math.round(55+worldRandom()*45)})}
}
function strategicTypeLabel(type){return ({oil:"Bassin pétrolier",ore:"Gisement minier",food:"Plaine fertile",wood:"Forêt productive",water:"Réserve d'eau douce",wealth:"Carrefour riche"})[type]||"Zone stratégique"}
function strategicIcon(type){return ({oil:"🛢",ore:"⛏",food:"🌾",wood:"🪵",water:"💧",wealth:"💰"})[type]||"◆"}
function zoneShapeFor(id,value=50){let pts=[],n=10+(id%5),base=28+value*.22;for(let i=0;i<n;i++){let a=i/n*Math.PI*2,r=base*(.72+hash(id,i,931)*.58);pts.push({a,r})}return pts}
function rebuildStrategicZones(force=false){
 let previous=S.strategicZones||[],bucketSize=500,buckets=new Map(),weight={food:2.7,water:3.8,wood:2.0,ore:5.0,oil:7.0};
 for(const r of S.res){
   let bx=Math.floor(r.x/bucketSize),by=Math.floor(r.y/bucketSize),k=`${bx},${by}`,b=buckets.get(k);
   if(!b){b={x:0,y:0,n:0,score:0,types:{food:0,water:0,wood:0,ore:0,oil:0},biomes:{}};buckets.set(k,b)}
   let w=(weight[r.type]||1)*(r.quality||70)/70;b.x+=r.x*w;b.y+=r.y*w;b.n+=w;b.score+=w;b.types[r.type]=(b.types[r.type]||0)+w;b.biomes[r.biome]=(b.biomes[r.biome]||0)+1;
 }
 for(const city of S.cities||[]){
   let bx=Math.floor(city.x/bucketSize),by=Math.floor(city.y/bucketSize),k=`${bx},${by}`,b=buckets.get(k);
   if(!b){b={x:0,y:0,n:0,score:0,types:{food:0,water:0,wood:0,ore:0,oil:0},biomes:{}};buckets.set(k,b)}
   let w=clamp((city.prosperity||50)/9,3,11);b.x+=city.x*w;b.y+=city.y*w;b.n+=w;b.score+=w*1.28;b.wealth=(b.wealth||0)+w;
 }
 let candidates=[...buckets.values()].filter(b=>b.n>0&&b.score>8).map(b=>{
   let resource=Object.entries(b.types).sort((a,q)=>q[1]-a[1])[0],type=b.wealth>10&&(!resource||b.wealth>resource[1]*.72)?"wealth":resource?.[0]||"wealth";
   let biome=Object.entries(b.biomes).sort((a,q)=>q[1]-a[1])[0]?.[0]||terrainAt(b.x/b.n,b.y/b.n)?.type||"plains";
   return {x:b.x/b.n,y:b.y/b.n,value:Math.round(clamp(b.score*3.1,22,100)),type,biome}
 }).sort((a,b)=>b.value-a.value);
 let chosen=[];
 for(const q of candidates){
   if(chosen.some(z=>Math.hypot(z.x-q.x,z.y-q.y)<480))continue;
   let old=previous.find(z=>Math.hypot(z.x-q.x,z.y-q.y)<320&&z.type===q.type),nearest=[...S.cities].sort((a,b)=>Math.hypot(a.x-q.x,a.y-q.y)-Math.hypot(b.x-q.x,b.y-q.y))[0],initialOwner=nearest&&Math.hypot(nearest.x-q.x,nearest.y-q.y)<1100?nearest.ci:null,id=old?.id||idSeq++;
   chosen.push({id,x:q.x,y:q.y,type:q.type,biome:q.biome,value:q.value,owner:old?.owner??initialOwner,attacker:null,progress:old?.progress||0,shape:old?.shape||zoneShapeFor(id,q.value)});if(chosen.length>=18)break
 }
 S.strategicZones=chosen;markTerritoryDirty()
}
function strategicBenefitText(z){
 let power=Math.round(z.value*(+$("strategicImpact")?.value||140)/100);
 if(z.type==="ore")return `⛏ +minerai · armée renforcée · puissance ${power}`;
 if(z.type==="oil")return `🛢 +pétrole · richesse · puissance ${power}`;
 if(z.type==="food")return `🌾 +récoltes · sécurité alimentaire · puissance ${power}`;
 if(z.type==="water")return `💧 +eau · prospérité · puissance ${power}`;
 if(z.type==="wood")return `🪵 +bois · construction · puissance ${power}`;
 return `💰 +biens · trésor · puissance ${power}`;
}

function strategicInterest(attacker,defender){
 let home=S.cities.find(c=>c.ci===attacker&&c.capital)||S.cities.find(c=>c.ci===attacker);if(!home)return {score:0,zone:null};let best=null,bestScore=0;
 for(const z of S.strategicZones||[]){if(z.owner!==defender)continue;let d=Math.hypot(z.x-home.x,z.y-home.y),need=z.type==="food"?100-(S.civs[attacker].foodSecurity||60):z.type==="water"?100-(S.civs[attacker].waterSecurity||60):25,score=z.value*(1+need/130)/(1+d/1300);if(score>bestScore){bestScore=score;best=z}}
 return {score:bestScore,zone:best}
}
function applyStrategicBenefits(){
 let impact=(+$("strategicImpact")?.value||120)/100;
 for(const z of S.strategicZones||[]){if(z.owner==null||!S.civs[z.owner])continue;let v=S.civs[z.owner],city=S.cities.filter(c=>c.ci===z.owner).sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y))[0];if(!city)continue;let q=z.value/100*impact;
   if(z.type==="ore"){city.stock.ore+=2.8*q;v.military+=.018*q;v.wealth+=.18*q}
   else if(z.type==="oil"){city.stock.oil+=2.2*q;v.wealth+=.42*q;v.military+=.012*q}
   else if(z.type==="food"){city.stock.food+=6.5*q;v.foodSecurity=clamp((v.foodSecurity||60)+.05*q,0,100)}
   else if(z.type==="water"){city.stock.water=(city.stock.water||0)+7*q;v.waterSecurity=clamp((v.waterSecurity||60)+.08*q,0,100);city.prosperity=clamp(city.prosperity+.025*q,0,100)}
   else if(z.type==="wood"){city.stock.wood+=5.3*q;v.wealth+=.12*q}
   else if(z.type==="wealth"){city.stock.goods+=3.5*q;v.treasury+=1.4*q;v.wealth+=.55*q}
 }
}
function updateStrategicZones(){
 if(S.tick%3600===0)rebuildStrategicZones(false);if(S.tick%180===0)applyStrategicBenefits();if(!S.strategicZones?.length||S.tick%180!==0)return;if(spatialNeedsRefresh())rebuildSpatial();
 for(const z of S.strategicZones){
   let forces=new Map();for(const p of spatialCandidates(SP.people,z.x,z.y,280)){if(!/Guerrier|Soldat|Chevalier|Pilote/.test(p.role))continue;if((p.x-z.x)**2+(p.y-z.y)**2>280*280)continue;forces.set(p.ci,(forces.get(p.ci)||0)+1)}
   let best=[...forces.entries()].sort((a,b)=>b[1]-a[1])[0];if(!best){z.progress=Math.max(0,(z.progress||0)-.04);if(z.progress===0)z.attacker=null;continue}
   let [ci,n]=best,others=[...forces.entries()].filter(([q])=>q!==ci).reduce((sum,[,v])=>sum+v,0);if(ci===z.owner){z.progress=Math.max(0,(z.progress||0)-.08);z.attacker=null;continue}
   let canTake=z.owner==null||areAtWar(ci,z.owner);if(!canTake){z.progress=Math.max(0,(z.progress||0)-.05);continue}if(n<=Math.max(1,others*1.12))continue;if(z.attacker!==ci){z.attacker=ci;z.progress=0}z.progress+=(n/(n+others+2))*.14;
   if(z.progress>=1){let old=z.owner;z.owner=ci;z.attacker=null;z.progress=0;markTerritoryDirty();let v=S.civs[ci];worldEvent({type:"war",title:`Contrôle de ${strategicTypeLabel(z.type)}`,text:`${v.name} prend le contrôle d'une zone ${z.biome||"naturelle"} stratégique de valeur ${z.value}${old!=null?` jusque-là contrôlée par ${S.civs[old]?.name||"un rival"}`:""}.`,score:84,ci,x:z.x,y:z.y,personId:leaderForCiv(ci)?.id})}
 }
}
function traceStrategicShape(z,scale=1){let pts=z.shape||zoneShapeFor(z.id,z.value);ctx.beginPath();for(let i=0;i<pts.length;i++){let p=pts[i],x=z.x+Math.cos(p.a)*p.r*scale,y=z.y+Math.sin(p.a)*p.r*scale;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath()}
function drawStrategicZones(){
 if(!$("showStrategicZones")?.checked)return;let vb=visibleBounds(),time=S.tick*.035;ctx.save();
 for(const z of S.strategicZones||[]){if(z.x<vb.l-130||z.x>vb.r+130||z.y<vb.t-130||z.y>vb.b+130)continue;let owner=z.owner!=null?S.civs[z.owner]:null,pulse=1+Math.sin(time+z.id)*.035;ctx.globalAlpha=.12;ctx.fillStyle=owner?.color||"#e0b655";traceStrategicShape(z,pulse);ctx.fill();ctx.globalAlpha=.78;ctx.strokeStyle="#dfb451";ctx.lineWidth=2/camera.zoom;ctx.setLineDash([7/camera.zoom,5/camera.zoom]);traceStrategicShape(z,1);ctx.stroke();ctx.setLineDash([]);if(z.progress>0){ctx.globalAlpha=.95;ctx.strokeStyle="#f0d482";ctx.lineWidth=4/camera.zoom;traceStrategicShape(z,.78+.18*z.progress);ctx.stroke()}if(camera.zoom>.38){ctx.globalAlpha=.95;ctx.font=`${Math.max(11,13/camera.zoom)}px system-ui`;ctx.textAlign="center";ctx.fillStyle="#f3d47e";ctx.fillText(`${strategicIcon(z.type)} ${z.value}`,z.x,z.y-46-z.value*.1)}}ctx.restore()
}

function cityName(ci){let base=pick(cityPrefixes)+pick(citySuffixes);let used=new Set(S.cities.map(c=>c.name));let n=base,k=2;while(used.has(n))n=base+" "+k++;return n}
function createCity(ci,x,y,name=null,capital=false){let city={id:idSeq++,ci,originalCi:ci,name:name||cityName(ci),x,y,capital,foundYear:S.year,radius:260,influenceScale:1,population:0,prosperity:55,unrest:12,defense:10,resistance:0,specialization:"Village",stock:{food:45,water:35,wood:30,ore:8,oil:0,goods:3},occupation:{ci:null,progress:0}};S.cities.push(city);markTerritoryDirty();return city}
function findCity(id){return S.cities.find(q=>q.id===id)}
function nearestCityXY(x,y,ci=null,range=1e20){let q=null,d=range*range;for(const city of S.cities){if(ci!=null&&city.ci!==ci)continue;let z=(city.x-x)**2+(city.y-y)**2;if(z<d){d=z;q=city}}return q}
function nearestCity(p,range=1e20){return nearestCityXY(p.x,p.y,p.ci,range)}
function addBuilding(ci,type,x,y,name=null,cityId=null){let def=buildings.find(b=>b.type===type)||buildings[0],city=cityId?findCity(cityId):nearestCityXY(x,y,ci,850),b={id:idSeq++,ci,type,x,y,name:name||def.name,beds:def.beds,residents:[],cityId:city?.id||null,scale:1,roof:null};S.buildings.push(b);if(typeof SP!=="undefined")SP.last=-1;return b}
function assignHomes(ci){let homes=S.buildings.filter(b=>b.ci===ci&&b.beds>0),people=S.people.filter(p=>p.ci===ci&&!p.home);for(const p of people){let h=homes.filter(h=>h.residents.length<h.beds).sort((a,b)=>((a.x-p.x)**2+(a.y-p.y)**2)-((b.x-p.x)**2+(b.y-p.y)**2))[0];if(h){p.home=h.id;p.cityId=h.cityId||nearestCityXY(h.x,h.y,ci)?.id||null;h.residents.push(p.id)}else if(!p.cityId)p.cityId=nearestCity(p)?.id||null}}
function cityForPerson(p){return findCity(p.cityId)||findCity(findBuilding(p.home)?.cityId)||nearestCity(p)}

function fitWorld(){
 camera.zoom=Math.min(c.width/W,c.height/H)*.96;
 camera.minZoom=camera.zoom*.82;
 camera.x=(W-c.width/camera.zoom)/2;
 camera.y=(H-c.height/camera.zoom)/2;
 clampCamera();
}
function clampCamera(){
 let vw=c.width/camera.zoom,vh=c.height/camera.zoom;
 camera.x=clamp(camera.x,0,Math.max(0,W-vw));
 camera.y=clamp(camera.y,0,Math.max(0,H-vh));
}

function markTerritoryDirty(){TERR.dirty=true}
function territoryOwnerAt(x,y){
 if(TERR.dirty||!TERR.owners)rebuildTerritories();
 let gx=clamp(Math.floor(x/CELL),0,COLS-1),gy=clamp(Math.floor(y/CELL),0,ROWS-1),idx=gy*COLS+gx;
 return {ci:TERR.owners?.[idx]??-1,contested:!!TERR.contested?.[idx]};
}
function foundingPoint(minDist=700){
 let best=null,bestScore=-1;
 for(let k=0;k<120;k++){
   let x=rnd(120,W-120),y=rnd(120,H-120),t=terrainAt(x,y).type;
   if(["water","mountain"].includes(t))continue;
   let d=S.cities.length?Math.min(...S.cities.map(c=>Math.hypot(x-c.x,y-c.y))):1e9;
   if(d>bestScore){bestScore=d;best=[x,y]}
 }
 return bestScore>=minDist?best:best||[W/2,H/2];
}
function rebuildTerritories(){
 if(!S?.civs?.length||!S.grid?.length){TERR.dirty=false;return}
 TERR.canvas.width=COLS;TERR.canvas.height=ROWS;
 let nCells=COLS*ROWS,owners=new Int16Array(nCells);owners.fill(-1),costs=new Float32Array(nCells);costs.fill(Infinity),contested=new Uint8Array(nCells);
 let blockedCells=new Uint8Array(nCells),riverCells=new Uint8Array(nCells);
 for(const w of S.walls||[]){let gx=clamp(Math.floor(w.x/CELL),0,COLS-1),gy=clamp(Math.floor(w.y/CELL),0,ROWS-1);blockedCells[gy*COLS+gx]=1}
 for(const river of S.rivers||[])for(let i=0;i<river.length;i+=2){let p=river[i],gx=clamp(Math.floor(p.x/CELL),0,COLS-1),gy=clamp(Math.floor(p.y/CELL),0,ROWS-1);riverCells[gy*COLS+gx]=1}
 // Small binary heap. Territory complexity is tied to map cells, not number of cities.
 let heap=[];
 const push=(node)=>{let i=heap.push(node)-1;while(i>0){let p=(i-1)>>1;if(heap[p][0]<=node[0])break;heap[i]=heap[p];i=p;heap[i]=node}};
 const pop=()=>{if(!heap.length)return null;let root=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;while(true){let l=i*2+1,r=l+1,b=i;if(l<heap.length&&heap[l][0]<heap[b][0])b=l;if(r<heap.length&&heap[r][0]<heap[b][0])b=r;if(b===i)break;[heap[i],heap[b]]=[heap[b],heap[i]];i=b}}return root};
 for(const city of S.cities||[]){
   let gx=clamp(Math.floor(city.x/CELL),0,COLS-1),gy=clamp(Math.floor(city.y/CELL),0,ROWS-1),idx=gy*COLS+gx;
   let budget=clamp((city.radius||260)/CELL*.92+(city.capital?2.4:0)+(city.prosperity||50)/28+Math.sqrt(Math.max(1,city.population||1))*.28,5,24);
   let startCost=-budget;if(startCost<costs[idx]){costs[idx]=startCost;owners[idx]=city.ci;push([startCost,idx,city.ci])}
 }
 for(const z of S.strategicZones||[]){
   if(z.owner==null)continue;let gx=clamp(Math.floor(z.x/CELL),0,COLS-1),gy=clamp(Math.floor(z.y/CELL),0,ROWS-1),idx=gy*COLS+gx,budget=clamp(2.3+z.value/24,2.8,7);
   let startCost=-budget;if(startCost<costs[idx]){costs[idx]=startCost;owners[idx]=z.owner;push([startCost,idx,z.owner])}
 }
 const dirs=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[-1,1,1.414],[1,-1,1.414],[-1,-1,1.414]];
 while(heap.length){
   let [cur,idx,ci]=pop();if(cur!==costs[idx]||ci!==owners[idx]||cur>0)continue;
   let gx=idx%COLS,gy=(idx/COLS)|0;
   for(const [dx,dy,base] of dirs){
     let xx=gx+dx,yy=gy+dy;if(xx<0||yy<0||xx>=COLS||yy>=ROWS)continue;let ni=yy*COLS+xx,cell=S.grid[ni];if(!cell||cell.type==="water"||blockedCells[ni])continue;
     let terrainCost=cell.type==="mountain"?3.8:cell.type==="snow"?2.2:cell.type==="tundra"?1.65:cell.type==="forest"?1.38:cell.type==="swamp"?1.75:cell.type==="desert"?1.6:cell.type==="sand"?1.15:cell.type==="savanna"?1.08:1,riverPenalty=(riverCells[idx]||riverCells[ni])?1.42:1;
     let rough=(+$("borderRoughness")?.value||70)/100,noise=(1-.22*rough)+hash(xx,yy,880+ci*17)*(.44*rough),next=cur+base*terrainCost*riverPenalty*noise;
     if(next<costs[ni]&&next<=.65){costs[ni]=next;owners[ni]=ci;push([next,ni,ci])}
   }
 }
 // Boundary/contested pass.
 for(let gy=1;gy<ROWS-1;gy++)for(let gx=1;gx<COLS-1;gx++){
   let idx=gy*COLS+gx,own=owners[idx];if(own<0)continue;
   let around=[owners[idx+1],owners[idx-1],owners[idx+COLS],owners[idx-COLS]],enemyEdge=around.some(q=>q>=0&&q!==own),wildEdge=around.some(q=>q<0);
   if(enemyEdge)contested[idx]=1;else if(wildEdge)contested[idx]=2;
 }
 let img=TERR.ctx.createImageData(COLS,ROWS),px=img.data;
 for(let idx=0;idx<nCells;idx++){
   let ci=owners[idx];if(ci<0)continue;let col=S.civs[ci]?.color||"#888",rgb=parseInt(col.slice(1),16),r=(rgb>>16)&255,g=(rgb>>8)&255,b=rgb&255,o=idx*4;
   if(contested[idx]===1){px[o]=Math.min(255,r+28);px[o+1]=Math.min(255,g+28);px[o+2]=Math.min(255,b+28);px[o+3]=142}
   else if(contested[idx]===2){px[o]=r;px[o+1]=g;px[o+2]=b;px[o+3]=96}
   else{px[o]=r;px[o+1]=g;px[o+2]=b;px[o+3]=48}
 }
 TERR.ctx.putImageData(img,0,0);TERR.owners=owners;TERR.contested=contested;TERR.dirty=false;
}
function generateDividerWalls(){
 S.walls=[];if((S.civs?.length||0)<2){SP.last=-1;markTerritoryDirty();return}
 let bands=S.civs.length,bandW=W/bands;
 for(let i=1;i<bands;i++){
   let x=Math.round(i*bandW);
   for(let y=40;y<H-40;y+=24){
     // Large periodic gates preserve contact, trade and invasion possibilities.
     if((Math.floor(y/360)%3)===1&&Math.abs((y%360)-180)<58)continue;
     let t=terrainAt(x,y).type;if(t==="water")continue;
     S.walls.push({x,y})
   }
 }
 SP.last=-1;markTerritoryDirty()
}
function seedStartingCivilizations(count,popEach=60){
 for(let ci=0;ci<count;ci++)S.civs.push(civ(ci));
 for(let ci=0;ci<count;ci++){
   let [cx,cy]=landPoint(ci);
   let baseName=count===1&&ci===0?"Asteria":(count===2?(ci===0?"Asteria":"Rocmar"):null);
   let city=createCity(ci,cx,cy,baseName,true);
   let bcount=count===1?12:10,farmCount=Math.max(2,Math.ceil(popEach/40));
   for(let h=0;h<bcount;h++){let type=h===0?"hall":h<=farmCount?"farm":"hut";addBuilding(ci,type,cx+rnd(-170,170),cy+rnd(-170,170),h===0?"Centre de "+city.name:null,city.id)}
   for(let i=0;i<popEach;i++){let [px,py]=landPoint(ci);let p=makePerson(ci,px,py);p.cityId=city.id;S.people.push(p)}
   assignHomes(ci);
 }
 markTerritoryDirty();
}

function reset(options={}){
 let worldFactor=+$("worldScale")?.value||1;W=Math.round(7200*worldFactor);H=Math.round(4200*worldFactor);COLS=Math.ceil(W/CELL);ROWS=Math.ceil(H/CELL);$("mapSizeLabel").textContent=`${W}×${H}`;
 let requestedSeed=Number(options?.seed),keepSeed=options?.sameSeed===true;
 if(Number.isFinite(requestedSeed))seed=Math.abs(requestedSeed)%1000000000;
 else if(!keepSeed)seed=Math.floor(Math.random()*999999999)+1;
 $("worldSeed").value=Math.floor(seed);idSeq=1;
 let startCivs=clamp(+$("defaultCivCount")?.value||1,1,12);
 S={run:true,tick:0,minute:480,day:1,year:1,season:0,elapsedMinutes:480,lastDemographyDay:0,weather:"Clair",war:false,wars:[],walls:[],grid:[],rivers:[],res:[],strategicZones:[],buildings:[],people:[],cities:[],roads:[],tradeRoutes:[],armies:[],history:[],legends:[],crises:[],civs:[]};
 SP.last=-1;SP.people.clear();SP.res.clear();SP.buildings.clear();SP.walls.clear();
 let blankOcean=options?.blankOcean===true;
 if(blankOcean){generateEmptyOcean();minimapDirty=true;markTerrainCacheDirty()}else{generateTerrain();minimapDirty=true;markTerrainCacheDirty();seedResources();seedWorldRng(701);seedStartingCivilizations(startCivs,startCivs===1?90:60)}
 rebuildRoads();ensureGovernments();updateCities(true);
 if(!blankOcean&&typeof rebuildStrategicZones==="function")rebuildStrategicZones(true);
 if(($("defaultWalls")?.value||"none")==="dividers")generateDividerWalls();
 active=0;selected=null;story.worldEvents=[];story.bubbles=[];story.eraWaves=[];story.cinematic=null;story.cinematicQueue=[];story.eventCooldowns={};
 $("cinematicBanner")?.classList.remove("show");$("historyTicker")?.classList.remove("show");document.body.classList.remove("story-cinematic");story.lastCinematicReal=0;story.lastCinematicByKey={};story.suppressedEvents=[];story.lastCrisisDay=-1;followPersonId=null;story.lastAutoDay=simDayIndex();story.nextAutoDay=story.lastAutoDay+(+$("eventFrequency")?.value||1800);R={recording:$("recordReplay")?.checked!==false,snapshots:[],events:[],lastCaptureYear:0,liveState:null,playing:false};$("log").innerHTML="";
 for(const p of S.people){addPersonEvent(p,"Début de chronique",`${pname(p)} vit dans la civilisation ${S.civs[p.ci].name}.`,22,["origin"])}
 worldEvent(blankOcean?{type:"world",title:"Océan vierge",text:"Le monde ne contient que de l'eau. Utilise les outils de terrain pour le façonner.",score:66,x:W/2,y:H/2}:{type:"world",title:"Naissance d’un nouveau monde",text:`Un monde ${S.worldProfile?.label||"unique"} apparaît avec ses biomes et ses ressources propres.`,score:72,x:W/2,y:H/2});
 captureReplaySnapshot(story.worldEvents.at(-1));tabs();editor();update();fitWorld();draw();
 $("detailCard").innerHTML='<div class="empty">Clique sur un élément du monde.</div>';$("personEditor").classList.add("hidden");$("personLifePanel").classList.add("hidden");$("buildingEditor").classList.add("hidden");
}
function findPerson(id){return S.people.find(p=>p.id===id)}
function findBuilding(id){return S.buildings.find(b=>b.id===id)}
const SP={cell:300,people:new Map(),res:new Map(),buildings:new Map(),walls:new Map(),last:-1};
function spKey(x,y){return `${Math.floor(x/SP.cell)},${Math.floor(y/SP.cell)}`}
function spPush(map,x,y,obj){let k=spKey(x,y),a=map.get(k);if(!a)map.set(k,a=[]);a.push(obj)}
function rebuildSpatial(){SP.people.clear();SP.res.clear();SP.buildings.clear();SP.walls.clear();for(const p of S.people)spPush(SP.people,p.x,p.y,p);for(const r of S.res)spPush(SP.res,r.x,r.y,r);for(const b of S.buildings)spPush(SP.buildings,b.x,b.y,b);for(const w of S.walls)spPush(SP.walls,w.x,w.y,w);SP.last=S.tick}
function spatialNeedsRefresh(){let sv=speedValue(),maxAge=sv>=100?220:sv>=50?150:sv>=25?80:sv>=10?36:12;return SP.last<0||S.tick<SP.last||S.tick-SP.last>=maxAge}
function spatialCandidates(map,x,y,range){let out=[],cx=Math.floor(x/SP.cell),cy=Math.floor(y/SP.cell),n=Math.ceil(range/SP.cell);for(let yy=cy-n;yy<=cy+n;yy++)for(let xx=cx-n;xx<=cx+n;xx++){let a=map.get(`${xx},${yy}`);if(a)out.push(...a)}return out}
function nearestRes(p,type){if(spatialNeedsRefresh())rebuildSpatial();let q=null,d=1e20;for(let radius=360;radius<=1800&&!q;radius+=360){for(const r of spatialCandidates(SP.res,p.x,p.y,radius)){if(r._dead||(type&&r.type!==type))continue;let z=(r.x-p.x)**2+(r.y-p.y)**2;if(z<d){d=z;q=r}}}return q}
function warKey(a,b){return a<b?`${a}-${b}`:`${b}-${a}`}
function areAtWar(a,b){return a!==b&&S.wars?.some(w=>w.key===warKey(a,b))}
function civAtWar(ci){return S.wars?.some(w=>w.a===ci||w.b===ci)}
function refreshGlobalWar(){S.war=!!S.wars?.length}
function declareWar(a,b,reason="Conflit",targetZoneId=null){if(a===b||areAtWar(a,b))return false;S.wars.push({key:warKey(a,b),a:Math.min(a,b),b:Math.max(a,b),startYear:S.year,reason,targetZoneId});refreshGlobalWar();return true}
function makePeacePair(a,b){S.wars=S.wars.filter(w=>w.key!==warKey(a,b));refreshGlobalWar()}
function enemy(p,range){if(spatialNeedsRefresh())rebuildSpatial();let q=null,d=range*range;for(const e of spatialCandidates(SP.people,p.x,p.y,range))if(e!==p&&areAtWar(p.ci,e.ci)){let z=(e.x-p.x)**2+(e.y-p.y)**2;if(z<d){d=z;q=e}}return q}
function blocked(x1,y1,x2,y2){
 if(!S.walls.length)return false;if(spatialNeedsRefresh())rebuildSpatial();
 let mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy||1;
 for(const w of spatialCandidates(SP.walls,mx,my,90)){
   let t=clamp(((w.x-x1)*dx+(w.y-y1)*dy)/len2,0,1),qx=x1+t*dx,qy=y1+t*dy;
   if((w.x-qx)**2+(w.y-qy)**2<13*13)return true
 }
 return false
}
function compatibility(a,b){return 100-(Math.abs(a.iq-b.iq)*.12+Math.abs(a.aggression-b.aggression)*.12+Math.abs(a.curiosity-b.curiosity)*.12)+((a.charisma+b.charisma)/12)}
function familyEnvironment(ci,city=null){
 let v=S.civs[ci],ps=S.people.filter(p=>p.ci===ci),bs=S.buildings.filter(b=>b.ci===ci),beds=bs.reduce((n,b)=>n+(b.beds||0),0),pop=Math.max(1,ps.length);
 let housing=clamp(beds/pop,.45,1.28),food=clamp((v.foodSecurity??65)/62,.42,1.28),stability=clamp((v.stability??70)/68,.55,1.18);
 return {housing,food,stability,pop};
}
function tryCouple(p){
 if(!$("couples").checked||p.partner||p.age<18||p.age>64)return;
 if(spatialNeedsRefresh())rebuildSpatial();
 let candidates=spatialCandidates(SP.people,p.x,p.y,360).filter(q=>q!==p&&q.ci===p.ci&&!q.partner&&q.age>=18&&q.age<=64&&q.sex!==p.sex);
 let best=null,score=62;for(const q of candidates){let s=compatibility(p,q)+(q.lifeGoal==="family"?8:0)+(p.lifeGoal==="family"?8:0);if(s>score){score=s;best=q}}
 let env=familyEnvironment(p.ci,cityForPerson(p)),chance=clamp(.18+(p.charisma+(best?.charisma||0))/500+env.stability*.12,0,.52);
 if(best&&Math.random()<chance){p.partner=best.id;best.partner=p.id;p.relationship=Math.round(score);best.relationship=p.relationship;let home=findBuilding(p.home)||findBuilding(best.home);if(home){p.home=home.id;best.home=home.id;if(!home.residents.includes(p.id)&&home.residents.length<home.beds)home.residents.push(p.id);if(!home.residents.includes(best.id)&&home.residents.length<home.beds)home.residents.push(best.id)}addPersonEvent(p,"Nouveau couple",`${pname(p)} forme un couple avec ${pname(best)}.`,52,["family"]);addPersonEvent(best,"Nouveau couple",`${pname(best)} forme un couple avec ${pname(p)}.`,52,["family"])}
}
function tryPregnancy(p,checkDays=30){
 if(!$("births").checked||!$("familyLife").checked||p.sex!=="F"||!p.partner||p.pregnant>0||p.age<18||p.age>45)return;
 let partner=findPerson(p.partner);if(!partner||partner.age<18||partner.age>70)return;
 let v=S.civs[p.ci],env=familyEnvironment(p.ci,cityForPerson(p)),fert=(p.fertility+partner.fertility+v.fertility)/300;
 let ps=S.people.filter(q=>q.ci===p.ci),children=ps.filter(q=>q.age<15).length,repro=ps.filter(q=>q.sex==="F"&&q.age>=18&&q.age<=45).length;
 let replacementBoost=children<ps.length*.20?1.18:1,smallPopBoost=ps.length<35?1.38:ps.length<70?1.16:1;
 let stressFactor=clamp(1-(p.stress||0)/180,.48,1),healthFactor=clamp(p.hp/75,.55,1.12);
 let annualRate=clamp((.20+fert*.52)*(v.birthRate||1)*env.housing*env.food*env.stability*replacementBoost*smallPopBoost*stressFactor*healthFactor,.035,1.35);
 let chance=1-Math.exp(-annualRate*(checkDays/360));
 if(Math.random()<chance){p.pregnant=270;p.pregnancyPartner=partner.id;addPersonEvent(p,"Grossesse",`${pname(p)} attend un enfant avec ${pname(partner)}.`,46,["family"])}
}
function birth(mother){
 let father=findPerson(mother.pregnancyPartner),home=findBuilding(mother.home),city=cityForPerson(mother);if(!father)return;
 let child=makePerson(mother.ci,mother.x+rnd(-10,10),mother.y+rnd(-10,10),0,[mother.id,father.id]);child.last=father.last;child.cityId=mother.cityId||city?.id||null;
 child.baseIQ=clamp(Math.round((mother.baseIQ+father.baseIQ)/2+rnd(-10,10)),55,165);child.iq=child.baseIQ;child.strength=clamp(Math.round((mother.strength+father.strength)/2+rnd(-10,10)),1,100);child.charisma=clamp(Math.round((mother.charisma+father.charisma)/2+rnd(-10,10)),1,100);
 child.fertility=clamp(Math.round((mother.fertility+father.fertility)/2+rnd(-12,12)),1,100);
 if(home&&home.residents.length<home.beds){child.home=home.id;home.residents.push(child.id)}
 S.people.push(child);mother.children.push(child.id);father.children.push(child.id);mother.pregnant=0;mother.pregnancyPartner=null;SP.last=-1;
 if(!child.home)assignHomes(child.ci);
 addPersonEvent(child,"Naissance",`${pname(child)} naît, enfant de ${pname(mother)} et ${pname(father)}.`,75,["birth"]);
 addPersonEvent(mother,"Naissance d’un enfant",`${pname(child)} vient de naître.`,67,["family"]);addPersonEvent(father,"Naissance d’un enfant",`${pname(child)} vient de naître.`,67,["family"]);
 if(Math.max(personImportance(mother),personImportance(father))>72)worldEvent({type:"birth",title:"Naissance dans une famille influente",text:`${pname(child)} naît dans la famille de ${pname(mother)} et ${pname(father)}.`,score:58,ci:mother.ci,personId:child.id,x:child.x,y:child.y});
 showToast(`👶 Naissance : ${pname(child)}`);
}
function updateAgesByCalendar(){
 let now=simDayIndex();if(!Number.isFinite(S.lastDemographyDay))S.lastDemographyDay=now;
 let oldYear=Math.floor(S.lastDemographyDay/360),newYear=Math.floor(now/360),delta=Math.max(0,newYear-oldYear);
 if(delta>0)for(const p of S.people)p.age+=delta;
 S.lastDemographyDay=now;
}
function updateDemographyState(ci){
 let el=$("demographyState");if(!el||ci!==active)return;let ps=S.people.filter(p=>p.ci===ci),v=S.civs[ci];if(!ps.length){el.textContent="Éteinte";el.style.color="#d66";return}
 let women=ps.filter(p=>p.sex==="F"&&p.age>=18&&p.age<=45).length,children=ps.filter(p=>p.age<15).length,couples=ps.filter(p=>p.partner).length/2,preg=ps.filter(p=>p.pregnant>0).length;
 let ratio=children/ps.length,label="Stable",color="#9ed8b2";
 if((v.foodSecurity??60)<28){label="Sous pression";color="#e0b767"}
 else if(women<Math.max(1,ps.length*.07)){label="Fragile";color="#e28772"}
 else if(ratio<.13&&preg<Math.max(1,women*.05)){label="Vieillissante";color="#e0b767"}
 else if(ratio>.27||preg>Math.max(1,women*.12)){label="En croissance";color="#83dfae"}
 el.textContent=`${label} · ${preg} grossesse${preg>1?"s":""}`;el.style.color=color;
}


function governmentForEra(v){let e=eraIndex(v);if(e===0)return "Tribu";if(e===1)return "Cité-État";if(e<=2)return v.doctrine==="militarist"?"Monarchie":"Monarchie";if(e===3)return v.doctrine==="militarist"?"Monarchie":"République";return "Fédération"}
function leaderRole(v){return v.government==="Tribu"?"Chef de tribu":v.government==="Cité-État"?"Chef":v.government==="Monarchie"?"Roi":v.government==="République"?"Président":"Président"}
function ensureLeader(ci,announce=false){let v=S.civs[ci],lead=v.leaderId?findPerson(v.leaderId):null;if(lead&&lead.ci===ci)return lead;let candidates=S.people.filter(p=>p.ci===ci&&p.age>=18);if(!candidates.length)return null;candidates.sort((a,b)=>(b.charisma+b.influence+iqNorm(b.iq)*28+b.loyalty*.15)-(a.charisma+a.influence+iqNorm(a.iq)*28+a.loyalty*.15));lead=candidates[0];v.leaderId=lead.id;lead.role=leaderRole(v);lead.influence=Math.max(lead.influence,78);let now=simDayIndex();v.leaderSinceDay=now;v.lastPowerChangeDay=now;v.politicalGraceUntil=Math.max(v.politicalGraceUntil||0,now+360*5);if(announce)worldEvent({type:"coup",title:`Nouveau dirigeant en ${v.name}`,text:`${pname(lead)} devient ${lead.role}.`,score:82,ci,personId:lead.id,x:lead.x,y:lead.y});return lead}
function ensureGovernments(){for(let ci=0;ci<S.civs.length;ci++){let v=S.civs[ci];v.government=v.government||governmentForEra(v);v.governmentLocked=v.governmentLocked??false;v.ideology=v.ideology||"mixed";v.policy=v.policy||"balanced";v.approval=v.approval??70;v.nextElectionYear=v.nextElectionYear||S.year+6;v.treasury=v.treasury??100;v.stock=v.stock||{food:70,water:55,wood:45,ore:15,oil:0,goods:5};v.stock.water=v.stock.water??55;v.warWeariness=v.warWeariness||0;v.leaderSinceDay=v.leaderSinceDay??simDayIndex();v.lastPowerChangeDay=v.lastPowerChangeDay??-99999;v.politicalGraceUntil=v.politicalGraceUntil??0;ensureLeader(ci,false)}}
function holdElection(ci){let v=S.civs[ci],people=S.people.filter(p=>p.ci===ci&&p.age>=24);if(people.length<2)return ensureLeader(ci);let incumbent=leaderForCiv(ci);let candidates=[...people].sort((a,b)=>(b.charisma*1.15+iqNorm(b.iq)*45+b.reputation*.4+b.influence*.65+b.loyalty*.2)-(a.charisma*1.15+iqNorm(a.iq)*45+a.reputation*.4+a.influence*.65+a.loyalty*.2)).slice(0,Math.min(5,people.length));let winner=candidates[Math.floor(Math.random()*Math.min(2,candidates.length))]||candidates[0];v.leaderId=winner.id;winner.role=leaderRole(v);winner.fame=(winner.fame||0)+12;winner.reputation=(winner.reputation||0)+15;v.nextElectionYear=S.year+Math.round(rnd(5,9));let changed=incumbent&&incumbent.id!==winner.id,now=simDayIndex();v.leaderSinceDay=now;if(changed){v.lastPowerChangeDay=now;v.politicalGraceUntil=Math.max(v.politicalGraceUntil||0,now+720)}worldEvent({type:"politics",title:changed?`Alternance politique en ${v.name}`:`Réélection en ${v.name}`,text:changed?`${pname(winner)} remporte l'élection et succède à ${pname(incumbent)}.`:`${pname(winner)} conserve la direction de ${v.name}.`,score:changed?76:60,ci,personId:winner.id,x:winner.x,y:winner.y});return winner}
function politicsTick(){if(!$('politics')?.checked||S.tick%260!==0)return;ensureGovernments();for(let ci=0;ci<S.civs.length;ci++){let v=S.civs[ci],natural=governmentForEra(v),ideo=ideologyData(v);if(!v.governmentLocked&&v.government!==natural&&eraIndex(v)!==2){v.government=natural;worldEvent({type:"politics",title:`Réforme politique en ${v.name}`,text:`Le régime devient : ${natural}.`,score:76,ci,personId:leaderForCiv(ci)?.id})}let ps=S.people.filter(p=>p.ci===ci),avgMood=ps.length?ps.reduce((a,p)=>a+p.mood,0)/ps.length:50,pros=S.cities.filter(c=>c.ci===ci).reduce((a,c)=>a+c.prosperity,0)/Math.max(1,S.cities.filter(c=>c.ci===ci).length);v.warWeariness=clamp((v.warWeariness||0)+(civAtWar(ci)?.35:-.18),0,100);let coins=ps.map(p=>p.coins||0),avgCoins=coins.length?coins.reduce((a,b)=>a+b,0)/coins.length:0,inequality=coins.length?coins.reduce((n,x)=>n+Math.abs(x-avgCoins),0)/(coins.length*Math.max(1,avgCoins)):0,edu=ps.length?ps.reduce((n,p)=>n+(p.education||0),0)/ps.length:50,ideologyMood=ideo.approval;if(v.ideology==="capitalist")ideologyMood+=clamp((pros-50)*.08-inequality*6,-6,6);if(v.ideology==="socialist"||v.ideology==="communist")ideologyMood+=clamp(((v.foodSecurity||50)-50)*.06+((v.waterSecurity||50)-50)*.04,-6,6);if(v.ideology==="technocratic")ideologyMood+=clamp((edu-50)*.08,-5,5);v.stability=clamp((v.stability??70)+ideo.stability*.015,0,100);v.approval=clamp(avgMood*.42+(v.stability??70)*.32+pros*.20-v.warWeariness*.28+ideologyMood,0,100);if(["République","Fédération"].includes(v.government)&&S.year>=v.nextElectionYear)holdElection(ci);else ensureLeader(ci,false)}}
function policyBonus(v,k){let p=v.policy||"balanced";if(p==="welfare"&&k==="approval")return 1.18;if(p==="growth"&&k==="growth")return 1.2;if(p==="science"&&k==="science")return 1.2;if(p==="trade"&&k==="trade")return 1.22;if(p==="military"&&k==="military")return 1.2;return 1}
function cityBuildings(city){return S.buildings.filter(b=>b.cityId===city.id)}
function cityPeople(city){return S.people.filter(p=>p.cityId===city.id)}
function updateCitySpecialization(city){let bs=cityBuildings(city),count=t=>bs.filter(b=>b.type===t).length;let scores={Agricole:count("farm")*3,Industrielle:count("factory")*3+count("workshop"),Scientifique:count("lab")*4,Médicale:count("hospital")*4,Militaire:count("barracks")*4,Administrative:count("hall")*3};let best=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];city.specialization=best&&best[1]>0?best[0]:city.population>80?"Urbaine":"Village"}
function aggregateCivStock(ci){let cities=S.cities.filter(c=>c.ci===ci),tot={food:0,water:0,wood:0,ore:0,oil:0,goods:0};for(const city of cities)for(const k in tot)tot[k]+=city.stock[k]||0;S.civs[ci].stock=tot;return tot}
function waterAccessAt(x,y){
 let q=terrainAt(x,y),base=(q?.m??.45)*.62;if(q?.type==="swamp")base+=.28;if(q?.type==="forest")base+=.08;if(q?.type==="desert")base-=.25;if(q?.type==="tundra"||q?.type==="snow")base+=.08;
 let best=1e9;for(const river of S.rivers||[])for(let i=0;i<river.length;i+=Math.max(1,Math.floor(river.length/18))){let p=river[i],d=(p.x-x)**2+(p.y-y)**2;if(d<best)best=d}if(best<420*420)base+=.32*(1-Math.sqrt(best)/420);
 return clamp(base,0,1)
}
function environmentProfile(type){return ({forest:{strength:.05,stress:-.05,health:.03,water:.008},mountain:{strength:.07,courage:.06,stress:.02,water:.015},desert:{strength:.025,courage:.05,stress:.055,water:.032},savanna:{strength:.035,courage:.02,stress:.005,water:.018},swamp:{strength:.01,courage:.02,stress:.025,health:-.035,water:.006},tundra:{strength:.035,courage:.06,stress:.035,water:.017},snow:{strength:.02,courage:.05,stress:.05,water:.018},plains:{strength:.015,stress:-.015,health:.02,water:.012},sand:{strength:.01,stress:.015,water:.022},water:{strength:0,stress:.04,water:.004}})[type]||{strength:0,stress:0,health:0,water:.012}}

function updateCities(force=false){
 if(!$('cityEconomy')?.checked&&!force)return;if(!force&&S.tick%60!==0)return;
 let bByCity=new Map(),pByCity=new Map();
 for(const b of S.buildings){
   if(!b.cityId){let city=nearestCityXY(b.x,b.y,b.ci,950);if(city)b.cityId=city.id}
   if(b.cityId){let a=bByCity.get(b.cityId);if(!a)bByCity.set(b.cityId,a=[]);a.push(b)}
 }
 for(const p of S.people){
   let linked=findCity(p.cityId);
   if(!linked||linked.ci!==p.ci){let h=findBuilding(p.home),city=h?.cityId?findCity(h.cityId):nearestCity(p);p.cityId=city?.id||null}
   if(p.cityId){let a=pByCity.get(p.cityId);if(!a)pByCity.set(p.cityId,a=[]);a.push(p)}
 }
 for(const city of S.cities){
   let v=S.civs[city.ci],ps=pByCity.get(city.id)||[],bs=bByCity.get(city.id)||[];
   city.population=ps.length;city.influenceScale=city.influenceScale??1;city.radius=clamp((230+Math.sqrt(ps.length)*28+Math.sqrt(bs.length)*18)*city.influenceScale,190,760);
   let n=t=>bs.filter(b=>b.type===t).length;
   let ideo=ideologyData(v),waterAccess=waterAccessAt(city.x,city.y);city.stock.water=(city.stock.water||0)+(.45+waterAccess*1.9+n("farm")*.08);let waterRatio=clamp((city.stock.water||0)/Math.max(1,ps.length*.5),.35,1.2);city.stock.food+=n("farm")*(1.35+iqNorm(v.avgIQ)*.42)*crisisModifier(city.ci,"food")*waterRatio*ideo.food;
   city.stock.goods+=(n("workshop")*.36+n("factory")*.9)*ideo.industry;city.stock.ore+=n("factory")*.08*ideo.industry;city.stock.oil+=n("power")*.025;
   let need=ps.length*.055*policyBonus(v,"growth"),waterNeed=ps.length*(terrainAt(city.x,city.y)?.type==="desert"?.050:.034);city.stock.food-=need;city.stock.water=(city.stock.water||0)-waterNeed;if(city.stock.water<0){let deficit=-city.stock.water;city.stock.water=0;for(const p of ps){p.hydration=Math.max(0,(p.hydration??80)-deficit/Math.max(1,ps.length)*11)}city.unrest=clamp(city.unrest+.55,0,100)}
   if(city.stock.food<0){let deficit=Math.abs(city.stock.food);city.stock.food=0;for(const p of ps)if(Math.random()<.08)p.hunger=Math.max(0,p.hunger-deficit/Math.max(1,ps.length)*12);city.unrest=clamp(city.unrest+.7,0,100)}
   else city.unrest=clamp(city.unrest-.08,0,100);
   city.resistance=clamp((city.resistance||0)-(.18+city.prosperity*.0015),0,100);if(city.resistance>0)city.unrest=clamp(city.unrest+city.resistance*.008,0,100);
   let industry=n("factory")+n("workshop");city.prosperity=clamp(45+Math.min(35,city.stock.goods*.08+industry*3*ideo.industry)+v.coop*.12+ideo.stability-city.unrest*.25,0,100);
   let garrison=S.armies.filter(a=>a.homeCityId===city.id&&a.kind==="garrison").reduce((n,a)=>n+a.memberIds.length,0);city.defense=clamp(8+n("barracks")*13+(city.capital?8:0)+v.disc*.15+garrison*.55,0,100);
   v.treasury+=(city.prosperity*ps.length/9000+industry*.035)*policyBonus(v,"trade")*ideo.stateIncome;updateCitySpecialization(city)
 }
 for(let ci=0;ci<S.civs.length;ci++){let cities=S.cities.filter(c=>c.ci===ci),pop=S.people.filter(p=>p.ci===ci).length,farms=S.buildings.filter(b=>b.ci===ci&&b.type==="farm").length;S.civs[ci].cities=cities.length;let stock=aggregateCivStock(ci);S.civs[ci].foodSecurity=clamp(28+stock.food/Math.max(1,pop)*16+farms*3.2,0,100);S.civs[ci].waterSecurity=clamp(22+stock.water/Math.max(1,pop)*20+cities.reduce((n,c)=>n+waterAccessAt(c.x,c.y)*8,0),0,100)}
 let sv=speedValue(),territoryCadence=sv>=50?4800:sv>=25?2400:sv>=10?1200:600,infraCadence=sv>=50?6000:sv>=25?3600:sv>=10?1800:900;
 if(force||S.tick%territoryCadence===0)markTerritoryDirty();
 if(force||S.tick%infraCadence===0){rebuildRoads();if(typeof rebuildTradeRoutes==="function")rebuildTradeRoutes()}
}
function maybeFoundCity(ci){let v=S.civs[ci],cities=S.cities.filter(c=>c.ci===ci),pop=S.people.filter(p=>p.ci===ci).length;if(pop<cities.length*95+75||v.treasury<55||cities.length>=10)return;if(Math.random()>.045)return;let best=null;for(let tries=0;tries<30;tries++){let [x,y]=landPoint(ci);let near=nearestCityXY(x,y,ci);let dist=near?Math.hypot(x-near.x,y-near.y):1e9;if(dist>850){best=[x,y];break}}if(!best)return;let city=createCity(ci,best[0],best[1],null,false);addBuilding(ci,eraIndex(v)>=2?"hall":"hut",city.x,city.y,"Centre de "+city.name,city.id);addBuilding(ci,"farm",city.x+rnd(-110,110),city.y+rnd(-110,110),null,city.id);for(let h=0;h<3;h++)addBuilding(ci,"hut",city.x+rnd(-100,100),city.y+rnd(-100,100),null,city.id);v.treasury-=50;markTerritoryDirty();rebuildRoads();worldEvent({type:"city",title:`Fondation de ${city.name}`,text:`${v.name} fonde une nouvelle ville afin d'étendre son territoire.`,score:79,ci,x:city.x,y:city.y,personId:leaderForCiv(ci)?.id})}
function rebuildRoads(){S.roads=[];for(const city of S.cities){let bs=cityBuildings(city).sort((a,b)=>Math.hypot(a.x-city.x,a.y-city.y)-Math.hypot(b.x-city.x,b.y-city.y)).slice(0,28);for(const b of bs)S.roads.push({ci:city.ci,cityId:city.id,x1:city.x,y1:city.y,x2:b.x,y2:b.y,kind:"local"});let others=S.cities.filter(q=>q.ci===city.ci&&q.id!==city.id).sort((a,b)=>Math.hypot(a.x-city.x,a.y-city.y)-Math.hypot(b.x-city.x,b.y-city.y)).slice(0,2);for(const q of others)if(city.id<q.id)S.roads.push({ci:city.ci,cityId:city.id,x1:city.x,y1:city.y,x2:q.x,y2:q.y,kind:"regional"})}}

function relationValue(a,b){return S.civs[a]?.relations?.[String(b)]??S.civs[b]?.relations?.[String(a)]??0}
function rebuildTradeRoutes(){
 S.tradeRoutes=S.tradeRoutes||[];let candidates=[];
 for(let i=0;i<S.cities.length;i++)for(let j=i+1;j<S.cities.length;j++){
   let a=S.cities[i],b=S.cities[j],same=a.ci===b.ci,war=!same&&areAtWar(a.ci,b.ci),rel=same?70:relationValue(a.ci,b.ci);
   if(war||(!same&&rel<18))continue;
   let d=Math.hypot(a.x-b.x,a.y-b.y);if(d>W*.48)continue;
   let complement=a.specialization!==b.specialization?18:0,score=(a.prosperity+b.prosperity)+rel*.55+complement-d/75;
   if(score>15)candidates.push({a:a.id,b:b.id,ciA:a.ci,ciB:b.ci,score,flow:clamp(1.2+(a.prosperity+b.prosperity)/55+Math.max(0,rel)/45,1,7)});
 }
 candidates.sort((a,b)=>b.score-a.score);let degree=new Map(),chosen=[];
 for(const r of candidates){if((degree.get(r.a)||0)>=3||(degree.get(r.b)||0)>=3)continue;chosen.push(r);degree.set(r.a,(degree.get(r.a)||0)+1);degree.set(r.b,(degree.get(r.b)||0)+1);if(chosen.length>=30)break}
 S.tradeRoutes=chosen;
}
function updateTradeRoutes(){
 if(!$("trade")?.checked)return;let sv=speedValue(),rebuildEvery=sv>=50?9000:sv>=25?5400:sv>=10?2700:1350;if(S.tick%rebuildEvery===0)rebuildTradeRoutes();if(S.tick%180!==0)return;
 for(const r of S.tradeRoutes||[]){
   let a=findCity(r.a),b=findCity(r.b);if(!a||!b||areAtWar(a.ci,b.ci))continue;let flow=r.flow||1.5;
   for(const k of ["food","water","goods"]){let delta=(a.stock[k]||0)-(b.stock[k]||0);if(Math.abs(delta)>8){let q=Math.min(Math.abs(delta)*.06,flow*1.5);if(delta>0){a.stock[k]-=q;b.stock[k]+=q}else{b.stock[k]-=q;a.stock[k]+=q}}}
   S.civs[a.ci].treasury+=(a.ci===b.ci?.025:.065)*flow;S.civs[b.ci].treasury+=(a.ci===b.ci?.025:.065)*flow;
   if(a.ci!==b.ci){let rel=relationValue(a.ci,b.ci);rel=clamp(rel+.08,-100,100);S.civs[a.ci].relations[String(b.ci)]=rel;S.civs[b.ci].relations[String(a.ci)]=rel}
 }
}
function drawTradeRoutes(){
 if(!$("showTradeRoutes")?.checked)return;let vb=visibleBounds(),phase=(S.tick%120)/120;ctx.save();ctx.lineCap="round";
 for(const r of S.tradeRoutes||[]){
   let a=findCity(r.a),b=findCity(r.b);if(!a||!b)continue;if(Math.max(a.x,b.x)<vb.l||Math.min(a.x,b.x)>vb.r||Math.max(a.y,b.y)<vb.t||Math.min(a.y,b.y)>vb.b)continue;
   let mx=(a.x+b.x)/2,my=(a.y+b.y)/2-Math.min(180,Math.abs(a.x-b.x)*.08);
   ctx.strokeStyle=a.ci===b.ci?"rgba(95,184,130,.28)":"rgba(88,222,151,.58)";ctx.lineWidth=(a.ci===b.ci?2.2:3.1)/Math.max(.65,camera.zoom);
   ctx.setLineDash([10/camera.zoom,8/camera.zoom]);ctx.lineDashOffset=-phase*36/camera.zoom;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke()
 }
 ctx.setLineDash([]);ctx.restore()
}

function enemyCityFor(ci){
 let enemies=S.cities.filter(c=>areAtWar(ci,c.ci));if(!enemies.length)return null,home=S.cities.find(c=>c.ci===ci&&c.capital)||S.cities.find(c=>c.ci===ci),wars=S.wars.filter(w=>w.a===ci||w.b===ci),targets=wars.map(w=>(S.strategicZones||[]).find(z=>z.id===w.targetZoneId)).filter(Boolean);
 return [...enemies].sort((a,b)=>{
   let ta=targets.length?Math.min(...targets.map(z=>Math.hypot(a.x-z.x,a.y-z.y))):home?Math.hypot(a.x-home.x,a.y-home.y):0;
   let tb=targets.length?Math.min(...targets.map(z=>Math.hypot(b.x-z.x,b.y-z.y))):home?Math.hypot(b.x-home.x,b.y-home.y):0;
   let va=(a.prosperity||0)+(a.stock?.goods||0)*.08+(a.capital?25:0),vb=(b.prosperity||0)+(b.stock?.goods||0)*.08+(b.capital?25:0);return (ta-va*4)-(tb-vb*4)
 })[0]
}
function updateArmies(){
 if(!$('armyAI')?.checked||S.tick%120!==0)return;let newArmies=[];
 for(let ci=0;ci<S.civs.length;ci++){
   let war=S.wars.find(w=>w.a===ci||w.b===ci),zone=(S.strategicZones||[]).find(z=>z.id===war?.targetZoneId),target=enemyCityFor(ci),cities=S.cities.filter(c=>c.ci===ci);
   for(const city of cities){
     let troops=S.people.filter(p=>p.ci===ci&&p.cityId===city.id&&/Guerrier|Soldat|Chevalier|Pilote/.test(p.role));if(!troops.length)continue;
     troops.sort((a,b)=>(b.courage+b.strength+b.loyalty)-(a.courage+a.strength+a.loyalty));let reserveN=war?Math.max(2,Math.ceil(troops.length*.38)):troops.length,reserve=troops.slice(0,reserveN),expedition=war?troops.slice(reserveN):[];
     if(reserve.length){let commander=reserve[0],old=S.armies.find(a=>a.ci===ci&&a.homeCityId===city.id&&a.kind==="garrison"),army={id:old?.id||idSeq++,kind:"garrison",slot:0,ci,homeCityId:city.id,memberIds:reserve.map(p=>p.id),commanderId:commander.id,mission:`Garnison de ${city.name}`,targetCityId:null,targetZoneId:null,morale:clamp(reserve.reduce((a,p)=>a+p.courage+p.mood,0)/(reserve.length*2)-(S.civs[ci].warWeariness||0)*.18,8,100)};newArmies.push(army);for(const p of reserve)p.armyId=army.id}
     if(expedition.length){let commander=expedition[0],old=S.armies.find(a=>a.ci===ci&&a.homeCityId===city.id&&a.kind==="field"),zoneActive=zone&&zone.owner!==ci,army={id:old?.id||idSeq++,kind:"field",slot:1,ci,homeCityId:city.id,memberIds:expedition.map(p=>p.id),commanderId:commander.id,mission:zoneActive?"Conquête stratégique":target?"Campagne":"Patrouille",targetCityId:target?.id||null,targetZoneId:zoneActive?zone.id:null,morale:clamp(expedition.reduce((a,p)=>a+p.courage+p.mood,0)/(expedition.length*2)-(S.civs[ci].warWeariness||0)*.27,5,100)};newArmies.push(army);for(const p of expedition)p.armyId=army.id}
   }
   let unassigned=S.people.filter(p=>p.ci===ci&&!p.cityId&&/Guerrier|Soldat|Chevalier|Pilote/.test(p.role));if(unassigned.length){let home=cities.find(c=>c.capital)||cities[0],commander=unassigned[0],army={id:idSeq++,kind:"field",slot:9,ci,homeCityId:home?.id||null,memberIds:unassigned.map(p=>p.id),commanderId:commander.id,mission:target?"Campagne":"Défense nationale",targetCityId:target?.id||null,targetZoneId:zone&&zone.owner!==ci?zone.id:null,morale:70};newArmies.push(army);for(const p of unassigned)p.armyId=army.id}
 }
 S.armies=newArmies;processCityOccupation()
}
function armyForPerson(p){return p.armyId?S.armies.find(a=>a.id===p.armyId):null}

function handleCityCapture(city,oldCi,newCi){
 let nearby=S.people.filter(p=>p.cityId===city.id&&Math.hypot(p.x-city.x,p.y-city.y)<city.radius*1.2);
 let refuge=S.cities.filter(c=>c.ci===oldCi&&c.id!==city.id).sort((a,b)=>Math.hypot(a.x-city.x,a.y-city.y)-Math.hypot(b.x-city.x,b.y-city.y))[0];
 let assimilated=0,refugees=0;
 for(const p of nearby){
   let stay=!refuge||Math.random()<clamp((65-p.loyalty)/90+.28,.16,.72),oldHome=findBuilding(p.home);
   if(oldHome)oldHome.residents=oldHome.residents.filter(id=>id!==p.id);p.home=null;p.armyId=null;
   if(stay){p.ci=newCi;p.cityId=city.id;p.clothes=S.civs[newCi].color;p.stress=clamp((p.stress||20)+28,0,100);assimilated++;addPersonEvent(p,"Changement de souveraineté",`${city.name} passe sous le contrôle de ${S.civs[newCi].name}.`,72,["city","war"])}
   else{p.cityId=refuge.id;p.x=refuge.x+rnd(-120,120);p.y=refuge.y+rnd(-120,120);p.stress=clamp((p.stress||20)+35,0,100);refugees++;addPersonEvent(p,"Exil",`${pname(p)} fuit la prise de ${city.name} et rejoint ${refuge.name}.`,76,["migration","war"])}
 }
 city.originalCi=city.originalCi??oldCi;city.resistance=clamp(42+refugees*1.5+(city.originalCi!==newCi?18:0),0,100);
 assignHomes(newCi);if(refuge)assignHomes(oldCi);SP.last=-1;return {assimilated,refugees}
}

function processCityOccupation(){if(spatialNeedsRefresh())rebuildSpatial();for(const city of S.cities){let attackers=new Map(),defenders=0;for(const p of spatialCandidates(SP.people,city.x,city.y,city.radius)){if(!/Guerrier|Soldat|Chevalier|Pilote/.test(p.role))continue;let d=(p.x-city.x)**2+(p.y-city.y)**2;if(d>city.radius*city.radius)continue;if(p.ci===city.ci)defenders++;else if(areAtWar(p.ci,city.ci))attackers.set(p.ci,(attackers.get(p.ci)||0)+1)}let best=[...attackers.entries()].sort((a,b)=>b[1]-a[1])[0];if(best&&best[1]>Math.max(2,defenders*1.35)){if(city.occupation.ci!==best[0])city.occupation={ci:best[0],progress:0};city.occupation.progress+=.16*(best[1]/Math.max(1,defenders+best[1]));if(city.occupation.progress>=1){let old=city.ci,next=best[0];city.ci=next;city.occupation={ci:null,progress:0};for(const b of cityBuildings(city))b.ci=next;let shift=handleCityCapture(city,old,next);markTerritoryDirty();let v=S.civs[next];worldEvent({type:"city",title:`Prise de ${city.name}`,text:`${v.name} capture ${city.name}. ${shift.refugees} habitants fuient et ${shift.assimilated} restent sous la nouvelle souveraineté.`,score:94,ci:next,x:city.x,y:city.y,personId:leaderForCiv(next)?.id});rebuildRoads();rebuildTradeRoutes()}}else city.occupation.progress=Math.max(0,(city.occupation.progress||0)-.04)}}

function collectNearbyResource(p){if(spatialNeedsRefresh())rebuildSpatial();let best=null,bestD=170;for(const r of spatialCandidates(SP.res,p.x,p.y,22)){if(r._dead)continue;let z=(r.x-p.x)**2+(r.y-p.y)**2;if(z<bestD){bestD=z;best=r}}if(!best)return false;let i=S.res.indexOf(best);if(i<0)return false;best._dead=true;let city=cityForPerson(p),v=S.civs[p.ci];if(best.type==="food")p.hunger=Math.min(100,p.hunger+30);if(best.type==="water")p.hydration=Math.min(100,(p.hydration??70)+48);if(city){if(best.type==="food")city.stock.food+=5;else if(best.type==="water")city.stock.water=(city.stock.water||0)+6;else if(best.type==="wood")city.stock.wood+=4;else if(best.type==="ore")city.stock.ore+=3;else if(best.type==="oil")city.stock.oil+=2}p.coins=(p.coins||0)+((best.type==="ore"||best.type==="oil")?2:1);v.wealth+=((best.type==="ore"||best.type==="oil")?1:.2)*civStyleBonus(v,"wealth");S.res.splice(i,1);return true}
function detailStride(){if(story.cinematic)return 1;let mode=$("performanceMode")?.value||"auto",s=speedValue(),pop=S?.people?.length||0;if(mode==="exact")return 1;if(mode==="performance"){if(s>=100)return pop>2500?20:pop>1000?15:10;if(s>=50)return pop>2500?12:pop>1000?8:5;if(s>=25)return pop>1800?8:4;return s>=10?2:1}if(s>=100)return pop>2500?15:pop>1000?10:5;if(s>=50)return pop>2500?10:pop>1000?6:4;if(s>=25)return pop>2000?5:2;return 1}
function nearestBuilding(p,type=null,range=1e9){
 if(spatialNeedsRefresh())rebuildSpatial();
 let maxR=Math.min(range,2100),q=null,d=maxR*maxR;
 for(let radius=360;radius<=maxR&&!q;radius+=360){
   for(const b of spatialCandidates(SP.buildings,p.x,p.y,radius)){if(b.ci!==p.ci||(type&&b.type!==type))continue;let z=(b.x-p.x)**2+(b.y-p.y)**2;if(z<d){d=z;q=b}}
 }
 return q
}
function updateAgentIntent(p){
 if(!$("agentAI")?.checked)return null;
 let v=S.civs[p.ci],goal=p.lifeGoal||"peace",scores=[];
 scores.push(["food",(100-p.hunger)*1.35]);
 scores.push(["home",(!p.home?42:0)+(p.age<12?25:0)]);
 scores.push(["health",(100-p.hp)*1.2+(p.sick?65:0)]);
 scores.push(["family",goal==="family"?34:0]);
 scores.push(["knowledge",goal==="knowledge"?35+p.curiosity*.25:0]);
 scores.push(["wealth",goal==="wealth"?38:0]);
 scores.push(["power",goal==="power"?p.ambition*.48:0]);
 scores.push(["explore",goal==="explore"?32+p.curiosity*.18:0]);
 scores.push(["protect",goal==="protect"?(civAtWar(p.ci)?55:18):0]);
 scores.push(["peace",goal==="peace"?(civAtWar(p.ci)?45:10):0]);
 scores.sort((a,b)=>b[1]-a[1]);let intent=scores[0][0];p.currentIntent=intent;
 if(intent==="health"){let h=nearestBuilding(p,"hospital",1100);if(h)return h}
 if(intent==="home"&&p.home)return findBuilding(p.home)
 if(intent==="knowledge"){let b=nearestBuilding(p,"lab",1500);if(b)return b}
 if(intent==="wealth"){let r=nearestRes(p,"ore")||nearestRes(p,"oil");if(r)return r}
 if(intent==="power"){let lead=leaderForCiv(p.ci);if(lead&&lead!==p)return lead}
 if(intent==="explore"){return {x:clamp(p.x+rnd(-850,850),40,W-40),y:clamp(p.y+rnd(-850,850),70,H-40)}}
 if(intent==="protect"&&civAtWar(p.ci))return enemy(p,800)
 return null
}
function buildingEffects(){
 if(!$("functionalBuildings")?.checked||S.tick%30!==0)return;
 for(let ci=0;ci<S.civs.length;ci++){
  let v=S.civs[ci],bs=S.buildings.filter(b=>b.ci===ci),ps=S.people.filter(p=>p.ci===ci);
  let farms=bs.filter(b=>b.type==="farm").length,hosp=bs.filter(b=>b.type==="hospital").length,labs=bs.filter(b=>b.type==="lab").length;
  let barr=bs.filter(b=>b.type==="barracks").length,fact=bs.filter(b=>b.type==="factory").length,pow=bs.filter(b=>b.type==="power").length,works=bs.filter(b=>b.type==="workshop").length;
  v.foodSecurity=clamp(48+farms*7-ps.length/28+(v.style==="nature"?12:0),0,100);
  v.stability=clamp((v.stability??70)+(v.foodSecurity<25?-.18:.025)+(civAtWar(ci)?-.06:.02),0,100);
  v.science+=labs*.018*(.65+iqNorm(v.avgIQ)*.75)*policyBonus(v,"science")*ideologyMultiplier(v,"science");
  v.military+=barr*.006*policyBonus(v,"military")*(v.ideology==="communist"?1.06:1);
  v.wealth+=(fact*.012+works*.004)*(pow?1.25:1)*civStyleBonus(v,"wealth")*ideologyMultiplier(v,"industry");
  if(hosp&&S.tick%90===0){
   let sick=ps.filter(p=>p.sick).sort((a,b)=>a.hp-b.hp).slice(0,hosp*2);
   for(const p of sick){if(Math.random()<.32){p.sick=false;p.hp=Math.min(100,p.hp+18);addPersonEvent(p,"Soigné",`${pname(p)} est soigné dans un hôpital.`,42,["health"])}}
  }
  if(farms&&S.tick%140===0){
   for(let k=0;k<Math.min(8,farms);k++){let b=pick(bs.filter(b=>b.type==="farm"));if(b)S.res.push({type:"food",x:b.x+rnd(-80,80),y:b.y+rnd(-80,80)})}
  }
 }
}
function updateStrategicAI(ci){
 let v=S.civs[ci];if(!v||!v.autonomy||v.autonomy<=0)return;
 let ps=S.people.filter(p=>p.ci===ci),bs=S.buildings.filter(b=>b.ci===ci),pop=ps.length;
 let militaryRatio=v.military/(Math.max(1,...S.civs.filter(q=>q!==v).map(q=>q.military)));
 let needs=[];
 needs.push(["nourriture",100-(v.foodSecurity??60)]);
 needs.push(["logements",Math.max(0,pop-bs.reduce((a,b)=>a+b.beds,0))*2]);
 needs.push(["science",v.doctrine==="scientific"?75:35]);
 needs.push(["armée",(civAtWar(ci)?75:20)+(v.doctrine==="militarist"?45:0)]);
 needs.push(["richesse",v.doctrine==="commercial"?75:30]);
 needs.push(["stabilité",100-(v.stability??70)]);
 needs.sort((a,b)=>b[1]-a[1]);v.intent=needs[0][0];
 if(v.intent==="science"){v.curiosity=clamp(v.curiosity+.08*v.autonomy,0,100);v.avgIQ=clamp(v.avgIQ+.004*v.autonomy,70,145)}
 if(v.intent==="armée"){v.courage=clamp(v.courage+.06*v.autonomy,0,100);v.disc=clamp(v.disc+.04*v.autonomy,0,100)}
 if(v.intent==="richesse"){v.coop=clamp(v.coop+.05*v.autonomy,0,100)}
 if(v.intent==="stabilité"){v.agg=clamp(v.agg-.05*v.autonomy,0,100)}
 if(v.doctrine==="peaceful")v.agg=clamp(v.agg-.08*v.autonomy,0,100);
 if(v.doctrine==="expansionist")v.agg=clamp(v.agg+.05*v.autonomy,0,100);
 if(v.doctrine==="scientific")v.curiosity=clamp(v.curiosity+.07*v.autonomy,0,100);
 if(v.doctrine==="commercial")v.coop=clamp(v.coop+.07*v.autonomy,0,100);
 if(v.autonomy>=1){let map={science:"science",armée:"military",richesse:"trade",stabilité:"welfare",nourriture:"growth",logements:"growth"};v.policy=map[v.intent]||v.policy||"balanced"}
}
function strategicAI(){
 if(S.tick%180!==0)return;
 for(let ci=0;ci<S.civs.length;ci++)updateStrategicAI(ci);
}

function stepP(p,logicScale=1){
 let v=S.civs[p.ci],e=eraIndex(v),terrNow=terrainAt(p.x,p.y),envNow=environmentProfile(terrNow?.type),envImpact=(+$("environmentImpact")?.value||100)/100;p.hunger-=.014*logicScale;p.hydration=clamp((p.hydration??80)-envNow.water*logicScale*envImpact,0,100);p.cool=Math.max(0,p.cool-logicScale);p.energy=clamp((p.energy??80)-.002*logicScale,0,100);p.stress=clamp((p.stress??20)+((civAtWar(p.ci)?.004:-.002)+(p.sick?.012:0))*logicScale,0,100);let g=null;
 if(S.tick%90===p.id%90)g=updateAgentIntent(p);
 if(p.rallyLeader&&p.rallyUntil>S.tick){let lead=findPerson(p.rallyLeader);if(lead)g=lead;else p.rallyLeader=null}
 if(!g&&p.age<6&&p.home){let h=findBuilding(p.home);if(h)g=h}
 else if(!g&&(p.hydration??80)<52)g=nearestRes(p,"water");else if(!g&&(p.hunger<55||/Fermier|Cueilleur/.test(p.role)))g=nearestRes(p,"food");
 else if(!g&&/Mineur|Ouvrier/.test(p.role))g=nearestRes(p,"ore");
 else if(!g&&p.partner&&$("familyLife").checked&&Math.random()<.02){let q=findPerson(p.partner);if(q)g=q}
 let army=armyForPerson(p);if(!g&&army?.kind==="garrison"&&army.homeCityId){let hc=findCity(army.homeCityId);if(hc&&Math.hypot(p.x-hc.x,p.y-hc.y)>Math.max(100,hc.radius*.48))g=hc}if(!g&&army?.targetZoneId){let z=(S.strategicZones||[]).find(q=>q.id===army.targetZoneId);if(z&&z.owner!==p.ci)g=z}if(!g&&army?.targetCityId){let tc=findCity(army.targetCityId);if(tc)g=tc}
 if(civAtWar(p.ci)&&(/Guerrier|Soldat|Chevalier|Pilote/.test(p.role)||Math.random()<p.aggression/400))g=enemy(p,350+p.courage*2)||g;
 if(g){let dx=g.x-p.x,dy=g.y-p.y,m=Math.hypot(dx,dy)||1;p.vx+=dx/m*.08;p.vy+=dy/m*.08}
 p.vx+=rnd(-.07,.07);p.vy+=rnd(-.07,.07);let terr=terrainAt(p.x,p.y).type,slow=terr==="forest"?.8:terr==="mountain"?.55:terr==="water"?.32:1;if(S.weather==="Tempête")slow*=.7;
 let sp=(.62+v.disc/150+p.strength/350)*slow,m=Math.hypot(p.vx,p.vy)||1;if(m>sp){p.vx=p.vx/m*sp;p.vy=p.vy/m*sp}
 let moveScale=Math.min(logicScale,3),nx=clamp(p.x+p.vx*moveScale,8,W-8),ny=clamp(p.y+p.vy*moveScale,55,H-8);if(blocked(p.x,p.y,nx,ny)){p.vx*=-1;p.vy*=-1;nx=p.x;ny=p.y}p.x=nx;p.y=ny;
 collectNearbyResource(p)
 if(p.hunger<=0)p.hp-=.11*logicScale;if((p.hydration??80)<=0)p.hp-=.18*logicScale;if((p.hydration??80)<28)p.stress=clamp(p.stress+.025*logicScale,0,100);if(p.sick)p.hp-=.012*logicScale;if(S.weather==="Tempête"&&Math.random()<.00025*logicScale)p.hp-=4;
 p.mood=clamp(p.mood+((p.hunger>70?.004:-.006)-(p.stress??0)*.00005)*logicScale,1,100);
 if(civAtWar(p.ci)&&p.cool===0){let en=enemy(p,24);if(en){let wp=weapons.filter(w=>w.era<=e).slice(-1)[0],power=(wp?.power||1)*(0.7+p.strength/100)+v.military/350;en.hp-=power*rnd(.65,1.2);p.cool=11;if(en.hp<=0)v.kills++}}
 let nowDay=simDayIndex();
 if(nowDay>=(p.nextFamilyCheckDay??0)){let interval=Math.floor(rnd(24,42));tryCouple(p);tryPregnancy(p,interval);p.nextFamilyCheckDay=nowDay+interval}
 if(p.pregnant>0){let daysPerDetailedStep=(story.cinematic?.ev?0.000001:Math.max(1/1440,timeScaleValue()/1440))*logicScale;p.pregnant-=daysPerDetailedStep;if(p.pregnant<=0)birth(p)}
}
function canPay(city,cost){return Object.entries(cost||{}).every(([k,n])=>(city.stock[k]||0)>=n)}
function payCost(city,cost){for(const [k,n] of Object.entries(cost||{}))city.stock[k]=Math.max(0,(city.stock[k]||0)-n)}
function maybeBuild(ci){
 let v=S.civs[ci],e=eraIndex(v);if(!$("autoBuild").checked)return;let ps=S.people.filter(p=>p.ci===ci),cities=S.cities.filter(c=>c.ci===ci);if(ps.length<12||!cities.length)return;
 let homeless=ps.filter(p=>!p.home).length,needHome=homeless>3||ps.length>S.buildings.filter(b=>b.ci===ci).reduce((a,b)=>a+b.beds,0)*.9;
 if(Math.random()<.045*(.4+v.coop/100)){let city=[...cities].sort((a,b)=>(b.unrest+a.population/200)-(a.unrest+b.population/200))[0]||pick(cities);let avail=buildings.filter(b=>b.era<=e&&(needHome?b.beds>0:true));if(v.intent==="nourriture")avail=avail.filter(b=>b.type==="farm").concat(avail);if(v.intent==="science")avail=avail.filter(b=>b.type==="lab").concat(avail);if(v.intent==="armée")avail=avail.filter(b=>b.type==="barracks").concat(avail);let def=pick(avail),cost=BUILD_COSTS[def.type]||{};if(!canPay(city,cost)&&v.treasury<18)return;let angle=rnd(0,Math.PI*2),rad=rnd(90,Math.max(150,city.radius*.72)),px=clamp(city.x+Math.cos(angle)*rad,40,W-40),py=clamp(city.y+Math.sin(angle)*rad,60,H-40);if(terrainAt(px,py).type==="water")return;addBuilding(ci,def.type,px,py,null,city.id);if(canPay(city,cost))payCost(city,cost);else v.treasury-=18;assignHomes(ci);if(S.tick%600===0)rebuildRoads()}
 if(S.tick%500===0)maybeFoundCity(ci)
}
function develop(){
 for(let i=0;i<S.civs.length;i++){let v=S.civs[i],ps=S.people.filter(p=>p.ci===i),sch=ps.filter(p=>/Scientifique|Scribe/.test(p.role)).length,sold=ps.filter(p=>/Guerrier|Soldat|Chevalier|Pilote/.test(p.role)).length;
  let prev=eraIndex(v),avgInt=ps.length?ps.reduce((a,p)=>a+p.iq,0)/ps.length:v.avgIQ;
  v.science+=iqNorm(avgInt)*(v.curiosity/100)*(.38+sch*.025)*civStyleBonus(v,"science")*policyBonus(v,"science")*ideologyMultiplier(v,"science")*(.7+(v.stability??70)/230);v.tech+=v.science/8500*(.55+iqNorm(avgInt)*.65);v.military+=((v.agg/100)*(.018+sold*.003)+v.tech/50000)*civStyleBonus(v,"military")*policyBonus(v,"military");
  for(const [name,cost] of techs)if(v.science>=cost&&!v.discoveries.includes(name)){v.discoveries.push(name);let lead=leaderForCiv(i);worldEvent({type:"tech",title:`Découverte : ${name}`,text:`${v.name} maîtrise désormais ${name}.`,score:name==="Énergie atomique"?92:62+Math.min(18,cost/250),ci:i,personId:lead?.id,x:lead?.x,y:lead?.y})}
  let ne=eraIndex(v);if(ne>prev){let lead=leaderForCiv(i);startEraTransition(i,ne);worldEvent({type:"era",title:`${v.name} entre dans l’ère ${eras[ne].name}`,text:`Architecture, équipements et vêtements évoluent : ${v.name} entre dans une nouvelle époque.`,score:92,ci:i,personId:lead?.id,x:lead?.x,y:lead?.y});showToast(`${eras[ne].icon} ${v.name} : nouvelle époque`);for(const p of ps){p.role=roleFor(v);if(p.outfitStyle==="auto")p.outfitAccent=pick(["#d9c27a","#d8e1e5","#8fb7c5","#a66b58"])}}
  maybeBuild(i);
 }
}
function weather(){if(Math.random()*100>+$("weatherRate").value)return;S.weather=pick(S.season===3?["Clair","Neige","Neige","Tempête"]:["Clair","Clair","Pluie","Tempête"])}

function populationOf(ci){return S.people.filter(p=>p.ci===ci)}
function avgCityUnrest(ci){let a=S.cities.filter(c=>c.ci===ci);return a.length?a.reduce((n,c)=>n+(c.unrest||0),0)/a.length:0}
function politicalStress(ci){let v=S.civs[ci],ps=populationOf(ci),mood=ps.length?ps.reduce((a,p)=>a+p.mood,0)/ps.length:55,unrest=avgCityUnrest(ci),lead=leaderForCiv(ci),leadership=lead?(lead.charisma*.45+lead.influence*.35+lead.loyalty*.2):45;return clamp((100-(v.stability??70))*.28+(100-(v.approval??65))*.27+(v.warWeariness||0)*.18+unrest*.18+(100-(v.foodSecurity??65))*.16+(100-mood)*.12+(100-leadership)*.08,0,100)}
function yearsSincePowerChange(v){return (simDayIndex()-(v.lastPowerChangeDay??-99999))/360}
function activeCrisis(type,ci){return (S.crises||[]).find(c=>c.type===type&&c.ci===ci)}
function beginCrisis(type,ci,duration,severity){S.crises=S.crises||[];if(activeCrisis(type,ci))return false;S.crises.push({id:idSeq++,type,ci,startDay:simDayIndex(),endDay:simDayIndex()+duration,severity,lastPulseDay:simDayIndex()});return true}
function crisisModifier(ci,kind){let m=1;for(const q of S.crises||[])if(q.ci===ci){if(kind==="food"&&q.type==="drought")m*=.58;if(kind==="food"&&q.type==="famine")m*=.72}return m}
function updateCrises(){let day=simDayIndex();if(story.lastCrisisDay>=0&&day-story.lastCrisisDay<7)return;story.lastCrisisDay=day;S.crises=S.crises||[];for(let i=S.crises.length-1;i>=0;i--){let q=S.crises[i],v=S.civs[q.ci],ps=populationOf(q.ci);if(!v){S.crises.splice(i,1);continue}if(day-q.lastPulseDay>=14){q.lastPulseDay=day;if(q.type==="epidemic"){let hospitals=S.buildings.filter(b=>b.ci===q.ci&&b.type==="hospital").length,sick=ps.filter(p=>p.sick),targets=ps.filter(p=>!p.sick),spread=Math.max(0,Math.round(q.severity/18-hospitals*.8));for(let k=0;k<spread&&targets.length;k++){let p=pick(targets);p.sick=true;p.stress=clamp((p.stress||20)+8,0,100)}for(const p of sick)if(Math.random()<.035+hospitals*.008)p.sick=false;q.severity=clamp(q.severity+(sick.length>ps.length*.16?1:-1)-hospitals*.15,10,100)}if(q.type==="famine"){for(const p of ps)if(Math.random()<.18){p.hunger=Math.max(0,p.hunger-rnd(5,16));p.stress=clamp((p.stress||20)+5,0,100)}for(const c of S.cities.filter(c=>c.ci===q.ci))c.unrest=clamp(c.unrest+.8,0,100);v.stability=clamp((v.stability??70)-.35,0,100)}if(q.type==="drought"){v.foodSecurity=clamp((v.foodSecurity??60)-.8,0,100);for(const c of S.cities.filter(c=>c.ci===q.ci))c.stock.food=Math.max(0,c.stock.food*.985)}}if(day>=q.endDay){S.crises.splice(i,1);let title=q.type==="epidemic"?`Épidémie maîtrisée en ${v.name}`:q.type==="famine"?`Fin de la famine en ${v.name}`:`Fin de la sécheresse en ${v.name}`;worldEvent({type:"recovery",title,text:`La crise qui touchait ${v.name} s'achève progressivement.`,score:q.severity>=75?74:66,ci:q.ci,personId:leaderForCiv(q.ci)?.id})}}}
function weightedPick(items){let total=items.reduce((a,x)=>a+Math.max(0,x.w),0);if(total<=0)return null;let r=Math.random()*total;for(const x of items){r-=Math.max(0,x.w);if(r<=0)return x.k}return items.at(-1)?.k||null}
function autoFestival(ci){let v=S.civs[ci],ps=populationOf(ci);for(const p of ps)p.mood=clamp(p.mood+rnd(3,9),1,100);v.stability=clamp((v.stability??70)+4,0,100);worldEvent({type:"world",title:`Grande célébration en ${v.name}`,text:`Une période de prospérité rassemble la population et apaise les tensions.`,score:67,ci,personId:leaderForCiv(ci)?.id});return true}
function autoGoldenAge(ci){let v=S.civs[ci];v.science+=45+iqNorm(v.avgIQ)*45;v.wealth+=25;v.stability=clamp((v.stability??70)+7,0,100);for(const c of S.cities.filter(c=>c.ci===ci))c.prosperity=clamp(c.prosperity+10,0,100);worldEvent({type:"world",title:`Âge d'or de ${v.name}`,text:`Stabilité, prospérité et savoir progressent simultanément. Les chroniqueurs parlent d'un âge d'or.`,score:84,ci,personId:leaderForCiv(ci)?.id});return true}
function autoReform(ci){let v=S.civs[ci],lead=leaderForCiv(ci),old=v.policy;v.policy=pick(["welfare","growth","science","trade","balanced"]);if(v.policy===old)v.policy="welfare";v.stability=clamp((v.stability??70)+9,0,100);v.approval=clamp((v.approval??60)+8,0,100);worldEvent({type:"politics",title:`Réformes en ${v.name}`,text:`${lead?pname(lead):"Le gouvernement"} change de cap politique pour répondre au mécontentement.`,score:73,ci,personId:lead?.id});return true}
function autoEpidemic(ci){let ps=populationOf(ci);if(!ps.length||activeCrisis("epidemic",ci))return false;let v=S.civs[ci],hosp=S.buildings.filter(b=>b.ci===ci&&b.type==="hospital").length,frac=clamp(.06+ps.length/1800-hosp*.008,.05,.18),n=Math.max(2,Math.floor(ps.length*frac));for(let i=0;i<n;i++){let p=pick(ps);if(!p.sick){p.sick=true;addPersonEvent(p,"Maladie",`${pname(p)} contracte une maladie lors d’une épidémie.`,62,["disease"])}}let severity=clamp(45+n/Math.max(1,ps.length)*180-hosp*4,30,90);beginCrisis("epidemic",ci,Math.round(rnd(150,420)),severity);let lead=leaderForCiv(ci);worldEvent({type:"disease",title:`Épidémie en ${v.name}`,text:`Une maladie commence à se propager parmi environ ${n} habitants. Son évolution dépendra notamment du système de santé.`,score:clamp(70+severity*.18,70,88),ci,personId:lead?.id,x:lead?.x,y:lead?.y});return true}
function autoFamine(ci){let ps=populationOf(ci),v=S.civs[ci];if(!ps.length||activeCrisis("famine",ci)||(v.foodSecurity??70)>42)return false;let cities=S.cities.filter(c=>c.ci===ci),cx=cities[0]?.x??ps[0].x,cy=cities[0]?.y??ps[0].y,severity=clamp(100-(v.foodSecurity??50)+avgCityUnrest(ci)*.25,45,92);beginCrisis("famine",ci,Math.round(rnd(120,360)),severity);v.stability=clamp((v.stability??70)-8,0,100);worldEvent({type:"disaster",title:`Famine en ${v.name}`,text:`La pénurie de nourriture devient une crise durable. Les réserves urbaines et la stabilité sont menacées.`,score:clamp(76+severity*.16,76,91),ci,personId:leaderForCiv(ci)?.id,x:cx,y:cy});return true}
function autoEarthquake(ci){
 let ps=populationOf(ci);if(!ps.length)return;let epic=pick(ps),rr=220+rnd(0,220),deaths=0,damaged=0;
 for(const p of ps)if((p.x-epic.x)**2+(p.y-epic.y)**2<rr*rr){let dmg=rnd(8,52);p.hp-=dmg;if(p.hp<=0)deaths++;else damaged++}
 let old=S.buildings.length;S.buildings=S.buildings.filter(b=>!((b.x-epic.x)**2+(b.y-epic.y)**2<rr*rr&&Math.random()<.32));let lost=old-S.buildings.length;
 worldEvent({type:"disaster",title:"Fort séisme",text:`Un séisme frappe ${S.civs[ci].name} : ${damaged} blessés, ${deaths} morts immédiats et ${lost} bâtiments détruits.`,score:clamp(78+deaths*2+lost*2,78,98),ci,x:epic.x,y:epic.y,personId:leaderForCiv(ci)?.id})
}
function autoWildfire(ci){
 let ps=populationOf(ci);if(!ps.length)return;let q=pick(ps),rr=260,deaths=0;
 for(const p of ps)if((p.x-q.x)**2+(p.y-q.y)**2<rr*rr){p.hp-=rnd(0,28);if(p.hp<=0)deaths++}
 let old=S.buildings.length;S.buildings=S.buildings.filter(b=>!((b.x-q.x)**2+(b.y-q.y)**2<rr*rr&&Math.random()<.2));
 worldEvent({type:"disaster",title:"Grand incendie",text:`Un incendie se propage près d’une zone habitée de ${S.civs[ci].name}. ${old-S.buildings.length} bâtiments sont perdus.`,score:clamp(72+(old-S.buildings.length)*3+deaths*3,72,94),ci,x:q.x,y:q.y,personId:leaderForCiv(ci)?.id})
}
function autoCoup(ci){let ps=populationOf(ci);if(ps.length<18)return false;let v=S.civs[ci],oldLead=leaderForCiv(ci);if(!oldLead)return false;let now=simDayIndex(),stress=politicalStress(ci),minYears=v.government==="Tribu"?8:6;if(now<(v.politicalGraceUntil||0)||yearsSincePowerChange(v)<minYears||stress<68)return false;let challengers=ps.filter(p=>p.id!==oldLead.id&&p.age>=22&&p.ambition>=62&&p.influence>=42).sort((a,b)=>(b.ambition*1.1+b.charisma+b.influence+b.courage*.35)-(a.ambition*1.1+a.charisma+a.influence+a.courage*.35)),ch=challengers[0];if(!ch)return false;let challengerPower=ch.ambition*1.1+ch.charisma+ch.influence+ch.courage*.35,leaderPower=oldLead.charisma+oldLead.influence+oldLead.loyalty*.55+(v.disc||50)*.35,chance=clamp((stress-62)/38+(challengerPower-leaderPower)/220,.08,.82);if(Math.random()>chance){v.stability=clamp((v.stability??70)-3,0,100);addPersonEvent(ch,"Complot avorté",`${pname(ch)} échoue à rallier suffisamment de soutiens contre ${pname(oldLead)}.`,58,["politics"]);return false}oldLead.role=eraIndex(v)<=1?"Ancien chef":"Opposant";ch.role=leaderRole(v);ch.fame=(ch.fame||0)+25;ch.influence=clamp(ch.influence+20,1,100);v.leaderId=ch.id;v.leaderSinceDay=now;v.lastPowerChangeDay=now;v.politicalGraceUntil=now+360*8;v.stability=clamp(Math.max(v.stability??0,55),0,100);v.approval=clamp(Math.max(v.approval??0,52),0,100);oldLead.mood=Math.max(5,oldLead.mood-35);addPersonEvent(oldLead,"Renversé",`${pname(oldLead)} perd le pouvoir lors d’un coup d’État.`,96,["coup"]);addPersonEvent(ch,"Prise du pouvoir",`${pname(ch)} renverse ${pname(oldLead)} et devient ${ch.role}.`,98,["coup"]);worldEvent({type:"coup",title:`Coup d’État en ${v.name}`,text:`Après une crise politique profonde, ${pname(ch)} renverse ${pname(oldLead)} et prend le pouvoir.`,score:97,ci,personId:ch.id,x:ch.x,y:ch.y});return true}
function autoMigration(ci){
 let ps=populationOf(ci);if(ps.length<20||S.civs.length<2)return;let other=(ci+1+Math.floor(Math.random()*(S.civs.length-1)))%S.civs.length,n=Math.min(Math.floor(ps.length*.06),18);if(n<2)return;
 let movers=[...ps].sort((a,b)=>a.mood-b.mood).slice(0,n);for(const p of movers){p.ci=other;p.clothes=S.civs[other].color;p.home=null;p.cityId=null;p.armyId=null;addPersonEvent(p,"Migration",`${pname(p)} quitte ${S.civs[ci].name} pour ${S.civs[other].name}.`,64,["migration"])}
 assignHomes(other);worldEvent({type:"migration",title:"Vague de migration",text:`${n} habitants quittent ${S.civs[ci].name} pour rejoindre ${S.civs[other].name}.`,score:64+n,ci:other,personId:leaderForCiv(other)?.id})
}

function autoFlood(ci){
 let ps=populationOf(ci);if(!ps.length)return;let q=pick(ps),rr=330,injured=0;
 for(const p of ps)if((p.x-q.x)**2+(p.y-q.y)**2<rr*rr){p.hp-=rnd(2,24);p.stress=clamp((p.stress||20)+25,0,100);injured++}
 let old=S.buildings.length;S.buildings=S.buildings.filter(b=>!((b.x-q.x)**2+(b.y-q.y)**2<rr*rr&&Math.random()<.13));
 worldEvent({type:"disaster",title:"Inondations majeures",text:`Des pluies exceptionnelles inondent ${S.civs[ci].name}. ${injured} habitants sont affectés et ${old-S.buildings.length} bâtiments sont détruits.`,score:clamp(74+injured/8,74,93),ci,x:q.x,y:q.y,personId:leaderForCiv(ci)?.id})
}
function autoDrought(ci){let v=S.civs[ci],ps=populationOf(ci);if(!ps.length||activeCrisis("drought",ci))return false;let severity=clamp(45+(+$("temperature")?.value||50)*.25-(+$("humidity")?.value||50)*.18+rnd(-8,8),35,88);beginCrisis("drought",ci,Math.round(rnd(180,540)),severity);v.foodSecurity=clamp((v.foodSecurity??60)-12,0,100);worldEvent({type:"disaster",title:`Grande sécheresse en ${v.name}`,text:`Une sécheresse durable réduit les récoltes et commence à peser sur les réserves alimentaires.`,score:clamp(74+severity*.14,74,88),ci,personId:leaderForCiv(ci)?.id});return true}
function autoRevolution(ci){let v=S.civs[ci],ps=populationOf(ci),stress=politicalStress(ci),now=simDayIndex();if(ps.length<30||stress<82||now<(v.politicalGraceUntil||0)||yearsSincePowerChange(v)<10)return false;let crowd=ps.filter(p=>p.age>=16).sort((a,b)=>(b.ambition+b.aggression+b.charisma*.5)-(a.ambition+a.aggression+a.charisma*.5)).slice(0,Math.min(28,Math.floor(ps.length*.25)));if(crowd.length<5)return false;for(const p of crowd){p.stress=clamp((p.stress||20)+25,0,100);p.rallyLeader=crowd[0]?.id;p.rallyUntil=S.tick+1100}let newLead=crowd[0];v.stability=52;v.approval=56;v.agg=clamp(v.agg-8,0,100);v.lastPowerChangeDay=now;v.leaderSinceDay=now;v.politicalGraceUntil=now+360*12;if(newLead){newLead.role=leaderRole(v);newLead.fame=(newLead.fame||0)+30;newLead.influence=96;v.leaderId=newLead.id}worldEvent({type:"coup",title:`Révolution en ${v.name}`,text:`Après des années d'instabilité et de mécontentement, une partie importante de la population renverse l'ordre établi${newLead?` sous l'impulsion de ${pname(newLead)}`:""}.`,score:99,ci,personId:newLead?.id,x:newLead?.x,y:newLead?.y});return true}
function autoDiplomacyStep(){
 if(!$("autoDiplomacy")?.checked||S.civs.length<2||S.tick%420!==0)return;
 for(let i=0;i<S.civs.length;i++)for(let j=i+1;j<S.civs.length;j++){
  let a=S.civs[i],b=S.civs[j],key=String(j),rel=a.relations?.[key];
  if(rel==null)rel=clamp(20+(a.coop+b.coop)/2-(a.agg+b.agg)/2+rnd(-20,20),-100,100);
  let drift=((a.coop+b.coop)-(a.agg+b.agg))*.002+rnd(-1.2,1.2);
  if(a.doctrine==="peaceful"||b.doctrine==="peaceful")drift+=.5;
  if(a.doctrine==="militarist"||b.doctrine==="militarist")drift-=.5;
  rel=clamp(rel+drift,-100,100);a.relations[key]=rel;b.relations[String(i)]=rel;
  if(rel>72&&eventAllowed(`alliance-${i}-${j}`,720))worldEvent({type:"peace",title:"Alliance diplomatique",text:`${a.name} et ${b.name} concluent une alliance durable.`,score:76,ci:i,personId:leaderForCiv(i)?.id});
  let ia=strategicInterest(i,j),ib=strategicInterest(j,i),strategicPressure=Math.max(ia.score*(a.agg/100),ib.score*(b.agg/100));
  rel=clamp(rel-strategicPressure*.008,-100,100);a.relations[key]=rel;b.relations[String(i)]=rel;
  let strategicCause=strategicPressure>24&&rel<-24&&(a.doctrine==="expansionist"||a.doctrine==="militarist"||b.doctrine==="expansionist"||b.doctrine==="militarist"||Math.max(a.agg,b.agg)>62);
  if((rel<-75||strategicCause)&&!areAtWar(i,j)&&eventAllowed(`war-${i}-${j}`,1080)){
    let attacker=ia.score*(a.agg/100)>=ib.score*(b.agg/100)?i:j,defender=attacker===i?j:i,target=attacker===i?ia.zone:ib.zone,reason=target?`Contrôle de ${strategicTypeLabel(target.type)}`:"Crise diplomatique";
    declareWar(attacker,defender,reason,target?.id||null);worldEvent({type:"war",title:target?"Guerre pour un point stratégique":"Crise diplomatique : guerre",text:target?`${S.civs[attacker].name} déclare la guerre à ${S.civs[defender].name} pour tenter de contrôler ${strategicTypeLabel(target.type).toLowerCase()} de grande valeur.`:`Les tensions entre ${a.name} et ${b.name} dégénèrent en conflit ouvert.`,score:96,ci:attacker,personId:leaderForCiv(attacker)?.id,x:target?.x,y:target?.y})
  }
  if(areAtWar(i,j)&&rel>25&&eventAllowed(`peace-${i}-${j}`,500)&&Math.random()<.25){makePeacePair(i,j);worldEvent({type:"peace",title:"Accord de paix",text:`${a.name} et ${b.name} signent un accord mettant fin à leur guerre.`,score:91,ci:i,personId:leaderForCiv(i)?.id})}
 }
}

function runAutomaticEvent(){if(!$("autoEvents")?.checked||story.replayMode||!S.civs.length)return false;let ci=Math.floor(Math.random()*S.civs.length),v=S.civs[ci],ps=populationOf(ci);if(!ps.length)return false;let sick=ps.filter(p=>p.sick).length/Math.max(1,ps.length),unrest=avgCityUnrest(ci),stress=politicalStress(ci),food=v.foodSecurity??65,stable=v.stability??70,approval=v.approval??65,war=v.warWeariness||0,temp=+$("temperature")?.value||50,humid=+$("humidity")?.value||50,summer=S.season===1;let items=[{k:"quiet",w:2.4+(stable>70?1.3:0)},{k:"epidemic",w:$("disease")?.checked&&!activeCrisis("epidemic",ci)?1+sick*15+ps.length/650:0},{k:"famine",w:!activeCrisis("famine",ci)?Math.max(0,(48-food)/7)+unrest/90:0},{k:"drought",w:!activeCrisis("drought",ci)?Math.max(.15,(temp-humid)/28)+(summer?.75:0):0},{k:"earthquake",w:.42},{k:"wildfire",w:.35+(summer?.55:0)+Math.max(0,temp-55)/90},{k:"flood",w:.25+Math.max(0,humid-55)/70+((S.weather==="Pluie"||S.weather==="Tempête")?.55:0)},{k:"storm",w:.45+(+$("weatherRate")?.value||35)/120},{k:"migration",w:Math.max(0,(55-stable)/18)+unrest/65+war/90},{k:"reform",w:stress>48&&stress<75?1.1+(75-approval)/35:0},{k:"coup",w:stress>=68&&yearsSincePowerChange(v)>=(v.government==="Tribu"?8:6)?(stress-64)/10:0},{k:"revolution",w:stress>=82&&yearsSincePowerChange(v)>=10?(stress-79)/8:0},{k:"festival",w:stable>62&&approval>52&&!civAtWar(ci)?.9:0},{k:"golden",w:stable>80&&approval>72&&food>65&&!civAtWar(ci)?.28:0}],kind=weightedPick(items);if(!kind||kind==="quiet")return false;if(kind==="epidemic")return eventAllowed(`epidemic-${ci}`,1800)&&autoEpidemic(ci);if(kind==="famine")return eventAllowed(`famine-${ci}`,1440)&&autoFamine(ci);if(kind==="drought")return eventAllowed(`drought-${ci}`,1800)&&autoDrought(ci);if(kind==="earthquake")return eventAllowed(`quake-${ci}`,2880)&&(autoEarthquake(ci),true);if(kind==="wildfire")return eventAllowed(`fire-${ci}`,1440)&&(autoWildfire(ci),true);if(kind==="flood")return eventAllowed(`flood-${ci}`,1440)&&(autoFlood(ci),true);if(kind==="migration")return eventAllowed(`migration-${ci}`,1080)&&(autoMigration(ci),true);if(kind==="reform")return eventAllowed(`reform-${ci}`,1080)&&autoReform(ci);if(kind==="coup")return eventAllowed(`coup-${ci}`,3600)&&autoCoup(ci);if(kind==="revolution")return eventAllowed(`revolution-${ci}`,5400)&&autoRevolution(ci);if(kind==="festival")return eventAllowed(`festival-${ci}`,1080)&&autoFestival(ci);if(kind==="golden")return eventAllowed(`golden-${ci}`,5400)&&autoGoldenAge(ci);if(kind==="storm"&&eventAllowed(`storm-${ci}`,900)){S.weather="Tempête";let lead=leaderForCiv(ci);worldEvent({type:"disaster",title:"Tempête exceptionnelle",text:`Une violente tempête traverse le territoire de ${v.name}, perturbant temporairement la vie quotidienne.`,score:70,ci,personId:lead?.id,x:lead?.x,y:lead?.y});return true}return false}
function scheduleNextAutomaticEvent(fromDay=simDayIndex()){let base=+$("eventFrequency")?.value||1800,jitter=rnd(.72,1.38),factor=1;if($("turboStoryGuard")?.checked){let simulatedDaysPerTick=timeScaleValue()/1440,load=speedValue()*Math.max(.02,simulatedDaysPerTick);if(load>5)factor=clamp(Math.sqrt(load/5),1,8)}story.nextAutoDay=Math.floor(fromDay+Math.max(90,base*jitter*factor))}
function processAutomaticEvents(){let d=simDayIndex();updateCrises();if(!story.nextAutoDay)scheduleNextAutomaticEvent(d);if(d>=story.nextAutoDay){runAutomaticEvent();story.lastAutoDay=d;scheduleNextAutomaticEvent(d)}}


let director={nextReal:0,target:null,until:0,kind:null};
function careerRoleFor(p,v,city=null){
 if(p.age<16)return null;let e=eraIndex(v),q=terrainAt(p.x,p.y),bs=city?cityBuildings(city):[],has=t=>bs.some(b=>b.type===t),scores=[];
 const add=(role,score,ok=true)=>{if(ok)scores.push([role,score])};let iq=p.iq||100,edu=p.education||0,str=p.strength||50,cha=p.charisma||50,cou=p.courage||50,cur=p.curiosity||50;
 add(e>=1?"Médecin":"Guérisseur",iqNorm(iq)*34+edu*.62+cha*.10+(p.lifeGoal==="knowledge"?12:0),has("hospital")||e<2,iq>=104&&edu>=52);
 add(e>=3?"Scientifique":"Scribe",iqNorm(iq)*39+edu*.66+cur*.18+(p.lifeGoal==="knowledge"?16:0),has("lab")||e<3,iq>=108&&edu>=58);
 add(e>=3?"Ingénieur":"Forgeron",iqNorm(iq)*28+edu*.48+str*.18,has("workshop")||has("factory")||e<3,iq>=100&&edu>=42);
 add(e>=2?"Marchand":"Artisan",cha*.52+edu*.18+(p.lifeGoal==="wealth"?22:0)+(city?.prosperity||45)*.12,true,p.age>=18);
 add(e>=2?"Soldat":"Guerrier",str*.43+cou*.46+p.aggression*.18+(p.lifeGoal==="protect"?18:0),true,p.age>=18);
 add("Bûcheron",str*.50+cou*.18+(q?.type==="forest"?30:0)+(p.lifeGoal==="wealth"?7:0),true,["forest","swamp"].includes(q?.type));
 add("Mineur",str*.55+cou*.22+(q?.type==="mountain"?35:0),true,q?.type==="mountain"||S.res.some(r=>r.type==="ore"&&(r.x-p.x)**2+(r.y-p.y)**2<500*500));
 add("Fermier",p.strength*.22+p.loyalty*.18+v.coop*.22+(["plains","savanna"].includes(q?.type)?30:0),true,true);
 add("Artisan",str*.24+edu*.25+cur*.16,true,true);
 if(p.lifeGoal==="power"&&p.age>=22)add(e>=4?"Politicien":"Conseiller",cha*.62+(p.influence||0)*.50+iqNorm(iq)*16,true,cha>=62);
 scores.sort((a,b)=>b[1]-a[1]);return scores[0]?.[0]||"Artisan"
}
function applyEnvironmentDevelopment(p,city,days){
 let q=terrainAt(p.x,p.y),env=environmentProfile(q?.type),envImpact=(+$("environmentImpact")?.value||100)/100,factor=days/60*envImpact,pWater=waterAccessAt(p.x,p.y);p.environmentAdapt=clamp((p.environmentAdapt||0)+.18*factor,0,100);
 p.strength=clamp(p.strength+(env.strength||0)*factor*(.5+(p.environmentAdapt||0)/130),1,100);p.courage=clamp(p.courage+(env.courage||0)*factor,1,100);p.stress=clamp(p.stress+(env.stress||0)*factor-(pWater>.55?.04*factor:0),0,100);p.hp=clamp(p.hp+(env.health||0)*factor+(pWater>.6?.03*factor:0),1,100);
 if(q?.type==="desert"&&pWater<.25)p.hydration=clamp((p.hydration??80)-1.2*factor,0,100);if(q?.type==="swamp"&&!nearestBuilding(p,"hospital",900)&&Math.random()<.002*factor)p.sick=true;
 let labs=city?cityBuildings(city).filter(b=>b.type==="lab").length:0,schoolEffect=eraIndex(S.civs[p.ci])>=1?.12:0,ideo=ideologyData(S.civs[p.ci]);p.education=clamp((p.education||0)+(schoolEffect+labs*.18+(p.lifeGoal==="knowledge"?.14:0))*factor*ideo.science,0,100);
 let targetIQ=clamp((p.baseIQ||p.iq||100)+((p.education||50)-50)*.12+labs*1.1-(p.stress||0)*.035+(p.hp-70)*.025,55,165);p.iq=clamp(lerp(p.iq||targetIQ,targetIQ,.07*factor),55,165)
}
function applyIdeologyLifeEffects(p,v,city,days){
 let ideo=v.ideology||"mixed",f=days/60,pros=city?.prosperity||45,coins=p.coins||0;
 if(ideo==="capitalist"){
   p.coins+=Math.max(0,pros-45)*.018*f*(p.lifeGoal==="wealth"?1.35:1);
   if(coins<18)p.stress=clamp(p.stress+.10*f,0,100);else if(coins>80)p.mood=clamp(p.mood+.06*f,0,100)
 }else if(ideo==="socialdem"){
   if(coins<30){p.mood=clamp(p.mood+.10*f,0,100);p.hp=clamp(p.hp+.035*f,1,100)}p.stress=clamp(p.stress-.035*f,0,100)
 }else if(ideo==="socialist"){
   if(coins<45)p.mood=clamp(p.mood+.12*f,0,100);p.loyalty=clamp(p.loyalty+.045*f,1,100)
 }else if(ideo==="communist"){
   p.loyalty=clamp(p.loyalty+.065*f,1,100);if((v.foodSecurity||50)<35)p.stress=clamp(p.stress+.09*f,0,100)
 }else if(ideo==="technocratic"){
   p.education=clamp((p.education||0)+.16*f*(.55+p.curiosity/100),0,100);if(p.iq>112)p.reputation=clamp((p.reputation||0)+.035*f,0,100)
 }else if(ideo==="green"){
   let natural=["forest","plains","savanna","swamp"].includes(terrainAt(p.x,p.y)?.type);if(natural){p.hp=clamp(p.hp+.05*f,1,100);p.stress=clamp(p.stress-.05*f,0,100)}
 }else if(ideo==="traditionalist"){
   p.loyalty=clamp(p.loyalty+.075*f,1,100);if(p.lifeGoal==="family")p.mood=clamp(p.mood+.05*f,0,100)
 }
}

function lifeDevelopment(){
 let now=simDayIndex();S.lastLifeDevelopmentDay=Number.isFinite(S.lastLifeDevelopmentDay)?S.lastLifeDevelopmentDay:now-60;let days=now-S.lastLifeDevelopmentDay;if(days<60)return;days=Math.min(days,360);S.lastLifeDevelopmentDay=now;
 for(const p of S.people){let city=cityForPerson(p),v=S.civs[p.ci],ideo=ideologyData(v);p.experience=(p.experience||0)+days/60;applyEnvironmentDevelopment(p,city,days);applyIdeologyLifeEffects(p,v,city,days);
   if(p.age>=16){let baseIncome=Math.max(.1,(city?.prosperity||45)/30)*(p.lifeGoal==="wealth"?1.25:1)*ideo.privateIncome*(days/60);p.coins=(p.coins||0)+baseIncome;if(p.coins>120)p.reputation=clamp((p.reputation||0)+.16*(days/60),0,100)}
   p.lastCareerDay=p.lastCareerDay??now-360;if(p.age>=16&&now-p.lastCareerDay>=300&&!/Président|Chef|Maire|Roi|Reine/.test(p.role)){let nr=careerRoleFor(p,v,city);p.lastCareerDay=now;if(nr&&nr!==p.role){let old=p.role,changeChance=.35+(p.lifeGoal==="knowledge"&&/Médecin|Scientifique|Ingénieur|Scribe/.test(nr)?.18:0);if(Math.random()<changeChance){p.role=nr;addPersonEvent(p,"Changement de métier",`${pname(p)} passe de ${old} à ${nr} après l'évolution de ses compétences et de son environnement.`,52,["career"])}}}
   if(city&&city.unrest>55&&p.age>=16&&Math.random()<.012*(days/60)){let dest=S.cities.filter(c=>c.ci===p.ci&&c.id!==city.id&&c.prosperity>city.prosperity+12).sort((a,b)=>b.prosperity-a.prosperity)[0];if(dest){let oldHome=findBuilding(p.home);if(oldHome)oldHome.residents=oldHome.residents.filter(id=>id!==p.id);p.home=null;p.cityId=dest.id;p.x=dest.x+rnd(-80,80);p.y=dest.y+rnd(-80,80);assignHomes(p.ci);addPersonEvent(p,"Déménagement",`${pname(p)} quitte ${city.name} pour s'installer à ${dest.name}.`,56,["migration"])}}
 }
 for(let ci=0;ci<S.civs.length;ci++)redistributeWealth(ci)
}
function founderNationName(p,city,ideology){let stem=city?.name||p.last;if(ideology==="communist")return `Union de ${stem}`;if(ideology==="socialist")return `République populaire de ${stem}`;if(ideology==="capitalist")return `République de ${stem}`;if(ideology==="traditionalist")return `Royaume de ${stem}`;if(ideology==="green")return `Confédération de ${stem}`;return `État de ${stem}`}
function founderIdeology(p,oldV){if(p.lifeGoal==="wealth")return "capitalist";if(p.lifeGoal==="knowledge")return "technocratic";if(p.lifeGoal==="peace")return Math.random()<.5?"socialdem":"green";if(p.lifeGoal==="protect")return "traditionalist";return oldV.ideology||"mixed"}
function createEmergentNation(founder,city){
 let oldCi=founder.ci,oldV=S.civs[oldCi],newCi=S.civs.length;if(newCi>=16||!city||city.capital)return false;let locals=S.people.filter(p=>p.ci===oldCi&&p.cityId===city.id),oldPop=S.people.filter(p=>p.ci===oldCi).length;if(locals.length<8||oldPop-locals.length<10)return false;
 let followChance=clamp(.28+founder.charisma/250+(founder.influence||0)/300+city.unrest/260,.35,.82),followers=locals.filter(p=>p===founder||Math.random()<followChance);if(followers.length<7)return false;
 let v=civ(newCi),ideo=founderIdeology(founder,oldV);Object.assign(v,{name:founderNationName(founder,city,ideo),color:COLORS[newCi%COLORS.length],style:oldV.style,doctrine:founder.lifeGoal==="power"?"expansionist":"adaptive",ideology:ideo,avgIQ:Math.round(followers.reduce((n,p)=>n+p.iq,0)/followers.length),agg:Math.round(followers.reduce((n,p)=>n+p.aggression,0)/followers.length),coop:Math.round(followers.reduce((n,p)=>n+p.loyalty,0)/followers.length),government:eraIndex(oldV)>=3?"République":eraIndex(oldV)>=1?"Cité-État":"Tribu",governmentLocked:true,leaderId:founder.id,founderId:founder.id,foundedYear:S.year,stability:62,approval:64,treasury:Math.max(35,oldV.treasury*.12)});S.civs.push(v);oldV.treasury=Math.max(0,oldV.treasury-v.treasury*.45);
 city.ci=newCi;city.capital=true;city.resistance=18;for(const b of S.buildings)if(b.cityId===city.id)b.ci=newCi;for(const p of followers){p.ci=newCi;p.clothes=v.color;p.armyId=null;p.loyalty=clamp(p.loyalty+8,1,100)}founder.role=leaderRole(v);founder.influence=Math.max(92,founder.influence||0);v.relations[String(oldCi)]=-72;oldV.relations[String(newCi)]=-72;assignHomes(newCi);SP.last=-1;rebuildRoads();rebuildTradeRoutes();markTerritoryDirty();if(oldV.agg>35||city.unrest>60)declareWar(oldCi,newCi,"Guerre d'indépendance");worldEvent({type:"politics",title:`Naissance de ${v.name}`,text:`${pname(founder)}, largement au-dessus de la moyenne de son ancien pays, fonde ${v.name} depuis ${city.name}. ${followers.length} habitants le suivent.`,score:99,ci:newCi,personId:founder.id,x:city.x,y:city.y});tabs();return true
}
function emergentNationStep(){
 if(!$("emergentNations")?.checked||S.civs.length>=16)return;let now=simDayIndex();S.lastNationCheckDay=Number.isFinite(S.lastNationCheckDay)?S.lastNationCheckDay:now-180;if(now-S.lastNationCheckDay<180)return;S.lastNationCheckDay=now;
 let iqGap=+$("founderThreshold")?.value||20,chaGap=+$("founderCharismaGap")?.value||14,minInf=+$("founderInfluence")?.value||82,minAmb=+$("founderAmbition")?.value||84,chanceMul=(+$("founderChance")?.value||100)/100;
 for(let ci=0;ci<S.civs.length;ci++){let v=S.civs[ci],ps=S.people.filter(p=>p.ci===ci&&p.age>=24&&p.age<=65);if(ps.length<24||now-(v.lastSecessionDay||-99999)<2880)continue;let avgIQ=ps.reduce((n,p)=>n+p.iq,0)/ps.length,avgCha=ps.reduce((n,p)=>n+p.charisma,0)/ps.length,avgInf=ps.reduce((n,p)=>n+(p.influence||0),0)/ps.length,avgAmb=ps.reduce((n,p)=>n+(p.ambition||0),0)/ps.length,cands=ps.filter(p=>p.iq>=avgIQ+iqGap&&p.charisma>=avgCha+chaGap&&p.influence>=Math.max(minInf,avgInf+16)&&p.ambition>=Math.max(minAmb,avgAmb+14)&&(p.reputation||0)>=38).map(p=>({p,city:cityForPerson(p)})).filter(q=>q.city&&!q.city.capital&&((q.city.unrest||0)>34||Math.hypot(q.city.x-(S.cities.find(c=>c.ci===ci&&c.capital)?.x||q.city.x),q.city.y-(S.cities.find(c=>c.ci===ci&&c.capital)?.y||q.city.y))>950));if(!cands.length)continue;cands.sort((a,b)=>(b.p.iq+b.p.charisma+b.p.influence+b.p.ambition)-(a.p.iq+a.p.charisma+a.p.influence+a.p.ambition));let best=cands[0];if(Math.random()<clamp((.10+best.city.unrest/260)*chanceMul,.02,.70)){v.lastSecessionDay=now;if(createEmergentNation(best.p,best.city))break}}
}

function sampleHistory(){let last=S.history?.at(-1);if(last?.year===S.year)return;S.history=S.history||[];let rec={year:S.year,civs:S.civs.map((v,i)=>({name:v.name,color:v.color,pop:S.people.filter(p=>p.ci===i).length,science:v.science,wealth:(v.treasury||0)+v.wealth,military:v.military,cities:S.cities.filter(c=>c.ci===i).length}))};S.history.push(rec);if(S.history.length>240)S.history.shift();if($('statsPanel')?.classList.contains('open'))renderStatsPanel()}
function updateDirector(){if(!$('autoDirector')?.checked||story.cinematic||story.replayMode||!document.body.classList.contains('cinema'))return;let now=Date.now();if(director.target&&now<director.until){let t=director.target;if(t.id&&findPerson(t.id))t=findPerson(t.id);camera.zoom=lerp(camera.zoom,clamp(director.kind==="city"?.58:.95,camera.minZoom,camera.maxZoom),.018);camera.x=lerp(camera.x,t.x-c.width/(2*camera.zoom),.022);camera.y=lerp(camera.y,t.y-c.height/(2*camera.zoom),.022);clampCamera();return}if(now<(director.nextReal||0))return;director.nextReal=now+11000+rnd(0,7000);let leaders=S.civs.map((v,i)=>leaderForCiv(i)).filter(Boolean),important=[...S.people].sort((a,b)=>personImportance(b)-personImportance(a)).slice(0,12),cities=[...S.cities].sort((a,b)=>(b.population+b.prosperity)-(a.population+a.prosperity)).slice(0,8);if(Math.random()<.55&&(leaders.length||important.length)){let p=pick(leaders.length?leaders:important);director.target={id:p.id,x:p.x,y:p.y};director.kind="person"}else if(cities.length){let city=pick(cities);director.target={x:city.x,y:city.y};director.kind="city"}director.until=now+8000}

function tick(){
 S.tick++;
 // Normal simulation: selected amount per tick. Cinematic: ~3–4 simulated seconds / real second at 60 FPS.
 advanceSimulationTime(story.cinematic?.ev?0.001:+$("timeScale").value);updateAgesByCalendar();
 let stride=detailStride(),detailed=S.tick%stride===0;if(detailed)for(const p of S.people)stepP(p,stride);
 let dead=detailed?S.people.filter(p=>p.hp<=0||p.age>=98):[];for(const p of dead){
  let imp=personImportance(p);if(imp>=68){S.legends=S.legends||[];S.legends.unshift({name:pname(p),role:p.role,ci:p.ci,importance:Math.round(imp),year:S.year,age:p.age});if(S.legends.length>40)S.legends.length=40}addPersonEvent(p,"Mort",`${pname(p)} meurt à ${p.age} ans.`,85,["death"]);
  if(p.partner){let q=findPerson(p.partner);if(q){q.partner=null;addPersonEvent(q,"Deuil",`${pname(p)}, son partenaire, vient de mourir.`,82,["death"])}}
  for(const id of p.children||[]){let q=findPerson(id);if(q)addPersonEvent(q,"Mort d’un parent",`${pname(p)} vient de mourir.`,80,["death"])}
  let h=findBuilding(p.home);if(h)h.residents=h.residents.filter(id=>id!==p.id);
  if(S.civs[p.ci]?.leaderId===p.id){S.civs[p.ci].leaderId=null;worldEvent({type:"death",title:`Mort du dirigeant ${pname(p)}`,text:`${pname(p)}, dirigeant de ${S.civs[p.ci]?.name||"son peuple"}, meurt à ${p.age} ans. La succession s'ouvre.`,score:96,ci:p.ci,x:p.x,y:p.y})}
  else if(imp>72)worldEvent({type:"death",title:`Mort de ${pname(p)}`,text:`${pname(p)}, ${p.role} de ${S.civs[p.ci]?.name||"son peuple"}, meurt à ${p.age} ans.`,score:clamp(74+imp*.2,74,96),ci:p.ci,x:p.x,y:p.y})
 }
 if(dead.length){let ids=new Set(dead.map(p=>p.id));S.people=S.people.filter(p=>!ids.has(p.id));SP.last=-1}
 if(S.tick%22===0)develop();
 if(Math.random()<.05&&S.res.length<2200){for(let tries=0;tries<25;tries++){let px=rnd(20,W-20),py=rnd(45,H-20),q=terrainAt(px,py);if(!q||q.type==="water"||q.type==="snow")continue;let nearWater=waterAccessAt(px,py)>.58,type=weightedResource(biomeResourceWeights(q.type,nearWater));S.res.push({type,x:px,y:py,biome:q.type,quality:Math.round(rnd(55,100))});break}}
 if($("disease").checked&&Math.random()<.0001&&S.people.length)pick(S.people).sick=true;
 if($("trade").checked&&S.tick%220===0)for(let ci=0;ci<S.civs.length;ci++){let v=S.civs[ci];if(!civAtWar(ci))v.wealth+=v.coop/25*civStyleBonus(v,"wealth")*policyBonus(v,"trade")}
 updateCities();buildingEffects();strategicAI();politicsTick();updateArmies();updateStrategicZones();updateTradeRoutes();lifeDevelopment();emergentNationStep();autoDiplomacyStep();processAutomaticEvents();sampleHistory();maybePeriodicReplayCapture();
}

/* -------- Camera / rendering -------- */
function applyCamera(){ctx.setTransform(camera.zoom,0,0,camera.zoom,-camera.x*camera.zoom,-camera.y*camera.zoom)}
function visibleBounds(){return {l:camera.x,t:camera.y,r:camera.x+c.width/camera.zoom,b:camera.y+c.height/camera.zoom}}
const biomeColors={water:"#2f7899",sand:"#ccb57b",plains:"#6f995a",forest:"#3e6f49",mountain:"#7e8078",desert:"#bc9c5c",savanna:"#9c9a52",swamp:"#4f7560",tundra:"#879a86",snow:"#e6eef1"};
function tint(hex,delta){
 let n=parseInt(hex.slice(1),16),r=clamp((n>>16)+delta,0,255),g=clamp(((n>>8)&255)+delta,0,255),b=clamp((n&255)+delta,0,255);
 return `rgb(${r},${g},${b})`;
}
function drawTerrain(){
 const vb=visibleBounds();
 if(camera.zoom<.36){
   if(FAST_TERRAIN.dirty||FAST_TERRAIN.canvas.width!==COLS||FAST_TERRAIN.canvas.height!==ROWS)rebuildFastTerrain();
   ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(FAST_TERRAIN.canvas,0,0,W,H);ctx.restore();
   if($("showRivers")?.checked){ctx.save();ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="rgba(54,132,167,.80)";ctx.lineWidth=5;for(const river of S.rivers){if(!river.length)continue;ctx.beginPath();ctx.moveTo(river[0].x,river[0].y);for(let i=2;i<river.length;i+=2)ctx.lineTo(river[i].x,river[i].y);ctx.lineTo(river.at(-1).x,river.at(-1).y);ctx.stroke()}ctx.restore()}
   return
 }
 const gx0=clamp(Math.floor(vb.l/CELL)-1,0,COLS-1),gx1=clamp(Math.ceil(vb.r/CELL)+1,0,COLS-1),gy0=clamp(Math.floor(vb.t/CELL)-1,0,ROWS-1),gy1=clamp(Math.ceil(vb.b/CELL)+1,0,ROWS-1);
 for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){
   let q=S.grid[gy*COLS+gx],px=gx*CELL,py=gy*CELL;
   let variation=Math.round((hash(gx,gy,900)-.5)*10);
   ctx.fillStyle=tint(biomeColors[q.type]||"#6d965b",variation);
   ctx.fillRect(px,py,CELL+1,CELL+1);
   if(q.type!=="water"){
     let waterL=gx>0&&S.grid[gy*COLS+gx-1]?.type==="water",waterR=gx<COLS-1&&S.grid[gy*COLS+gx+1]?.type==="water",waterU=gy>0&&S.grid[(gy-1)*COLS+gx]?.type==="water",waterD=gy<ROWS-1&&S.grid[(gy+1)*COLS+gx]?.type==="water";
     if(waterL||waterR||waterU||waterD){ctx.fillStyle="rgba(232,218,174,.24)";if(waterL)ctx.fillRect(px,py,2,CELL);if(waterR)ctx.fillRect(px+CELL-2,py,2,CELL);if(waterU)ctx.fillRect(px,py,CELL,2);if(waterD)ctx.fillRect(px,py+CELL-2,CELL,2)}
   }
   // More natural micro-textures
   let h=hash(gx,gy,901);
   ctx.lineCap="round";
   if(q.type==="plains"&&h>.45){ctx.strokeStyle="rgba(53,99,54,.42)";ctx.lineWidth=1.4;for(let i=0;i<2;i++){let ox=9+i*13+hash(gx,gy,930+i)*8,oy=13+hash(gx,gy,940+i)*17;ctx.beginPath();ctx.moveTo(px+ox,py+oy+5);ctx.quadraticCurveTo(px+ox+1,py+oy,px+ox+4,py+oy-4);ctx.stroke()}}
   else if(q.type==="forest"){for(let i=0;i<2;i++){let ox=10+i*16+hash(gx,gy,950+i)*5,oy=11+hash(gx,gy,960+i)*15;ctx.fillStyle=i?"#315b39":"#365f3c";ctx.beginPath();ctx.arc(px+ox,py+oy,5.5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#57432f";ctx.fillRect(px+ox-1,py+oy+4,2,5)}}
   else if(q.type==="mountain"){ctx.fillStyle="rgba(222,225,221,.28)";ctx.beginPath();ctx.moveTo(px+7,py+31);ctx.lineTo(px+20,py+9);ctx.lineTo(px+34,py+31);ctx.closePath();ctx.fill();ctx.strokeStyle="rgba(70,72,70,.3)";ctx.stroke()}
   else if(q.type==="desert"){ctx.strokeStyle="rgba(130,99,48,.35)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px+20,py+23,12,3.4,5.9);ctx.stroke()}
   else if(q.type==="savanna"){ctx.strokeStyle="rgba(102,89,39,.38)";ctx.beginPath();ctx.moveTo(px+10,py+29);ctx.lineTo(px+13,py+18);ctx.moveTo(px+26,py+30);ctx.lineTo(px+24,py+19);ctx.stroke()}
   else if(q.type==="swamp"){ctx.fillStyle="rgba(51,94,74,.45)";ctx.beginPath();ctx.arc(px+12,py+24,5,0,Math.PI*2);ctx.arc(px+28,py+14,4,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(175,201,150,.28)";ctx.beginPath();ctx.moveTo(px+17,py+29);ctx.lineTo(px+18,py+17);ctx.stroke()}
   else if(q.type==="tundra"){ctx.fillStyle="rgba(225,232,219,.20)";ctx.fillRect(px+8,py+12,8,4);ctx.fillRect(px+26,py+27,6,3)}
   else if(q.type==="snow"){ctx.fillStyle="rgba(255,255,255,.36)";ctx.beginPath();ctx.arc(px+12,py+11,4,0,Math.PI*2);ctx.arc(px+29,py+27,3,0,Math.PI*2);ctx.fill()}
   else if(q.type==="water"){ctx.strokeStyle="rgba(205,235,244,.18)";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(px+7,py+15);ctx.quadraticCurveTo(px+14,py+12,px+22,py+15);ctx.quadraticCurveTo(px+29,py+18,px+35,py+15);ctx.stroke()}
 }
 // Rivers: solid natural blue lines. Trade routes use green dashes.
 if($("showRivers")?.checked){
 ctx.lineCap="round";ctx.lineJoin="round";
 for(const river of S.rivers){
   if(!river.length)continue;
   let maybeVisible=river.some((p,i)=>i%15===0&&p.x>vb.l-100&&p.x<vb.r+100&&p.y>vb.t-100&&p.y<vb.b+100);if(!maybeVisible)continue;
   ctx.strokeStyle="rgba(54,132,167,.82)";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(river[0].x,river[0].y);for(let i=1;i<river.length;i++)ctx.lineTo(river[i].x,river[i].y);ctx.stroke();
   ctx.strokeStyle="rgba(205,238,247,.32)";ctx.lineWidth=1.5;ctx.stroke();
 }}
}

function drawTerritories(){
 if(!$('showTerritories')?.checked)return;
 if(TERR.dirty||TERR.canvas.width!==COLS||TERR.canvas.height!==ROWS)rebuildTerritories();
 ctx.save();
 ctx.imageSmoothingEnabled=true;
 ctx.globalAlpha=.92;
 ctx.drawImage(TERR.canvas,0,0,W,H);
 ctx.restore();
}
function drawRoads(){if(!$('showRoads')?.checked)return;let vb=visibleBounds();ctx.save();ctx.lineCap="round";for(const r of S.roads){if(Math.max(r.x1,r.x2)<vb.l||Math.min(r.x1,r.x2)>vb.r||Math.max(r.y1,r.y2)<vb.t||Math.min(r.y1,r.y2)>vb.b)continue;ctx.strokeStyle=r.kind==="regional"?"rgba(83,63,41,.58)":"rgba(102,83,59,.38)";ctx.lineWidth=r.kind==="regional"?7.5:4.2;ctx.beginPath();ctx.moveTo(r.x1,r.y1);ctx.lineTo(r.x2,r.y2);ctx.stroke();ctx.strokeStyle="rgba(219,197,156,.22)";ctx.lineWidth=r.kind==="regional"?1.8:1.2;ctx.stroke()}ctx.restore()}
function drawCityLabels(){
 let vb=visibleBounds();ctx.save();
 for(const city of S.cities){
   if(city.x<vb.l-100||city.x>vb.r+100||city.y<vb.t-100||city.y>vb.b+100)continue;
   if(camera.zoom<.28&&!city.capital)continue;
   let fontSize=Math.max(11,15/camera.zoom);ctx.font=`700 ${fontSize}px system-ui`;ctx.textAlign="center";
   let suffix=city.resistance>25?` · ✊${Math.round(city.resistance)}`:"",label=`${city.capital?"★ ":""}${city.name} · ${city.population}${suffix}`,w=ctx.measureText(label).width+18,y=city.y-city.radius*.18-33;
   ctx.fillStyle="rgba(7,13,16,.76)";ctx.beginPath();ctx.roundRect(city.x-w/2,y,w,26,6/camera.zoom);ctx.fill();ctx.fillStyle="#eef5f7";ctx.fillText(label,city.x,y+18);
   if(city.occupation?.progress>0){ctx.fillStyle="#e2a84a";ctx.fillRect(city.x-34,y+29,68*city.occupation.progress,3)}
 }
 ctx.restore()
}
function drawArmies(){if(!$('showArmies')?.checked)return;ctx.save();for(const a of S.armies){let members=a.memberIds.map(findPerson).filter(Boolean);if(!members.length)continue;let x=members.reduce((s,p)=>s+p.x,0)/members.length,y=members.reduce((s,p)=>s+p.y,0)/members.length,v=S.civs[a.ci];ctx.fillStyle="rgba(9,15,18,.82)";ctx.fillRect(x-23,y-49,46,23);ctx.fillStyle=v.color;ctx.fillRect(x-23,y-49,5,23);ctx.fillStyle="#eef5f7";ctx.font="11px system-ui";ctx.textAlign="center";ctx.fillText(`🚩 ${members.length}`,x+3,y-34);ctx.strokeStyle=v.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-26);ctx.lineTo(x,y-8);ctx.stroke()}ctx.restore()}

function eraPalette(e,v){
 let civColor=v?.color||"#7d8b91",walls=["#8b6748","#b38a62","#8b7965","#8a6c55","#b4b9bd","#a9c2ca"],roofs=["#6a4329","#9a553a","#574138","#553932","#515d67","#3e6675"];
 let n=parseInt(civColor.slice(1),16),cr=(n>>16)&255,cg=(n>>8)&255,cb=n&255,base=walls[e]||walls[5];
 let bn=parseInt(base.slice(1),16),br=(bn>>16)&255,bg=(bn>>8)&255,bb=bn&255;
 return {wall:`rgb(${Math.round(br*.72+cr*.28)},${Math.round(bg*.72+cg*.28)},${Math.round(bb*.72+cb*.28)})`,roof:roofs[e]||roofs[5],accent:civColor}
}
function drawBuilding(b){
 let x=b.x,y=b.y,v=S.civs[b.ci],e=eraIndex(v),globalScale=(+$("buildingVisualScale").value||125)/100,sc=globalScale*(b.scale||1),detail=(+$("textureDetail").value||80)/100,pal=eraPalette(e,v);
 let wall=pal.wall,roof=b.roof||pal.roof,accent=pal.accent,type=b.type;
 ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
 ctx.fillStyle="rgba(0,0,0,.22)";ctx.beginPath();ctx.ellipse(0,14,22,7.5,0,0,Math.PI*2);ctx.fill();

 // Farms are mostly terrain/field structures.
 if(type==="farm"){
   ctx.fillStyle=e>=4?"#6f8f55":"#789348";ctx.fillRect(-22,3,44,12);
   ctx.strokeStyle="rgba(60,75,35,.55)";ctx.lineWidth=1;for(let xx=-18;xx<=18;xx+=6){ctx.beginPath();ctx.moveTo(xx,4);ctx.lineTo(xx,14);ctx.stroke()}
   if(e>=3){ctx.strokeStyle="#b7c8c8";ctx.beginPath();ctx.arc(0,4,12,Math.PI,0);ctx.stroke();ctx.fillStyle="rgba(184,218,220,.18)";ctx.fillRect(-12,4,24,8)}
   else{ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(-8,3);ctx.lineTo(0,-9);ctx.lineTo(8,3);ctx.closePath();ctx.fill();ctx.fillStyle=wall;ctx.fillRect(-6,3,12,8)}
   ctx.restore();return
 }

 let residential=type==="hut"||type==="house",military=type==="barracks"||type==="strategic",civic=type==="hall",medical=type==="hospital";
 let w=residential?(e<2?28:e<4?31:35):military?38:medical?36:["factory","power","airport"].includes(type)?40:34;
 let h=residential?(e<2?17:e<4?20:24):medical?26:military?23:22;

 // Foundations evolve from earth/stone to concrete.
 ctx.fillStyle=e<2?"#5e5548":e<4?"#625d56":"#59636a";ctx.fillRect(-w/2-1,h/2-2,w+2,4);

 if(e===0&&residential){
   // Tribal woven hut / longhouse.
   ctx.fillStyle="#8e704e";ctx.beginPath();ctx.roundRect(-w/2,-7,w,17,6);ctx.fill();
   ctx.fillStyle="#b18b57";ctx.beginPath();ctx.moveTo(-w/2-3,-5);ctx.quadraticCurveTo(0,-24,w/2+3,-5);ctx.lineTo(w/2,-1);ctx.quadraticCurveTo(0,-17,-w/2,-1);ctx.closePath();ctx.fill();
   if(detail>.45){ctx.strokeStyle="rgba(64,44,25,.35)";for(let xx=-10;xx<=10;xx+=5){ctx.beginPath();ctx.moveTo(xx,-13);ctx.lineTo(xx+4,-4);ctx.stroke()}}
 }else if(e===1&&residential){
   // Antique plaster/stone house with tile roof.
   ctx.fillStyle=wall;ctx.fillRect(-w/2,-9,w,h);ctx.fillStyle=roof;for(let yy=-16;yy<-7;yy+=3)ctx.fillRect(-w/2-2,yy,w+4,2);
   ctx.fillStyle="#d7c391";ctx.fillRect(-w/2+3,-7,3,h-3);ctx.fillRect(w/2-6,-7,3,h-3);
 }else if(e===2&&residential){
   // Medieval timber framing.
   ctx.fillStyle="#c1a47c";ctx.fillRect(-w/2,-10,w,h);ctx.strokeStyle="#594331";ctx.lineWidth=2;ctx.strokeRect(-w/2,-10,w,h);ctx.beginPath();ctx.moveTo(-w/2,-10);ctx.lineTo(w/2,h-10);ctx.moveTo(w/2,-10);ctx.lineTo(-w/2,h-10);ctx.stroke();
   ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(-w/2-4,-10);ctx.lineTo(0,-25);ctx.lineTo(w/2+4,-10);ctx.closePath();ctx.fill();
 }else if(e===3&&residential){
   // Industrial brick row house.
   ctx.fillStyle="#8f674f";ctx.fillRect(-w/2,-12,w,h);if(detail>.4){ctx.strokeStyle="rgba(55,39,31,.28)";ctx.lineWidth=.7;for(let yy=-8;yy<10;yy+=4){ctx.beginPath();ctx.moveTo(-w/2,yy);ctx.lineTo(w/2,yy);ctx.stroke()}}
   ctx.fillStyle="#4a4140";ctx.fillRect(-w/2-1,-15,w+2,4);
 }else if(e>=4&&residential){
   // Modern / advanced dwelling.
   ctx.fillStyle=e===4?"#aeb6ba":"#9db7c1";ctx.beginPath();ctx.roundRect(-w/2,-15,w,h,2);ctx.fill();
   ctx.fillStyle=e===4?"#5d6d76":"#4c8395";for(let yy=-11;yy<7;yy+=7)for(let xx=-w/2+4;xx<w/2-2;xx+=7)ctx.fillRect(xx,yy,4,4);
   if(e===5){ctx.strokeStyle="#8edbea";ctx.lineWidth=1.2;ctx.strokeRect(-w/2+2,-13,w-4,h-4)}
 }else{
   // Era-adaptive institutional / economic shell.
   ctx.fillStyle=wall;ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,e>=4?3:1);ctx.fill();
   if(e<=2){ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(-w/2-3,-h/2);ctx.lineTo(0,-h/2-14);ctx.lineTo(w/2+3,-h/2);ctx.closePath();ctx.fill()}
   else{ctx.fillStyle=roof;ctx.fillRect(-w/2-2,-h/2-4,w+4,5)}
   let grad=ctx.createLinearGradient(-w/2,0,w/2,0);grad.addColorStop(0,"rgba(255,255,255,.10)");grad.addColorStop(1,"rgba(0,0,0,.12)");ctx.fillStyle=grad;ctx.fillRect(-w/2+1,-h/2+1,w-2,h-2);
 }

 // Doors/windows.
 if(!["airport","power"].includes(type)){
   ctx.fillStyle=e>=4?"#34464f":"#59402f";ctx.fillRect(-3,3,6,10);
   ctx.fillStyle=e>=3?"#9bd0e2":"#b9d9df";ctx.fillRect(-w/2+5,-3,5,5);ctx.fillRect(w/2-10,-3,5,5);
 }

 // Type identity, progressively modernized.
 if(civic){
   if(e<2){ctx.fillStyle=accent;ctx.fillRect(-1,-27,2,15);ctx.beginPath();ctx.moveTo(1,-27);ctx.lineTo(11,-23);ctx.lineTo(1,-20);ctx.closePath();ctx.fill()}
   else if(e===2){ctx.fillStyle="#5a6064";ctx.fillRect(-5,-28,10,15);ctx.fillStyle=accent;ctx.fillRect(-1,-36,2,9)}
   else{ctx.fillStyle=accent;ctx.fillRect(-w/2,-h/2,w,3);ctx.fillStyle="#d5dde0";for(let xx=-10;xx<=10;xx+=10)ctx.fillRect(xx-1,-h/2+4,2,h-8)}
 }
 if(medical){
   ctx.fillStyle=e>=4?"#f2f6f7":"#eee7db";ctx.fillRect(-7,-7,14,14);ctx.fillStyle="#d84e4e";ctx.fillRect(-2,-6,4,12);ctx.fillRect(-6,-2,12,4);
   if(e>=4){ctx.fillStyle="#86c9df";ctx.fillRect(-w/2+2,-h/2+2,w-4,4)}
 }
 if(military){
   if(e<=1){ctx.strokeStyle="#6a5138";ctx.lineWidth=2;for(let xx=-w/2;xx<=w/2;xx+=6){ctx.beginPath();ctx.moveTo(xx,h/2+3);ctx.lineTo(xx,h/2-7);ctx.stroke()}}
   else if(e===2){ctx.fillStyle="#69706d";ctx.fillRect(-w/2-3,-h/2-7,7,8);ctx.fillRect(w/2-4,-h/2-7,7,8)}
   else if(e===3){ctx.fillStyle="#5e665f";ctx.fillRect(-w/2-4,h/2-3,w+8,4)}
   else{ctx.fillStyle="#4c5a56";ctx.fillRect(-w/2-5,h/2-2,w+10,4);ctx.fillStyle="#73847e";ctx.beginPath();ctx.arc(w/2-8,-h/2-6,5,0,Math.PI*2);ctx.fill()}
 }
 if(type==="factory"||type==="power"){ctx.fillStyle="#4d5960";ctx.fillRect(w/2-10,-h/2-19,7,20);ctx.fillStyle="#2f383d";ctx.fillRect(w/2-11,-h/2-21,9,3);if(e>=4){ctx.fillStyle="#79a6b7";ctx.fillRect(-w/2+3,-h/2+3,7,h-6)}}
 if(type==="lab"){ctx.fillStyle=e>=5?"#82d7e4":"#b9dae5";ctx.beginPath();ctx.arc(0,-h/2-5,8,Math.PI,0);ctx.fill();ctx.strokeStyle="#d7f3f7";ctx.stroke()}
 if(type==="airport"){ctx.fillStyle="#7f8d94";ctx.fillRect(-25,8,50,6);ctx.fillStyle="#d7e0e3";ctx.fillRect(-2,8,4,6);if(e>=5){ctx.strokeStyle="#73ccdf";ctx.strokeRect(-18,-8,36,12)}}
 ctx.restore()
}
function resolvedOutfitStyle(p){
 if(p.outfitStyle&&p.outfitStyle!=="auto")return p.outfitStyle;
 if(/Guerrier|Soldat|Chevalier|Pilote/.test(p.role))return "military";
 if(/Scientifique|Scribe|Ingénieur|Médecin|Guérisseur/.test(p.role))return "scholar";
 if(/Chef|Maire|Président|Roi|Politicien|Conseiller/.test(p.role))return "formal";
 if(/Ouvrier|Fermier|Mineur|Forgeron|Artisan|Chasseur|Cueilleur/.test(p.role))return "worker";
 return "civil"
}
function drawPerson(p){
 let x=p.x,y=p.y,v=S.civs[p.ci],e=eraIndex(v),globalScale=(+$("npcVisualScale").value||140)/100;
 let ageScale=p.age<7?.76:p.age<15?.9:p.age>68?.95:1,sc=globalScale*(p.scale||1)*ageScale,cloth=p.clothes||v.color,accent=p.outfitAccent||"#d9c27a",style=resolvedOutfitStyle(p),pattern=p.outfitPattern||"plain",detail=(+$("textureDetail").value||80)/100;
 let moving=Math.min(1,Math.hypot(p.vx||0,p.vy||0)*1.8),phase=S.tick*.18+p.id*.91,bob=Math.sin(phase)*.5*moving,step=Math.sin(phase)*1.8*moving;
 ctx.save();ctx.translate(x,y+bob);ctx.scale(sc,sc);
 ctx.fillStyle="rgba(0,0,0,.21)";ctx.beginPath();ctx.ellipse(0,11.5,7,3,0,0,Math.PI*2);ctx.fill();

 // Legs/boots adapt to era.
 ctx.strokeStyle=e>=3?"#20292f":"#3b3028";ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(-2.2,6);ctx.lineTo(-2.2-step*.35,14);ctx.moveTo(2.2,6);ctx.lineTo(2.2+step*.35,14);ctx.stroke();
 if(e>=3){ctx.fillStyle="#1d252a";ctx.fillRect(-5,12,4,2);ctx.fillRect(1,12,4,2)}

 // Main garment silhouette.
 ctx.fillStyle=cloth;ctx.beginPath();
 if(e===0){ctx.moveTo(-5,-3);ctx.lineTo(5,-3);ctx.lineTo(6,8);ctx.lineTo(-6,8);ctx.closePath()}
 else if(e===1){ctx.moveTo(-5.5,-3);ctx.lineTo(5.5,-3);ctx.lineTo(7,9);ctx.lineTo(-7,9);ctx.closePath()}
 else if(e===2){ctx.roundRect(-6,-3,12,12,2)}
 else if(e===3){ctx.roundRect(-6,-4,12,13,1.5)}
 else{ctx.roundRect(-6,-4,12,13,2.5)}
 ctx.fill();

 // Era details: belt, tunic, coat, jacket, advanced panels.
 if(e<=1){ctx.fillStyle="#68482f";ctx.fillRect(-6,3,12,2)}
 if(e===2){ctx.fillStyle=accent;ctx.fillRect(-1,-3,2,12);ctx.fillRect(-6,2,12,2)}
 if(e===3){ctx.fillStyle="rgba(30,32,32,.30)";ctx.fillRect(-1,-3,2,12);ctx.fillStyle=accent;ctx.fillRect(-5,-2,2,8)}
 if(e===4){ctx.fillStyle=accent;ctx.fillRect(-5,-2,10,2);ctx.fillStyle="rgba(18,40,52,.28)";ctx.fillRect(-1,-2,2,10)}
 if(e===5){ctx.strokeStyle=accent;ctx.lineWidth=1;ctx.strokeRect(-5,-3,10,11);ctx.fillStyle="rgba(102,218,231,.30)";ctx.fillRect(-1,-2,2,9)}

 // Chosen outfit style.
 if(style==="worker"){ctx.fillStyle=accent;ctx.fillRect(-6,5,12,2)}
 if(style==="scholar"){ctx.fillStyle=e>=4?"#d8edf2":"#e4dccd";ctx.fillRect(-2,-3,4,11)}
 if(style==="military"){ctx.fillStyle="rgba(55,65,57,.38)";ctx.fillRect(-6,-4,12,7);ctx.strokeStyle=accent;ctx.strokeRect(-5,-3,10,10)}
 if(style==="formal"){ctx.fillStyle=accent;ctx.beginPath();ctx.moveTo(-2,-3);ctx.lineTo(2,-3);ctx.lineTo(0,4);ctx.closePath();ctx.fill()}

 // Patterns chosen by player.
 if(pattern==="trim"){ctx.fillStyle=accent;ctx.fillRect(-6,7,12,1.4)}
 else if(pattern==="stripe"){ctx.fillStyle=accent;ctx.fillRect(-1,-3,2,11)}
 else if(pattern==="split"){ctx.globalAlpha=.22;ctx.fillStyle=accent;ctx.fillRect(0,-3,6,11);ctx.globalAlpha=1}

 // Arms and head.
 ctx.strokeStyle=p.skin||"#c8946e";ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-5.5,0);ctx.lineTo(-8.5,5.5);ctx.moveTo(5.5,0);ctx.lineTo(8.5,5.5);ctx.stroke();
 ctx.fillStyle=p.skin||"#c8946e";ctx.beginPath();ctx.arc(0,-10,5.5,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(255,255,255,.10)";ctx.beginPath();ctx.arc(-1.4,-11.2,1.7,0,Math.PI*2);ctx.fill();

 // Hair.
 ctx.fillStyle=p.hair||"#241912";
 if(p.hairStyle==="bald"){}
 else if(p.hairStyle==="long"){ctx.beginPath();ctx.arc(0,-11,5.8,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-5.4,-10.5,2,8);ctx.fillRect(3.4,-10.5,2,8)}
 else if(p.hairStyle==="curly"){for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(i*3,-14+(Math.abs(i)*.8),2.6,0,Math.PI*2);ctx.fill()}}
 else if(p.hairStyle==="mohawk"){ctx.fillRect(-1.2,-18,2.4,7)}
 else {ctx.beginPath();ctx.arc(0,-12,5.4,Math.PI,Math.PI*2);ctx.fill()}

 // Headwear; "auto" follows era and role.
 let head=p.headwear||"auto";if(head==="auto"){if(style==="military")head=e>=2?"helmet":"cap";else if(style==="formal"&&e<=2)head="hat";else if(e===0&&style==="worker")head="hood";else head="none"}
 if(head==="cap"){ctx.fillStyle=accent;ctx.beginPath();ctx.arc(0,-14,5.2,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(2,-14,5,1.4)}
 if(head==="hood"){ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-10,6.4,Math.PI*.9,Math.PI*2.1);ctx.stroke()}
 if(head==="helmet"){ctx.fillStyle=e>=4?"#596970":"#85837a";ctx.beginPath();ctx.arc(0,-12,5.7,Math.PI,Math.PI*2);ctx.fill();if(e>=5){ctx.strokeStyle="#78d3df";ctx.stroke()}}
 if(head==="hat"){ctx.fillStyle=accent;ctx.fillRect(-6,-15,12,2);ctx.fillRect(-3,-19,6,4)}

 ctx.fillStyle="#172026";ctx.fillRect(-2.7,-10.2,1,1);ctx.fillRect(1.7,-10.2,1,1);
 if(detail>.45)ctx.fillRect(-.4,-8.5,.8,.8);

 // Role markers.
 if(/Chef|Maire|Président|Roi/.test(p.role)){ctx.fillStyle="#f1c84c";ctx.beginPath();ctx.moveTo(-6,-16);ctx.lineTo(-3,-19);ctx.lineTo(0,-16.5);ctx.lineTo(3,-19);ctx.lineTo(6,-16);ctx.closePath();ctx.fill()}
 if(/Médecin|Guérisseur/.test(p.role)){ctx.fillStyle="#f2f6f7";ctx.fillRect(7,-3,4,7);ctx.fillStyle="#d64e4e";ctx.fillRect(8.5,-.5,1,4);ctx.fillRect(7,1,4,1)}
 if(/Guerrier|Soldat|Chevalier/.test(p.role)){ctx.strokeStyle="#d6dde0";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(9,-6);ctx.lineTo(9,11);ctx.stroke()}
 if(/Scientifique|Ingénieur/.test(p.role)&&e>=3){ctx.fillStyle="#bde5ef";ctx.fillRect(-2,0,4,2)}
 if(p.partner){ctx.fillStyle="#ea7fa5";ctx.beginPath();ctx.arc(0,-21,2,0,Math.PI*2);ctx.fill()}
 ctx.restore()
}
function startEraTransition(ci,e){
 let city=S.cities.find(c=>c.ci===ci&&c.capital)||S.cities.find(c=>c.ci===ci),lead=leaderForCiv(ci),focus=city||lead;if(!focus)return;
 story.eraWaves=story.eraWaves||[];story.eraWaves.push({ci,e,x:focus.x,y:focus.y,start:Date.now(),end:Date.now()+5200});
 document.querySelector(".world-wrap")?.classList.add("era-flash");setTimeout(()=>document.querySelector(".world-wrap")?.classList.remove("era-flash"),750)
}
function drawEraTransitions(){
 let now=Date.now();story.eraWaves=(story.eraWaves||[]).filter(w=>w.end>now);
 ctx.save();
 for(const w of story.eraWaves){
   let t=clamp((now-w.start)/(w.end-w.start),0,1),r=80+t*680,color=S.civs[w.ci]?.color||"#f1c84c";
   ctx.globalAlpha=(1-t)*.65;ctx.strokeStyle=color;ctx.lineWidth=(5-3*t)/camera.zoom;ctx.beginPath();ctx.arc(w.x,w.y,r,0,Math.PI*2);ctx.stroke();
   ctx.globalAlpha=(1-t)*.22;ctx.fillStyle=color;ctx.beginPath();ctx.arc(w.x,w.y,Math.max(0,r-15),0,Math.PI*2);ctx.fill();
   ctx.globalAlpha=(1-t)*.9;ctx.fillStyle="#f5dda0";ctx.font=`${Math.max(14,22/camera.zoom)}px system-ui`;ctx.textAlign="center";ctx.fillText(`${eras[w.e].icon} ${eras[w.e].name}`,w.x,w.y-r-18)
 }
 ctx.restore()
}

function drawNightLights(){
 if(!$("showLighting")?.checked)return;let hour=(S.minute||0)/60,night=hour<6||hour>19.5;if(!night)return;let vb=visibleBounds();ctx.save();
 for(const b of S.buildings){if(b.x<vb.l||b.x>vb.r||b.y<vb.t||b.y>vb.b)continue;if(hash(b.id,Math.floor(S.year),222)>.42){ctx.fillStyle="rgba(255,209,107,.56)";ctx.beginPath();ctx.arc(b.x+4,b.y,2.2,0,Math.PI*2);ctx.fill()}}
 ctx.restore()
}
function drawLighting(){
 if(!$("showLighting")?.checked)return;let hour=(S.minute||0)/60,nightAlpha=0,warm=0;
 if(hour<5)nightAlpha=.42;else if(hour<7){nightAlpha=(7-hour)/2*.36;warm=(hour-5)/2*.08}else if(hour>18&&hour<20){nightAlpha=(hour-18)/2*.30;warm=(20-hour)/2*.07}else if(hour>=20)nightAlpha=.40;
 ctx.setTransform(1,0,0,1,0,0);if(warm>0){ctx.fillStyle=`rgba(224,126,72,${warm})`;ctx.fillRect(0,0,c.width,c.height)}if(nightAlpha>0){ctx.fillStyle=`rgba(8,15,34,${nightAlpha})`;ctx.fillRect(0,0,c.width,c.height)}
}
function drawWeather(){
 ctx.setTransform(1,0,0,1,0,0);
 if(S.weather==="Pluie"||S.weather==="Tempête"){ctx.strokeStyle="rgba(185,214,230,.36)";ctx.lineWidth=1;for(let i=0;i<(S.weather==="Tempête"?150:75);i++){let a=(i*83+S.tick*8)%c.width,b=(i*47+S.tick*11)%c.height;ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(a-5,b+9);ctx.stroke()}}
 if(S.weather==="Neige"){ctx.fillStyle="rgba(244,249,252,.70)";for(let i=0;i<90;i++){let a=(i*97+S.tick*1.7)%c.width,b=(i*61+S.tick*(1.3+(i%4)*.15))%c.height;ctx.beginPath();ctx.arc(a,b,1+(i%3)*.45,0,Math.PI*2);ctx.fill()}}
}
function draw(){
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle="#183343";ctx.fillRect(0,0,c.width,c.height);
 applyCamera();drawTerrain();drawTerritories();drawStrategicZones();drawTradeRoutes();drawRoads();
 let vb=visibleBounds();
 const visible=o=>o.x>vb.l-80&&o.x<vb.r+80&&o.y>vb.t-80&&o.y<vb.b+80;
 let farMode=$("farNpcDetail")?.value||"auto",overview=camera.zoom<.34,deepOverview=camera.zoom<.25,pStep=1,rStep=1;
 if(farMode==="low"){pStep=overview?5:camera.zoom<.7?3:1;rStep=overview?7:camera.zoom<.7?3:1}
 else if(farMode==="auto"){if(overview)pStep=S.people.length>2200?8:S.people.length>900?5:3;if(overview)rStep=S.res.length>1800?10:S.res.length>900?6:3}
 for(let i=0;i<S.res.length;i+=rStep){let r=S.res[i];if(visible(r)){
   if(r.type==="wood"){ctx.fillStyle="#755232";ctx.fillRect(r.x-4,r.y-2,8,4);ctx.fillStyle="#8a6540";ctx.fillRect(r.x-2,r.y-3,4,6)}
   else if(r.type==="food"){ctx.fillStyle="#d6b44a";ctx.beginPath();ctx.arc(r.x,r.y,3.8,0,Math.PI*2);ctx.fill();ctx.fillStyle="#7aa050";ctx.fillRect(r.x-1,r.y-5,2,2)}
   else if(r.type==="oil"){ctx.fillStyle="#25292c";ctx.beginPath();ctx.arc(r.x,r.y,3.8,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(r.x-1,r.y-2,1,1)}
   else if(r.type==="water"){ctx.fillStyle="#5eb7d7";ctx.beginPath();ctx.arc(r.x,r.y,3.6,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(220,247,255,.5)";ctx.stroke()}
   else {ctx.fillStyle="#a8b1b5";ctx.beginPath();ctx.arc(r.x,r.y,3.5,0,Math.PI*2);ctx.fill()}
 }}
 if(overview){
   let bStep=deepOverview?3:2;for(let i=0;i<S.buildings.length;i+=bStep){let b=S.buildings[i];if(!visible(b))continue;ctx.fillStyle=S.civs[b.ci]?.color||"#b8c4c8";ctx.fillRect(b.x-3,b.y-3,6,6)}
   let wStep=deepOverview?5:3;ctx.fillStyle="rgba(130,124,115,.78)";for(let i=0;i<S.walls.length;i+=wStep){let w=S.walls[i];if(visible(w))ctx.fillRect(w.x-2,w.y-2,4,4)}
   for(let i=0;i<S.people.length;i+=pStep){let p=S.people[i];if(!visible(p))continue;ctx.fillStyle=S.civs[p.ci]?.color||"#e2e9eb";ctx.beginPath();ctx.arc(p.x,p.y,deepOverview?2.2:2.8,0,Math.PI*2);ctx.fill()}
 }else{
   for(const b of S.buildings)if(visible(b))drawBuilding(b);
   for(const w of S.walls)if(visible(w)){ctx.fillStyle="#766f66";ctx.fillRect(w.x-4,w.y,8,21);ctx.fillStyle="#9a9389";ctx.fillRect(w.x-5,w.y,10,4);ctx.fillStyle="#67615a";ctx.fillRect(w.x-2,w.y+6,4,2)}
   for(let i=0;i<S.people.length;i+=pStep){let p=S.people[i];if(visible(p))drawPerson(p)}
 }
 if(selected?.type==="person"&&visible(selected.obj)&&pStep>1&&!overview)drawPerson(selected.obj);
 drawArmies();drawCityLabels();drawEraTransitions();if(!overview)drawNightLights();drawWeather();drawLighting();if(!overview)drawSpeechBubbles();drawMinimap();
}
function screenToWorld(clientX,clientY){
 let r=c.getBoundingClientRect(),cx=(clientX-r.left)/r.width*c.width,cy=(clientY-r.top)/r.height*c.height;
 return {x:camera.x+cx/camera.zoom,y:camera.y+cy/camera.zoom,cx,cy};
}

/* -------- UI / details -------- */
function tabs(){$("civTabs").innerHTML="";S.civs.forEach((v,i)=>{let b=document.createElement("button");b.className="tab"+(i===active?" active":"");b.textContent=v.name;b.style.borderColor=v.color;b.onclick=()=>{active=i;tabs();editor()};$("civTabs").appendChild(b)})}
const fields=["avgIQ","agg","disc","curiosity","coop","fertility","courage"];
function editor(){let v=S.civs[active];if(!v)return;$("civName").value=v.name;$("civColor").value=v.color;$("civStyle").value=v.style||"balanced";$("manualPopulation").value=S.people.filter(p=>p.ci===active).length;$("birthRateMode").value=String(v.birthRate??1);$("ageProfile").value=v.ageProfile||"balanced";$("civDoctrine").value=v.doctrine||"adaptive";$("civIdeology").value=v.ideology||"mixed";$("civAutonomy").value=String(v.autonomy??1);$("civIntent").textContent=`Priorité actuelle : ${v.intent||"s'installer"} · Stabilité ${Math.round(v.stability??70)}% · Nourriture ${Math.round(v.foodSecurity??70)}%`;for(const f of fields){$(f).value=v[f];$(f+"V").textContent=v[f]}updateDemographyState(active);renderSociety();update()}
function openInspector(tab="detailTab"){$("inspector").classList.add("open");document.querySelectorAll(".it").forEach(b=>b.classList.toggle("active",b.dataset.itab===tab));document.querySelectorAll(".itab").forEach(s=>s.classList.toggle("active",s.id===tab))}

function goalLabel(g){return ({family:"Fonder une famille",wealth:"Devenir riche",knowledge:"Chercher le savoir",power:"Obtenir du pouvoir",explore:"Explorer",protect:"Protéger les siens",peace:"Vivre en paix"})[g]||g||"Vivre"}
function intentLabel(g){return ({food:"Chercher à manger",home:"Retourner au foyer",health:"Se faire soigner",family:"Voir sa famille",knowledge:"Étudier",wealth:"Chercher des ressources",power:"Se rapprocher du pouvoir",explore:"Explorer",protect:"Défendre",peace:"Éviter le conflit"})[g]||g||"Vivre"}

function detailPerson(p){
 let v=S.civs[p.ci],partner=findPerson(p.partner),home=findBuilding(p.home),parents=p.parents.map(findPerson).filter(Boolean),kids=p.children.map(findPerson).filter(Boolean),weapon=weapons.filter(w=>w.era<=eraIndex(v)).slice(-1)[0];
 $("inspectorTitle").textContent=pname(p);$("inspectorSub").textContent=`${p.role} · ${v.name}`;
 $("detailCard").innerHTML=`<div class="detail-head"><div class="portrait">${p.sex==="F"?"👩":"👨"}</div><div><h4>${pname(p)}</h4><p>${p.role} · ${p.age} ans · Gén. ${p.generation}</p></div></div><div class="detail-grid">
 <div><small>QI</small><b>${Math.round(p.iq)}</b></div><div><small>Force</small><b>${p.strength}</b></div><div><small>Charisme</small><b>${p.charisma}</b></div><div><small>Agressivité</small><b>${p.aggression}</b></div>
 <div><small>Curiosité</small><b>${p.curiosity}</b></div><div><small>Courage</small><b>${p.courage}</b></div><div><small>Loyauté</small><b>${p.loyalty}</b></div><div><small>Humeur</small><b>${p.mood}</b></div>
 <div><small>Santé</small><b>${Math.ceil(p.hp)}%</b></div><div><small>Arme</small><b>${weapon.name}</b></div><div><small>Habitat</small><b>${home?home.name:"Aucun"}</b></div><div><small>État</small><b>${p.pregnant>0?"Grossesse":p.sick?"Malade":"Normal"}</b></div></div>
 <div class="family-box"><b>🤖 IA personnelle</b>Objectif : ${goalLabel(p.lifeGoal)}<br>Intention : ${intentLabel(p.currentIntent)}<br>Stress : ${Math.round(p.stress||0)}% · Énergie : ${Math.round(p.energy||0)}%<br>Éducation : ${Math.round(p.education||0)} · Fortune : ${Math.round(p.coins||0)}<br><br><b>💞 Famille</b>Partenaire : ${partner?pname(partner):"Aucun"}<br>Parents : ${parents.length?parents.map(pname).join(", "):"—"}<br>Enfants : ${kids.length?kids.map(pname).join(", "):"Aucun"}<br><br><b>⭐ Importance historique</b> ${Math.round(personImportance(p))}/100</div>`;
 selected={type:"person",obj:p};
 $("buildingEditor").classList.add("hidden");$("personEditor").classList.remove("hidden");
 populatePersonEditor(p);renderPersonLife(p);$("personLifePanel").classList.remove("hidden");
 openInspector("detailTab");$("selected").textContent=`${pname(p)} · ${p.role}`;
}

function detailCity(city){selected={type:"city",obj:city};active=city.ci;tabs();editor();let v=S.civs[city.ci],ps=cityPeople(city),bs=cityBuildings(city);$('inspectorTitle').textContent=city.name;$('inspectorSub').textContent=`${city.capital?'Capitale':'Ville'} · ${v.name}`;$('selected').textContent=`🏙 ${city.name}`;$('personEditor').classList.add('hidden');$('personLifePanel').classList.add('hidden');$('buildingEditor').classList.add('hidden');$('detailCard').innerHTML=`<div class="detail-head"><div class="portrait">🏙</div><div><h4>${city.name}</h4><p>${city.capital?'Capitale de ':'Ville de '}${v.name}</p></div></div><div class="detail-grid"><div><small>Population</small><b>${ps.length}</b></div><div><small>Bâtiments</small><b>${bs.length}</b></div><div><small>Prospérité</small><b>${Math.round(city.prosperity)}%</b></div><div><small>Troubles</small><b>${Math.round(city.unrest)}%</b></div><div><small>Défense</small><b>${Math.round(city.defense)}</b></div><div><small>Garnison</small><b>${S.armies.filter(a=>a.homeCityId===city.id&&a.kind==="garrison").reduce((n,a)=>n+a.memberIds.length,0)}</b></div><div><small>Spécialité</small><b>${city.specialization}</b></div></div><div class="family-box"><b>📦 Réserves</b>🌾 ${Math.round(city.stock.food)} · 💧 ${Math.round(city.stock.water||0)} · 🪵 ${Math.round(city.stock.wood)} · ⛏ ${Math.round(city.stock.ore)} · 🛢 ${Math.round(city.stock.oil)} · 📦 ${Math.round(city.stock.goods)}<br><br><b>📜 Fondation</b> Année ${city.foundYear}</div>`;openInspector('detailTab')}

function buildingFunctionLabel(type){return ({hut:"Logement de base.",farm:"Produit périodiquement de la nourriture.",house:"Logement familial.",workshop:"Génère un peu de richesse.",barracks:"Améliore progressivement la puissance militaire.",hall:"Centre administratif et urbain.",hospital:"Soigne automatiquement certains malades.",factory:"Produit de la richesse, surtout avec une centrale.",lab:"Accélère la recherche scientifique.",power:"Améliore l'efficacité industrielle.",airport:"Infrastructure avancée.",strategic:"Centre de commandement avancé."})[type]||"Bâtiment civil."}
function detailBuilding(b){
 let v=S.civs[b.ci];selected={type:"building",obj:b};
 $("inspectorTitle").textContent=b.name;$("inspectorSub").textContent=v.name;
 $("detailCard").innerHTML=`<div class="detail-head"><div class="portrait">🏠</div><div><h4>${b.name}</h4><p>${v.name}</p></div></div><div class="detail-grid"><div><small>Type</small><b>${b.type}</b></div><div><small>Lits</small><b>${b.beds}</b></div><div><small>Résidents</small><b>${b.residents.length}</b></div><div><small>Époque</small><b>${eras[eraIndex(v)].name}</b></div></div><div class="family-box"><b>⚙ Fonction</b>${buildingFunctionLabel(b.type)}</div>`;
 $("personEditor").classList.add("hidden");$("personLifePanel").classList.add("hidden");$("buildingEditor").classList.remove("hidden");
 $("editBuildingName").value=b.name;$("editBuildingScale").value=String(b.scale||1);$("editBuildingRoof").value=b.roof||"#6e4d35";
 openInspector("detailTab");$("selected").textContent=`${b.name} · ${v.name}`;
}

const personEditRanges=["IQ","Strength","Charisma","Aggression","Curiosity","Fertility","Loyalty","Courage","Mood","Health","Education","Influence","Ambition"];
function populatePersonEditor(p){
 $("editFirst").value=p.first;$("editLast").value=p.last;$("editAge").value=p.age;$("editSex").value=p.sex;$("editRole").value=p.role;
 $("editScale").value=String(p.scale||1);$("editSkin").value=p.skin||"#c8946e";$("editHair").value=p.hair||"#241912";$("editClothes").value=p.clothes||S.civs[p.ci].color;$("editOutfitAccent").value=p.outfitAccent||"#d9c27a";$("editOutfitStyle").value=p.outfitStyle||"auto";$("editOutfitPattern").value=p.outfitPattern||"plain";$("editHeadwear").value=p.headwear||"auto";$("editHairStyle").value=p.hairStyle||"short";
 $("editCiv").innerHTML=S.civs.map((v,i)=>`<option value="${i}">${v.name}</option>`).join("");$("editCiv").value=String(p.ci);
 $("editLifeGoal").value=p.lifeGoal||"peace";$("editAutonomy").value=String(p.autonomy??1);
 const map={IQ:"iq",Strength:"strength",Charisma:"charisma",Aggression:"aggression",Curiosity:"curiosity",Fertility:"fertility",Loyalty:"loyalty",Courage:"courage",Mood:"mood",Health:"hp",Education:"education",Influence:"influence",Ambition:"ambition"};
 for(const label of personEditRanges){let key=map[label],val=Math.round(p[key]);$("edit"+label).value=val;$("edit"+label+"V").textContent=val}
}
function refreshSelectedPerson(){
 if(selected?.type!=="person")return;
 let p=selected.obj;if(!S.people.includes(p))return;
 detailPerson(p);
}


function renderPersonLife(p){
 if(!p)return;
 let j=(p.journal||[]).slice(0,60),m=(p.memories||[]).slice(0,24);
 $("personJournal").innerHTML=j.length?j.map(e=>`<div class="life-entry"><small>${e.stamp}</small><b>${e.title}</b><div>${e.text}</div></div>`).join(""):'<div class="empty">Aucun événement personnel important.</div>';
 $("personMemory").innerHTML=m.length?m.map(e=>`<span class="memory-chip" title="${e.stamp}">${e.text}</span>`).join(""):'<div class="empty">Aucun souvenir marquant.</div>';
}

function addPopulation(ci,count){
 let n=Math.max(0,Math.floor(count));
 for(let i=0;i<n;i++){let city=S.cities.filter(c=>c.ci===ci).sort((a,b)=>a.population-b.population)[0],px,py;if(city){px=city.x+rnd(-city.radius*.65,city.radius*.65);py=city.y+rnd(-city.radius*.65,city.radius*.65);if(terrainAt(px,py).type==="water"){[px,py]=landPoint(ci)}}else [px,py]=landPoint(ci);let p=makePerson(ci,px,py);p.cityId=city?.id||null;S.people.push(p)}
 assignHomes(ci);SP.last=-1;update();if($("populationBrowser")?.classList.contains("open"))renderPopulationBrowser();return n;
}
function removePopulation(ci,count){
 let pool=S.people.filter(p=>p.ci===ci).sort((a,b)=>a.age-b.age),n=Math.min(count,pool.length),ids=new Set(pool.slice(0,n).map(p=>p.id));
 for(const p of S.people)if(ids.has(p.id)&&p.partner){let q=findPerson(p.partner);if(q)q.partner=null}
 for(const b of S.buildings)b.residents=b.residents.filter(id=>!ids.has(id));
 S.people=S.people.filter(p=>!ids.has(p.id));if(ids.has(S.civs[ci]?.leaderId))S.civs[ci].leaderId=null;
 S.armies=S.armies.filter(a=>a.ci!==ci||a.memberIds.some(id=>!ids.has(id)));SP.last=-1;update();return n;
}
function setPopulation(ci,target){
 target=Math.max(0,Math.floor(target));let current=S.people.filter(p=>p.ci===ci).length;
 return target>current?addPopulation(ci,target-current):removePopulation(ci,current-target);
}
function configureCivilizationCount(target){
 target=clamp(Math.floor(target),1,12);
 while(S.civs.length<target){let i=S.civs.length;S.civs.push(civ(i));let [cx,cy]=landPoint(i),city=createCity(i,cx,cy,null,true);for(let h=0;h<7;h++)addBuilding(i,h===0?"hall":"hut",cx+rnd(-140,140),cy+rnd(-140,140),null,city.id)}
 while(S.civs.length>target){let i=S.civs.length-1;S.people=S.people.filter(p=>p.ci!==i);S.buildings=S.buildings.filter(b=>b.ci!==i);S.cities=S.cities.filter(c=>c.ci!==i);S.civs.pop()}
 S.wars=[];S.armies=[];refreshGlobalWar();SP.last=-1;rebuildRoads();rebuildTradeRoutes();markTerritoryDirty();
 active=Math.min(active,S.civs.length-1);tabs();editor();
}

const CIV_NAMES=["Auroria","Krag","Valoria","Noria","Solenne","Dravik","Eden","Rochel","Lunaris","Seren","Oria","Cendreval","Aubemont","Nova","Venn","Haven"];
function presetCivProfile(preset,i,n){
 let base={name:CIV_NAMES[i]||`Peuple ${i+1}`,color:COLORS[i%COLORS.length],style:"balanced",doctrine:"adaptive",ideology:"mixed",avgIQ:100,agg:42,coop:58,disc:55,curiosity:55,fertility:58};
 if(preset==="solo")return {...base,name:"Auroria",avgIQ:105,agg:28,coop:75};
 if(preset==="duel")return i===0?{...base,name:"Auroria",avgIQ:120,agg:24,coop:72,style:"science",doctrine:"scientific"}:{...base,name:"Krag",avgIQ:92,agg:76,coop:44,style:"military",doctrine:"militarist"};
 if(preset==="tribes")return {...base,name:["Cerfs","Loups","Aigles","Ours","Renards","Corbeaux","Bisons","Lynx"][i]||base.name,avgIQ:Math.round(rnd(86,106)),agg:Math.round(rnd(32,68)),coop:Math.round(rnd(42,72)),style:i%3===0?"nature":"balanced"};
 if(preset==="techrace")return {...base,name:["Helios","Nova","Arkos","Lumen"][i]||base.name,avgIQ:116+i*3,agg:18,coop:68,style:"science",doctrine:"scientific"};
 if(preset==="warworld")return {...base,avgIQ:Math.round(rnd(90,110)),agg:Math.round(rnd(76,94)),coop:Math.round(rnd(28,50)),style:"military",doctrine:"militarist"};
 if(preset==="peaceful")return {...base,avgIQ:Math.round(rnd(98,114)),agg:Math.round(rnd(8,20)),coop:Math.round(rnd(82,95)),style:i%2?"nature":"wealth",doctrine:"peaceful"};
 if(preset==="coldwar")return i===0?{...base,name:"Union d'Azur",avgIQ:118,agg:42,coop:50,style:"science",doctrine:"scientific"}:{...base,name:"Bloc de Fer",avgIQ:108,agg:58,coop:40,style:"military",doctrine:"militarist"};
 if(preset==="frontier")return {...base,name:["Valoria","Dravik","Solenne"][i]||base.name,agg:48+i*8,coop:60-i*6,doctrine:i===1?"expansionist":"adaptive"};
 if(preset==="empire")return {...base,name:"Empire de Sol",avgIQ:110,agg:36,coop:72,style:"wealth",doctrine:"expansionist"};
 if(preset==="shattered")return {...base,avgIQ:Math.round(rnd(88,108)),agg:Math.round(rnd(25,62)),coop:Math.round(rnd(35,66)),doctrine:i%3===0?"isolationist":"adaptive"};
 if(preset==="cataclysm")return {...base,avgIQ:Math.round(rnd(92,110)),agg:Math.round(rnd(25,48)),coop:Math.round(rnd(50,78)),style:i%2?"nature":"balanced"};
 return base;
}
function renderScenarioCivSetup(forceDefaults=false){
 let box=$("scenarioCivSetup");if(!box)return;
 let n=clamp(+$("scenarioCivs").value||1,1,12),preset=$("scenarioPreset").value||"custom",old={};
 if(!forceDefaults)box.querySelectorAll(".scenario-civ-card").forEach(card=>{
   let i=+card.dataset.i;old[i]={name:card.querySelector(".sc-name")?.value,color:card.querySelector(".sc-color")?.value,style:card.querySelector(".sc-style")?.value,doctrine:card.querySelector(".sc-doctrine")?.value,ideology:card.querySelector(".sc-ideology")?.value,avgIQ:+card.querySelector(".sc-iq")?.value,agg:+card.querySelector(".sc-agg")?.value,coop:+card.querySelector(".sc-coop")?.value,disc:+card.querySelector(".sc-disc")?.value,curiosity:+card.querySelector(".sc-curiosity")?.value,fertility:+card.querySelector(".sc-fertility")?.value,population:+card.querySelector(".sc-pop")?.value}
 });
 box.innerHTML="";
 for(let i=0;i<n;i++){
   let q=old[i]||presetCivProfile(preset,i,n),d=document.createElement("div");d.className="scenario-civ-card";d.dataset.i=i;
   d.innerHTML=`<div class="head">
     <input class="sc-color swatch" type="color" value="${q.color||COLORS[i%COLORS.length]}" title="Couleur">
     <input class="sc-name" value="${q.name||`Peuple ${i+1}`}" maxlength="28">
     <select class="sc-style"><option value="balanced">Équilibré</option><option value="nature">Nature</option><option value="military">Militaire</option><option value="science">Science</option><option value="wealth">Commerce</option></select>
   </div>
   <div class="traits">
     <label>🧠 QI moyen <input class="sc-iq" type="range" min="70" max="145" value="${Math.round(q.avgIQ??100)}"></label>
     <label>⚔ Agressivité <input class="sc-agg" type="range" min="0" max="100" value="${Math.round(q.agg??42)}"></label>
     <label>🤝 Coopération <input class="sc-coop" type="range" min="0" max="100" value="${Math.round(q.coop??58)}"></label>
     <label>🎯 Discipline <input class="sc-disc" type="range" min="0" max="100" value="${Math.round(q.disc??55)}"></label>
     <label>🔭 Curiosité <input class="sc-curiosity" type="range" min="0" max="100" value="${Math.round(q.curiosity??55)}"></label>
     <label>👶 Fertilité <input class="sc-fertility" type="range" min="0" max="100" value="${Math.round(q.fertility??58)}"></label>
     <label>Doctrine <select class="sc-doctrine"><option value="adaptive">Adaptative</option><option value="peaceful">Pacifique</option><option value="scientific">Scientifique</option><option value="commercial">Commerciale</option><option value="expansionist">Expansionniste</option><option value="militarist">Militariste</option><option value="isolationist">Isolationniste</option></select></label>
   </div>
   <div class="population-row"><label>👥 Habitants <input class="sc-pop" type="number" value="${Math.max(0,Math.floor(q.population??(+$("scenarioPop").value||80)))}"></label></div>
   <div class="politics-row"><label>Orientation politique <select class="sc-ideology"><option value="mixed">Économie mixte</option><option value="socialdem">Social-démocrate</option><option value="socialist">Socialiste</option><option value="communist">Communiste</option><option value="capitalist">Capitaliste</option><option value="technocratic">Technocratique</option><option value="green">Écologiste</option><option value="traditionalist">Traditionaliste</option></select></label></div>`;
   box.appendChild(d);d.querySelector(".sc-style").value=q.style||"balanced";d.querySelector(".sc-doctrine").value=q.doctrine||"adaptive";d.querySelector(".sc-ideology").value=q.ideology||"mixed";
 }
}
function scenarioCivConfigs(){
 return [...$("scenarioCivSetup").querySelectorAll(".scenario-civ-card")].map((card,i)=>({
   name:card.querySelector(".sc-name").value.trim()||`Peuple ${i+1}`,color:card.querySelector(".sc-color").value,style:card.querySelector(".sc-style").value,doctrine:card.querySelector(".sc-doctrine").value,ideology:card.querySelector(".sc-ideology").value,avgIQ:+card.querySelector(".sc-iq").value,agg:+card.querySelector(".sc-agg").value,coop:+card.querySelector(".sc-coop").value,disc:+card.querySelector(".sc-disc").value,curiosity:+card.querySelector(".sc-curiosity").value,fertility:+card.querySelector(".sc-fertility").value,population:Math.max(0,Math.floor(+card.querySelector(".sc-pop").value||0))
 }));
}
function randomizeScenarioCivilizations(){
 $("scenarioPreset").value="custom";renderScenarioCivSetup(true);
 for(const [i,card] of [...$("scenarioCivSetup").querySelectorAll(".scenario-civ-card")].entries()){
   card.querySelector(".sc-name").value=pick(CIV_NAMES);card.querySelector(".sc-color").value=COLORS[i%COLORS.length];card.querySelector(".sc-style").value=pick(["balanced","nature","military","science","wealth"]);card.querySelector(".sc-doctrine").value=pick(["adaptive","peaceful","scientific","commercial","expansionist","militarist","isolationist"]);card.querySelector(".sc-ideology").value=pick(["mixed","socialdem","socialist","communist","capitalist","technocratic","green","traditionalist"]);card.querySelector(".sc-iq").value=Math.round(rnd(82,125));card.querySelector(".sc-agg").value=Math.round(rnd(10,88));card.querySelector(".sc-coop").value=Math.round(rnd(25,90));card.querySelector(".sc-disc").value=Math.round(rnd(25,90));card.querySelector(".sc-curiosity").value=Math.round(rnd(25,90));card.querySelector(".sc-fertility").value=Math.round(rnd(35,85));card.querySelector(".sc-pop").value=Math.round(rnd(45,160))
 }
}

function applyScenarioPreset(name){
 if(name==="solo"){ $("worldShape").value="auto";$("scenarioCivs").value=1;$("scenarioPop").value=120;$("seaLevel").value=42;$("rivers").value=8;$("resourceDensity").value=110;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="wide"; }
 else if(name==="duel"){ $("scenarioCivs").value=2;$("scenarioPop").value=120;$("seaLevel").value=40;$("rivers").value=6;$("resourceDensity").value=100;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="balanced"; }
 else if(name==="tribes"){ $("scenarioCivs").value=8;$("scenarioPop").value=55;$("seaLevel").value=38;$("rivers").value=10;$("resourceDensity").value=115;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="compact"; }
 else if(name==="islands"){ $("worldShape").value="archipelago";$("scenarioCivs").value=5;$("scenarioPop").value=70;$("seaLevel").value=56;$("rivers").value=4;$("resourceDensity").value=95;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="compact"; }
 else if(name==="frontier"){ $("scenarioCivs").value=3;$("scenarioPop").value=95;$("seaLevel").value=36;$("rivers").value=8;$("resourceDensity").value=110;$("scenarioWalls").value="dividers";$("scenarioTerritoryStyle").value="wide"; }
 else if(name==="coldwar"){ $("scenarioCivs").value=2;$("scenarioPop").value=145;$("seaLevel").value=41;$("rivers").value=6;$("resourceDensity").value=105;$("scenarioWalls").value="dividers";$("scenarioTerritoryStyle").value="balanced"; }
 else if(name==="warworld"){ $("scenarioCivs").value=6;$("scenarioPop").value=130;$("seaLevel").value=38;$("rivers").value=8;$("resourceDensity").value=115;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="wide"; }
 else if(name==="peaceful"){ $("scenarioCivs").value=4;$("scenarioPop").value=90;$("seaLevel").value=42;$("rivers").value=9;$("resourceDensity").value=110;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="balanced"; }
 else if(name==="techrace"){ $("scenarioCivs").value=4;$("scenarioPop").value=100;$("seaLevel").value=40;$("rivers").value=7;$("resourceDensity").value=105;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="balanced"; }
 else if(name==="empire"){ $("worldShape").value="pangaea";$("scenarioCivs").value=1;$("scenarioPop").value=220;$("seaLevel").value=39;$("rivers").value=9;$("resourceDensity").value=130;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="wide"; }
 else if(name==="shattered"){ $("worldShape").value="shattered";$("scenarioCivs").value=7;$("scenarioPop").value=60;$("seaLevel").value=54;$("rivers").value=11;$("resourceDensity").value=85;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="compact"; }
 else if(name==="cataclysm"){ $("scenarioCivs").value=4;$("scenarioPop").value=80;$("seaLevel").value=47;$("rivers").value=5;$("resourceDensity").value=75;$("scenarioWalls").value="none";$("scenarioTerritoryStyle").value="balanced"; }
 for(const id of ["seaLevel","rivers","resourceDensity"]){let ev=new Event("input");$(id).dispatchEvent(ev)}
 renderScenarioCivSetup(true);
}
function setPersonField(id,key,parse=v=>v){
 $(id).addEventListener("input",()=>{if(selected?.type!=="person")return;selected.obj[key]=parse($(id).value);if(id==="editFirst"||id==="editLast"||id==="editRole")refreshSelectedPerson()});
}

function diplomacyStatus(a,b){if(areAtWar(a,b))return ['⚔ Guerre',-100];let rel=S.civs[a]?.relations?.[String(b)]??0;if(rel>70)return ['🤝 Alliance',rel];if(rel>25)return ['🙂 Amicale',rel];if(rel<-50)return ['⚠ Hostile',rel];return ['• Neutre',rel]}
function renderSociety(){let v=S.civs[active];if(!v)return;ensureGovernments();let lead=leaderForCiv(active),stock=aggregateCivStock(active),cities=S.cities.filter(c=>c.ci===active);$('societyCivName').textContent=v.name;$('societySummary').textContent=`${v.government} · ${ideologyLabel(v)} · ${cities.length} ville${cities.length>1?'s':''} · priorité ${v.intent||'équilibre'}`;$('govApproval').textContent=`${Math.round(v.approval??70)}%`;$('govType').value=v.government||governmentForEra(v);$('govPolicy').value=v.policy||'balanced';$('govIdeology').value=v.ideology||'mixed';$('govLock').checked=!!v.governmentLocked;$('govLeader').textContent=lead?pname(lead):'Vacant';$('govTerm').textContent=['République','Fédération'].includes(v.government)?`Année ${v.nextElectionYear}`:'Succession';$('govTreasury').textContent=Math.round(v.treasury||0);$('ideologyEffects').innerHTML=`<span class="ideology-badge">⚖ ${ideologyLabel(v)}</span><br>${ideologyDescription(v)}`;$('stockFood').textContent=Math.round(stock.food||0);$('stockWater').textContent=Math.round(stock.water||0);$('stockWood').textContent=Math.round(stock.wood||0);$('stockOre').textContent=Math.round(stock.ore||0);$('stockOil').textContent=Math.round(stock.oil||0);$('stockGoods').textContent=Math.round(stock.goods||0);let ownedZones=(S.strategicZones||[]).filter(z=>z.owner===active).sort((a,b)=>b.value-a.value);$('strategicAdvantages').innerHTML=ownedZones.length?ownedZones.map(z=>`<div class="strategic-adv"><b>${strategicIcon(z.type)} ${strategicTypeLabel(z.type)}</b><span>Valeur ${z.value}/100</span><small>${strategicBenefitText(z)}</small></div>`).join(""):'<div class="empty">Aucune zone stratégique contrôlée.</div>';let ring=$('govApproval').parentElement;ring.style.borderColor=(v.approval??70)>65?'#4e8a69':(v.approval??70)>40?'#ad8b47':'#aa4f59';$('cityList').innerHTML=cities.length?cities.map(c=>`<div class="city-card" data-city="${c.id}"><div class="city-head"><b>${c.capital?'★ ':''}${c.name}</b><small>${c.specialization}</small></div><div class="city-stats"><span>👥 ${c.population}</span><span>✨ ${Math.round(c.prosperity)}%</span><span>🛡 ${Math.round(c.defense)}</span><span>🪖 ${S.armies.filter(a=>a.homeCityId===c.id&&a.kind==="garrison").reduce((n,a)=>n+a.memberIds.length,0)}</span><span>⚠ ${Math.round(c.unrest)}%</span><span>✊ ${Math.round(c.resistance||0)}%</span></div></div>`).join(''):'<div class="empty">Aucune ville.</div>';$('diplomacyList').innerHTML=S.civs.map((q,i)=>i===active?'':(()=>{let [s,r]=diplomacyStatus(active,i);return `<div class="diplo-row"><span><b style="color:${q.color}">${q.name}</b><small>${Math.round(r)} relation</small></span><b>${s}</b></div>`})()).join('')}

let UI_CACHE={techKey:"",societyReal:0,popBrowserReal:0,cityBrowserReal:0};
function update(){
 let v=S.civs[active];if(v){$("pop").textContent=S.people.filter(p=>p.ci===active).length;$("era").textContent=eras[eraIndex(v)].name;$("science").textContent=Math.floor(v.science);$("tech").textContent=Math.floor(v.tech);$("military").textContent=Math.floor(v.military);$("cities").textContent=v.cities;
 let e=eraIndex(v),techKey=`${active}:${e}:${v.discoveries.length}`;if(UI_CACHE.techKey!==techKey){UI_CACHE.techKey=techKey;$("techTree").innerHTML=techs.map(t=>`<div class="unlock ${v.discoveries.includes(t[0])?"ok":"locked"}">${v.discoveries.includes(t[0])?"✓":"🔒"} ${t[0]}</div>`).join("");$("buildingList").innerHTML=buildings.map(b=>`<div class="unlock ${b.era<=e?"ok":"locked"}">${b.era<=e?"✓":"🔒"} ${b.name}</div>`).join("");$("weaponList").innerHTML=weapons.map(w=>`<div class="unlock ${w.era<=e?"ok":"locked"}">${w.era<=e?"✓":"🔒"} ${w.name}</div>`).join("")}}
 if($("worldProfileLabel"))$("worldProfileLabel").textContent=`${S.worldProfile?.label||"Monde"} · graine ${Math.floor(seed)} · ${S.strategicZones?.length||0} zones stratégiques`;
 $("clock").textContent=formattedClock();$("weather").textContent="🌦 "+S.weather;$("season").textContent=["🌱 Printemps","☀ Été","🍂 Automne","❄ Hiver"][S.season];let best=S.civs.length?Math.max(...S.civs.map(eraIndex)):null;$("eraGlobal").textContent=best==null?"🌊 Monde vierge":`${eras[best].icon} ${eras[best].name}`;$("worldPop").textContent=`👥 ${S.people.length}`;$("totalPopHud").textContent=S.people.length;$("totalBuildingsHud").textContent=S.buildings.length;$("totalCivsHud").textContent=S.civs.length;$("totalCitiesHud").textContent=S.cities.length;$("totalArmiesHud").textContent=S.armies.length;$("warStateHud").textContent=S.wars.length?`${S.wars.length} guerre${S.wars.length>1?'s':''}`:"Paix";$("storyStateHud").textContent=story.replayMode?"Replay":story.cinematic?"Ralenti":"Histoire";
 if(v&&$("civIntent"))$("civIntent").textContent=`Priorité actuelle : ${v.intent||"s'installer"} · Stabilité ${Math.round(v.stability??70)}% · Nourriture ${Math.round(v.foodSecurity??70)}%`;if(v)updateDemographyState(active);
 let now=Date.now(),stride=detailStride();$("perfHud").textContent=($("performanceMode")?.value||"auto")==="exact"?"Exact":stride>1?`Auto ÷${stride}`:"Auto";
 if($("populationBrowser")?.classList.contains("open")&&now-UI_CACHE.popBrowserReal>650){UI_CACHE.popBrowserReal=now;renderPopulationBrowser()}
 if($("cityBrowser")?.classList.contains("open")&&now-UI_CACHE.cityBrowserReal>800){UI_CACHE.cityBrowserReal=now;renderCityBrowser()}
 if($("societyTab")?.classList.contains("active")&&now-UI_CACHE.societyReal>550){UI_CACHE.societyReal=now;renderSociety()}
}
for(const f of fields)$(f).oninput=()=>{let v=S.civs[active];if(!v)return;v[f]=+$(f).value;$(f+"V").textContent=v[f]};
$("civName").onchange=()=>{let v=S.civs[active];if(!v)return;v.name=$("civName").value||v.name;tabs()};

$("civColor").oninput=()=>{let v=S.civs[active];if(!v)return;let old=v.color,next=$("civColor").value;v.color=next;for(const p of S.people)if(p.ci===active&&(!p.clothes||p.clothes===old||p.clothes===COLORS[active]))p.clothes=next;markTerritoryDirty()};
$("civStyle").onchange=()=>{let v=S.civs[active];if(v)v.style=$("civStyle").value};
$("civDoctrine").onchange=()=>{let v=S.civs[active];if(!v)return;v.doctrine=$("civDoctrine").value;editor()};$("civIdeology").onchange=()=>{let v=S.civs[active];if(!v)return;v.ideology=$("civIdeology").value;renderSociety()};
$("civAutonomy").onchange=()=>{let v=S.civs[active];if(!v)return;v.autonomy=+$("civAutonomy").value;editor()};


$('govType').onchange=()=>{let v=S.civs[active];v.government=$('govType').value;v.governmentLocked=true;$('govLock').checked=true;let lead=leaderForCiv(active);if(lead)lead.role=leaderRole(v);renderSociety()};$('govLock').onchange=()=>{S.civs[active].governmentLocked=$('govLock').checked;renderSociety()};
$('govPolicy').onchange=()=>{S.civs[active].policy=$('govPolicy').value;renderSociety()};$('govIdeology').onchange=()=>{S.civs[active].ideology=$('govIdeology').value;renderSociety()};
$('cityList').onclick=e=>{let b=e.target.closest('[data-city]');if(b){let city=findCity(+b.dataset.city);if(city){detailCity(city);centerOnCity(city)}}};



$("birthRateMode").onchange=()=>{let v=S.civs[active];if(v)v.birthRate=+$("birthRateMode").value};
$("ageProfile").onchange=()=>{let v=S.civs[active];if(v)v.ageProfile=$("ageProfile").value};
$("applyPopulation").onclick=()=>{let v=S.civs[active],target=Math.max(0,Math.floor(+$("manualPopulation").value||0));setPopulation(active,target);$("manualPopulation").value=S.people.filter(p=>p.ci===active).length;showToast(`👥 ${v.name} : ${S.people.filter(p=>p.ci===active).length} habitants`)};
$("add10Pop").onclick=()=>{addPopulation(active,10);editor()};
$("add100Pop").onclick=()=>{addPopulation(active,100);editor()};
$("remove10Pop").onclick=()=>{removePopulation(active,10);editor()};
$("remove100Pop").onclick=()=>{removePopulation(active,100);editor()};

$("applyScenarioPreset").onclick=()=>applyScenarioPreset($("scenarioPreset").value);
$("startScenario").onclick=()=>{
 let preset=$("scenarioPreset").value,civsN=clamp(+$("scenarioCivs").value||1,1,12),configs=scenarioCivConfigs();
 $("defaultCivCount").value=civsN;$("defaultWalls").value="none";
 reset();
 for(let i=0;i<S.civs.length;i++){
   let v=S.civs[i],cfg=configs[i]||presetCivProfile(preset,i,S.civs.length);
   Object.assign(v,{name:cfg.name,color:cfg.color,style:cfg.style,doctrine:cfg.doctrine,ideology:cfg.ideology||"mixed",avgIQ:cfg.avgIQ,agg:cfg.agg,coop:cfg.coop,disc:cfg.disc??v.disc,curiosity:cfg.curiosity??v.curiosity,fertility:cfg.fertility??v.fertility});
   v.leaderId=null;
   if(preset==="techrace"){v.curiosity=88;v.tech=600;v.science=260}
   if(preset==="warworld"){v.courage=85;v.disc=72}
   if(preset==="peaceful"){v.coop=Math.max(v.coop,88)}
   if(preset==="coldwar"){v.tech=1100;v.science=420;v.disc=82}
   if(preset==="empire"){v.tech=900;v.science=360;v.treasury=220;v.wealth=140}
   if(preset==="shattered")v.stability=58;
   if(preset==="cataclysm"){v.stability=55;v.foodSecurity=48}
   setPopulation(i,0);setPopulation(i,Math.max(0,cfg.population??(+$("scenarioPop").value||80)));assignHomes(i);ensureLeader(i,false);
 }
 let terrStyle=$("scenarioTerritoryStyle")?.value||"balanced";
 for(const city of S.cities){if(terrStyle==="compact")city.influenceScale=.82;else if(terrStyle==="wide")city.influenceScale=1.2;else city.influenceScale=1}
 if(($("scenarioWalls")?.value||"none")==="dividers")generateDividerWalls();else S.walls=[];
 if(preset==="warworld")for(let i=0;i<S.civs.length;i++)for(let j=i+1;j<S.civs.length;j++)declareWar(i,j,"Monde en guerre");
 if(preset==="coldwar"&&S.civs.length>=2){S.civs[0].relations["1"]=-82;S.civs[1].relations["0"]=-82}
 if(preset==="cataclysm")story.nextAutoDay=simDayIndex()+240;
 markTerritoryDirty();rebuildRoads();if(typeof rebuildTradeRoutes==="function")rebuildTradeRoutes();tabs();editor();fitWorld();showToast("🎮 Scénario lancé");
};


setPersonField("editFirst","first",String);
setPersonField("editLast","last",String);
setPersonField("editAge","age",v=>clamp(+v||0,0,120));
setPersonField("editSex","sex",String);
setPersonField("editRole","role",String);
setPersonField("editScale","scale",Number);
setPersonField("editSkin","skin",String);
setPersonField("editHair","hair",String);
setPersonField("editClothes","clothes",String);
setPersonField("editOutfitAccent","outfitAccent",String);
setPersonField("editOutfitStyle","outfitStyle",String);
setPersonField("editOutfitPattern","outfitPattern",String);
setPersonField("editHeadwear","headwear",String);
setPersonField("editHairStyle","hairStyle",String);
setPersonField("editLifeGoal","lifeGoal",String);
setPersonField("editAutonomy","autonomy",Number);
$("editCiv").onchange=()=>{if(selected?.type!=="person")return;let p=selected.obj,oldHome=findBuilding(p.home);if(oldHome)oldHome.residents=oldHome.residents.filter(id=>id!==p.id);p.ci=clamp(+$("editCiv").value,0,S.civs.length-1);p.clothes=S.civs[p.ci].color;p.home=null;p.cityId=nearestCity(p)?.id||null;p.armyId=null;assignHomes(p.ci);active=p.ci;tabs();editor();refreshSelectedPerson()};
const pRangeMap={IQ:"iq",Strength:"strength",Charisma:"charisma",Aggression:"aggression",Curiosity:"curiosity",Fertility:"fertility",Loyalty:"loyalty",Courage:"courage",Mood:"mood",Health:"hp",Education:"education",Influence:"influence",Ambition:"ambition"};
for(const [label,key] of Object.entries(pRangeMap)){
 $("edit"+label).oninput=()=>{if(selected?.type!=="person")return;let val=+$("edit"+label).value;selected.obj[key]=val;if(key==="iq")selected.obj.baseIQ=val;$("edit"+label+"V").textContent=Math.round(val)}
}
$("healPerson").onclick=()=>{if(selected?.type!=="person")return;selected.obj.hp=100;selected.obj.sick=false;selected.obj.hunger=100;selected.obj.hydration=100;selected.obj.mood=Math.max(selected.obj.mood,80);populatePersonEditor(selected.obj);detailPerson(selected.obj);showToast("❤️ PNJ soigné")};
$("rerollPerson").onclick=()=>{if(selected?.type!=="person")return;let p=selected.obj,v=S.civs[p.ci];p.iq=clamp(Math.round(v.avgIQ+rnd(-18,18)),55,165);p.baseIQ=p.iq;p.strength=Math.round(rnd(20,100));p.charisma=Math.round(rnd(20,100));p.aggression=clamp(Math.round(v.agg+rnd(-25,25)),1,100);p.curiosity=Math.round(rnd(10,100));p.fertility=Math.round(rnd(10,100));p.loyalty=Math.round(rnd(20,100));p.courage=Math.round(rnd(15,100));p.mood=Math.round(rnd(40,100));p.skin=pick(["#d9aa83","#c8946e","#a96f4f","#7b4b36","#e4b995"]);p.hair=pick(["#241912","#3a291f","#6b4d32","#b57b44","#d6b88b","#191919"]);p.outfitAccent=pick(["#d9c27a","#d8e1e5","#65452f","#9dc8d8","#a66b58"]);p.outfitStyle=pick(["auto","civil","worker","scholar","military","formal"]);p.outfitPattern=pick(["plain","trim","stripe","split"]);p.headwear=pick(["auto","none","cap","hood","hat"]);p.hairStyle=pick(["short","long","curly","mohawk","bald"]);populatePersonEditor(p);detailPerson(p);showToast("🎲 PNJ randomisé")};
$("duplicatePerson").onclick=()=>{if(selected?.type!=="person")return;let p=selected.obj,q=makePerson(p.ci,p.x+18,p.y+18,p.age);Object.assign(q,{first:p.first,last:p.last,sex:p.sex,role:p.role,iq:p.iq,baseIQ:p.baseIQ,strength:p.strength,charisma:p.charisma,aggression:p.aggression,curiosity:p.curiosity,fertility:p.fertility,loyalty:p.loyalty,courage:p.courage,mood:p.mood,scale:p.scale,skin:p.skin,hair:p.hair,clothes:p.clothes,outfitAccent:p.outfitAccent,outfitStyle:p.outfitStyle,outfitPattern:p.outfitPattern,headwear:p.headwear,hairStyle:p.hairStyle});S.people.push(q);showToast("👥 PNJ dupliqué")};
$("makeLeader").onclick=()=>{if(selected?.type!=="person")return;let p=selected.obj,e=eraIndex(S.civs[p.ci]);p.role=e===0?"Chef de tribu":e<=1?"Chef":e<=3?"Maire":"Président";p.charisma=Math.max(p.charisma,80);p.loyalty=Math.max(p.loyalty,75);p.influence=Math.max(p.influence||0,85);S.civs[p.ci].leaderId=p.id;p.fame=(p.fame||0)+15;p.clothes="#d0a744";worldEvent({type:"coup",title:`Nouveau dirigeant : ${pname(p)}`,text:`${pname(p)} prend la tête de ${S.civs[p.ci].name}.`,score:86,ci:p.ci,personId:p.id,x:p.x,y:p.y});populatePersonEditor(p);detailPerson(p);showToast("👑 Nouveau dirigeant")};

$("editBuildingName").oninput=()=>{if(selected?.type!=="building")return;selected.obj.name=$("editBuildingName").value||selected.obj.name;$("inspectorTitle").textContent=selected.obj.name};
$("editBuildingScale").onchange=()=>{if(selected?.type!=="building")return;selected.obj.scale=+$("editBuildingScale").value};
$("editBuildingRoof").oninput=()=>{if(selected?.type!=="building")return;selected.obj.roof=$("editBuildingRoof").value};

$("play").onclick=()=>S.run=true;$("pause").onclick=()=>S.run=false;
$("regen").onclick=()=>reset();
$("newRandomWorld").onclick=()=>reset();
$("regenSameSeed").onclick=()=>{let s=Number($("worldSeed").value);reset({seed:Number.isFinite(s)?s:seed,sameSeed:true})};
$("rerollResources").onclick=()=>{S.worldProfile=S.worldProfile||{};S.worldProfile.resourceRoll=(S.worldProfile.resourceRoll||0)+1;seedResources();SP.last=-1;rebuildStrategicZones(true);minimapDirty=true;showToast("⛏ Ressources et points stratégiques régénérés")};$("emptyOceanWorld").onclick=()=>{reset({blankOcean:true});showToast("🌊 Monde océanique vide : dessine ta carte")};
$("new").onclick=()=>{reset();showToast("🌍 Nouveau monde généré")};
function setCinema(on){document.body.classList.toggle("cinema",on)}
$("cinema").onclick=()=>setCinema(true);
$("cinemaExit").onclick=()=>setCinema(false);
$("cinemaSettings").onclick=()=>{setCinema(false);openInspector("worldTab")};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("cinema"))setCinema(false)});
$("fitWorld").onclick=fitWorld;
$("centerView").onclick=()=>{camera.x=W/2-c.width/(2*camera.zoom);camera.y=H/2-c.height/(2*camera.zoom);clampCamera()};
$("war").onclick=()=>{for(let i=0;i<S.civs.length;i++)for(let j=i+1;j<S.civs.length;j++)declareWar(i,j,"Guerre générale");let l=leaderForCiv(active);worldEvent({type:"war",title:"Guerre générale",text:"Toutes les grandes puissances entrent dans une période de conflit ouvert.",score:98,ci:active,personId:l?.id,x:l?.x,y:l?.y});showToast("⚔ Guerre globale")};
$("peace").onclick=()=>{S.wars=[];refreshGlobalWar();let l=leaderForCiv(active);worldEvent({type:"peace",title:"Retour à la paix",text:"Les affrontements cessent et les peuples commencent à reconstruire.",score:93,ci:active,personId:l?.id,x:l?.x,y:l?.y});showToast("☮ Paix")};
$("breakWalls").onclick=()=>{S.walls=[];SP.last=-1;markTerritoryDirty();worldEvent({type:"world",title:"Les murs tombent",text:"Les barrières qui séparaient les peuples sont détruites.",score:82,x:W/2,y:H/2})};
function createCivilizationAt(x,y,pop=45){
 if(S.civs.length>=16){showToast("🏛 Maximum : 16 civilisations");return null}
 if(["water","mountain"].includes(terrainAt(x,y).type)){showToast("🏳 Choisis une terre habitable");return null}
 let i=S.civs.length,v=civ(i);S.civs.push(v),city=createCity(i,x,y,null,true);
 for(let h=0;h<8;h++)addBuilding(i,h===0?"hall":h<=2?"farm":"hut",x+rnd(-140,140),y+rnd(-140,140),null,city.id);
 for(let k=0;k<pop;k++){let p=makePerson(i,x+rnd(-180,180),y+rnd(-180,180));p.cityId=city.id;S.people.push(p)}
 assignHomes(i);ensureLeader(i,false);rebuildRoads();rebuildTradeRoutes();markTerritoryDirty();active=i;tabs();editor();SP.last=-1;return v
}
$("addCiv").onclick=()=>{let [x,y]=foundingPoint(650);if(createCivilizationAt(x,y))showToast("🏛 Nouvelle civilisation")};
$("removeCiv").onclick=()=>{
 if(S.civs.length<=1){showToast("🏛 Le monde doit garder au moins une civilisation");return}
 let i=active;S.people=S.people.filter(p=>p.ci!==i);S.buildings=S.buildings.filter(b=>b.ci!==i);S.cities=S.cities.filter(c=>c.ci!==i);S.civs.splice(i,1);
 for(const p of S.people)if(p.ci>i)p.ci--;for(const b of S.buildings)if(b.ci>i)b.ci--;for(const c of S.cities){if(c.ci>i)c.ci--;if(c.originalCi===i)c.originalCi=c.ci;else if(c.originalCi>i)c.originalCi--;}
 for(let ci=0;ci<S.civs.length;ci++){S.civs[ci].id=ci;S.civs[ci].relations={}}
 S.wars=[];S.armies=[];refreshGlobalWar();rebuildRoads();rebuildTradeRoutes();markTerritoryDirty();SP.last=-1;active=0;tabs();editor()
};
$("spawnPerson").onclick=()=>{let [px,py]=landPoint(active);S.people.push(makePerson(active,px,py));assignHomes(active);showToast("👤 PNJ ajouté")};
$("spawnFamily").onclick=()=>{let city=S.cities.filter(c=>c.ci===active).sort((a,b)=>b.prosperity-a.prosperity)[0],[px,py]=city?[city.x+rnd(-100,100),city.y+rnd(-100,100)]:landPoint(active),a=makePerson(active,px,py,Math.floor(rnd(22,38))),b=makePerson(active,px+8,py+8,Math.floor(rnd(22,38)));b.sex=a.sex==="F"?"M":"F";a.partner=b.id;b.partner=a.id;a.relationship=b.relationship=85;a.cityId=b.cityId=city?.id||null;S.people.push(a,b);let h=addBuilding(active,eraIndex(S.civs[active])?"house":"hut",px+22,py+15,"Maison familiale",city?.id||null);a.home=b.home=h.id;h.residents.push(a.id,b.id);rebuildRoads();showToast("💞 Famille ajoutée")};
function disaster(d){
 let pow=+$("disasterPower").value,mx=rnd(0,W),my=rnd(0,H),affected=0;
 if(d==="famine"){let before=S.res.length;S.res=S.res.filter(r=>r.type!=="food"||Math.random()>pow/100);affected=before-S.res.length}
 if(d==="plague")for(const q of S.people)if(Math.random()<pow/150){q.sick=true;affected++}
 if(d==="meteor"||d==="nuke"){let rr=(d==="nuke"?280:160)+pow*5;for(const q of S.people)if((q.x-mx)**2+(q.y-my)**2<rr*rr){q.hp-=200;affected++}S.buildings=S.buildings.filter(b=>(b.x-mx)**2+(b.y-my)**2>=rr*rr)}
 if(d==="storm"){S.weather="Tempête";affected=S.people.length}
 if(d==="fire")for(const q of S.people)if(Math.random()<pow/500){q.hp-=rnd(10,60);affected++}
 let names={famine:"Famine",plague:"Grande épidémie",meteor:"Impact de météorite",nuke:"Catastrophe stratégique",storm:"Tempête majeure",fire:"Incendies généralisés"};
 worldEvent({type:d==="plague"?"disease":"disaster",title:names[d]||"Catastrophe",text:`L’événement touche directement ou indirectement ${affected} éléments du monde.`,score:d==="nuke"?99:d==="meteor"?94:82,x:mx,y:my});
 showToast("☄ "+(names[d]||d))
}
document.querySelectorAll(".disaster").forEach(b=>b.onclick=()=>disaster(b.dataset.disaster));

$("healAll").onclick=()=>{for(const p of S.people){p.hp=100;p.sick=false}showToast("❤️ Population soignée")};
$("feedAll").onclick=()=>{for(const p of S.people)p.hunger=100;showToast("🍲 Tout le monde est nourri")};
$("agePlus").onclick=()=>{for(const p of S.people)p.age=Math.min(120,p.age+10);showToast("⏩ +10 ans")};
$("ageMinus").onclick=()=>{for(const p of S.people)p.age=Math.max(0,p.age-10);showToast("⏪ −10 ans")};
$("boostScience").onclick=()=>{for(const v of S.civs)v.science+=500;showToast("🧪 Science +500")};
$("boostTech").onclick=()=>{for(const v of S.civs)v.tech+=500;showToast("⚙ Technologie +500")};
$("clearDisease").onclick=()=>{for(const p of S.people)p.sick=false;showToast("💊 Toutes les maladies supprimées")};



/* ---------- Minimap, population browser, camera follow ---------- */
const mini=$("minimap"),mctx=mini.getContext("2d"),miniBase=document.createElement("canvas"),mbctx=miniBase.getContext("2d");
miniBase.width=mini.width;miniBase.height=mini.height;
function rebuildMinimapTerrain(){
 mbctx.clearRect(0,0,miniBase.width,miniBase.height);
 let sx=miniBase.width/W,sy=miniBase.height/H,stepX=Math.max(1,Math.floor(COLS/120)),stepY=Math.max(1,Math.floor(ROWS/70));
 const col={water:"#31546b",plains:"#63845a",forest:"#345d45",mountain:"#77746d",desert:"#9b865a",snow:"#c4c9c7",sand:"#aa9668"};
 for(let gy=0;gy<ROWS;gy+=stepY)for(let gx=0;gx<COLS;gx+=stepX){
  let t=S.grid[gy*COLS+gx]?.type||"plains";mbctx.fillStyle=col[t]||"#55755a";mbctx.fillRect(gx*CELL*sx,gy*CELL*sy,CELL*stepX*sx+1,CELL*stepY*sy+1)
 }
 minimapDirty=false;
}
function drawMinimap(){
 if($("minimapWrap").classList.contains("hidden"))return;
 if(minimapDirty)rebuildMinimapTerrain();
 mctx.clearRect(0,0,mini.width,mini.height);mctx.drawImage(miniBase,0,0);
 let sx=mini.width/W,sy=mini.height/H;
 for(let i=0;i<S.civs.length;i++){
  let ps=S.people.filter(p=>p.ci===i);if(!ps.length)continue;
  mctx.fillStyle=S.civs[i].color;
  for(let k=0;k<ps.length;k+=Math.max(1,Math.floor(ps.length/90))){let p=ps[k];mctx.fillRect(p.x*sx,p.y*sy,2,2)}
 }
 for(const city of S.cities){mctx.fillStyle=S.civs[city.ci]?.color||'#fff';mctx.beginPath();mctx.arc(city.x*sx,city.y*sy,city.capital?3.3:2.3,0,Math.PI*2);mctx.fill()}
 if($("showStrategicZones")?.checked)for(const z of S.strategicZones||[]){mctx.fillStyle="#e0b655";let x=z.x*sx,y=z.y*sy;mctx.beginPath();mctx.moveTo(x,y-2.6);mctx.lineTo(x+2.6,y);mctx.lineTo(x,y+2.6);mctx.lineTo(x-2.6,y);mctx.closePath();mctx.fill()}
 let vw=c.width/camera.zoom,vh=c.height/camera.zoom;
 mctx.strokeStyle="#ffffff";mctx.lineWidth=1.2;mctx.strokeRect(camera.x*sx,camera.y*sy,vw*sx,vh*sy)
}
mini.addEventListener("pointerdown",e=>{
 let r=mini.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;
 camera.x=x-c.width/(2*camera.zoom);camera.y=y-c.height/(2*camera.zoom);clampCamera();followPersonId=null;document.body.classList.remove("following")
});
$("toggleMinimap").onclick=()=>$("minimapWrap").classList.toggle("hidden");

function centerOnPerson(p,zoom=1.0){
 if(!p)return;camera.zoom=clamp(Math.max(camera.zoom,zoom),camera.minZoom,camera.maxZoom);camera.x=p.x-c.width/(2*camera.zoom);camera.y=p.y-c.height/(2*camera.zoom);clampCamera()
}
function selectAndCenterPerson(p){
 detailPerson(p);centerOnPerson(p,.9);$("populationBrowser").classList.remove("open")
}
function renderPopulationBrowser(){
 let term=$("personSearch").value.trim().toLowerCase(),cf=+$("personCivFilter").value,rf=$("personRoleFilter").value;
 let arr=S.people.filter(p=>{
  if(cf>=0&&p.ci!==cf)return false;
  if(term&&!`${p.first} ${p.last} ${p.role}`.toLowerCase().includes(term))return false;
  if(rf==="leaders"&&!/Président|Chef|Maire/.test(p.role))return false;
  if(rf==="historical"&&personImportance(p)<65)return false;
  if(rf==="sick"&&!p.sick)return false;
  return true
 }).sort((a,b)=>personImportance(b)-personImportance(a));
 $("browserCount").textContent=`${arr.length} PNJ`;
 $("populationList").innerHTML=arr.slice(0,350).map(p=>`<div class="person-row" data-pid="${p.id}">
   <div class="avatar-dot" style="background:${p.clothes||S.civs[p.ci].color}">${/Président|Chef|Maire/.test(p.role)?"👑":"•"}</div>
   <div><b>${pname(p)}</b><small>${p.role} · ${S.civs[p.ci]?.name||"?"} · ${p.age} ans</small></div>
   <span class="importance">★${Math.round(personImportance(p))}</span>
 </div>`).join("")||'<div class="empty">Aucun PNJ correspondant.</div>';
}
function openPopulationBrowser(){
 $("personCivFilter").innerHTML='<option value="-1">Toutes civilisations</option>'+S.civs.map((v,i)=>`<option value="${i}">${v.name}</option>`).join("");
 $("populationBrowser").classList.add("open");renderPopulationBrowser()
}
$("showPopulation").onclick=openPopulationBrowser;
$("closePopulationBrowser").onclick=()=>$("populationBrowser").classList.remove("open");
$("personSearch").oninput=renderPopulationBrowser;$("personCivFilter").onchange=renderPopulationBrowser;$("personRoleFilter").onchange=renderPopulationBrowser;
$("populationList").onclick=e=>{let row=e.target.closest("[data-pid]");if(row){let p=findPerson(+row.dataset.pid);if(p)selectAndCenterPerson(p)}};
$("followPerson").onclick=()=>{if(selected?.type!=="person")return;followPersonId=selected.obj.id;document.body.classList.add("following");centerOnPerson(selected.obj,1.0);showToast(`🎥 Suivi de ${pname(selected.obj)}`)};
$("skipCinematic").onclick=()=>{if(story.cinematic){story.cinematic.end=0;updateStoryFrame()}};

async function autosaveIfNeeded(){
 if(!$("autoSave")?.checked||story.replayMode||Date.now()-lastAutosaveReal<45000)return;
 lastAutosaveReal=Date.now();
 try{await dbPut("autosave",fullSavePayload());$("autosaveState").textContent="💾 Sauvé";setTimeout(()=>{if($("autosaveState"))$("autosaveState").textContent="💾 Auto"},1800)}catch(e){$("autosaveState").textContent="⚠ Auto"}
}


function centerOnCity(city,zoom=.72){if(!city)return;camera.zoom=clamp(Math.max(camera.zoom,zoom),camera.minZoom,camera.maxZoom);camera.x=city.x-c.width/(2*camera.zoom);camera.y=city.y-c.height/(2*camera.zoom);clampCamera();followPersonId=null;document.body.classList.remove('following')}
function renderCityBrowser(){let cf=+$('cityCivFilter').value,arr=S.cities.filter(c=>cf<0||c.ci===cf).sort((a,b)=>b.population-a.population);$('cityBrowserCount').textContent=`${arr.length} ville${arr.length>1?'s':''}`;$('cityBrowserList').innerHTML=arr.map(city=>`<div class="city-row" data-cbid="${city.id}"><b>${city.capital?'★ ':''}${city.name}</b><small>${S.civs[city.ci]?.name||'?'} · ${city.specialization} · 👥 ${city.population} · ✨ ${Math.round(city.prosperity)}%</small><div class="city-bar"><i style="width:${clamp(city.prosperity,0,100)}%"></i></div></div>`).join('')||'<div class="empty">Aucune ville.</div>'}
function openCityBrowser(){$('cityCivFilter').innerHTML='<option value="-1">Toutes civilisations</option>'+S.civs.map((v,i)=>`<option value="${i}">${v.name}</option>`).join('');$('cityBrowser').classList.add('open');renderCityBrowser()}
$('showCities').onclick=openCityBrowser;$('closeCityBrowser').onclick=()=>$('cityBrowser').classList.remove('open');$('cityCivFilter').onchange=renderCityBrowser;$('cityBrowserList').onclick=e=>{let row=e.target.closest('[data-cbid]');if(row){let city=findCity(+row.dataset.cbid);if(city){detailCity(city);centerOnCity(city);$('cityBrowser').classList.remove('open')}}};
$('showSociety').onclick=()=>openInspector('societyTab');
$('foundCity').onclick=()=>{currentTool="citySeed";document.querySelectorAll(".tool[data-tool]").forEach(q=>q.classList.remove("active"));showToast("🏗 Clique sur la carte pour fonder la ville")};
$('toggleTerritories').onclick=()=>{$('showTerritories').checked=!$('showTerritories').checked};$('toggleRoads').onclick=()=>{$('showRoads').checked=!$('showRoads').checked};$('toggleTradeRoutes').onclick=()=>{$('showTradeRoutes').checked=!$('showTradeRoutes').checked};$('toggleStrategic').onclick=()=>{$('showStrategicZones').checked=!$('showStrategicZones').checked};$('toggleArmies').onclick=()=>{$('showArmies').checked=!$('showArmies').checked};


let statsMode="population";
function renderStatsPanel(){let cv=$('statsChart'),g=cv.getContext('2d'),hist=S.history||[];g.clearRect(0,0,cv.width,cv.height);g.fillStyle="#0b1519";g.fillRect(0,0,cv.width,cv.height);g.strokeStyle="rgba(255,255,255,.07)";g.lineWidth=1;for(let y=30;y<cv.height-20;y+=40){g.beginPath();g.moveTo(38,y);g.lineTo(cv.width-14,y);g.stroke()}if(hist.length>1){let vals=[];for(const h of hist)for(const q of h.civs)vals.push(q[statsMode]||0);let max=Math.max(1,...vals),minYear=hist[0].year,maxYear=hist.at(-1).year;for(let ci=0;ci<S.civs.length;ci++){g.strokeStyle=S.civs[ci].color;g.lineWidth=2.2;g.beginPath();let started=false;for(const h of hist){let q=h.civs[ci];if(!q)continue;let x=38+(h.year-minYear)/Math.max(1,maxYear-minYear)*(cv.width-58),y=cv.height-24-(q[statsMode]||0)/max*(cv.height-52);if(!started){g.moveTo(x,y);started=true}else g.lineTo(x,y)}g.stroke()}g.fillStyle="#76909a";g.font="10px system-ui";g.fillText(`0`,8,cv.height-24);g.fillText(`${Math.round(max)}`,8,28);g.fillText(`A${minYear}`,38,cv.height-8);g.fillText(`A${maxYear}`,cv.width-52,cv.height-8)}else{g.fillStyle="#738c96";g.font="13px system-ui";g.textAlign="center";g.fillText("Les courbes apparaîtront au fil des années simulées.",cv.width/2,cv.height/2)}
 let living=[...S.people].sort((a,b)=>personImportance(b)-personImportance(a)).slice(0,5).map(p=>({name:pname(p),role:p.role,importance:Math.round(personImportance(p)),alive:true,ci:p.ci})),dead=(S.legends||[]).slice(0,5).map(x=>({...x,alive:false}));let halls=[...living,...dead].sort((a,b)=>b.importance-a.importance).slice(0,7);$('hallOfFame').innerHTML=halls.map(h=>`<div class="hall-entry"><span><b>${h.alive?'●':'†'} ${h.name}</b><br>${h.role} · ${S.civs[h.ci]?.name||'ancienne civilisation'}</span><b>★${h.importance}</b></div>`).join('')||'<div class="empty">Aucune figure historique.</div>';let biggest=[...S.cities].sort((a,b)=>b.population-a.population)[0],rich=[...S.cities].sort((a,b)=>b.prosperity-a.prosperity)[0],oldest=S.cities.slice().sort((a,b)=>a.foundYear-b.foundYear)[0],topCiv=S.civs.map((v,i)=>({v,p:S.people.filter(p=>p.ci===i).length})).sort((a,b)=>b.p-a.p)[0];$('worldRecords').innerHTML=`<div class="record-entry"><span>Plus grande ville</span><b>${biggest?`${biggest.name} · ${biggest.population}`:'—'}</b></div><div class="record-entry"><span>Ville la plus prospère</span><b>${rich?`${rich.name} · ${Math.round(rich.prosperity)}%`:'—'}</b></div><div class="record-entry"><span>Plus vieille ville</span><b>${oldest?`${oldest.name} · A${oldest.foundYear}`:'—'}</b></div><div class="record-entry"><span>Puissance démographique</span><b>${topCiv?`${topCiv.v.name} · ${topCiv.p}`:'—'}</b></div><div class="record-entry"><span>Guerres actives</span><b>${S.wars.length}</b></div>`;$('statsSub').textContent=`${hist.length} années enregistrées · mode ${statsMode}`}
$('showStats').onclick=()=>{$('statsPanel').classList.add('open');renderStatsPanel()};$('closeStats').onclick=()=>$('statsPanel').classList.remove('open');document.querySelectorAll('.stats-mode').forEach(b=>b.onclick=()=>{document.querySelectorAll('.stats-mode').forEach(q=>q.classList.toggle('active',q===b));statsMode=b.dataset.stat;renderStatsPanel()});

/* ---------- Replay / save system ---------- */
function replaySnapshotData(){
 return {
  stamp:simStamp(),year:S.year,day:S.day,minute:S.minute,season:S.season,elapsedMinutes:S.elapsedMinutes,weather:S.weather,war:S.war,tick:S.tick,
  people:structuredClone(S.people),buildings:structuredClone(S.buildings),cities:structuredClone(S.cities),roads:structuredClone(S.roads),tradeRoutes:structuredClone(S.tradeRoutes||[]),strategicZones:structuredClone(S.strategicZones||[]),armies:structuredClone(S.armies),wars:structuredClone(S.wars),history:structuredClone(S.history||[]),legends:structuredClone(S.legends||[]),civs:structuredClone(S.civs),
  res:structuredClone(S.res),walls:structuredClone(S.walls)
 };
}
function captureReplaySnapshot(ev=null){
 if(!R.recording||story.replayMode)return;
 let last=R.snapshots.at(-1);if(last&&last.year===S.year&&last.day===S.day&&ev?.score<78)return;
 let snap=replaySnapshotData();snap.event=ev?{title:ev.title,text:ev.text,type:ev.type,score:ev.score,stamp:ev.stamp}:null;
 R.snapshots.push(snap);
 if(R.snapshots.length>140){R.snapshots.splice(1,1)}
 R.lastCaptureYear=S.year;updateReplayUI();
}
function maybePeriodicReplayCapture(){
 if(!R.recording||story.replayMode)return;let gap=speedValue()>=50?8:speedValue()>=25?5:2;
 if(S.year>=R.lastCaptureYear+gap&&S.day<4)captureReplaySnapshot(null)
}
function applyReplaySnapshot(snap){
 S.people=structuredClone(snap.people);S.buildings=structuredClone(snap.buildings);S.cities=structuredClone(snap.cities||[]);S.roads=structuredClone(snap.roads||[]);S.tradeRoutes=structuredClone(snap.tradeRoutes||[]);S.strategicZones=structuredClone(snap.strategicZones||[]);S.armies=structuredClone(snap.armies||[]);S.wars=structuredClone(snap.wars||[]);S.history=structuredClone(snap.history||[]);S.legends=structuredClone(snap.legends||[]);S.civs=structuredClone(snap.civs);S.res=structuredClone(snap.res);S.walls=structuredClone(snap.walls);refreshGlobalWar();
 S.year=snap.year;S.day=snap.day;S.minute=snap.minute;S.season=snap.season;S.elapsedMinutes=Number.isFinite(snap.elapsedMinutes)?snap.elapsedMinutes:calendarToMinutes();normalizeCalendarFromMinutes(S.elapsedMinutes);S.weather=snap.weather;S.tick=snap.tick;refreshGlobalWar();
 markTerritoryDirty();SP.last=-1;selected=null;active=Math.min(active,S.civs.length-1);tabs();editor();update();draw()
}
function updateReplayUI(){
 let n=R.snapshots.length;$("replayInfo").textContent=`Replay ${R.recording?"actif":"en pause"} · ${n} point${n>1?"s":""} enregistré${n>1?"s":""}`;
 $("replayPanelInfo").textContent=n?`${n} points · de ${R.snapshots[0].stamp} à ${R.snapshots.at(-1).stamp}`:"Aucun replay";
 $("replayTimeline").max=Math.max(0,n-1);$("replayTimeline").value=Math.min(+$("replayTimeline").value,n-1);
 $("replayMarkers").innerHTML=R.snapshots.map((s,i)=>`<button class="replay-marker ${s.event?.score>=90?"historic":s.event?.score>=78?"major":""}" data-ridx="${i}" title="${s.event?.title||s.stamp}"></button>`).join("");
}
function enterReplay(i=0){
 if(!R.snapshots.length){showToast("🎬 Aucun replay enregistré");return}
 if(!story.replayMode)R.liveState=replaySnapshotData();
 story.replayMode=true;S.run=false;R.playing=false;$("replayPlay").textContent="▶ Rejouer";$("replayPanel").classList.add("open");showReplayIndex(i)
}
function showReplayIndex(i){
 i=clamp(Math.floor(i),0,R.snapshots.length-1);$("replayTimeline").value=i;applyReplaySnapshot(R.snapshots[i]);
 let e=R.snapshots[i].event;$("replayEventCard").innerHTML=e?`<b>${eventIcon(e.type)} ${e.title}</b><br>${e.text}<br><small>${e.stamp}</small>`:`<b>Point de contrôle</b><br>${R.snapshots[i].stamp}`
}
function exitReplay(){
 clearInterval(story.replayTimer);R.playing=false;if(R.liveState)applyReplaySnapshot(R.liveState);story.replayMode=false;R.liveState=null;$("replayPanel").classList.remove("open")
}
function toggleReplayPlay(){
 if(!R.snapshots.length)return;R.playing=!R.playing;$("replayPlay").textContent=R.playing?"⏸ Pause":"▶ Rejouer";clearInterval(story.replayTimer);
 if(R.playing)story.replayTimer=setInterval(()=>{let i=+$("replayTimeline").value;if(i>=R.snapshots.length-1){R.playing=false;clearInterval(story.replayTimer);$("replayPlay").textContent="▶ Rejouer";return}showReplayIndex(i+1)},900)
}
function openDB(){return new Promise((resolve,reject)=>{let r=indexedDB.open("ai-world-v20",1);r.onupgradeneeded=()=>r.result.createObjectStore("saves");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function dbPut(key,val){let db=await openDB();return new Promise((res,rej)=>{let tx=db.transaction("saves","readwrite");tx.objectStore("saves").put(val,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function dbGet(key){let db=await openDB();return new Promise((res,rej)=>{let tx=db.transaction("saves","readonly"),q=tx.objectStore("saves").get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
function fullSavePayload(){return {version:20,seed,settings:{sea:$("seaLevel").value,relief:$("relief").value,humidity:$("humidity").value,temp:$("temperature").value,rivers:$("rivers").value,shape:$("worldShape")?.value,biomeDiversity:$("biomeDiversity")?.value,mountains:$("mountainDensity")?.value,forests:$("forestDensity")?.value,deserts:$("desertDensity")?.value,resourceClustering:$("resourceClustering")?.value,strategicImpact:$("strategicImpact")?.value,borderRoughness:$("borderRoughness")?.value,environmentImpact:$("environmentImpact")?.value},S:structuredClone(S),history:structuredClone(story.worldEvents),replay:{snapshots:structuredClone(R.snapshots),events:structuredClone(R.events)}}}
function restorePayload(data){
 if(!data?.S)return false;seed=data.seed??seed;S=data.S;SP.last=-1;SP.people.clear();SP.res.clear();SP.buildings.clear();SP.walls.clear();ensureElapsedTime();normalizeCalendarFromMinutes(S.elapsedMinutes);S.cities=S.cities||[];for(const c of S.cities){c.originalCi=c.originalCi??c.ci;c.resistance=c.resistance??0;c.influenceScale=c.influenceScale??1}markTerritoryDirty();S.roads=S.roads||[];S.tradeRoutes=S.tradeRoutes||[];S.strategicZones=S.strategicZones||[];S.lastDemographyDay=Number.isFinite(S.lastDemographyDay)?S.lastDemographyDay:simDayIndex();S.armies=S.armies||[];S.wars=S.wars||[];S.history=S.history||[];S.legends=S.legends||[];S.crises=S.crises||[];for(let i=0;i<S.civs.length;i++){let old=S.civs[i]||{},d=civ(i);if(old.avgIQ==null&&old.intel!=null)old.avgIQ=clamp(Math.round(75+old.intel*.5),70,145);S.civs[i]={...d,...old,ideology:old.ideology||"mixed",stock:{...d.stock,...(old.stock||{})},relations:old.relations||{}}}for(const city of S.cities){city.stock=city.stock||{};city.stock.water=city.stock.water??35}for(const p of S.people){if(p.iq==null){let legacy=p.intelligence??50;p.iq=clamp(Math.round(70+legacy*.6),55,165)}p.baseIQ=p.baseIQ??p.iq;p.hydration=p.hydration??82;p.environmentAdapt=p.environmentAdapt??0;p.outfitAccent=p.outfitAccent||"#d9c27a";p.outfitStyle=p.outfitStyle||"auto";p.outfitPattern=p.outfitPattern||"plain";p.headwear=p.headwear||"auto";p.nextFamilyCheckDay=p.nextFamilyCheckDay??(simDayIndex()+Math.floor(rnd(5,35)));p.lastCareerDay=p.lastCareerDay??simDayIndex()}for(const z of S.strategicZones||[])z.shape=z.shape||zoneShapeFor(z.id,z.value);S.worldProfile=S.worldProfile||{shape:"legacy",label:"Ancien monde",resourceRoll:0};S.lastLifeDevelopmentDay=Number.isFinite(S.lastLifeDevelopmentDay)?S.lastLifeDevelopmentDay:simDayIndex();S.lastNationCheckDay=Number.isFinite(S.lastNationCheckDay)?S.lastNationCheckDay:simDayIndex();ensureGovernments();refreshGlobalWar();if(S.grid?.length){let ratio=7200/4200;let cells=S.grid.length;let approxRows=Math.max(1,Math.round(Math.sqrt(cells/ratio))),approxCols=Math.max(1,Math.round(cells/approxRows));if(approxRows*approxCols===cells){ROWS=approxRows;COLS=approxCols;W=COLS*CELL;H=ROWS*CELL;$("mapSizeLabel").textContent=`${W}×${H}`}}minimapDirty=true;markTerrainCacheDirty();story.worldEvents=data.history||[];R.snapshots=data.replay?.snapshots||[];R.events=data.replay?.events||[];R.recording=$("recordReplay").checked;R.lastCaptureYear=S.year;
 selected=null;active=0;renderWorldJournal();tabs();editor();update();fitWorld();draw();updateReplayUI();return true
}
$("saveSimulation").onclick=async()=>{try{await dbPut("latest",fullSavePayload());showToast("💾 Simulation sauvegardée")}catch(e){console.error(e);showToast("⚠ Sauvegarde impossible")}};
$("loadSimulation").onclick=async()=>{try{let d=await dbGet("latest")||await dbGet("autosave");if(d&&restorePayload(d))showToast("📂 Simulation chargée");else showToast("Aucune sauvegarde")}catch(e){console.error(e);showToast("⚠ Chargement impossible")}};
$("recordReplay").onchange=()=>{R.recording=$("recordReplay").checked;if(R.recording)captureReplaySnapshot(null);updateReplayUI()};
$("openReplay").onclick=()=>enterReplay(Math.max(0,R.snapshots.length-1));
$("closeReplay").onclick=()=>$("replayPanel").classList.remove("open");
$("replayExit").onclick=exitReplay;
$("replayPlay").onclick=toggleReplayPlay;
$("replayPrev").onclick=()=>showReplayIndex(+$("replayTimeline").value-1);
$("replayNext").onclick=()=>showReplayIndex(+$("replayTimeline").value+1);
$("replayTimeline").oninput=()=>{if(!story.replayMode)enterReplay(+$("replayTimeline").value);else showReplayIndex(+$("replayTimeline").value)};
$("replayMarkers").onclick=e=>{let b=e.target.closest("[data-ridx]");if(b){if(!story.replayMode)enterReplay(+b.dataset.ridx);else showReplayIndex(+b.dataset.ridx)}};
$("exportReplay").onclick=()=>{
 let data={version:20,type:"AIWorldReplay",created:new Date().toISOString(),seed,history:story.worldEvents,snapshots:R.snapshots};
 let blob=new Blob([JSON.stringify(data)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`aiworld-replay-A${S.year}.aiworld`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast("📤 Replay exporté")
};
$("importReplay").onchange=async e=>{let f=e.target.files?.[0];if(!f)return;try{let d=JSON.parse(await f.text());if(!Array.isArray(d.snapshots))throw Error("format");R.snapshots=d.snapshots;story.worldEvents=d.history||story.worldEvents;renderWorldJournal();updateReplayUI();enterReplay(0);showToast("📥 Replay importé")}catch(err){showToast("⚠ Replay invalide")}e.target.value=""};
$("journalImportance").onchange=renderWorldJournal;$("eventFrequency").onchange=()=>scheduleNextAutomaticEvent(simDayIndex());$("performanceMode").onchange=()=>{UI_CACHE.techKey="";update()};
document.querySelectorAll(".life-tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".life-tab").forEach(q=>q.classList.toggle("active",q===b));document.querySelectorAll(".life-content").forEach(q=>q.classList.toggle("active",q.id===b.dataset.life))});

document.querySelectorAll(".cat").forEach(b=>b.onclick=()=>{document.querySelectorAll(".cat").forEach(q=>q.classList.remove("active"));document.querySelectorAll(".tool-row").forEach(q=>q.classList.remove("active"));b.classList.add("active");$(b.dataset.cat).classList.add("active")});
document.querySelectorAll(".tool[data-tool]").forEach(b=>b.onclick=()=>{currentTool=b.dataset.tool;document.querySelectorAll(".tool[data-tool]").forEach(q=>q.classList.remove("active"));b.classList.add("active")});
document.querySelectorAll(".it").forEach(b=>b.onclick=()=>openInspector(b.dataset.itab));$("closeInspector").onclick=()=>$("inspector").classList.remove("open");$("showLog").onclick=()=>$("logPanel").classList.add("open");$("closeLog").onclick=()=>$("logPanel").classList.remove("open");$("showWorld").onclick=()=>openInspector("worldTab");$("showCiv").onclick=()=>openInspector("civTab");$("showSelected").onclick=()=>openInspector("detailTab");$("openCiv").onclick=()=>openInspector("civTab");
for(const [id,out,suf] of [["seaLevel","seaLevelV","%"],["relief","reliefV","%"],["humidity","humidityV","%"],["temperature","temperatureV","%"],["rivers","riversV",""],["resourceDensity","resourceDensityV","%"],["biomeDiversity","biomeDiversityV","%"],["mountainDensity","mountainDensityV","%"],["forestDensity","forestDensityV","%"],["desertDensity","desertDensityV","%"],["resourceClustering","resourceClusteringV","%"],["strategicImpact","strategicImpactV","%"],["borderRoughness","borderRoughnessV","%"],["environmentImpact","environmentImpactV","%"],["founderThreshold","founderThresholdV",""],["founderCharismaGap","founderCharismaGapV",""],["founderInfluence","founderInfluenceV",""],["founderAmbition","founderAmbitionV",""],["founderChance","founderChanceV","%"],["npcVisualScale","npcVisualScaleV","%"],["buildingVisualScale","buildingVisualScaleV","%"],["textureDetail","textureDetailV","%"],["weatherRate","weatherRateV","%"],["disasterPower","disasterPowerV",""]]){let f=()=>$(out).textContent=$(id).value+suf;$(id).oninput=f;f()}


$("legendToggle").onclick=()=>{$("mapLegend").classList.toggle("open")};
$("legendClose").onclick=()=>$("mapLegend").classList.remove("open");

$("worldScale").onchange=()=>{
 const s=+$("worldScale").value,w=Math.round(7200*s),h=Math.round(4200*s);
 $("mapSizeLabel").textContent=`${w}×${h}`;
 showToast(`🗺 Taille choisie : ${w}×${h} · régénère le monde pour l'appliquer`);
};
$("defaultCivCount").onchange=()=>{$("defaultCivCount").value=clamp(+$("defaultCivCount").value||1,1,12)};
$("scenarioCivs").onchange=()=>{$("scenarioCivs").value=clamp(+$("scenarioCivs").value||1,1,12);renderScenarioCivSetup(false)};
$("scenarioCivs").addEventListener("input",()=>renderScenarioCivSetup(false));
$("scenarioPreset").addEventListener("change",()=>renderScenarioCivSetup(true));
$("randomizeScenarioCivs").onclick=randomizeScenarioCivilizations;
renderScenarioCivSetup(true);


function addWallPoint(x,y){
 if(x<0||y<45||x>W||y>H)return;
 for(let i=Math.max(0,S.walls.length-120);i<S.walls.length;i++){let w=S.walls[i];if((w.x-x)**2+(w.y-y)**2<11*11)return}
 S.walls.push({x,y});paint.changed=true
}
function paintWallLine(x1,y1,x2,y2,brush=1){
 let d=Math.hypot(x2-x1,y2-y1),steps=Math.max(1,Math.ceil(d/15));
 for(let i=0;i<=steps;i++){let t=i/steps,x=lerp(x1,x2,t),y=lerp(y1,y2,t);for(let k=0;k<brush;k++){let off=(k-(brush-1)/2)*9;addWallPoint(x+off,y)}}
}
function eraseAt(x,y,brush=1){
 let rr=brush*55,rr2=rr*rr,wl=S.walls.length,rl=S.res.length;S.walls=S.walls.filter(w=>(w.x-x)**2+(w.y-y)**2>rr2);S.res=S.res.filter(q=>(q.x-x)**2+(q.y-y)**2>rr2);if(S.walls.length!==wl||S.res.length!==rl)paint.changed=true
}

/* Mouse camera: right-drag or middle-drag. Wheel zooms around cursor. */
c.addEventListener("contextmenu",e=>e.preventDefault());
c.addEventListener("pointerdown",e=>{
 if(e.button===1||e.button===2){drag.on=true;drag.lastX=e.clientX;drag.lastY=e.clientY;c.setPointerCapture(e.pointerId);return}
 let {x:wx,y:wy}=screenToWorld(e.clientX,e.clientY),br=+$("brush").value,t=currentTool;
 if(t==="civSeed"){if(createCivilizationAt(wx,wy)){currentTool="select";showToast("🏳 Civilisation fondée ici")}return}
 if(t==="citySeed"){
   let v=S.civs[active];if(!v)return;if((v.treasury||0)<30){showToast("🏙 Trésor insuffisant");return}
   if(["water","mountain"].includes(terrainAt(wx,wy).type)){showToast("🏙 Terrain non constructible");return}
   let near=nearestCityXY(wx,wy,active);if(near&&Math.hypot(wx-near.x,wy-near.y)<360){showToast("🏙 Trop près d’une autre ville");return}
   let city=createCity(active,wx,wy,null,false);addBuilding(active,eraIndex(v)>=2?"hall":"hut",wx,wy,"Centre de "+city.name,city.id);addBuilding(active,"farm",wx+rnd(-95,95),wy+rnd(-95,95),null,city.id);for(let h=0;h<2;h++)addBuilding(active,"hut",wx+rnd(-80,80),wy+rnd(-80,80),null,city.id);v.treasury-=30;rebuildRoads();rebuildTradeRoutes();markTerritoryDirty();worldEvent({type:"city",title:`Fondation de ${city.name}`,text:`${v.name} fonde ${city.name} à l'emplacement choisi par le joueur.`,score:72,ci:active,x:wx,y:wy,personId:leaderForCiv(active)?.id});detailCity(city);currentTool="select";showToast(`🏙 ${city.name} fondée`);return
 }
 if(t==="select"){let nearP=null,pd=(34/camera.zoom)**2;for(const p of S.people){let d=(p.x-wx)**2+(p.y-wy)**2;if(d<pd){pd=d;nearP=p}}if(nearP){active=nearP.ci;tabs();editor();detailPerson(nearP);return}let nearB=null,bd=(46/camera.zoom)**2;for(const b of S.buildings){let d=(b.x-wx)**2+(b.y-wy)**2;if(d<bd){bd=d;nearB=b}}if(nearB){active=nearB.ci;tabs();editor();detailBuilding(nearB);return}let city=S.cities.filter(q=>(q.x-wx)**2+(q.y-wy)**2<q.radius*q.radius*.16).sort((a,b)=>Math.hypot(a.x-wx,a.y-wy)-Math.hypot(b.x-wx,b.y-wy))[0];if(city){active=city.ci;tabs();editor();detailCity(city)}return}
 if(["food","wood","ore","oil"].includes(t)){for(let i=0;i<br*8;i++)S.res.push({type:t,x:wx+rnd(-br*28,br*28),y:wy+rnd(-br*28,br*28)});return}
 if(t==="wall"){paint.on=true;paint.changed=false;paint.tool="wall";paint.lastX=wx;paint.lastY=wy;paintWallLine(wx,wy,wx,wy,br);return}
 if(t==="erase"){paint.on=true;paint.changed=false;paint.tool="erase";paint.lastX=wx;paint.lastY=wy;eraseAt(wx,wy,br);return}
 if(["water","plains","forest","mountain","desert","savanna","swamp","tundra","snow"].includes(t)){let gx=Math.floor(wx/CELL),gy=Math.floor(wy/CELL);for(let dy=-br;dy<=br;dy++)for(let dx=-br;dx<=br;dx++){let xx=gx+dx,yy=gy+dy;if(xx>=0&&yy>=0&&xx<COLS&&yy<ROWS&&dx*dx+dy*dy<=br*br)S.grid[yy*COLS+xx].type=t}minimapDirty=true;markTerrainCacheDirty();markTerritoryDirty()}
});
c.addEventListener("pointermove",e=>{
 if(paint.on){
   let pos=screenToWorld(e.clientX,e.clientY),br=+$("brush").value;
   if(paint.tool==="wall")paintWallLine(paint.lastX,paint.lastY,pos.x,pos.y,br);else if(paint.tool==="erase")eraseAt(pos.x,pos.y,br);
   paint.lastX=pos.x;paint.lastY=pos.y;return
 }
 if(!drag.on)return;
 let dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY,rect=c.getBoundingClientRect();
 camera.x-=dx*(c.width/rect.width)/camera.zoom;camera.y-=dy*(c.height/rect.height)/camera.zoom;
 drag.lastX=e.clientX;drag.lastY=e.clientY;clampCamera();
});
function finishPaint(){if(paint.changed){SP.last=-1;markTerritoryDirty();minimapDirty=true}paint.on=false;paint.changed=false}
c.addEventListener("pointerup",()=>{drag.on=false;finishPaint()});
c.addEventListener("pointercancel",()=>{drag.on=false;finishPaint()});
c.addEventListener("wheel",e=>{
 e.preventDefault();let before=screenToWorld(e.clientX,e.clientY),factor=e.deltaY<0?1.12:.89,newZoom=clamp(camera.zoom*factor,camera.minZoom,camera.maxZoom);
 let rect=c.getBoundingClientRect(),cx=(e.clientX-rect.left)/rect.width*c.width,cy=(e.clientY-rect.top)/rect.height*c.height;
 camera.zoom=newZoom;camera.x=before.x-cx/camera.zoom;camera.y=before.y-cy/camera.zoom;clampCamera();
},{passive:false});


const HUD_INFO={
 map:{icon:"🌍",title:"Taille du monde",text:"Dimensions totales de la carte. Plus la carte est grande, plus une vue globale doit afficher d'éléments.",value:()=>`${W} × ${H} · ${COLS}×${ROWS} cases`},
 population:{icon:"👥",title:"Population mondiale",text:"Nombre total de PNJ vivants, toutes civilisations confondues.",value:()=>`${S.people.length} habitants`},
 buildings:{icon:"🏘",title:"Bâtiments",text:"Logements, fermes, hôpitaux, bases militaires, laboratoires, usines et autres constructions.",value:()=>`${S.buildings.length} bâtiments`},
 civilizations:{icon:"🏛",title:"Civilisations / pays",text:"Nombre d'États actuellement présents. Des pays peuvent aussi naître par sécession.",value:()=>`${S.civs.length} civilisation${S.civs.length>1?"s":""}`},
 cities:{icon:"🏙",title:"Villes",text:"Centres urbains qui produisent, stockent des ressources, défendent leur territoire et peuvent être conquis.",value:()=>`${S.cities.length} villes`},
 armies:{icon:"🛡",title:"Armées",text:"Formations militaires organisées : garnisons et armées de campagne.",value:()=>`${S.armies.length} armée${S.armies.length>1?"s":""}`},
 war:{icon:"⚔",title:"Guerres",text:"État des conflits entre civilisations.",value:()=>S.wars.length?`${S.wars.length} guerre${S.wars.length>1?"s":""} active${S.wars.length>1?"s":""}`:"Paix mondiale"},
 story:{icon:"🎬",title:"Histoire automatique",text:"Suit les événements importants et gère le journal historique et les cinématiques.",value:()=>story.cinematic?"Cinématique en cours":`${story.worldEvents.length} événements enregistrés`},
 performance:{icon:"⚡",title:"Performance",text:"Mode de calcul/rendu. En vue très éloignée, le jeu utilise maintenant un terrain en cache et des PNJ/bâtiments simplifiés.",value:()=>`${$("performanceMode")?.value||"auto"} · zoom ${camera.zoom.toFixed(2)}`}
};
function showHudInfo(el){
 let info=HUD_INFO[el?.dataset?.hudInfo],box=$("hudInfoTooltip");if(!info||!box)return;
 box.innerHTML=`<div class="hud-tip-head"><span class="hud-tip-icon">${info.icon}</span><b>${info.title}</b></div><div>${info.text}</div><div class="hud-tip-value">${info.value()}</div><small>Survole un autre symbole pour voir sa signification.</small>`;
 let wr=document.querySelector(".world-wrap").getBoundingClientRect(),r=el.getBoundingClientRect(),left=clamp(r.left-wr.left+r.width/2-122,8,wr.width-253),top=r.bottom-wr.top+8;
 box.style.left=`${left}px`;box.style.top=`${top}px`;box.classList.add("show")
}
function hideHudInfo(){$("hudInfoTooltip")?.classList.remove("show")}
document.querySelectorAll(".sandbox-strip [data-hud-info]").forEach(el=>{el.addEventListener("mouseenter",()=>showHudInfo(el));el.addEventListener("mouseleave",hideHudInfo);el.addEventListener("focus",()=>showHudInfo(el));el.addEventListener("blur",hideHudInfo)});

function updateMapTooltip(e){
 let box=$("mapTooltip");if(!box||!$("showHoverInfo")?.checked||drag.on||paint.on||document.body.classList.contains("cinema")){box?.classList.remove("show");return}
 let {x,y}=screenToWorld(e.clientX,e.clientY);if(x<0||y<0||x>W||y>H){box.classList.remove("show");return}
 let terr=terrainAt(x,y),own=territoryOwnerAt(x,y),owner=own.ci>=0?S.civs[own.ci]:null;
 let city=S.cities.filter(q=>Math.hypot(q.x-x,q.y-y)<Math.max(120,q.radius*.35)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0],zone=(S.strategicZones||[]).filter(z=>Math.hypot(z.x-x,z.y-y)<55+z.value*.18).sort((a,b)=>b.value-a.value)[0];
 let biome={water:"Eau",sand:"Plage",plains:"Plaine",forest:"Forêt",mountain:"Montagne",desert:"Désert",snow:"Neige"}[terr.type]||terr.type;
 box.innerHTML=`<b>${zone?`${strategicIcon(zone.type)} ${strategicTypeLabel(zone.type)}`:city?`${city.capital?"★ ":""}${city.name}`:biome}</b>${owner?`<span class="owner" style="color:${owner.color}">${own.contested?"⚔ Frontière contestée · ":""}${owner.name}</span><br>`:`<small>Terre non revendiquée</small><br>`}<small>${zone?`Valeur stratégique ${zone.value}/100 · ${zone.owner!=null?`contrôlée par ${S.civs[zone.owner]?.name}`:"neutre"}`:city?`👥 ${city.population} · ✨ ${Math.round(city.prosperity)}% · 🛡 ${Math.round(city.defense)}${city.resistance>20?` · ✊ ${Math.round(city.resistance)}%`:""}`:`Relief ${Math.round((terr.elev||0)*100)} · humidité ${Math.round((terr.m||0)*100)}%`}</small>`;
 let rect=c.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;box.style.left=`${clamp(mx+14,8,rect.width-260)}px`;box.style.top=`${clamp(my+14,8,rect.height-90)}px`;box.classList.add("show")
}
c.addEventListener("pointermove",e=>{if(!drag.on)updateMapTooltip(e)});
c.addEventListener("pointerleave",()=>$("mapTooltip")?.classList.remove("show"));
window.addEventListener("keydown",e=>{
 if(["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName))return;
 if(e.code==="Space"){e.preventDefault();S.run=!S.run;$("play").classList.toggle("active",S.run);$("pause").classList.toggle("active",!S.run)}
 if(e.key==="f"||e.key==="F")fitWorld();
 if(e.key==="Escape"){currentTool="select";followPersonId=null;document.body.classList.remove("following");$("mapTooltip")?.classList.remove("show")}
 if(["1","2","3","4","5"].includes(e.key)){let vals=["1","5","10","25","100"],v=vals[+e.key-1];$("speed").value=v;showToast(`⚡ Vitesse ×${v}`)}
});

function loop(){updateStoryFrame();updateDirector();if(S.run&&!story.replayMode){let n=story.cinematic?1:+$("speed").value;for(let i=0;i<n;i++)tick()}update();autosaveIfNeeded();draw();requestAnimationFrame(loop)}
$("worldSeed").value=Math.floor(seed);reset({seed:+$("worldSeed").value});loop();
})();