// Branching dialogues — the conversation goes where the answers take it.
// A page sets window.BRANCH, then loads this file (and branch.css after reader.css + dialogues.css).
// BRANCH = {id, short, lang, kicker, title, sub, back:{href,label}, voices:[…], roles:{w:{name,es},g:{name,es}},
//   starts:{w:{label,es,node}, g:{label,es,node}},        who speaks first → first node
//   nodes:{id: {w:s=>[en,es], next:s=>id|null}            a waiter line (next null = the end)
//             | {g:key, opts:[{v,en,es,next?}], next:s=>id}}, a guest choice; sets s[key]=v
//   ending:s=>id, endings:[ids…], endingNames:{id:[name, spanish note]}}   which ending this was, and all of them
// Two ways to play: "guest" — you choose the guest's answers and the waiter answers you;
// "waiter" — the guest answers on their own (at random) and you choose the waiter line that fits.
// The wrong waiter lines are the lines the waiter would say if the guest had answered differently.
(function(){
const B=window.BRANCH, R=B.roles;
const UI=Object.assign({
  howto:"<b>Cómo funciona:</b> Escoge quién empieza y qué papel quieres. Cada respuesta cambia la conversación. Juega varias veces con respuestas diferentes para encontrar todos los finales.",
  name:"What is your name? ¿Cómo te llamas?", namePh:"Name / Nombre", nameNote:"Teacher Douglas ve tu nombre y tu progreso.",
  hello:"Hello", change:"Cambiar nombre",
  who:"Who starts? · ¿Quién empieza?", role:"Who are you? · ¿Quién eres tú?",
  beGuest:"I'm the guest", beGuestEs:"Yo escojo lo que le gusta al cliente. El mesero me contesta.",
  beWaiter:"I'm the waiter", beWaiterEs:"El cliente contesta solo. Yo escojo la respuesta correcta del mesero.",
  go:"Start / Empezar", found:(n,t)=>`Endings found: ${n} of ${t} · Finales encontrados: ${n} de ${t}`,
  chooseG:"Your answer: · Tu respuesta:", chooseW:"What does the waiter say? · ¿Qué dice el mesero?",
  wrong:"Not that one. Read what the guest said again. / Esa no. Vuelve a leer lo que dijo el cliente.",
  showEs:"Ver en español", hideEs:"Ocultar español", sound:"🔊 Sound on", mute:"🔇 Sound off",
  endTitle:"Your order · Su orden", newEnd:"New ending! / ¡Final nuevo!", oldEnd:"You found this ending before. / Ya encontraste este final.",
  score:(r,t)=>`You chose the right waiter line ${r} of ${t} times. / Escogiste bien ${r} de ${t} veces.`,
  again:"Play again with other answers / Otra vez, con otras respuestas", swap:r=>r==="guest"?"Now be the waiter / Ahora sé el mesero":"Now be the guest / Ahora sé el cliente",
  menu:"← Start screen / Inicio", reset:"Empezar de nuevo", sure:"¿Seguro? Toca otra vez",
  listen:"▶ Listen / Escuchar", pause:"❚❚ Pause / Pausa", resume:"▶ Continue / Seguir", restart:"⟲ From the start / Desde el inicio", speed:"Speed / Velocidad",
  listenAll:"Listen to the whole conversation: / Escucha toda la conversación:"
}, B.ui||{});

const KEY=B.id+".v1", NKEY=B.id+".name", PKEY=B.id+".prefs";
const get=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let found=get(KEY,[]); if(!Array.isArray(found)) found=[];
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
function report(e,event){
  const n=B.endings.indexOf(e.id)+1;
  try{fetch(REPORT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify({name:getName()||"(sin nombre)",episode:n,title:B.short+" · "+e.name,event,story:B.short})}).catch(()=>{})}catch(e){}
}
function restore(){
  const n=getName(); if(!n) return;
  try{fetch(REPORT_URL+"?story="+encodeURIComponent(B.short)+"&name="+encodeURIComponent(n)).then(r=>r.json()).then(d=>{
    if(!d||getName()!==n) return; let ch=false;
    (d.done||[]).forEach(x=>{const id=B.endings[x-1];if(id&&!found.includes(id)){found.push(id);ch=true}});
    if(ch){put(KEY,found);if(onMenu)menu()}}).catch(()=>{})}catch(e){}
}

const app=document.getElementById("app");
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const canSpeak="speechSynthesis" in window;
let voice=null;
function pickVoice(){try{const base=B.lang.slice(0,2);const vs=speechSynthesis.getVoices().filter(v=>v.lang.replace("_","-").startsWith(base));
  const male=v=>(B.voices||[]).some(n=>v.name.toLowerCase().includes(n));
  voice=vs.find(v=>v.lang.replace("_","-")===B.lang&&male(v))||vs.find(male)||vs.find(v=>v.lang.replace("_","-")===B.lang)||vs[0]||null}catch(e){}}
if(canSpeak){pickVoice();try{speechSynthesis.onvoiceschanged=pickVoice}catch(e){}}
let prefs=Object.assign({who:"w",role:"guest",es:false,sound:true},get(PKEY,{}));
const savePrefs=()=>put(PKEY,prefs);
function say(t){if(!canSpeak||!prefs.sound)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);if(!voice)pickVoice();
  if(voice)u.voice=voice;u.lang=voice?voice.lang:B.lang;u.rate=.85;speechSynthesis.speak(u)}catch(e){}}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

let onMenu=false;
function menu(){
  onMenu=true; try{speechSynthesis.cancel()}catch(e){}
  const tot=B.endings.length;
  const radio=(name,val,label,es)=>`<label class="pick"><input type="radio" name="${name}" value="${val}"${prefs[name]===val?" checked":""}><span><b>${label}</b><small>${es}</small></span></label>`;
  app.innerHTML=`
  <header><span class="mono">${B.kicker}</span><h1>${B.title}</h1><p class="sub">${B.sub}</p></header>
  <p class="howto">${UI.howto}</p>
  ${getName()?`<p class="hello">${UI.hello}, <b>${esc(getName())}</b>! <button id="chname" class="link">${UI.change}</button></p>`:
  `<form class="namecard" id="nameform"><label for="studentname"><b>${UI.name}</b></label>
   <div class="row"><input id="studentname" autocomplete="name" placeholder="${UI.namePh}" required maxlength="40"><button class="primary" type="submit">OK</button></div>
   <small>${UI.nameNote}</small></form>`}
  <article class="slip setup">
    <fieldset><legend>${UI.who}</legend>${radio("who","w",B.starts.w.label,B.starts.w.es)}${radio("who","g",B.starts.g.label,B.starts.g.es)}</fieldset>
    <fieldset><legend>${UI.role}</legend>${radio("role","guest",UI.beGuest,UI.beGuestEs)}${radio("role","waiter",UI.beWaiter,UI.beWaiterEs)}</fieldset>
    <button class="primary" id="go">${UI.go}</button>
  </article>
  <section class="found"><p class="mono">${UI.found(found.length,tot)}</p>
    <ul class="ends">${B.endings.map(id=>{const e=B.endingNames[id];const f=found.includes(id);
      return `<li class="${f?"got":""}">${f?`✓ ${e[0]}`:"?"}</li>`}).join("")}</ul></section>
  <footer><a href="${B.back.href}">${B.back.label}</a><button id="reset">${UI.reset}</button></footer>`;
  app.querySelectorAll('input[type=radio]').forEach(r=>r.onchange=()=>{prefs[r.name]=r.value;savePrefs()});
  document.getElementById("go").onclick=()=>play();
  const nf=document.getElementById("nameform");
  if(nf) nf.onsubmit=ev=>{ev.preventDefault();const v=document.getElementById("studentname").value.trim();if(v){setName(v);menu();restore()}};
  const cn=document.getElementById("chname"); if(cn) cn.onclick=()=>{setName("");menu()};
  const r=document.getElementById("reset"); let armed=false;
  r.onclick=()=>{if(!armed){armed=true;r.textContent=UI.sure;return} found=[];put(KEY,found);menu()};
  window.scrollTo(0,0);
}

function play(){
  onMenu=false; try{speechSynthesis.cancel()}catch(e){}
  const s={}, role=prefs.role; let right=0, asked=0;
  app.innerHTML=`
  <button class="back" id="back">${UI.menu}</button>
  <article class="slip">
    <div class="sliphead"><span class="mono">${role==="guest"?UI.beGuest:UI.beWaiter} · ${B.level||""}</span>
      <span class="tools">${canSpeak?`<button class="link" id="snd">${prefs.sound?UI.sound:UI.mute}</button>`:""}<button class="link" id="es">${prefs.es?UI.hideEs:UI.showEs}</button></span></div>
    <h2>${B.scene||""}</h2>
    <ol class="chat ${prefs.es?"":"no-es"}" id="chat"></ol>
    <div id="choice"></div>
    <div id="after"></div>
  </article>`;
  const chat=document.getElementById("chat"), box=document.getElementById("choice");
  document.getElementById("back").onclick=menu;
  document.getElementById("es").onclick=ev=>{prefs.es=!prefs.es;savePrefs();ev.target.textContent=prefs.es?UI.hideEs:UI.showEs;chat.classList.toggle("no-es",!prefs.es);box.classList.toggle("no-es",!prefs.es)};
  box.classList.toggle("no-es",!prefs.es);
  const snd=document.getElementById("snd"); if(snd) snd.onclick=()=>{prefs.sound=!prefs.sound;savePrefs();snd.textContent=prefs.sound?UI.sound:UI.mute;if(!prefs.sound)try{speechSynthesis.cancel()}catch(e){}};

  function bubble(who,en,es,speak){
    const li=document.createElement("li"); li.className="msg "+who;
    li.innerHTML=`<span class="who">${R[who].name}<small>${R[who].es}</small></span><span class="txt">${en}</span><span class="tr">${es}</span>`;
    li.onclick=()=>{const p=prefs.sound;prefs.sound=true;say(li.querySelector(".txt").textContent);prefs.sound=p};
    chat.appendChild(li); if(speak) say(en);
    li.scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  // The waiter line for node id in state st, or null when that node is not a waiter line.
  const wline=(id,st)=>{const n=B.nodes[id];return n&&n.w?n.w(st):null};
  const nextOf=(n,o,st)=>o&&o.next?o.next:(typeof n.next==="function"?n.next(st):n.next);

  function step(id){
    box.innerHTML="";
    if(!id) return end();
    const n=B.nodes[id];
    if(n.w){
      const [en,es]=n.w(s);
      bubble("w",en,es,true);
      return setTimeout(()=>step(n.next?n.next(s):null),250);
    }
    // A guest choice.
    if(role==="guest"){
      box.innerHTML=`<p class="ask">${UI.chooseG}</p><div class="opts">${n.opts.map((o,i)=>
        `<button class="opt g" type="button" data-i="${i}">${o.en}<small>${o.es}</small></button>`).join("")}</div>`;
      box.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
        const o=n.opts[+b.dataset.i]; s[n.g]=o.v; box.innerHTML="";
        bubble("g",o.en,o.es,false);
        const nx=nextOf(n,o,s), w=wline(nx,s);
        if(w){const [en,es]=w;bubble("w",en,es,true);setTimeout(()=>step(B.nodes[nx].next?B.nodes[nx].next(s):null),250)}
        else step(nx);
      });
      return;
    }
    // Waiter mode: the guest answers at random; the student picks the waiter's reply.
    const o=n.opts[Math.floor(Math.random()*n.opts.length)];
    s[n.g]=o.v; bubble("g",o.en,o.es,true);
    const nx=nextOf(n,o,s), good=wline(nx,s);
    if(!good) return setTimeout(()=>step(nx),250);
    const alts=[];
    n.opts.forEach(x=>{if(x===o)return;const st=Object.assign({},s,{[n.g]:x.v});const w=wline(nextOf(n,x,st),st);
      if(w&&w[0]!==good[0]&&!alts.some(a=>a[0]===w[0]))alts.push(w)});
    if(!alts.length){bubble("w",good[0],good[1],true);return setTimeout(()=>step(B.nodes[nx].next?B.nodes[nx].next(s):null),250)}
    const choices=shuffle([good,...alts.slice(0,2)]); asked++; let miss=false;
    box.innerHTML=`<p class="ask">${UI.chooseW}</p><div class="opts">${choices.map((c,i)=>
      `<button class="opt w" type="button" data-i="${i}">${c[0]}<small>${c[1]}</small></button>`).join("")}</div><p class="fb" id="bfb" aria-live="polite"></p>`;
    box.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
      const c=choices[+b.dataset.i];
      if(c!==good){miss=true;b.classList.add("wrong");b.disabled=true;const f=document.getElementById("bfb");f.textContent=UI.wrong;f.className="fb no";return}
      if(!miss) right++;
      box.innerHTML=""; bubble("w",good[0],good[1],true);
      setTimeout(()=>step(B.nodes[nx].next?B.nodes[nx].next(s):null),250);
    });
  }

  function end(){
    const id=B.ending(s), e={id,name:B.endingNames[id][0],es:B.endingNames[id][1]}, fresh=!found.includes(id);
    if(fresh){found.push(e.id);put(KEY,found);report(e,"Finished")}
    const after=document.getElementById("after");
    after.innerHTML=`<section class="unlock" aria-live="polite"><span class="mono">${UI.endTitle}</span><h3>${e.name}</h3><p>${e.es}</p>
      <p><b>${fresh?UI.newEnd:UI.oldEnd}</b> ${UI.found(found.length,B.endings.length)}</p>
      ${role==="waiter"&&asked?`<p>${UI.score(right,asked)}</p>`:""}
      ${canSpeak&&window.StoryPlayer?`<p class="tip">${UI.listenAll}</p><button class="listen" id="all">${UI.listen}</button>`:""}
      <div class="btns"><button class="primary" id="again">${UI.again}</button><button class="secondary" id="swap">${UI.swap(role)}</button><button class="secondary" id="mn">${UI.menu}</button></div></section>`;
    const L=document.getElementById("all");
    if(L) StoryPlayer({mount:L,paras:[...chat.querySelectorAll(".txt")],lang:B.lang,base:.8,getVoice:()=>{if(!voice)pickVoice();return voice},labels:UI});
    document.getElementById("again").onclick=()=>play();
    document.getElementById("swap").onclick=()=>{prefs.role=role==="guest"?"waiter":"guest";savePrefs();play()};
    document.getElementById("mn").onclick=menu;
    after.scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  step(B.starts[prefs.who].node);
  window.scrollTo(0,0);
}
menu();
restore();
})();
