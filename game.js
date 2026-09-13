(()=>{
const c=document.querySelector("#c"),x=c.getContext("2d");x.imageSmoothingEnabled=false;
const W=2560,H=1440,CELL=24,COLS=Math.ceil(W/CELL),ROWS=Math.ceil(H/CELL);
const COLORS=["#4f8fd8","#d85b53","#62ad69","#d2a34d","#9a70d0","#49aaa5","#d47caf","#9b795b"];
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const eras=[
 {name:"Tribal",min:0,icon:"🪵"},
 {name:"Antique",min:140,icon:"🏺"},
 {name:"Médiévale",min:380,icon:"🏰"},
 {name:"Industrielle",min:800,icon:"🏭"},
 {name:"Moderne",min:1500,icon:"🏙"},
 {name:"Avancée",min:2800,icon:"🚁"}
];
const techs=[
 ["Agriculture",50],["Écriture",120],["Métallurgie",220],["Médecine",360],["Ingénierie",540],
 ["Poudre",760],["Industrie",1000],["Électricité",1400],["Moteurs",1800],["Aviation",2250],
 ["Informatique",2800],["Énergie atomique",3500]
];
const buildings=[
 {name:"Hutte",era:0,type:"hut"},{name:"Ferme",era:0,type:"farm"},{name:"Maison",era:1,type:"house"},
 {name:"Atelier",era:1,type:"workshop"},{name:"Caserne",era:2,type:"barracks"},{name:"Hôtel de ville",era:2,type:"hall"},
 {name:"Hôpital",era:3,type:"hospital"},{name:"Usine",era:3,type:"factory"},{name:"Laboratoire",era:4,type:"lab"},
 {name:"Centrale",era:4,type:"power"},{name:"Aéroport",era:5,type:"airport"},{name:"Centre stratégique",era:5,type:"strategic"}
];
const weapons=[
 {name:"Bâton",era:0,power:1},{name:"Lance",era:0,power:1.4},{name:"Épée",era:1,power:2},
 {name:"Arc",era:1,power:2.2},{name:"Arbalète",era:2,power:2.7},{name:"Mousquet",era:2,power:3.4},
 {name:"Fusil",era:3,power:4.3},{name:"Mitrailleuse",era:3,power:5.2},{name:"Blindé",era:4,power:7.5},
 {name:"Hélicoptère",era:5,power:11},{name:"Missile stratégique",era:5,power:15}
];

let S,active=0,selected=null,seed=Math.random()*99999;
function civ(i){return {id:i,name:i===0?"Savants":i===1?"Barbares":"Peuple "+(i+1),color:COLORS[i],intel:i?25:88,agg:i?88:20,disc:i?38:78,curiosity:i?30:90,coop:i?35:75,fertility:55,courage:i?90:55,science:0,tech:0,military:0,wealth:50,cities:1,kills:0,discoveries:[]}}
function eraIndex(v){let idx=0;for(let i=0;i<eras.length;i++)if(v.tech>=eras[i].min)idx=i;return idx}
function roleFor(v){
 const e=eraIndex(v),r=Math.random();
 if(e===0)return r<.03?"Chef de tribu":r<.08?"Guérisseur":r<.25?"Guerrier":pick(["Cueilleur","Chasseur","Artisan"]);
 if(e===1)return r<.03?"Chef":r<.08?"Médecin":r<.22?"Soldat":pick(["Fermier","Forgeron","Scribe"]);
 if(e===2)return r<.025?"Maire":r<.07?"Médecin":r<.22?"Chevalier":pick(["Fermier","Artisan","Marchand"]);
 if(e===3)return r<.02?"Maire":r<.07?"Médecin":r<.18?"Soldat":pick(["Ouvrier","Ingénieur","Scientifique"]);
 if(e===4)return r<.018?"Président":r<.07?"Médecin":r<.18?"Soldat":pick(["Ingénieur","Scientifique","Technicien"]);
 return r<.015?"Président":r<.055?"Médecin":r<.15?"Pilote":pick(["Scientifique","Ingénieur","Technicien"]);
}
function person(ci,x0=null,y0=null){let v=S.civs[ci],band=W/S.civs.length;return {ci,x:x0??rnd(ci*band+60,(ci+1)*band-60),y:y0??rnd(100,H-80),vx:rnd(-1,1),vy:rnd(-1,1),hp:100,hunger:rnd(65,100),age:Math.floor(rnd(8,70)),sex:Math.random()<.5?"F":"M",role:roleFor(v),sick:false,cool:0,name:pick(["Ari","Lio","Noa","Milo","Ena","Sia","Tao","Lina","Néo","Iris","Yuna","Eli"])+" "+pick(["Val","Roc","Bel","Sol","Ren","Mar","Dor","Kai","Lun","Ser"])}}
function log(t){let d=document.createElement("div");d.textContent=`A${S.year} J${S.day} — ${t}`;$("log").prepend(d);while($("log").children.length>120)$("log").lastChild.remove()}
function noise(ix,iy,s=0){let n=Math.sin(ix*12.9898+iy*78.233+seed+s*37.17)*43758.5453;return n-Math.floor(n)}
function smoothNoise(ix,iy,s=0){let total=0,weight=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){let w=1/(1+Math.abs(dx)+Math.abs(dy));total+=noise(ix+dx,iy+dy,s)*w;weight+=w}return total/weight}
function generateTerrain(){
 const sea=+$("seaLevel").value/100,rel=+$("relief").value/100,hum=+$("humidity").value/100,temp=+$("temperature").value/100;
 S.grid=new Array(COLS*ROWS);
 for(let gy=0;gy<ROWS;gy++)for(let gx=0;gx<COLS;gx++){
   let nx=gx/COLS-.5,ny=gy/ROWS-.5;
   let base=.58*smoothNoise(gx/4,gy/4,1)+.28*smoothNoise(gx/9,gy/9,2)+.14*noise(gx,gy,3);
   let edge=Math.pow(Math.max(Math.abs(nx)*1.6,Math.abs(ny)*1.55),2)*.38;
   let elev=base*(.68+.5*rel)-edge;
   let m=.55*smoothNoise(gx/6,gy/6,4)+.45*hum;
   let latitude=Math.abs(ny)*.55;
   let t=.55*temp+.45*smoothNoise(gx/8,gy/8,5)-latitude;
   let type="plains";
   if(elev<sea)type="water";
   else if(elev<sea+.025)type="sand";
   else if(elev>sea+.36+.12*(1-rel))type=t<.42?"snow":"mountain";
   else if(t<.27)type="snow";
   else if(t>.66&&m<.43)type="desert";
   else if(m>.58)type="forest";
   S.grid[gy*COLS+gx]={type,elev,m,t,river:false};
 }
 // Rivers: start on mountains/high cells and flow greedily downhill.
 let rivers=+$("rivers").value;
 let highs=[];for(let gy=2;gy<ROWS-2;gy++)for(let gx=2;gx<COLS-2;gx++){let q=S.grid[gy*COLS+gx];if(q.type==="mountain"||q.type==="snow")highs.push([gx,gy,q.elev])}
 highs.sort((a,b)=>b[2]-a[2]);
 for(let r=0;r<rivers&&highs.length;r++){
   let [gx,gy]=highs[Math.floor((r/(Math.max(1,rivers)))*Math.min(highs.length-1,200))]||highs[0]||[Math.floor(COLS/2),Math.floor(ROWS/2)];
   let seen=new Set();
   for(let k=0;k<180;k++){
     let idx=gy*COLS+gx,q=S.grid[idx];if(!q||q.type==="water")break;q.river=true;q.type="water";
     seen.add(idx);let best=null,bv=1e9;
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let xx=gx+dx,yy=gy+dy;if(xx<1||yy<1||xx>=COLS-1||yy>=ROWS-1)continue;let ii=yy*COLS+xx;if(seen.has(ii))continue;let v=S.grid[ii].elev+Math.random()*.025;if(v<bv){bv=v;best=[xx,yy]}}
     if(!best)break;[gx,gy]=best;
   }
 }
}
function terrainAt(px,py){let gx=clamp(Math.floor(px/CELL),0,COLS-1),gy=clamp(Math.floor(py/CELL),0,ROWS-1);return S.grid[gy*COLS+gx]}
function landPoint(ci){let band=W/S.civs.length;for(let k=0;k<500;k++){let px=rnd(ci*band+50,(ci+1)*band-50),py=rnd(80,H-60),t=terrainAt(px,py).type;if(!["water","mountain","snow"].includes(t))return [px,py]}return [ci*band+band/2,H/2]}
function seedResources(){
 S.res=[];let den=+$("resourceDensity").value/100,count=Math.floor(700*den);
 for(let i=0;i<count;i++){let px=rnd(20,W-20),py=rnd(40,H-20),t=terrainAt(px,py).type;if(t==="water")continue;
   let type=t==="forest"?pick(["wood","wood","food"]):t==="mountain"?pick(["ore","ore","wood"]):t==="desert"?pick(["ore","oil","oil"]):pick(["food","food","wood","ore"]);
   S.res.push({type,x:px,y:py});
 }
}
function reset(){
 seed=Math.random()*99999;S={run:false,tick:0,minute:480,day:1,year:1,season:0,weather:"Clair",war:false,walls:[],grid:[],res:[],buildings:[],people:[],civs:[civ(0),civ(1)]};
 generateTerrain();seedResources();
 for(let ci=0;ci<2;ci++){let [cx,cy]=landPoint(ci);S.buildings.push({ci,x:cx,y:cy,type:"hut",name:"Village initial"});for(let i=0;i<55;i++){let [px,py]=landPoint(ci);S.people.push(person(ci,px,py))}}
 let mid=W/2;for(let y=0;y<H;y+=24)S.walls.push({x:mid,y});
 active=0;selected=null;$("log").innerHTML="";log("Nouveau monde généré avec relief, biomes et rivières.");tabs();editor();update();draw();
}
function addRes(type,a,b){S.res.push({type,x:a,y:b})}
function nearestRes(p,type){let q=null,d=1e20;for(const r of S.res){if(type&&r.type!==type)continue;let z=(r.x-p.x)**2+(r.y-p.y)**2;if(z<d){d=z;q=r}}return q}
function enemy(p,range){let q=null,d=range*range;for(const e of S.people)if(e.ci!==p.ci){let z=(e.x-p.x)**2+(e.y-p.y)**2;if(z<d){d=z;q=e}}return q}
function blocked(px,nx,py){for(const w of S.walls)if(Math.abs(w.y-py)<24&&((px<w.x&&nx>=w.x-7)||(px>w.x&&nx<=w.x+7)))return true;return false}
function stepP(p){
 let v=S.civs[p.ci],e=eraIndex(v);p.hunger-=.014;p.cool=Math.max(0,p.cool-1);let g=null;
 if(p.hunger<55||p.role.includes("Fermier")||p.role.includes("Cueilleur"))g=nearestRes(p,"food");
 else if(p.role.includes("Mineur")||p.role.includes("Ouvrier"))g=nearestRes(p,"ore");
 if(S.war&&(p.role.match(/Guerrier|Soldat|Chevalier|Pilote/)||Math.random()<v.agg/350))g=enemy(p,300+v.courage*2)||g;
 if(g){let dx=g.x-p.x,dy=g.y-p.y,m=Math.hypot(dx,dy)||1;p.vx+=dx/m*.08;p.vy+=dy/m*.08}
 p.vx+=rnd(-.07,.07);p.vy+=rnd(-.07,.07);let terr=terrainAt(p.x,p.y).type,slow=terr==="forest"?.8:terr==="mountain"?.55:terr==="water"?.35:1;if(S.weather==="Tempête")slow*=.7;
 let sp=(.7+v.disc/130)*slow,m=Math.hypot(p.vx,p.vy)||1;if(m>sp){p.vx=p.vx/m*sp;p.vy=p.vy/m*sp}
 let nx=clamp(p.x+p.vx,8,W-8),ny=clamp(p.y+p.vy,55,H-8);if(blocked(p.x,nx,ny)){p.vx*=-1;nx=p.x}p.x=nx;p.y=ny;
 for(let i=S.res.length-1;i>=0;i--){let r=S.res[i];if((r.x-p.x)**2+(r.y-p.y)**2<115){if(r.type==="food")p.hunger=Math.min(100,p.hunger+33);v.wealth+=(r.type==="ore"||r.type==="oil")?1:.2;S.res.splice(i,1);break}}
 if(p.hunger<=0)p.hp-=.11;if(p.sick)p.hp-=.012;if(S.weather==="Tempête"&&Math.random()<.00025)p.hp-=4;
 if(S.war&&p.cool===0){let en=enemy(p,20);if(en){let wp=weapons.filter(w=>w.era<=e).slice(-1)[0],power=(wp?.power||1)+v.military/350;en.hp-=power*rnd(.65,1.2);p.cool=11;if(en.hp<=0)v.kills++}}
}
function maybeBuild(ci){
 let v=S.civs[ci],e=eraIndex(v);if(!$("autoBuild").checked)return;let ps=S.people.filter(p=>p.ci===ci);if(ps.length<12||v.wealth<15)return;
 if(Math.random()<.055*(.4+v.coop/100)){let avail=buildings.filter(b=>b.era<=e),b=pick(avail),[px,py]=landPoint(ci);S.buildings.push({ci,x:px,y:py,type:b.type,name:b.name});v.wealth-=10+b.era*5;if(b.type==="hall")v.cities++;log(`${v.name} construit : ${b.name}.`)}
}
function develop(){
 for(let i=0;i<S.civs.length;i++){let v=S.civs[i],ps=S.people.filter(p=>p.ci===i),sch=ps.filter(p=>/Scientifique|Scribe/.test(p.role)).length,sold=ps.filter(p=>/Guerrier|Soldat|Chevalier|Pilote/.test(p.role)).length;
   let prevEra=eraIndex(v);v.science+=(v.intel/100)*(v.curiosity/100)*(.38+sch*.025);v.tech+=v.science/8500*(.45+v.intel/100);v.military+=(v.agg/100)*(.018+sold*.003)+v.tech/50000;
   for(const [name,cost] of techs)if(v.science>=cost&&!v.discoveries.includes(name)){v.discoveries.push(name);log(`${v.name} découvre ${name}.`)}
   let newEra=eraIndex(v);if(newEra>prevEra){log(`${v.name} entre dans l’ère ${eras[newEra].name}.`);for(const p of ps)p.role=roleFor(v)}
   if($("births").checked&&ps.length<300&&Math.random()<.007*v.fertility/100){let [px,py]=landPoint(i);S.people.push(person(i,px,py))}
   maybeBuild(i);
 }
}
function weather(){if(Math.random()*100>+$("weatherRate").value)return;S.weather=pick(S.season===3?["Clair","Neige","Neige","Tempête"]:["Clair","Clair","Pluie","Tempête"])}
function tick(){S.tick++;S.minute+=+$("timeScale").value;if(S.minute>=1440){let d=Math.floor(S.minute/1440);S.minute%=1440;S.day+=d;while(S.day>90){S.day-=90;S.season++;if(S.season>3){S.season=0;S.year++}weather()}}
 for(const p of S.people)stepP(p);S.people=S.people.filter(p=>p.hp>0&&p.age<98);
 if(S.tick%22===0)develop();if(S.tick%1100===0)for(const p of S.people)p.age++;
 if(Math.random()<.05&&S.res.length<1000){let [px,py]=landPoint(Math.floor(Math.random()*S.civs.length));addRes(pick(["food","wood","ore"]),px,py)}
 if($("disease").checked&&Math.random()<.0001&&S.people.length)pick(S.people).sick=true;
 if($("trade").checked&&!S.war&&S.tick%220===0)for(const v of S.civs)v.wealth+=v.coop/25;
 update();
}
function sx(a){return a/W*c.width}function sy(a){return a/H*c.height}
const biomeColors={water:"#2d6d92",sand:"#bca76c",plains:"#527b45",forest:"#2d6035",mountain:"#6c706c",desert:"#a88a4b",snow:"#d7e3e6"};
function drawTerrain(){
 for(let gy=0;gy<ROWS;gy++)for(let gx=0;gx<COLS;gx++){let q=S.grid[gy*COLS+gx],px=sx(gx*CELL),py=sy(gy*CELL),pw=Math.ceil(c.width/COLS)+1,ph=Math.ceil(c.height/ROWS)+1;x.fillStyle=biomeColors[q.type]||"#527b45";x.fillRect(px,py,pw,ph);
   if((gx+gy)%5===0){x.fillStyle=q.type==="forest"?"#214d2b":q.type==="mountain"?"#858983":q.type==="desert"?"#b69a5c":q.type==="snow"?"#eef5f6":q.type==="water"?"#347ca3":"#5d8750";x.fillRect(px+2,py+2,2,2)}
 }
}
function drawBuilding(b){let a=sx(b.x),q=sy(b.y),v=S.civs[b.ci],e=buildings.find(z=>z.type===b.type)?.era||0;
 const roof=["#6e4d35","#8c6545","#6b5c4c","#765340","#68717a","#536578"][e]||"#6e4d35";
 x.fillStyle=v?.color||"#aaa";x.fillRect(a-8,q-5,16,11);x.fillStyle=roof;x.beginPath();x.moveTo(a-10,q-5);x.lineTo(a,q-13);x.lineTo(a+10,q-5);x.fill();
 if(["factory","power"].includes(b.type)){x.fillStyle="#485158";x.fillRect(a+5,q-16,4,9)}
 if(b.type==="hospital"){x.fillStyle="#e9eeee";x.fillRect(a-2,q-3,4,7);x.fillRect(a-5,q,10,2)}
 if(b.type==="airport"){x.fillStyle="#bbc4c8";x.fillRect(a-11,q+8,22,3)}
 if(b.type==="strategic"){x.fillStyle="#343b40";x.fillRect(a-5,q-16,10,11)}
}
function drawPerson(p){let a=sx(p.x),b=sy(p.y),v=S.civs[p.ci],role=p.role;
 x.fillStyle="#c89570";x.fillRect(a-2,b-7,4,4);x.fillStyle=v.color;x.fillRect(a-3,b-3,6,7);x.fillStyle="#273036";x.fillRect(a-3,b+4,2,4);x.fillRect(a+1,b+4,2,4);
 if(/Chef|Maire|Président/.test(role)){x.fillStyle="#f0c64b";x.fillRect(a-3,b-9,6,2)}
 if(/Médecin|Guérisseur/.test(role)){x.fillStyle="#eef4f5";x.fillRect(a+4,b-2,2,5)}
 if(/Guerrier|Soldat|Chevalier/.test(role)){x.fillStyle="#c8d0d3";x.fillRect(a+4,b-4,1,9)}
 if(role==="Pilote"){x.fillStyle="#30373a";x.fillRect(a-3,b-9,6,2)}
 if(p.sick){x.fillStyle="#84d27e";x.fillRect(a-1,b-10,2,2)}
}
function draw(){
 drawTerrain();
 for(const r of S.res){let a=sx(r.x),b=sy(r.y);x.fillStyle=r.type==="food"?"#d6b44a":r.type==="wood"?"#6a4d31":r.type==="oil"?"#242629":"#a2abb0";x.fillRect(a-2,b-2,4,4)}
 for(const b of S.buildings)drawBuilding(b);
 for(const w of S.walls){x.fillStyle="#817a70";x.fillRect(sx(w.x)-2,sy(w.y),4,13)}
 for(const p of S.people)drawPerson(p);
 if(S.weather==="Pluie"||S.weather==="Tempête"){x.strokeStyle="#b4d0df77";for(let i=0;i<(S.weather==="Tempête"?140:70);i++){let a=(i*83+S.tick*8)%c.width,b=(i*47+S.tick*11)%c.height;x.beginPath();x.moveTo(a,b);x.lineTo(a-5,b+9);x.stroke()}}
 if(S.weather==="Neige"){x.fillStyle="#f2f7f8";for(let i=0;i<100;i++)x.fillRect((i*71+S.tick*2)%c.width,(i*43+S.tick*3)%c.height,2,2)}
}
function tabs(){$("civTabs").innerHTML="";S.civs.forEach((v,i)=>{let b=document.createElement("button");b.className="tab"+(i===active?" active":"");b.textContent=v.name;b.style.borderColor=v.color;b.onclick=()=>{active=i;tabs();editor()};$("civTabs").appendChild(b)})}
const fields=["intel","agg","disc","curiosity","coop","fertility","courage"];
function editor(){let v=S.civs[active];if(!v)return;$("civName").value=v.name;for(const f of fields){$(f).value=v[f];$(f+"V").textContent=v[f]}update()}
function detail(obj,type){selected={obj,type};let card=$("detailCard");if(type==="person"){let p=obj,v=S.civs[p.ci];card.innerHTML=`<div class="detail-head"><div class="portrait">👤</div><div><h4>${p.name}</h4><p>${p.role} · ${v.name}</p></div></div><div class="detail-grid"><div><small>Âge</small><b>${p.age} ans</b></div><div><small>Santé</small><b>${Math.max(0,Math.ceil(p.hp))}%</b></div><div><small>Faim</small><b>${Math.ceil(p.hunger)}%</b></div><div><small>Époque</small><b>${eras[eraIndex(v)].name}</b></div><div><small>Malade</small><b>${p.sick?"Oui":"Non"}</b></div><div><small>Arme</small><b>${weapons.filter(w=>w.era<=eraIndex(v)).slice(-1)[0].name}</b></div></div>`;$("selected").textContent=`${p.name} · ${p.role} · ${v.name}`}
 else {let b=obj,v=S.civs[b.ci];card.innerHTML=`<div class="detail-head"><div class="portrait">🏠</div><div><h4>${b.name||b.type}</h4><p>${v.name}</p></div></div><div class="detail-grid"><div><small>Type</small><b>${b.type}</b></div><div><small>Époque</small><b>${eras[eraIndex(v)].name}</b></div></div>`;$("selected").textContent=`${b.name||b.type} · ${v.name}`}}
function update(){
 let v=S.civs[active];if(v){$("pop").textContent=S.people.filter(p=>p.ci===active).length;$("era").textContent=eras[eraIndex(v)].name;$("science").textContent=Math.floor(v.science);$("tech").textContent=Math.floor(v.tech);$("military").textContent=Math.floor(v.military);$("cities").textContent=v.cities;
 $("techTree").innerHTML=techs.map(t=>`<span class="${v.discoveries.includes(t[0])?"on":"off"}">${t[0]}</span>`).join("");
 let e=eraIndex(v);$("buildingList").innerHTML=buildings.map(b=>`<div class="unlock ${b.era<=e?"ok":"locked"}">${b.era<=e?"✓":"🔒"} ${b.name}</div>`).join("");
 $("weaponList").innerHTML=weapons.map(w=>`<div class="unlock ${w.era<=e?"ok":"locked"}">${w.era<=e?"✓":"🔒"} ${w.name}</div>`).join("");
 }
 $("clock").textContent=`Année ${S.year} · Jour ${S.day} · ${String(Math.floor(S.minute/60)).padStart(2,"0")}:${String(S.minute%60).padStart(2,"0")}`;
 $("weather").textContent="🌦 "+S.weather;$("season").textContent=["🌱 Printemps","☀ Été","🍂 Automne","❄ Hiver"][S.season];
 let best=Math.max(...S.civs.map(v=>eraIndex(v)));$("eraGlobal").textContent=`${eras[best].icon} Ère ${eras[best].name}`;
}
for(const f of fields)$(f).oninput=()=>{let v=S.civs[active];v[f]=+$(f).value;$(f+"V").textContent=v[f]};
$("civName").onchange=()=>{S.civs[active].name=$("civName").value||S.civs[active].name;tabs()};
$("play").onclick=()=>S.run=true;$("pause").onclick=()=>S.run=false;$("new").onclick=reset;$("regen").onclick=reset;
$("breakWalls").onclick=()=>{S.walls=[];log("Tous les murs sont détruits.")};$("war").onclick=()=>{S.war=true;log("Guerre globale déclarée.")};$("peace").onclick=()=>{S.war=false;log("Paix imposée.")};
$("addCiv").onclick=()=>{if(S.civs.length>=8)return;let i=S.civs.length;S.civs.push(civ(i));let [cx,cy]=landPoint(i);S.buildings.push({ci:i,x:cx,y:cy,type:"hut",name:"Nouveau village"});for(let k=0;k<40;k++){let [px,py]=landPoint(i);S.people.push(person(i,px,py))}active=i;tabs();editor();log("Une nouvelle civilisation apparaît.")};
$("removeCiv").onclick=()=>{if(S.civs.length<=2)return;let i=active;S.people=S.people.filter(p=>p.ci!==i);S.buildings=S.buildings.filter(b=>b.ci!==i);S.civs.splice(i,1);for(const p of S.people)if(p.ci>i)p.ci--;for(const b of S.buildings)if(b.ci>i)b.ci--;active=0;tabs();editor()};
$("trigger").onclick=()=>{let d=$("disaster").value,p=+$("disasterPower").value;if(!d)return;if(d==="famine")S.res=S.res.filter(r=>r.type!=="food"||Math.random()>p/100);if(d==="plague")for(const q of S.people)if(Math.random()<p/150)q.sick=true;if(d==="meteor"||d==="nuke"){let mx=rnd(0,W),my=rnd(0,H),rr=(d==="nuke"?180:100)+p*4;for(const q of S.people)if((q.x-mx)**2+(q.y-my)**2<rr*rr)q.hp-=200;for(const b of S.buildings)if((b.x-mx)**2+(b.y-my)**2<rr*rr)b.destroyed=true;S.buildings=S.buildings.filter(b=>!b.destroyed);log(d==="nuke"?"Frappe nucléaire déclenchée.":"Impact de météorite.")}if(d==="storm")S.weather="Tempête";if(d==="fire")for(const q of S.people)if(Math.random()<p/500)q.hp-=rnd(10,60);if(!["meteor","nuke"].includes(d))log("Événement : "+d+".")};
$("cinema").onclick=()=>document.body.classList.toggle("cinema");
for(const [id,out,suf] of [["seaLevel","seaLevelV","%"],["relief","reliefV","%"],["humidity","humidityV","%"],["temperature","temperatureV","%"],["rivers","riversV",""],["resourceDensity","resourceDensityV","%"],["weatherRate","weatherRateV","%"],["disasterPower","disasterPowerV",""]]){let f=()=>$(out).textContent=$(id).value+suf;$(id).oninput=f;f()}
c.addEventListener("pointerdown",e=>{
 let r=c.getBoundingClientRect(),wx=(e.clientX-r.left)/r.width*W,wy=(e.clientY-r.top)/r.height*H,t=$("tool").value,br=+$("brush").value;
 if(t==="select"){let nearP=null,pd=26*26;for(const p of S.people){let d=(p.x-wx)**2+(p.y-wy)**2;if(d<pd){pd=d;nearP=p}}if(nearP){active=nearP.ci;tabs();editor();detail(nearP,"person");return}let nearB=null,bd=40*40;for(const b of S.buildings){let d=(b.x-wx)**2+(b.y-wy)**2;if(d<bd){bd=d;nearB=b}}if(nearB){active=nearB.ci;tabs();editor();detail(nearB,"building")}return}
 if(["food","wood","ore","oil"].includes(t)){for(let i=0;i<br*8;i++)addRes(t,wx+rnd(-br*18,br*18),wy+rnd(-br*18,br*18));return}
 if(t==="wall"){for(let yy=wy-br*30;yy<=wy+br*30;yy+=18)S.walls.push({x:wx,y:yy});return}
 if(t==="erase"){S.walls=S.walls.filter(w=>(w.x-wx)**2+(w.y-wy)**2>(br*35)**2);S.res=S.res.filter(q=>(q.x-wx)**2+(q.y-wy)**2>(br*35)**2);return}
 if(["water","plains","forest","mountain","desert","snow"].includes(t)){let gx=Math.floor(wx/CELL),gy=Math.floor(wy/CELL);for(let dy=-br;dy<=br;dy++)for(let dx=-br;dx<=br;dx++){let xx=gx+dx,yy=gy+dy;if(xx>=0&&yy>=0&&xx<COLS&&yy<ROWS&&dx*dx+dy*dy<=br*br)S.grid[yy*COLS+xx].type=t}}
});
function loop(){if(S.run){let n=+$("speed").value;for(let i=0;i<n;i++)tick()}draw();requestAnimationFrame(loop)}
reset();loop();
})();