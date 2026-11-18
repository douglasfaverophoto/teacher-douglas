// Story audio player — the device's own voice, read sentence by sentence so it can pause and pick up
// where it stopped, and change speed on the fly. Used by Table Seven and assets/reader.js.
// StoryPlayer({mount, paras, text?, getVoice, lang, base, labels}) → {playPara(i), stop()}
//   mount: element the controls go in · paras: the story <p> elements (highlighted while read)
//   base: normal rate (.8 = slow, clear) · speeds are multiples of it: 1×, 0.75×, 0.5×
(function(){
const RKEY="teacherDouglas.speed", SPEEDS=[1,.75,.5];
const get=()=>{try{const v=+localStorage.getItem(RKEY);return SPEEDS.includes(v)?v:1}catch(e){return 1}};
const put=v=>{try{localStorage.setItem(RKEY,String(v))}catch(e){}};
const strip=h=>String(h).replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"');
// Split a paragraph into sentences (closing quotes stay with their sentence), then join short ones
// into chunks of ~80 characters so dialogue doesn't sound choppy. Pause/continue works per chunk.
const sentences=t=>{
  const s=(t.match(/[^.!?…]+(?:[.!?…]+["”»']?|$)\s*/g)||[t]).map(x=>x.trim()).filter(Boolean), out=[];
  s.forEach(x=>{if(out.length&&out[out.length-1].length<80)out[out.length-1]+=" "+x;else out.push(x)});
  return out;
};

window.StoryPlayer=function(o){
  const L=Object.assign({listen:"▶ Listen",pause:"❚❚ Pause",resume:"▶ Continue",restart:"⟲ Start over",speed:"Speed"},o.labels||{});
  const queue=[]; // {p: paragraph index, t: sentence}
  o.paras.forEach((p,pi)=>sentences(strip(p.innerHTML)).forEach(t=>queue.push({p:pi,t})));
  let idx=0, end=queue.length, state="idle", token=0, speed=get();

  const box=document.createElement("div"); box.className="player";
  box.innerHTML=`<button class="listen" type="button" data-a="play"></button>
    <button class="listen ghost" type="button" data-a="restart" disabled>${L.restart}</button>
    <span class="speeds" role="group" aria-label="${L.speed}">${SPEEDS.map(s=>`<button type="button" class="spd" data-s="${s}">${s===1?"1×":String(s).replace(/^0/,"")+"×"}</button>`).join("")}</span>`;
  o.mount.replaceWith(box);
  const play=box.querySelector('[data-a="play"]'), restart=box.querySelector('[data-a="restart"]');

  const mark=()=>{o.paras.forEach((p,pi)=>p.classList.toggle("speaking",state!=="idle"&&queue[idx]&&queue[idx].p===pi))};
  const paint=()=>{
    play.textContent=state==="playing"?L.pause:state==="paused"?L.resume:L.listen;
    play.setAttribute("aria-pressed",state==="playing");
    restart.disabled=state==="idle"&&idx===0;
    box.querySelectorAll(".spd").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.s===speed));
    mark();
  };
  const alive=()=>box.isConnected;
  function speakNow(){
    const my=++token;
    let busy=false; try{busy=speechSynthesis.speaking||speechSynthesis.pending;speechSynthesis.cancel()}catch(e){}
    if(idx>=end){state="idle";idx=0;end=queue.length;paint();return}
    const u=new SpeechSynthesisUtterance(queue[idx].t), v=o.getVoice&&o.getVoice();
    if(v)u.voice=v; else if(o.pitch)u.pitch=o.pitch;
    u.lang=v?v.lang:o.lang; u.rate=(o.base||.8)*speed;
    u.onend=()=>{if(my!==token||state!=="playing")return; if(!alive()){state="idle";return} idx++;speakNow()};
    u.onerror=ev=>{if(my!==token)return; if(ev&&(ev.error==="interrupted"||ev.error==="canceled"))return; state="idle";paint()};
    // Chrome drops a speak() that comes right after cancelling live speech, so wait a moment then.
    // Otherwise speak right away: iPhone only starts speech straight from a tap.
    const go=()=>{if(my===token&&state==="playing"&&alive())speechSynthesis.speak(u)};
    if(busy)setTimeout(go,80); else go();
    paint();
  }
  function pause(){token++;state="paused";try{speechSynthesis.cancel()}catch(e){}paint()}
  function stop(){token++;state="idle";idx=0;end=queue.length;try{speechSynthesis.cancel()}catch(e){}paint()}

  play.onclick=()=>{try{
    if(state==="playing")return pause();
    if(o.onStart)o.onStart();
    state="playing";speakNow()}catch(e){stop()}};
  restart.onclick=()=>{try{if(o.onStart)o.onStart();idx=0;end=queue.length;state="playing";speakNow()}catch(e){stop()}};
  box.querySelectorAll(".spd").forEach(b=>b.onclick=()=>{speed=+b.dataset.s;put(speed);
    if(state==="playing")speakNow(); else paint()}); // playing: start the current sentence again at the new speed
  paint();
  return {
    // Read just one paragraph (tap to hear), then stop.
    playPara(pi){try{if(o.onStart)o.onStart();const a=queue.findIndex(q=>q.p===pi);if(a<0)return;
      idx=a;end=a;while(end<queue.length&&queue[end].p===pi)end++;state="playing";speakNow()}catch(e){stop()}},
    stop
  };
};
})();
