/* CodePlatform main engine */
'use strict';

const ARENA_W=720, ARENA_H=480, PLAYER_W=28, PLAYER_H=28;
const FIXED_DT=1/60, MAX_FRAME_DT=.1, MAX_STEPS_PER_FRAME=6;
const GRAVITY=.55, JUMP_VEL=-12, MOVE_SPD=3.8, MAX_FALL=18;
const PLAYER_HITBOX={x:2,y:2,w:24,h:24};
const LEVEL_BASE='data/levels/';

let stages=[];
let stageSourceById=new Map();
let customStages=loadJSONStorage('cp_custom_stages',[]);
let currentStageIndex=0;
let currentStage=null;
let currentStageId=null;
let deathCount=0, runCount=0;
let completedStages=new Set(loadJSONStorage('cp_completed',[]));
let player={x:0,y:0,vx:0,vy:0,onGround:false,dead:false,rotation:0};
let keys={},animFrame=null,gameRunning=false,invincible=false;
let physicsAccumulator=0,lastFrameTime=0,inputMode=localStorage.getItem('cp_input_mode')||'play';
let customEditor={objects:[],selected:null,tool:'solid',spawn:{x:34,y:350},goal:{x:620,y:120}};

const $=id=>document.getElementById(id);
const arena=$('arena'), playerEl=$('player'), goalEl=$('goal'), spawnEl=$('spawn-marker'), userEls=$('user-elements');
const deathFlash=$('death-flash'), statusDot=$('status-dot'), statusText=$('status-text'), coordsEl=$('coords');
const deathCountEl=$('death-count'), runCountEl=$('run-count'), stageNameEl=$('stage-name'), stageLabelEl=$('stage-label'), stageHintEl=$('stage-hint');
const codeInput=$('code-input'), lineNumbers=$('line-numbers'), warnBanner=$('warn-banner'), warnText=$('warn-text');

function loadJSONStorage(key,fallback){try{const x=JSON.parse(localStorage.getItem(key)||'null');return x??fallback}catch{return fallback}}
function saveProgress(){localStorage.setItem('cp_completed',JSON.stringify([...completedStages]));}
function saveCustomStages(){localStorage.setItem('cp_custom_stages',JSON.stringify(customStages));}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),2200)}

/* ---------- NAVIGATION ---------- */
const screens=['home-screen','stage-screen','tutorial-screen','settings-screen','editor-screen','game-screen'];
function showScreen(id){screens.forEach(s=>$(s).classList.toggle('hidden',s!==id));if(id!=='game-screen')stopGame();}
function showHome(){showScreen('home-screen')}
function showStageScreen(){showScreen('stage-screen');buildStageGrid();buildCustomStageGrid();}
function showTutorialScreen(){showScreen('tutorial-screen')}
function showSettingsScreen(){showScreen('settings-screen');syncSettingsUI()}
function showEditorScreen(){showScreen('editor-screen');renderEditor()}

/* ---------- THEME ---------- */
let isDark=localStorage.getItem('cp_theme')!=='light';
function applyTheme(){document.documentElement.setAttribute('data-theme',isDark?'dark':'light');$('theme-icon').textContent=isDark?'🌙':'☀️';$('theme-label').textContent=isDark?'Dark':'Light';localStorage.setItem('cp_theme',isDark?'dark':'light');syncSettingsUI()}
function toggleTheme(){isDark=!isDark;applyTheme()}
function syncSettingsUI(){$('settings-theme-icon').textContent=isDark?'🌙':'☀️';$('settings-theme-label').textContent=isDark?'Dark':'Light';$('settings-play').classList.toggle('active',inputMode==='play');$('settings-code').classList.toggle('active',inputMode==='code')}

/* ---------- LEVEL LOADING ---------- */
async function loadAllStages(){
  try{
    const manifest=await fetch(LEVEL_BASE+'manifest.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()});
    const loaded=await Promise.all(manifest.levels.map(file=>fetch(LEVEL_BASE+file,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`${file}: HTTP ${r.status}`);return r.json()})));
    stages=loaded.sort((a,b)=>a.id-b.id);
    stageSourceById=new Map(stages.map(s=>[String(s.id),'official']));
    buildStageGrid();
    setStatus('Level database loaded','ok');
  }catch(err){
    console.error(err); stages=[]; setStatus('Gagal memuat JSON level','dead');
    showHome();
    toast('JSON level belum bisa dibaca. Jalankan project melalui Live Server/localhost.');
  }
}
function isCustomStage(stage){return !!stage?.custom}
function allPlayableStages(){return [...stages,...customStages]}
function getPlayableStageById(id){return allPlayableStages().find(s=>String(s.id)===String(id))}
function stageDifficultyClass(diff){return diff==='easy'?'diff-easy':diff==='hard'?'diff-hard':'diff-med'}
function isStageUnlocked(index){if(index<=0)return true;const prev=stages[index-1];return completedStages.has(String(prev.id))||completedStages.has(prev.id)}

async function loadStage(index,options={}){
  const arr=stages;
  if(index<0||index>=arr.length)return false;
  if(!isStageUnlocked(index))return false;
  const {preserveCode=false}=options;
  currentStageIndex=index; currentStage=arr[index]; currentStageId=String(currentStage.id);
  deathCount=0;runCount=0;deathCountEl.textContent='0';runCountEl.textContent='0';
  if(!preserveCode)codeInput.value='';updateLineNumbers();closeWarn();hideAC();
  renderStage(currentStage);showScreen('game-screen');startGame();
  return true;
}
function loadCustomStage(stage){
  currentStage=structuredClone(stage);currentStageId=String(stage.id);currentStageIndex=-1;deathCount=0;runCount=0;deathCountEl.textContent='0';runCountEl.textContent='0';codeInput.value='';updateLineNumbers();renderStage(currentStage);showScreen('game-screen');startGame();
}
function renderStage(stage){
  stageNameEl.textContent=`${stage.custom?'★ ':''}${stage.id}. ${stage.title}`;
  stageLabelEl.textContent=stage.custom?'Custom Stage':`Stage ${stage.id}/${stages.length}`;
  stageHintEl.innerHTML=`<strong>💡 Petunjuk:</strong> ${stage.hint||stage.description||'Bangun jalur yang aman.'}`;
  arena.querySelectorAll('.stage-obj').forEach(e=>e.remove());userEls.innerHTML='';
  for(const obj of (stage.objects||[]))createStageObject(obj);
  goalEl.style.left=(stage.goal?.x??640)+'px';goalEl.style.top=(stage.goal?.y??80)+'px';goalEl.style.transform=`rotate(${stage.goal?.angle||0}deg)`;
  spawnPlayer();
}
function createStageObject(o){
  const el=document.createElement('div');
  if(o.type==='solid'){
    el.className=`platform ${o.kind||'platform'} stage-obj`;el.style.left=`${o.x||0}px`;el.style.top=`${o.y||0}px`;el.style.width=`${o.w||100}px`;el.style.height=`${o.h||20}px`;el.style.transform=`rotate(${o.angle||0}deg)`;
  }else if(o.type==='hazard'&&['spike'].includes(o.kind)){
    el.className=`spike ${o.dir||'up'} stage-obj`;el.style.left=`${o.x||0}px`;el.style.top=`${o.y||0}px`;if(o.w&&o.h){el.style.setProperty('--sw',o.w+'px');el.style.setProperty('--sh',o.h+'px')}el.style.transform=`rotate(${o.angle||0}deg)`;
  }else if(o.type==='hazard'&&o.kind==='lava'){
    el.className='platform lava stage-obj';el.style.left=`${o.x||0}px`;el.style.top=`${o.y||0}px`;el.style.width=`${o.w||100}px`;el.style.height=`${o.h||20}px`;el.dataset.hazard='lava';
  }else if(o.type==='hazard'&&o.kind==='diamond'){
    el.className='diamond-hazard stage-obj';el.style.left=`${o.x||0}px`;el.style.top=`${o.y||0}px`;el.style.width=`${o.w||42}px`;el.style.height=`${o.h||42}px`;el.style.transform=`rotate(${o.angle||45}deg)`;el.dataset.hazard='diamond';
  }else return null;
  el.dataset.object=JSON.stringify(o);arena.appendChild(el);return el;
}
function spawnPlayer(){
  const s=currentStage||stages[currentStageIndex];const sp=s?.spawn||{x:30,y:350};
  player={x:sp.x,y:sp.y,vx:0,vy:0,onGround:false,dead:false,rotation:0};invincible=false;playerEl.classList.remove('dead','jumping');spawnEl.style.left=sp.x+'px';spawnEl.style.top=(sp.y+PLAYER_H+4)+'px';syncPlayerDOM();setStatus('Aktif','ok');
}
function syncPlayerDOM(){playerEl.style.left=player.x+'px';playerEl.style.top=player.y+'px';playerEl.style.transform=`rotate(${player.rotation}deg)`;}

/* ---------- GEOMETRY / COLLISION ---------- */
function rectsOverlap(a,b){return !(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom)}
function getPlayerRect(){return {left:player.x+PLAYER_HITBOX.x,top:player.y+PLAYER_HITBOX.y,right:player.x+PLAYER_HITBOX.x+PLAYER_HITBOX.w,bottom:player.y+PLAYER_HITBOX.y+PLAYER_HITBOX.h}}
function arenaScale(){const ar=arena.getBoundingClientRect();return {ar,s:ar.width/ARENA_W}}
function localToWorld(p,el){const {ar,s}=arenaScale();const r=el.getBoundingClientRect();return {x:(r.left-ar.left)/s+p.x,y:(r.top-ar.top)/s+p.y}}
function getDOMPolygon(el){
  const {ar,s}=arenaScale();
  const x=el.offsetLeft,y=el.offsetTop,w=el.offsetWidth,h=el.offsetHeight;
  let deg=0;const t=getComputedStyle(el).transform; if(t&&t!=='none'){const m=new DOMMatrixReadOnly(t);deg=Math.atan2(m.b,m.a)*180/Math.PI;}
  const rad=deg*Math.PI/180,c=Math.cos(rad),sn=Math.sin(rad),cx=x+w/2,cy=y+h/2;
  const pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([px,py])=>({x:((cx+(px-cx)*c-(py-cy)*sn)),y:(cy+(px-cx)*sn+(py-cy)*c)}));
  return pts;
}
function playerPoly(){const r=getPlayerRect();return[{x:r.left,y:r.top},{x:r.right,y:r.top},{x:r.right,y:r.bottom},{x:r.left,y:r.bottom}]}
function polyAxes(poly){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y;const len=Math.hypot(dx,dy)||1;out.push({x:-dy/len,y:dx/len})}return out}
function projectPoly(poly,axis){let min=Infinity,max=-Infinity;for(const p of poly){const v=p.x*axis.x+p.y*axis.y;min=Math.min(min,v);max=Math.max(max,v)}return{min,max}}
function sat(a,b){let smallest=Infinity,axis=null;for(const ax of [...polyAxes(a),...polyAxes(b)]){const pa=projectPoly(a,ax),pb=projectPoly(b,ax);const ov=Math.min(pa.max,pb.max)-Math.max(pa.min,pb.min);if(ov<=0)return null;if(ov<smallest){smallest=ov;axis=ax}}const ac=a.reduce((p,q)=>({x:p.x+q.x/a.length,y:p.y+q.y/a.length}),{x:0,y:0}),bc=b.reduce((p,q)=>({x:p.x+q.x/b.length,y:p.y+q.y/b.length}),{x:0,y:0});if((bc.x-ac.x)*axis.x+(bc.y-ac.y)*axis.y<0){axis.x*=-1;axis.y*=-1}return {depth:smallest,axis}}
function solidPolys(){
  const polys=[];arena.querySelectorAll('.platform').forEach(el=>{if(el.classList.contains('lava'))polys.push({el,poly:getDOMPolygon(el),hazard:true});else polys.push({el,poly:getDOMPolygon(el),hazard:false})});
  userEls.querySelectorAll('div,section,header,footer,main,article,aside,nav,figure,span,p,h1,h2,h3,h4,h5,h6,table,tr,td,th,ul,ol,li,blockquote,pre,code,form,fieldset,button,input,textarea,select,label,a').forEach(el=>{if(el===playerEl||el.closest?.('#hud'))return;const r=getElementLocalRect(el);if(r.w>0&&r.h>0)polys.push({el,poly:getDOMPolygon(el),hazard:false})});return polys;
}
function getElementLocalRect(el){const r=el.getBoundingClientRect(),{ar,s}=arenaScale();return {left:(r.left-ar.left)/s,top:(r.top-ar.top)/s,right:(r.right-ar.left)/s,bottom:(r.bottom-ar.top)/s,w:(r.width/s),h:(r.height/s)}}
function hazardPolys(){const a=[];arena.querySelectorAll('.spike,.diamond-hazard').forEach(el=>a.push({el,poly:hazardPolygon(el)}));return a}
function hazardPolygon(el){
  const tag=el.classList.contains('spike');
  if(tag){const r=getElementLocalRect(el);const dir=['up','down','left','right'].find(c=>el.classList.contains(c))||'up';let p;if(dir==='up')p=[{x:r.left,y:r.bottom},{x:(r.left+r.right)/2,y:r.top},{x:r.right,y:r.bottom}];else if(dir==='down')p=[{x:r.left,y:r.top},{x:r.right,y:r.top},{x:(r.left+r.right)/2,y:r.bottom}];else if(dir==='right')p=[{x:r.left,y:r.top},{x:r.right,y:(r.top+r.bottom)/2},{x:r.left,y:r.bottom}];else p=[{x:r.right,y:r.top},{x:r.left,y:(r.top+r.bottom)/2},{x:r.right,y:r.bottom}];return rotatePoly(p,centerOf(p),getAngle(el))}
  const r=getElementLocalRect(el),p=[{x:r.left,y:(r.top+r.bottom)/2},{x:(r.left+r.right)/2,y:r.top},{x:r.right,y:(r.top+r.bottom)/2},{x:(r.left+r.right)/2,y:r.bottom}];return p;
}
function centerOf(p){return p.reduce((a,q)=>({x:a.x+q.x/p.length,y:a.y+q.y/p.length}),{x:0,y:0})}
function getAngle(el){const t=getComputedStyle(el).transform;if(!t||t==='none')return 0;const m=new DOMMatrixReadOnly(t);return Math.atan2(m.b,m.a)}
function rotatePoly(poly,c,rad){const co=Math.cos(rad),si=Math.sin(rad);return poly.map(p=>({x:c.x+(p.x-c.x)*co-(p.y-c.y)*si,y:c.y+(p.x-c.x)*si+(p.y-c.y)*co}))}
function updatePhysics(){
  if(player.dead||inputMode!=='play')return;
  const prevPoly=playerPoly();const prev={x:player.x,y:player.y};let moving=false;
  if(keys.ArrowLeft||keys.a){player.vx=-MOVE_SPD;moving=true}if(keys.ArrowRight||keys.d){player.vx=MOVE_SPD;moving=true}if(!moving)player.vx=0;
  if((keys.ArrowUp||keys.Space||keys[' '])&&player.onGround){player.vy=JUMP_VEL;player.onGround=false;playerEl.classList.add('jumping')}
  player.vy=Math.min(MAX_FALL,player.vy+GRAVITY);player.x+=player.vx;player.y+=player.vy;
  if(player.x<0){player.x=0;player.vx=0}if(player.x+PLAYER_W>ARENA_W){player.x=ARENA_W-PLAYER_W;player.vx=0}if(player.y<0){player.y=0;player.vy=0}
  player.onGround=false;
  const after=playerPoly();
  for(const s of solidPolys()){
    const hit=sat(after,s.poly);if(!hit)continue;
    if(s.hazard){killPlayer();return}
    const falling=player.vy>=0, rising=player.vy<0;
    const vertical=Math.abs(hit.axis.y)>=Math.abs(hit.axis.x);
    player.x-=hit.axis.x*hit.depth;player.y-=hit.axis.y*hit.depth;
    if(vertical){
      if(falling&&hit.axis.y<0){player.onGround=true;player.vy=0;player.rotation=Math.round(player.rotation/90)*90;playerEl.classList.remove('jumping')}
      else if(rising&&hit.axis.y>0)player.vy=0;
      else player.vy=0;
    }else player.vx=0;
  }
  if(!invincible){const pp=playerPoly();for(const h of hazardPolys()){if(sat(pp,h.poly)){killPlayer();return}}}
  if(player.y>ARENA_H+50){killPlayer();return}
  if(!player.onGround)player.rotation+=player.vx!==0?5:4;
  checkGoal();coordsEl.textContent=`x:${Math.round(player.x)} y:${Math.round(player.y)}`;syncPlayerDOM();
}
function checkGoal(){const r=getPlayerRect(),g=getElementLocalRect(goalEl);if(rectsOverlap(r,g))showWin()}

/* ---------- FIXED STEP LOOP ---------- */
function gameLoop(now){if(!gameRunning)return;if(!lastFrameTime)lastFrameTime=now;const dt=Math.min((now-lastFrameTime)/1000,MAX_FRAME_DT);lastFrameTime=now;physicsAccumulator+=dt;let steps=0;while(physicsAccumulator>=FIXED_DT&&steps<MAX_STEPS_PER_FRAME){updatePhysics();physicsAccumulator-=FIXED_DT;steps++}animFrame=requestAnimationFrame(gameLoop)}
function startGame(){gameRunning=true;physicsAccumulator=0;lastFrameTime=performance.now();if(animFrame)cancelAnimationFrame(animFrame);animFrame=requestAnimationFrame(gameLoop);setStatus('Aktif','ok')}
function stopGame(){gameRunning=false;physicsAccumulator=0;if(animFrame){cancelAnimationFrame(animFrame);animFrame=null}keys={}}
function setStatus(msg,state){if(statusText)statusText.textContent=msg;if(statusDot)statusDot.classList.toggle('dead',state==='dead')}
function killPlayer(){if(player.dead||invincible)return;player.dead=true;deathCount++;deathCountEl.textContent=deathCount;playerEl.classList.add('dead');setStatus('Mati!','dead');deathFlash.classList.add('active');setTimeout(()=>{deathFlash.classList.remove('active');spawnPlayer()},320)}

/* ---------- CODE EXECUTION / SAFETY ---------- */
const FORBIDDEN_PATTERNS=[
 {re:/<script[\s>]/i,msg:'Tag <script> tidak diizinkan.'},{re:/javascript\s*:/i,msg:'Atribut javascript: tidak diizinkan.'},{re:/on\w+\s*=/i,msg:'Event handler inline tidak diizinkan.'},{re:/position\s*:\s*fixed/i,msg:'position:fixed tidak diizinkan.'},{re:/!important/i,msg:'!important tidak diizinkan.'},{re:/<iframe/i,msg:'iframe tidak diizinkan.'},{re:/<embed/i,msg:'embed tidak diizinkan.'},{re:/<object/i,msg:'object tidak diizinkan.'},{re:/expression\s*\(/i,msg:'expression() tidak diizinkan.'},{re:/url\s*\(\s*data:/i,msg:'Data URLs tidak diizinkan.'}
];
function validateCode(code){for(const p of FORBIDDEN_PATTERNS)if(p.re.test(code))return p.msg;return null}
function sanitizeStyle(s){return s.replace(/position\s*:\s*fixed[^;]*/gi,'').replace(/!important/gi,'').replace(/expression\s*\([^)]*\)/gi,'')}
function runCode(){const code=codeInput.value.trim(),err=code?validateCode(code):null;if(err){showWarn(err);return}closeWarn();spawnPlayer();userEls.innerHTML='';try{const tmp=document.createElement('div');tmp.innerHTML=code;tmp.querySelectorAll('[style]').forEach(el=>el.setAttribute('style',sanitizeStyle(el.getAttribute('style')||'')));tmp.querySelectorAll('*').forEach(el=>[...el.attributes].forEach(a=>{if(/^on/i.test(a.name))el.removeAttribute(a.name)}));for(const n of [...tmp.childNodes])userEls.appendChild(n.cloneNode(true));runCount++;runCountEl.textContent=runCount;toast('Kode berhasil dijalankan.')}catch(e){showWarn('Kode HTML tidak valid: '+e.message);userEls.innerHTML=''}}
function showWarn(msg){warnText.textContent=msg;warnBanner.classList.add('visible')}function closeWarn(){warnBanner.classList.remove('visible')}
function confirmReset(){$('confirm-modal').classList.remove('hidden')}function closeConfirm(){$('confirm-modal').classList.add('hidden')}
function doReset(){closeConfirm();codeInput.value='';updateLineNumbers();userEls.innerHTML='';runCount=0;deathCount=0;runCountEl.textContent='0';deathCountEl.textContent='0';spawnPlayer();closeWarn();toast('Level di-reset.')}

/* ---------- WIN / PROGRESSION ---------- */
function showWin(){stopGame();if(currentStage?.custom){toast('Custom stage selesai!');showScreen('editor-screen');return}const s=currentStage;completedStages.add(String(s.id));saveProgress();$('win-sub').textContent=`Stage ${s.id}: "${s.title}" selesai! Kematian: ${deathCount} | Run: ${runCount}x`;$('win-modal').classList.remove('hidden');spawnParticles();buildStageGrid()}
function nextStage(){$('win-modal').classList.add('hidden');if(currentStageIndex>=0&&currentStageIndex+1<stages.length)loadStage(currentStageIndex+1);else showStageScreen()}
function restartStage(){$('win-modal').classList.add('hidden');if(currentStage?.custom)loadCustomStage(currentStage);else loadStage(currentStageIndex,{preserveCode:true})}
function buildStageGrid(){const grid=$('stage-grid');if(!grid)return;grid.innerHTML='';if(!stages.length){grid.innerHTML='<div class="custom-empty">Belum ada level JSON yang berhasil dimuat.</div>';return}stages.forEach((s,i)=>{const done=completedStages.has(String(s.id))||completedStages.has(s.id),unlocked=isStageUnlocked(i);const card=document.createElement('div');card.className=`stage-card${done?' completed':''}${!unlocked?' locked':''}${String(currentStage?.id)===String(s.id)?' current':''}`;const dc=stageDifficultyClass(s.diff);card.innerHTML=`<div class="stage-num">${String(s.id).padStart(2,'0')}</div><div class="stage-diff ${dc}">${s.diff.toUpperCase()}</div><div class="stage-title">${escapeHTML(s.title)}</div><div class="stage-description">${escapeHTML(s.description||'')}</div><div class="stage-lock">${done?'✅':!unlocked?'🔒':'▶'}</div>`;if(unlocked)card.onclick=()=>loadStage(i);grid.appendChild(card)})}
function buildCustomStageGrid(){const grid=$('custom-stage-grid');if(!grid)return;grid.innerHTML='';if(!customStages.length){grid.innerHTML='<div class="custom-empty">Belum ada stage custom. Buka <strong>Stage Editor</strong> untuk membuatnya.</div>';return}customStages.forEach((s,i)=>{const card=document.createElement('div');card.className='stage-card custom-card';card.innerHTML=`<div class="stage-num">★</div><div class="stage-diff diff-med">CUSTOM</div><div class="stage-title">${escapeHTML(s.title)}</div><div class="stage-description">${escapeHTML(s.description||'')}</div><div class="stage-lock">▶</div>`;card.onclick=()=>loadCustomStage(s);grid.appendChild(card)})}
function escapeHTML(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function resetProgress(){if(!confirm('Reset semua progres stage resmi dan stage custom?'))return;completedStages.clear();customStages=[];saveProgress();saveCustomStages();buildStageGrid();buildCustomStageGrid();toast('Progress berhasil di-reset.')}

/* ---------- INPUT MODES ---------- */
function setInputMode(mode){inputMode=mode==='code'?'code':'play';localStorage.setItem('cp_input_mode',inputMode);document.body.classList.toggle('play-mode',inputMode==='play');document.body.classList.toggle('code-mode',inputMode==='code');$('play-mode-btn').classList.toggle('active',inputMode==='play');$('code-mode-btn').classList.toggle('active',inputMode==='code');syncSettingsUI();if(inputMode==='code'){keys={};codeInput.focus()}else{codeInput.blur();hideAC()}}
function isInteractiveTarget(t){return !!t?.closest?.('input,textarea,select,button,[contenteditable="true"],.modal-overlay,.app-screen:not(#game-screen)')}
document.addEventListener('keydown',e=>{if(inputMode!=='play'||isInteractiveTarget(e.target))return;keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Space'].includes(e.key))e.preventDefault()});document.addEventListener('keyup',e=>{keys[e.key]=false});

/* ---------- SPLITTER / RESPONSIVE SCALE ---------- */
(function(){const splitter=$('splitter'),left=$('left-panel'),wrap=$('arena-wrapper');let dragging=false;function scale(){if(!wrap||window.innerWidth<=820){arena.style.transform=`scale(${Math.min(wrap?.clientWidth?wrap.clientWidth/ARENA_W:1,wrap?.clientHeight?wrap.clientHeight/ARENA_H:1,1)})`;return}const s=Math.min(wrap.clientWidth/ARENA_W,wrap.clientHeight/ARENA_H,1);arena.style.transform=`scale(${s})`}splitter?.addEventListener('mousedown',e=>{dragging=true;splitter.classList.add('dragging');e.preventDefault()});document.addEventListener('mousemove',e=>{if(!dragging)return;const mr=$('main').getBoundingClientRect();const p=Math.max(.2,Math.min(.8,(e.clientX-mr.left)/mr.width));left.style.width=`${p*100}%`;scale()});document.addEventListener('mouseup',()=>{dragging=false;splitter?.classList.remove('dragging')});splitter?.addEventListener('touchstart',e=>{dragging=true;e.preventDefault()},{passive:false});document.addEventListener('touchmove',e=>{if(!dragging)return;const mr=$('main').getBoundingClientRect();const p=Math.max(.2,Math.min(.8,(e.touches[0].clientX-mr.left)/mr.width));left.style.width=`${p*100}%`;scale();e.preventDefault()},{passive:false});document.addEventListener('touchend',()=>dragging=false);window.addEventListener('resize',scale);setTimeout(scale,30)})();

/* ---------- LINE NUMBERS / AUTOCOMPLETE ---------- */
function updateLineNumbers(){const n=codeInput.value.split('\n').length;lineNumbers.innerHTML=Array.from({length:n},(_,i)=>i+1).join('<br>');lineNumbers.scrollTop=codeInput.scrollTop}
codeInput.addEventListener('input',()=>{updateLineNumbers();triggerAC()});codeInput.addEventListener('scroll',()=>lineNumbers.scrollTop=codeInput.scrollTop);

const AC_DB = [
  // ── HTML Tags ──
  { label:'div',       kind:'tag',  insert:'<div style="position:absolute; left:0px; bottom:0px; width:100px; height:20px; background:#2a4278;"></div>', detail:'Block container', doc:'Buat elemen kotak solid sebagai platform. Gunakan <code>position:absolute</code> dan properti <code>left</code>, <code>bottom</code>, <code>width</code>, <code>height</code>.' },
  { label:'div.platform', kind:'snip', insert:'<div style="position:absolute; left:${1:100}px; bottom:${2:120}px; width:${3:200}px; height:20px; background:#2a4278; border:1px solid #3a5a9a;"></div>', detail:'Platform snippet', doc:'Snippet cepat untuk membuat platform. Ganti nilai angka sesuai posisi yang diinginkan.' },
  { label:'div.bridge',   kind:'snip', insert:'<div style="position:absolute; left:${1:180}px; bottom:${2:440}px; width:${3:340}px; height:20px; background:#1a2a3e;"></div>', detail:'Jembatan datar', doc:'Platform lebar untuk menjembatani jurang. Sesuaikan <code>left</code> dan <code>width</code>.' },
  { label:'div.ladder',   kind:'snip', insert:'<div style="position:absolute; left:${1:200}px; bottom:${2:120}px; width:20px; height:${3:200}px; background:#1e2d4a;"></div>', detail:'Tangga vertikal', doc:'Kolom vertikal yang bisa digunakan sebagai tangga atau dinding pijakan.' },
  { label:'div.stair',    kind:'snip', insert:'<div style="position:absolute; left:${1:200}px; bottom:${2:100}px; width:80px; height:20px; background:#2a4278;"></div>\n<div style="position:absolute; left:${3:280}px; bottom:${4:160}px; width:80px; height:20px; background:#2a4278;"></div>\n<div style="position:absolute; left:${5:360}px; bottom:${6:220}px; width:80px; height:20px; background:#2a4278;"></div>', detail:'Tangga bertingkat (3 step)', doc:'Tiga platform bertingkat. Setiap step naik 60px secara default.' },
  { label:'div.wall',     kind:'snip', insert:'<div style="position:absolute; left:${1:300}px; bottom:0px; width:20px; height:${2:300}px; background:#1a2a3e;"></div>', detail:'Tembok vertikal', doc:'Dinding vertical. Atur <code>height</code> untuk ketinggian tembok.' },
  { label:'p',            kind:'tag',  insert:'<p style="position:absolute; left:0px; bottom:0px; width:100px; height:20px;"></p>', detail:'Paragraph', doc:'Elemen paragraf — bisa digunakan sebagai platform tipis.' },
  { label:'section',      kind:'tag',  insert:'<section style="position:absolute; left:0px; bottom:0px; width:200px; height:40px;"></section>', detail:'Section block', doc:'Elemen section, solid seperti div.' },
  { label:'span',         kind:'tag',  insert:'<span style="position:absolute; left:0px; bottom:0px; width:60px; height:20px; display:block;"></span>', detail:'Inline (perlu display:block)', doc:'Span bersifat inline secara default, tambahkan <code>display:block</code> agar solid.' },

  // ── CSS Properties (sering dipakai dalam style="") ──
  { label:'position:absolute', kind:'prop', insert:'position:absolute; ', detail:'CSS property', doc:'Wajib untuk elemen dalam arena. Posisi relatif terhadap arena (720×480px).' },
  { label:'left',              kind:'prop', insert:'left:${1:100}px; ',   detail:'Posisi X dari kiri', doc:'Jarak dari tepi kiri arena. Rentang: 0 – 720px.' },
  { label:'bottom',            kind:'prop', insert:'bottom:${1:100}px; ', detail:'Posisi Y dari bawah', doc:'Jarak dari tepi bawah arena. Rentang: 0 – 480px. Lebih besar = lebih tinggi.' },
  { label:'top',               kind:'prop', insert:'top:${1:100}px; ',    detail:'Posisi Y dari atas', doc:'Jarak dari tepi atas arena. Rentang: 0 – 480px.' },
  { label:'right',             kind:'prop', insert:'right:${1:100}px; ',  detail:'Posisi X dari kanan', doc:'Jarak dari tepi kanan arena. Rentang: 0 – 720px.' },
  { label:'width',             kind:'prop', insert:'width:${1:200}px; ',  detail:'Lebar elemen', doc:'Lebar platform dalam piksel. Untuk arena 720px, 80–300px cukup untuk platform lompat.' },
  { label:'height',            kind:'prop', insert:'height:${1:20}px; ',  detail:'Tinggi elemen', doc:'Tinggi platform. 20px = platform tipis, 40px+ = platform tebal.' },
  { label:'background',        kind:'css',  insert:'background:${1:#2a4278}; ', detail:'Warna latar', doc:'Warna background elemen. Bisa hex (#2a4278), rgb, hsl, atau nama warna.' },
  { label:'background-color',  kind:'css',  insert:'background-color:${1:#2a4278}; ', detail:'Warna latar (longhand)', doc:'Sama seperti background, tapi khusus warna.' },
  { label:'border',            kind:'css',  insert:'border:${1:1px solid #3a5a9a}; ', detail:'Garis tepi', doc:'Border di sekeliling elemen. Format: tebal jenis warna.' },
  { label:'border-radius',     kind:'css',  insert:'border-radius:${1:4}px; ', detail:'Sudut membulat', doc:'Membuat sudut elemen membulat. 50% = lingkaran penuh.' },
  { label:'opacity',           kind:'css',  insert:'opacity:${1:0.8}; ', detail:'Transparansi (0-1)', doc:'Transparansi elemen. 0 = tak terlihat, 1 = sepenuhnya terlihat. Elemen tetap solid!' },
  { label:'transform:rotate',  kind:'css',  insert:'transform:rotate(${1:45}deg); ', detail:'Rotasi elemen', doc:'Memutar elemen. Meskipun terlihat miring, hitbox collide tetap berdasarkan rect aslinya.' },
  { label:'transform:scale',   kind:'css',  insert:'transform:scale(${1:1.5}); ', detail:'Skala elemen', doc:'Memperbesar/memperkecil tampilan elemen secara visual.' },
  { label:'display:block',     kind:'css',  insert:'display:block; ', detail:'Display block', doc:'Paksa elemen inline (span, a) menjadi block agar memiliki dimensi width/height.' },
  { label:'box-shadow',        kind:'css',  insert:'box-shadow:${1:0 0 10px rgba(91,156,246,0.5)}; ', detail:'Bayangan kotak', doc:'Memberi efek cahaya atau bayangan pada elemen. Tidak mempengaruhi collide.' },

  // ── CSS Color Values ──
  { label:'#2a4278', kind:'val', insert:'#2a4278', detail:'Biru tua (platform)', doc:'Warna platform standar — biru gelap.' },
  { label:'#1a2a3e', kind:'val', insert:'#1a2a3e', detail:'Biru lebih gelap (ground)', doc:'Warna ground/tanah — lebih gelap dari platform biasa.' },
  { label:'#162d3a', kind:'val', insert:'#162d3a', detail:'Biru-hijau (ice)', doc:'Warna es — memberikan nuansa lantai beku.' },
  { label:'#3a1a0e', kind:'val', insert:'#3a1a0e', detail:'Merah tua (lava)', doc:'Warna lava — merah kecokelatan gelap.' },
  { label:'#34d399', kind:'val', insert:'#34d399', detail:'Hijau (sukses/goal)', doc:'Warna hijau cerah seperti pintu tujuan.' },
  { label:'#5b9cf6', kind:'val', insert:'#5b9cf6', detail:'Biru accent', doc:'Biru terang seperti warna karakter.' },
  { label:'#a78bfa', kind:'val', insert:'#a78bfa', detail:'Ungu accent', doc:'Ungu pastel accent.' },
  { label:'#f97583', kind:'val', insert:'#f97583', detail:'Pink/merah muda', doc:'Merah muda cerah.' },
  { label:'rgba(255,255,255,0.2)', kind:'val', insert:'rgba(255,255,255,0.2)', detail:'Putih semi-transparan', doc:'Warna putih 20% opacity, berguna untuk efek glossy.' },

  // ── Platform Templates ──
  { label:'!platform-kiri',    kind:'snip', insert:'<!-- Platform sisi kiri -->\n<div style="position:absolute; left:180px; bottom:160px; width:120px; height:20px; background:#2a4278; border:1px solid #3a5a9a;"></div>', detail:'Platform kiri arena', doc:'Platform siap pakai di sisi kiri tengah arena.' },
  { label:'!platform-kanan',   kind:'snip', insert:'<!-- Platform sisi kanan -->\n<div style="position:absolute; left:420px; bottom:200px; width:120px; height:20px; background:#2a4278; border:1px solid #3a5a9a;"></div>', detail:'Platform kanan arena', doc:'Platform siap pakai di sisi kanan tengah arena.' },
  { label:'!platform-tengah',  kind:'snip', insert:'<!-- Platform tengah -->\n<div style="position:absolute; left:260px; bottom:240px; width:200px; height:20px; background:#1e2d4a; border:1px solid #2a4278;"></div>', detail:'Platform tengah arena', doc:'Platform horizontal tepat di tengah arena.' },
  { label:'!lompatan-pendek',  kind:'snip', insert:'<div style="position:absolute; left:180px; bottom:120px; width:80px; height:20px; background:#2a4278;"></div>\n<div style="position:absolute; left:320px; bottom:200px; width:80px; height:20px; background:#2a4278;"></div>\n<div style="position:absolute; left:460px; bottom:280px; width:80px; height:20px; background:#2a4278;"></div>', detail:'Batu loncatan (3 step naik)', doc:'Tiga stepping stone mengarah ke kiri-atas. Jarak antar platform ~60px horizontal dan 80px vertikal.' },
];

const acDropdown=$('ac-dropdown'),acList=$('ac-list'),acDoc=$('ac-doc'),acCount=$('ac-count');let acItems=[],acIdx=-1,acTriggerWord='';
function acVisible(){return acDropdown.classList.contains('visible')}function hideAC(){acDropdown.classList.remove('visible');acItems=[];acIdx=-1}
function getWordBefore(ta){const txt=ta.value,cur=ta.selectionStart;let i=cur;while(i>0&&/[\w\-:#.!<\/]/.test(txt[i-1]))i--;return{word:txt.substring(i,cur),start:i}}
function getCaretCoords(ta){const div=document.createElement('div'),style=getComputedStyle(ta);['fontFamily','fontSize','lineHeight','padding','paddingLeft','paddingTop','border','boxSizing','whiteSpace','wordSpacing','letterSpacing','tabSize'].forEach(p=>div.style[p]=style[p]);div.style.cssText+=';position:absolute;visibility:hidden;top:-9999px;left:-9999px;width:'+ta.offsetWidth+'px;height:auto;overflow:hidden;white-space:pre-wrap;word-break:break-all;';div.textContent=ta.value.substring(0,ta.selectionStart);const span=document.createElement('span');span.textContent='|';div.appendChild(span);document.body.appendChild(div);const tr=ta.getBoundingClientRect();const x=tr.left+(span.offsetLeft-ta.scrollLeft),y=tr.top+(span.offsetTop-ta.scrollTop);div.remove();return{x,y}}
function positionDropdown(x,y){const w=300,h=280,vw=innerWidth,vh=innerHeight;let l=Math.min(x,vw-w-8),t=y+18;if(t+h>vh-8)t=y-h;if(l<4)l=4;if(t<4)t=4;acDropdown.style.left=l+'px';acDropdown.style.top=t+'px'}
function computeSuggestions(word){if(!word)return[];const q=word.toLowerCase();return AC_DB.filter(i=>{const l=i.label.toLowerCase();return l.startsWith(q)||l.includes(q)}).sort((a,b)=>Number(!a.label.toLowerCase().startsWith(q))-Number(!b.label.toLowerCase().startsWith(q))||a.label.localeCompare(b.label)).slice(0,18)}
function highlightMatch(label,q){if(!q)return label;const i=label.toLowerCase().indexOf(q.toLowerCase());return i<0?label:label.slice(0,i)+`<span class="ac-match">${label.slice(i,i+q.length)}</span>`+label.slice(i+q.length)}
function kindIcon(kind){return `<div class="ac-icon ${kind}">${({tag:'T',prop:'P',val:'V',snip:'S',css:'C'})[kind]||'?'}</div>`}
function renderAC(items,word){acList.innerHTML='';acCount.textContent=items.length+' saran';items.forEach((item,i)=>{const d=document.createElement('div');d.className='ac-item'+(i===acIdx?' selected':'');d.innerHTML=`${kindIcon(item.kind)}<span class="ac-label">${highlightMatch(item.label,word)}</span><span class="ac-detail">${item.detail}</span>`;d.addEventListener('mousedown',e=>{e.preventDefault();acIdx=i;acConfirm()});d.addEventListener('mousemove',()=>{acIdx=i;renderAC(acItems,acTriggerWord)});acList.appendChild(d)});const sel=items[acIdx];acDoc.innerHTML=sel?.doc||'';acDoc.style.display=sel?.doc?'block':'none'}
function acConfirm(){if(!acVisible()||acIdx<0||acIdx>=acItems.length)return;const item=acItems[acIdx],txt=codeInput.value,cursor=codeInput.selectionStart;let ws=cursor;while(ws>0&&/[\w\-:#.!<\/]/.test(txt[ws-1]))ws--;const resolved=item.insert.replace(/\$\{(\d+):([^}]*)\}/g,(_,n,d)=>d).replace(/\$\d+/g,'');const before=txt.slice(0,ws),after=txt.slice(cursor);codeInput.value=before+resolved+after;const np=ws+resolved.length;codeInput.selectionStart=codeInput.selectionEnd=np;hideAC();updateLineNumbers();codeInput.focus()}
function acNavigate(dir){if(!acVisible()||!acItems.length)return;acIdx=(acIdx+dir+acItems.length)%acItems.length;renderAC(acItems,acTriggerWord);acList.querySelector('.selected')?.scrollIntoView({block:'nearest'})}
function triggerAC(){const {word}=getWordBefore(codeInput);acTriggerWord=word;if(word.length<1){hideAC();return}const s=computeSuggestions(word);if(!s.length){hideAC();return}acItems=s;if(acIdx<0||acIdx>=s.length)acIdx=0;const p=getCaretCoords(codeInput);positionDropdown(p.x,p.y);acDropdown.classList.add('visible');renderAC(s,word)}
codeInput.addEventListener('keydown',e=>{if(acVisible()){if(e.key==='ArrowDown'){e.preventDefault();acNavigate(1);return}if(e.key==='ArrowUp'){e.preventDefault();acNavigate(-1);return}if(e.key==='Enter'){e.preventDefault();acConfirm();return}if(e.key==='Escape'){hideAC();return}if(e.key==='Tab'){e.preventDefault();acConfirm();return}}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='r'){e.preventDefault();runCode()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='e'){e.preventDefault();confirmReset()}if(e.key==='Tab'&&!acVisible()){e.preventDefault();const s=codeInput.selectionStart;codeInput.value=codeInput.value.slice(0,s)+'  '+codeInput.value.slice(codeInput.selectionEnd);codeInput.selectionStart=codeInput.selectionEnd=s+2;updateLineNumbers()}requestAnimationFrame(triggerAC)});
codeInput.addEventListener('click',()=>requestAnimationFrame(triggerAC));codeInput.addEventListener('blur',()=>setTimeout(hideAC,150));codeInput.addEventListener('focus',triggerAC);document.addEventListener('mousedown',e=>{if(!acDropdown.contains(e.target)&&e.target!==codeInput)hideAC()});

/* ---------- STAGE EDITOR ---------- */
function defaultEditor(){customEditor={objects:[{type:'solid',kind:'ground',x:0,y:408,w:180,h:72}],selected:null,tool:'solid',spawn:{x:34,y:350},goal:{x:620,y:120}}}
function setEditorTool(t){customEditor.tool=t;document.querySelectorAll('.palette button').forEach(b=>b.classList.remove('active'));const labels={solid:'Platform',spike:'Spike',lava:'Lava',diamond:'Hazard'};document.querySelectorAll('.palette button').forEach(b=>{if(b.textContent.toLowerCase().includes(labels[t].toLowerCase()))b.classList.add('active')})}
function editorCoords(e){const ar=$('editor-arena').getBoundingClientRect(),scale=ar.width/ARENA_W;return{x:Math.max(0,Math.min(ARENA_W-1,(e.clientX-ar.left)/scale)),y:Math.max(0,Math.min(ARENA_H-1,(e.clientY-ar.top)/scale))}}
function addEditorObject(x,y){const t=customEditor.tool;const base={type:t==='solid'?'solid':'hazard',kind:t==='solid'?'platform':t,x:Math.round(x),y:Math.round(y),w:t==='spike'||t==='diamond'?40:120,h:t==='spike'||t==='diamond'?40:20,angle:t==='diamond'?45:0,dir:'up'};customEditor.objects.push(base);customEditor.selected=customEditor.objects.length-1;renderEditor()}
function renderEditor(){const ar=$('editor-arena');if(!ar)return;ar.querySelectorAll('.editor-obj').forEach(e=>e.remove());customEditor.objects.forEach((o,i)=>{const d=document.createElement('div');const cls=o.kind==='spike'?'spike':o.kind==='diamond'?'diamond':o.kind==='lava'?'lava':'solid';d.className='editor-obj '+cls;d.style.left=o.x+'px';d.style.top=o.y+'px';d.style.width=o.w+'px';d.style.height=o.h+'px';d.style.transform=`rotate(${o.angle||0}deg)`;if(o.kind==='spike')d.style.clipPath='polygon(50% 0,100% 100%,0 100%)';d.dataset.index=i;d.classList.toggle('selected',i===customEditor.selected);d.addEventListener('pointerdown',e=>startEditorDrag(e,i));d.addEventListener('dblclick',()=>{customEditor.objects.splice(i,1);customEditor.selected=null;renderEditor()});ar.appendChild(d)});renderInspector();updateEditorMarkers()}
function updateEditorMarkers(){$('.editor-start-marker').style.left=customEditor.spawn.x+'px';$('.editor-start-marker').style.top=(customEditor.spawn.y+32)+'px';$('.editor-goal-marker').style.left=customEditor.goal.x+'px';$('.editor-goal-marker').style.top=customEditor.goal.y+'px';}
function startEditorDrag(e,i){e.stopPropagation();if(e.shiftKey)customEditor.selected=i;else customEditor.selected=i;const start=editorCoords(e),orig={...customEditor.objects[i]};const move=ev=>{const p=editorCoords(ev),dx=p.x-start.x,dy=p.y-start.y;const o=customEditor.objects[i];o.x=Math.round(Math.max(0,Math.min(ARENA_W-o.w,orig.x+dx)));o.y=Math.round(Math.max(0,Math.min(ARENA_H-o.h,orig.y+dy)));renderEditor()};const up=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up)};addEventListener('pointermove',move);addEventListener('pointerup',up);renderEditor()}
$('editor-arena').addEventListener('click',e=>{if(e.target!==$('editor-arena'))return;const p=editorCoords(e);addEditorObject(p.x,p.y)})
function renderInspector(){const box=$('editor-inspector'),i=customEditor.selected;if(i===null||!customEditor.objects[i]){box.className='inspector muted';box.innerHTML='Klik objek pada arena untuk memilihnya.';return}const o=customEditor.objects[i];box.className='inspector';box.innerHTML=`<div class="inspector-grid"><label>X<input id="ins-x" type="number" value="${o.x}"></label><label>Y<input id="ins-y" type="number" value="${o.y}"></label><label>Width<input id="ins-w" type="number" value="${o.w}"></label><label>Height<input id="ins-h" type="number" value="${o.h}"></label><label>Rotate<input id="ins-a" type="number" value="${o.angle||0}"></label><label>Direction<select id="ins-d"><option ${o.dir==='up'?'selected':''}>up</option><option ${o.dir==='down'?'selected':''}>down</option><option ${o.dir==='left'?'selected':''}>left</option><option ${o.dir==='right'?'selected':''}>right</option></select></label></div>`;[['x','ins-x'],['y','ins-y'],['w','ins-w'],['h','ins-h'],['angle','ins-a']].forEach(([k,id])=>$(id).addEventListener('input',e=>{o[k]=Number(e.target.value)||0;renderEditor()}));$('ins-d').addEventListener('change',e=>{o.dir=e.target.value;renderEditor()})}
function clearEditor(){if(!confirm('Bersihkan semua objek editor?'))return;defaultEditor();renderEditor()}
function editorStageObject(){return{id:'custom-'+Date.now(),title:$('editor-title').value.trim()||'My Custom Stage',custom:true,diff:$('editor-diff').value,description:$('editor-desc').value.trim(),hint:'Stage custom. Bangun jalur, jalankan kode, dan capai goal.',spawn:{...customEditor.spawn},goal:{...customEditor.goal},objects:structuredClone(customEditor.objects)}}
function saveCustomStage(){const s=editorStageObject();const existing=customStages.findIndex(x=>x.id===s.id);if(existing>=0)customStages[existing]=s;else customStages.push(s);saveCustomStages();buildCustomStageGrid();toast('Stage custom tersimpan di perangkat.');}
function exportEditorJSON(){const s=editorStageObject();delete s.custom;const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(s.title||'custom-stage').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.json';a.click();URL.revokeObjectURL(a.href)}
function importStageJSON(){$('json-file-input').click()}
$('json-file-input').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const s=JSON.parse(rd.result);if(!s.title||!Array.isArray(s.objects))throw new Error('Format stage tidak valid');customEditor={objects:structuredClone(s.objects),selected:null,tool:'solid',spawn:s.spawn||{x:34,y:350},goal:s.goal||{x:620,y:120}};$('editor-title').value=s.title;$('editor-diff').value=s.diff||'medium';$('editor-desc').value=s.description||'';renderEditor();toast('JSON berhasil di-import.')}catch(err){toast('Import gagal: '+err.message)}};rd.readAsText(f);e.target.value=''})
function playtestEditor(){loadCustomStage(editorStageObject())}

/* ---------- PARTICLES ---------- */
function spawnParticles(){const colors=['#5b9cf6','#a78bfa','#34d399','#fbbf24'];const cx=innerWidth/2,cy=innerHeight/2;for(let i=0;i<24;i++){const p=document.createElement('div');p.className='particle';const ang=Math.random()*Math.PI*2,dist=70+Math.random()*130,size=4+Math.random()*7;p.style.cssText=`left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${colors[i%colors.length]};--tx:${Math.cos(ang)*dist}px;--ty:${Math.sin(ang)*dist}px`;document.body.appendChild(p);setTimeout(()=>p.remove(),900)}}

/* ---------- INIT ---------- */
applyTheme();setInputMode(inputMode);updateLineNumbers();defaultEditor();renderEditor();showHome();loadAllStages();
