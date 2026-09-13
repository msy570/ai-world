(() => {
  const canvas = document.getElementById("worldCanvas");
  const ctx = canvas.getContext("2d");

  const WORLD_W = 4200;
  const WORLD_H = 2800;
  const CELL = 20;
  const COLS = Math.ceil(WORLD_W / CELL);
  const ROWS = Math.ceil(WORLD_H / CELL);

  const BIOMES = {
    grass:  { c1:"#4f7d46", c2:"#5b8b50", speed:1.00 },
    forest: { c1:"#27583a", c2:"#306845", speed:0.84 },
    desert: { c1:"#ad8c50", c2:"#c19c5b", speed:0.88 },
    snow:   { c1:"#d9e4e4", c2:"#c4d4d5", speed:0.73 },
    water:  { c1:"#315f7d", c2:"#3a708f", speed:0.00 }
  };

  const TRAIT_COLORS = {
    calm:"#6d91c4", aggressive:"#d0665a", greedy:"#d2ad45",
    social:"#8a78d1", explorer:"#4e9a9a"
  };

  const JOBS = ["farmer","woodcutter","miner","hunter","soldier","merchant"];
  const JOB_LABELS = {
    farmer:"Fermier", woodcutter:"Bûcheron", miner:"Mineur",
    hunter:"Chasseur", soldier:"Soldat", merchant:"Marchand"
  };
  const SKINS = ["#f3c9a5","#d9a77d","#b97850","#815137","#5a3828"];
  const HAIRS = ["#241b17","#4b3023","#7a4b27","#c4934e","#d8c6a3","#8b3f2f"];
  const CLOTHES = ["#496b8a","#6c7f45","#87574b","#765c8d","#4f7d72","#8a7046"];


  const firstNames = [
    "Léo","Noah","Milo","Eden","Sacha","Nolan","Liam","Maël","Tom","Jules","Axel","Nino",
    "Adam","Mathis","Lucas","Aaron","Yanis","Robin","Gabriel","Lina","Emma","Mia","Nina","Léa",
    "Jade","Iris","Zoé","Anna","Luna","Inès","Aya","Lou","Eva","Rose","Maya","Alma","Nora",
    "Kael","Soren","Lyra","Tessa","Riven","Elio","Kira","Aren"
  ];
  const surnames = ["Morel","Petit","Leroy","Simon","Laurent","Roux","David","Bertrand","Robert","Richard","Durand","Michel","Garcia","Bernard","Dubois"];

  const ui = {
    play: document.getElementById("playBtn"),
    pause: document.getElementById("pauseBtn"),
    newWorld: document.getElementById("newWorldBtn"),
    speed: document.getElementById("speedSelect"),
    day: document.getElementById("dayStat"),
    pop: document.getElementById("populationStat"),
    objects: document.getElementById("objectStat"),
    zoom: document.getElementById("zoomStat"),
    status: document.getElementById("statusText"),
    brush: document.getElementById("brushSize"),
    brushValue: document.getElementById("brushValue"),
    addNpc: document.getElementById("addNpcBtn"),
    add50: document.getElementById("add50NpcBtn"),
    scatter: document.getElementById("scatterItemsBtn"),
    regen: document.getElementById("regenBiomesBtn"),
    noNpc: document.getElementById("noNpcSelected"),
    editor: document.getElementById("npcEditor"),
    npcName: document.getElementById("npcName"),
    randomName: document.getElementById("randomNameBtn"),
    trait: document.getElementById("npcTrait"),
    agg: document.getElementById("npcAgg"),
    aggValue: document.getElementById("npcAggValue"),
    speedNpc: document.getElementById("npcSpeed"),
    speedNpcValue: document.getElementById("npcSpeedValue"),
    hp: document.getElementById("npcHp"),
    hunger: document.getElementById("npcHunger"),
    age: document.getElementById("npcAge"),
    inventory: document.getElementById("npcInventory"),
    removeNpc: document.getElementById("removeNpcBtn")
  };

  const state = {
    running:false, tick:0, day:1,
    cells:[], npcs:[], items:[],
    selectedNpc:null, tool:"select",
    camera:{x:WORLD_W/2,y:WORLD_H/2,zoom:0.55},
    panning:false, panStart:null, painting:false
  };

  const rand = (a,b)=>a+Math.random()*(b-a);
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const pick = arr=>arr[Math.floor(Math.random()*arr.length)];

  function randomName() { return `${pick(firstNames)} ${pick(surnames)}`; }

  function cellIndex(cx,cy){ return cy*COLS+cx; }
  function biomeAt(x,y){
    const cx=clamp(Math.floor(x/CELL),0,COLS-1);
    const cy=clamp(Math.floor(y/CELL),0,ROWS-1);
    return state.cells[cellIndex(cx,cy)]?.biome || "grass";
  }

  function generateBiomes(){
    state.cells=[];
    const seeds = Array.from({length:28},()=>({
      x:rand(0,WORLD_W), y:rand(0,WORLD_H),
      biome:pick(["grass","grass","forest","forest","desert","snow","water"])
    }));
    for(let cy=0;cy<ROWS;cy++){
      for(let cx=0;cx<COLS;cx++){
        const x=(cx+.5)*CELL,y=(cy+.5)*CELL;
        let best=Infinity, chosen="grass";
        for(const s of seeds){
          const d=(x-s.x)**2+(y-s.y)**2;
          if(d<best){best=d;chosen=s.biome;}
        }
        if(cy<3 || cy>ROWS-4) chosen = Math.random()<.75 ? "snow" : chosen;
        state.cells.push({biome:chosen, shade:Math.random()});
      }
    }
  }

  function makeNpc(x=rand(120,WORLD_W-120),y=rand(120,WORLD_H-120)){
    let tries=0;
    while(biomeAt(x,y)==="water" && tries++<100){
      x=rand(120,WORLD_W-120); y=rand(120,WORLD_H-120);
    }
    const trait=pick(["calm","aggressive","greedy","social","explorer"]);
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      name:randomName(), x,y, vx:rand(-1,1), vy:rand(-1,1),
      hp:100, hunger:rand(65,100), age:Math.floor(rand(6,72)), trait,
      sex: Math.random()<.5 ? "F" : "M",
      job: pick(JOBS),
      skin: pick(SKINS), hair: pick(HAIRS), clothes: pick(CLOTHES),
      hairStyle: Math.floor(rand(0,4)),
      aggression: trait==="aggressive" ? rand(.6,.95) : rand(.08,.55),
      speed:rand(.85,1.3), inventory:{food:0,wood:0,gold:0},
      target:null, flash:0
    };
  }

  function addNpcs(n){
    for(let i=0;i<n;i++) state.npcs.push(makeNpc());
    updateHud();
  }

  function addItem(type,x=rand(40,WORLD_W-40),y=rand(40,WORLD_H-40)){
    if(biomeAt(x,y)==="water") return;
    state.items.push({type,x,y,amount:1});
  }

  function scatterItems(n=250){
    for(let i=0;i<n;i++) addItem(pick(["food","food","food","wood","wood","gold"]));
    updateHud();
  }

  function newWorld(){
    state.running=false; state.tick=0; state.day=1;
    state.selectedNpc=null; state.npcs=[]; state.items=[];
    generateBiomes();
    addNpcs(140);
    scatterItems(320);
    state.camera={x:WORLD_W/2,y:WORLD_H/2,zoom:.55};
    ui.status.textContent="Nouveau monde généré.";
    refreshNpcEditor();
    draw();
  }

  function worldToScreen(x,y){
    return {
      x:(x-state.camera.x)*state.camera.zoom+canvas.width/2,
      y:(y-state.camera.y)*state.camera.zoom+canvas.height/2
    };
  }

  function screenToWorld(x,y){
    return {
      x:(x-canvas.width/2)/state.camera.zoom+state.camera.x,
      y:(y-canvas.height/2)/state.camera.zoom+state.camera.y
    };
  }

  function visibleBounds(){
    const halfW=canvas.width/(2*state.camera.zoom);
    const halfH=canvas.height/(2*state.camera.zoom);
    return {l:state.camera.x-halfW,r:state.camera.x+halfW,t:state.camera.y-halfH,b:state.camera.y+halfH};
  }

  function draw(){
    ctx.fillStyle="#11181a"; ctx.fillRect(0,0,canvas.width,canvas.height);
    const b=visibleBounds();
    const minCx=clamp(Math.floor(b.l/CELL)-1,0,COLS-1);
    const maxCx=clamp(Math.ceil(b.r/CELL)+1,0,COLS-1);
    const minCy=clamp(Math.floor(b.t/CELL)-1,0,ROWS-1);
    const maxCy=clamp(Math.ceil(b.b/CELL)+1,0,ROWS-1);

    for(let cy=minCy;cy<=maxCy;cy++){
      for(let cx=minCx;cx<=maxCx;cx++){
        const cell=state.cells[cellIndex(cx,cy)];
        if(!cell) continue;
        const bio=BIOMES[cell.biome];
        const p=worldToScreen(cx*CELL,cy*CELL);
        const s=CELL*state.camera.zoom+1;
        ctx.fillStyle=cell.shade>.5?bio.c1:bio.c2;
        ctx.fillRect(p.x,p.y,s,s);

        if(state.camera.zoom>.42){
          const px=Math.max(1,Math.round(2*state.camera.zoom));
          const seed=(cx*92821+cy*68917)%11;
          if(cell.biome==="grass" && seed<5){
            ctx.fillStyle=seed%2?"#76a65c":"#3f6e3b";
            ctx.fillRect(Math.round(p.x+s*.25),Math.round(p.y+s*.65),px,px*2);
          } else if(cell.biome==="forest"){
            ctx.fillStyle="#173d29";
            ctx.fillRect(Math.round(p.x+s*.48),Math.round(p.y+s*.48),px*2,px*4);
            ctx.fillStyle=seed%2?"#39784a":"#225c38";
            ctx.fillRect(Math.round(p.x+s*.28),Math.round(p.y+s*.20),px*5,px*4);
          } else if(cell.biome==="desert" && seed<6){
            ctx.fillStyle=seed%2?"#d0ad69":"#8e713e";
            ctx.fillRect(Math.round(p.x+s*.25),Math.round(p.y+s*.35),px*2,px);
          } else if(cell.biome==="snow" && seed<5){
            ctx.fillStyle=seed%2?"#f5ffff":"#a9c7ce";
            ctx.fillRect(Math.round(p.x+s*.25),Math.round(p.y+s*.35),px*2,px);
          } else if(cell.biome==="water"){
            ctx.fillStyle=seed%2?"#4e86a1":"#244e6b";
            ctx.fillRect(Math.round(p.x+s*.15),Math.round(p.y+s*.55),Math.max(2,px*4),px);
          }
        }
      }
    }

    for(const item of state.items){
      if(item.x<b.l||item.x>b.r||item.y<b.t||item.y>b.b) continue;
      const p=worldToScreen(item.x,item.y);
      const r=Math.max(3,7*state.camera.zoom);
      const q=Math.max(2,Math.round(3*state.camera.zoom));
      const X=Math.round(p.x),Y=Math.round(p.y);
      if(item.type==="food"){
        ctx.fillStyle="#8f2f2b";ctx.fillRect(X-q,Y-q,q*2,q*2);
        ctx.fillStyle="#e45e4f";ctx.fillRect(X,Y-q,q,q*2);
        ctx.fillStyle="#68a04e";ctx.fillRect(X,Y-q*2,q,q);
      } else if(item.type==="wood"){
        ctx.fillStyle="#4d3020";ctx.fillRect(X-q*2,Y-q,q*4,q*2);
        ctx.fillStyle="#9a6840";ctx.fillRect(X-q,Y-q,q*2,q);
      } else {
        ctx.fillStyle="#8d6c20";ctx.fillRect(X-q,Y-q,q*2,q*2);
        ctx.fillStyle="#f2cf58";ctx.fillRect(X,Y-q,q,q);
      }
    }

    for(const npc of state.npcs){
      if(npc.x<b.l||npc.x>b.r||npc.y<b.t||npc.y>b.b) continue;
      drawNpc(npc);
    }

    ctx.fillStyle="rgba(0,0,0,.45)";
    ctx.fillRect(12,12,190,58);
    ctx.fillStyle="#fff";ctx.font="700 19px system-ui";ctx.fillText(`JOUR ${state.day}`,22,37);
    ctx.font="500 12px system-ui";ctx.fillStyle="#c7d4d9";
    ctx.fillText(`${state.npcs.length} habitants · ${state.items.length} objets`,22,57);
  }

  function drawNpc(npc){
    const p=worldToScreen(npc.x,npc.y);
    const z=clamp(state.camera.zoom,0.55,1.8);
    const pix=Math.max(1,Math.round(2*z));
    const scale = npc.age<13 ? .72 : npc.age>60 ? .90 : 1;
    const w=Math.round(8*pix*scale), h=Math.round(12*pix*scale);
    const x=Math.round(p.x-w/2), y=Math.round(p.y-h*.72);

    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle="rgba(0,0,0,.28)";
    ctx.fillRect(x+pix,y+h-pix,w-pix,pix*2);

    // Legs / boots
    ctx.fillStyle=npc.age<13?"#3f4b55":"#30383d";
    ctx.fillRect(x+pix*2,y+pix*8,pix*2,pix*3);
    ctx.fillRect(x+pix*5,y+pix*8,pix*2,pix*3);
    ctx.fillStyle="#241e1a";
    ctx.fillRect(x+pix,y+pix*10,pix*3,pix);
    ctx.fillRect(x+pix*5,y+pix*10,pix*3,pix);

    // Torso: job-dependent uniform
    let shirt=npc.clothes;
    if(npc.job==="farmer") shirt="#8b7745";
    if(npc.job==="woodcutter") shirt="#7c4937";
    if(npc.job==="miner") shirt="#555d66";
    if(npc.job==="hunter") shirt="#3e6544";
    if(npc.job==="soldier") shirt="#6d7378";
    if(npc.job==="merchant") shirt="#76558b";
    ctx.fillStyle=shirt;
    ctx.fillRect(x+pix*1,y+pix*4,pix*6,pix*5);
    ctx.fillStyle=npc.skin;
    ctx.fillRect(x,y+pix*5,pix,pix*3);
    ctx.fillRect(x+pix*7,y+pix*5,pix,pix*3);

    // Head
    ctx.fillStyle=npc.skin;
    ctx.fillRect(x+pix*2,y+pix,pix*4,pix*4);

    // Hair, different silhouettes
    ctx.fillStyle=npc.age>62 ? "#c6c2b8" : npc.hair;
    ctx.fillRect(x+pix*2,y,pix*4,pix);
    if(npc.hairStyle===1 || npc.sex==="F") ctx.fillRect(x+pix,y+pix,pix,pix*3);
    if(npc.hairStyle===2) ctx.fillRect(x+pix*6,y+pix,pix,pix*2);

    // Eyes
    ctx.fillStyle="#182026";
    ctx.fillRect(x+pix*3,y+pix*2,pix,pix);
    ctx.fillRect(x+pix*5,y+pix*2,pix,pix);

    // Job equipment
    if(npc.job==="farmer"){
      ctx.fillStyle="#c4a85a";ctx.fillRect(x+pix,y,pix*6,pix);
      ctx.fillRect(x+pix*2,y-pix,pix*4,pix);
    } else if(npc.job==="miner"){
      ctx.fillStyle="#d2a93f";ctx.fillRect(x+pix*2,y-pix,pix*4,pix);
      ctx.fillStyle="#eee6a4";ctx.fillRect(x+pix*4,y-pix,pix,pix);
    } else if(npc.job==="soldier"){
      ctx.fillStyle="#858d91";ctx.fillRect(x+pix*2,y,pix*4,pix);
      ctx.fillStyle="#aab1b4";ctx.fillRect(x+pix*7,y+pix*4,pix,pix*5);
    } else if(npc.job==="woodcutter"){
      ctx.fillStyle="#b9c1c4";ctx.fillRect(x+pix*7,y+pix*4,pix,pix*4);
      ctx.fillStyle="#6b422b";ctx.fillRect(x+pix*6,y+pix*6,pix*3,pix);
    } else if(npc.job==="hunter"){
      ctx.fillStyle="#765132";ctx.fillRect(x+pix*7,y+pix*3,pix,pix*6);
    } else if(npc.job==="merchant"){
      ctx.fillStyle="#d1aa4b";ctx.fillRect(x+pix*2,y+pix*5,pix,pix);
    }

    if(npc.flash){
      ctx.fillStyle="rgba(255,255,255,.55)";ctx.fillRect(x,y,w,h);
    }

    if(state.selectedNpc===npc){
      ctx.strokeStyle="#fff";ctx.lineWidth=2;
      ctx.strokeRect(x-pix*2,y-pix*2,w+pix*4,h+pix*4);
      if(state.camera.zoom>.45){
        ctx.font="600 12px monospace";ctx.textAlign="center";
        const label=`${npc.name} · ${npc.sex} · ${npc.age} ans · ${JOB_LABELS[npc.job]}`;
        const tw=ctx.measureText(label).width+12;
        ctx.fillStyle="rgba(0,0,0,.78)";ctx.fillRect(p.x-tw/2,y-25,tw,18);
        ctx.fillStyle="#fff";ctx.fillText(label,p.x,y-12);
      }
    }
  }

  function nearestItem(npc,type){
    let best=null,bd=Infinity;
    for(const item of state.items){
      if(type && item.type!==type) continue;
      const d=(item.x-npc.x)**2+(item.y-npc.y)**2;
      if(d<bd){bd=d;best=item;}
    }
    return best;
  }

  function simulateStep(){
    state.tick++;
    if(state.tick%30===0) state.day++;

    if(Math.random()<.16 && state.items.length<700) addItem(pick(["food","food","wood","gold"]));

    for(const n of state.npcs){
      if(state.tick%900===0) n.age++;
      n.hunger-=.022;
      n.flash=Math.max(0,n.flash-1);

      let goal=null;
      if(n.hunger<55) goal=nearestItem(n,"food");
      else if(n.job==="farmer") goal=nearestItem(n,"food");
      else if(n.job==="woodcutter") goal=nearestItem(n,"wood");
      else if(n.job==="miner" || n.job==="merchant") goal=nearestItem(n,"gold");
      else if(n.trait==="greedy") goal=nearestItem(n,"gold");
      else if(n.trait==="explorer" && (!n.target || Math.random()<.01)) n.target={x:rand(0,WORLD_W),y:rand(0,WORLD_H)};
      else if(n.trait==="social" && Math.random()<.02 && state.npcs.length>1) goal=pick(state.npcs);

      if(!goal && n.target) goal=n.target;
      if(goal){
        const dx=goal.x-n.x,dy=goal.y-n.y,d=Math.hypot(dx,dy)||1;
        n.vx+=dx/d*.055;n.vy+=dy/d*.055;
      }

      n.vx+=rand(-.11,.11);n.vy+=rand(-.11,.11);
      const bio=BIOMES[biomeAt(n.x,n.y)];
      let maxSpeed=n.speed*bio.speed;
      if(n.trait==="explorer") maxSpeed*=1.16;
      const m=Math.hypot(n.vx,n.vy)||1;
      if(m>maxSpeed){n.vx=n.vx/m*maxSpeed;n.vy=n.vy/m*maxSpeed;}

      const nx=clamp(n.x+n.vx,8,WORLD_W-8),ny=clamp(n.y+n.vy,8,WORLD_H-8);
      if(biomeAt(nx,ny)!=="water"){n.x=nx;n.y=ny;}else{n.vx*=-1;n.vy*=-1;}

      for(let i=state.items.length-1;i>=0;i--){
        const item=state.items[i];
        if((item.x-n.x)**2+(item.y-n.y)**2<160){
          n.inventory[item.type]=(n.inventory[item.type]||0)+item.amount;
          if(item.type==="food") n.hunger=Math.min(100,n.hunger+30);
          state.items.splice(i,1); break;
        }
      }

      if(n.inventory.food>0 && n.hunger<40){
        n.inventory.food--;n.hunger=Math.min(100,n.hunger+30);
      }
      if(n.hunger<=0) n.hp-=.14;
    }

    for(let i=0;i<state.npcs.length;i++){
      for(let j=i+1;j<state.npcs.length;j++){
        const a=state.npcs[i],b=state.npcs[j];
        const d2=(a.x-b.x)**2+(a.y-b.y)**2;
        if(d2<240 && Math.random()<.003*(a.aggression+b.aggression)){
          const loser=Math.random()<.5?a:b;
          loser.hp-=rand(4,10);loser.flash=4;
        }
      }
    }

    state.npcs=state.npcs.filter(n=>n.hp>0);
    if(state.selectedNpc && !state.npcs.includes(state.selectedNpc)){
      state.selectedNpc=null;refreshNpcEditor();
    }
  }

  function updateHud(){
    ui.day.textContent=state.day;
    ui.pop.textContent=state.npcs.length;
    ui.objects.textContent=state.items.length;
    ui.zoom.textContent=Math.round(state.camera.zoom*100)+"%";
  }

  function refreshNpcEditor(){
    const n=state.selectedNpc;
    ui.noNpc.hidden=!!n;ui.editor.hidden=!n;
    if(!n)return;
    ui.npcName.value=n.name;ui.trait.value=n.trait;
    ui.agg.value=Math.round(n.aggression*100);ui.aggValue.textContent=Math.round(n.aggression*100)+"%";
    ui.speedNpc.value=Math.round(n.speed*10);ui.speedNpcValue.textContent=n.speed.toFixed(1);
    ui.hp.textContent=Math.max(0,Math.round(n.hp));ui.hunger.textContent=Math.max(0,Math.round(n.hunger));ui.age.textContent=n.age;
    ui.inventory.textContent=`🍎 ${n.inventory.food}   🪵 ${n.inventory.wood}   🪙 ${n.inventory.gold}`;
  }

  function pickNpcAt(wx,wy){
    let best=null,bd=(26/state.camera.zoom)**2;
    for(const n of state.npcs){
      const d=(n.x-wx)**2+(n.y-wy)**2;
      if(d<bd){bd=d;best=n;}
    }
    state.selectedNpc=best;refreshNpcEditor();draw();
  }

  function paintBiome(wx,wy,biome){
    const radius=+ui.brush.value;
    const minCx=clamp(Math.floor((wx-radius)/CELL),0,COLS-1);
    const maxCx=clamp(Math.ceil((wx+radius)/CELL),0,COLS-1);
    const minCy=clamp(Math.floor((wy-radius)/CELL),0,ROWS-1);
    const maxCy=clamp(Math.ceil((wy+radius)/CELL),0,ROWS-1);
    for(let cy=minCy;cy<=maxCy;cy++)for(let cx=minCx;cx<=maxCx;cx++){
      const x=(cx+.5)*CELL,y=(cy+.5)*CELL;
      if((x-wx)**2+(y-wy)**2<=radius*radius) state.cells[cellIndex(cx,cy)].biome=biome;
    }
  }

  function useTool(wx,wy){
    if(state.tool==="select") pickNpcAt(wx,wy);
    else if(BIOMES[state.tool]) paintBiome(wx,wy,state.tool);
    else {
      for(let i=0;i<6;i++) addItem(state.tool,wx+rand(-25,25),wy+rand(-25,25));
    }
    draw();updateHud();
  }

  document.querySelectorAll(".tool").forEach(btn=>{
    btn.addEventListener("click",()=>{
      state.tool=btn.dataset.tool;
      document.querySelectorAll(".tool").forEach(b=>b.classList.toggle("active",b===btn));
      ui.status.textContent=`Outil : ${btn.textContent.trim()}`;
    });
  });

  ui.play.addEventListener("click",()=>{state.running=true;ui.status.textContent="Simulation en cours…";});
  ui.pause.addEventListener("click",()=>{state.running=false;ui.status.textContent="Simulation en pause.";});
  ui.newWorld.addEventListener("click",newWorld);
  ui.addNpc.addEventListener("click",()=>{addNpcs(1);draw();});
  ui.add50.addEventListener("click",()=>{addNpcs(50);draw();});
  ui.scatter.addEventListener("click",()=>{scatterItems(160);draw();});
  ui.regen.addEventListener("click",()=>{generateBiomes();draw();ui.status.textContent="Biomes regénérés.";});
  ui.brush.addEventListener("input",()=>ui.brushValue.textContent=ui.brush.value);

  ui.npcName.addEventListener("input",()=>{if(state.selectedNpc){state.selectedNpc.name=ui.npcName.value||"Sans nom";draw();}});
  ui.randomName.addEventListener("click",()=>{if(state.selectedNpc){state.selectedNpc.name=randomName();refreshNpcEditor();draw();}});
  ui.trait.addEventListener("change",()=>{if(state.selectedNpc){state.selectedNpc.trait=ui.trait.value;draw();}});
  ui.agg.addEventListener("input",()=>{if(state.selectedNpc){state.selectedNpc.aggression=+ui.agg.value/100;refreshNpcEditor();}});
  ui.speedNpc.addEventListener("input",()=>{if(state.selectedNpc){state.selectedNpc.speed=+ui.speedNpc.value/10;refreshNpcEditor();}});
  document.querySelectorAll(".give-item").forEach(btn=>btn.addEventListener("click",()=>{
    if(!state.selectedNpc)return;
    state.selectedNpc.inventory[btn.dataset.item]+=5;refreshNpcEditor();
  }));
  ui.removeNpc.addEventListener("click",()=>{
    if(!state.selectedNpc)return;
    state.npcs=state.npcs.filter(n=>n!==state.selectedNpc);state.selectedNpc=null;refreshNpcEditor();draw();updateHud();
  });

  function canvasPoint(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};
  }

  canvas.addEventListener("contextmenu",e=>e.preventDefault());
  canvas.addEventListener("pointerdown",e=>{
    const p=canvasPoint(e);
    if(e.button===2){
      state.panning=true;state.panStart={x:e.clientX,y:e.clientY,cx:state.camera.x,cy:state.camera.y};
      return;
    }
    if(e.button===0){
      state.painting=true;
      const w=screenToWorld(p.x,p.y);useTool(w.x,w.y);
    }
  });
  canvas.addEventListener("pointermove",e=>{
    if(state.panning && state.panStart){
      state.camera.x=state.panStart.cx-(e.clientX-state.panStart.x)/state.camera.zoom;
      state.camera.y=state.panStart.cy-(e.clientY-state.panStart.y)/state.camera.zoom;
      state.camera.x=clamp(state.camera.x,0,WORLD_W);state.camera.y=clamp(state.camera.y,0,WORLD_H);draw();updateHud();
    } else if(state.painting && state.tool!=="select"){
      const p=canvasPoint(e),w=screenToWorld(p.x,p.y);useTool(w.x,w.y);
    }
  });
  window.addEventListener("pointerup",()=>{state.panning=false;state.painting=false;state.panStart=null;});

  canvas.addEventListener("wheel",e=>{
    e.preventDefault();
    const p=canvasPoint(e),before=screenToWorld(p.x,p.y);
    const factor=e.deltaY<0?1.12:0.89;
    state.camera.zoom=clamp(state.camera.zoom*factor,.22,2.2);
    const after=screenToWorld(p.x,p.y);
    state.camera.x+=before.x-after.x;state.camera.y+=before.y-after.y;
    draw();updateHud();
  },{passive:false});

  let last=0;
  function loop(ts){
    const dt=ts-last;last=ts;
    if(state.running){
      const steps=+ui.speed.value;
      for(let i=0;i<steps;i++) simulateStep();
      if(state.tick%6===0){updateHud();if(state.selectedNpc)refreshNpcEditor();}
    }
    draw();
    requestAnimationFrame(loop);
  }

  newWorld();
  requestAnimationFrame(loop);
})();
