// Dialogues — put the lines of a restaurant dialogue in the right order.
// A page sets window.DIALOGUES, then loads Sortable (cdnjs), player.js and this file.
// DIALOGUES = {id, short, lang, kicker, title, sub, back:{href,label}, voices:[…], ui:{…},
//   roles:{w:{name, es}, g:{name, es}}, items:[{t, scene, lines:[[role, text, translation?]]}]}
(function(){
const D=window.DIALOGUES, IT=D.items;
const UI=Object.assign({
  howto:"<b>Cómo funciona:</b> Las líneas están en desorden. Arrastra una línea a su lugar, o toca dos líneas para cambiarlas de lugar. Luego toca <b>Revisar</b>.",
  name:"What is your name? ¿Cómo te llamas?", namePh:"Name / Nombre", nameNote:"Teacher Douglas ve tu nombre y tu progreso.",
  hello:"Hello", change:"Cambiar nombre", all:"← All dialogues / Todos los diálogos", dialog:"Dialogue",
  open:"Start", done:"Done ✓", lines:n=>`${n} lines · ${n} líneas`,
  order:"Put the dialogue in order. / Pon el diálogo en orden.", orderTip:"Drag a line, or tap two lines to swap them. / Arrastra una línea, o toca dos para cambiarlas.",
  check:"Check / Revisar", again:n=>`${n} line${n===1?" is":"s are"} in the right place. Move the others. / ${n} en su lugar. Mueve las otras.`,
  right:"Perfect! / ¡Perfecto!", rightMsg:"Now listen and read it out loud with a partner. / Ahora escucha y léelo en voz alta con un compañero.",
  listen:"▶ Listen / Escuchar", pause:"❚❚ Pause / Pausa", resume:"▶ Continue / Seguir", restart:"⟲ From the start / Desde el inicio", speed:"Speed / Velocidad",
  showEs:"Ver en español", hideEs:"Ocultar español", next:"Next dialogue →", back:"All dialogues", shuffle:"Mix again / Mezclar otra vez",
  reset:"Empezar de nuevo", sure:"¿Seguro? Toca otra vez",
  prev:"← Previous / Anterior", nextNav:"Next / Siguiente →", allShort:"All / Todos"
}, D.ui||{});

const KEY=D.id+".v1", NKEY=D.id+".name";
const get=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let done=get(KEY,[]); if(!Array.isArray(done)) done=[];
// Use the name the student already typed in another activity on this site, if there is one.
function otherName(){
  try{for(let k=0;k<localStorage.length;k++){const key=localStorage.key(k);
    if(key===NKEY||!/\.name$/.test(key)) continue;
    const raw=localStorage.getItem(key); let v=raw; try{v=JSON.parse(raw)}catch(e){}
    if(typeof v==="string"&&v.trim()) return v.trim()}}catch(e){}
  return "";
}
const getName=()=>get(NKEY,"")||"", setName=n=>put(NKEY,n);
if(!getName()){const o=otherName(); if(o) setName(o);}
const REPORT_URL="https://script.google.com/macros/s/AKfycby54Hv7HCzhWeUiL0yhU11jlFpb28bkARw6l4-va9QJ_IUizPSmzuDrFBncyb8FsY9Qcg/exec";
function report(i,event){
  try{fetch(REPORT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify({name:getName()||"(sin nombre)",episode:i+1,title:D.short+" · "+IT[i].t,event,story:D.short})}).catch(()=>{})}catch(e){}
}
function restore(){
  const n=getName(); if(!n) return;
  try{fetch(REPORT_URL+"?story="+encodeURIComponent(D.short)+"&name="+encodeURIComponent(n)).then(r=>r.json()).then(d=>{
    if(!d||getName()!==n) return; let ch=false;
    (d.done||[]).forEach(x=>{const i=x-1;if(i>=0&&i<IT.length&&!done.includes(i)){done.push(i);ch=true}});
    if(ch){put(KEY,done);if(onHome)home()}}).catch(()=>{})}catch(e){}
}

const app=document.getElementById("app");
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const canSpeak="speechSynthesis" in window;
let voice=null;
function pickVoice(){try{const base=D.lang.slice(0,2);const vs=speechSynthesis.getVoices().filter(v=>v.lang.replace("_","-").startsWith(base));
  const male=v=>(D.voices||[]).some(n=>v.name.toLowerCase().includes(n));
  voice=vs.find(v=>v.lang.replace("_","-")===D.lang&&male(v))||vs.find(male)||vs.find(v=>v.lang.replace("_","-")===D.lang)||vs[0]||null}catch(e){}}
if(canSpeak){pickVoice();try{speechSynthesis.onvoiceschanged=pickVoice}catch(e){}}

let onHome=false;
function home(){
  onHome=true; try{speechSynthesis.cancel()}catch(e){}
  try{if(location.hash) history.replaceState(null,"",location.pathname+location.search)}catch(e){}
  const list=IT.map((d,i)=>`<li><button class="ticket" data-i="${i}" aria-label="${UI.dialog} ${i+1}: ${esc(d.t)}">
    <span class="num">${i+1}</span><span class="t">${d.t}<span class="s">${UI.lines(d.lines.length)}</span></span>
    ${done.includes(i)?`<span class="state done">${UI.done}</span>`:`<span class="state open">${UI.open}</span>`}</button></li>`).join("");
  app.innerHTML=`
  <header><span class="mono">${D.kicker}</span><h1>${D.title}</h1><p class="sub">${D.sub}</p></header>
  <p class="howto">${UI.howto}</p>
  ${getName()?`<p class="hello">${UI.hello}, <b>${esc(getName())}</b>! <button id="chname" class="link">${UI.change}</button></p>`:
  `<form class="namecard" id="nameform"><label for="studentname"><b>${UI.name}</b></label>
   <div class="row"><input id="studentname" autocomplete="name" placeholder="${UI.namePh}" required maxlength="40"><button class="primary" type="submit">OK</button></div>
   <small>${UI.nameNote}</small></form>`}
  <ul class="tickets">${list}</ul>
  <footer><a href="${D.back.href}">${D.back.label}</a><button id="reset">${UI.reset}</button></footer>`;
  app.querySelectorAll(".ticket[data-i]").forEach(b=>b.onclick=()=>show(+b.dataset.i));
  const nf=document.getElementById("nameform");
  if(nf) nf.onsubmit=ev=>{ev.preventDefault();const v=document.getElementById("studentname").value.trim();if(v){setName(v);home();restore()}};
  const cn=document.getElementById("chname"); if(cn) cn.onclick=()=>{setName("");home()};
  const r=document.getElementById("reset"); let armed=false;
  r.onclick=()=>{if(!armed){armed=true;r.textContent=UI.sure;return} done=[];put(KEY,done);home()};
  window.scrollTo(0,0);
}

// Shuffle so that no line stays in its place when possible (and never the same order as the answer).
function mix(n){
  const a=[...Array(n).keys()];
  for(let tries=0;tries<50;tries++){
    for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    if(a.every((v,i)=>v!==i)) return a;
  }
  return a.reverse();
}

function show(i){
  onHome=false; try{speechSynthesis.cancel()}catch(e){}
  try{history.replaceState(null,"","#"+(i+1))}catch(e){}
  const d=IT[i], R=D.roles, solved=done.includes(i);
  const bar=(k)=>{const [role,text,tr]=d.lines[k];
    return `<li class="bar ${role}" data-k="${k}"><span class="who">${R[role].name}<small>${R[role].es}</small></span>
      <span class="txt">${text}</span>${tr?`<span class="tr" hidden>${tr}</span>`:""}<span class="mark" aria-hidden="true"></span></li>`};
  const order=solved?d.lines.map((_,k)=>k):mix(d.lines.length);
  // Previous / next bar, so students can move between dialogues without going back to the list.
  // D.prevPage / D.nextPage = {href, t} link the first/last dialogue to the other level's page.
  const P=i>0?{t:IT[i-1].t,go:i-1}:D.prevPage, N=i+1<IT.length?{t:IT[i+1].t,go:i+1}:D.nextPage;
  const navBtn=(x,cls,label)=>x?(x.href?`<a class="dn ${cls}" href="${x.href}">${label}<small>${x.t}</small></a>`:
    `<button class="dn ${cls}" data-go="${x.go}">${label}<small>${x.t}</small></button>`):`<span class="dn ${cls} off"></span>`;
  const dnav=`<nav class="dnav" aria-label="Dialogues">${navBtn(P,"p",UI.prev)}<button class="dn all" data-home>${UI.allShort}</button>${navBtn(N,"n",UI.nextNav)}</nav>`;
  app.innerHTML=`
  <button class="back" id="back">${UI.all}</button>
  ${dnav}
  <article class="slip">
    <div class="sliphead"><span class="mono">${UI.dialog} ${i+1} · ${D.level}</span><span class="mono">${UI.lines(d.lines.length)}</span></div>
    <h2>${d.t}</h2>
    ${d.scene?`<p class="scene">${d.scene}</p>`:""}
    <p class="legend"><span class="chip w">${R.w.name} · ${R.w.es}</span><span class="chip g">${R.g.name} · ${R.g.es}</span></p>
    <p class="order" id="order">${UI.order}<small>${UI.orderTip}</small></p>
    <ol class="bars ${solved?"solved":""}" id="bars">${order.map(bar).join("")}</ol>
    <p class="fb" id="fb" aria-live="polite"></p>
    <div class="btns" id="btns">${solved?"":`<button class="primary" id="check">${UI.check}</button><button class="secondary" id="mix">${UI.shuffle}</button>`}</div>
    <div id="after"></div>
  </article>
  ${dnav}`;
  document.getElementById("back").onclick=home;
  app.querySelectorAll(".dnav [data-go]").forEach(b=>b.onclick=()=>show(+b.dataset.go));
  app.querySelectorAll(".dnav [data-home]").forEach(b=>b.onclick=home);
  const ol=document.getElementById("bars"), fb=document.getElementById("fb");
  let sortable=null;
  if(!solved&&window.Sortable){
    sortable=Sortable.create(ol,{animation:160,delay:120,delayOnTouchOnly:true,touchStartThreshold:4,ghostClass:"ghost",chosenClass:"chosen",
      onStart:()=>{unpick();ol.querySelectorAll(".bar").forEach(b=>b.classList.remove("ok","no"));fb.textContent=""}});
  }
  // Tap to swap: tap one line, then another, and they change places (easier than dragging on a small phone).
  let picked=null;
  const unpick=()=>{if(picked){picked.classList.remove("picked");picked=null}};
  if(!solved) ol.addEventListener("click",ev=>{
    const b=ev.target.closest(".bar"); if(!b||ol.classList.contains("solved")) return;
    ol.querySelectorAll(".bar").forEach(x=>x.classList.remove("ok","no")); fb.textContent="";
    if(!picked){picked=b;b.classList.add("picked");return}
    if(picked===b){unpick();return}
    const a=picked, aNext=a.nextSibling; // swap a and b
    if(aNext===b) ol.insertBefore(b,a);
    else{ol.insertBefore(a,b); ol.insertBefore(b,aNext)}
    unpick();
  });
  const finish=(fresh)=>{
    unpick();
    if(sortable){try{sortable.destroy()}catch(e){} sortable=null}
    ol.classList.add("solved"); ol.querySelectorAll(".bar").forEach(b=>{b.classList.remove("no");b.classList.add("ok")});
    document.getElementById("order").hidden=true;
    document.getElementById("btns").innerHTML="";
    fb.textContent=""; fb.className="fb";
    if(fresh&&!done.includes(i)){done.push(i);put(KEY,done);report(i,"Finished")}
    const next=i+1<IT.length||!!D.nextPage, hasTr=d.lines.some(l=>l[2]);
    document.getElementById("after").innerHTML=`<section class="unlock" aria-live="polite"><h3>${UI.right}</h3><p>${UI.rightMsg}</p>
      ${canSpeak?`<button class="listen" id="listen">${UI.listen}</button>`:""}
      ${hasTr?`<button class="toggle" id="es">${UI.showEs}</button>`:""}
      <div class="btns">${next?`<button class="primary" id="nx">${UI.next}</button>`:""}<button class="secondary" id="bk">${UI.back}</button></div></section>`;
    const L=document.getElementById("listen");
    if(L&&window.StoryPlayer) StoryPlayer({mount:L,paras:[...ol.querySelectorAll(".txt")],lang:D.lang,base:.8,getVoice:()=>{if(!voice)pickVoice();return voice},labels:UI});
    const es=document.getElementById("es");
    if(es) es.onclick=()=>{const on=es.textContent===UI.showEs;es.textContent=on?UI.hideEs:UI.showEs;ol.querySelectorAll(".tr").forEach(t=>t.hidden=!on)};
    const nx=document.getElementById("nx"); if(nx) nx.onclick=()=>{if(i+1<IT.length) show(i+1); else location.href=D.nextPage.href};
    document.getElementById("bk").onclick=home;
    if(fresh) document.getElementById("after").scrollIntoView({behavior:"smooth",block:"nearest"});
  };
  if(solved){finish(false);window.scrollTo(0,0);return}
  document.getElementById("check").onclick=()=>{
    const bars=[...ol.querySelectorAll(".bar")]; let good=0;
    bars.forEach((b,pos)=>{const ok=+b.dataset.k===pos||d.lines[+b.dataset.k][1]===d.lines[pos][1];b.classList.toggle("ok",ok);b.classList.toggle("no",!ok);if(ok)good++});
    if(good===bars.length) finish(true);
    else{fb.textContent=UI.again(good);fb.className="fb no"}
  };
  document.getElementById("mix").onclick=()=>show(i);
  window.scrollTo(0,0);
}
const h=/^#(\d+)$/.exec(location.hash||""), hi=h?+h[1]-1:-1;
if(hi>=0&&hi<IT.length) show(hi); else home();
restore();
})();
