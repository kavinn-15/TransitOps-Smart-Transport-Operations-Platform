/* ======================================================================
   TRANSITOPS — in-memory data layer (no browser storage used)
   ====================================================================== */
const DB = {
  users:[
    {email:'raven.k@transitops.in',  password:'demo123', role:'Dispatcher',        name:'Raven K.'},
    {email:'meera.s@transitops.in',  password:'demo123', role:'Fleet Manager',     name:'Meera S.'},
    {email:'arjun.p@transitops.in',  password:'demo123', role:'Safety Officer',    name:'Arjun P.'},
    {email:'kabir.n@transitops.in',  password:'demo123', role:'Financial Analyst',name:'Kabir N.'},
    {email:'admin@transitops.in',    password:'demo123', role:'Administrator',    name:'Admin User'},
  ],
  vehicles:[
    {reg:'GJ01AB4521', name:'VAN-05',   type:'Van',   capacity:500,  odometer:74000,  cost:620000,  status:'Available'},
    {reg:'GJ01AB9987', name:'TRUCK-11', type:'Truck', capacity:5000, odometer:182000, cost:2450000, status:'On Trip'},
    {reg:'GJ01AB1123', name:'MINI-03',  type:'Mini',  capacity:1000, odometer:66000,  cost:410000,  status:'In Shop'},
    {reg:'GJ01AB0087', name:'VAN-09',   type:'Van',   capacity:750,  odometer:241900, cost:590000,  status:'Retired'},
    {reg:'GJ01AB6541', name:'TRUCK-04', type:'Truck', capacity:4000, odometer:98000,  cost:2100000, status:'Available'},
  ],
  drivers:[
    {name:'Alex',   license:'DL-88213', category:'LMV', expiry:'2028-12-01', contact:'98765xxxxx', tripCompletion:96, status:'Available'},
    {name:'John',   license:'DL-44120', category:'HMV', expiry:'2025-03-01', contact:'98220xxxxx', tripCompletion:81, status:'Suspended'},
    {name:'Priya',  license:'DL-77031', category:'LMV', expiry:'2028-08-01', contact:'99110xxxxx', tripCompletion:99, status:'On Trip'},
    {name:'Suresh', license:'DL-90045', category:'HMV', expiry:'2027-01-01', contact:'97440xxxxx', tripCompletion:88, status:'Off Duty'},
  ],
  trips:[
    {id:'TR001', source:'Gandhinagar Depot',     dest:'Ahmedabad Hub',    vehicle:'VAN-05',   driver:'Alex',   cargo:450, distance:45, status:'Dispatched', eta:'45 min'},
    {id:'TR004', source:'Vatva Industrial Area', dest:'Sanand Warehouse', vehicle:'TRUCK-04', driver:'Suresh', cargo:0,   distance:0,  status:'Draft',      eta:'Awaiting driver'},
    {id:'TR006', source:'Mansa',                 dest:'Kalol Depot',      vehicle:'',         driver:'',       cargo:0,   distance:0,  status:'Cancelled',  eta:'Vehicle went to shop'},
  ],
  maintenance:[
    {vehicle:'VAN-05',   service:'Oil Change',   cost:2500,  date:'2026-07-07', status:'In Shop'},
    {vehicle:'TRUCK-11', service:'Engine Repair',cost:18000, date:'2026-07-06', status:'Completed'},
    {vehicle:'MINI-03',  service:'Tyre Replace', cost:6200,  date:'2026-07-05', status:'In Shop'},
  ],
  fuel:[
    {vehicle:'VAN-05',   date:'2026-07-05', liters:42,  cost:3150},
    {vehicle:'TRUCK-11', date:'2026-07-06', liters:110, cost:8400},
    {vehicle:'MINI-03',  date:'2026-07-06', liters:28,  cost:2050},
  ],
  expenses:[
    {trip:'TR001', vehicle:'VAN-05',   toll:120, other:0},
    {trip:'TR002', vehicle:'TRUCK-11', toll:340, other:150},
  ],
  tripSeq: 7,
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

/* Page permissions: full = edit access, view = read-only, none = hidden */
/* Every role can SEE every page (nav items are never hidden); 'full' = can create/edit/change
   status on that page, 'view' = read-only (forms disabled, action buttons hidden). This mirrors
   the RBAC matrix on the Settings page while still letting every nav item render dynamically. */
const PERMS = {
  'Fleet Manager':      {dashboard:'full', fleet:'full', drivers:'full', trips:'view', maintenance:'full', fuel:'view',  analytics:'full', settings:'view'},
  'Dispatcher':         {dashboard:'full', fleet:'view', drivers:'view', trips:'full', maintenance:'view', fuel:'view',  analytics:'view', settings:'view'},
  'Safety Officer':     {dashboard:'full', fleet:'view', drivers:'full', trips:'view', maintenance:'view', fuel:'view',  analytics:'view', settings:'view'},
  'Financial Analyst':  {dashboard:'full', fleet:'view', drivers:'view', trips:'view', maintenance:'view', fuel:'full',  analytics:'full', settings:'view'},
  'Administrator':      {dashboard:'full', fleet:'full', drivers:'full', trips:'full', maintenance:'full', fuel:'full',  analytics:'full', settings:'full'},
};

let currentUser = null;

/* ======================================================================
   AUTH
   ====================================================================== */
document.getElementById('login-form').addEventListener('submit', function(e){
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-password').value;
  const role  = document.getElementById('login-role').value;
  const errBox = document.getElementById('login-error');

  const user = DB.users.find(u => u.email.toLowerCase() === email && u.password === pass);
  if(!user){
    errBox.style.display='block';
    errBox.textContent = 'Invalid email or password.';
    return;
  }
  if(user.role !== role){
    errBox.style.display='block';
    errBox.textContent = `This account is registered as "${user.role}", not "${role}". Select the correct role to continue.`;
    return;
  }
  errBox.style.display='none';
  currentUser = user;
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').classList.add('active');
  initShell();
  navigate('dashboard');
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

  // responsive burger
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

  // toggle add buttons
  const editableIds = {
    fleet:['fleet-add-btn'],
    drivers:['drivers-add-btn'],
  };
  (editableIds[pageId]||[]).forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.style.display = isView ? 'none' : 'inline-flex';
  });

  // disable Maintenance "Log Service Record" form for view-only roles
  if(pageId === 'maintenance'){
    ['maint-vehicle','maint-service','maint-cost','maint-date','maint-save-btn'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.disabled = isView;
    });
    toggleLockNote('maintenance', isView, 'View-only access — you can see service records but cannot log or close them with this role.');
  }

  // disable Trip "Create Trip" form for view-only roles
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
function statusClass(s){
  return 'st-' + s.toLowerCase().replace(/\s+/g,'');
}
function isLicenseExpired(driver){ return new Date(driver.expiry) < new Date('2026-07-12'); }
function driverAssignable(d){ return d.status === 'Available' && !isLicenseExpired(d); }
function vehicleAssignable(v){ return v.status === 'Available'; }

/* ======================================================================
   DASHBOARD
   ====================================================================== */
function renderDashboard(){
  const type = document.getElementById('dash-f-type').value;
  const status = document.getElementById('dash-f-status').value;
  let vehicles = DB.vehicles.filter(v=>
    (type==='All'||v.type===type) && (status==='All'||v.status===status)
  );

  const active = DB.vehicles.filter(v=>v.status!=='Retired').length;
  const available = DB.vehicles.filter(v=>v.status==='Available').length;
  const inMaint = DB.vehicles.filter(v=>v.status==='In Shop').length;
  const activeTrips = DB.trips.filter(t=>t.status==='Dispatched').length;
  const pendingTrips = DB.trips.filter(t=>t.status==='Draft').length;
  const driversOnDuty = DB.drivers.filter(d=>d.status==='Available'||d.status==='On Trip').length;
  const onTrip = DB.vehicles.filter(v=>v.status==='On Trip').length;
  const utilization = active ? Math.round((onTrip/active)*100) : 0;

  const kpis = [
    ['Active Vehicles', active, ''],
    ['Available Vehicles', available, 'c-green'],
    ['Vehicles in Maintenance', inMaint, 'c-amber'],
    ['Active Trips', activeTrips, ''],
    ['Pending Trips', pendingTrips, 'c-amber'],
    ['Drivers on Duty', driversOnDuty, ''],
    ['Fleet Utilization', utilization+'%', 'c-green'],
  ];
  document.getElementById('dash-kpis').innerHTML = kpis.map(([label,val,cls])=>
    `<div class="kpi ${cls||''}"><div class="k-label">${label}</div><div class="k-val">${val}</div></div>`
  ).join('');

  const tbody = document.getElementById('dash-trips-body');
  if(!DB.trips.length){
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="em-icon">🛣️</div><p>No trips yet. Create one from the Trips page.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = DB.trips.slice(-4).reverse().map(t=>`
      <tr><td class="mono">${t.id}</td><td>${t.vehicle||'—'}</td><td>${t.driver||'—'}</td>
      <td><span class="status-pill ${statusClass(t.status)}">${t.status}</span></td><td class="mono">${t.eta}</td></tr>
    `).join('');
  }

  const counts = {Available:0,'On Trip':0,'In Shop':0,Retired:0};
  DB.vehicles.forEach(v=>counts[v.status]!==undefined && counts[v.status]++);
  const max = Math.max(1,...Object.values(counts));
  const colorMap = {Available:'var(--success)','On Trip':'var(--info)','In Shop':'var(--warn)',Retired:'var(--danger)'};
  document.getElementById('dash-vehicle-status').innerHTML = Object.entries(counts).map(([k,v])=>`
    <div class="hbar-row"><div class="hbar-top"><span>${k}</span><span class="mono">${v}</span></div>
    <div class="hbar-track"><div class="hbar-fill" style="width:${(v/max)*100}%;background:${colorMap[k]}"></div></div></div>
  `).join('');
}

/* ======================================================================
   FLEET
   ====================================================================== */
function renderFleet(){
  const type = document.getElementById('fleet-f-type').value;
  const status = document.getElementById('fleet-f-status').value;
  const q = document.getElementById('fleet-f-search').value.trim().toLowerCase();
  const rows = DB.vehicles.filter(v=>
    (type==='All'||v.type===type) && (status==='All'||v.status===status) &&
    (!q || v.reg.toLowerCase().includes(q))
  );
  const canEdit = pagePermission('fleet') === 'full';
  const tbody = document.getElementById('fleet-body');
  if(!rows.length){
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="em-icon">🚐</div><p>No vehicles match these filters.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = rows.map(v=>`
      <tr>
        <td class="mono">${v.reg}</td><td>${v.name}</td><td>${v.type}</td>
        <td class="mono">${v.capacity} kg</td><td class="mono">${v.odometer.toLocaleString()}</td>
        <td class="mono">${fmtMoney(v.cost)}</td>
        <td><span class="status-pill ${statusClass(v.status)}">${v.status}</span></td>
        <td>${canEdit ? `<select onchange="setVehicleStatus('${v.reg}', this.value)" style="background:var(--panel-2);border:1px solid var(--line);color:var(--text);border-radius:6px;padding:5px 7px;font-size:11.5px;">
              ${['Available','On Trip','In Shop','Retired'].map(s=>`<option ${s===v.status?'selected':''}>${s}</option>`).join('')}
            </select>` : ''}</td>
      </tr>
    `).join('');
  }
  refreshVehicleDropdowns();
}
function setVehicleStatus(reg, status){
  const v = DB.vehicles.find(v=>v.reg===reg);
  if(v){ v.status = status; toast(`${v.name} set to ${status}`); renderFleet(); renderDashboard(); }
}
function openVehicleModal(){
  document.getElementById('mv-error').innerHTML='';
  ['mv-reg','mv-name','mv-capacity','mv-odometer','mv-cost'].forEach(id=>document.getElementById(id).value='');
  openModal('vehicle-modal');
}
function saveVehicle(){
  const reg = document.getElementById('mv-reg').value.trim().toUpperCase();
  const name = document.getElementById('mv-name').value.trim();
  const type = document.getElementById('mv-type').value;
  const capacity = Number(document.getElementById('mv-capacity').value);
  const odometer = Number(document.getElementById('mv-odometer').value)||0;
  const cost = Number(document.getElementById('mv-cost').value)||0;
  const errBox = document.getElementById('mv-error');

  if(!reg || !name || !capacity){
    errBox.innerHTML = `<div class="callout callout-danger">Registration No., Name and Capacity are required.</div>`; return;
  }
  if(DB.vehicles.some(v=>v.reg.toUpperCase()===reg)){
    errBox.innerHTML = `<div class="callout callout-danger">Registration No. must be unique — "${reg}" already exists.</div>`; return;
  }
  DB.vehicles.push({reg,name,type,capacity,odometer,cost,status:'Available'});
  closeModal('vehicle-modal');
  toast('Vehicle added');
  renderFleet(); renderDashboard();
}

/* ======================================================================
   DRIVERS
   ====================================================================== */
function renderDrivers(){
  const canEdit = pagePermission('drivers') === 'full';
  const tbody = document.getElementById('drivers-body');
  if(!DB.drivers.length){
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="em-icon">🧑‍✈️</div><p>No drivers yet.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = DB.drivers.map(d=>{
      const expired = isLicenseExpired(d);
      return `<tr>
        <td>${d.name}</td><td class="mono">${d.license}</td><td>${d.category}</td>
        <td class="mono" style="color:${expired?'var(--danger)':'var(--text)'}">${d.expiry}${expired?' (expired)':''}</td>
        <td class="mono">${d.contact}</td><td class="mono">${d.tripCompletion}%</td>
        <td><span class="status-pill ${d.tripCompletion>=90?'st-available':(d.tripCompletion>=80?'st-inshop':'st-suspended')}">${d.tripCompletion>=90?'Good':(d.tripCompletion>=80?'Fair':'Poor')}</span></td>
        <td>${canEdit ? `<select onchange="setDriverStatus('${d.license}', this.value)" style="background:var(--panel-2);border:1px solid var(--line);color:var(--text);border-radius:6px;padding:5px 7px;font-size:11.5px;">
              ${['Available','On Trip','Off Duty','Suspended'].map(s=>`<option ${s===d.status?'selected':''}>${s}</option>`).join('')}
            </select>` : `<span class="status-pill ${statusClass(d.status)}">${d.status}</span>`}</td>
      </tr>`;
    }).join('');
  }
  refreshDriverDropdowns();
}
function setDriverStatus(license, status){
  const d = DB.drivers.find(d=>d.license===license);
  if(d){ d.status = status; toast(`${d.name} set to ${status}`); renderDrivers(); renderDashboard(); }
}
function openDriverModal(){
  document.getElementById('md-error').innerHTML='';
  ['md-name','md-license','md-expiry','md-contact'].forEach(id=>document.getElementById(id).value='');
  openModal('driver-modal');
}
function saveDriver(){
  const name = document.getElementById('md-name').value.trim();
  const license = document.getElementById('md-license').value.trim().toUpperCase();
  const category = document.getElementById('md-category').value;
  const expiry = document.getElementById('md-expiry').value;
  const contact = document.getElementById('md-contact').value.trim();
  const errBox = document.getElementById('md-error');
  if(!name || !license || !expiry){
    errBox.innerHTML = `<div class="callout callout-danger">Name, License No. and Expiry are required.</div>`; return;
  }
  if(DB.drivers.some(d=>d.license.toUpperCase()===license)){
    errBox.innerHTML = `<div class="callout callout-danger">License No. "${license}" already exists.</div>`; return;
  }
  DB.drivers.push({name,license,category,expiry,contact:contact||'—',tripCompletion:0,status:'Available'});
  closeModal('driver-modal');
  toast('Driver added');
  renderDrivers(); renderDashboard();
}

/* ======================================================================
   TRIPS
   ====================================================================== */
function refreshVehicleDropdowns(){
  const avail = DB.vehicles.filter(vehicleAssignable);
  const opts = v => `<option value="${v.name}">${v.name} — ${v.capacity} kg capacity</option>`;
  const tripSel = document.getElementById('trip-vehicle');
  if(tripSel){ tripSel.innerHTML = avail.length? avail.map(opts).join('') : `<option value="">No vehicles available</option>`; }
  const maintSel = document.getElementById('maint-vehicle');
  if(maintSel){ maintSel.innerHTML = DB.vehicles.filter(v=>v.status!=='Retired').map(v=>`<option value="${v.name}">${v.name} (${v.status})</option>`).join(''); }
  const fuelSel = document.getElementById('mf-vehicle');
  if(fuelSel){ fuelSel.innerHTML = DB.vehicles.map(v=>`<option value="${v.name}">${v.name}</option>`).join(''); }
}
function refreshDriverDropdowns(){
  const avail = DB.drivers.filter(driverAssignable);
  const sel = document.getElementById('trip-driver');
  if(sel){ sel.innerHTML = avail.length? avail.map(d=>`<option value="${d.name}">${d.name}</option>`).join('') : `<option value="">No drivers available</option>`; }
}

function validateTripForm(){
  const vehName = document.getElementById('trip-vehicle').value;
  const cargo = Number(document.getElementById('trip-cargo').value)||0;
  const box = document.getElementById('trip-validation');
  const btn = document.getElementById('trip-dispatch-btn');
  const veh = DB.vehicles.find(v=>v.name===vehName);
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
function resetTripForm(){
  ['trip-source','trip-dest','trip-cargo','trip-distance'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('trip-validation').innerHTML='';
  refreshVehicleDropdowns(); refreshDriverDropdowns();
}
function nextTripId(){
  return 'TR' + String(DB.tripSeq++).padStart(3,'0');
}
function saveTripDraft(){
  if(pagePermission('trips') !== 'full'){ toast('Your role has view-only access to Trips', true); return; }
  const f = collectTripForm();
  if(!f.source || !f.dest){ toast('Source and Destination are required', true); return; }
  DB.trips.push({id:nextTripId(), ...f, status:'Draft', eta:'Awaiting dispatch'});
  toast('Trip saved as draft');
  resetTripForm(); renderTrips();
}
function dispatchTrip(){
  if(pagePermission('trips') !== 'full'){ toast('Your role has view-only access to Trips', true); return; }
  const f = collectTripForm();
  if(!f.source || !f.dest){ toast('Source and Destination are required', true); return; }
  const veh = DB.vehicles.find(v=>v.name===f.vehicle);
  const drv = DB.drivers.find(d=>d.name===f.driver);
  if(!veh || !vehicleAssignable(veh)){ toast('Selected vehicle is not available', true); return; }
  if(!drv || !driverAssignable(drv)){ toast('Selected driver is not available or license expired/suspended', true); return; }
  if(f.cargo > veh.capacity){ toast('Cargo exceeds vehicle capacity — dispatch blocked', true); return; }

  veh.status = 'On Trip'; drv.status = 'On Trip';
  DB.trips.push({id:nextTripId(), ...f, status:'Dispatched', eta: Math.max(10, Math.round(f.distance*1.4))+' min'});
  toast('Trip dispatched — vehicle & driver set to On Trip');
  resetTripForm(); renderTrips(); renderFleet(); renderDrivers(); renderDashboard();
}
let completingTripId = null;
function completeTrip(id){
  completingTripId = id;
  document.getElementById('ct-odometer').value='';
  document.getElementById('ct-liters').value='';
  document.getElementById('ct-fuelcost').value='';
  openModal('complete-modal');
}
function confirmCompleteTrip(){
  const trip = DB.trips.find(t=>t.id===completingTripId);
  if(!trip) return;
  const odometer = Number(document.getElementById('ct-odometer').value);
  const liters = Number(document.getElementById('ct-liters').value)||0;
  const cost = Number(document.getElementById('ct-fuelcost').value)||0;
  const veh = DB.vehicles.find(v=>v.name===trip.vehicle);
  const drv = DB.drivers.find(d=>d.name===trip.driver);
  if(veh){ if(odometer) veh.odometer = odometer; veh.status='Available'; }
  if(drv){ drv.status='Available'; }
  if(veh && liters){ DB.fuel.push({vehicle:veh.name, date:new Date().toISOString().slice(0,10), liters, cost}); }
  trip.status='Completed'; trip.eta='—';
  closeModal('complete-modal');
  toast('Trip completed — vehicle & driver set to Available');
  renderTrips(); renderFleet(); renderDrivers(); renderDashboard(); renderFuel();
}
function cancelTrip(id){
  const trip = DB.trips.find(t=>t.id===id);
  if(!trip) return;
  if(trip.status==='Dispatched'){
    const veh = DB.vehicles.find(v=>v.name===trip.vehicle);
    const drv = DB.drivers.find(d=>d.name===trip.driver);
    if(veh) veh.status='Available';
    if(drv) drv.status='Available';
  }
  trip.status='Cancelled'; trip.eta='Cancelled';
  toast('Trip cancelled');
  renderTrips(); renderFleet(); renderDrivers(); renderDashboard();
}
function renderTrips(){
  refreshVehicleDropdowns(); refreshDriverDropdowns(); validateTripForm();
  const board = document.getElementById('live-board');
  if(!DB.trips.length){
    board.innerHTML = `<div class="empty-state"><div class="em-icon">🗺️</div><p>No trips on the board yet.</p></div>`;
    return;
  }
  const canManageTrips = pagePermission('trips') === 'full';
  board.innerHTML = DB.trips.slice().reverse().map(t=>{
    const stageOrder = ['Draft','Dispatched','Completed'];
    let actions = '';
    if(canManageTrips && t.status==='Draft') actions = `<button class="btn btn-ghost btn-sm" onclick="cancelTrip('${t.id}')">Cancel</button>`;
    if(canManageTrips && t.status==='Dispatched') actions = `<button class="btn btn-primary btn-sm" onclick="completeTrip('${t.id}')">Complete</button> <button class="btn btn-danger-ghost btn-sm" onclick="cancelTrip('${t.id}')">Cancel</button>`;
    return `<div class="live-board-item">
      <div class="lb-top"><div><div class="lb-id">${t.id}</div><div class="lb-route">${t.source||'—'} → ${t.dest||'—'}</div></div>
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
function saveMaintenance(){
  if(pagePermission('maintenance') !== 'full'){ toast('Your role has view-only access to Maintenance', true); return; }
  const vehicle = document.getElementById('maint-vehicle').value;
  const service = document.getElementById('maint-service').value.trim();
  const cost = Number(document.getElementById('maint-cost').value)||0;
  const date = document.getElementById('maint-date').value || new Date().toISOString().slice(0,10);
  if(!vehicle || !service){ toast('Vehicle and Service Type are required', true); return; }
  DB.maintenance.push({vehicle, service, cost, date, status:'In Shop'});
  const v = DB.vehicles.find(v=>v.name===vehicle);
  if(v && v.status !== 'Retired') v.status = 'In Shop';
  toast(`${vehicle} moved to In Shop`);
  ['maint-service','maint-cost','maint-date'].forEach(id=>document.getElementById(id).value='');
  renderMaintenance(); renderFleet(); renderDashboard();
}
function closeMaintenance(idx){
  if(pagePermission('maintenance') !== 'full'){ toast('Your role has view-only access to Maintenance', true); return; }
  const rec = DB.maintenance[idx];
  rec.status = 'Completed';
  const v = DB.vehicles.find(v=>v.name===rec.vehicle);
  const stillOpen = DB.maintenance.some((m,i)=>i!==idx && m.vehicle===rec.vehicle && m.status==='In Shop');
  if(v && v.status !== 'Retired' && !stillOpen) v.status = 'Available';
  toast(`${rec.vehicle} service closed`);
  renderMaintenance(); renderFleet(); renderDashboard();
}
function renderMaintenance(){
  refreshVehicleDropdowns();
  const tbody = document.getElementById('maint-body');
  if(!DB.maintenance.length){
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="em-icon">🔧</div><p>No service records yet.</p></div></td></tr>`;
  } else {
    tbody.innerHTML = DB.maintenance.slice().reverse().map((m)=>{
      const idx = DB.maintenance.indexOf(m);
      return `<tr><td>${m.vehicle}</td><td>${m.service}</td><td class="mono">${fmtMoney(m.cost)}</td>
      <td><span class="status-pill ${statusClass(m.status)}">${m.status}</span></td>
      <td>${m.status==='In Shop' ? `<button class="btn btn-ghost btn-sm" onclick="closeMaintenance(${idx})">Close</button>` : ''}</td></tr>`;
    }).join('');
  }
}

/* ======================================================================
   FUEL & EXPENSES
   ====================================================================== */
function openFuelModal(){
  refreshVehicleDropdowns();
  document.getElementById('mf-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('mf-liters').value=''; document.getElementById('mf-cost').value='';
  openModal('fuel-modal');
}
function saveFuelLog(){
  const vehicle = document.getElementById('mf-vehicle').value;
  const date = document.getElementById('mf-date').value;
  const liters = Number(document.getElementById('mf-liters').value)||0;
  const cost = Number(document.getElementById('mf-cost').value)||0;
  if(!vehicle || !liters){ toast('Vehicle and Liters are required', true); return; }
  DB.fuel.push({vehicle, date, liters, cost});
  closeModal('fuel-modal'); toast('Fuel log added'); renderFuel();
}
function openExpenseModal(){
  const sel = document.getElementById('me-trip');
  sel.innerHTML = DB.trips.map(t=>`<option value="${t.id}">${t.id} (${t.vehicle||'—'})</option>`).join('');
  document.getElementById('me-toll').value=''; document.getElementById('me-other').value='';
  openModal('expense-modal');
}
function saveExpense(){
  const tripId = document.getElementById('me-trip').value;
  const toll = Number(document.getElementById('me-toll').value)||0;
  const other = Number(document.getElementById('me-other').value)||0;
  const trip = DB.trips.find(t=>t.id===tripId);
  DB.expenses.push({trip:tripId, vehicle: trip?trip.vehicle:'—', toll, other});
  closeModal('expense-modal'); toast('Expense added'); renderFuel();
}
function maintCostFor(vehicle){
  return DB.maintenance.filter(m=>m.vehicle===vehicle).reduce((s,m)=>s+m.cost,0);
}
function fuelCostFor(vehicle){
  return DB.fuel.filter(f=>f.vehicle===vehicle).reduce((s,f)=>s+f.cost,0);
}
function renderFuel(){
  const canEdit = pagePermission('fuel') === 'full';
  document.querySelectorAll('#page-fuel .page-head-actions .btn').forEach(b=> b.style.display = canEdit ? 'inline-flex' : 'none');

  const fb = document.getElementById('fuel-body');
  fb.innerHTML = DB.fuel.length ? DB.fuel.slice().reverse().map(f=>`
    <tr><td>${f.vehicle}</td><td class="mono">${f.date}</td><td class="mono">${f.liters} L</td><td class="mono">${fmtMoney(f.cost)}</td></tr>
  `).join('') : `<tr><td colspan="4"><div class="empty-state"><div class="em-icon">⛽</div><p>No fuel logs yet.</p></div></td></tr>`;

  const eb = document.getElementById('expense-body');
  eb.innerHTML = DB.expenses.length ? DB.expenses.map(e=>{
    const maint = maintCostFor(e.vehicle);
    const total = e.toll + e.other + maint;
    return `<tr><td class="mono">${e.trip}</td><td>${e.vehicle}</td><td class="mono">${fmtMoney(e.toll)}</td><td class="mono">${fmtMoney(e.other)}</td><td class="mono">${fmtMoney(maint)}</td><td class="mono" style="color:var(--amber)">${fmtMoney(total)}</td></tr>`;
  }).join('') : `<tr><td colspan="6"><div class="empty-state"><div class="em-icon">🧾</div><p>No expenses logged yet.</p></div></td></tr>`;

  const totalFuel = DB.fuel.reduce((s,f)=>s+f.cost,0);
  const totalMaint = DB.maintenance.reduce((s,m)=>s+m.cost,0);
  document.getElementById('total-op-cost').textContent = fmtMoney(totalFuel+totalMaint);
}

/* ======================================================================
   ANALYTICS
   ====================================================================== */
function renderAnalytics(){
  const totalFuelL = DB.fuel.reduce((s,f)=>s+f.liters,0);
  const totalDistance = DB.trips.filter(t=>t.status==='Completed').reduce((s,t)=>s+t.distance,0) || 320; // fallback illustrative baseline
  const fuelEff = totalFuelL ? (totalDistance/totalFuelL).toFixed(1) : '0.0';

  const activeV = DB.vehicles.filter(v=>v.status!=='Retired').length;
  const onTripV = DB.vehicles.filter(v=>v.status==='On Trip').length;
  const utilization = activeV ? Math.round((onTripV/activeV)*100) : 0;

  const totalFuelCost = DB.fuel.reduce((s,f)=>s+f.cost,0);
  const totalMaintCost = DB.maintenance.reduce((s,m)=>s+m.cost,0);
  const opCost = totalFuelCost + totalMaintCost;

  // illustrative revenue: ₹55/km on completed + dispatched distance
  const revenue = DB.trips.filter(t=>t.status==='Completed'||t.status==='Dispatched').reduce((s,t)=>s+t.distance*55,0) || 42000;
  const totalAcq = DB.vehicles.reduce((s,v)=>s+v.cost,0) || 1;
  const roi = (((revenue-(totalMaintCost+totalFuelCost))/totalAcq)*100).toFixed(1);

  document.getElementById('analytics-kpis').innerHTML = [
    ['Fuel Efficiency', fuelEff+' km/L',''],
    ['Fleet Utilization', utilization+'%','c-green'],
    ['Operational Cost', fmtMoney(opCost),'c-amber'],
    ['Vehicle ROI', roi+'%','c-green'],
  ].map(([l,v,c])=>`<div class="kpi ${c}"><div class="k-label">${l}</div><div class="k-val">${v}</div></div>`).join('');

  const months = ['Feb','Mar','Apr','May','Jun','Jul'];
  const seed = [18,24,21,29,26,33];
  const max = Math.max(...seed);
  document.getElementById('revenue-bars').innerHTML = months.map((m,i)=>`
    <div class="bar-col"><div class="bar-fill" style="height:${(seed[i]/max)*100}%"></div><div class="bar-label">${m}</div></div>
  `).join('');

  const costliest = DB.vehicles.map(v=>({name:v.name, cost: maintCostFor(v.name)+fuelCostFor(v.name)}))
    .sort((a,b)=>b.cost-a.cost).slice(0,4);
  const cmax = Math.max(1,...costliest.map(c=>c.cost));
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
    rows = [['Reg No','Name','Type','Capacity','Odometer','Acq Cost','Status'], ...DB.vehicles.map(v=>[v.reg,v.name,v.type,v.capacity,v.odometer,v.cost,v.status])];
    filename = 'vehicles.csv';
  } else if(kind==='drivers'){
    rows = [['Name','License','Category','Expiry','Contact','Trip Completion','Status'], ...DB.drivers.map(d=>[d.name,d.license,d.category,d.expiry,d.contact,d.tripCompletion,d.status])];
    filename = 'drivers.csv';
  } else {
    rows = [['Metric','Value'],
      ['Fuel Efficiency (km/L)', document.querySelector('#analytics-kpis .kpi .k-val')?.textContent||''],
      ['Total Operational Cost', fmtMoney(DB.fuel.reduce((s,f)=>s+f.cost,0)+DB.maintenance.reduce((s,m)=>s+m.cost,0))],
    ];
    filename = 'analytics.csv';
  }
  downloadCSV(filename, toCSV(rows));
  toast('CSV exported');
}

/* ======================================================================
   GLOBAL SEARCH (simple client-side filter across current page)
   ====================================================================== */
function handleGlobalSearch(q){
  q = q.trim().toLowerCase();
  if(!q) return;
  // jump to fleet if a reg/vehicle matches, else drivers, else trips
  if(DB.vehicles.some(v=>v.reg.toLowerCase().includes(q)||v.name.toLowerCase().includes(q))){
    document.getElementById('fleet-f-search').value = q;
    navigate('fleet');
  } else if(DB.drivers.some(d=>d.name.toLowerCase().includes(q)||d.license.toLowerCase().includes(q))){
    navigate('drivers');
  } else if(DB.trips.some(t=>t.id.toLowerCase().includes(q))){
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
