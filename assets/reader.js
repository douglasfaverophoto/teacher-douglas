// Story reader — the Table Seven app made reusable. A story page sets window.STORY, then loads this file.
// STORY = {id, short, lang, kicker, title, sub, back:{href,label}, ui:{…}, voices:[…], eps:[…], coming:[…]}
// Each episode: {t, s, time, story:[html], vocab:[[word, en, es?]], gram:{title, rows}, qs:[[q, opts, answer]],
//   bonus:[q, hint, opts, answer], practice:[[line, en]], note?}
(function(){
const S = window.STORY, EP = S.eps, COMING = S.coming || [];
const UI = Object.assign({
  howto:"<b>How it works:</b> Read the episode. Answer the 4 questions. When they are all correct, the next episode opens.",
  name:"What is your name?", namePh:"Name", nameNote:"Teacher Douglas can see your name and progress.", hello:"Hello", change:"Change name",
  all:"← All episodes", episode:"Episode", read:"Read", done:"Done ✓", locked:"Locked", soon:"Coming soon", soonTag:"Soon",
  listen:"▶ Listen", stop:"■ Stop", tap:"Tip: tap any paragraph to hear just that part.",
  novoice:"No voice for this language on this device. On iPhone: Settings → Accessibility → Spoken Content → Voices.",
  words:"Words", grammar:"Grammar", questions:"Questions", practice:"Practice dialogue", enHide:"Hide English", enShow:"Show English",
  bonus:"⭐ Bonus question", bonusNote:"Optional. You don't need it to open the next episode.", note:"Culture note",
  right:"Correct! ✓", tryAgain:"Try again. Read the text one more time.", bonusRight:"Great detective work! ⭐", bonusWrong:"Not quite. Try again.",
  open:n=>`Episode ${n} is open!`, finished:"You solved the case!", stopMsg:"Good work. Stop here for today and come back tomorrow.",
  endMsg:"More episodes are coming soon.", stopBtn:"Stop for today", goBtn:"Keep going →", reset:"Start over", sure:"Sure? Tap again"
}, S.ui||{});

const KEY=S.id+".v1", NKEY=S.id+".name", BKEY=S.id+".bonus";
const get=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let done=get(KEY,[]); if(!Array.isArray(done)) done=[];
let bonusDone=get(BKEY,[]); if(!Array.isArray(bonusDone)) bonusDone=[];
const getName=()=>get(NKEY,"")||"", setName=n=>put(NKEY,n);
// Same Google Sheet as Table Seven (Apps Script in tools/progress-apps-script.gs); the story name goes in the title column.
const REPORT_URL = "https://script.google.com/macros/s/AKfycby54Hv7HCzhWeUiL0yhU11jlFpb28bkARw6l4-va9QJ_IUizPSmzuDrFBncyb8FsY9Qcg/exec";
function report(i,event){
  try{fetch(REPORT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:JSON.stringify({name:getName()||"(no name)",episode:i+1,title:S.short+" · "+EP[i].t,event,story:S.short})}).catch(()=>{})}catch(e){}
}
const unlocked=i=>i===0||done.includes(i-1);
const app=document.getElementById("app");
const strip=h=>String(h).replace(/<[^>]+>/g,"");
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

// Audio: the phone's own voice for the story language, a male voice when there is one, read slowly.
const canSpeak="speechSynthesis" in window;
const base=S.lang.slice(0,2).toLowerCase();
let voice=null;
function pickVoice(){try{const vs=speechSynthesis.getVoices().filter(v=>v.lang.replace("_","-").toLowerCase().startsWith(base));
  const male=v=>(S.voices||[]).some(n=>v.name.toLowerCase().includes(n));
  voice=vs.find(v=>v.lang.replace("_","-")===S.lang&&male(v))||vs.find(male)||vs.find(v=>v.lang.replace("_","-")===S.lang)||vs[0]||null}catch(e){}}
if(canSpeak){pickVoice();try{speechSynthesis.onvoiceschanged=pickVoice}catch(e){}}
function say(text,onend){
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  if(!voice)pickVoice(); if(voice)u.voice=voice;
  u.lang=voice?voice.lang:S.lang; u.rate=.8;
  u.onend=onend; u.onerror=onend;
  speechSynthesis.speak(u);
}

function home(){
  try{speechSynthesis.cancel()}catch(e){}
  let list=EP.map((e,i)=>{
    const st=done.includes(i)?`<span class="state done">${UI.done}</span>`:unlocked(i)?`<span class="state open">${UI.read}</span>`:`<span class="state lock">${UI.locked}</span>`;
    return `<li><button class="ticket" data-i="${i}" ${unlocked(i)?"":"disabled"} aria-label="${UI.episode} ${i+1}: ${esc(e.t)}">
      <span class="num">${i+1}</span><span class="t">${e.t}<span class="s">${e.s}</span></span>${st}</button></li>`;
  }).join("");
  list+=COMING.map((c,k)=>`<li><button class="ticket" disabled><span class="num">${EP.length+k+1}</span><span class="t">${UI.soon}<span class="s">${c}</span></span><span class="state lock">${UI.soonTag}</span></button></li>`).join("");
  app.innerHTML=`
  <header><span class="mono">${S.kicker}</span><h1>${S.title}</h1><p class="sub">${S.sub}</p></header>
  <p class="howto">${UI.howto}</p>
  ${getName()?`<p class="hello">${UI.hello}, <b>${esc(getName())}</b>! <button id="chname" class="link">${UI.change}</button></p>`:
  `<form class="namecard" id="nameform"><label for="studentname"><b>${UI.name}</b></label>
   <div class="row"><input id="studentname" autocomplete="name" placeholder="${UI.namePh}" required maxlength="40"><button class="primary" type="submit">OK</button></div>
   <small>${UI.nameNote}</small></form>`}
  <ul class="tickets">${list}</ul>
  <footer><a href="${S.back.href}">${S.back.label}</a><button id="reset">${UI.reset}</button></footer>`;
  app.querySelectorAll(".ticket[data-i]").forEach(b=>b.onclick=()=>episode(+b.dataset.i));
  const nf=document.getElementById("nameform");
  if(nf) nf.onsubmit=ev=>{ev.preventDefault();const v=document.getElementById("studentname").value.trim();if(v){setName(v);home()}};
  const cn=document.getElementById("chname"); if(cn) cn.onclick=()=>{setName("");home()};
  const r=document.getElementById("reset"); let armed=false;
  r.onclick=()=>{if(!armed){armed=true;r.textContent=UI.sure;return} done=[];put(KEY,done);home()};
  window.scrollTo(0,0);
}

function episode(i){
  const e=EP[i], answered=new Set(), already=done.includes(i);
  const qs=e.qs.map((q,qi)=>`<div class="q" data-q="${qi}"><p>${qi+1}. ${q[0]}</p>
    <div class="opts">${q[1].map((o,oi)=>`<button class="opt" data-o="${oi}">${o}</button>`).join("")}</div>
    <p class="fb" aria-live="polite"></p></div>`).join("");
  const voc=e.vocab.map(v=>`<div><dt>${v[0]}</dt><dd>${v[1]}${v[2]?` <i>· ${v[2]}</i>`:""}</dd></div>`).join("");
  app.innerHTML=`
  <button class="back" id="back">${UI.all}</button>
  <article class="slip">
    <div class="sliphead"><span class="mono">${UI.episode} ${i+1} · ${e.s}</span><span class="mono">${e.time}</span></div>
    <h2>${e.t}</h2>
    ${canSpeak?`<button class="listen" id="listen">${UI.listen}</button><p class="tip">${UI.tap}</p><p class="novoice" id="novoice" hidden>${UI.novoice}</p>`:""}
    <div class="story">${e.story.map(p=>`<p>${p}</p>`).join("")}</div>
  </article>
  <section class="slip section"><h3>${UI.words}</h3><dl class="vocab">${voc}</dl></section>
  <section class="slip section gram"><h3>${UI.grammar}</h3><p class="gt">${e.gram.title}</p>${e.gram.rows.map(r=>`<p>${r}</p>`).join("")}</section>
  <section class="slip section"><h3>${UI.questions}</h3>${qs}</section>
  <div id="unlock"></div>
  <section class="slip section extra"><h3>${UI.practice}</h3>
    <div class="dialog" id="dialog">${e.practice.map((l,k)=>`<div class="line">${k%2?"B":"A"}: ${l[0]}${l[1]?`<small>${l[1]}</small>`:""}</div>`).join("")}</div>
    <button class="toggle" id="entoggle">${UI.enHide}</button></section>
  <section class="slip section extra" id="bonus"><h3>${UI.bonus}</h3>
    <div class="q"><p>${e.bonus[0]}${e.bonus[1]?`<small>${e.bonus[1]}</small>`:""}</p><div class="opts">${e.bonus[2].map((o,oi)=>`<button class="opt" data-o="${oi}">${o}</button>`).join("")}</div>
    <p class="fb" aria-live="polite">${UI.bonusNote}</p></div></section>
  ${e.note?`<section class="slip section extra"><h3>${UI.note}</h3><p class="note">${e.note}</p></section>`:""}`;
  document.getElementById("back").onclick=home;

  // Listen: whole episode, or tap one paragraph.
  const L=document.getElementById("listen"), paras=[...app.querySelectorAll(".story p")];
  let playing=false;
  const clear=()=>paras.forEach(p=>p.classList.remove("speaking"));
  const setBtn=p=>{playing=p;if(L)L.textContent=p?UI.stop:UI.listen;if(!p)clear()};
  const checkVoice=()=>{if(!voice){pickVoice();if(!voice){const n=document.getElementById("novoice");if(n)n.hidden=false}}};
  if(L){
    L.onclick=()=>{try{
      if(playing){speechSynthesis.cancel();setBtn(false);return}
      checkVoice(); say(e.story.map(strip).join(" "),()=>setBtn(false)); setBtn(true)}catch(err){setBtn(false)}};
    paras.forEach(p=>p.onclick=()=>{try{checkVoice();setBtn(false);p.classList.add("speaking");say(strip(p.innerHTML),()=>p.classList.remove("speaking"))}catch(err){}});
  }
  const dlg=document.getElementById("dialog"), tg=document.getElementById("entoggle");
  tg.onclick=()=>{const h=dlg.classList.toggle("hide-en");tg.textContent=h?UI.enShow:UI.enHide};

  const bq=document.querySelector("#bonus .q"), bfb=bq.querySelector(".fb"), bAns=e.bonus[3];
  bq.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
    if(+b.dataset.o===bAns){bq.querySelectorAll(".opt").forEach(x=>{x.disabled=true;if(+x.dataset.o===bAns)x.classList.add("right")});
      bfb.textContent=UI.bonusRight;bfb.className="fb ok";
      if(!bonusDone.includes(i)){bonusDone.push(i);put(BKEY,bonusDone);report(i,"Bonus correct")}}
    else{b.classList.add("wrong");b.disabled=true;bfb.textContent=UI.bonusWrong;bfb.className="fb no"}
  });
  app.querySelectorAll(".q:not(#bonus .q)").forEach(qel=>{
    const qi=+qel.dataset.q, fb=qel.querySelector(".fb");
    const mark=()=>{qel.querySelectorAll(".opt").forEach(b=>{b.disabled=true;if(+b.dataset.o===e.qs[qi][2])b.classList.add("right")});fb.textContent=UI.right;fb.className="fb ok";answered.add(qi)};
    if(already) mark();
    qel.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
      if(+b.dataset.o===e.qs[qi][2]){mark();check()}
      else{b.classList.add("wrong");b.disabled=true;fb.textContent=UI.tryAgain;fb.className="fb no"}
    });
  });
  function check(){
    if(answered.size<e.qs.length) return;
    if(!done.includes(i)){done.push(i);put(KEY,done);report(i,"Finished")}
    const box=document.getElementById("unlock"), next=i+1<EP.length;
    box.innerHTML=`<section class="unlock" aria-live="polite"><h3>${next?UI.open(i+2):UI.finished}</h3>
      <p>${next?UI.stopMsg:UI.endMsg}</p>
      <div class="btns"><button class="primary" id="stop">${UI.stopBtn}</button>${next?`<button class="secondary" id="go">${UI.goBtn}</button>`:""}</div></section>`;
    document.getElementById("stop").onclick=home;
    const g=document.getElementById("go"); if(g) g.onclick=()=>episode(i+1);
    if(!already) box.scrollIntoView({behavior:"smooth",block:"center"});
  }
  if(already) check();
  window.scrollTo(0,0);
}
home();
})();
