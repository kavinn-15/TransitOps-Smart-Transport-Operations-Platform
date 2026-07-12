/* ======================================================================
   TRANSITOPS — frontend, wired to the Spring Boot REST API
   All data now lives in MySQL and is reached through fetch() calls to
   /api/**. Nothing is stored in the browser. Served by Spring Boot itself
   from src/main/resources/static, so every call below is same-origin
   (no CORS setup needed).
   ====================================================================== */

/* Works whether this page is served at the root context ("/", i.e. running
   as a plain Spring Boot jar) or under a WAR context path such as
   "/transitops-fleet/" (i.e. deployed as a Dynamic Web Project on external
   Tomcat). We derive it from the page's own URL instead of hardcoding ''
   so a hardcoded root-relative "/api/..." doesn't miss the context path. */
const API_BASE = (() => {
  const p = window.location.pathname;
  return p.endsWith('/') ? p.slice(0, -1) : p.substring(0, p.lastIndexOf('/'));
})();

/* Local cache of the last data fetched for each page — used for CSV export
   and the simple global-search helper, never as the source of truth. */
const STATE = {
  vehicles: [], drivers: [], trips: [], maintenance: [], fuel: [], expenses: [], analytics: null
};

const NAV = [
  {id:'dashboard',   label:'Dashboard'},
  {id:'fleet',       label:'Fleet'},
  {id:'drivers',     label:'Drivers'},
  {id:'trips',       label:'Trips'},
  {id:'maintenance', label:'Maintenance'},
  {id:'fuel',        label:'Fuel & Expenses'},
  {id:'analytics',   label:'Analytics'},
  {id:'settings',    label:'Settings'},
];

/* Mirrors RbacService on the backend — used here only to drive the UI
   (show/hide buttons, lock forms). The backend re-checks every request
   using the X-User-Role header, so the UI copy is not a security boundary. */
const PERMS = {
  'Fleet Manager':      {dashboard:'full', fleet:'full', drivers:'full', trips:'view', maintenance:'full', fuel:'view',  analytics:'full', settings:'view'},
  'Dispatcher':         {dashboard:'full', fleet:'view', drivers:'view', trips:'full', maintenance:'view', fuel:'view',  analytics:'view', settings:'view'},
  'Safety Officer':     {dashboard:'full', fleet:'view', drivers:'full', trips:'view', maintenance:'view', fuel:'view',  analytics:'view', settings:'view'},
  'Financial Analyst':  {dashboard:'full', fleet:'view', drivers:'view', trips:'view', maintenance:'view', fuel:'full',  analytics:'full', settings:'view'},
  'Administrator':      {dashboard:'full', fleet:'full', drivers:'full', trips:'full', maintenance:'full', fuel:'full',  analytics:'full', settings:'full'},
};
const DRIVER_PERMS = {
  'Fleet Manager':      {getAll:true, getById:true, create:true,  update:true,  delete:true},
  'Safety Officer':     {getAll:true, getById:true, create:true,  update:true,  delete:false},
  'Financial Analyst':  {getAll:true, getById:true, create:false, update:false, delete:false},
  'Dispatcher':         {getAll:true, getById:true, create:false, update:false, delete:false},
  'Administrator':      {getAll:true, getById:true, create:true,  update:true,  delete:true},
};
function driverPerm(action){
  const p = DRIVER_PERMS[currentUser.role];
  return !!(p && p[action]);
}

let currentUser = null;

/* ======================================================================
   API HELPER
   ====================================================================== */
async function api(path, method='GET', body=null){
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentUser ? currentUser.role : 'Administrator',
    },
  };
  if(body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  let data = null;
  const text = await res.text();
  if(text){ try{ data = JSON.parse(text); }catch(e){ data = null; } }
  if(!res.ok){
    const msg = (data && data.message) ? data.message : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
const apiGet    = (path)       => api(path, 'GET');
const apiPost   = (path, body) => api(path, 'POST', body);
const apiPatch  = (path, body) => api(path, 'PATCH', body);
const apiDelete = (path)       => api(path, 'DELETE');

/* ======================================================================
   AUTH
   ====================================================================== */
document.getElementById('login-form').addEventListener('submit', async function(e){
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-password').value;
  const role  = document.getElementById('login-role').value;
  const errBox = document.getElementById('login-error');
  errBox.style.display = 'none';

  try{
    const user = await apiPost('/api/auth/login', {email, password: pass, role});
    currentUser = user;
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').classList.add('active');
    initShell();
    navigate('dashboard');
  }catch(err){
    errBox.style.display='block';
    errBox.textContent = err.message;
  }
});

function doLogout(){
  currentUser = null;
  document.getElementById('app').classList.remove('active');
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('login-error').style.display='none';
}

/* ======================================================================
   SHELL / ROUTING
   ====================================================================== */
function initShell(){
  document.getElementById('topbar-username').textContent = currentUser.name;
  document.getElementById('topbar-role').textContent = currentUser.role;
  document.getElementById('topbar-avatar').textContent = currentUser.name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();

  const perms = PERMS[currentUser.role];
  const navLine = document.getElementById('nav-line');
  navLine.innerHTML = '';
  NAV.forEach(item=>{
    const level = perms[item.id];
    if(level === 'none') return;
    const el = document.createElement('div');
    el.className = 'nav-item';
    el.dataset.page = item.id;
    el.onclick = () => navigate(item.id);
    el.innerHTML = `<span>${item.label}</span>` + (level==='view' ? `<span class="badge-view">VIEW</span>` : '');
    navLine.appendChild(el);
  });

  document.getElementById('mobile-nav-btn').style.display = window.innerWidth <= 860 ? 'inline-flex' : 'none';
}

function pagePermission(pageId){
  return PERMS[currentUser.role][pageId] || 'none';
}

function navigate(pageId){
  if(pagePermission(pageId) === 'none') pageId = 'dashboard';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.page===pageId));
  document.getElementById('page-'+pageId).classList.add('active');
  const navItem = NAV.find(n=>n.id===pageId);
  document.getElementById('page-crumb').textContent = navItem ? navItem.label : pageId;
  document.getElementById('sidebar').classList.remove('open');
  applyViewLocks(pageId);
  renderPage(pageId);
}

function applyViewLocks(pageId){
  const level = pagePermission(pageId);
  const isView = level === 'view';

  const editableIds = { fleet:['fleet-add-btn'] };
  (editableIds[pageId]||[]).forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.style.display = isView ? 'none' : 'inline-flex';
  });

  if(pageId === 'drivers'){
    const canCreate = driverPerm('create');
    const btn = document.getElementById('drivers-add-btn');
    if(btn) btn.style.display = canCreate ? 'inline-flex' : 'none';
    const restricted = !canCreate || !driverPerm('update') || !driverPerm('delete');
    const parts = [];
    if(!canCreate) parts.push('add');
    if(!driverPerm('update')) parts.push('update');
    if(!driverPerm('delete')) parts.push('delete');
    toggleLockNote('drivers', restricted,
      restricted ? `Your role (${currentUser.role}) can view all driver records but cannot ${parts.join('/')} drivers.` : '');
  }

  if(pageId === 'maintenance'){
    ['maint-vehicle','maint-service','maint-cost','maint-date','maint-save-btn'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.disabled = isView;
    });
    toggleLockNote('maintenance', isView, 'View-only access — you can see service records but cannot log or close them with this role.');
  }

  if(pageId === 'trips'){
    ['trip-source','trip-dest','trip-vehicle','trip-driver','trip-cargo','trip-distance',
     'trip-dispatch-btn','trip-savedraft-btn','trip-cancel-btn'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.disabled = isView;
    });
    toggleLockNote('trips', isView, 'View-only access — you can track the live board but cannot create, dispatch, complete or cancel trips with this role.');
  }
}

function toggleLockNote(pageId, show, message){
  const panel = document.querySelector('#page-'+pageId+' .panel-pad');
  if(!panel) return;
  let note = panel.querySelector('.role-lock-note');
  if(show){
    if(!note){
      note = document.createElement('div');
      note.className = 'callout callout-info role-lock-note';
      panel.insertBefore(note, panel.children[1] || null);
    }
    note.textContent = message;
    note.style.display = 'block';
  } else if(note){
    note.style.display = 'none';
  }
}

function renderPage(pageId){
  switch(pageId){
    case 'dashboard':   renderDashboard(); break;
    case 'fleet':       renderFleet(); break;
    case 'drivers':     renderDrivers(); break;
    case 'trips':       renderTrips(); break;
    case 'maintenance': renderMaintenance(); break;
    case 'fuel':        renderFuel(); break;
    case 'analytics':   renderAnalytics(); break;
    case 'settings':    break;
  }
}

/* ======================================================================
   HELPERS
   ====================================================================== */
function toast(msg, danger=false){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (danger ? ' danger' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.classList.remove('show'), 2600);
}
function openModal(id){ document.getElementById(id).classList.add('show'); }
function closeModal(id){ document.getElementById(id).classList.remove('show'); }
function fmtMoney(n){ return '₹' + Number(n||0).toLocaleString('en-IN'); }
function statusClass(s){ return 'st-' + s.toLowerCase().replace(/\s+/g,''); }
function isLicenseExpired(driver){ return new Date(driver.expiry) < new Date(); }
function driverAssignable(d){ return d.status === 'Available' && !isLicenseExpired(d); }
function vehicleAssignable(v){ return v.status === 'Available'; }

/* ======================================================================
   DASHBOARD
   ====================================================================== */
async function renderDashboard(){
  const type = document.getElementById('dash-f-type').value;
  const status = document.getElementById('dash-f-status').value;

  let summary;
  try{
    summary = await apiGet(`/api/dashboard/summary?type=${encodeURIComponent(type)}&status=${encodeURIComponent(status)}`);
  }catch(err){ toast(err.message, true); return; }

  const kpis = [
    ['Active Vehicles', summary.activeVehicles, ''],
    ['Available Vehicles', summary.availableVehicles, 'c-green'],
    ['Vehicles in Maintenance', summary.vehiclesInMaintenance, 'c-amber'],
    ['Active Trips', summary.activeTrips, ''],
    ['Pending Trips', summary.pendingTrips, 'c-amber'],
    ['Drivers on Duty', summary.driversOnDuty, ''],
    ['Fleet Utilization', summary.fleetUtilization+'%', 'c-green'],
  ];
  document.getElementById('dash-kpis').innerHTML = kpis.map(([label,val,cls])=>
    `<div class="kpi ${cls||''}"><div class="k-label">${label}</div><div class="k-val">${val}</div></div>`
  ).join('');

  const tbody = document.getElementById('dash-trips-body');
  const recent = summary.recentTrips || [];
  if(!recent.length){
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="em-icon">🛣️</div><p>No trips yet. Create one from the Trips page.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = recent.map(t=>`
      <tr><td class="mono">${t.tripCode}</td><td>${t.vehicle||'—'}</td><td>${t.driver||'—'}</td>
      <td><span class="status-pill ${statusClass(t.status)}">${t.status}</span></td><td class="mono">${t.eta}</td></tr>
    `).join('');
  }

  const counts = summary.vehicleStatusCounts || {};
  const max = Math.max(1, ...Object.values(counts));
  const colorMap = {Available:'var(--success)','On Trip':'var(--info)','In Shop':'var(--warn)',Retired:'var(--danger)'};
  document.getElementById('dash-vehicle-status').innerHTML = Object.entries(counts).map(([k,v])=>`
    <div class="hbar-row"><div class="hbar-top"><span>${k}</span><span class="mono">${v}</span></div>
    <div class="hbar-track"><div class="hbar-fill" style="width:${(v/max)*100}%;background:${colorMap[k]}"></div></div></div>
  `).join('');
}

/* ======================================================================
   FLEET
   ====================================================================== */
async function renderFleet(){
  const type = document.getElementById('fleet-f-type').value;
  const status = document.getElementById('fleet-f-status').value;
  const q = document.getElementById('fleet-f-search').value.trim();

  let rows;
  try{
    rows = await apiGet(`/api/vehicles?type=${encodeURIComponent(type)}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(q)}`);
  }catch(err){ toast(err.message, true); return; }
  STATE.vehicles = rows;

  const canEdit = pagePermission('fleet') === 'full';
  const tbody = document.getElementById('fleet-body');
  if(!rows.length){
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="em-icon">🚐</div><p>No vehicles match these filters.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = rows.map(v=>`
      <tr>
        <td class="mono">${v.reg}</td><td>${v.name}</td><td>${v.type}</td>
        <td class="mono">${v.capacity} kg</td><td class="mono">${Number(v.odometer).toLocaleString()}</td>
        <td class="mono">${fmtMoney(v.cost)}</td>
        <td><span class="status-pill ${statusClass(v.status)}">${v.status}</span></td>
        <td>${canEdit ? `<select onchange="setVehicleStatus('${v.reg}', this.value)" style="background:var(--panel-2);border:1px solid var(--line);color:var(--text);border-radius:6px;padding:5px 7px;font-size:11.5px;">
              ${['Available','On Trip','In Shop','Retired'].map(s=>`<option ${s===v.status?'selected':''}>${s}</option>`).join('')}
            </select>` : ''}</td>
      </tr>
    `).join('');
  }
  await refreshVehicleDropdowns();
}
async function setVehicleStatus(reg, status){
  try{
    await apiPatch(`/api/vehicles/${encodeURIComponent(reg)}/status`, {status});
    toast(`${reg} set to ${status}`);
    renderFleet(); renderDashboard();
  }catch(err){ toast(err.message, true); }
}
function openVehicleModal(){
  document.getElementById('mv-error').innerHTML='';
  ['mv-reg','mv-name','mv-capacity','mv-odometer','mv-cost'].forEach(id=>document.getElementById(id).value='');
  openModal('vehicle-modal');
}
async function saveVehicle(){
  const reg = document.getElementById('mv-reg').value.trim().toUpperCase();
  const name = document.getElementById('mv-name').value.trim();
  const type = document.getElementById('mv-type').value;
  const capacity = Number(document.getElementById('mv-capacity').value);
  const odometer = Number(document.getElementById('mv-odometer').value)||0;
  const cost = Number(document.getElementById('mv-cost').value)||0;
  const errBox = document.getElementById('mv-error');
  errBox.innerHTML = '';

  try{
    await apiPost('/api/vehicles', {reg, name, type, capacity, odometer, cost});
    closeModal('vehicle-modal');
    toast('Vehicle added');
    renderFleet(); renderDashboard();
  }catch(err){
    errBox.innerHTML = `<div class="callout callout-danger">${err.message}</div>`;
  }
}

/* ======================================================================
   DRIVERS
   ====================================================================== */
async function renderDrivers(){
  const canUpdate = driverPerm('update');
  const canDelete = driverPerm('delete');

  let drivers;
  try{ drivers = await apiGet('/api/drivers'); }catch(err){ toast(err.message, true); return; }
  STATE.drivers = drivers;

  const tbody = document.getElementById('drivers-body');
  if(!drivers.length){
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="em-icon">🧑‍✈️</div><p>No drivers yet.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = drivers.map(d=>{
      const expired = isLicenseExpired(d);
      return `<tr>
        <td>${d.name}</td><td class="mono">${d.license}</td><td>${d.category}</td>
        <td class="mono" style="color:${expired?'var(--danger)':'var(--text)'}">${d.expiry}${expired?' (expired)':''}</td>
        <td class="mono">${d.contact}</td><td class="mono">${d.tripCompletion}%</td>
        <td><span class="status-pill ${d.tripCompletion>=90?'st-available':(d.tripCompletion>=80?'st-inshop':'st-suspended')}">${d.tripCompletion>=90?'Good':(d.tripCompletion>=80?'Fair':'Poor')}</span></td>
        <td>${canUpdate ? `<select onchange="setDriverStatus('${d.license}', this.value)" style="background:var(--panel-2);border:1px solid var(--line);color:var(--text);border-radius:6px;padding:5px 7px;font-size:11.5px;">
              ${['Available','On Trip','Off Duty','Suspended'].map(s=>`<option ${s===d.status?'selected':''}>${s}</option>`).join('')}
            </select>` : `<span class="status-pill ${statusClass(d.status)}">${d.status}</span>`}</td>
        <td>${canDelete ? `<button class="btn btn-ghost btn-sm" style="color:var(--danger);padding:4px 8px;" onclick="deleteDriver('${d.license}')">Delete</button>` : ''}</td>
      </tr>`;
    }).join('');
  }
  await refreshDriverDropdowns();
}
async function setDriverStatus(license, status){
  if(!driverPerm('update')){ toast('You do not have permission to update drivers', true); return; }
  try{
    await apiPatch(`/api/drivers/${encodeURIComponent(license)}/status`, {status});
    toast(`Driver set to ${status}`);
    renderDrivers(); renderDashboard();
  }catch(err){ toast(err.message, true); }
}
async function deleteDriver(license){
  if(!driverPerm('delete')){ toast('You do not have permission to delete drivers', true); return; }
  const d = STATE.drivers.find(x=>x.license===license);
  if(!confirm(`Remove driver "${d?d.name:license}" (${license})? This cannot be undone.`)) return;
  try{
    await apiDelete(`/api/drivers/${encodeURIComponent(license)}`);
    toast('Driver removed');
    renderDrivers(); renderDashboard();
  }catch(err){ toast(err.message, true); }
}
function openDriverModal(){
  if(!driverPerm('create')){ toast('You do not have permission to create drivers', true); return; }
  document.getElementById('md-error').innerHTML='';
  ['md-name','md-license','md-expiry','md-contact'].forEach(id=>document.getElementById(id).value='');
  openModal('driver-modal');
}
async function saveDriver(){
  if(!driverPerm('create')){ toast('You do not have permission to create drivers', true); return; }
  const name = document.getElementById('md-name').value.trim();
  const license = document.getElementById('md-license').value.trim().toUpperCase();
  const category = document.getElementById('md-category').value;
  const expiry = document.getElementById('md-expiry').value;
  const contact = document.getElementById('md-contact').value.trim();
  const errBox = document.getElementById('md-error');
  errBox.innerHTML = '';

  try{
    await apiPost('/api/drivers', {name, license, category, expiry, contact});
    closeModal('driver-modal');
    toast('Driver added');
    renderDrivers(); renderDashboard();
  }catch(err){
    errBox.innerHTML = `<div class="callout callout-danger">${err.message}</div>`;
  }
}

/* ======================================================================
   TRIPS
   ====================================================================== */
async function refreshVehicleDropdowns(){
  let avail = [];
  try{ avail = await apiGet('/api/vehicles/available'); }catch(e){ /* ignore */ }
  const opts = v => `<option value="${v.name}">${v.name} — ${v.capacity} kg capacity</option>`;
  const tripSel = document.getElementById('trip-vehicle');
  if(tripSel){ tripSel.innerHTML = avail.length? avail.map(opts).join('') : `<option value="">No vehicles available</option>`; }

  let allVehicles = STATE.vehicles;
  if(!allVehicles.length){ try{ allVehicles = await apiGet('/api/vehicles'); STATE.vehicles = allVehicles; }catch(e){ allVehicles = []; } }
  const maintSel = document.getElementById('maint-vehicle');
  if(maintSel){ maintSel.innerHTML = allVehicles.filter(v=>v.status!=='Retired').map(v=>`<option value="${v.name}">${v.name} (${v.status})</option>`).join(''); }
  const fuelSel = document.getElementById('mf-vehicle');
  if(fuelSel){ fuelSel.innerHTML = allVehicles.map(v=>`<option value="${v.name}">${v.name}</option>`).join(''); }
}
async function refreshDriverDropdowns(){
  let avail = [];
  try{ avail = await apiGet('/api/drivers/available'); }catch(e){ /* ignore */ }
  const sel = document.getElementById('trip-driver');
  if(sel){ sel.innerHTML = avail.length? avail.map(d=>`<option value="${d.name}">${d.name}</option>`).join('') : `<option value="">No drivers available</option>`; }
}

function validateTripForm(){
  const vehName = document.getElementById('trip-vehicle').value;
  const cargo = Number(document.getElementById('trip-cargo').value)||0;
  const box = document.getElementById('trip-validation');
  const btn = document.getElementById('trip-dispatch-btn');
  const veh = STATE.vehicles.find(v=>v.name===vehName);
  if(!veh){ box.innerHTML=''; btn.disabled = true; return false; }
  if(cargo > veh.capacity){
    box.innerHTML = `<div class="callout callout-danger">Vehicle Capacity: ${veh.capacity} kg<br>Cargo Weight: ${cargo} kg<br>❌ Capacity exceeded by ${cargo-veh.capacity} kg — dispatch blocked</div>`;
    btn.disabled = true;
    return false;
  }
  box.innerHTML = cargo ? `<div class="callout callout-ok">✔ Cargo ${cargo} kg ≤ capacity ${veh.capacity} kg — ready to dispatch</div>` : '';
  btn.disabled = false;
  return true;
}
function collectTripForm(){
  return {
    source: document.getElementById('trip-source').value.trim(),
    dest: document.getElementById('trip-dest').value.trim(),
    vehicle: document.getElementById('trip-vehicle').value,
    driver: document.getElementById('trip-driver').value,
    cargo: Number(document.getElementById('trip-cargo').value)||0,
    distance: Number(document.getElementById('trip-distance').value)||0,
  };
}
async function resetTripForm(){
  ['trip-source','trip-dest','trip-cargo','trip-distance'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('trip-validation').innerHTML='';
  await refreshVehicleDropdowns(); await refreshDriverDropdowns();
}
async function saveTripDraft(){
  if(pagePermission('trips') !== 'full'){ toast('Your role has view-only access to Trips', true); return; }
  const f = collectTripForm();
  if(!f.source || !f.dest){ toast('Source and Destination are required', true); return; }
  try{
    await apiPost('/api/trips/draft', f);
    toast('Trip saved as draft');
    await resetTripForm(); renderTrips();
  }catch(err){ toast(err.message, true); }
}
async function dispatchTrip(){
  if(pagePermission('trips') !== 'full'){ toast('Your role has view-only access to Trips', true); return; }
  const f = collectTripForm();
  if(!f.source || !f.dest){ toast('Source and Destination are required', true); return; }
  try{
    await apiPost('/api/trips/dispatch', f);
    toast('Trip dispatched — vehicle & driver set to On Trip');
    await resetTripForm(); renderTrips(); renderFleet(); renderDrivers(); renderDashboard();
  }catch(err){ toast(err.message, true); }
}
let completingTripId = null;
function completeTrip(id){
  completingTripId = id;
  document.getElementById('ct-odometer').value='';
  document.getElementById('ct-liters').value='';
  document.getElementById('ct-fuelcost').value='';
  openModal('complete-modal');
}
async function confirmCompleteTrip(){
  const odometer = Number(document.getElementById('ct-odometer').value)||0;
  const liters = Number(document.getElementById('ct-liters').value)||0;
  const fuelCost = Number(document.getElementById('ct-fuelcost').value)||0;
  try{
    await apiPost(`/api/trips/${encodeURIComponent(completingTripId)}/complete`, {odometer, liters, fuelCost});
    closeModal('complete-modal');
    toast('Trip completed — vehicle & driver set to Available');
    renderTrips(); renderFleet(); renderDrivers(); renderDashboard(); renderFuel();
  }catch(err){ toast(err.message, true); }
}
async function cancelTrip(id){
  try{
    await apiPost(`/api/trips/${encodeURIComponent(id)}/cancel`, {});
    toast('Trip cancelled');
    renderTrips(); renderFleet(); renderDrivers(); renderDashboard();
  }catch(err){ toast(err.message, true); }
}
async function renderTrips(){
  let trips;
  try{ trips = await apiGet('/api/trips'); }catch(err){ toast(err.message, true); return; }
  STATE.trips = trips;

  await refreshVehicleDropdowns(); await refreshDriverDropdowns(); validateTripForm();
  const board = document.getElementById('live-board');
  if(!trips.length){
    board.innerHTML = `<div class="empty-state"><div class="em-icon">🗺️</div><p>No trips on the board yet.</p></div>`;
    return;
  }
  const canManageTrips = pagePermission('trips') === 'full';
  board.innerHTML = trips.slice().reverse().map(t=>{
    let actions = '';
    if(canManageTrips && t.status==='Draft') actions = `<button class="btn btn-ghost btn-sm" onclick="cancelTrip('${t.tripCode}')">Cancel</button>`;
    if(canManageTrips && t.status==='Dispatched') actions = `<button class="btn btn-primary btn-sm" onclick="completeTrip('${t.tripCode}')">Complete</button> <button class="btn btn-danger-ghost btn-sm" onclick="cancelTrip('${t.tripCode}')">Cancel</button>`;
    return `<div class="live-board-item">
      <div class="lb-top"><div><div class="lb-id">${t.tripCode}</div><div class="lb-route">${t.source||'—'} → ${t.dest||'—'}</div></div>
      <div class="lb-meta">${t.vehicle||'Unassigned'}${t.driver?' / '+t.driver:''}</div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="status-pill ${statusClass(t.status)}">${t.status}</span>
        <span class="mono" style="font-size:11px;color:var(--text-faint);">${t.eta}</span>
      </div>
      ${actions ? `<div style="margin-top:10px;display:flex;gap:8px;">${actions}</div>` : ''}
    </div>`;
  }).join('');
}

/* ======================================================================
   MAINTENANCE
   ====================================================================== */
async function saveMaintenance(){
  if(pagePermission('maintenance') !== 'full'){ toast('Your role has view-only access to Maintenance', true); return; }
  const vehicle = document.getElementById('maint-vehicle').value;
  const service = document.getElementById('maint-service').value.trim();
  const cost = Number(document.getElementById('maint-cost').value)||0;
  const date = document.getElementById('maint-date').value || new Date().toISOString().slice(0,10);
  if(!vehicle || !service){ toast('Vehicle and Service Type are required', true); return; }
  try{
    await apiPost('/api/maintenance', {vehicle, service, cost, date});
    toast(`${vehicle} moved to In Shop`);
    ['maint-service','maint-cost','maint-date'].forEach(id=>document.getElementById(id).value='');
    renderMaintenance(); renderFleet(); renderDashboard();
  }catch(err){ toast(err.message, true); }
}
async function closeMaintenance(id){
  if(pagePermission('maintenance') !== 'full'){ toast('Your role has view-only access to Maintenance', true); return; }
  try{
    await apiPost(`/api/maintenance/${id}/close`, {});
    toast('Service closed');
    renderMaintenance(); renderFleet(); renderDashboard();
  }catch(err){ toast(err.message, true); }
}
async function renderMaintenance(){
  await refreshVehicleDropdowns();
  let records;
  try{ records = await apiGet('/api/maintenance'); }catch(err){ toast(err.message, true); return; }
  STATE.maintenance = records;

  const tbody = document.getElementById('maint-body');
  if(!records.length){
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="em-icon">🔧</div><p>No service records yet.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = records.slice().reverse().map(m=>`
      <tr><td>${m.vehicle}</td><td>${m.service}</td><td class="mono">${fmtMoney(m.cost)}</td>
      <td><span class="status-pill ${statusClass(m.status)}">${m.status}</span></td>
      <td>${m.status==='In Shop' ? `<button class="btn btn-ghost btn-sm" onclick="closeMaintenance(${m.id})">Close</button>` : ''}</td></tr>
    `).join('');
  }
}

/* ======================================================================
   FUEL & EXPENSES
   ====================================================================== */
async function openFuelModal(){
  await refreshVehicleDropdowns();
  document.getElementById('mf-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('mf-liters').value=''; document.getElementById('mf-cost').value='';
  openModal('fuel-modal');
}
async function saveFuelLog(){
  const vehicle = document.getElementById('mf-vehicle').value;
  const date = document.getElementById('mf-date').value;
  const liters = Number(document.getElementById('mf-liters').value)||0;
  const cost = Number(document.getElementById('mf-cost').value)||0;
  if(!vehicle || !liters){ toast('Vehicle and Liters are required', true); return; }
  try{
    await apiPost('/api/fuel', {vehicle, date, liters, cost});
    closeModal('fuel-modal'); toast('Fuel log added'); renderFuel();
  }catch(err){ toast(err.message, true); }
}
async function openExpenseModal(){
  let trips = STATE.trips;
  if(!trips.length){ try{ trips = await apiGet('/api/trips'); STATE.trips = trips; }catch(e){ trips = []; } }
  const sel = document.getElementById('me-trip');
  sel.innerHTML = trips.map(t=>`<option value="${t.tripCode}">${t.tripCode} (${t.vehicle||'—'})</option>`).join('');
  document.getElementById('me-toll').value=''; document.getElementById('me-other').value='';
  openModal('expense-modal');
}
async function saveExpense(){
  const tripCode = document.getElementById('me-trip').value;
  const toll = Number(document.getElementById('me-toll').value)||0;
  const other = Number(document.getElementById('me-other').value)||0;
  try{
    await apiPost('/api/expenses', {trip: tripCode, toll, other});
    closeModal('expense-modal'); toast('Expense added'); renderFuel();
  }catch(err){ toast(err.message, true); }
}
function maintCostFor(vehicle){
  return STATE.maintenance.filter(m=>m.vehicle===vehicle).reduce((s,m)=>s+m.cost,0);
}
function fuelCostFor(vehicle){
  return STATE.fuel.filter(f=>f.vehicle===vehicle).reduce((s,f)=>s+f.cost,0);
}
async function renderFuel(){
  const canEdit = pagePermission('fuel') === 'full';
  document.querySelectorAll('#page-fuel .page-head-actions .btn').forEach(b=> b.style.display = canEdit ? 'inline-flex' : 'none');

  let fuel, expenses, maintenance;
  try{
    [fuel, expenses, maintenance] = await Promise.all([apiGet('/api/fuel'), apiGet('/api/expenses'), apiGet('/api/maintenance')]);
  }catch(err){ toast(err.message, true); return; }
  STATE.fuel = fuel; STATE.expenses = expenses; STATE.maintenance = maintenance;

  const fb = document.getElementById('fuel-body');
  fb.innerHTML = fuel.length ? fuel.slice().reverse().map(f=>`
    <tr><td>${f.vehicle}</td><td class="mono">${f.date}</td><td class="mono">${f.liters} L</td><td class="mono">${fmtMoney(f.cost)}</td></tr>
  `).join('') : `<tr><td colspan="4"><div class="empty-state"><div class="em-icon">⛽</div><p>No fuel logs yet.</p></div></td></tr>`;

  const eb = document.getElementById('expense-body');
  eb.innerHTML = expenses.length ? expenses.map(e=>{
    const maint = maintCostFor(e.vehicle);
    const total = e.toll + e.other + maint;
    return `<tr><td class="mono">${e.trip}</td><td>${e.vehicle||'—'}</td><td class="mono">${fmtMoney(e.toll)}</td><td class="mono">${fmtMoney(e.other)}</td><td class="mono">${fmtMoney(maint)}</td><td class="mono" style="color:var(--amber)">${fmtMoney(total)}</td></tr>`;
  }).join('') : `<tr><td colspan="6"><div class="empty-state"><div class="em-icon">🧾</div><p>No expenses logged yet.</p></div></td></tr>`;

  const totalFuel = fuel.reduce((s,f)=>s+f.cost,0);
  const totalMaint = maintenance.reduce((s,m)=>s+m.cost,0);
  document.getElementById('total-op-cost').textContent = fmtMoney(totalFuel+totalMaint);
}

/* ======================================================================
   ANALYTICS
   ====================================================================== */
async function renderAnalytics(){
  let a;
  try{ a = await apiGet('/api/analytics/summary'); }catch(err){ toast(err.message, true); return; }
  STATE.analytics = a;

  document.getElementById('analytics-kpis').innerHTML = [
    ['Fuel Efficiency', a.fuelEfficiencyKmPerL+' km/L',''],
    ['Fleet Utilization', a.fleetUtilizationPct+'%','c-green'],
    ['Operational Cost', fmtMoney(a.operationalCost),'c-amber'],
    ['Vehicle ROI', a.vehicleRoiPct+'%','c-green'],
  ].map(([l,v,c])=>`<div class="kpi ${c}"><div class="k-label">${l}</div><div class="k-val">${v}</div></div>`).join('');

  const months = a.monthlyRevenueTrend.months;
  const seed = a.monthlyRevenueTrend.values;
  const max = Math.max(...seed);
  document.getElementById('revenue-bars').innerHTML = months.map((m,i)=>`
    <div class="bar-col"><div class="bar-fill" style="height:${(seed[i]/max)*100}%"></div><div class="bar-label">${m}</div></div>
  `).join('');

  const costliest = a.costliestVehicles || [];
  const cmax = Math.max(1, ...costliest.map(c=>c.cost));
  document.getElementById('costliest-vehicles').innerHTML = costliest.map(c=>`
    <div class="hbar-row"><div class="hbar-top"><span>${c.name}</span><span class="mono">${fmtMoney(c.cost)}</span></div>
    <div class="hbar-track"><div class="hbar-fill" style="width:${(c.cost/cmax)*100}%"></div></div></div>
  `).join('') || `<div class="empty-state"><p>No cost data yet.</p></div>`;
}

/* ======================================================================
   CSV EXPORT
   ====================================================================== */
function toCSV(rows){
  return rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
}
function downloadCSV(filename, csv){
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportCSV(kind){
  let rows, filename;
  if(kind==='vehicles'){
    rows = [['Reg No','Name','Type','Capacity','Odometer','Acq Cost','Status'], ...STATE.vehicles.map(v=>[v.reg,v.name,v.type,v.capacity,v.odometer,v.cost,v.status])];
    filename = 'vehicles.csv';
  } else if(kind==='drivers'){
    rows = [['Name','License','Category','Expiry','Contact','Trip Completion','Status'], ...STATE.drivers.map(d=>[d.name,d.license,d.category,d.expiry,d.contact,d.tripCompletion,d.status])];
    filename = 'drivers.csv';
  } else {
    const a = STATE.analytics || {};
    rows = [['Metric','Value'],
      ['Fuel Efficiency (km/L)', a.fuelEfficiencyKmPerL ?? ''],
      ['Total Operational Cost', fmtMoney(a.operationalCost)],
    ];
    filename = 'analytics.csv';
  }
  downloadCSV(filename, toCSV(rows));
  toast('CSV exported');
}

/* ======================================================================
   GLOBAL SEARCH (simple client-side filter across cached data)
   ====================================================================== */
async function handleGlobalSearch(q){
  q = q.trim().toLowerCase();
  if(!q) return;
  let vehicles = STATE.vehicles, drivers = STATE.drivers, trips = STATE.trips;
  if(!vehicles.length) try{ vehicles = await apiGet('/api/vehicles'); }catch(e){}
  if(!drivers.length) try{ drivers = await apiGet('/api/drivers'); }catch(e){}
  if(!trips.length) try{ trips = await apiGet('/api/trips'); }catch(e){}

  if(vehicles.some(v=>v.reg.toLowerCase().includes(q)||v.name.toLowerCase().includes(q))){
    document.getElementById('fleet-f-search').value = q;
    navigate('fleet');
  } else if(drivers.some(d=>d.name.toLowerCase().includes(q)||d.license.toLowerCase().includes(q))){
    navigate('drivers');
  } else if(trips.some(t=>t.tripCode.toLowerCase().includes(q))){
    navigate('trips');
  }
}

/* ======================================================================
   THEME
   ====================================================================== */
function toggleTheme(){
  const html = document.documentElement;
  const sw = document.getElementById('theme-switch');
  const isLight = html.getAttribute('data-theme') === 'light';
  if(isLight){ html.removeAttribute('data-theme'); sw.classList.add('on'); }
  else { html.setAttribute('data-theme','light'); sw.classList.remove('on'); }
}

window.addEventListener('resize', ()=>{
  document.getElementById('mobile-nav-btn').style.display = window.innerWidth <= 860 ? 'inline-flex' : 'none';
});
