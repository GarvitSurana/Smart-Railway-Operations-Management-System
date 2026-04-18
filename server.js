// server.js — Indian Railway NTES Backend
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const initSqlJs = require('sql.js');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database', 'railway.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

// ─── Load Database ────────────────────────────────────────────────────────────
async function loadDatabase() {
  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found. Please run: node database/seed.js');
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(fileBuffer);
  console.log('✅ Database loaded successfully');
}

// Helper: run a query and return all rows as objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first row as object
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

// Helper: randomly delay a train to trigger notifications
function simulateRandomDelay() {
  if (!db) return;
  const train = queryOne("SELECT train_number FROM trains ORDER BY RANDOM() LIMIT 1");
  if (!train) return;
  const extraDelay = Math.floor(Math.random() * 40) + 20; // 20-60 mins
  db.run(`
    UPDATE train_running_status
    SET delay_arrival_min = delay_arrival_min + ?,
        delay_depart_min = delay_depart_min + ?
    WHERE train_number = ? AND has_passed = 0
  `, [extraDelay, extraDelay, train.train_number]);
  
  // Persist memory db to file
  const data = Buffer.from(db.export());
  fs.writeFileSync(DB_PATH, data);
}

// Start simulation loop
setInterval(simulateRandomDelay, 60000); // simulate delay every minute

// ─── API ROUTES ───────────────────────────────────────────────────────────────

// GET /api/trains — List all trains
app.get('/api/trains', (req, res) => {
  const trains = queryAll(`
    SELECT t.*, s.station_name AS source_name, d.station_name AS dest_name
    FROM trains t
    JOIN stations s ON t.source_code = s.station_code
    JOIN stations d ON t.dest_code   = d.station_code
    ORDER BY t.train_number
  `);
  res.json({ success: true, data: trains });
});

// GET /api/stations — List all stations
app.get('/api/stations', (req, res) => {
  const stations = queryAll(`
    SELECT s.*, z.zone_name
    FROM stations s
    JOIN zones z ON s.zone_code = z.zone_code
    ORDER BY s.station_name
  `);
  res.json({ success: true, data: stations });
});

// GET /api/search?q=query — Search trains and stations
app.get('/api/search', (req, res) => {
  const q = `%${(req.query.q || '').toUpperCase()}%`;
  const trains = queryAll(`
    SELECT 'train' AS type, train_number AS code, train_name AS name
    FROM trains
    WHERE UPPER(train_number) LIKE ? OR UPPER(train_name) LIKE ?
    LIMIT 10
  `, [q, q]);
  const stations = queryAll(`
    SELECT 'station' AS type, station_code AS code, station_name || ' (' || station_code || ')' AS name
    FROM stations
    WHERE UPPER(station_code) LIKE ? OR UPPER(station_name) LIKE ? OR UPPER(city) LIKE ?
    LIMIT 10
  `, [q, q, q]);
  res.json({ success: true, data: [...trains, ...stations] });
});

// GET /api/train/:number — Train Running Status
app.get('/api/train/:number', (req, res) => {
  const trainNumber = req.params.number.trim();
  const train = queryOne(`
    SELECT t.*, s.station_name AS source_name, d.station_name AS dest_name
    FROM trains t
    JOIN stations s ON t.source_code = s.station_code
    JOIN stations d ON t.dest_code   = d.station_code
    WHERE t.train_number = ?
  `, [trainNumber]);

  if (!train) {
    return res.status(404).json({ success: false, message: 'Train not found' });
  }

  const today = new Date().toISOString().slice(0, 10);

  const schedule = queryAll(`
    SELECT
      ts.stop_number,
      ts.arrival_time,
      ts.departure_time,
      ts.distance_km,
      ts.halt_minutes,
      s.station_code,
      s.station_name,
      s.city,
      s.state,
      COALESCE(rs.delay_arrival_min, 0)  AS delay_arrival_min,
      COALESCE(rs.delay_depart_min,  0)  AS delay_depart_min,
      COALESCE(rs.actual_arrival,    '')  AS actual_arrival,
      COALESCE(rs.actual_departure,  '')  AS actual_departure,
      COALESCE(rs.platform_number,   1)   AS platform_number,
      COALESCE(rs.has_passed,        0)   AS has_passed,
      COALESCE(rs.status_date,       '')  AS status_date
    FROM train_schedules ts
    JOIN stations s ON ts.station_code = s.station_code
    LEFT JOIN train_running_status rs
           ON rs.train_number = ts.train_number
          AND rs.station_code  = ts.station_code
          AND rs.status_date   = ?
    WHERE ts.train_number = ?
    ORDER BY ts.stop_number
  `, [today, trainNumber]);

  if (schedule.length === 0) {
    return res.status(404).json({ success: false, message: 'Schedule not found for this train' });
  }

  // Determine current position
  let currentStopIndex = -1;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].has_passed) currentStopIndex = i;
  }

  res.json({
    success: true,
    data: {
      train,
      schedule,
      currentStopIndex,
      statusDate: today,
    }
  });
});

// GET /api/pnr/:pnr — PNR Status
app.get('/api/pnr/:pnr', (req, res) => {
  const pnr = req.params.pnr.trim();
  const booking = queryOne(`
    SELECT
      p.pnr, p.journey_date, p.coach, p.total_fare, p.booking_date,
      p.class_code, c.class_name,
      t.train_number, t.train_name, t.train_type,
      s1.station_name AS from_station_name, s1.station_code AS from_code,
      s2.station_name AS to_station_name,   s2.station_code AS to_code
    FROM pnr_bookings p
    JOIN trains    t  ON p.train_number = t.train_number
    JOIN stations  s1 ON p.from_station = s1.station_code
    JOIN stations  s2 ON p.to_station   = s2.station_code
    JOIN classes   c  ON p.class_code   = c.class_code
    WHERE p.pnr = ?
  `, [pnr]);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'PNR not found' });
  }

  const passengers = queryAll(`
    SELECT name, age, gender, berth_pref, seat_number, booking_status
    FROM passengers
    WHERE pnr = ?
    ORDER BY id
  `, [pnr]);

  // Get departure/arrival times for journey
  const fromSchedule = queryOne(`
    SELECT departure_time FROM train_schedules
    WHERE train_number = ? AND station_code = ?
  `, [booking.train_number, booking.from_code]);

  const toSchedule = queryOne(`
    SELECT arrival_time FROM train_schedules
    WHERE train_number = ? AND station_code = ?
  `, [booking.train_number, booking.to_code]);

  res.json({
    success: true,
    data: {
      booking,
      passengers,
      departureTime: fromSchedule ? fromSchedule.departure_time : 'N/A',
      arrivalTime:   toSchedule   ? toSchedule.arrival_time     : 'N/A',
    }
  });
});

// GET /api/delayed-passengers — List passengers on delayed trains
app.get('/api/delayed-passengers', (req, res) => {
  const delayedSql = `
    SELECT
      p.name, p.age, p.gender, p.seat_number, p.booking_status, p.pnr,
      pb.train_number, t.train_name, pb.from_station, pb.to_station,
      MAX(rs.delay_arrival_min, rs.delay_depart_min) as max_delay
    FROM passengers p
    JOIN pnr_bookings pb ON p.pnr = pb.pnr
    JOIN trains t ON pb.train_number = t.train_number
    JOIN train_running_status rs ON pb.train_number = rs.train_number AND rs.status_date = pb.journey_date
    WHERE rs.delay_arrival_min > 0 OR rs.delay_depart_min > 0
    GROUP BY p.pnr, p.id
    ORDER BY max_delay DESC
  `;
  const delayedPassengers = queryAll(delayedSql);

  res.json({
    success: true,
    data: delayedPassengers
  });
});

// GET /api/trains-between?from=NDLS&to=HWH&date=2026-03-13
app.get('/api/trains-between', (req, res) => {
  const { from, to, date } = req.query;
  if (!from || !to) {
    return res.status(400).json({ success: false, message: 'from and to station codes required' });
  }

  const trains = queryAll(`
    SELECT
      t.train_number, t.train_name, t.train_type, t.runs_on,
      ts1.departure_time AS depart_time,
      ts2.arrival_time   AS arrive_time,
      ts1.stop_number    AS from_stop,
      ts2.stop_number    AS to_stop,
      (ts2.distance_km - ts1.distance_km) AS distance_km,
      s1.station_name    AS from_name,
      s2.station_name    AS to_name
    FROM train_schedules ts1
    JOIN train_schedules ts2 ON ts1.train_number = ts2.train_number
    JOIN trains  t  ON t.train_number  = ts1.train_number
    JOIN stations s1 ON s1.station_code = ts1.station_code
    JOIN stations s2 ON s2.station_code = ts2.station_code
    WHERE UPPER(ts1.station_code) = UPPER(?)
      AND UPPER(ts2.station_code) = UPPER(?)
      AND ts1.stop_number < ts2.stop_number
    ORDER BY ts1.departure_time
  `, [from, to]);

  const fromStation = queryOne('SELECT * FROM stations WHERE UPPER(station_code) = UPPER(?)', [from]);
  const toStation   = queryOne('SELECT * FROM stations WHERE UPPER(station_code) = UPPER(?)', [to]);

  res.json({
    success: true,
    data: {
      trains,
      fromStation,
      toStation,
      totalTrains: trains.length,
    }
  });
});

// GET /api/station/:code — Station Live Board
app.get('/api/station/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const station = queryOne(`
    SELECT s.*, z.zone_name FROM stations s JOIN zones z ON s.zone_code = z.zone_code
    WHERE UPPER(s.station_code) = ?
  `, [code]);

  if (!station) {
    return res.status(404).json({ success: false, message: 'Station not found' });
  }

  const today = new Date().toISOString().slice(0, 10);

  const arrivals = queryAll(`
    SELECT
      ts.arrival_time, ts.departure_time, ts.stop_number,
      t.train_number, t.train_name, t.train_type,
      s1.station_name AS source_name, s2.station_name AS dest_name,
      COALESCE(rs.delay_arrival_min, 0)  AS delay_min,
      COALESCE(rs.platform_number,   1)  AS platform_number,
      COALESCE(rs.has_passed,        0)  AS has_passed
    FROM train_schedules ts
    JOIN trains   t  ON t.train_number  = ts.train_number
    JOIN stations s1 ON s1.station_code = t.source_code
    JOIN stations s2 ON s2.station_code = t.dest_code
    LEFT JOIN train_running_status rs
           ON rs.train_number = ts.train_number
          AND rs.station_code  = ts.station_code
          AND rs.status_date   = ?
    WHERE UPPER(ts.station_code) = ?
    ORDER BY COALESCE(ts.arrival_time, ts.departure_time)
  `, [today, code]);

  res.json({
    success: true,
    data: {
      station,
      trains: arrivals,
      totalTrains: arrivals.length,
    }
  });
});

// GET /api/classes — List all travel classes
app.get('/api/classes', (req, res) => {
  const classes = queryAll('SELECT * FROM classes ORDER BY fare_per_km DESC');
  res.json({ success: true, data: classes });
});

// GET /api/notifications — Get all delay notifications
app.get('/api/notifications', (req, res) => {
  const notifications = queryAll('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20');
  res.json({ success: true, data: notifications });
});

// POST /api/book-ticket — Book a ticket with concurrency control
app.post('/api/book-ticket', (req, res) => {
  const { train_number, from_station, to_station, class_code, passengers, distance, date } = req.body;
  if (!train_number || !from_station || !to_station || !class_code || !passengers || !passengers.length || !date) {
    return res.status(400).json({ success: false, message: 'Missing booking details' });
  }

  try {
    db.run('BEGIN TRANSACTION');

    // Calculate Dynamic Fare
    let dist = distance;
    if (!dist) {
      const fromSched = queryOne('SELECT distance_km FROM train_schedules WHERE train_number = ? AND station_code = ?', [train_number, from_station]);
      const toSched   = queryOne('SELECT distance_km FROM train_schedules WHERE train_number = ? AND station_code = ?', [train_number, to_station]);
      if (!fromSched || !toSched) throw new Error("Invalid route for this train.");
      dist = Math.abs(toSched.distance_km - fromSched.distance_km);
    }
    
    const cls = queryOne('SELECT fare_per_km FROM classes WHERE class_code = ?', [class_code]);
    if (!cls) throw new Error("Invalid class code.");
    
    // Base distance is minimum 50km
    const finalDist = Math.max(dist, 50);
    const total_fare = Math.ceil(finalDist * cls.fare_per_km * passengers.length);

    // Generate a random 10-digit PNR
    const pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const today = new Date().toISOString().slice(0, 10);
    
    // Insert into pnr_bookings
    db.run(`
      INSERT INTO pnr_bookings (pnr, train_number, journey_date, from_station, to_station, class_code, coach, booking_date, total_fare)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [pnr, train_number, date, from_station, to_station, class_code, class_code.charAt(0) + '1', today, total_fare]);

    // Insert passengers
    const stmt = db.prepare(`
      INSERT INTO passengers (pnr, name, age, gender, berth_pref, seat_number, booking_status)
      VALUES (?, ?, ?, ?, ?, ?, 'CNF')
    `);
    
    let seatNum = 1;
    passengers.forEach(p => {
      stmt.run([pnr, p.name, p.age, p.gender, p.berth_pref || 'N/A', class_code.charAt(0) + '1-' + (seatNum++)]);
    });
    stmt.free();

    db.run('COMMIT');

    // Persist memory db to file
    const data = Buffer.from(db.export());
    fs.writeFileSync(DB_PATH, data);

    res.json({ success: true, message: 'Ticket booked successfully', pnr });
  } catch (err) {
    db.run('ROLLBACK');
    res.status(500).json({ success: false, message: 'Booking failed due to an error.', error: err.message });
  }
});

// ─── Serve Frontend ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
loadDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚂 Indian Railway Server running at http://localhost:${PORT}`);
    console.log(`   Train Status: http://localhost:${PORT}/#train-status`);
    console.log(`   PNR Status:   http://localhost:${PORT}/#pnr-status`);
  });
});
