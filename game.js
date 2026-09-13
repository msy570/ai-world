(()=>{
const c=document.querySelector("#c"),ctx=c.getContext("2d");
ctx.imageSmoothingEnabled=true;

const W=7200,H=4200,CELL=40,COLS=Math.ceil(W/CELL),ROWS=Math.ceil(H/CELL);
const COLORS=["#4f8fd8","#d85b53","#62ad69","#d2a34d","#9a70d0","#49aaa5","#d47caf","#9b795b"];
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const lerp=(a,b,t)=>a+(b-a)*t, smooth=t=>t*t*(3-2*t);

let currentTool="select",active=0,selected=null,seed=Math.random()*99999,idSeq=1,toastTimer=null;
let camera={x:0,y:0,zoom:.25,minZoom:.16,maxZoom:2.1};
let drag={on:false,lastX:0,lastY:0};

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
let S;

function showToast(t){let e=$("eventToast");e.textContent=t;e.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),1700)}
function civ(i){return {id:i,name:i===0?"Savants":i===1?"Barbares":"Peuple "+(i+1),color:COLORS[i],style:"balanced",targetPopulation:100,populationCap:500,birthRate:1,ageProfile:"balanced",intel:i?25:88,agg:i?88:20,disc:i?38:78,curiosity:i?30:90,coop:i?35:75,fertility:55,courage:i?90:55,science:0,tech:0,military:0,wealth:50,cities:1,kills:0,discoveries:[]}}
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
 let intelligence=clamp(Math.round(v.intel+rnd(-22,22)),1,100);
 let strength=clamp(Math.round(50+rnd(-25,25)),1,100),charisma=clamp(Math.round(50+rnd(-30,30)),1,100);
 let aggression=clamp(Math.round(v.agg+rnd(-25,25)),1,100),curiosity=clamp(Math.round(v.curiosity+rnd(-25,25)),1,100);
 let fertility=clamp(Math.round(v.fertility+rnd(-25,25)),1,100),health=clamp(Math.round(75+rnd(-15,25)),30,100);
 return {id:idSeq++,ci,x:x0??rnd(ci*band+80,(ci+1)*band-80),y:y0??rnd(120,H-100),vx:rnd(-1,1),vy:rnd(-1,1),
  hp:health,hunger:rnd(65,100),age:age??ageForProfile(v.ageProfile||"balanced"),sex,role:roleFor(v),sick:false,cool:0,
  first:pick(sex==="M"?firstNamesM:firstNamesF),last:pick(lastNames),intelligence,strength,charisma,aggression,curiosity,fertility,
  loyalty:clamp(Math.round(60+rnd(-25,30)),1,100),courage:clamp(Math.round(v.courage+rnd(-25,25)),1,100),
  partner:null,home:null,children:[],parents:[...parents],pregnant:0,pregnancyPartner:null,relationship:0,mood:clamp(Math.round(rnd(45,90)),1,100),
  generation:parents.length?1:0,
  journal:[],memories:[],fame:0,influence:clamp(Math.round(charisma*.55+intelligence*.25+rnd(0,20)),1,100),
  ambition:clamp(Math.round(rnd(15,100)),1,100),rallyLeader:null,rallyUntil:0,
  scale:1,
  skin:pick(["#d9aa83","#c8946e","#a96f4f","#7b4b36","#e4b995"]),
  hair:pick(["#241912","#3a291f","#6b4d32","#b57b44","#d6b88b","#191919"]),
  clothes:v.color,
  hairStyle:pick(["short","short","long","curly","bald"])
 };
}
function pname(p){return `${p.first} ${p.last}`}
function ageForProfile(profile){
 if(profile==="young")return Math.floor(rnd(0,35));
 if(profile==="adult")return Math.floor(rnd(18,50));
 if(profile==="mixed")return Math.floor(rnd(0,82));
 return Math.floor(rnd(8,70));
}
function civStyleBonus(v,kind){
 if(v.style==="science"&&kind==="science")return 1.22;
 if(v.style==="military"&&kind==="military")return 1.22;
 if(v.style==="wealth"&&kind==="wealth")return 1.20;
 if(v.style==="nature"&&kind==="fertility")return 1.15;
 return 1;
}
let story={cinematic:null,bubbles:[],lastAutoDay:0,nextAutoDay:0,worldEvents:[],replayMode:false,replayTimer:null};
let R={recording:true,snapshots:[],events:[],lastCaptureYear:0,liveState:null,playing:false};

function simStamp(){return `A${S.year} J${S.day}`}
function simDayIndex(){return (S.year-1)*360+S.season*90+S.day}
function importanceLabel(score){return score>=90?"HISTORIQUE":score>=78?"MAJEUR":"IMPORTANT"}
function eventIcon(type){
 return ({war:"⚔",peace:"🕊",era:"🏛",tech:"💡",disaster:"🌪",disease:"🦠",coup:"👑",death:"☠",birth:"👶",
 speech:"📣",migration:"🧳",economy:"📉",city:"🏙",family:"💞",world:"🌍"})[type]||"◆";
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
function worldEvent(ev){
 ev={type:"world",title:"Événement",text:"",score:50,ci:null,x:null,y:null,personId:null,speech:null,...ev,stamp:simStamp(),year:S.year,day:S.day,simDay:simDayIndex()};
 story.worldEvents.push(ev);if(story.worldEvents.length>500)story.worldEvents.shift();
 if(ev.personId){let p=findPerson(ev.personId);if(p){p.fame=(p.fame||0)+Math.max(1,(ev.score-55)/15);addPersonEvent(p,ev.title,ev.text,ev.score,[ev.type])}}
 renderWorldJournal();
 if(R.recording&&ev.score>=55){R.events.push({...ev});captureReplaySnapshot(ev)}
 if(ev.score>=(+$("cinematicImportance")?.value||78))majorMoment(ev);
 return ev;
}
function log(t){return worldEvent({title:t,text:t,type:"world",score:heuristicScore(t)})}

function leaderForCiv(ci){
 let ps=S.people.filter(p=>p.ci===ci);if(!ps.length)return null;
 let leaders=ps.filter(p=>/Président|Chef|Maire/.test(p.role));
 return (leaders.length?leaders:ps).sort((a,b)=>personImportance(b)-personImportance(a))[0];
}
function speechFor(ev,p){
 let civn=S.civs[p.ci]?.name||"notre peuple";
 if(ev.type==="coup")return `Citoyens de ${civn}, un nouvel ordre commence aujourd’hui. Nous devons rester unis.`;
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
 story.cinematic={ev,end:Date.now()+(+$("cinematicDuration")?.value||7000),focus,oldCamera:{...camera}};
 $("cinematicTitle").textContent=ev.title;$("cinematicText").textContent=ev.text;$("cinematicBanner").classList.add("show");document.body.classList.add("story-cinematic");
 startRally(ev);
}
function updateStoryFrame(){
 if(story.cinematic){
  let q=story.cinematic;
  if(Date.now()>q.end){story.cinematic=null;$("cinematicBanner").classList.remove("show");document.body.classList.remove("story-cinematic")}
  else if(q.focus){
   let fx=q.focus.x,fy=q.focus.y,targetZoom=Math.max(camera.zoom,Math.min(1.05,camera.maxZoom));
   camera.zoom=lerp(camera.zoom,targetZoom,.035);camera.x=lerp(camera.x,fx-c.width/(2*camera.zoom),.055);camera.y=lerp(camera.y,fy-c.height/(2*camera.zoom),.055);clampCamera()
  }
 }
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
function generateTerrain(){
 const seaUI=+$("seaLevel").value/100,rel=+$("relief").value/100,humUI=+$("humidity").value/100,tempUI=+$("temperature").value/100;
 const sea=0.38+(seaUI-.42)*.55;
 S.grid=new Array(COLS*ROWS);
 let elevs=new Float32Array(COLS*ROWS),moists=new Float32Array(COLS*ROWS),temps=new Float32Array(COLS*ROWS);

 for(let gy=0;gy<ROWS;gy++)for(let gx=0;gx<COLS;gx++){
   let nx=gx/(COLS-1),ny=gy/(ROWS-1);
   let continental=fbm(nx*2.3,ny*2.3,10,5);
   let detail=fbm(nx*7.5,ny*7.5,25,4);
   let ridge=1-Math.abs(fbm(nx*5.5,ny*5.5,60,4)*2-1);
   let edge=Math.pow(Math.max(Math.abs(nx-.5)*1.75,Math.abs(ny-.5)*1.68),2.25)*.36;
   let e=continental*.66+detail*.22+ridge*.12*rel-edge;
   elevs[gy*COLS+gx]=e;
   moists[gy*COLS+gx]=clamp(fbm(nx*4.0,ny*4.0,90,4)*.70+humUI*.30,0,1);
   temps[gy*COLS+gx]=clamp(tempUI*.50+fbm(nx*2.8,ny*2.8,120,3)*.32-(Math.abs(ny-.5)*.42),0,1);
 }

 // Two smoothing passes reduce noisy checkerboard biome boundaries.
 for(let pass=0;pass<2;pass++){
   let copy=new Float32Array(elevs);
   for(let gy=1;gy<ROWS-1;gy++)for(let gx=1;gx<COLS-1;gx++){
     let sum=0,w=0;
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let ww=(dx===0&&dy===0)?4:1;sum+=copy[(gy+dy)*COLS+gx+dx]*ww;w+=ww}
     elevs[gy*COLS+gx]=lerp(copy[gy*COLS+gx],sum/w,.36);
   }
 }

 for(let gy=0;gy<ROWS;gy++)for(let gx=0;gx<COLS;gx++){
   let idx=gy*COLS+gx,e=elevs[idx],m=moists[idx],t=temps[idx],type="plains";
   if(e<sea)type="water";
   else if(e<sea+.022)type="sand";
   else if(e>sea+.25+.10*(1-rel))type=t<.33?"snow":"mountain";
   else if(t<.23)type="snow";
   else if(t>.67&&m<.37)type="desert";
   else if(m>.61)type="forest";
   else type="plains";
   S.grid[idx]={type,elev:e,m,t};
 }

 // Rivers as smooth polylines, not blocky water tiles.
 S.rivers=[];
 let highs=[];
 for(let gy=3;gy<ROWS-3;gy++)for(let gx=3;gx<COLS-3;gx++){
   let q=S.grid[gy*COLS+gx];
   if(q.elev>sea+.24&&q.type!=="water")highs.push([gx,gy,q.elev]);
 }
 highs.sort((a,b)=>b[2]-a[2]);
 const riverCount=+$("rivers").value;
 for(let r=0;r<riverCount&&highs.length;r++){
   let start=highs[Math.min(highs.length-1,Math.floor((r+0.35)*Math.min(250,highs.length)/Math.max(1,riverCount)))];
   let gx=start[0],gy=start[1],seen=new Set(),path=[];
   for(let k=0;k<260;k++){
     let idx=gy*COLS+gx,q=S.grid[idx];if(!q)break;
     path.push({x:gx*CELL+CELL/2,y:gy*CELL+CELL/2});
     if(q.type==="water"&&k>6)break;
     seen.add(idx);
     let best=null,bscore=Infinity;
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
       if(!dx&&!dy)continue;
       let xx=gx+dx,yy=gy+dy;if(xx<1||yy<1||xx>=COLS-1||yy>=ROWS-1)continue;
       let ii=yy*COLS+xx;if(seen.has(ii))continue;
       let qq=S.grid[ii],edgePull=Math.min(xx,COLS-1-xx,yy,ROWS-1-yy)/Math.max(COLS,ROWS);
       let score=qq.elev+edgePull*.018+hash(xx,yy,700+r)*.006;
       if(score<bscore){bscore=score;best=[xx,yy]}
     }
     if(!best)break;
     let cur=S.grid[gy*COLS+gx].elev,next=S.grid[best[1]*COLS+best[0]].elev;
     if(next>cur+.035&&k>12)break;
     [gx,gy]=best;
   }
   if(path.length>10)S.rivers.push(path);
 }
}
function terrainAt(px,py){return S.grid[clamp(Math.floor(py/CELL),0,ROWS-1)*COLS+clamp(Math.floor(px/CELL),0,COLS-1)]}
function landPoint(ci){
 let band=W/S.civs.length;
 for(let k=0;k<1000;k++){let px=rnd(ci*band+100,(ci+1)*band-100),py=rnd(100,H-100),t=terrainAt(px,py).type;if(!["water","mountain","snow"].includes(t))return [px,py]}
 return [ci*band+band/2,H/2];
}
function seedResources(){
 S.res=[];let den=+$("resourceDensity").value/100;
 for(let i=0;i<Math.floor(1500*den);i++){
   let px=rnd(20,W-20),py=rnd(40,H-20),t=terrainAt(px,py).type;if(t==="water")continue;
   let type=t==="forest"?pick(["wood","wood","food"]):t==="mountain"?pick(["ore","ore","wood"]):t==="desert"?pick(["ore","oil","oil"]):pick(["food","food","wood","ore"]);
   S.res.push({type,x:px,y:py});
 }
}
function addBuilding(ci,type,x,y,name=null){let def=buildings.find(b=>b.type===type)||buildings[0],b={id:idSeq++,ci,type,x,y,name:name||def.name,beds:def.beds,residents:[],scale:1,roof:null};S.buildings.push(b);return b}
function assignHomes(ci){let homes=S.buildings.filter(b=>b.ci===ci&&b.beds>0),people=S.people.filter(p=>p.ci===ci&&!p.home);for(const p of people){let h=homes.find(h=>h.residents.length<h.beds);if(h){p.home=h.id;h.residents.push(p.id)}}}

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
function reset(){
 seed=Math.random()*99999;idSeq=1;
 S={run:true,tick:0,minute:480,day:1,year:1,season:0,weather:"Clair",war:false,walls:[],grid:[],rivers:[],res:[],buildings:[],people:[],civs:[civ(0),civ(1)]};
 generateTerrain();seedResources();
 for(let ci=0;ci<2;ci++){
   let [cx,cy]=landPoint(ci);
   for(let h=0;h<9;h++)addBuilding(ci,"hut",cx+rnd(-160,160),cy+rnd(-160,160),h===0?"Village initial":"Hutte");
   for(let i=0;i<60;i++){let [px,py]=landPoint(ci);S.people.push(makePerson(ci,px,py))}
   assignHomes(ci);
 }
 for(let y=0;y<H;y+=38)S.walls.push({x:W/2,y});
 active=0;selected=null;story.worldEvents=[];story.bubbles=[];story.cinematic=null;story.lastAutoDay=simDayIndex();story.nextAutoDay=story.lastAutoDay+(+$("eventFrequency")?.value||110);R={recording:$("recordReplay")?.checked!==false,snapshots:[],events:[],lastCaptureYear:0,liveState:null,playing:false};$("log").innerHTML="";
 for(const p of S.people){addPersonEvent(p,"Début de chronique",`${pname(p)} vit dans la civilisation ${S.civs[p.ci].name}.`,22,["origin"])}
 worldEvent({type:"world",title:"Naissance d’un nouveau monde",text:"Les premières communautés s’installent sur les continents.",score:88,x:W/2,y:H/2});
 captureReplaySnapshot(story.worldEvents.at(-1));tabs();editor();update();fitWorld();draw();
 $("detailCard").innerHTML='<div class="empty">Clique sur un élément du monde.</div>';$("personEditor").classList.add("hidden");$("personLifePanel").classList.add("hidden");$("buildingEditor").classList.add("hidden");
}
function findPerson(id){return S.people.find(p=>p.id===id)}
function findBuilding(id){return S.buildings.find(b=>b.id===id)}
function nearestRes(p,type){let q=null,d=1e20;for(const r of S.res){if(type&&r.type!==type)continue;let z=(r.x-p.x)**2+(r.y-p.y)**2;if(z<d){d=z;q=r}}return q}
function enemy(p,range){let q=null,d=range*range;for(const e of S.people)if(e.ci!==p.ci){let z=(e.x-p.x)**2+(e.y-p.y)**2;if(z<d){d=z;q=e}}return q}
function blocked(px,nx,py){for(const w of S.walls)if(Math.abs(w.y-py)<38&&((px<w.x&&nx>=w.x-10)||(px>w.x&&nx<=w.x+10)))return true;return false}
function compatibility(a,b){return 100-(Math.abs(a.intelligence-b.intelligence)*.18+Math.abs(a.aggression-b.aggression)*.12+Math.abs(a.curiosity-b.curiosity)*.12)+((a.charisma+b.charisma)/12)}
function tryCouple(p){
 if(!$("couples").checked||p.partner||p.age<18||p.age>58)return;
 let candidates=S.people.filter(q=>q!==p&&q.ci===p.ci&&!q.partner&&q.age>=18&&q.age<=60&&q.sex!==p.sex&&(q.x-p.x)**2+(q.y-p.y)**2<220*220);
 let best=null,score=65;for(const q of candidates){let s=compatibility(p,q);if(s>score){score=s;best=q}}
 if(best&&Math.random()<.005){p.partner=best.id;best.partner=p.id;p.relationship=Math.round(score);best.relationship=p.relationship;let home=findBuilding(p.home)||findBuilding(best.home);if(home){p.home=home.id;best.home=home.id;if(!home.residents.includes(p.id))home.residents.push(p.id);if(!home.residents.includes(best.id))home.residents.push(best.id)}addPersonEvent(p,"Nouveau couple",`${pname(p)} forme un couple avec ${pname(best)}.`,52,["family"]);addPersonEvent(best,"Nouveau couple",`${pname(best)} forme un couple avec ${pname(p)}.`,52,["family"])}
}
function tryPregnancy(p){
 if(!$("births").checked||!$("familyLife").checked||p.sex!=="F"||!p.partner||p.pregnant>0||p.age<18||p.age>44)return;
 let partner=findPerson(p.partner);if(!partner)return;let home=findBuilding(p.home);if(!home||home.residents.length>=home.beds)return;
 let v=S.civs[p.ci],pop=S.people.filter(q=>q.ci===p.ci).length;if(pop>=(v.populationCap||500))return;let chance=((p.fertility+partner.fertility)/200)*.0018*(v.birthRate||1);if(Math.random()<chance){p.pregnant=270;p.pregnancyPartner=partner.id}
}
function birth(mother){
 let father=findPerson(mother.pregnancyPartner),home=findBuilding(mother.home);if(!father||!home)return;
 let child=makePerson(mother.ci,mother.x+rnd(-10,10),mother.y+rnd(-10,10),0,[mother.id,father.id]);child.last=father.last;child.home=home.id;
 child.intelligence=clamp(Math.round((mother.intelligence+father.intelligence)/2+rnd(-10,10)),1,100);child.strength=clamp(Math.round((mother.strength+father.strength)/2+rnd(-10,10)),1,100);child.charisma=clamp(Math.round((mother.charisma+father.charisma)/2+rnd(-10,10)),1,100);
 home.residents.push(child.id);S.people.push(child);mother.children.push(child.id);father.children.push(child.id);mother.pregnant=0;mother.pregnancyPartner=null;
 addPersonEvent(child,"Naissance",`${pname(child)} naît, enfant de ${pname(mother)} et ${pname(father)}.`,75,["birth"]);
 addPersonEvent(mother,"Naissance d’un enfant",`${pname(child)} vient de naître.`,67,["family"]);addPersonEvent(father,"Naissance d’un enfant",`${pname(child)} vient de naître.`,67,["family"]);
 if(Math.max(personImportance(mother),personImportance(father))>72)worldEvent({type:"birth",title:"Naissance dans une famille influente",text:`${pname(child)} naît dans la famille de ${pname(mother)} et ${pname(father)}.`,score:58,ci:mother.ci,personId:child.id,x:child.x,y:child.y});
 showToast(`👶 Naissance : ${pname(child)}`);
}
function stepP(p){
 let v=S.civs[p.ci],e=eraIndex(v);p.hunger-=.014;p.cool=Math.max(0,p.cool-1);let g=null;
 if(p.rallyLeader&&p.rallyUntil>S.tick){let lead=findPerson(p.rallyLeader);if(lead)g=lead;else p.rallyLeader=null}
 if(!g&&p.age<6&&p.home){let h=findBuilding(p.home);if(h)g=h}
 else if(!g&&(p.hunger<55||/Fermier|Cueilleur/.test(p.role)))g=nearestRes(p,"food");
 else if(!g&&/Mineur|Ouvrier/.test(p.role))g=nearestRes(p,"ore");
 else if(!g&&p.partner&&$("familyLife").checked&&Math.random()<.02){let q=findPerson(p.partner);if(q)g=q}
 if(S.war&&(/Guerrier|Soldat|Chevalier|Pilote/.test(p.role)||Math.random()<p.aggression/400))g=enemy(p,350+p.courage*2)||g;
 if(g){let dx=g.x-p.x,dy=g.y-p.y,m=Math.hypot(dx,dy)||1;p.vx+=dx/m*.08;p.vy+=dy/m*.08}
 p.vx+=rnd(-.07,.07);p.vy+=rnd(-.07,.07);let terr=terrainAt(p.x,p.y).type,slow=terr==="forest"?.8:terr==="mountain"?.55:terr==="water"?.32:1;if(S.weather==="Tempête")slow*=.7;
 let sp=(.62+v.disc/150+p.strength/350)*slow,m=Math.hypot(p.vx,p.vy)||1;if(m>sp){p.vx=p.vx/m*sp;p.vy=p.vy/m*sp}
 let nx=clamp(p.x+p.vx,8,W-8),ny=clamp(p.y+p.vy,55,H-8);if(blocked(p.x,nx,ny)){p.vx*=-1;nx=p.x}p.x=nx;p.y=ny;
 for(let i=S.res.length-1;i>=0;i--){let r=S.res[i];if((r.x-p.x)**2+(r.y-p.y)**2<150){if(r.type==="food")p.hunger=Math.min(100,p.hunger+33);v.wealth+=(r.type==="ore"||r.type==="oil")?1:.2;S.res.splice(i,1);break}}
 if(p.hunger<=0)p.hp-=.11;if(p.sick)p.hp-=.012;if(S.weather==="Tempête"&&Math.random()<.00025)p.hp-=4;
 if(S.war&&p.cool===0){let en=enemy(p,24);if(en){let wp=weapons.filter(w=>w.era<=e).slice(-1)[0],power=(wp?.power||1)*(0.7+p.strength/100)+v.military/350;en.hp-=power*rnd(.65,1.2);p.cool=11;if(en.hp<=0)v.kills++}}
 if(S.tick%120===0){tryCouple(p);tryPregnancy(p)}
 if(p.pregnant>0){p.pregnant-=1;if(p.pregnant<=0)birth(p)}
}
function maybeBuild(ci){
 let v=S.civs[ci],e=eraIndex(v);if(!$("autoBuild").checked)return;let ps=S.people.filter(p=>p.ci===ci);if(ps.length<12||v.wealth<15)return;
 let homeless=ps.filter(p=>!p.home).length,needHome=homeless>3||ps.length>S.buildings.filter(b=>b.ci===ci).reduce((a,b)=>a+b.beds,0)*.9;
 if(Math.random()<.05*(.4+v.coop/100)){let avail=buildings.filter(b=>b.era<=e&&(needHome?b.beds>0:true)),def=pick(avail),[px,py]=landPoint(ci);addBuilding(ci,def.type,px,py);v.wealth-=10+def.era*5;if(def.type==="hall")v.cities++;assignHomes(ci)}
}
function develop(){
 for(let i=0;i<S.civs.length;i++){let v=S.civs[i],ps=S.people.filter(p=>p.ci===i),sch=ps.filter(p=>/Scientifique|Scribe/.test(p.role)).length,sold=ps.filter(p=>/Guerrier|Soldat|Chevalier|Pilote/.test(p.role)).length;
  let prev=eraIndex(v),avgInt=ps.length?ps.reduce((a,p)=>a+p.intelligence,0)/ps.length:v.intel;
  v.science+=(avgInt/100)*(v.curiosity/100)*(.38+sch*.025)*civStyleBonus(v,"science");v.tech+=v.science/8500*(.45+avgInt/100);v.military+=((v.agg/100)*(.018+sold*.003)+v.tech/50000)*civStyleBonus(v,"military");
  for(const [name,cost] of techs)if(v.science>=cost&&!v.discoveries.includes(name)){v.discoveries.push(name);let lead=leaderForCiv(i);worldEvent({type:"tech",title:`Découverte : ${name}`,text:`${v.name} maîtrise désormais ${name}.`,score:name==="Énergie atomique"?92:62+Math.min(18,cost/250),ci:i,personId:lead?.id,x:lead?.x,y:lead?.y})}
  let ne=eraIndex(v);if(ne>prev){let lead=leaderForCiv(i);worldEvent({type:"era",title:`${v.name} entre dans l’ère ${eras[ne].name}`,text:`La société de ${v.name} connaît une transformation historique.`,score:92,ci:i,personId:lead?.id,x:lead?.x,y:lead?.y});showToast(`${eras[ne].icon} ${v.name} : ère ${eras[ne].name}`);for(const p of ps)p.role=roleFor(v)}
  maybeBuild(i);
 }
}
function weather(){if(Math.random()*100>+$("weatherRate").value)return;S.weather=pick(S.season===3?["Clair","Neige","Neige","Tempête"]:["Clair","Clair","Pluie","Tempête"])}

function populationOf(ci){return S.people.filter(p=>p.ci===ci)}
function autoEpidemic(ci){
 let ps=populationOf(ci);if(!ps.length)return;let frac=rnd(.08,.22),n=Math.max(2,Math.floor(ps.length*frac));
 for(let i=0;i<n;i++){let p=pick(ps);if(!p.sick){p.sick=true;addPersonEvent(p,"Maladie",`${pname(p)} contracte une maladie lors d’une épidémie.`,62,["disease"])}}
 let lead=leaderForCiv(ci),v=S.civs[ci];worldEvent({type:"disease",title:`Épidémie en ${v.name}`,text:`Une maladie touche environ ${n} habitants. Les communautés tentent de limiter sa propagation.`,score:clamp(68+n/3,68,91),ci,personId:lead?.id,x:lead?.x,y:lead?.y})
}
function autoFamine(ci){
 let ps=populationOf(ci),v=S.civs[ci];if(!ps.length)return;let cx=ps.reduce((a,p)=>a+p.x,0)/ps.length,cy=ps.reduce((a,p)=>a+p.y,0)/ps.length;
 let before=S.res.length;S.res=S.res.filter(r=>r.type!=="food"||((r.x-cx)**2+(r.y-cy)**2>950*950)||Math.random()>.72);
 let lead=leaderForCiv(ci);worldEvent({type:"disaster",title:`Crise alimentaire en ${v.name}`,text:`Les réserves et récoltes chutent brutalement. La population risque la famine.`,score:78,ci,personId:lead?.id,x:cx,y:cy})
}
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
function autoCoup(ci){
 let ps=populationOf(ci);if(ps.length<12)return false;let v=S.civs[ci],oldLead=leaderForCiv(ci);if(!oldLead)return false;
 let avgMood=ps.reduce((a,p)=>a+p.mood,0)/ps.length;
 let challengers=ps.filter(p=>p.id!==oldLead.id&&p.age>=20).sort((a,b)=>(b.ambition+b.charisma+b.influence)-(a.ambition+a.charisma+a.influence));
 let ch=challengers[0];if(!ch)return false;
 let tension=(100-avgMood)+v.agg*.25+ch.ambition*.3-oldLead.charisma*.15;
 if(tension<55&&Math.random()<.7)return false;
 let oldRole=oldLead.role;oldLead.role=eraIndex(v)<=1?"Ancien chef":"Opposant";ch.role=eraIndex(v)===0?"Chef de tribu":eraIndex(v)<=1?"Chef":eraIndex(v)<=3?"Maire":"Président";
 ch.fame=(ch.fame||0)+25;ch.influence=clamp(ch.influence+20,1,100);oldLead.mood=Math.max(5,oldLead.mood-35);
 addPersonEvent(oldLead,"Renversé",`${pname(oldLead)} perd le pouvoir lors d’un coup d’État.`,96,["coup"]);
 addPersonEvent(ch,"Prise du pouvoir",`${pname(ch)} renverse ${pname(oldLead)} et devient ${ch.role}.`,98,["coup"]);
 worldEvent({type:"coup",title:`Coup d’État en ${v.name}`,text:`${pname(ch)} renverse ${pname(oldLead)} et prend le pouvoir.`,score:98,ci,personId:ch.id,x:ch.x,y:ch.y});
 return true;
}
function autoMigration(ci){
 let ps=populationOf(ci);if(ps.length<20||S.civs.length<2)return;let other=(ci+1+Math.floor(Math.random()*(S.civs.length-1)))%S.civs.length,n=Math.min(Math.floor(ps.length*.06),18);if(n<2)return;
 let movers=[...ps].sort((a,b)=>a.mood-b.mood).slice(0,n);for(const p of movers){p.ci=other;p.clothes=S.civs[other].color;p.home=null;addPersonEvent(p,"Migration",`${pname(p)} quitte ${S.civs[ci].name} pour ${S.civs[other].name}.`,64,["migration"])}
 assignHomes(other);worldEvent({type:"migration",title:"Vague de migration",text:`${n} habitants quittent ${S.civs[ci].name} pour rejoindre ${S.civs[other].name}.`,score:64+n,ci:other,personId:leaderForCiv(other)?.id})
}
function runAutomaticEvent(){
 if(!$("autoEvents")?.checked||story.replayMode)return;
 let ci=Math.floor(Math.random()*S.civs.length),v=S.civs[ci],ps=populationOf(ci);if(!ps.length)return;
 let avgMood=ps.reduce((a,p)=>a+p.mood,0)/ps.length;
 let choices=[];
 if($("disease").checked)choices.push("epidemic","epidemic");
 choices.push("famine","earthquake","wildfire","storm","migration");
 if(avgMood<58||v.agg>72)choices.push("coup","coup");
 let kind=pick(choices);
 if(kind==="epidemic")autoEpidemic(ci);
 else if(kind==="famine")autoFamine(ci);
 else if(kind==="earthquake")autoEarthquake(ci);
 else if(kind==="wildfire")autoWildfire(ci);
 else if(kind==="migration")autoMigration(ci);
 else if(kind==="coup"){if(!autoCoup(ci))autoWildfire(ci)}
 else {S.weather="Tempête";let lead=leaderForCiv(ci);worldEvent({type:"disaster",title:"Tempête exceptionnelle",text:`Une violente tempête frappe le territoire de ${v.name}.`,score:69,ci,personId:lead?.id,x:lead?.x,y:lead?.y})}
}
function processAutomaticEvents(){
 let d=simDayIndex();if(!story.nextAutoDay)story.nextAutoDay=d+(+$("eventFrequency").value||110);
 if(d>=story.nextAutoDay){runAutomaticEvent();story.lastAutoDay=d;story.nextAutoDay=d+(+$("eventFrequency").value||110)+Math.floor(rnd(-20,35))}
}

function tick(){
 S.tick++;S.minute+=story.cinematic?.ev?0.10:+$("timeScale").value;
 if(S.minute>=1440){let d=Math.floor(S.minute/1440);S.minute%=1440;S.day+=d;while(S.day>90){S.day-=90;S.season++;if(S.season>3){S.season=0;S.year++}weather()}}
 for(const p of S.people)stepP(p);
 let dead=S.people.filter(p=>p.hp<=0||p.age>=98);for(const p of dead){
  let imp=personImportance(p);addPersonEvent(p,"Mort",`${pname(p)} meurt à ${p.age} ans.`,85,["death"]);
  if(p.partner){let q=findPerson(p.partner);if(q){q.partner=null;addPersonEvent(q,"Deuil",`${pname(p)}, son partenaire, vient de mourir.`,82,["death"])}}
  for(const id of p.children||[]){let q=findPerson(id);if(q)addPersonEvent(q,"Mort d’un parent",`${pname(p)} vient de mourir.`,80,["death"])}
  let h=findBuilding(p.home);if(h)h.residents=h.residents.filter(id=>id!==p.id);
  if(imp>72)worldEvent({type:"death",title:`Mort de ${pname(p)}`,text:`${pname(p)}, ${p.role} de ${S.civs[p.ci]?.name||"son peuple"}, meurt à ${p.age} ans.`,score:clamp(74+imp*.2,74,96),ci:p.ci,x:p.x,y:p.y})
 }
 S.people=S.people.filter(p=>p.hp>0&&p.age<98);
 if(S.tick%22===0)develop();if(S.tick%1100===0)for(const p of S.people)p.age++;
 if(Math.random()<.05&&S.res.length<2200){let [px,py]=landPoint(Math.floor(Math.random()*S.civs.length));S.res.push({type:pick(["food","wood","ore"]),x:px,y:py})}
 if($("disease").checked&&Math.random()<.0001&&S.people.length)pick(S.people).sick=true;
 if($("trade").checked&&!S.war&&S.tick%220===0)for(const v of S.civs)v.wealth+=v.coop/25;processAutomaticEvents();maybePeriodicReplayCapture();update();
}

/* -------- Camera / rendering -------- */
function applyCamera(){ctx.setTransform(camera.zoom,0,0,camera.zoom,-camera.x*camera.zoom,-camera.y*camera.zoom)}
function visibleBounds(){return {l:camera.x,t:camera.y,r:camera.x+c.width/camera.zoom,b:camera.y+c.height/camera.zoom}}
const biomeColors={water:"#347b99",sand:"#c8b57d",plains:"#6d965b",forest:"#426f48",mountain:"#7d817c",desert:"#b89a59",snow:"#e4ecee"};
function tint(hex,delta){
 let n=parseInt(hex.slice(1),16),r=clamp((n>>16)+delta,0,255),g=clamp(((n>>8)&255)+delta,0,255),b=clamp((n&255)+delta,0,255);
 return `rgb(${r},${g},${b})`;
}
function drawTerrain(){
 const vb=visibleBounds(),gx0=clamp(Math.floor(vb.l/CELL)-1,0,COLS-1),gx1=clamp(Math.ceil(vb.r/CELL)+1,0,COLS-1),gy0=clamp(Math.floor(vb.t/CELL)-1,0,ROWS-1),gy1=clamp(Math.ceil(vb.b/CELL)+1,0,ROWS-1);
 for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){
   let q=S.grid[gy*COLS+gx],px=gx*CELL,py=gy*CELL;
   let variation=Math.round((hash(gx,gy,900)-.5)*10);
   ctx.fillStyle=tint(biomeColors[q.type]||"#6d965b",variation);
   ctx.fillRect(px,py,CELL+1,CELL+1);
   // More natural micro-textures
   let h=hash(gx,gy,901);
   ctx.lineCap="round";
   if(q.type==="plains"&&h>.45){ctx.strokeStyle="rgba(53,99,54,.42)";ctx.lineWidth=1.4;for(let i=0;i<2;i++){let ox=9+i*13+hash(gx,gy,930+i)*8,oy=13+hash(gx,gy,940+i)*17;ctx.beginPath();ctx.moveTo(px+ox,py+oy+5);ctx.quadraticCurveTo(px+ox+1,py+oy,px+ox+4,py+oy-4);ctx.stroke()}}
   else if(q.type==="forest"){for(let i=0;i<2;i++){let ox=10+i*16+hash(gx,gy,950+i)*5,oy=11+hash(gx,gy,960+i)*15;ctx.fillStyle=i?"#315b39":"#365f3c";ctx.beginPath();ctx.arc(px+ox,py+oy,5.5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#57432f";ctx.fillRect(px+ox-1,py+oy+4,2,5)}}
   else if(q.type==="mountain"){ctx.fillStyle="rgba(222,225,221,.28)";ctx.beginPath();ctx.moveTo(px+7,py+31);ctx.lineTo(px+20,py+9);ctx.lineTo(px+34,py+31);ctx.closePath();ctx.fill();ctx.strokeStyle="rgba(70,72,70,.3)";ctx.stroke()}
   else if(q.type==="desert"){ctx.strokeStyle="rgba(130,99,48,.35)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px+20,py+23,12,3.4,5.9);ctx.stroke()}
   else if(q.type==="snow"){ctx.fillStyle="rgba(255,255,255,.36)";ctx.beginPath();ctx.arc(px+12,py+11,4,0,Math.PI*2);ctx.arc(px+29,py+27,3,0,Math.PI*2);ctx.fill()}
   else if(q.type==="water"){ctx.strokeStyle="rgba(205,235,244,.18)";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(px+7,py+15);ctx.quadraticCurveTo(px+14,py+12,px+22,py+15);ctx.quadraticCurveTo(px+29,py+18,px+35,py+15);ctx.stroke()}
 }
 // Rivers on top with smooth lines.
 ctx.lineCap="round";ctx.lineJoin="round";
 for(const river of S.rivers){
   if(!river.length)continue;
   let maybeVisible=river.some((p,i)=>i%15===0&&p.x>vb.l-100&&p.x<vb.r+100&&p.y>vb.t-100&&p.y<vb.b+100);if(!maybeVisible)continue;
   ctx.strokeStyle="#3e89a7";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(river[0].x,river[0].y);for(let i=1;i<river.length;i++)ctx.lineTo(river[i].x,river[i].y);ctx.stroke();
   ctx.strokeStyle="rgba(197,232,241,.30)";ctx.lineWidth=2.4;ctx.stroke();
 }
}
function drawBuilding(b){
 let a=b.x,q=b.y,v=S.civs[b.ci],e=buildings.find(z=>z.type===b.type)?.era||0;
 let globalScale=(+$("buildingVisualScale").value||125)/100,sc=globalScale*(b.scale||1);
 let roof=b.roof||["#6e4d35","#8c6545","#6b5c4c","#765340","#68717a","#536578"][e]||"#6e4d35";
 let wall=v?.color||"#aaa",detail=(+$("textureDetail").value||80)/100;
 ctx.save();ctx.translate(a,q);ctx.scale(sc,sc);

 // soft ground shadow
 ctx.fillStyle="rgba(0,0,0,.22)";ctx.beginPath();ctx.ellipse(0,12,19,7,0,0,Math.PI*2);ctx.fill();

 // foundation
 ctx.fillStyle="#5f5a51";ctx.fillRect(-15,8,30,4);

 // walls with subtle gradient-like bands
 ctx.fillStyle=wall;ctx.beginPath();ctx.roundRect(-14,-6,28,17,2);ctx.fill();
 ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(-12,-4,24,3);
 ctx.fillStyle="rgba(0,0,0,.08)";ctx.fillRect(-12,5,24,4);

 // roof
 ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(-18,-6);ctx.lineTo(0,-23);ctx.lineTo(18,-6);ctx.closePath();ctx.fill();
 ctx.strokeStyle="rgba(30,25,20,.32)";ctx.lineWidth=1.2;ctx.stroke();

 // door + windows
 ctx.fillStyle="#5a4030";ctx.fillRect(-3,2,6,9);
 ctx.fillStyle="#a9d5e3";ctx.fillRect(-10,-1,5,5);ctx.fillRect(5,-1,5,5);
 ctx.fillStyle="rgba(255,255,255,.38)";ctx.fillRect(-9,0,1,3);ctx.fillRect(6,0,1,3);

 if(detail>.45){
   ctx.strokeStyle="rgba(70,55,40,.26)";ctx.lineWidth=.9;
   for(let yy=-2;yy<8;yy+=4){ctx.beginPath();ctx.moveTo(-13,yy);ctx.lineTo(13,yy);ctx.stroke()}
 }
 if(["factory","power"].includes(b.type)){
   ctx.fillStyle="#465159";ctx.fillRect(9,-28,6,22);
   ctx.fillStyle="#2e383e";ctx.fillRect(8,-29,8,3);
   ctx.fillStyle="rgba(210,220,225,.32)";ctx.beginPath();ctx.arc(13,-34,7,0,Math.PI*2);ctx.fill();
 }
 if(b.type==="hospital"){
   ctx.fillStyle="#f1f4f5";ctx.fillRect(-2,-2,4,11);ctx.fillRect(-7,2,14,4);
 }
 if(b.type==="airport"){
   ctx.fillStyle="#bcc8cd";ctx.fillRect(-23,13,46,5);
   ctx.fillStyle="#48545a";ctx.fillRect(-2,13,4,5);
 }
 if(b.type==="lab"){
   ctx.fillStyle="#b7d5e1";ctx.beginPath();ctx.arc(0,-13,7,Math.PI,0);ctx.fill();
 }
 if(b.type==="strategic"){
   ctx.fillStyle="#38434a";ctx.fillRect(-8,-29,16,16);
   ctx.strokeStyle="#bcc7cc";ctx.beginPath();ctx.arc(0,-22,5,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
function drawPerson(p){
 let a=p.x,b=p.y,v=S.civs[p.ci],globalScale=(+$("npcVisualScale").value||120)/100,sc=globalScale*(p.scale||1);
 ctx.save();ctx.translate(a,b);ctx.scale(sc,sc);

 // shadow
 ctx.fillStyle="rgba(0,0,0,.20)";ctx.beginPath();ctx.ellipse(0,10,6,2.7,0,0,Math.PI*2);ctx.fill();

 // legs
 ctx.strokeStyle="#273036";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-2,6);ctx.lineTo(-2,12);ctx.moveTo(2,6);ctx.lineTo(2,12);ctx.stroke();

 // torso / clothes
 ctx.fillStyle=p.clothes||v.color;ctx.beginPath();ctx.roundRect(-5,-3,10,11,2.5);ctx.fill();
 ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(-4,-2,8,2);

 // arms
 ctx.strokeStyle=p.skin||"#c8946e";ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(-8,5);ctx.moveTo(5,0);ctx.lineTo(8,5);ctx.stroke();

 // head
 ctx.fillStyle=p.skin||"#c8946e";ctx.beginPath();ctx.arc(0,-9,5,0,Math.PI*2);ctx.fill();

 // hair
 ctx.fillStyle=p.hair||"#241912";
 if(p.hairStyle==="bald"){}
 else if(p.hairStyle==="long"){ctx.beginPath();ctx.arc(0,-10,5.3,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-5,-10,2,8);ctx.fillRect(3,-10,2,8)}
 else if(p.hairStyle==="curly"){for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(i*3,-13+(Math.abs(i)),2.5,0,Math.PI*2);ctx.fill()}}
 else if(p.hairStyle==="mohawk"){ctx.fillRect(-1,-17,2,7)}
 else {ctx.beginPath();ctx.arc(0,-11,5,Math.PI,Math.PI*2);ctx.fill()}

 // eyes
 ctx.fillStyle="#1b2023";ctx.fillRect(-2.5,-9,1,1);ctx.fillRect(1.5,-9,1,1);

 // role signs
 if(/Chef|Maire|Président/.test(p.role)){ctx.fillStyle="#f1c84c";ctx.beginPath();ctx.moveTo(-6,-14);ctx.lineTo(-3,-18);ctx.lineTo(0,-15);ctx.lineTo(3,-18);ctx.lineTo(6,-14);ctx.closePath();ctx.fill()}
 if(/Médecin|Guérisseur/.test(p.role)){ctx.strokeStyle="#f2f6f7";ctx.lineWidth=1.5;ctx.strokeRect(7,-2,4,7)}
 if(/Guerrier|Soldat|Chevalier/.test(p.role)){ctx.strokeStyle="#d6dde0";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(9,-5);ctx.lineTo(9,10);ctx.stroke()}
 if(p.partner){ctx.fillStyle="#ea7fa5";ctx.beginPath();ctx.arc(0,-20,2,0,Math.PI*2);ctx.fill()}
 ctx.restore();
}
function drawWeather(){
 ctx.setTransform(1,0,0,1,0,0);
 if(S.weather==="Pluie"||S.weather==="Tempête"){ctx.strokeStyle="rgba(185,214,230,.36)";ctx.lineWidth=1;for(let i=0;i<(S.weather==="Tempête"?150:75);i++){let a=(i*83+S.tick*8)%c.width,b=(i*47+S.tick*11)%c.height;ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(a-5,b+9);ctx.stroke()}}
}
function draw(){
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle="#183343";ctx.fillRect(0,0,c.width,c.height);
 applyCamera();drawTerrain();
 let vb=visibleBounds();
 const visible=o=>o.x>vb.l-80&&o.x<vb.r+80&&o.y>vb.t-80&&o.y<vb.b+80;
 for(const r of S.res)if(visible(r)){ctx.fillStyle=r.type==="food"?"#d6b44a":r.type==="wood"?"#755232":r.type==="oil"?"#25292c":"#a8b1b5";ctx.beginPath();ctx.arc(r.x,r.y,r.type==="wood"?4.5:3.5,0,Math.PI*2);ctx.fill()}
 for(const b of S.buildings)if(visible(b))drawBuilding(b);
 for(const w of S.walls)if(visible(w)){ctx.fillStyle="#817a70";ctx.fillRect(w.x-4,w.y,8,22);ctx.fillStyle="#9a9387";ctx.fillRect(w.x-5,w.y,10,4)}
 for(const p of S.people)if(visible(p))drawPerson(p);
 drawWeather();drawSpeechBubbles();
}
function screenToWorld(clientX,clientY){
 let r=c.getBoundingClientRect(),cx=(clientX-r.left)/r.width*c.width,cy=(clientY-r.top)/r.height*c.height;
 return {x:camera.x+cx/camera.zoom,y:camera.y+cy/camera.zoom,cx,cy};
}

/* -------- UI / details -------- */
function tabs(){$("civTabs").innerHTML="";S.civs.forEach((v,i)=>{let b=document.createElement("button");b.className="tab"+(i===active?" active":"");b.textContent=v.name;b.style.borderColor=v.color;b.onclick=()=>{active=i;tabs();editor()};$("civTabs").appendChild(b)})}
const fields=["intel","agg","disc","curiosity","coop","fertility","courage"];
function editor(){let v=S.civs[active];if(!v)return;$("civName").value=v.name;$("civColor").value=v.color;$("civStyle").value=v.style||"balanced";$("targetPopulation").value=v.targetPopulation??100;$("populationCap").value=v.populationCap??500;$("birthRateMode").value=String(v.birthRate??1);$("ageProfile").value=v.ageProfile||"balanced";for(const f of fields){$(f).value=v[f];$(f+"V").textContent=v[f]}update()}
function openInspector(tab="detailTab"){$("inspector").classList.add("open");document.querySelectorAll(".it").forEach(b=>b.classList.toggle("active",b.dataset.itab===tab));document.querySelectorAll(".itab").forEach(s=>s.classList.toggle("active",s.id===tab))}
function detailPerson(p){
 let v=S.civs[p.ci],partner=findPerson(p.partner),home=findBuilding(p.home),parents=p.parents.map(findPerson).filter(Boolean),kids=p.children.map(findPerson).filter(Boolean),weapon=weapons.filter(w=>w.era<=eraIndex(v)).slice(-1)[0];
 $("inspectorTitle").textContent=pname(p);$("inspectorSub").textContent=`${p.role} · ${v.name}`;
 $("detailCard").innerHTML=`<div class="detail-head"><div class="portrait">${p.sex==="F"?"👩":"👨"}</div><div><h4>${pname(p)}</h4><p>${p.role} · ${p.age} ans · Gén. ${p.generation}</p></div></div><div class="detail-grid">
 <div><small>Intelligence</small><b>${p.intelligence}</b></div><div><small>Force</small><b>${p.strength}</b></div><div><small>Charisme</small><b>${p.charisma}</b></div><div><small>Agressivité</small><b>${p.aggression}</b></div>
 <div><small>Curiosité</small><b>${p.curiosity}</b></div><div><small>Courage</small><b>${p.courage}</b></div><div><small>Loyauté</small><b>${p.loyalty}</b></div><div><small>Humeur</small><b>${p.mood}</b></div>
 <div><small>Santé</small><b>${Math.ceil(p.hp)}%</b></div><div><small>Arme</small><b>${weapon.name}</b></div><div><small>Habitat</small><b>${home?home.name:"Aucun"}</b></div><div><small>État</small><b>${p.pregnant>0?"Grossesse":p.sick?"Malade":"Normal"}</b></div></div>
 <div class="family-box"><b>💞 Famille</b>Partenaire : ${partner?pname(partner):"Aucun"}<br>Parents : ${parents.length?parents.map(pname).join(", "):"—"}<br>Enfants : ${kids.length?kids.map(pname).join(", "):"Aucun"}<br><br><b>⭐ Importance historique</b> ${Math.round(personImportance(p))}/100</div>`;
 selected={type:"person",obj:p};
 $("buildingEditor").classList.add("hidden");$("personEditor").classList.remove("hidden");
 populatePersonEditor(p);renderPersonLife(p);$("personLifePanel").classList.remove("hidden");
 openInspector("detailTab");$("selected").textContent=`${pname(p)} · ${p.role}`;
}
function detailBuilding(b){
 let v=S.civs[b.ci];selected={type:"building",obj:b};
 $("inspectorTitle").textContent=b.name;$("inspectorSub").textContent=v.name;
 $("detailCard").innerHTML=`<div class="detail-head"><div class="portrait">🏠</div><div><h4>${b.name}</h4><p>${v.name}</p></div></div><div class="detail-grid"><div><small>Type</small><b>${b.type}</b></div><div><small>Lits</small><b>${b.beds}</b></div><div><small>Résidents</small><b>${b.residents.length}</b></div><div><small>Époque</small><b>${eras[eraIndex(v)].name}</b></div></div>`;
 $("personEditor").classList.add("hidden");$("personLifePanel").classList.add("hidden");$("buildingEditor").classList.remove("hidden");
 $("editBuildingName").value=b.name;$("editBuildingScale").value=String(b.scale||1);$("editBuildingRoof").value=b.roof||"#6e4d35";
 openInspector("detailTab");$("selected").textContent=`${b.name} · ${v.name}`;
}

const personEditRanges=["Intelligence","Strength","Charisma","Aggression","Curiosity","Fertility","Loyalty","Courage","Mood","Health"];
function populatePersonEditor(p){
 $("editFirst").value=p.first;$("editLast").value=p.last;$("editAge").value=p.age;$("editSex").value=p.sex;$("editRole").value=p.role;
 $("editScale").value=String(p.scale||1);$("editSkin").value=p.skin||"#c8946e";$("editHair").value=p.hair||"#241912";$("editClothes").value=p.clothes||S.civs[p.ci].color;$("editHairStyle").value=p.hairStyle||"short";
 $("editCiv").innerHTML=S.civs.map((v,i)=>`<option value="${i}">${v.name}</option>`).join("");$("editCiv").value=String(p.ci);
 const map={Intelligence:"intelligence",Strength:"strength",Charisma:"charisma",Aggression:"aggression",Curiosity:"curiosity",Fertility:"fertility",Loyalty:"loyalty",Courage:"courage",Mood:"mood",Health:"hp"};
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
 let v=S.civs[ci],cap=v.populationCap||500,existing=S.people.filter(p=>p.ci===ci).length,room=Math.max(0,cap-existing),n=Math.min(Math.max(0,count),room);
 for(let i=0;i<n;i++){let [px,py]=landPoint(ci);S.people.push(makePerson(ci,px,py))}
 assignHomes(ci);update();return n;
}
function removePopulation(ci,count){
 let pool=S.people.filter(p=>p.ci===ci).sort((a,b)=>a.age-b.age),n=Math.min(count,pool.length);
 let ids=new Set(pool.slice(0,n).map(p=>p.id));
 for(const p of S.people)if(ids.has(p.id)&&p.partner){let q=findPerson(p.partner);if(q)q.partner=null}
 for(const b of S.buildings)b.residents=b.residents.filter(id=>!ids.has(id));
 S.people=S.people.filter(p=>!ids.has(p.id));update();return n;
}
function setPopulation(ci,target){
 target=Math.max(0,Math.floor(target));let current=S.people.filter(p=>p.ci===ci).length;
 return target>current?addPopulation(ci,target-current):removePopulation(ci,current-target);
}
function configureCivilizationCount(target){
 target=clamp(Math.floor(target),2,8);
 while(S.civs.length<target){let i=S.civs.length;S.civs.push(civ(i));let [cx,cy]=landPoint(i);for(let h=0;h<7;h++)addBuilding(i,"hut",cx+rnd(-140,140),cy+rnd(-140,140))}
 while(S.civs.length>target){let i=S.civs.length-1;S.people=S.people.filter(p=>p.ci!==i);S.buildings=S.buildings.filter(b=>b.ci!==i);S.civs.pop()}
 active=Math.min(active,S.civs.length-1);tabs();editor();
}
function applyScenarioPreset(name){
 if(name==="duel"){ $("scenarioCivs").value=2;$("scenarioPop").value=120;$("seaLevel").value=40;$("rivers").value=6; }
 else if(name==="tribes"){ $("scenarioCivs").value=8;$("scenarioPop").value=55;$("seaLevel").value=38;$("rivers").value=10; }
 else if(name==="islands"){ $("scenarioCivs").value=5;$("scenarioPop").value=70;$("seaLevel").value=56;$("rivers").value=4; }
 else if(name==="warworld"){ $("scenarioCivs").value=6;$("scenarioPop").value=130;$("seaLevel").value=38;$("rivers").value=8; }
 else if(name==="peaceful"){ $("scenarioCivs").value=4;$("scenarioPop").value=90;$("seaLevel").value=42;$("rivers").value=9; }
 else if(name==="techrace"){ $("scenarioCivs").value=4;$("scenarioPop").value=100;$("seaLevel").value=40;$("rivers").value=7; }
 for(const id of ["seaLevel","rivers"]){let ev=new Event("input");$(id).dispatchEvent(ev)}
}
function setPersonField(id,key,parse=v=>v){
 $(id).addEventListener("input",()=>{if(selected?.type!=="person")return;selected.obj[key]=parse($(id).value);if(id==="editFirst"||id==="editLast"||id==="editRole")refreshSelectedPerson()});
}
function update(){
 let v=S.civs[active];if(v){$("pop").textContent=S.people.filter(p=>p.ci===active).length;$("era").textContent=eras[eraIndex(v)].name;$("science").textContent=Math.floor(v.science);$("tech").textContent=Math.floor(v.tech);$("military").textContent=Math.floor(v.military);$("cities").textContent=v.cities;
 $("techTree").innerHTML=techs.map(t=>`<div class="unlock ${v.discoveries.includes(t[0])?"ok":"locked"}">${v.discoveries.includes(t[0])?"✓":"🔒"} ${t[0]}</div>`).join("");let e=eraIndex(v);$("buildingList").innerHTML=buildings.map(b=>`<div class="unlock ${b.era<=e?"ok":"locked"}">${b.era<=e?"✓":"🔒"} ${b.name}</div>`).join("");$("weaponList").innerHTML=weapons.map(w=>`<div class="unlock ${w.era<=e?"ok":"locked"}">${w.era<=e?"✓":"🔒"} ${w.name}</div>`).join("")}
 $("clock").textContent=`A${S.year} · J${S.day} · ${String(Math.floor(S.minute/60)).padStart(2,"0")}:${String(S.minute%60).padStart(2,"0")}`;$("weather").textContent="🌦 "+S.weather;$("season").textContent=["🌱 Printemps","☀ Été","🍂 Automne","❄ Hiver"][S.season];let best=Math.max(...S.civs.map(eraIndex));$("eraGlobal").textContent=`${eras[best].icon} ${eras[best].name}`;$("worldPop").textContent=`👥 ${S.people.length}`;$("totalPopHud").textContent=S.people.length;$("totalBuildingsHud").textContent=S.buildings.length;$("totalCivsHud").textContent=S.civs.length;$("warStateHud").textContent=S.war?"Guerre":"Paix";$("storyStateHud").textContent=story.replayMode?"Replay":story.cinematic?"Ralenti":"Histoire";
}
for(const f of fields)$(f).oninput=()=>{let v=S.civs[active];v[f]=+$(f).value;$(f+"V").textContent=v[f]};
$("civName").onchange=()=>{S.civs[active].name=$("civName").value||S.civs[active].name;tabs()};

$("civColor").oninput=()=>{let v=S.civs[active];v.color=$("civColor").value;for(const p of S.people)if(p.ci===active&&(!p.clothes||p.clothes===COLORS[active]))p.clothes=v.color};
$("civStyle").onchange=()=>{S.civs[active].style=$("civStyle").value};

$("targetPopulation").onchange=()=>{S.civs[active].targetPopulation=clamp(+$("targetPopulation").value||0,0,2000)};
$("populationCap").onchange=()=>{let v=S.civs[active];v.populationCap=clamp(+$("populationCap").value||10,10,5000);if(v.targetPopulation>v.populationCap){v.targetPopulation=v.populationCap;$("targetPopulation").value=v.targetPopulation}};
$("birthRateMode").onchange=()=>S.civs[active].birthRate=+$("birthRateMode").value;
$("ageProfile").onchange=()=>S.civs[active].ageProfile=$("ageProfile").value;
$("applyPopulation").onclick=()=>{let v=S.civs[active];v.targetPopulation=clamp(+$("targetPopulation").value||0,0,v.populationCap||5000);setPopulation(active,v.targetPopulation);showToast(`👥 ${v.name} : ${S.people.filter(p=>p.ci===active).length} habitants`)};
$("add10Pop").onclick=()=>{addPopulation(active,10);editor()};
$("add100Pop").onclick=()=>{addPopulation(active,100);editor()};
$("remove10Pop").onclick=()=>{removePopulation(active,10);editor()};
$("remove100Pop").onclick=()=>{removePopulation(active,100);editor()};

$("applyScenarioPreset").onclick=()=>applyScenarioPreset($("scenarioPreset").value);
$("startScenario").onclick=()=>{
 let preset=$("scenarioPreset").value,civsN=clamp(+$("scenarioCivs").value||2,2,8),popN=clamp(+$("scenarioPop").value||80,1,1000);
 reset();configureCivilizationCount(civsN);
 for(let i=0;i<S.civs.length;i++){
   S.civs[i].targetPopulation=popN;
   S.civs[i].populationCap=Math.max(popN*4,200);
   if(preset==="techrace"){S.civs[i].intel=clamp(70+i*5,0,100);S.civs[i].curiosity=85;S.civs[i].agg=20}
   if(preset==="warworld"){S.civs[i].agg=85;S.civs[i].courage=85}
   if(preset==="peaceful"){S.civs[i].agg=10;S.civs[i].coop=90}
   setPopulation(i,popN);
 }
 if(preset==="warworld")S.war=true;
 tabs();editor();fitWorld();showToast("🎮 Scénario lancé");
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
setPersonField("editHairStyle","hairStyle",String);
$("editCiv").onchange=()=>{if(selected?.type!=="person")return;let p=selected.obj;p.ci=clamp(+$("editCiv").value,0,S.civs.length-1);p.clothes=S.civs[p.ci].color;active=p.ci;tabs();editor();refreshSelectedPerson()};
const pRangeMap={Intelligence:"intelligence",Strength:"strength",Charisma:"charisma",Aggression:"aggression",Curiosity:"curiosity",Fertility:"fertility",Loyalty:"loyalty",Courage:"courage",Mood:"mood",Health:"hp"};
for(const [label,key] of Object.entries(pRangeMap)){
 $("edit"+label).oninput=()=>{if(selected?.type!=="person")return;let val=+$("edit"+label).value;selected.obj[key]=val;$("edit"+label+"V").textContent=Math.round(val)}
}
$("healPerson").onclick=()=>{if(selected?.type!=="person")return;selected.obj.hp=100;selected.obj.sick=false;selected.obj.hunger=100;selected.obj.mood=Math.max(selected.obj.mood,80);populatePersonEditor(selected.obj);detailPerson(selected.obj);showToast("❤️ PNJ soigné")};
$("rerollPerson").onclick=()=>{if(selected?.type!=="person")return;let p=selected.obj,v=S.civs[p.ci];p.intelligence=clamp(Math.round(v.intel+rnd(-25,25)),1,100);p.strength=Math.round(rnd(20,100));p.charisma=Math.round(rnd(20,100));p.aggression=clamp(Math.round(v.agg+rnd(-25,25)),1,100);p.curiosity=Math.round(rnd(10,100));p.fertility=Math.round(rnd(10,100));p.loyalty=Math.round(rnd(20,100));p.courage=Math.round(rnd(15,100));p.mood=Math.round(rnd(40,100));p.skin=pick(["#d9aa83","#c8946e","#a96f4f","#7b4b36","#e4b995"]);p.hair=pick(["#241912","#3a291f","#6b4d32","#b57b44","#d6b88b","#191919"]);p.hairStyle=pick(["short","long","curly","mohawk","bald"]);populatePersonEditor(p);detailPerson(p);showToast("🎲 PNJ randomisé")};
$("duplicatePerson").onclick=()=>{if(selected?.type!=="person")return;let p=selected.obj,q=makePerson(p.ci,p.x+18,p.y+18,p.age);Object.assign(q,{first:p.first,last:p.last,sex:p.sex,role:p.role,intelligence:p.intelligence,strength:p.strength,charisma:p.charisma,aggression:p.aggression,curiosity:p.curiosity,fertility:p.fertility,loyalty:p.loyalty,courage:p.courage,mood:p.mood,scale:p.scale,skin:p.skin,hair:p.hair,clothes:p.clothes,hairStyle:p.hairStyle});S.people.push(q);showToast("👥 PNJ dupliqué")};
$("makeLeader").onclick=()=>{if(selected?.type!=="person")return;let p=selected.obj,e=eraIndex(S.civs[p.ci]);p.role=e===0?"Chef de tribu":e<=1?"Chef":e<=3?"Maire":"Président";p.charisma=Math.max(p.charisma,80);p.loyalty=Math.max(p.loyalty,75);p.influence=Math.max(p.influence||0,85);p.fame=(p.fame||0)+15;p.clothes="#d0a744";worldEvent({type:"coup",title:`Nouveau dirigeant : ${pname(p)}`,text:`${pname(p)} prend la tête de ${S.civs[p.ci].name}.`,score:86,ci:p.ci,personId:p.id,x:p.x,y:p.y});populatePersonEditor(p);detailPerson(p);showToast("👑 Nouveau dirigeant")};

$("editBuildingName").oninput=()=>{if(selected?.type!=="building")return;selected.obj.name=$("editBuildingName").value||selected.obj.name;$("inspectorTitle").textContent=selected.obj.name};
$("editBuildingScale").onchange=()=>{if(selected?.type!=="building")return;selected.obj.scale=+$("editBuildingScale").value};
$("editBuildingRoof").oninput=()=>{if(selected?.type!=="building")return;selected.obj.roof=$("editBuildingRoof").value};

$("play").onclick=()=>S.run=true;$("pause").onclick=()=>S.run=false;$("regen").onclick=reset;
function setCinema(on){document.body.classList.toggle("cinema",on)}
$("cinema").onclick=()=>setCinema(true);
$("cinemaExit").onclick=()=>setCinema(false);
$("cinemaSettings").onclick=()=>{setCinema(false);openInspector("worldTab")};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("cinema"))setCinema(false)});
$("fitWorld").onclick=fitWorld;
$("centerView").onclick=()=>{camera.x=W/2-c.width/(2*camera.zoom);camera.y=H/2-c.height/(2*camera.zoom);clampCamera()};
$("war").onclick=()=>{S.war=true;let l=leaderForCiv(active);worldEvent({type:"war",title:"Guerre générale",text:"Les civilisations entrent dans une période de conflit ouvert.",score:96,ci:active,personId:l?.id,x:l?.x,y:l?.y});showToast("⚔ Guerre globale")};
$("peace").onclick=()=>{S.war=false;let l=leaderForCiv(active);worldEvent({type:"peace",title:"Retour à la paix",text:"Les affrontements cessent et les peuples commencent à reconstruire.",score:91,ci:active,personId:l?.id,x:l?.x,y:l?.y});showToast("☮ Paix")};
$("breakWalls").onclick=()=>{S.walls=[];worldEvent({type:"world",title:"Les murs tombent",text:"Les barrières qui séparaient les peuples sont détruites.",score:82,x:W/2,y:H/2})};
$("addCiv").onclick=()=>{if(S.civs.length>=8)return;let i=S.civs.length;S.civs.push(civ(i));let [cx,cy]=landPoint(i);for(let h=0;h<7;h++)addBuilding(i,"hut",cx+rnd(-140,140),cy+rnd(-140,140));for(let k=0;k<45;k++){let [px,py]=landPoint(i);S.people.push(makePerson(i,px,py))}assignHomes(i);active=i;tabs();editor();showToast("🏛 Nouvelle civilisation")};
$("removeCiv").onclick=()=>{if(S.civs.length<=2)return;let i=active;S.people=S.people.filter(p=>p.ci!==i);S.buildings=S.buildings.filter(b=>b.ci!==i);S.civs.splice(i,1);for(const p of S.people)if(p.ci>i)p.ci--;for(const b of S.buildings)if(b.ci>i)b.ci--;active=0;tabs();editor()};
$("spawnPerson").onclick=()=>{let [px,py]=landPoint(active);S.people.push(makePerson(active,px,py));assignHomes(active);showToast("👤 PNJ ajouté")};
$("spawnFamily").onclick=()=>{let [px,py]=landPoint(active),a=makePerson(active,px,py,Math.floor(rnd(22,38))),b=makePerson(active,px+8,py+8,Math.floor(rnd(22,38)));b.sex=a.sex==="F"?"M":"F";a.partner=b.id;b.partner=a.id;a.relationship=b.relationship=85;S.people.push(a,b);let h=addBuilding(active,eraIndex(S.civs[active])?"house":"hut",px+22,py+15,"Maison familiale");a.home=b.home=h.id;h.residents.push(a.id,b.id);showToast("💞 Famille ajoutée")};
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


/* ---------- Replay / save system ---------- */
function replaySnapshotData(){
 return {
  stamp:simStamp(),year:S.year,day:S.day,minute:S.minute,season:S.season,weather:S.weather,war:S.war,tick:S.tick,
  people:structuredClone(S.people),buildings:structuredClone(S.buildings),civs:structuredClone(S.civs),
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
 if(!R.recording||story.replayMode)return;
 if(S.year>=R.lastCaptureYear+2&&S.day<4)captureReplaySnapshot(null)
}
function applyReplaySnapshot(snap){
 S.people=structuredClone(snap.people);S.buildings=structuredClone(snap.buildings);S.civs=structuredClone(snap.civs);S.res=structuredClone(snap.res);S.walls=structuredClone(snap.walls);
 S.year=snap.year;S.day=snap.day;S.minute=snap.minute;S.season=snap.season;S.weather=snap.weather;S.war=snap.war;S.tick=snap.tick;
 selected=null;active=Math.min(active,S.civs.length-1);tabs();editor();update();draw()
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
function openDB(){return new Promise((resolve,reject)=>{let r=indexedDB.open("ai-world-v13",1);r.onupgradeneeded=()=>r.result.createObjectStore("saves");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function dbPut(key,val){let db=await openDB();return new Promise((res,rej)=>{let tx=db.transaction("saves","readwrite");tx.objectStore("saves").put(val,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function dbGet(key){let db=await openDB();return new Promise((res,rej)=>{let tx=db.transaction("saves","readonly"),q=tx.objectStore("saves").get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
function fullSavePayload(){return {version:13,seed,settings:{sea:$("seaLevel").value,relief:$("relief").value,humidity:$("humidity").value,temp:$("temperature").value,rivers:$("rivers").value},S:structuredClone(S),history:structuredClone(story.worldEvents),replay:{snapshots:structuredClone(R.snapshots),events:structuredClone(R.events)}}}
function restorePayload(data){
 if(!data?.S)return false;seed=data.seed??seed;S=data.S;story.worldEvents=data.history||[];R.snapshots=data.replay?.snapshots||[];R.events=data.replay?.events||[];R.recording=$("recordReplay").checked;R.lastCaptureYear=S.year;
 selected=null;active=0;renderWorldJournal();tabs();editor();update();fitWorld();draw();updateReplayUI();return true
}
$("saveSimulation").onclick=async()=>{try{await dbPut("latest",fullSavePayload());showToast("💾 Simulation sauvegardée")}catch(e){console.error(e);showToast("⚠ Sauvegarde impossible")}};
$("loadSimulation").onclick=async()=>{try{let d=await dbGet("latest");if(d&&restorePayload(d))showToast("📂 Simulation chargée");else showToast("Aucune sauvegarde")}catch(e){console.error(e);showToast("⚠ Chargement impossible")}};
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
 let data={version:13,type:"AIWorldReplay",created:new Date().toISOString(),seed,history:story.worldEvents,snapshots:R.snapshots};
 let blob=new Blob([JSON.stringify(data)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`aiworld-replay-A${S.year}.aiworld`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast("📤 Replay exporté")
};
$("importReplay").onchange=async e=>{let f=e.target.files?.[0];if(!f)return;try{let d=JSON.parse(await f.text());if(!Array.isArray(d.snapshots))throw Error("format");R.snapshots=d.snapshots;story.worldEvents=d.history||story.worldEvents;renderWorldJournal();updateReplayUI();enterReplay(0);showToast("📥 Replay importé")}catch(err){showToast("⚠ Replay invalide")}e.target.value=""};
$("journalImportance").onchange=renderWorldJournal;
document.querySelectorAll(".life-tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".life-tab").forEach(q=>q.classList.toggle("active",q===b));document.querySelectorAll(".life-content").forEach(q=>q.classList.toggle("active",q.id===b.dataset.life))});

document.querySelectorAll(".cat").forEach(b=>b.onclick=()=>{document.querySelectorAll(".cat").forEach(q=>q.classList.remove("active"));document.querySelectorAll(".tool-row").forEach(q=>q.classList.remove("active"));b.classList.add("active");$(b.dataset.cat).classList.add("active")});
document.querySelectorAll(".tool[data-tool]").forEach(b=>b.onclick=()=>{currentTool=b.dataset.tool;document.querySelectorAll(".tool[data-tool]").forEach(q=>q.classList.remove("active"));b.classList.add("active")});
document.querySelectorAll(".it").forEach(b=>b.onclick=()=>openInspector(b.dataset.itab));$("closeInspector").onclick=()=>$("inspector").classList.remove("open");$("showLog").onclick=()=>$("logPanel").classList.add("open");$("closeLog").onclick=()=>$("logPanel").classList.remove("open");$("showWorld").onclick=()=>openInspector("worldTab");$("showCiv").onclick=()=>openInspector("civTab");$("showSelected").onclick=()=>openInspector("detailTab");$("openCiv").onclick=()=>openInspector("civTab");
for(const [id,out,suf] of [["seaLevel","seaLevelV","%"],["relief","reliefV","%"],["humidity","humidityV","%"],["temperature","temperatureV","%"],["rivers","riversV",""],["resourceDensity","resourceDensityV","%"],["npcVisualScale","npcVisualScaleV","%"],["buildingVisualScale","buildingVisualScaleV","%"],["textureDetail","textureDetailV","%"],["weatherRate","weatherRateV","%"],["disasterPower","disasterPowerV",""]]){let f=()=>$(out).textContent=$(id).value+suf;$(id).oninput=f;f()}


$("worldScale").onchange=()=>{
 const s=+$("worldScale").value;
 $("mapSizeLabel").textContent=s===.75?"5400×3150":s===1.25?"9000×5250":"7200×4200";
 showToast(s===1.25?"🗺 Vue monde immense":"🗺 Taille d'affichage mise à jour");
};

/* Mouse camera: right-drag or middle-drag. Wheel zooms around cursor. */
c.addEventListener("contextmenu",e=>e.preventDefault());
c.addEventListener("pointerdown",e=>{
 if(e.button===1||e.button===2){drag.on=true;drag.lastX=e.clientX;drag.lastY=e.clientY;c.setPointerCapture(e.pointerId);return}
 let {x:wx,y:wy}=screenToWorld(e.clientX,e.clientY),br=+$("brush").value,t=currentTool;
 if(t==="select"){let nearP=null,pd=(34/camera.zoom)**2;for(const p of S.people){let d=(p.x-wx)**2+(p.y-wy)**2;if(d<pd){pd=d;nearP=p}}if(nearP){active=nearP.ci;tabs();editor();detailPerson(nearP);return}let nearB=null,bd=(46/camera.zoom)**2;for(const b of S.buildings){let d=(b.x-wx)**2+(b.y-wy)**2;if(d<bd){bd=d;nearB=b}}if(nearB){active=nearB.ci;tabs();editor();detailBuilding(nearB)}return}
 if(["food","wood","ore","oil"].includes(t)){for(let i=0;i<br*8;i++)S.res.push({type:t,x:wx+rnd(-br*28,br*28),y:wy+rnd(-br*28,br*28)});return}
 if(t==="wall"){for(let yy=wy-br*45;yy<=wy+br*45;yy+=30)S.walls.push({x:wx,y:yy});return}
 if(t==="erase"){S.walls=S.walls.filter(w=>(w.x-wx)**2+(w.y-wy)**2>(br*55)**2);S.res=S.res.filter(q=>(q.x-wx)**2+(q.y-wy)**2>(br*55)**2);return}
 if(["water","plains","forest","mountain","desert","snow"].includes(t)){let gx=Math.floor(wx/CELL),gy=Math.floor(wy/CELL);for(let dy=-br;dy<=br;dy++)for(let dx=-br;dx<=br;dx++){let xx=gx+dx,yy=gy+dy;if(xx>=0&&yy>=0&&xx<COLS&&yy<ROWS&&dx*dx+dy*dy<=br*br)S.grid[yy*COLS+xx].type=t}}
});
c.addEventListener("pointermove",e=>{
 if(!drag.on)return;
 let dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY,rect=c.getBoundingClientRect();
 camera.x-=dx*(c.width/rect.width)/camera.zoom;camera.y-=dy*(c.height/rect.height)/camera.zoom;
 drag.lastX=e.clientX;drag.lastY=e.clientY;clampCamera();
});
c.addEventListener("pointerup",()=>drag.on=false);
c.addEventListener("pointercancel",()=>drag.on=false);
c.addEventListener("wheel",e=>{
 e.preventDefault();let before=screenToWorld(e.clientX,e.clientY),factor=e.deltaY<0?1.12:.89,newZoom=clamp(camera.zoom*factor,camera.minZoom,camera.maxZoom);
 let rect=c.getBoundingClientRect(),cx=(e.clientX-rect.left)/rect.width*c.width,cy=(e.clientY-rect.top)/rect.height*c.height;
 camera.zoom=newZoom;camera.x=before.x-cx/camera.zoom;camera.y=before.y-cy/camera.zoom;clampCamera();
},{passive:false});

function loop(){updateStoryFrame();if(S.run&&!story.replayMode){let n=story.cinematic?1:+$("speed").value;for(let i=0;i<n;i++)tick()}draw();requestAnimationFrame(loop)}
reset();loop();
})();