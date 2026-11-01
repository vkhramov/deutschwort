const $=id=>document.getElementById(id);
const STATE_KEY='dw-state-v7';
const oldState=JSON.parse(localStorage.getItem(STATE_KEY)||localStorage.getItem('dw-state-v6')||localStorage.getItem('dw-state-v5')||localStorage.getItem('dw-state-v4')||localStorage.getItem('dw-state-v3')||'{"known":{},"stats":{"right":0,"wrong":0},"streak":0,"lastDay":""}');
const state=oldState;
state.known=state.known||{};state.alreadyKnown=state.alreadyKnown||{};state.stats=state.stats||{right:0,wrong:0};
let mode='ru-de',queue=[],pos=0,current=null,checked=false,deferredPrompt=null;
state.daily=state.daily||{date:new Date().toISOString().slice(0,10),count:0,target:20};
if(state.daily.date!==new Date().toISOString().slice(0,10))state.daily={date:new Date().toISOString().slice(0,10),count:0,target:state.daily.target||20};
const save=()=>{localStorage.setItem(STATE_KEY,JSON.stringify(state));renderStats()};
function renderStats(){
 const mastered=Object.keys(state.known).filter(k=>(state.known[k].reps||state.known[k].box||0)>=3).length;
 const excluded=Object.keys(state.alreadyKnown).filter(k=>state.alreadyKnown[k]).length;
 const due=Object.keys(state.known).filter(k=>!state.alreadyKnown[k]&&state.known[k].due<=Date.now()&&(state.known[k].reps||state.known[k].box)>0).length;
 $('learned').textContent=mastered+excluded;$('due').textContent=due;
 $('accuracy').textContent=(state.stats.right+state.stats.wrong)?Math.round(state.stats.right/(state.stats.right+state.stats.wrong)*100)+'%':'—';
 $('streak').textContent=state.streak||0;$('countLabel').textContent=`${mastered+excluded} / ${WORDS.length.toLocaleString()}`;
 $('progressBar').style.width=((mastered+excluded)/WORDS.length*100)+'%';
 $('progressHint').textContent=`${WORDS.length.toLocaleString()} entries · spaced repetition · ${excluded} marked “already know”`;
 $('dailyGoalLabel').textContent=`${state.daily.count} / ${state.daily.target} answers today`;
 $('dailyGoalBar').style.width=Math.min(100,state.daily.count/state.daily.target*100)+'%';
}
function typeLabel(t){return ({noun:'Noun · article + plural',verb:'Verb · infinitive + present tense',adjective:'Adjective',adverb:'Adverb',pronoun:'Pronoun',preposition:'Preposition · grammatical case',conjunction:'Conjunction',article:'Article',number:'Number'})[t]||t}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function illustration(w,cls='wordicon'){return w.illustration?`<div class="${cls}"><img loading="lazy" src="assets/illus/${esc(w.illustration)}.webp" alt="Illustration for ${esc(w.de)}"></div>`:''}
function renderLibrary(q=''){
 let list=WORDS.filter(w=>(w.de+' '+w.ru+' '+w.en).toLowerCase().includes(q.toLowerCase())).slice(0,100);
 $('libraryCount').textContent=WORDS.length.toLocaleString()+' entries';
 $('library').innerHTML=list.map(w=>{
  let detail=w.type==='noun'?(w.plural?'Plural: '+w.plural:'Noun'):w.type==='verb'?'Verb · infinitive'+(w.conjugation?.length?' · ich '+w.conjugation[0].form+', du '+w.conjugation[1].form:''):w.type==='preposition'?(w.caseLabel||w.case||'Preposition'):typeLabel(w.type);
  const excluded=!!state.alreadyKnown[w.id];
  return `<div class="wordrow">${illustration(w)}<div class="wordmain"><b>${esc(w.de)} ${excluded?'<span class="known-tag">Already know</span>':''}</b><small>${esc(w.ru)} · ${esc(w.en)}${detail?' · '+esc(detail):''}</small><a class="wordsource" href="${esc(w.sourceUrl)}" target="_blank" rel="noreferrer">DWDS reference ↗</a></div><span class="wordrank">#${w.rank}</span></div>`;
 }).join('')||'<p class="bodycopy">No matches.</p>';
}
function wordExtra(w,reveal=false){
 const translatingIntoGerman=mode==='ru-de'||mode==='en-de';
 // Never expose German answer forms or German grammar examples before a translation-into-German answer.
 if(w.type==='verb'&&Array.isArray(w.conjugation)){if(translatingIntoGerman&&!reveal)return '';return `<div class="grammar-box"><div class="grammar-title">Present tense · Präsens</div><div class="conjugation-grid">${w.conjugation.map(x=>`<div class="conjugation-cell"><span>${esc(x.pronoun)}</span><b>${esc(x.form)}</b></div>`).join('')}</div><p class="grammar-note">The infinitive is the main vocabulary form. The table shows the six present-tense forms.</p></div>`;}
 if(w.type==='preposition'&&w.case){const example=(!translatingIntoGerman||reveal)&&w.caseExample?`<p class="grammar-example">${esc(w.caseExample)}</p>`:'';return `<div class="grammar-box"><div class="grammar-title">${esc(w.caseLabel||w.case)}</div><p class="grammar-note">${esc(w.caseNote||'')}</p>${example}</div>`;}
 return '';
}
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;});
function buildSession(){
 const n=Number($('sessionSize').value),requestedStart=Number($('startAt').value);
 if(!Number.isFinite(state.nextFreshIndex))state.nextFreshIndex=requestedStart;
 else if(requestedStart>state.nextFreshIndex)state.nextFreshIndex=requestedStart;
 const now=Date.now();
 const due=WORDS.filter(w=>{const r=state.known[w.id];return !state.alreadyKnown[w.id]&&r&&(r.reps||r.box)>0&&r.due<=now;}).sort((a,b)=>(state.known[a.id].due||0)-(state.known[b.id].due||0));
 // Reserve roughly 40% of a session for due reviews; use the rest to introduce unseen words.
 const dueLimit=Math.min(due.length,Math.max(1,Math.floor(n*.4)));
 const reviewPart=due.slice(0,dueLimit);
 const fresh=[];let i=state.nextFreshIndex;
 while(i<WORDS.length&&fresh.length<n-reviewPart.length){const w=WORDS[i++];if(!state.known[w.id]&&!state.alreadyKnown[w.id])fresh.push(w);}
 state.nextFreshIndex=i;
 let result=[...reviewPart,...fresh];
 // If the new-word queue is exhausted, use additional due reviews to fill the session.
 if(result.length<n){const used=new Set(result.map(w=>w.id));for(const w of due){if(result.length>=n)break;if(!used.has(w.id)){result.push(w);used.add(w.id);}}}
 // If the user has completed all new and due cards, offer a mixed refresher rather than an empty session.
 if(!result.length){result=WORDS.filter(w=>!state.alreadyKnown[w.id]).sort((a,b)=>(state.known[a.id]?.due||0)-(state.known[b.id]?.due||0)).slice(0,n);}
 return result;
}
$('startBtn').onclick=()=>{queue=buildSession();pos=0;save();$('study').classList.remove('hidden');$('study').scrollIntoView({behavior:'smooth'});showCard();};
function showCard(){
 if(pos>=queue.length){$('prompt').textContent='Session complete!';$('visual').innerHTML='';$('wordExtra').innerHTML='';$('exampleBox').innerHTML='';$('exampleBox').classList.add('hidden');$('hint').textContent='Great work. Your progress has been saved.';$('answer').classList.add('hidden');$('checkBtn').classList.add('hidden');$('knowBtn').classList.add('hidden');$('nextBtn').classList.add('hidden');$('feedback').textContent=`You reviewed ${queue.length} entries. Start another session to review due words and continue with new vocabulary.`;$('sessionBar').style.width='100%';return;}
 current=queue[pos];checked=false;$('answer').classList.remove('hidden');$('answer').value='';$('feedback').textContent='';$('feedback').className='feedback';$('checkBtn').classList.remove('hidden');$('knowBtn').classList.remove('hidden');$('nextBtn').classList.add('hidden');$('sessionCount').textContent=`${pos+1} / ${queue.length}`;$('sessionBar').style.width=(pos/queue.length*100)+'%';
 const prompts={'ru-de':current.ru,'en-de':current.en,'de-ru':current.de,'de-en':current.de};$('prompt').textContent=prompts[mode];
 $('visual').innerHTML=current.illustration?`<img src="assets/illus/${esc(current.illustration)}.webp" alt="Illustration for ${esc(current.de)}">`:'';$('visual').classList.toggle('no-visual',!current.illustration);
 let extra=typeLabel(current.type);if(current.type==='noun'&&current.plural)extra+=' · plural: '+current.plural;if(current.type==='preposition'&&current.caseLabel)extra+=' · '+current.caseLabel;
 const translatingIntoGerman=mode==='ru-de'||mode==='en-de';
 $('hint').textContent=translatingIntoGerman?extra:'Translate the German word or expression';
 renderExample(false);
 $('wordExtra').innerHTML=wordExtra(current);$('modeLabel').textContent=({'ru-de':'RUSSIAN → GERMAN','en-de':'ENGLISH → GERMAN','de-ru':'GERMAN → RUSSIAN','de-en':'GERMAN → ENGLISH'})[mode];
 $('answer').placeholder=translatingIntoGerman&&current.type==='noun'?'Type article + noun (e.g. der Tisch)…':translatingIntoGerman&&current.type==='verb'?'Type the infinitive (e.g. gehen)…':'Type your answer…';$('answer').focus();
}
function norm(s){return String(s||'').toLowerCase().trim().replace(/[.,!?;:]/g,'').replace(/\s+/g,' ')}
function acceptable(input,expected){return String(expected||'').split(';').some(x=>norm(x)===norm(input))}
function renderExample(revealed){
 const box=$('exampleBox');
 const intoGerman=mode==='ru-de'||mode==='en-de';
 const language=mode==='ru-de'||mode==='de-ru'?'Russian':'English';
 const translated=language==='Russian'?current.exampleRu:current.exampleEn;
 const lines=[];
 if(intoGerman){
  if(translated)lines.push(`<div class="example-line"><span>${language} example</span><p>${esc(translated)}</p></div>`);
  else lines.push(`<div class="example-line"><span>${language} example</span><p class="example-missing">Example translation unavailable</p></div>`);
  if(revealed&&current.example)lines.push(`<div class="example-line example-revealed"><span>German · revealed</span><p>${esc(current.example)}</p></div>`);
 }else{
  if(current.example)lines.push(`<div class="example-line"><span>German example</span><p>${esc(current.example)}</p></div>`);
  if(revealed&&translated)lines.push(`<div class="example-line example-revealed"><span>${language} translation</span><p>${esc(translated)}</p></div>`);
 }
 box.innerHTML=lines.join('');box.classList.toggle('hidden',!lines.length);
}
function revealExample(){
 renderExample(true);
 if(mode==='ru-de'||mode==='en-de')$('wordExtra').innerHTML=wordExtra(current,true);
}
$('checkBtn').onclick=()=>{
 if(checked)return;const ans=$('answer').value;const expected=mode==='ru-de'||mode==='en-de'?current.de:mode==='de-ru'?current.ru:current.en;const ok=acceptable(ans,expected);checked=true;state.daily.count++;
 let rec=state.known[current.id]||{box:0,due:0,reps:0,interval:0,ease:2.5};rec.reps=rec.reps||0;rec.ease=rec.ease||2.5;rec.interval=rec.interval||0;
 if(ok){state.stats.right++;rec.reps++;rec.ease=Math.min(2.8,rec.ease+.05);rec.interval=rec.reps===1?1:rec.reps===2?3:Math.max(rec.interval+1,Math.round(rec.interval*rec.ease));rec.box=Math.min(5,rec.reps);rec.due=Date.now()+rec.interval*86400000;$('feedback').className='feedback good';const paired=mode==='ru-de'?current.ru:mode==='en-de'?current.en:mode==='de-ru'?current.ru:current.en;$('feedback').textContent='✓ Correct! '+current.de+' — '+paired+(current.plural?' · plural: '+current.plural:'');}
 else{state.stats.wrong++;rec.reps=0;rec.interval=0;rec.ease=Math.max(1.3,rec.ease-.2);rec.box=0;rec.due=Date.now()+10*60000;$('feedback').className='feedback bad';const correction=mode==='ru-de'||mode==='en-de'?current.de:expected;$('feedback').textContent='Not quite. Correct answer: '+correction+(current.plural?' · plural: '+current.plural:'');}
 state.known[current.id]=rec;save();revealExample();$('checkBtn').classList.add('hidden');$('knowBtn').classList.add('hidden');$('nextBtn').classList.remove('hidden');$('nextBtn').focus();
};
$('answer').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(checked)$('nextBtn').click();else $('checkBtn').click();}});
$('nextBtn').onclick=()=>{pos++;showCard();};
$('knowBtn').onclick=()=>{if(!current)return;state.alreadyKnown[current.id]=true;delete state.known[current.id];save();$('feedback').className='feedback good';$('feedback').textContent='✓ Marked as already known — this word is excluded from future learning sessions.';$('answer').classList.add('hidden');$('checkBtn').classList.add('hidden');$('knowBtn').classList.add('hidden');$('nextBtn').classList.remove('hidden');$('nextBtn').focus();};
$('exitBtn').onclick=()=>{$('study').classList.add('hidden')};$('search').oninput=e=>renderLibrary(e.target.value);
$('dailyGoalSelect').value=String(state.daily.target);$('dailyGoalSelect').onchange=e=>{state.daily.target=Number(e.target.value);save()};
let today=new Date().toISOString().slice(0,10);if(state.lastDay!==today){if(state.lastDay){let d=(new Date(today)-new Date(state.lastDay))/86400000;state.streak=d===1?(state.streak||0)+1:1}else state.streak=1;state.lastDay=today;save();}
renderStats();renderLibrary();if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').classList.remove('hidden')});$('installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').classList.add('hidden')};
