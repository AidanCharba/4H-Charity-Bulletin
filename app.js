// Paste your deployed Google Apps Script Web App URL here.
const API_URL = "https://script.google.com/macros/s/AKfycbxVTPpcTEYQbYP_SWQgyWzXtbGykT6DYapf2k5b_d6hM9F-mJq5sehafWT4SRsKYkqvgA/exec";
let operatorKey = sessionStorage.getItem("operatorKey") || "";
let events = [];
let announcements = [];
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=s=>new Date(s).toLocaleString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});

async function api(action,data={}){
  if(API_URL.includes("PASTE_"))throw new Error("Set API_URL in app.js first.");
  const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...data,operatorKey})});
  const j=await r.json();
  if(!j.ok)throw new Error(j.error||'Request failed');
  return j;
}

async function load(){
  try{
    const j=await api('getPublicData');
    events=j.events||[];
    announcements=j.announcements||[];
    render();
    renderNotices(announcements);
  }catch(e){
    $('events').innerHTML='<p>Unable to load the board. Check the Apps Script URL.</p>';
    console.error(e);
  }
}

function render(){
  const upcoming=events.filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date));
  $('eventCount').textContent=upcoming.length;
  if(!upcoming.length){$('events').innerHTML='<div class="card"><p>No upcoming projects yet. Check back soon.</p></div>';return;}
  $('events').innerHTML=upcoming.map(e=>`<article class="event"><div class="date">${fmt(e.date)}</div><h3>${esc(e.name)}</h3><p class="place">📍 ${esc(e.place)}</p><p>${esc(e.description)}</p><div class="confirmed"><strong>${e.confirmed||0}${e.capacity?` / ${e.capacity}`:''} confirmed</strong><button onclick="openSignup('${esc(e.id)}')">Sign Up</button></div><button class="secondary" onclick="openCancel('${esc(e.id)}')">Unconfirm / Cancel</button></article>`).join('');
}

function renderNotices(ns){
  $('noticeArea').innerHTML=ns.slice(0,5).map(n=>`<article class="notice"><b>${esc(n.title)}</b><div>${esc(n.body)}</div><small>${n.createdAt?fmt(n.createdAt):''}</small></article>`).join('');
}

function openSignup(id){
  const e=events.find(x=>x.id===id);if(!e)return;
  $('signupTitle').textContent=e.name;
  $('signupDetails').textContent=`${fmt(e.date)} • ${e.place}`;
  $('signupForm').dataset.id=id;
  $('signupMsg').textContent='';
  $('confirmationCode').classList.add('hidden');
  $('signupModal').classList.remove('hidden');
}

function openCancel(id){
  const e=events.find(x=>x.id===id);if(!e)return;
  $('cancelTitle').textContent=`Cancel: ${e.name}`;
  $('cancelForm').dataset.id=id;
  $('cancelMsg').textContent='';
  $('cancelModal').classList.remove('hidden');
}

function closeModal(){$('signupModal').classList.add('hidden');$('signupForm').reset();$('signupMsg').textContent='';$('confirmationCode').classList.add('hidden')}
function closeCancel(){$('cancelModal').classList.add('hidden');$('cancelForm').reset();$('cancelMsg').textContent=''}
function closePrivacy(){$('privacyModal').classList.add('hidden')}
function closeOperator(){$('operatorModal').classList.add('hidden')}

$('privacyLink').onclick=()=>$('privacyModal').classList.remove('hidden');
$('operatorBtn').onclick=()=>{$('operatorKey').value=operatorKey;$('operatorModal').classList.remove('hidden')};

$('operatorForm').onsubmit=async e=>{
  e.preventDefault();
  operatorKey=$('operatorKey').value;
  sessionStorage.setItem('operatorKey',operatorKey);
  try{await api('operatorCheck');closeOperator();$('admin').classList.remove('hidden');await loadAdmin()}
  catch(err){$('operatorMsg').textContent=err.message;sessionStorage.removeItem('operatorKey');operatorKey=''}
};

$('signupForm').onsubmit=async e=>{
  e.preventDefault();
  try{
    const j=await api('signup',{eventId:e.target.dataset.id,parent:$('parent').value.trim(),child:$('child').value.trim(),email:$('email').value.trim(),phone:$('phone').value.trim()});
    $('signupMsg').textContent='You are confirmed! Thank you for serving the community.';
    $('confirmationCodeValue').textContent=j.id;
    $('confirmationCode').classList.remove('hidden');
    await load();
    setTimeout(closeModal,7000);
  }catch(err){$('signupMsg').textContent=err.message}
};

$('cancelForm').onsubmit=async e=>{
  e.preventDefault();
  try{
    await api('cancelSignup',{eventId:e.target.dataset.id,signupId:$('cancelCode').value.trim(),email:$('cancelEmail').value.trim()});
    $('cancelMsg').textContent='Your signup has been cancelled.';
    await load();
    setTimeout(closeCancel,1200);
  }catch(err){$('cancelMsg').textContent=err.message}
};

$('eventForm').onsubmit=async e=>{
  e.preventDefault();
  try{await api('addEvent',{name:$('name').value.trim(),description:$('description').value.trim(),place:$('place').value.trim(),date:$('date').value,capacity:$('capacity').value});$('eventMsg').textContent='Event posted.';e.target.reset();await load();await loadAdmin()}
  catch(err){$('eventMsg').textContent=err.message}
};

$('noticeForm').onsubmit=async e=>{
  e.preventDefault();
  try{await api('addAnnouncement',{title:$('noticeTitle').value.trim(),body:$('noticeBody').value.trim()});$('noticeMsg').textContent='Notification posted.';e.target.reset();await load();await loadAdmin()}
  catch(err){$('noticeMsg').textContent=err.message}
};

async function takeDownEvent(id){
  if(!confirm('Take down this event from the public board? Existing signup records will be kept.'))return;
  try{await api('takeDownEvent',{eventId:id});await load();await loadAdmin()}
  catch(err){alert(err.message)}
}
async function restoreEvent(id){
  try{await api('restoreEvent',{eventId:id});await load();await loadAdmin()}
  catch(err){alert(err.message)}
}
async function takeDownAnnouncement(id){
  if(!confirm('Take down this notification from the public board?'))return;
  try{await api('takeDownAnnouncement',{announcementId:id});await load();await loadAdmin()}
  catch(err){alert(err.message)}
}
async function restoreAnnouncement(id){
  try{await api('restoreAnnouncement',{announcementId:id});await load();await loadAdmin()}
  catch(err){alert(err.message)}
}

async function loadAdmin(){
  if(!operatorKey)return;
  try{
    const j=await api('getSignups');
    $('signups').innerHTML=(j.signups||[]).length?j.signups.map(s=>`<div class="admin-signup"><b>${esc(s.child)}</b> — ${esc(s.parent)} · ${esc(s.event)} · ${esc(s.email)} ${s.phone?`· ${esc(s.phone)}`:''}<span class="status-pill ${String(s.status).toLowerCase()==='cancelled'?'cancelled':''}">${esc(s.status)}</span></div>`).join(''):'No signups yet.';

    $('adminEvents').innerHTML=events.length?events.map(e=>`<div class="admin-item"><div><b>${esc(e.name)}</b><br><span class="muted">${fmt(e.date)} · ${esc(e.place)} · ${e.confirmed||0}${e.capacity?` / ${e.capacity}`:''} confirmed</span></div><div>${e.status==='Open'?`<button class="danger" onclick="takeDownEvent('${esc(e.id)}')">Take Down</button>`:`<button class="secondary" onclick="restoreEvent('${esc(e.id)}')">Restore</button>`}</div></div>`).join(''):'No events yet.';

    $('adminNotices').innerHTML=announcements.length?announcements.map(n=>`<div class="admin-item"><div><b>${esc(n.title)}</b><br><span class="muted">${esc(n.body)}</span></div><div><button class="${n.active===false?'secondary':'danger'}" onclick="${n.active===false?'restoreAnnouncement':'takeDownAnnouncement'}('${esc(n.id)}')">${n.active===false?'Restore':'Take Down'}</button></div></div>`).join(''):'No notifications yet.';
  }catch(e){$('signups').textContent=e.message}
}

if(operatorKey){$('admin').classList.remove('hidden');loadAdmin()}
load();
