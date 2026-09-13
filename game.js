(()=>{
const c=document.querySelector("#c"),x=c.getContext("2d");x.imageSmoothingEnabled=false;
const W=2560,H=1440,cols=["#4f8fd8","#d85b53","#62ad69","#d2a34d","#9a70d0","#49aaa5","#d47caf","#9b795b"];
const $=id=>document.getElementById(id), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
let S,active=0,mouse={x:0,y:0};
const techs=[["Agriculture",40],["Écriture",100],["Métallurgie",180],["Médecine",300],["Ingénierie",480],["Poudre",700],["Industrie",1000],["Électricité",1450],["Moteurs",2000],["Informatique",2800]];
function civ(i){return {id:i,name:i===0?"Savants":i===1?"Barbares":"Peuple "+(i+1),color:cols[i],intel:i?25:88,agg:i?88:20,disc:i?38:78,curiosity:i?30:90,coop:i?35:75,fertility:55,courage:i?90:55,science:0,tech:0,military:0,wealth:50,cities:1,kills:0,discoveries:[]}}
function person(ci){let band=W/S.civs.length,left=ci*band+35,right=(ci+1)*band-35;return {ci,x:rnd(left,right),y:rnd(100,H-70),vx:rnd(-1,1),vy:rnd(-1,1),hp:100,hunger:rnd(65,100),age:Math.floor(rnd(8,70)),job:pick(["farmer","farmer","builder","scholar","soldier","miner","merchant"]),sick:false,cool:0}}
function log(t){let d=document.createElement("div");d.textContent=`A${S.year} J${S.day}: ${t}`;$("log").prepend(d);while($("log").children.length>100)$("log").lastChild.remove()}
function reset(){S={run:false,tick:0,minute:480,day:1,year:1,season:0,weather:"Clair",war:false,walls:[],terrain:[],res:[],buildings:[],people:[],civs:[civ(0),civ(1)],disaster:null};
for(let i=0;i<120;i++)S.people.push(person(i<60?0:1));let mid=W/2;for(let y=0;y<H;y+=30)S.walls.push({x:mid,y});
for(let i=0;i<550;i++)addRes(pick(["food","food","wood","ore"]),rnd(20,W-20),rnd(80,H-20));S.buildings.push({ci:0,x:W*.25,y:H*.5,type:"town"},{ci:1,x:W*.75,y:H*.5,type:"town"});active=0;$("log").innerHTML="";log("Monde créé. Deux civilisations sont séparées par un mur.");tabs();editor();draw()}
function addRes(type,a,b){S.res.push({type,x:a,y:b})}
function nearest(p,type){let q=null,d=1e20;for(const r of S.res){if(type&&r.type!==type)continue;let z=(r.x-p.x)**2+(r.y-p.y)**2;if(z<d){d=z;q=r}}return q}
function enemy(p,range){let q=null,d=range*range;for(const e of S.people)if(e.ci!==p.ci){let z=(e.x-p.x)**2+(e.y-p.y)**2;if(z<d){d=z;q=e}}return q}
function blocked(px,nx,py){for(const w of S.walls)if(Math.abs(w.y-py)<25&&((px<w.x&&nx>=w.x-8)||(px>w.x&&nx<=w.x+8)))return true;return false}
function stepP(p){let v=S.civs[p.ci];p.hunger-=.015;p.cool=Math.max(0,p.cool-1);let g=null;
if(p.hunger<55||p.job==="farmer")g=nearest(p,"food");else if(p.job==="miner")g=nearest(p,"ore");else if(p.job==="builder")g=nearest(p,"wood");
if(S.war&&(p.job==="soldier"||Math.random()<v.agg/300))g=enemy(p,300+v.courage*2)||g;
if(g){let dx=g.x-p.x,dy=g.y-p.y,m=Math.hypot(dx,dy)||1;p.vx+=dx/m*.08;p.vy+=dy/m*.08}p.vx+=rnd(-.08,.08);p.vy+=rnd(-.08,.08);
let sp=.65+v.disc/120;if(S.weather==="Tempête")sp*=.65;if(S.weather==="Neige")sp*=.75;let m=Math.hypot(p.vx,p.vy)||1;if(m>sp){p.vx=p.vx/m*sp;p.vy=p.vy/m*sp}
let nx=clamp(p.x+p.vx,10,W-10),ny=clamp(p.y+p.vy,65,H-10);if(blocked(p.x,nx,ny)){p.vx*=-1;nx=p.x}p.x=nx;p.y=ny;
for(let i=S.res.length-1;i>=0;i--){let r=S.res[i];if((r.x-p.x)**2+(r.y-p.y)**2<130){if(r.type==="food")p.hunger=Math.min(100,p.hunger+35);v.wealth+=r.type==="ore"?1:.2;S.res.splice(i,1);break}}
if(p.hunger<=0)p.hp-=.12;if(p.sick)p.hp-=.018;if(S.weather==="Tempête"&&Math.random()<.0003)p.hp-=5;
if(S.war&&p.cool===0){let e=enemy(p,20);if(e){let power=1+v.military/250+v.tech/500+(p.job==="soldier"?1.4:0);e.hp-=power;p.cool=10;if(e.hp<=0)v.kills++}}
}
function develop(){for(let i=0;i<S.civs.length;i++){let v=S.civs[i],ps=S.people.filter(p=>p.ci===i),sch=ps.filter(p=>p.job==="scholar").length,sol=ps.filter(p=>p.job==="soldier").length;
v.science+=(v.intel/100)*(v.curiosity/100)*(.4+sch*.025);v.tech+=v.science/9000*(.4+v.intel/100);v.military+=(v.agg/100)*(.02+sol*.003)+v.tech/40000;
for(const [name,cost] of techs)if(v.science>=cost&&!v.discoveries.includes(name)){v.discoveries.push(name);log(`${v.name} découvre : ${name}.`)}
if(ps.length>12&&v.wealth>30&&Math.random()<.006*v.coop/100&&v.cities<8){v.cities++;v.wealth-=20;S.buildings.push({ci:i,x:rnd(i*W/S.civs.length+60,(i+1)*W/S.civs.length-60),y:rnd(120,H-80),type:"town"});log(`${v.name} fonde une nouvelle ville.`)}
if($("births").checked&&ps.length<260&&Math.random()<.008*v.fertility/100)S.people.push(person(i));
}}
function weather(){if(Math.random()*100>+$("weatherRate").value)return;S.weather=pick(S.season===3?["Clair","Neige","Neige","Tempête"]:["Clair","Clair","Pluie","Tempête"]);log("Météo : "+S.weather)}
function tick(){S.tick++;let inc=+$("timeScale").value;S.minute+=inc;if(S.minute>=1440){let days=Math.floor(S.minute/1440);S.minute%=1440;S.day+=days;while(S.day>90){S.day-=90;S.season++;if(S.season>3){S.season=0;S.year++}log("Saison : "+["Printemps","Été","Automne","Hiver"][S.season])}weather()}
for(const p of S.people)stepP(p);S.people=S.people.filter(p=>p.hp>0&&p.age<96);if(S.tick%25===0)develop();if(S.tick%1000===0)for(const p of S.people)p.age++;
if(Math.random()<.07&&S.res.length<900)addRes(pick(["food","food","wood","ore"]),rnd(20,W-20),rnd(70,H-20));
if($("disease").checked&&Math.random()<.00012&&S.people.length){let p=pick(S.people);p.sick=true}
if($("trade").checked&&!S.war&&S.civs.length>1&&S.tick%200===0)for(const v of S.civs)v.wealth+=v.coop/20;update()}
function sx(a){return a/W*c.width}function sy(a){return a/H*c.height}
function draw(){x.fillStyle="#426b3e";x.fillRect(0,0,c.width,c.height);for(let yy=0;yy<c.height;yy+=8)for(let xx=0;xx<c.width;xx+=8){let k=(xx*7+yy*13)%17;x.fillStyle=k<6?"#497543":k<11?"#3d6439":"#527c48";x.fillRect(xx,yy,8,8)}
for(const r of S.res){let a=sx(r.x),b=sy(r.y);x.fillStyle=r.type==="food"?"#d7b84b":r.type==="wood"?"#62472f":"#8d999d";x.fillRect(a-2,b-2,4,4)}
for(const b of S.buildings){let a=sx(b.x),q=sy(b.y);x.fillStyle=S.civs[b.ci]?.color||"#aaa";x.fillRect(a-9,q-8,18,14);x.fillStyle="#332b28";x.fillRect(a-3,q+1,6,5);x.fillStyle="#6e5545";x.beginPath();x.moveTo(a-11,q-8);x.lineTo(a,q-17);x.lineTo(a+11,q-8);x.fill()}
for(const w of S.walls){x.fillStyle="#817a70";x.fillRect(sx(w.x)-3,sy(w.y),6,16)}
for(const p of S.people){let a=sx(p.x),b=sy(p.y),v=S.civs[p.ci];if(!v)continue;x.fillStyle="#c99b76";x.fillRect(a-2,b-6,4,4);x.fillStyle=v.color;x.fillRect(a-3,b-2,6,6);x.fillStyle="#283036";x.fillRect(a-3,b+4,2,4);x.fillRect(a+1,b+4,2,4);if(p.job==="soldier"){x.fillStyle="#d3d8da";x.fillRect(a+4,b-3,1,8)}if(p.sick){x.fillStyle="#80c879";x.fillRect(a-1,b-8,2,2)}}
if(S.weather==="Pluie"||S.weather==="Tempête"){x.strokeStyle="#a8c9da88";for(let i=0;i<(S.weather==="Tempête"?140:70);i++){let a=(i*83+S.tick*8)%c.width,b=(i*47+S.tick*11)%c.height;x.beginPath();x.moveTo(a,b);x.lineTo(a-5,b+9);x.stroke()}}
if(S.weather==="Neige"){x.fillStyle="#eef6f8";for(let i=0;i<100;i++)x.fillRect((i*71+S.tick*2)%c.width,(i*43+S.tick*3)%c.height,2,2)}
}
function tabs(){$("civTabs").innerHTML="";S.civs.forEach((v,i)=>{let b=document.createElement("button");b.className="tab"+(i===active?" active":"");b.textContent=v.name;b.style.borderColor=v.color;b.onclick=()=>{active=i;tabs();editor()};$("civTabs").appendChild(b)})}
const fields=["intel","agg","disc","curiosity","coop","fertility","courage"];
function editor(){let v=S.civs[active];if(!v)return;$("civName").value=v.name;for(const f of fields){$(f).value=v[f];$(f+"V").textContent=v[f]}update()}
function update(){let v=S.civs[active];if(v){$("pop").textContent=S.people.filter(p=>p.ci===active).length;$("science").textContent=Math.floor(v.science);$("tech").textContent=Math.floor(v.tech);$("military").textContent=Math.floor(v.military);$("cities").textContent=v.cities;$("wealth").textContent=Math.floor(v.wealth);$("techTree").innerHTML=techs.map(t=>`<span class="${v.discoveries.includes(t[0])?"on":"off"}">${t[0]}</span>`).join("")}
$("clock").textContent=`Année ${S.year} · Jour ${S.day} · ${String(Math.floor(S.minute/60)).padStart(2,"0")}:${String(S.minute%60).padStart(2,"0")}`;$("weather").textContent="🌦 "+S.weather;$("season").textContent=["🌱 Printemps","☀ Été","🍂 Automne","❄ Hiver"][S.season]}
for(const f of fields)$(f).oninput=()=>{let v=S.civs[active];v[f]=+$(f).value;$(f+"V").textContent=v[f]};
$("civName").onchange=()=>{S.civs[active].name=$("civName").value||S.civs[active].name;tabs()};
$("play").onclick=()=>S.run=true;$("pause").onclick=()=>S.run=false;$("new").onclick=reset;$("breakWalls").onclick=()=>{S.walls=[];log("Tous les murs sont détruits.")};$("war").onclick=()=>{S.war=true;log("Guerre globale déclarée.")};$("peace").onclick=()=>{S.war=false;log("Paix imposée.")};
$("addCiv").onclick=()=>{if(S.civs.length>=8)return;let i=S.civs.length;S.civs.push(civ(i));for(let k=0;k<45;k++)S.people.push(person(i));active=i;tabs();editor();log("Une nouvelle civilisation apparaît.")};
$("removeCiv").onclick=()=>{if(S.civs.length<=2)return;let i=active;S.people=S.people.filter(p=>p.ci!==i);S.buildings=S.buildings.filter(b=>b.ci!==i);S.civs.splice(i,1);for(const p of S.people)if(p.ci>i)p.ci--;for(const b of S.buildings)if(b.ci>i)b.ci--;S.civs.forEach((v,j)=>v.id=j);active=0;tabs();editor()};
$("trigger").onclick=()=>{let d=$("disaster").value,p=+$("disasterPower").value;if(!d)return;if(d==="famine")S.res=S.res.filter(r=>r.type!=="food"||Math.random()>p/100);if(d==="plague")for(const q of S.people)if(Math.random()<p/150)q.sick=true;if(d==="meteor"){let mx=rnd(0,W),my=rnd(0,H),rr=80+p*4;for(const q of S.people)if((q.x-mx)**2+(q.y-my)**2<rr*rr)q.hp-=150}if(d==="storm")S.weather="Tempête";if(d==="fire")for(const q of S.people)if(Math.random()<p/500)q.hp-=rnd(10,60);log("Catastrophe : "+d+" (puissance "+p+").")};
$("cinema").onclick=()=>document.body.classList.toggle("cinema");
for(const [id,out,suf] of [["weatherRate","weatherRateV","%"],["resources","resourcesV","%"],["disasterPower","disasterPowerV",""]]){let f=()=>$(out).textContent=$(id).value+suf;$(id).oninput=f;f()}
c.addEventListener("click",e=>{let r=c.getBoundingClientRect(),wx=(e.clientX-r.left)/r.width*W,wy=(e.clientY-r.top)/r.height*H,t=$("tool").value;if(t==="wall")for(let yy=wy-60;yy<=wy+60;yy+=20)S.walls.push({x:wx,y:yy});else if(t==="erase")S.walls=S.walls.filter(w=>(w.x-wx)**2+(w.y-wy)**2>10000);else if(["food","wood","ore"].includes(t))for(let i=0;i<20;i++)addRes(t,wx+rnd(-50,50),wy+rnd(-50,50));else if(t==="select"){let p=S.people.reduce((a,b)=>(!a||(b.x-wx)**2+(b.y-wy)**2<(a.x-wx)**2+(a.y-wy)**2)?b:a,null);if(p){active=p.ci;tabs();editor();$("selected").textContent=`${S.civs[p.ci].name} · ${p.job} · ${p.age} ans · PV ${Math.ceil(p.hp)}`}}});
function loop(){if(S.run){let n=+$("speed").value;for(let i=0;i<n;i++)tick()}draw();requestAnimationFrame(loop)}reset();loop();
})();