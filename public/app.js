// app.js — Indian Railway NTES Frontend Logic
const API = '';  // same origin

// ── Clock ──────────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const opts = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  document.getElementById('header-clock').textContent = now.toLocaleTimeString('en-IN', opts) + ' IST';
}
setInterval(updateClock, 1000);
updateClock();

// ── Tabs ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ── Enter key support ──────────────────────────────────────────────────────
document.getElementById('train-input').addEventListener('keydown', e => e.key === 'Enter' && searchTrain());
document.getElementById('pnr-input').addEventListener('keydown', e => e.key === 'Enter' && searchPNR());
document.getElementById('station-input').addEventListener('keydown', e => e.key === 'Enter' && searchStation());
document.getElementById('from-input').addEventListener('keydown', e => e.key === 'Enter' && searchBetween());
document.getElementById('to-input').addEventListener('keydown', e => e.key === 'Enter' && searchBetween());

// ── Utility Helpers ────────────────────────────────────────────────────────
function showLoading(el) {
  document.getElementById(el).innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <span>Fetching live data...</span>
    </div>`;
}

function showError(el, msg) {
  document.getElementById(el).innerHTML = `
    <div class="error-card">
      <div class="error-icon">⚠️</div>
      <div>
        <div class="error-title">Not Found</div>
        <div class="error-msg">${msg}</div>
      </div>
    </div>`;
}

function fmtTime(t) {
  if (!t) return '—';
  return `<span class="time-cell">${t}</span>`;
}

function calcDelay(delayMin) {
  if (delayMin === 0 || delayMin == null) return '<span class="status-on-time">On Time ✓</span>';
  if (delayMin <= 15) return `<span class="status-slight">+${delayMin} min</span>`;
  return `<span class="status-late">+${delayMin} min ⚠</span>`;
}

function getTypeBadge(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('rajdhani')) return `<span class="train-type-badge type-rajdhani">Rajdhani</span>`;
  if (t.includes('shatabdi')) return `<span class="train-type-badge type-shatabdi">Shatabdi</span>`;
  if (t.includes('duronto')) return `<span class="train-type-badge type-duronto">Duronto</span>`;
  if (t.includes('superfast')) return `<span class="train-type-badge type-superfast">Superfast</span>`;
  return `<span class="train-type-badge type-default">${type}</span>`;
}

function timeDiff(t1, t2) {
  if (!t1 || !t2) return '—';
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60;
  const hh = Math.floor(diff / 60), mm = diff % 60;
  return `${hh}h ${mm}m`;
}

// Quick search helpers
function quickTrain(num) { document.getElementById('train-input').value = num; searchTrain(); }
function quickPNR(pnr) { document.getElementById('pnr-input').value = pnr; searchPNR(); }
function quickStation(code) { document.getElementById('station-input').value = code; searchStation(); }
function quickBetween(from, to) {
  document.getElementById('from-input').value = from;
  document.getElementById('to-input').value = to;
  searchBetween();
}
function swapStations() {
  const f = document.getElementById('from-input').value;
  const t = document.getElementById('to-input').value;
  document.getElementById('from-input').value = t;
  document.getElementById('to-input').value = f;
}

// ── TRAIN STATUS ──────────────────────────────────────────────────────────
async function searchTrain() {
  const num = document.getElementById('train-input').value.trim();
  if (!num) { alert('Please enter a train number.'); return; }
  showLoading('train-result');
  try {
    const res = await fetch(`${API}/api/train/${num}`);
    const json = await res.json();
    if (!json.success) { showError('train-result', json.message); return; }
    renderTrainStatus(json.data);
  } catch (e) {
    showError('train-result', 'Server error. Make sure the server is running.');
  }
}

function renderTrainStatus({ train, schedule, currentStopIndex }) {
  const totalStops = schedule.length;
  const stoppedAt = currentStopIndex + 1;
  const pct = totalStops > 1 ? Math.round((stoppedAt / (totalStops - 1)) * 100) : 0;
  const clampedPct = Math.min(pct, 95);

  const currentDelay = currentStopIndex >= 0
    ? schedule[currentStopIndex].delay_depart_min || schedule[currentStopIndex].delay_arrival_min
    : 0;

  let statusMsg = '🟡 Status Unavailable';
  if (currentStopIndex < 0) statusMsg = '🔵 Yet to Depart from Source';
  else if (currentStopIndex === totalStops - 1) statusMsg = '🟢 Train Arrived at Destination';
  else if (currentDelay === 0) statusMsg = `🟢 Running On Time — Last passed ${schedule[currentStopIndex].station_name}`;
  else statusMsg = `🔴 Running ${currentDelay} min Late — Last passed ${schedule[currentStopIndex].station_name}`;

  const rows = schedule.map((s, i) => {
    let rowClass = 'future-row';
    let stopHtml = `<span class="stop-num">${s.stop_number}</span>`;
    let statusHtml = `<span class="status-upcoming">Upcoming</span>`;
    if (i < currentStopIndex) {
      rowClass = 'passed-row';
      stopHtml = `<span class="stop-num done">✓</span>`;
      statusHtml = s.delay_arrival_min > 0
        ? `<span class="status-slight">+${s.delay_arrival_min} min</span>`
        : `<span class="status-on-time">Passed ✓</span>`;
    } else if (i === currentStopIndex) {
      rowClass = 'current-row';
      stopHtml = `<span class="stop-num now">●</span>`;
      statusHtml = `<span class="status-current">● HERE NOW</span>`;
    }
    const platHtml = s.platform_number
      ? `<span class="platform-badge">PF ${s.platform_number}</span>`
      : '—';
    return `
      <tr class="${rowClass}">
        <td>${stopHtml}</td>
        <td>
          <span class="station-code-td">${s.station_code}</span>
          <div style="font-size:0.85rem;font-weight:600;margin-top:4px">${s.station_name}</div>
          <div style="font-size:0.75rem;color:var(--text-3)">${s.city}, ${s.state}</div>
        </td>
        <td>${fmtTime(s.arrival_time)}</td>
        <td>${fmtTime(s.departure_time)}</td>
        <td>${s.distance_km} km</td>
        <td>${s.halt_minutes > 0 ? s.halt_minutes + ' min' : 'Source/Dest'}</td>
        <td>${statusHtml}</td>
        <td>${platHtml}</td>
      </tr>`;
  }).join('');

  document.getElementById('train-result').innerHTML = `
    <div class="result-header">
      <div class="train-info-top">
        <div class="train-number-badge">${train.train_number}</div>
        <div class="train-info-detail">
          <div class="train-name-big">${train.train_name}</div>
          <div class="train-route">
            <span>${train.source_name}</span>
            <span class="route-sep">→</span>
            <span>${train.dest_name}</span>
            &nbsp;${getTypeBadge(train.train_type)}
          </div>
          <div style="margin-top:8px;font-size:0.85rem;color:var(--text-2)">${statusMsg}</div>
        </div>
      </div>
      <div class="progress-section">
        <div class="progress-label">Journey Progress</div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${clampedPct}%"></div>
        </div>
        <div class="progress-stats">
          <span>${train.source_name} (${train.source_code})</span>
          <span style="color:var(--accent);font-weight:600">${clampedPct}% completed</span>
          <span>${train.dest_name} (${train.dest_code})</span>
        </div>
      </div>
    </div>
    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Station</th>
            <th>Arrival</th>
            <th>Departure</th>
            <th>Distance</th>
            <th>Halt</th>
            <th>Status</th>
            <th>Platform</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── PNR STATUS ────────────────────────────────────────────────────────────
async function searchPNR() {
  const pnr = document.getElementById('pnr-input').value.trim();
  if (!pnr) { alert('Please enter a PNR number.'); return; }
  showLoading('pnr-result');
  try {
    const res = await fetch(`${API}/api/pnr/${pnr}`);
    const json = await res.json();
    if (!json.success) { showError('pnr-result', json.message); return; }
    renderPNR(json.data);
  } catch (e) {
    showError('pnr-result', 'Server error. Make sure the server is running.');
  }
}

function renderPNR({ booking, passengers, departureTime, arrivalTime }) {
  const allCNF = passengers.every(p => p.booking_status === 'CNF');
  const overallStatus = allCNF ? '🟢 CONFIRMED' : passengers.some(p => p.booking_status.startsWith('WL')) ? '🔴 WAITLIST' : '🟡 RAC';

  const paxRows = passengers.map((p, i) => {
    const statusClass = p.booking_status === 'CNF' ? 'booking-cnf'
      : p.booking_status.startsWith('RAC') ? 'booking-rac' : 'booking-wl';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.age} / ${p.gender}</td>
        <td>${p.berth_pref}</td>
        <td>${p.seat_number || '—'}</td>
        <td><span class="${statusClass}">${p.booking_status}</span></td>
      </tr>`;
  }).join('');

  document.getElementById('pnr-result').innerHTML = `
    <div class="pnr-grid">
      <div class="info-card">
        <h3>🎫 Booking Details</h3>
        <div class="info-row"><span class="key">PNR Number</span><span class="value"><code class="pnr-badge" style="font-size:1rem">${booking.pnr}</code></span></div>
        <div class="info-row"><span class="key">Train</span><span class="value">${booking.train_number} — ${booking.train_name}</span></div>
        <div class="info-row"><span class="key">Journey Date</span><span class="value">${booking.journey_date}</span></div>
        <div class="info-row"><span class="key">Class</span><span class="value">${booking.class_name} (${booking.class_code})</span></div>
        <div class="info-row"><span class="key">Coach</span><span class="value">${booking.coach}</span></div>
        <div class="info-row"><span class="key">Total Fare</span><span class="value" style="color:var(--gold)">₹${booking.total_fare.toLocaleString('en-IN')}</span></div>
        <div class="info-row"><span class="key">Booking Date</span><span class="value">${booking.booking_date}</span></div>
      </div>
      <div class="info-card">
        <h3>🚆 Journey Info</h3>
        <div class="info-row"><span class="key">From</span><span class="value">${booking.from_station_name} (${booking.from_code})</span></div>
        <div class="info-row"><span class="key">To</span><span class="value">${booking.to_station_name} (${booking.to_code})</span></div>
        <div class="info-row"><span class="key">Departure</span><span class="value" style="font-family:var(--mono);color:var(--accent)">${departureTime}</span></div>
        <div class="info-row"><span class="key">Arrival</span><span class="value" style="font-family:var(--mono);color:var(--accent)">${arrivalTime}</span></div>
        <div class="info-row"><span class="key">Duration</span><span class="value">${timeDiff(departureTime, arrivalTime)}</span></div>
        <div class="info-row"><span class="key">Overall Status</span><span class="value">${overallStatus}</span></div>
      </div>
    </div>
    <div class="passengers-card">
      <h3>👥 Passenger Details (${passengers.length} passenger${passengers.length > 1 ? 's' : ''})</h3>
      <table class="passenger-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Age/Gender</th>
            <th>Berth Preference</th>
            <th>Seat/Berth</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${paxRows}</tbody>
      </table>
    </div>`;
}

// ── TRAINS BETWEEN ────────────────────────────────────────────────────────
async function searchBetween() {
  const from = document.getElementById('from-input').value.trim().toUpperCase();
  const to = document.getElementById('to-input').value.trim().toUpperCase();
  if (!from || !to) { alert('Please enter both station codes.'); return; }
  if (from === to) { alert('From and To stations cannot be the same.'); return; }
  showLoading('between-result');
  try {
    const res = await fetch(`${API}/api/trains-between?from=${from}&to=${to}`);
    const json = await res.json();
    if (!json.success) { showError('between-result', json.message); return; }
    renderBetween(json.data, from, to);
  } catch (e) {
    showError('between-result', 'Server error. Make sure the server is running.');
  }
}

function renderBetween({ trains, fromStation, toStation, totalTrains }) {
  if (!fromStation || !toStation) {
    showError('between-result', 'One or both station codes not found in the database.');
    return;
  }
  if (totalTrains === 0) {
    showError('between-result', `No direct trains found between ${fromStation.station_name} and ${toStation.station_name}.`);
    return;
  }
  const trainCards = trains.map(t => `
    <div class="train-card">
      <div>
        <div class="tc-number">${t.train_number}</div>
        <div class="tc-name">${t.train_name}</div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
          ${getTypeBadge(t.train_type)}
          <span class="tc-dist">${t.distance_km} km</span>
        </div>
      </div>
      <div class="tc-times">
        <div class="tc-time-item">
          <span class="tc-time-label">Departs</span>
          <span class="tc-time-val" style="color:var(--success)">${t.depart_time || '—'}</span>
        </div>
        <div style="color:var(--text-3);font-size:1.2rem">→</div>
        <div class="tc-time-item">
          <span class="tc-time-label">Arrives</span>
          <span class="tc-time-val" style="color:var(--accent)">${t.arrive_time || '—'}</span>
        </div>
        <div class="tc-time-item" style="margin-left:8px">
          <span class="tc-time-label">Duration</span>
          <span class="tc-dur">${timeDiff(t.depart_time, t.arrive_time)}</span>
        </div>
      </div>
      <div style="margin-left:auto;font-size:0.75rem;color:var(--text-3);white-space:nowrap">
        🗓 ${t.runs_on.split(',').slice(0, 3).join(', ')}...
      </div>
    </div>`).join('');

  document.getElementById('between-result').innerHTML = `
    <div class="between-header">
      <div class="station-pill">
        <span class="code">${fromStation.station_code}</span>
        <span class="name">${fromStation.station_name}</span>
      </div>
      <div class="route-arrow">✈ ─────→ 🚆</div>
      <div class="station-pill">
        <span class="code">${toStation.station_code}</span>
        <span class="name">${toStation.station_name}</span>
      </div>
      <span class="trains-count-badge">${totalTrains} Trains Found</span>
    </div>
    ${trainCards}`;
}

// ── STATION BOARD ─────────────────────────────────────────────────────────
async function searchStation() {
  const code = document.getElementById('station-input').value.trim().toUpperCase();
  if (!code) { alert('Please enter a station code.'); return; }
  showLoading('station-result');
  try {
    const res = await fetch(`${API}/api/station/${code}`);
    const json = await res.json();
    if (!json.success) { showError('station-result', json.message); return; }
    renderStation(json.data);
  } catch (e) {
    showError('station-result', 'Server error. Make sure the server is running.');
  }
}

function renderStation({ station, trains, totalTrains }) {
  const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const rows = trains.map(t => {
    const rowClass = t.has_passed ? 'departed-row' : '';
    const delayHtml = t.has_passed
      ? (t.delay_min > 0 ? `<span class="status-slight">+${t.delay_min} min</span>` : `<span class="status-on-time">On Time ✓</span>`)
      : (t.delay_min > 0 ? `<span class="status-late">+${t.delay_min} min</span>` : `<span class="status-upcoming">Expected On Time</span>`);
    const statusHtml = t.has_passed
      ? `<span style="color:var(--text-3);font-size:0.78rem">Departed</span>`
      : `<span class="status-current" style="font-size:0.78rem">Expected</span>`;

    return `
      <tr class="${rowClass}">
        <td>${fmtTime(t.arrival_time || t.departure_time)}</td>
        <td>${fmtTime(t.departure_time || '—')}</td>
        <td><span class="station-code-td">${t.train_number}</span></td>
        <td>
          <div style="font-weight:600">${t.train_name}</div>
          <div style="font-size:0.75rem;color:var(--text-2)">${t.source_name} → ${t.dest_name}</div>
        </td>
        <td>${getTypeBadge(t.train_type)}</td>
        <td>${delayHtml}</td>
        <td><span class="platform-badge">PF ${t.platform_number}</span></td>
        <td>${statusHtml}</td>
      </tr>`;
  }).join('');

  document.getElementById('station-result').innerHTML = `
    <div class="station-board-header">
      <span class="sb-code">${station.station_code}</span>
      <div class="sb-name">${station.station_name}</div>
      <div class="sb-meta">${station.city}, ${station.state} &nbsp;|&nbsp; Zone: ${station.zone_name}</div>
      <div style="margin-top:8px;font-size:0.78rem;color:rgba(255,255,255,0.5)">${today} — ${totalTrains} trains scheduled</div>
    </div>
    <div class="board-table-wrap">
      <table class="board-table">
        <thead>
          <tr>
            <th>Arrival</th>
            <th>Departure</th>
            <th>Train No.</th>
            <th>Train Name</th>
            <th>Type</th>
            <th>Delay</th>
            <th>Platform</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Load stats from API ──────────────────────────────────────────────────-
async function loadStats() {
  try {
    const [tr, st] = await Promise.all([
      fetch('/api/trains').then(r => r.json()),
      fetch('/api/stations').then(r => r.json()),
    ]);
    if (tr.success) document.getElementById('stat-trains').textContent = tr.data.length + '+';
    if (st.success) document.getElementById('stat-stations').textContent = st.data.length + '+';
  } catch { }
}
loadStats();
