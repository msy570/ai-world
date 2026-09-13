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
function civ(i){return {id:i,name:i===0?"Savants":i===1?"Barbares":"Peuple "+(i+1),color:COLORS[i],intel:i?25:88,agg:i?88:20,disc:i?38:78,curiosity:i?30:90,coop:i?35:75,fertility:55,courage:i?90:55,science:0,tech:0,military:0,wealth:50,cities:1,kills:0,discoveries:[]}}
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
  hp:health,hunger:rnd(65,100),age:age??Math.floor(rnd(8,70)),sex,role:roleFor(v),sick:false,cool:0,
  first:pick(sex==="M"?firstNamesM:firstNamesF),last:pick(lastNames),intelligence,strength,charisma,aggression,curiosity,fertility,
  loyalty:clamp(Math.round(60+rnd(-25,30)),1,100),courage:clamp(Math.round(v.courage+rnd(-25,25)),1,100),
  partner:null,home:null,children:[],parents:[...parents],pregnant:0,pregnancyPartner:null,relationship:0,mood:clamp(Math.round(rnd(45,90)),1,100),
  generation:parents.length?1:0};
}
function pname(p){return `${p.first} ${p.last}`}
function log(t){let d=document.createElement("div");d.textContent=`A${S.year} J${S.day} — ${t}`;$("log").prepend(d);while($("log").children.length>160)$("log").lastChild.remove()}

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
function addBuilding(ci,type,x,y,name=null){let def=buildings.find(b=>b.type===type)||buildings[0],b={id:idSeq++,ci,type,x,y,name:name||def.name,beds:def.beds,residents:[]};S.buildings.push(b);return b}
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
 active=0;selected=null;$("log").innerHTML="";log("Grand monde généré : continents, relief et rivières cohérentes.");tabs();editor();update();fitWorld();draw();
 $("detailCard").innerHTML='<div class="empty">Clique sur un élément du monde.</div>';
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
 if(best&&Math.random()<.005){p.partner=best.id;best.partner=p.id;p.relationship=Math.round(score);best.relationship=p.relationship;let home=findBuilding(p.home)||findBuilding(best.home);if(home){p.home=home.id;best.home=home.id;if(!home.residents.includes(p.id))home.residents.push(p.id);if(!home.residents.includes(best.id))home.residents.push(best.id)}log(`${pname(p)} et ${pname(best)} forment un couple.`)}
}
function tryPregnancy(p){
 if(!$("births").checked||!$("familyLife").checked||p.sex!=="F"||!p.partner||p.pregnant>0||p.age<18||p.age>44)return;
 let partner=findPerson(p.partner);if(!partner)return;let home=findBuilding(p.home);if(!home||home.residents.length>=home.beds)return;
 let chance=((p.fertility+partner.fertility)/200)*.0018;if(Math.random()<chance){p.pregnant=270;p.pregnancyPartner=partner.id}
}
function birth(mother){
 let father=findPerson(mother.pregnancyPartner),home=findBuilding(mother.home);if(!father||!home)return;
 let child=makePerson(mother.ci,mother.x+rnd(-10,10),mother.y+rnd(-10,10),0,[mother.id,father.id]);child.last=father.last;child.home=home.id;
 child.intelligence=clamp(Math.round((mother.intelligence+father.intelligence)/2+rnd(-10,10)),1,100);child.strength=clamp(Math.round((mother.strength+father.strength)/2+rnd(-10,10)),1,100);child.charisma=clamp(Math.round((mother.charisma+father.charisma)/2+rnd(-10,10)),1,100);
 home.residents.push(child.id);S.people.push(child);mother.children.push(child.id);father.children.push(child.id);mother.pregnant=0;mother.pregnancyPartner=null;
 log(`Naissance de ${pname(child)}, enfant de ${pname(mother)} et ${pname(father)}.`);showToast(`👶 Naissance : ${pname(child)}`);
}
function stepP(p){
 let v=S.civs[p.ci],e=eraIndex(v);p.hunger-=.014;p.cool=Math.max(0,p.cool-1);let g=null;
 if(p.age<6&&p.home){let h=findBuilding(p.home);if(h)g=h}
 else if(p.hunger<55||/Fermier|Cueilleur/.test(p.role))g=nearestRes(p,"food");
 else if(/Mineur|Ouvrier/.test(p.role))g=nearestRes(p,"ore");
 else if(p.partner&&$("familyLife").checked&&Math.random()<.02){let q=findPerson(p.partner);if(q)g=q}
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
 if(Math.random()<.05*(.4+v.coop/100)){let avail=buildings.filter(b=>b.era<=e&&(needHome?b.beds>0:true)),def=pick(avail),[px,py]=landPoint(ci);addBuilding(ci,def.type,px,py);v.wealth-=10+def.era*5;if(def.type==="hall")v.cities++;assignHomes(ci);log(`${v.name} construit : ${def.name}.`)}
}
function develop(){
 for(let i=0;i<S.civs.length;i++){let v=S.civs[i],ps=S.people.filter(p=>p.ci===i),sch=ps.filter(p=>/Scientifique|Scribe/.test(p.role)).length,sold=ps.filter(p=>/Guerrier|Soldat|Chevalier|Pilote/.test(p.role)).length;
  let prev=eraIndex(v),avgInt=ps.length?ps.reduce((a,p)=>a+p.intelligence,0)/ps.length:v.intel;
  v.science+=(avgInt/100)*(v.curiosity/100)*(.38+sch*.025);v.tech+=v.science/8500*(.45+avgInt/100);v.military+=(v.agg/100)*(.018+sold*.003)+v.tech/50000;
  for(const [name,cost] of techs)if(v.science>=cost&&!v.discoveries.includes(name)){v.discoveries.push(name);log(`${v.name} découvre ${name}.`)}
  let ne=eraIndex(v);if(ne>prev){log(`${v.name} entre dans l’ère ${eras[ne].name}.`);showToast(`${eras[ne].icon} ${v.name} : ère ${eras[ne].name}`);for(const p of ps)p.role=roleFor(v)}
  maybeBuild(i);
 }
}
function weather(){if(Math.random()*100>+$("weatherRate").value)return;S.weather=pick(S.season===3?["Clair","Neige","Neige","Tempête"]:["Clair","Clair","Pluie","Tempête"])}
function tick(){
 S.tick++;S.minute+=+$("timeScale").value;
 if(S.minute>=1440){let d=Math.floor(S.minute/1440);S.minute%=1440;S.day+=d;while(S.day>90){S.day-=90;S.season++;if(S.season>3){S.season=0;S.year++}weather()}}
 for(const p of S.people)stepP(p);
 let dead=S.people.filter(p=>p.hp<=0||p.age>=98);for(const p of dead){if(p.partner){let q=findPerson(p.partner);if(q)q.partner=null}let h=findBuilding(p.home);if(h)h.residents=h.residents.filter(id=>id!==p.id)}
 S.people=S.people.filter(p=>p.hp>0&&p.age<98);
 if(S.tick%22===0)develop();if(S.tick%1100===0)for(const p of S.people)p.age++;
 if(Math.random()<.05&&S.res.length<2200){let [px,py]=landPoint(Math.floor(Math.random()*S.civs.length));S.res.push({type:pick(["food","wood","ore"]),x:px,y:py})}
 if($("disease").checked&&Math.random()<.0001&&S.people.length)pick(S.people).sick=true;
 if($("trade").checked&&!S.war&&S.tick%220===0)for(const v of S.civs)v.wealth+=v.coop/25;update();
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
 let a=b.x,q=b.y,v=S.civs[b.ci],e=buildings.find(z=>z.type===b.type)?.era||0,roof=["#6e4d35","#8c6545","#6b5c4c","#765340","#68717a","#536578"][e]||"#6e4d35";
 ctx.save();ctx.translate(a,q);
 ctx.fillStyle="rgba(0,0,0,.20)";ctx.beginPath();ctx.ellipse(0,9,16,6,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=v?.color||"#aaa";ctx.fillRect(-12,-4,24,16);
 ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(-15,-4);ctx.lineTo(0,-18);ctx.lineTo(15,-4);ctx.closePath();ctx.fill();
 ctx.fillStyle="#ede2c5";ctx.fillRect(-3,3,6,9);
 if(["factory","power"].includes(b.type)){ctx.fillStyle="#444d52";ctx.fillRect(8,-22,5,18);ctx.fillStyle="rgba(220,225,228,.35)";ctx.beginPath();ctx.arc(11,-27,6,0,Math.PI*2);ctx.fill()}
 if(b.type==="hospital"){ctx.fillStyle="#f0f3f4";ctx.fillRect(-2,-1,4,10);ctx.fillRect(-6,2,12,4)}
 if(b.type==="airport"){ctx.fillStyle="#bfc8cc";ctx.fillRect(-19,12,38,4)}
 ctx.restore();
}
function drawPerson(p){
 let a=p.x,b=p.y,v=S.civs[p.ci];ctx.save();ctx.translate(a,b);
 ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.ellipse(0,7,5,2.4,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=p.sex==="F"?"#d9a780":"#c8946e";ctx.beginPath();ctx.arc(0,-6,4.1,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=v.color;ctx.beginPath();ctx.roundRect(-4,-2,8,10,2);ctx.fill();
 ctx.strokeStyle="#283238";ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-2,8);ctx.lineTo(-2,13);ctx.moveTo(2,8);ctx.lineTo(2,13);ctx.stroke();
 if(/Chef|Maire|Président/.test(p.role)){ctx.fillStyle="#f0c64b";ctx.beginPath();ctx.moveTo(-5,-10);ctx.lineTo(0,-14);ctx.lineTo(5,-10);ctx.closePath();ctx.fill()}
 if(/Médecin|Guérisseur/.test(p.role)){ctx.strokeStyle="#eef4f5";ctx.lineWidth=1.4;ctx.strokeRect(5,-1,3,6)}
 if(/Guerrier|Soldat|Chevalier/.test(p.role)){ctx.strokeStyle="#d5dcdf";ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(6,-4);ctx.lineTo(6,8);ctx.stroke()}
 if(p.partner){ctx.fillStyle="#e77fa3";ctx.beginPath();ctx.arc(0,-15,1.8,0,Math.PI*2);ctx.fill()}
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
 drawWeather();
}
function screenToWorld(clientX,clientY){
 let r=c.getBoundingClientRect(),cx=(clientX-r.left)/r.width*c.width,cy=(clientY-r.top)/r.height*c.height;
 return {x:camera.x+cx/camera.zoom,y:camera.y+cy/camera.zoom,cx,cy};
}

/* -------- UI / details -------- */
function tabs(){$("civTabs").innerHTML="";S.civs.forEach((v,i)=>{let b=document.createElement("button");b.className="tab"+(i===active?" active":"");b.textContent=v.name;b.style.borderColor=v.color;b.onclick=()=>{active=i;tabs();editor()};$("civTabs").appendChild(b)})}
const fields=["intel","agg","disc","curiosity","coop","fertility","courage"];
function editor(){let v=S.civs[active];if(!v)return;$("civName").value=v.name;for(const f of fields){$(f).value=v[f];$(f+"V").textContent=v[f]}update()}
function openInspector(tab="detailTab"){$("inspector").classList.add("open");document.querySelectorAll(".it").forEach(b=>b.classList.toggle("active",b.dataset.itab===tab));document.querySelectorAll(".itab").forEach(s=>s.classList.toggle("active",s.id===tab))}
function detailPerson(p){
 let v=S.civs[p.ci],partner=findPerson(p.partner),home=findBuilding(p.home),parents=p.parents.map(findPerson).filter(Boolean),kids=p.children.map(findPerson).filter(Boolean),weapon=weapons.filter(w=>w.era<=eraIndex(v)).slice(-1)[0];
 $("inspectorTitle").textContent=pname(p);$("inspectorSub").textContent=`${p.role} · ${v.name}`;
 $("detailCard").innerHTML=`<div class="detail-head"><div class="portrait">${p.sex==="F"?"👩":"👨"}</div><div><h4>${pname(p)}</h4><p>${p.role} · ${p.age} ans · Gén. ${p.generation}</p></div></div><div class="detail-grid">
 <div><small>Intelligence</small><b>${p.intelligence}</b></div><div><small>Force</small><b>${p.strength}</b></div><div><small>Charisme</small><b>${p.charisma}</b></div><div><small>Agressivité</small><b>${p.aggression}</b></div>
 <div><small>Curiosité</small><b>${p.curiosity}</b></div><div><small>Courage</small><b>${p.courage}</b></div><div><small>Loyauté</small><b>${p.loyalty}</b></div><div><small>Humeur</small><b>${p.mood}</b></div>
 <div><small>Santé</small><b>${Math.ceil(p.hp)}%</b></div><div><small>Arme</small><b>${weapon.name}</b></div><div><small>Habitat</small><b>${home?home.name:"Aucun"}</b></div><div><small>État</small><b>${p.pregnant>0?"Grossesse":p.sick?"Malade":"Normal"}</b></div></div>
 <div class="family-box"><b>💞 Famille</b>Partenaire : ${partner?pname(partner):"Aucun"}<br>Parents : ${parents.length?parents.map(pname).join(", "):"—"}<br>Enfants : ${kids.length?kids.map(pname).join(", "):"Aucun"}</div>`;
 openInspector("detailTab");$("selected").textContent=`${pname(p)} · ${p.role}`;
}
function detailBuilding(b){let v=S.civs[b.ci];$("inspectorTitle").textContent=b.name;$("inspectorSub").textContent=v.name;$("detailCard").innerHTML=`<div class="detail-head"><div class="portrait">🏠</div><div><h4>${b.name}</h4><p>${v.name}</p></div></div><div class="detail-grid"><div><small>Type</small><b>${b.type}</b></div><div><small>Lits</small><b>${b.beds}</b></div><div><small>Résidents</small><b>${b.residents.length}</b></div><div><small>Époque</small><b>${eras[eraIndex(v)].name}</b></div></div>`;openInspector("detailTab");$("selected").textContent=`${b.name} · ${v.name}`}
function update(){
 let v=S.civs[active];if(v){$("pop").textContent=S.people.filter(p=>p.ci===active).length;$("era").textContent=eras[eraIndex(v)].name;$("science").textContent=Math.floor(v.science);$("tech").textContent=Math.floor(v.tech);$("military").textContent=Math.floor(v.military);$("cities").textContent=v.cities;
 $("techTree").innerHTML=techs.map(t=>`<div class="unlock ${v.discoveries.includes(t[0])?"ok":"locked"}">${v.discoveries.includes(t[0])?"✓":"🔒"} ${t[0]}</div>`).join("");let e=eraIndex(v);$("buildingList").innerHTML=buildings.map(b=>`<div class="unlock ${b.era<=e?"ok":"locked"}">${b.era<=e?"✓":"🔒"} ${b.name}</div>`).join("");$("weaponList").innerHTML=weapons.map(w=>`<div class="unlock ${w.era<=e?"ok":"locked"}">${w.era<=e?"✓":"🔒"} ${w.name}</div>`).join("")}
 $("clock").textContent=`A${S.year} · J${S.day} · ${String(Math.floor(S.minute/60)).padStart(2,"0")}:${String(S.minute%60).padStart(2,"0")}`;$("weather").textContent="🌦 "+S.weather;$("season").textContent=["🌱 Printemps","☀ Été","🍂 Automne","❄ Hiver"][S.season];let best=Math.max(...S.civs.map(eraIndex));$("eraGlobal").textContent=`${eras[best].icon} ${eras[best].name}`;$("worldPop").textContent=`👥 ${S.people.length}`;
}
for(const f of fields)$(f).oninput=()=>{let v=S.civs[active];v[f]=+$(f).value;$(f+"V").textContent=v[f]};
$("civName").onchange=()=>{S.civs[active].name=$("civName").value||S.civs[active].name;tabs()};
$("play").onclick=()=>S.run=true;$("pause").onclick=()=>S.run=false;$("regen").onclick=reset;
function setCinema(on){document.body.classList.toggle("cinema",on)}
$("cinema").onclick=()=>setCinema(true);
$("cinemaExit").onclick=()=>setCinema(false);
$("cinemaSettings").onclick=()=>{setCinema(false);openInspector("worldTab")};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("cinema"))setCinema(false)});
$("fitWorld").onclick=fitWorld;
$("centerView").onclick=()=>{camera.x=W/2-c.width/(2*camera.zoom);camera.y=H/2-c.height/(2*camera.zoom);clampCamera()};
$("war").onclick=()=>{S.war=true;log("Guerre globale déclarée.");showToast("⚔ Guerre globale")};$("peace").onclick=()=>{S.war=false;log("Paix imposée.");showToast("☮ Paix")};$("breakWalls").onclick=()=>{S.walls=[];log("Tous les murs sont détruits.")};
$("addCiv").onclick=()=>{if(S.civs.length>=8)return;let i=S.civs.length;S.civs.push(civ(i));let [cx,cy]=landPoint(i);for(let h=0;h<7;h++)addBuilding(i,"hut",cx+rnd(-140,140),cy+rnd(-140,140));for(let k=0;k<45;k++){let [px,py]=landPoint(i);S.people.push(makePerson(i,px,py))}assignHomes(i);active=i;tabs();editor();showToast("🏛 Nouvelle civilisation")};
$("removeCiv").onclick=()=>{if(S.civs.length<=2)return;let i=active;S.people=S.people.filter(p=>p.ci!==i);S.buildings=S.buildings.filter(b=>b.ci!==i);S.civs.splice(i,1);for(const p of S.people)if(p.ci>i)p.ci--;for(const b of S.buildings)if(b.ci>i)b.ci--;active=0;tabs();editor()};
$("spawnPerson").onclick=()=>{let [px,py]=landPoint(active);S.people.push(makePerson(active,px,py));assignHomes(active);showToast("👤 PNJ ajouté")};
$("spawnFamily").onclick=()=>{let [px,py]=landPoint(active),a=makePerson(active,px,py,Math.floor(rnd(22,38))),b=makePerson(active,px+8,py+8,Math.floor(rnd(22,38)));b.sex=a.sex==="F"?"M":"F";a.partner=b.id;b.partner=a.id;a.relationship=b.relationship=85;S.people.push(a,b);let h=addBuilding(active,eraIndex(S.civs[active])?"house":"hut",px+22,py+15,"Maison familiale");a.home=b.home=h.id;h.residents.push(a.id,b.id);showToast("💞 Famille ajoutée")};
function disaster(d){let p=+$("disasterPower").value;if(d==="famine")S.res=S.res.filter(r=>r.type!=="food"||Math.random()>p/100);if(d==="plague")for(const q of S.people)if(Math.random()<p/150)q.sick=true;if(d==="meteor"||d==="nuke"){let mx=rnd(0,W),my=rnd(0,H),rr=(d==="nuke"?280:160)+p*5;for(const q of S.people)if((q.x-mx)**2+(q.y-my)**2<rr*rr)q.hp-=200;S.buildings=S.buildings.filter(b=>(b.x-mx)**2+(b.y-my)**2>=rr*rr)}if(d==="storm")S.weather="Tempête";if(d==="fire")for(const q of S.people)if(Math.random()<p/500)q.hp-=rnd(10,60);log("Catastrophe : "+d);showToast("☄ "+d)}
document.querySelectorAll(".disaster").forEach(b=>b.onclick=()=>disaster(b.dataset.disaster));
document.querySelectorAll(".cat").forEach(b=>b.onclick=()=>{document.querySelectorAll(".cat").forEach(q=>q.classList.remove("active"));document.querySelectorAll(".tool-row").forEach(q=>q.classList.remove("active"));b.classList.add("active");$(b.dataset.cat).classList.add("active")});
document.querySelectorAll(".tool[data-tool]").forEach(b=>b.onclick=()=>{currentTool=b.dataset.tool;document.querySelectorAll(".tool[data-tool]").forEach(q=>q.classList.remove("active"));b.classList.add("active")});
document.querySelectorAll(".it").forEach(b=>b.onclick=()=>openInspector(b.dataset.itab));$("closeInspector").onclick=()=>$("inspector").classList.remove("open");$("showLog").onclick=()=>$("logPanel").classList.add("open");$("closeLog").onclick=()=>$("logPanel").classList.remove("open");$("showWorld").onclick=()=>openInspector("worldTab");$("showCiv").onclick=()=>openInspector("civTab");$("showSelected").onclick=()=>openInspector("detailTab");$("openCiv").onclick=()=>openInspector("civTab");
for(const [id,out,suf] of [["seaLevel","seaLevelV","%"],["relief","reliefV","%"],["humidity","humidityV","%"],["temperature","temperatureV","%"],["rivers","riversV",""],["resourceDensity","resourceDensityV","%"],["weatherRate","weatherRateV","%"],["disasterPower","disasterPowerV",""]]){let f=()=>$(out).textContent=$(id).value+suf;$(id).oninput=f;f()}

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

function loop(){if(S.run){let n=+$("speed").value;for(let i=0;i<n;i++)tick()}draw();requestAnimationFrame(loop)}
reset();loop();
})();