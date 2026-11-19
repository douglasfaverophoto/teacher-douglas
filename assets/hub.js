// Class pages: show each student's own progress on the activity cards (from this browser's storage).
(function(){
  document.querySelectorAll("[data-progress]").forEach(card=>{
    let n=0; try{const v=JSON.parse(localStorage.getItem(card.dataset.progress));if(Array.isArray(v))n=v.length}catch(e){}
    const total=+card.dataset.total, tag=card.querySelector(".tag");
    if(!tag||!n) return;
    tag.textContent=n>=total?"Done ✓":`${n} / ${total}`;
    tag.classList.add(n>=total?"done":"going");
  });
})();
