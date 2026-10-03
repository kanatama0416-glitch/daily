const STORAGE_KEY = 'marumarushitahi.entries.v1';

const state = {
  entries: loadEntries(),
  currentView: 'today',
  calendarCursor: new Date(),
  selectedCalendarDate: null,
  photoDataUrl: ''
};

const $ = (id) => document.getElementById(id);
const els = {
  views: [...document.querySelectorAll('.view')],
  navItems: [...document.querySelectorAll('.nav-item')],
  todayDate: $('todayDate'),
  todayDateShort: $('todayDateShort'),
  heroEntryCount: $('heroEntryCount'),
  todayEntries: $('todayEntries'),
  sameDayEntries: $('sameDayEntries'),
  quickAddBtn: $('quickAddBtn'),
  photoInput: $('photoInput'),
  photoPreview: $('photoPreview'),
  photoPlaceholder: $('photoPlaceholder'),
  captionInput: $('captionInput'),
  captionCount: $('captionCount'),
  dateInput: $('dateInput'),
  entryForm: $('entryForm'),
  formMessage: $('formMessage'),
  calendarTitle: $('calendarTitle'),
  calendarGrid: $('calendarGrid'),
  calendarDayEntries: $('calendarDayEntries'),
  prevMonthBtn: $('prevMonthBtn'),
  nextMonthBtn: $('nextMonthBtn'),
  archiveGrid: $('archiveGrid'),
  entryCount: $('entryCount'),
  dialog: $('entryDialog'),
  dialogContent: $('dialogContent'),
  dialogCloseBtn: $('dialogCloseBtn'),
  footerYear: $('footerYear')
};

function loadEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function saveEntries() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries)); }
function formatDateInput(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function parseLocalDate(str) { const [y,m,d] = str.split('-').map(Number); return new Date(y,m-1,d); }
function formatJapaneseDate(str) {
  return new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(parseLocalDate(str));
}
function formatEditorialDate(str) {
  const d = parseLocalDate(str);
  return `${String(d.getDate()).padStart(2,'0')} ${d.toLocaleString('en-US',{month:'short'}).toUpperCase()} ${d.getFullYear()}`;
}
function sortEntries(entries) { return [...entries].sort((a,b)=>(b.date+b.createdAt).localeCompare(a.date+a.createdAt)); }
function escapeHtml(str) { return String(str).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

function switchView(target) {
  state.currentView = target;
  els.views.forEach(v=>v.classList.toggle('active',v.dataset.view===target));
  els.navItems.forEach(n=>n.classList.toggle('active',n.dataset.target===target));
  if(target==='today') renderToday();
  if(target==='calendar') renderCalendar();
  if(target==='archive') renderArchive();
  if(target==='record'){ els.formMessage.textContent=''; }
  window.scrollTo({top:0,behavior:'smooth'});
}

function dayCardHtml(entry, index=0) {
  return `<article class="day-card">
    <button class="day-open" data-entry-id="${entry.id}">
      <div class="day-image"><img src="${entry.photo}" alt="${escapeHtml(entry.caption)}"></div>
      <div class="day-copy">
        <span class="day-index">DAY ${String(index+1).padStart(2,'0')} / ${formatEditorialDate(entry.date)}</span>
        <h3>${escapeHtml(entry.caption)}</h3>
        <footer><span>${formatJapaneseDate(entry.date)}</span><i class="line"></i><span>PERSONAL ARCHIVE</span></footer>
      </div>
    </button>
  </article>`;
}

function memoryCardHtml(entry, prefix='') {
  return `<article class="memory-card" data-entry-id="${entry.id}">
    <div class="memory-image"><img src="${entry.photo}" alt="${escapeHtml(entry.caption)}"></div>
    <div class="memory-meta"><strong>${escapeHtml(entry.caption)}</strong><span>${prefix || formatEditorialDate(entry.date)}</span></div>
  </article>`;
}

function renderToday() {
  const now = new Date();
  const todayStr = formatDateInput(now);
  els.todayDate.textContent = formatJapaneseDate(todayStr);
  els.todayDateShort.textContent = formatEditorialDate(todayStr);
  els.heroEntryCount.textContent = state.entries.length ? String(state.entries.length).padStart(2,'0') : '—';

  const todayEntries = sortEntries(state.entries.filter(e=>e.date===todayStr));
  els.todayEntries.innerHTML = todayEntries.length
    ? todayEntries.map((e,i)=>dayCardHtml(e,i)).join('')
    : `<div class="empty-editorial">
        <div class="empty-type"><span class="ghost-no">00</span><h3>今日には、<br>まだ見出しがない。</h3></div>
        <div class="empty-action"><p>日記みたいに一日をまとめなくていい。<br>残したい瞬間がひとつあれば、それで十分。</p><span class="empty-hint">USE + TO ADD A DAY</span></div>
      </div>`;

  const same = sortEntries(state.entries.filter(e=>{
    const d=parseLocalDate(e.date);
    return d.getMonth()===now.getMonth() && d.getDate()===now.getDate() && d.getFullYear()!==now.getFullYear();
  }));
  els.sameDayEntries.innerHTML = same.length
    ? same.map(e=>memoryCardHtml(e,`${now.getFullYear()-parseLocalDate(e.date).getFullYear()} YEARS AGO`)).join('')
    : `<div class="memory-empty"><strong>まだ、前のこの日はない。</strong><p>今年の一枚が、来年ここに現れる。<br>そのとき初めて、普通の日が記念日になる。</p></div>`;
}

function renderArchive() {
  const entries=sortEntries(state.entries);
  els.entryCount.textContent=entries.length ? `${entries.length} DAYS` : 'NO DAYS';
  els.archiveGrid.innerHTML=entries.length
    ? entries.map(e=>`<article class="archive-item" data-entry-id="${e.id}"><div class="archive-image"><img src="${e.photo}" alt="${escapeHtml(e.caption)}"></div><div class="archive-copy"><strong>${escapeHtml(e.caption)}</strong><span>${formatEditorialDate(e.date)}</span></div></article>`).join('')
    : `<div class="archive-empty"><button data-go-record>最初の一日を置く ↗</button></div>`;
}

function renderCalendar() {
  const y=state.calendarCursor.getFullYear();
  const m=state.calendarCursor.getMonth();
  els.calendarTitle.textContent=`${String(m+1).padStart(2,'0')} / ${y}`;
  const first=new Date(y,m,1);
  const start=new Date(y,m,1-first.getDay());
  const todayStr=formatDateInput(new Date());
  let html='';
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const dateStr=formatDateInput(d);
    const hasEntry=state.entries.some(e=>e.date===dateStr);
    const classes=['calendar-cell'];
    if(d.getMonth()!==m) classes.push('muted');
    if(dateStr===todayStr) classes.push('today');
    if(hasEntry) classes.push('has-entry');
    if(state.selectedCalendarDate===dateStr) classes.push('selected');
    html+=`<button class="${classes.join(' ')}" data-date="${dateStr}"><span class="calendar-day">${String(d.getDate()).padStart(2,'0')}</span></button>`;
  }
  els.calendarGrid.innerHTML=html;
  renderSelectedCalendarDate();
}

function renderSelectedCalendarDate(){
  if(!state.selectedCalendarDate){els.calendarDayEntries.innerHTML='';return;}
  const entries=sortEntries(state.entries.filter(e=>e.date===state.selectedCalendarDate));
  els.calendarDayEntries.innerHTML=`<section class="section-wrap"><div class="section-intro"><div><span class="section-number">SELECTED</span><p class="section-label">${formatJapaneseDate(state.selectedCalendarDate)}</p></div></div><div class="editorial-stack">${entries.length?entries.map((e,i)=>dayCardHtml(e,i)).join(''):'<div class="memory-empty"><strong>この日は、まだ空白。</strong><p>記録を残すと、ここに現れます。</p></div>'}</div></section>`;
}

function openEntry(id){
  const entry=state.entries.find(e=>e.id===id); if(!entry)return;
  els.dialogContent.innerHTML=`<div class="dialog-layout"><img class="dialog-photo" src="${entry.photo}" alt="${escapeHtml(entry.caption)}"><div class="dialog-body"><span class="dialog-number">ARCHIVE / ${formatEditorialDate(entry.date)}</span><h3>${escapeHtml(entry.caption)}</h3><div><p>${formatJapaneseDate(entry.date)}</p><button class="delete-button" data-delete-id="${entry.id}">DELETE THIS DAY</button></div></div></div>`;
  els.dialog.showModal();
}
function deleteEntry(id){state.entries=state.entries.filter(e=>e.id!==id);saveEntries();els.dialog.close();renderToday();renderArchive();renderCalendar();}
function resetForm(){state.photoDataUrl='';els.photoInput.value='';els.photoPreview.src='';els.photoPreview.hidden=true;els.photoPlaceholder.hidden=false;els.captionInput.value='';els.captionCount.textContent='0';els.dateInput.value=formatDateInput(new Date());}

async function compressImage(file,maxSide=1800,quality=.84){
  const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=raw});
  const scale=Math.min(1,maxSide/Math.max(img.width,img.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',quality);
}

els.navItems.forEach(item=>item.addEventListener('click',()=>switchView(item.dataset.target)));
document.querySelectorAll('.brand').forEach(el=>el.addEventListener('click',()=>switchView('today')));
els.quickAddBtn.addEventListener('click',()=>switchView('record'));
document.addEventListener('click',e=>{
  const go=e.target.closest('[data-go-record]'); if(go) switchView('record');
  const entry=e.target.closest('[data-entry-id]'); if(entry) openEntry(entry.dataset.entryId);
  const date=e.target.closest('[data-date]'); if(date){state.selectedCalendarDate=date.dataset.date;renderCalendar();}
  const del=e.target.closest('[data-delete-id]'); if(del&&confirm('この「した日」を削除しますか？')) deleteEntry(del.dataset.deleteId);
});
els.dialogCloseBtn.addEventListener('click',()=>els.dialog.close());
els.dialog.addEventListener('click',e=>{if(e.target===els.dialog)els.dialog.close()});
els.photoInput.addEventListener('change',async()=>{
  const file=els.photoInput.files?.[0]; if(!file)return;
  if(!file.type.startsWith('image/')){els.formMessage.textContent='画像ファイルを選んでください。';return;}
  try{els.formMessage.textContent='写真を準備しています…';state.photoDataUrl=await compressImage(file);els.photoPreview.src=state.photoDataUrl;els.photoPreview.hidden=false;els.photoPlaceholder.hidden=true;els.formMessage.textContent='';}
  catch{els.formMessage.textContent='写真を読み込めませんでした。';}
});
els.captionInput.addEventListener('input',()=>els.captionCount.textContent=String(els.captionInput.value.length));
els.entryForm.addEventListener('submit',e=>{
  e.preventDefault();
  const caption=els.captionInput.value.trim(),date=els.dateInput.value;
  if(!state.photoDataUrl){els.formMessage.textContent='写真を1枚選んでください。';return;}
  if(!caption){els.formMessage.textContent='今日に短い名前をつけてください。';return;}
  if(!date){els.formMessage.textContent='日付を選んでください。';return;}
  const entry={id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,photo:state.photoDataUrl,caption,date,createdAt:new Date().toISOString()};
  state.entries.push(entry);
  try{saveEntries()}catch{state.entries=state.entries.filter(e=>e.id!==entry.id);els.formMessage.textContent='端末内の保存容量がいっぱいです。';return;}
  resetForm();switchView('today');
});
els.prevMonthBtn.addEventListener('click',()=>{state.calendarCursor=new Date(state.calendarCursor.getFullYear(),state.calendarCursor.getMonth()-1,1);state.selectedCalendarDate=null;renderCalendar()});
els.nextMonthBtn.addEventListener('click',()=>{state.calendarCursor=new Date(state.calendarCursor.getFullYear(),state.calendarCursor.getMonth()+1,1);state.selectedCalendarDate=null;renderCalendar()});

const orb=document.querySelector('.cursor-orb');
window.addEventListener('pointermove',e=>{if(orb){orb.style.left=e.clientX+'px';orb.style.top=e.clientY+'px';}});
document.querySelectorAll('.magnetic').forEach(el=>{
  el.addEventListener('pointermove',e=>{if(matchMedia('(pointer:fine)').matches){const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.05}px,${(e.clientY-r.top-r.height/2)*.05}px)`}});
  el.addEventListener('pointerleave',()=>el.style.transform='');
});

els.dateInput.value=formatDateInput(new Date());
els.footerYear.textContent=new Date().getFullYear();
renderToday();renderCalendar();renderArchive();