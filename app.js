const $=id=>document.getElementById(id);
const state=JSON.parse(localStorage.getItem('dw-state-v3')||'{"known":{},"stats":{"right":0,"wrong":0},"streak":0,"lastDay":""}');
let mode='ru-de',queue=[],pos=0,current=null,checked=false,deferredPrompt=null;
state.daily=state.daily||{date:new Date().toISOString().slice(0,10),count:0,target:20};
if(state.daily.date!==new Date().toISOString().slice(0,10))state.daily={date:new Date().toISOString().slice(0,10),count:0,target:state.daily.target||20};
const save=()=>{localStorage.setItem('dw-state-v3',JSON.stringify(state));renderStats()};
function renderStats(){
 let known=Object.keys(state.known).filter(k=>state.known[k].box>=4).length;
 $('learned').textContent=known;
 $('due').textContent=Object.keys(state.known).filter(k=>state.known[k].due<=Date.now()&&state.known[k].box>0).length;
 $('accuracy').textContent=(state.stats.right+state.stats.wrong)?Math.round(state.stats.right/(state.stats.right+state.stats.wrong)*100)+'%':'—';
 $('streak').textContent=state.streak||0;
 $('countLabel').textContent=`${known} / ${WORDS.length.toLocaleString()}`;
 $('progressBar').style.width=(known/WORDS.length*100)+'%';
 $('progressHint').textContent=`${WORDS.length.toLocaleString()} entries · frequency-ordered learning path`;
 $('dailyGoalLabel').textContent=`${state.daily.count} / ${state.daily.target} words today`;
 $('dailyGoalBar').style.width=Math.min(100,state.daily.count/state.daily.target*100)+'%';
}
function typeLabel(t){return ({noun:'Noun · article + plural',verb:'Verb · infinitive + present tense',adjective:'Adjective',adverb:'Adverb',pronoun:'Pronoun',preposition:'Preposition · grammatical case',conjunction:'Conjunction',article:'Article',number:'Number'})[t]||t}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function illustration(w,cls='wordicon'){
 return w.illustration?`<div class="${cls}"><img loading="lazy" src="assets/illus/${esc(w.illustration)}.webp" alt="Illustration for ${esc(w.de)}"></div>`:'';
}
function renderLibrary(q=''){
 let list=WORDS.filter(w=>(w.de+' '+w.ru+' '+w.en).toLowerCase().includes(q.toLowerCase())).slice(0,100);
 $('libraryCount').textContent=WORDS.length.toLocaleString()+' entries';
 $('library').innerHTML=list.map(w=>{
  let detail=w.type==='noun'?(w.plural?'Plural: '+w.plural:'Noun'):
   w.type==='verb'?'Verb · infinitive'+(w.conjugation?.length?' · ich '+w.conjugation[0].form+', du '+w.conjugation[1].form:''):
   w.type==='preposition'?(w.caseLabel||w.case||'Preposition'):typeLabel(w.type);
  return `<div class="wordrow">${illustration(w)}<div class="wordmain"><b>${esc(w.de)}</b><small>${esc(w.ru)} · ${esc(w.en)}${detail?' · '+esc(detail):''}</small><a class="wordsource" href="${esc(w.sourceUrl)}" target="_blank" rel="noreferrer">DWDS reference ↗</a></div><span class="wordrank">#${w.rank}</span></div>`;
 }).join('')||'<p class="bodycopy">No matches.</p>';
}
function wordExtra(w){
 if(w.type==='verb'&&Array.isArray(w.conjugation)){
  return `<div class="grammar-box"><div class="grammar-title">Present tense · Präsens</div><div class="conjugation-grid">${w.conjugation.map(x=>`<div class="conjugation-cell"><span>${esc(x.pronoun)}</span><b>${esc(x.form)}</b></div>`).join('')}</div><p class="grammar-note">The infinitive is the main vocabulary form. The table shows the six present-tense forms.</p></div>`;
 }
 if(w.type==='preposition'&&w.case){
  return `<div class="grammar-box"><div class="grammar-title">${esc(w.caseLabel||w.case)}</div><p class="grammar-note">${esc(w.caseNote||'')}</p><p class="grammar-example">${esc(w.caseExample||'')}</p></div>`;
 }
 return '';
}
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;
});
$('startBtn').onclick=()=>{
 const start=Number($('startAt').value),n=Number($('sessionSize').value),end=Math.min(WORDS.length,start+500);
 const due=WORDS.filter(w=>{const r=state.known[w.id];return r&&r.box>0&&r.due<=Date.now()});
 const fresh=WORDS.slice(start,end).filter(w=>!state.known[w.id]||state.known[w.id].box===0);
 const pool=[...due,...fresh.filter(w=>!due.some(d=>d.id===w.id))];
 queue=pool.slice(0,n);
 if(!queue.length)queue=WORDS.slice(start,Math.min(start+n,WORDS.length));
 pos=0;$('study').classList.remove('hidden');$('study').scrollIntoView({behavior:'smooth'});showCard();
};
function showCard(){
 if(pos>=queue.length){
  $('prompt').textContent='Session complete!';$('visual').innerHTML='';$('wordExtra').innerHTML='';$('hint').textContent='Great work. Your progress has been saved.';
  $('answer').classList.add('hidden');$('checkBtn').classList.add('hidden');$('nextBtn').classList.add('hidden');
  $('feedback').textContent=`You reviewed ${queue.length} entries.`;$('sessionBar').style.width='100%';return;
 }
 current=queue[pos];checked=false;$('answer').classList.remove('hidden');$('answer').value='';$('feedback').textContent='';$('feedback').className='feedback';
 $('checkBtn').classList.remove('hidden');$('nextBtn').classList.add('hidden');$('sessionCount').textContent=`${pos+1} / ${queue.length}`;
 $('sessionBar').style.width=(pos/queue.length*100)+'%';
 const prompts={'ru-de':current.ru,'en-de':current.en,'de-ru':current.de,'de-en':current.de};
 $('prompt').textContent=prompts[mode];
 $('visual').innerHTML=current.illustration?`<img src="assets/illus/${esc(current.illustration)}.webp" alt="Illustration for ${esc(current.de)}">`:'';
 $('visual').classList.toggle('no-visual',!current.illustration);
 let extra=typeLabel(current.type);
 if(current.type==='noun'&&current.plural)extra+=' · plural: '+current.plural;
 if(current.type==='preposition'&&current.caseLabel)extra+=' · '+current.caseLabel;
 if(current.example)extra+=' · '+current.example;
 $('hint').textContent=mode.endsWith('-de')?extra:'Translate the German word or expression'+(current.example?' · '+current.example:'');
 $('wordExtra').innerHTML=wordExtra(current);
 $('modeLabel').textContent=({'ru-de':'RUSSIAN → GERMAN','en-de':'ENGLISH → GERMAN','de-ru':'GERMAN → RUSSIAN','de-en':'GERMAN → ENGLISH'})[mode];
 $('answer').placeholder=mode.endsWith('-de')&&current.type==='noun'?'Type article + noun (e.g. der Tisch)…':mode.endsWith('-de')&&current.type==='verb'?'Type the infinitive (e.g. gehen)…':'Type your answer…';
 $('answer').focus();
}
function norm(s){return s.toLowerCase().trim().replace(/[.,!?;:]/g,'').replace(/\s+/g,' ')}
function acceptable(input,expected){return expected.split(';').some(x=>norm(x)===norm(input))}
$('checkBtn').onclick=()=>{
 if(checked)return;
 const ans=$('answer').value;
 const expected=mode==='ru-de'||mode==='en-de'?current.de:mode==='de-ru'?current.ru:current.en;
 const ok=acceptable(ans,expected);checked=true;
 state.daily.count++;
 let rec=state.known[current.id]||{box:0,due:0};
 if(ok){
  state.stats.right++;rec.box=Math.min(5,rec.box+1);rec.due=Date.now()+[0,1,3,7,14,30][rec.box]*86400000;
  $('feedback').className='feedback good';$('feedback').textContent='✓ Correct! '+current.de+' — '+current.ru+' / '+current.en+(current.plural?' · plural: '+current.plural:'');
 }else{
  state.stats.wrong++;rec.box=Math.max(0,rec.box-1);rec.due=Date.now()+60000;
  $('feedback').className='feedback bad';$('feedback').textContent='Not quite. Correct answer: '+expected+' · '+current.de+(current.plural?' · plural: '+current.plural:'');
 }
 state.known[current.id]=rec;save();$('checkBtn').classList.add('hidden');$('nextBtn').classList.remove('hidden');$('nextBtn').focus();
};
$('answer').addEventListener('keydown',e=>{if(e.key==='Enter'){if(checked)$('nextBtn').click();else $('checkBtn').click()}});
$('nextBtn').onclick=()=>{pos++;showCard()};
$('exitBtn').onclick=()=>{$('study').classList.add('hidden')};
$('search').oninput=e=>renderLibrary(e.target.value);
$('dailyGoalSelect').value=String(state.daily.target);
$('dailyGoalSelect').onchange=e=>{state.daily.target=Number(e.target.value);save()};
let today=new Date().toISOString().slice(0,10);
if(state.lastDay!==today){if(state.lastDay){let d=(new Date(today)-new Date(state.lastDay))/86400000;state.streak=d===1?(state.streak||0)+1:1}else state.streak=1;state.lastDay=today;save()}
renderStats();renderLibrary();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').classList.remove('hidden')});
$('installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').classList.add('hidden')};
