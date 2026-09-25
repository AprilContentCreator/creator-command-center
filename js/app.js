document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const links = [...document.querySelectorAll('.primary-nav a[data-target]')];
  const sections = links.filter(a => a.dataset.target.startsWith('placeholder-'));
  const statuses = ['Planned', 'In progress', 'Waiting', 'Done'];
  const types = ['task', 'reminder', 'event', 'idea', 'link', 'note', 'live-help'];
  const key = 'ccc_owner_april_planner_v1';
  const today = () => dateKey(new Date());
  function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  const notice = document.createElement('p'); notice.id = 'save-status'; notice.setAttribute('role','status'); document.querySelector('.top-bar').after(notice);
  function say(message) { notice.textContent = message; }
  function read(key, fallback) { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
  let data;
  let storageHealthy = true;
  try {
    data = read(key, null);
    if (!data) {
      const old = read('ccc_owner_april_quick_add_items', []);
      data = {version:1, items:old.map((i,n) => ({id:String(i.id || `legacy-${n}`), title:String(i.content || ''), section:i.type === 'live-help' ? 'placeholder-live-help' : 'placeholder-sandbox', type:types.includes(i.type)?i.type:'note', status:'Planned', date:'', time:'', priority:false, url:'', notes:'', created:Number(i.timestamp)||Date.now()})), quickNote:read('ccc_owner_april_quick_note',''), brain:read('ccc_owner_april_brain_dumps',[])};
    }
    validate(data);
  } catch(e) { storageHealthy = false; data = {version:1,items:[],quickNote:'',brain:[]}; say('Saved data could not be read. Changes are disabled to protect it. Restore a valid backup in Settings.'); }
  function validate(d) {
    if (!d || d.version !== 1 || !Array.isArray(d.items) || typeof d.quickNote !== 'string' || !Array.isArray(d.brain)) throw Error('Invalid backup format');
    const ids = new Set();
    for (const i of d.items) {
      if (!i || typeof i.id !== 'string' || ids.has(i.id) || typeof i.title !== 'string' || !sections.some(a=>a.dataset.target===i.section) || !types.includes(i.type) || !statuses.includes(i.status) || typeof i.priority !== 'boolean' || !Number.isFinite(i.created) || !['date','time','url','notes'].every(k=>typeof i[k]==='string')) throw Error('Invalid item in backup');
      if (i.date && (!/^\d{4}-\d{2}-\d{2}$/.test(i.date) || dateKey(new Date(i.date+'T12:00:00'))!==i.date)) throw Error('Invalid date');
      if (i.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(i.time)) throw Error('Invalid time');
      ids.add(i.id);
    }
    for(const b of d.brain) if(!b || typeof b.text!=='string' || !Number.isFinite(b.timestamp)) throw Error('Invalid idea');
  }
  function commit(next) {
    if (!storageHealthy) { say('Saving is disabled until your saved data is recovered.'); return false; }
    try { validate(next); localStorage.setItem(key,JSON.stringify(next)); data=next; say('Saved on this browser.'); render(); return true; }
    catch(e) { say('Could not save. Your changes were not stored. Export a backup and check browser storage.'); return false; }
  }
  function node(tag,text,cls) { const n=document.createElement(tag); if(text!==undefined)n.textContent=text; if(cls)n.className=cls; return n; }
  function button(text,fn,cls='btn-secondary') { const b=node('button',text,cls); b.type='button'; b.onclick=fn; return b; }
  function list(parent,items) {
    if(!items.length) { parent.append(node('p','No items here yet.','empty-state')); return; }
    items.forEach(i=>{
      const row=node('article',undefined,'planner-item');
      row.append(button(i.title,()=>edit(i),'item-title'));
      row.append(node('p',`${i.status} · ${sections.find(a=>a.dataset.target===i.section).textContent}${i.date?' · '+i.date:''}${i.time?' '+i.time:''}${i.priority?' · Priority':''}`,'item-meta'));
      if(i.notes)row.append(node('p',i.notes,'item-notes'));
      if(i.url) { try { const u=new URL(i.url); if(['https:','http:'].includes(u.protocol)){ const a=node('a','Open link');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';row.append(a); } }catch{} }
      const actions=node('div',undefined,'item-actions');
      actions.append(button(i.status==='Done'?'Reopen':'Mark done',()=>commit({...data,items:data.items.map(x=>x.id===i.id?{...x,status:x.status==='Done'?'Planned':'Done'}:x)})));
      actions.append(button('Delete',()=>{if(confirm(`Delete “${i.title}”?`))commit({...data,items:data.items.filter(x=>x.id!==i.id)});}));
      row.append(actions);parent.append(row);
    });
  }
  let active='view-dashboard'; let month=new Date(); month.setDate(1);
  function route() {
    const a=links.find(a=>a.hash===location.hash)||links[0]; active=a.dataset.target;
    document.querySelectorAll('.view-section').forEach(v=>v.classList.toggle('active',v.id===active));
    links.forEach(l=>{l.classList.toggle('active',l===a);if(l===a)l.setAttribute('aria-current','page');else l.removeAttribute('aria-current');});
    $('sidebar').classList.remove('mobile-open');$('mobile-menu-toggle').setAttribute('aria-expanded','false');
  }
  window.addEventListener('hashchange',route);
  $('mobile-menu-toggle').onclick=()=>{$('sidebar').classList.toggle('mobile-open');$('mobile-menu-toggle').setAttribute('aria-expanded',String($('sidebar').classList.contains('mobile-open')));};
  const search=document.querySelector('.global-search-placeholder input'); search.disabled=false;search.type='search';search.placeholder='Search your items…';search.setAttribute('aria-label','Search your items');
  const results=node('section',undefined,'search-results hidden');search.closest('header').after(results);
  function renderSearch(){results.replaceChildren();const q=search.value.trim().toLowerCase();results.classList.toggle('hidden',!q);if(q){results.append(node('h2','Search results'));list(results,data.items.filter(i=>[i.title,i.notes,i.type,i.status,i.url].join(' ').toLowerCase().includes(q)));}}
  search.oninput=renderSearch;
  const filters=new Map();
  sections.forEach(a=>{
    const v=$(a.dataset.target);v.classList.remove('placeholder-view');v.querySelector('p').remove();
    const bar=node('div',undefined,'section-toolbar');bar.append(button('+ Add item',()=>edit(null,a.dataset.target),'btn-primary'));
    const filter=node('select');filter.setAttribute('aria-label','Filter '+a.textContent);['All',...statuses].forEach(s=>filter.append(new Option(s,s)));bar.append(filter);v.append(bar,node('div',undefined,'section-items'));filters.set(a.dataset.target,filter);filter.onchange=render;
  });
  const modal=$('quick-add-modal'); const oldModal=modal.querySelector('.modal-content');oldModal.remove();
  const dialog=document.createElement('dialog');dialog.id='item-dialog';dialog.className='planner-dialog';document.body.append(dialog);modal.remove();
  dialog.innerHTML=`<form id="item-form"><h2 id="editor-heading">Add item</h2><label>Title<input name="title" required maxlength="500"></label><label>Section<select name="section"></select></label><div class="form-pair"><label>Type<select name="type"></select></label><label>Status<select name="status"></select></label></div><div class="form-pair"><label>Date<input name="date" type="date"></label><label>Time<input name="time" type="time"></label></div><label>Link<input name="url" type="url" placeholder="https://"></label><label>Notes<textarea name="notes" rows="4"></textarea></label><label class="check-label"><input name="priority" type="checkbox"> Current priority</label><div class="modal-actions"><button type="button" id="editor-cancel" class="btn-secondary">Cancel</button><button class="btn-primary">Save item</button></div></form>`;
  dialog.setAttribute('aria-labelledby','editor-heading');
  const form=$('item-form'), fields=form.elements;sections.forEach(a=>fields.section.add(new Option($(a.dataset.target).querySelector('h1').textContent,a.dataset.target)));types.forEach(t=>fields.type.add(new Option(t,t)));statuses.forEach(t=>fields.status.add(new Option(t,t)));
  let editing=null;
  function edit(item,section,date='') { editing=item?.id||null;form.reset();const defaults=item||{title:'',section:section||(sections.some(a=>a.dataset.target===active)?active:'placeholder-sandbox'),type:'task',status:'Planned',date,time:'',url:'',notes:'',priority:false};for(const k of ['title','section','type','status','date','time','url','notes'])fields[k].value=defaults[k];fields.priority.checked=defaults.priority;$('editor-heading').textContent=item?'Edit item':'Add item';dialog.showModal();fields.title.focus(); }
  $('quick-add-btn').onclick=()=>edit(null);$('editor-cancel').onclick=()=>dialog.close();
  form.onsubmit=e=>{e.preventDefault();if(!fields.title.value.trim())return; const item={id:editing||crypto.randomUUID(),created:editing?data.items.find(i=>i.id===editing).created:Date.now(),priority:fields.priority.checked};for(const k of ['title','section','type','status','date','time','url','notes'])item[k]=fields[k].value.trim();if(item.url&&!/^https?:\/\//i.test(item.url)){say('Use an http or https link.');return;}if(commit({...data,items:editing?data.items.map(i=>i.id===editing?item:i):[...data.items,item]}))dialog.close();};
  const cards=[...document.querySelectorAll('.dashboard-grid .card')];cards.forEach(c=>{if(!c.querySelector('textarea')){c.querySelector('p').remove();c.append(node('div',undefined,'card-items'));}});
  $('quick-note-input').value=data.quickNote;$('quick-note-input').oninput=e=>commit({...data,quickNote:e.target.value});
  const calendar=$('view-calendar');calendar.querySelector('.view-description').textContent='Your dated items. Entries are managed here; external calendars are not connected.';calendar.querySelector('.calendar-shell').remove();
  const calBar=node('div',undefined,'section-toolbar');const monthLabel=node('h2');calBar.append(button('Previous month',()=>{month.setMonth(month.getMonth()-1);renderCalendar();}),monthLabel,button('Next month',()=>{month.setMonth(month.getMonth()+1);renderCalendar();}),button('Today',()=>{month=new Date();month.setDate(1);renderCalendar();}));const grid=node('div',undefined,'calendar-shell');calendar.append(calBar,grid);
  function renderCalendar(){grid.replaceChildren();monthLabel.textContent=month.toLocaleDateString(undefined,{month:'long',year:'numeric'});['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>grid.append(node('div',d,'cal-header')));const start=new Date(month);start.setDate(1-start.getDay());for(let n=0;n<42;n++){const d=new Date(start);d.setDate(start.getDate()+n);const date=dateKey(d);const cell=node('div',undefined,'cal-day'+(d.getMonth()!==month.getMonth()?' other-month':'')+(date===today()?' is-today':''));const add=button(String(d.getDate()),()=>edit(null,'placeholder-sandbox',date),'date-num');add.setAttribute('aria-label','Add item on '+date);cell.append(add);data.items.filter(i=>i.date===date).sort((a,b)=>a.time.localeCompare(b.time)).forEach(i=>cell.append(button((i.time?i.time+' ':'')+i.title,()=>edit(i),'cal-event'+(i.status==='Done'?' completed':''))));grid.append(cell);}}
  $('bd-submit').onclick=()=>{const text=$('bd-input').value.trim();if(text&&commit({...data,brain:[...data.brain,{text,timestamp:Date.now()}]}))$('bd-input').value='';};
  const settings=$('view-settings');settings.querySelector('h1').textContent='Settings & Backups';settings.querySelector('.warning-card').innerHTML='<h3>Your saved data</h3><p>Entries stay in this browser on this website. They do not sync across devices or connect to your social accounts. Export a backup regularly, especially before clearing browser data or changing devices.</p>';
  settings.querySelectorAll('button').forEach(b=>b.remove());
  function download(d){const url=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download=`creator-command-center-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  settings.append(button('Export backup',()=>download(data),'btn-primary'));
  const importLabel=node('label','Restore a backup','import-label');const upload=node('input');upload.type='file';upload.accept='.json,application/json';importLabel.append(upload);settings.append(importLabel);
  upload.onchange=async()=>{const file=upload.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Backup is too large');const next=JSON.parse(await file.text());validate(next);if(!confirm(`Replace current data with ${next.items.length} items and ${next.brain.length} ideas? Export your current backup first if you need to keep it.`))return;const wasHealthy=storageHealthy;storageHealthy=true;if(commit(next)){$('quick-note-input').value=data.quickNote;say('Backup restored.');}else storageHealthy=wasHealthy;}catch(e){say('Backup was not restored: '+e.message);}finally{upload.value='';}};
  function render(){sections.forEach(a=>{const container=$(a.dataset.target).querySelector('.section-items');container.replaceChildren();const f=filters.get(a.dataset.target).value;list(container,data.items.filter(i=>i.section===a.dataset.target&&(f==='All'||i.status===f)).sort((a,b)=>b.created-a.created));});const pending=data.items.filter(i=>i.status!=='Done');const groups=[pending.filter(i=>i.date===today()),pending.filter(i=>i.date>today()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)),pending.filter(i=>i.date&&i.date<today()),pending.filter(i=>i.priority),[...data.items].sort((a,b)=>b.created-a.created),pending.filter(i=>i.status==='Waiting'),null,pending.filter(i=>(i.type==='live-help'||i.section==='placeholder-tk-live')&&i.date>=today()).sort((a,b)=>a.date.localeCompare(b.date))];cards.forEach((c,n)=>{const dest=c.querySelector('.card-items');if(dest){dest.replaceChildren();list(dest,groups[n].slice(0,5));}});const brain=$('bd-list');brain.replaceChildren();if(!data.brain.length)brain.append(node('p','No ideas saved yet.','empty-state'));data.brain.map((b,index)=>({b,index})).reverse().forEach(({b,index})=>{const row=node('div',undefined,'dump-item');row.append(node('div',new Date(b.timestamp).toLocaleString(),'dump-time'),node('p',b.text),button('Delete idea',()=>{if(confirm('Delete this idea?'))commit({...data,brain:data.brain.filter((_,n)=>n!==index)});}));brain.append(row);});renderCalendar();renderSearch();}
  window.addEventListener('storage',e=>{if(e.key===key){try{const next=JSON.parse(e.newValue);validate(next);data=next;$('quick-note-input').value=data.quickNote;render();say('Updated from another tab.');}catch{storageHealthy=false;say('Saved data changed unexpectedly. Reload before editing.');}}});
  render();route();
});

document.addEventListener('DOMContentLoaded', () => {
  const groups = [...document.querySelectorAll('.nav-group')];
  function expand(selected) { groups.forEach(group => { const open = group === selected; group.classList.toggle('expanded',open); group.querySelector('.group-title').setAttribute('aria-expanded',String(open)); }); }
  groups.forEach(group => { const old=group.querySelector('.group-title'); const button=document.createElement('button'); button.className=old.className; button.type='button'; button.textContent=old.textContent; button.setAttribute('aria-expanded','false'); old.replaceWith(button); button.onclick=()=>expand(group.classList.contains('expanded')?null:group); });
  function syncTabs() { expand(groups.find(group=>group.querySelector('a.active'))); }
  window.addEventListener('hashchange',syncTabs); syncTabs();
});
