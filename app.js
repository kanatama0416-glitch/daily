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
  dialogCloseBtn: $('dialogCloseBtn')
};

function loadEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function formatDateInput(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatJapaneseDate(str, withYear = true) {
  const d = parseLocalDate(str);
  return new Intl.DateTimeFormat('ja-JP', {
    ...(withYear ? { year: 'numeric' } : {}),
    month: 'long', day: 'numeric', weekday: 'short'
  }).format(d);
}

function sortEntries(entries) {
  return [...entries].sort((a,b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}

function switchView(target) {
  state.currentView = target;
  els.views.forEach(v => v.classList.toggle('active', v.dataset.view === target));
  els.navItems.forEach(n => n.classList.toggle('active', n.dataset.target === target));
  if (target === 'today') renderToday();
  if (target === 'calendar') renderCalendar();
  if (target === 'archive') renderArchive();
  if (target === 'record') {
    els.formMessage.textContent = '';
    setTimeout(() => els.captionInput.focus({ preventScroll: true }), 120);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cardHtml(entry, prefix = '') {
  return `
    <article class="memory-card">
      <button class="card-open" data-entry-id="${entry.id}">
        <img src="${entry.photo}" alt="${escapeHtml(entry.caption)}" />
        <div class="memory-card-body">
          <h3>${escapeHtml(entry.caption)}</h3>
          <div class="memory-meta">
            <span>${prefix || formatJapaneseDate(entry.date)}</span>
            <span>見る</span>
          </div>
        </div>
      </button>
    </article>`;
}

function renderToday() {
  const now = new Date();
  const todayStr = formatDateInput(now);
  els.todayDate.textContent = formatJapaneseDate(todayStr);

  const todayEntries = sortEntries(state.entries.filter(e => e.date === todayStr));
  els.todayEntries.innerHTML = todayEntries.length
    ? todayEntries.map(e => cardHtml(e)).join('')
    : `<div class="empty-card"><p>今日はまだ、何も置いてありません。<br>日記じゃなくて、ひとつだけ。</p><button class="secondary-button" data-go-record>今日を残す</button></div>`;

  const same = sortEntries(state.entries.filter(e => {
    const d = parseLocalDate(e.date);
    return d.getMonth() === now.getMonth() && d.getDate() === now.getDate() && d.getFullYear() !== now.getFullYear();
  }));

  els.sameDayEntries.innerHTML = same.length
    ? same.map(e => {
        const yearsAgo = now.getFullYear() - parseLocalDate(e.date).getFullYear();
        return cardHtml(e, `${yearsAgo}年前の今日`);
      }).join('')
    : `<div class="empty-card"><p>まだ「前のこの日」はありません。<br>今年の一枚が、来年ここに出てきます。</p></div>`;
}

function renderArchive() {
  const entries = sortEntries(state.entries);
  els.entryCount.textContent = `${entries.length}件`;
  els.archiveGrid.innerHTML = entries.length ? entries.map(e => `
    <article class="archive-item" data-entry-id="${e.id}">
      <img src="${e.photo}" alt="${escapeHtml(e.caption)}" />
      <div class="archive-copy">
        <strong>${escapeHtml(e.caption)}</strong>
        <span>${formatJapaneseDate(e.date)}</span>
      </div>
    </article>`).join('') : `<div class="empty-card" style="grid-column:1/-1"><p>まだ記録がありません。</p><button class="secondary-button" data-go-record>最初の「した日」を残す</button></div>`;
}

function renderCalendar() {
  const y = state.calendarCursor.getFullYear();
  const m = state.calendarCursor.getMonth();
  els.calendarTitle.textContent = `${y}年 ${m + 1}月`;

  const first = new Date(y, m, 1);
  const start = new Date(y, m, 1 - first.getDay());
  const todayStr = formatDateInput(new Date());
  let html = '';

  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = formatDateInput(d);
    const hasEntry = state.entries.some(e => e.date === dateStr);
    const classes = ['calendar-cell'];
    if (d.getMonth() !== m) classes.push('muted');
    if (dateStr === todayStr) classes.push('today');
    if (hasEntry) classes.push('has-entry');
    if (state.selectedCalendarDate === dateStr) classes.push('selected');
    html += `<button class="${classes.join(' ')}" data-date="${dateStr}"><span class="calendar-day">${d.getDate()}</span></button>`;
  }
  els.calendarGrid.innerHTML = html;
  renderSelectedCalendarDate();
}

function renderSelectedCalendarDate() {
  if (!state.selectedCalendarDate) {
    els.calendarDayEntries.innerHTML = '';
    return;
  }
  const entries = sortEntries(state.entries.filter(e => e.date === state.selectedCalendarDate));
  els.calendarDayEntries.innerHTML = `
    <div class="section-head compact"><div><p class="label">SELECTED</p><h2>${formatJapaneseDate(state.selectedCalendarDate)}</h2></div></div>
    <div class="stack">${entries.length ? entries.map(e => cardHtml(e)).join('') : '<div class="empty-card"><p>この日の記録はありません。</p></div>'}</div>`;
}

function openEntry(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;
  els.dialogContent.innerHTML = `
    <img class="dialog-photo" src="${entry.photo}" alt="${escapeHtml(entry.caption)}" />
    <div class="dialog-body">
      <h3>${escapeHtml(entry.caption)}</h3>
      <p>${formatJapaneseDate(entry.date)}</p>
      <button class="delete-button" data-delete-id="${entry.id}">この記録を削除</button>
    </div>`;
  els.dialog.showModal();
}

function deleteEntry(id) {
  state.entries = state.entries.filter(e => e.id !== id);
  saveEntries();
  els.dialog.close();
  renderToday();
  renderArchive();
  renderCalendar();
}

function resetForm() {
  state.photoDataUrl = '';
  els.photoInput.value = '';
  els.photoPreview.src = '';
  els.photoPreview.hidden = true;
  els.photoPlaceholder.hidden = false;
  els.captionInput.value = '';
  els.captionCount.textContent = '0';
  els.dateInput.value = formatDateInput(new Date());
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

els.navItems.forEach(item => item.addEventListener('click', () => switchView(item.dataset.target)));
els.quickAddBtn.addEventListener('click', () => switchView('record'));

document.addEventListener('click', (e) => {
  const goRecord = e.target.closest('[data-go-record]');
  if (goRecord) switchView('record');

  const entryTarget = e.target.closest('[data-entry-id]');
  if (entryTarget) openEntry(entryTarget.dataset.entryId);

  const dateTarget = e.target.closest('[data-date]');
  if (dateTarget) {
    state.selectedCalendarDate = dateTarget.dataset.date;
    renderCalendar();
  }

  const deleteTarget = e.target.closest('[data-delete-id]');
  if (deleteTarget) {
    const ok = confirm('この「した日」を削除しますか？');
    if (ok) deleteEntry(deleteTarget.dataset.deleteId);
  }
});

els.dialogCloseBtn.addEventListener('click', () => els.dialog.close());
els.dialog.addEventListener('click', (e) => {
  if (e.target === els.dialog) els.dialog.close();
});

async function compressImage(file, maxSide = 1600, quality = 0.82) {
  const raw = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = raw;
  });

  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

els.photoInput.addEventListener('change', async () => {
  const file = els.photoInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    els.formMessage.textContent = '画像ファイルを選んでください。';
    return;
  }
  try {
    els.formMessage.textContent = '写真を準備しています…';
    const imageData = await compressImage(file);
    state.photoDataUrl = imageData;
    els.photoPreview.src = imageData;
    els.photoPreview.hidden = false;
    els.photoPlaceholder.hidden = true;
    els.formMessage.textContent = '';
  } catch {
    els.formMessage.textContent = '写真を読み込めませんでした。別の写真を試してください。';
  }
});

els.captionInput.addEventListener('input', () => {
  els.captionCount.textContent = String(els.captionInput.value.length);
});

els.entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const caption = els.captionInput.value.trim();
  const date = els.dateInput.value;
  if (!state.photoDataUrl) {
    els.formMessage.textContent = '写真を1枚選んでください。';
    return;
  }
  if (!caption) {
    els.formMessage.textContent = '「○○した日」をひとこと残してください。';
    return;
  }
  if (!date) {
    els.formMessage.textContent = '日付を選んでください。';
    return;
  }

  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    photo: state.photoDataUrl,
    caption,
    date,
    createdAt: new Date().toISOString()
  };
  state.entries.push(entry);
  try {
    saveEntries();
  } catch {
    state.entries = state.entries.filter(e => e.id !== entry.id);
    els.formMessage.textContent = '端末内の保存容量がいっぱいです。古い記録を減らしてから再度お試しください。';
    return;
  }
  resetForm();
  switchView('today');
});

els.prevMonthBtn.addEventListener('click', () => {
  state.calendarCursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth() - 1, 1);
  state.selectedCalendarDate = null;
  renderCalendar();
});
els.nextMonthBtn.addEventListener('click', () => {
  state.calendarCursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth() + 1, 1);
  state.selectedCalendarDate = null;
  renderCalendar();
});

els.dateInput.value = formatDateInput(new Date());
renderToday();
renderCalendar();
renderArchive();
