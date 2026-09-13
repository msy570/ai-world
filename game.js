(() => {
const canvas=document.getElementById("worldCanvas"),ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=false;
const W=2200,H=1300,WALL_X=W/2;
const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ui={};
["playBtn","pauseBtn","resetBtn","speedSelect","wallBtn","peaceBtn","warBtn","rainBtn","stormBtn","clearBtn",
"dayLength","dayLengthValue","weatherFreq","weatherFreqValue","resourceAmount","resourceValue",
"aInt","aIntValue","aAgg","aAggValue","aDisc","aDiscValue","aPop","aPopValue","bInt","bIntValue","bAgg","bAggValue","bDisc","bDiscValue","bPop","bPopValue",
"aPopStat","aSci","aTech","aMil","bPopStat","bSci","bTech","bMil","timeStat","weatherStat","seasonStat","wallStat",
"autoWar","techWeapons","weatherDamage","births","spawnA","spawnB","log"].forEach(id=>ui[id]=document.getElementById(id));

const civs={
 A:{name:"Savants",color:"#4d86c8",dark:"#2c4f78",int:85,agg:25,disc:75,science:0,tech:0,military:0,kills:0},
 B:{name:"Barbares",color:"#c4554d",dark:"#74352f",int:25,agg:90,disc:35,science:0,tech:0,military:0,kills:0}
};
let state={running:false,speed:1,tick:0,day:1,minutes:480,weather:"clear",season:0,wall:true,war:false,people:[],resources:[],particles:[]};

function log(msg){const d=document.createElement("div");d.textContent=`J${state.day} ${String(Math.floor(state.minutes/60)).padStart(2,"0")}:${String(state.minutes%60).padStart(2,"0")} — ${msg}`;ui.log.prepend(d);while(ui.log.children.length>80)ui.log.lastChild.remove();}
function cfg(){civs.A.int=+ui.aInt.value;civs.A.agg=+ui.aAgg.value;civs.A.disc=+ui.aDisc.value;civs.B.int=+ui.bInt.value;civs.B.agg=+ui.bAgg.value;civs.B.disc=+ui.bDisc.value;}
function makePerson(civ){
 const left=civ==="A"; const c=civs[civ];
 return {civ,x:left?rand(90,WALL_X-70):rand(WALL_X+70,W-90),y:rand(100,H-90),vx:rand(-.8,.8),vy:rand(-.8,.8),
 hp:100,hunger:rand(70,100),age:Math.floor(rand(14,60)),sex:Math.random()<.5?"F":"M",job:pick(["farmer","builder","scholar","soldier","miner"]),
 skill:rand(.7,1.3),cool:0};
}
function spawn(civ,n){for(let i=0;i<n;i++)state.people.push(makePerson(civ));}
function resource(type,x,y){state.resources.push({type,x,y,amount:1});}
function seedResources(){
 state.resources=[];
 const n=Math.floor(480*(+ui.resourceAmount.value/100));
 for(let i=0;i<n;i++){let x=rand(30,W-30),y=rand(70,H-40);resource(pick(["food","food","wood","stone","ore"]),x,y);}
}
function reset(){
 cfg();state={running:false,speed:1,tick:0,day:1,minutes:480,weather:"clear",season:0,wall:true,war:false,people:[],resources:[],particles:[]};
 spawn("A",+ui.aPop.value);spawn("B",+ui.bPop.value);seedResources();
 civs.A.science=civs.A.tech=civs.A.military=civs.A.kills=0;civs.B.science=civs.B.tech=civs.B.military=civs.B.kills=0;
 ui.log.innerHTML="";log("Nouveau monde créé. Le mur sépare les deux civilisations.");updateUI();draw();
}
function seasonName(){return ["Printemps","Été","Automne","Hiver"][state.season]}
function weatherLabel(){return {clear:"☀ Clair",rain:"🌧 Pluie",storm:"⛈ Tempête",snow:"❄ Neige"}[state.weather]}
function setWeather(w){if(state.weather!==w){state.weather=w;log("Météo : "+weatherLabel());}}
function randomWeather(){
 const f=+ui.weatherFreq.value/100;if(Math.random()>f)return;
 const s=state.season;if(s===3)setWeather(pick(["clear","snow","snow","storm"]));
 else setWeather(pick(["clear","clear","rain","rain","storm"]));
}
function nearestResource(p,type){
 let best=null,bd=Infinity;for(const r of state.resources){if(type&&r.type!==type)continue;let d=(r.x-p.x)**2+(r.y-p.y)**2;if(d<bd){bd=d;best=r}}return best;
}
function enemyNear(p,range=80){
 let best=null,bd=range*range;for(const e of state.people){if(e.civ===p.civ)continue;let d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;best=e}}return best;
}
function stepPerson(p){
 const c=civs[p.civ];p.hunger-=.018;p.cool=Math.max(0,p.cool-1);
 let target=null;
 if(p.hunger<55)target=nearestResource(p,"food");
 else if(p.job==="farmer")target=nearestResource(p,"food");
 else if(p.job==="miner")target=nearestResource(p,"ore")||nearestResource(p,"stone");
 else if(p.job==="builder")target=nearestResource(p,"wood");
 if(state.war&&!state.wall){let e=enemyNear(p,220+(c.agg*2));if(e&&(p.job==="soldier"||Math.random()<c.agg/180))target=e;}
 if(target){let dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;p.vx+=dx/d*.07;p.vy+=dy/d*.07}
 p.vx+=rand(-.08,.08);p.vy+=rand(-.08,.08);
 let weatherSlow=state.weather==="storm"?.72:state.weather==="rain"?.88:state.weather==="snow"?.78:1;
 let sp=(.7+c.disc/180)*p.skill*weatherSlow, m=Math.hypot(p.vx,p.vy)||1;if(m>sp){p.vx=p.vx/m*sp;p.vy=p.vy/m*sp}
 let nx=clamp(p.x+p.vx,12,W-12),ny=clamp(p.y+p.vy,55,H-15);
 if(state.wall && ((p.x<WALL_X&&nx>=WALL_X-12)||(p.x>WALL_X&&nx<=WALL_X+12))){p.vx*=-1;nx=p.x;}
 p.x=nx;p.y=ny;
 for(let i=state.resources.length-1;i>=0;i--){let r=state.resources[i];if((r.x-p.x)**2+(r.y-p.y)**2<120){if(r.type==="food")p.hunger=Math.min(100,p.hunger+30);state.resources.splice(i,1);break}}
 if(p.hunger<=0)p.hp-=.12;
 if(state.weather==="storm"&&ui.weatherDamage.checked&&Math.random()<.00045)p.hp-=rand(2,9);
 if(state.war&&!state.wall&&p.cool===0){let e=enemyNear(p,18);if(e){let attack=1.3+(c.military*.008)+(ui.techWeapons.checked?c.tech*.004:0)+(p.job==="soldier"?1.4:0);e.hp-=attack*rand(.7,1.25);p.cool=10;if(e.hp<=0){c.kills++;state.particles.push({x:e.x,y:e.y,t:18,c:c.color});}}}
}
function development(){
 for(const key of ["A","B"]){let c=civs[key],pop=state.people.filter(p=>p.civ===key).length;
   let scholars=state.people.filter(p=>p.civ===key&&p.job==="scholar").length;
   let soldiers=state.people.filter(p=>p.civ===key&&p.job==="soldier").length;
   c.science+=((c.int/100)*(0.35+scholars*.018)*(0.6+c.disc/150));
   c.tech+=((c.science/900)*(c.int/100)+.008*c.disc/100);
   c.military+=((c.agg/100)*(.06+soldiers*.006)+(c.tech/1800))*((c.disc+40)/140);
   c.science=Math.min(c.science,9999);c.tech=Math.min(c.tech,9999);c.military=Math.min(c.military,9999);
   if(ui.births.checked&&pop>4&&pop<220&&Math.random()<.018*(1-pow(pop/230,2)))spawn(key,1);
 }
}
function pow(a,b){return Math.pow(a,b)}
function simulationStep(){
 state.tick++;
 let mins=Math.max(1,Math.floor(1440/(+ui.dayLength.value*60/16)));state.minutes+=mins;
 if(state.minutes>=1440){state.minutes-=1440;state.day++;if(state.day%30===0){state.season=(state.season+1)%4;log("Nouvelle saison : "+seasonName())}randomWeather();}
 if(Math.random()<.08&&state.resources.length<700){resource(pick(["food","food","wood","stone","ore"]),rand(25,W-25),rand(70,H-25));}
 for(const p of state.people)stepPerson(p);
 state.people=state.people.filter(p=>p.hp>0&&p.age<95);
 if(state.tick%25===0)development();
 if(state.wall===false&&ui.autoWar.checked&&!state.war){state.war=true;log("La chute du mur déclenche la guerre.");}
 if(state.tick%1200===0)for(const p of state.people)p.age++;
 for(const q of state.particles)q.t--;state.particles=state.particles.filter(q=>q.t>0);
 updateUI();
}
function terrain(){
 ctx.fillStyle="#466b3c";ctx.fillRect(0,0,canvas.width,canvas.height);
 for(let y=0;y<canvas.height;y+=8)for(let x=0;x<canvas.width;x+=8){let h=(x*17+y*31)%13;ctx.fillStyle=h<5?"#4c7541":h<9?"#416638":"#587d49";ctx.fillRect(x,y,8,8)}
 // river-like decorative bands
 ctx.fillStyle="rgba(45,91,117,.42)";for(let y=0;y<canvas.height;y+=120)ctx.fillRect(0,y+55,canvas.width,5);
}
function sx(x){return x/W*canvas.width}function sy(y){return y/H*canvas.height}
function drawPerson(p){
 let x=sx(p.x),y=sy(p.y),c=civs[p.civ],z=2;
 ctx.fillStyle="rgba(0,0,0,.25)";ctx.fillRect(x-5,y+8,10,3);
 ctx.fillStyle=p.civ==="A"?"#d8b18b":"#b77b58";ctx.fillRect(x-3,y-8,6,6);
 ctx.fillStyle=c.color;ctx.fillRect(x-4,y-2,8,8);
 ctx.fillStyle="#263038";ctx.fillRect(x-4,y+6,3,6);ctx.fillRect(x+1,y+6,3,6);
 if(p.job==="soldier"){ctx.fillStyle="#bcc4c8";ctx.fillRect(x+5,y-4,2,10)}
 if(p.job==="scholar"){ctx.fillStyle="#efe4b0";ctx.fillRect(x-1,y-1,2,2)}
 if(p.job==="builder"){ctx.fillStyle="#8d6038";ctx.fillRect(x+5,y,4,2)}
}
function draw(){
 terrain();
 for(const r of state.resources){let x=sx(r.x),y=sy(r.y);ctx.fillStyle=r.type==="food"?"#d85a4d":r.type==="wood"?"#795235":r.type==="ore"?"#9aa4aa":"#858b80";ctx.fillRect(x-2,y-2,4,4)}
 if(state.wall){let x=sx(WALL_X);ctx.fillStyle="#2b2927";ctx.fillRect(x-7,0,14,canvas.height);ctx.fillStyle="#77716a";for(let y=0;y<canvas.height;y+=12)ctx.fillRect(x-6,y+2,12,8)}
 else {ctx.fillStyle="rgba(70,60,55,.45)";ctx.fillRect(sx(WALL_X)-10,0,20,canvas.height)}
 for(const p of state.people)drawPerson(p);
 for(const q of state.particles){ctx.fillStyle=q.c;ctx.fillRect(sx(q.x)-q.t/4,sy(q.y)-q.t/4,q.t/2,q.t/2)}
 if(state.weather==="rain"||state.weather==="storm"){ctx.strokeStyle="rgba(190,220,235,.55)";for(let i=0;i<(state.weather==="storm"?140:75);i++){let x=(i*97+state.tick*7)%canvas.width,y=(i*53+state.tick*13)%canvas.height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+10);ctx.stroke()}}
 if(state.weather==="snow"){ctx.fillStyle="rgba(240,248,250,.8)";for(let i=0;i<90;i++){let x=(i*83+state.tick*2)%canvas.width,y=(i*49+state.tick*3)%canvas.height;ctx.fillRect(x,y,2,2)}}
}
function updateUI(){
 cfg();let A=state.people.filter(p=>p.civ==="A").length,B=state.people.filter(p=>p.civ==="B").length;
 ui.aPopStat.textContent=A;ui.bPopStat.textContent=B;ui.aSci.textContent=Math.floor(civs.A.science);ui.aTech.textContent=Math.floor(civs.A.tech);ui.aMil.textContent=Math.floor(civs.A.military);
 ui.bSci.textContent=Math.floor(civs.B.science);ui.bTech.textContent=Math.floor(civs.B.tech);ui.bMil.textContent=Math.floor(civs.B.military);
 ui.timeStat.textContent=`Jour ${state.day} · ${String(Math.floor(state.minutes/60)).padStart(2,"0")}:${String(state.minutes%60).padStart(2,"0")}`;
 ui.weatherStat.textContent=weatherLabel();ui.seasonStat.textContent=seasonName();ui.wallStat.textContent="Mur : "+(state.wall?"intact":"détruit");
}
function bindRange(id,val,suffix=""){ui[id].addEventListener("input",()=>{ui[val].textContent=ui[id].value+suffix;cfg()})}
bindRange("dayLength","dayLengthValue"," s");bindRange("weatherFreq","weatherFreqValue","%");bindRange("resourceAmount","resourceValue","%");
for(const [a,b] of [["aInt","aIntValue"],["aAgg","aAggValue"],["aDisc","aDiscValue"],["aPop","aPopValue"],["bInt","bIntValue"],["bAgg","bAggValue"],["bDisc","bDiscValue"],["bPop","bPopValue"]])bindRange(a,b);
ui.playBtn.onclick=()=>state.running=true;ui.pauseBtn.onclick=()=>state.running=false;ui.resetBtn.onclick=reset;ui.speedSelect.onchange=()=>state.speed=+ui.speedSelect.value;
ui.wallBtn.onclick=()=>{state.wall=!state.wall;log(state.wall?"Le mur est reconstruit.":"Le mur est détruit.");updateUI()};
ui.peaceBtn.onclick=()=>{state.war=false;log("Traité de paix imposé.")};ui.warBtn.onclick=()=>{state.war=true;log("Guerre déclarée.")};
ui.rainBtn.onclick=()=>setWeather("rain");ui.stormBtn.onclick=()=>setWeather("storm");ui.clearBtn.onclick=()=>setWeather("clear");
ui.spawnA.onclick=()=>spawn("A",10);ui.spawnB.onclick=()=>spawn("B",10);
function loop(){if(state.running)for(let i=0;i<state.speed;i++)simulationStep();draw();requestAnimationFrame(loop)}
reset();loop();
})();