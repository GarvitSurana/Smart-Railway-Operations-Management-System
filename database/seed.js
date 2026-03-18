// database/seed.js
// Creates and seeds the SQLite database with real Indian Railway data

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'railway.db');

async function seedDatabase() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // ─── CREATE TABLES ───────────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS zones (
      zone_code TEXT PRIMARY KEY,
      zone_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stations (
      station_code TEXT PRIMARY KEY,
      station_name TEXT NOT NULL,
      city         TEXT NOT NULL,
      state        TEXT NOT NULL,
      zone_code    TEXT NOT NULL,
      FOREIGN KEY (zone_code) REFERENCES zones(zone_code)
    );

    CREATE TABLE IF NOT EXISTS trains (
      train_number TEXT PRIMARY KEY,
      train_name   TEXT NOT NULL,
      train_type   TEXT NOT NULL,
      source_code  TEXT NOT NULL,
      dest_code    TEXT NOT NULL,
      runs_on      TEXT NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      FOREIGN KEY (source_code) REFERENCES stations(station_code),
      FOREIGN KEY (dest_code)   REFERENCES stations(station_code)
    );

    CREATE TABLE IF NOT EXISTS train_schedules (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      train_number   TEXT NOT NULL,
      station_code   TEXT NOT NULL,
      stop_number    INTEGER NOT NULL,
      arrival_time   TEXT,
      departure_time TEXT,
      distance_km    INTEGER NOT NULL DEFAULT 0,
      halt_minutes   INTEGER NOT NULL DEFAULT 2,
      FOREIGN KEY (train_number) REFERENCES trains(train_number),
      FOREIGN KEY (station_code) REFERENCES stations(station_code)
    );

    CREATE TABLE IF NOT EXISTS classes (
      class_code TEXT PRIMARY KEY,
      class_name TEXT NOT NULL,
      fare_per_km REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pnr_bookings (
      pnr          TEXT PRIMARY KEY,
      train_number TEXT NOT NULL,
      journey_date TEXT NOT NULL,
      from_station TEXT NOT NULL,
      to_station   TEXT NOT NULL,
      class_code   TEXT NOT NULL,
      coach        TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      total_fare   REAL NOT NULL,
      FOREIGN KEY (train_number) REFERENCES trains(train_number),
      FOREIGN KEY (from_station) REFERENCES stations(station_code),
      FOREIGN KEY (to_station)   REFERENCES stations(station_code),
      FOREIGN KEY (class_code)   REFERENCES classes(class_code)
    );

    CREATE TABLE IF NOT EXISTS passengers (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pnr          TEXT NOT NULL,
      name         TEXT NOT NULL,
      age          INTEGER NOT NULL,
      gender       TEXT NOT NULL,
      berth_pref   TEXT NOT NULL DEFAULT 'No Preference',
      seat_number  TEXT,
      booking_status TEXT NOT NULL DEFAULT 'CNF',
      FOREIGN KEY (pnr) REFERENCES pnr_bookings(pnr)
    );

    CREATE TABLE IF NOT EXISTS train_running_status (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      train_number       TEXT NOT NULL,
      station_code       TEXT NOT NULL,
      status_date        TEXT NOT NULL,
      actual_arrival     TEXT,
      actual_departure   TEXT,
      delay_arrival_min  INTEGER NOT NULL DEFAULT 0,
      delay_depart_min   INTEGER NOT NULL DEFAULT 0,
      platform_number    INTEGER NOT NULL DEFAULT 1,
      has_passed         INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (train_number) REFERENCES trains(train_number),
      FOREIGN KEY (station_code) REFERENCES stations(station_code)
    );
  `);

  // ─── ZONES ────────────────────────────────────────────────────────────────────
  const zones = [
    ['NR',  'Northern Railway'],
    ['WR',  'Western Railway'],
    ['CR',  'Central Railway'],
    ['SR',  'Southern Railway'],
    ['ER',  'Eastern Railway'],
    ['SCR', 'South Central Railway'],
    ['SER', 'South Eastern Railway'],
    ['NWR', 'North Western Railway'],
    ['ECR', 'East Central Railway'],
    ['NCR', 'North Central Railway'],
    ['SWR', 'South Western Railway'],
    ['ECoR', 'East Coast Railway'],
    ['NFR', 'Northeast Frontier Railway'],
    ['WCR', 'West Central Railway'],
  ];
  const insZone = db.prepare('INSERT OR IGNORE INTO zones VALUES (?,?)');
  zones.forEach(z => insZone.run(z));
  insZone.free();

  // ─── STATIONS ─────────────────────────────────────────────────────────────────
  const stations = [
    ['NDLS', 'New Delhi',           'New Delhi',   'Delhi',             'NR' ],
    ['DLI',  'Old Delhi',           'New Delhi',   'Delhi',             'NR' ],
    ['CNB',  'Kanpur Central',      'Kanpur',      'Uttar Pradesh',     'NCR'],
    ['ALD',  'Prayagraj Junction',  'Prayagraj',   'Uttar Pradesh',     'NCR'],
    ['MGS',  'Mughal Sarai Jn',     'Chandauli',   'Uttar Pradesh',     'ECR'],
    ['HWH',  'Howrah Junction',     'Kolkata',     'West Bengal',       'ER' ],
    ['SDAH', 'Sealdah',             'Kolkata',     'West Bengal',       'ER' ],
    ['BCT',  'Mumbai Central',      'Mumbai',      'Maharashtra',       'WR' ],
    ['CSTM', 'Mumbai CST',          'Mumbai',      'Maharashtra',       'CR' ],
    ['PUNE', 'Pune Junction',       'Pune',        'Maharashtra',       'CR' ],
    ['MAS',  'Chennai Central',     'Chennai',     'Tamil Nadu',        'SR' ],
    ['MS',   'Chennai Egmore',      'Chennai',     'Tamil Nadu',        'SR' ],
    ['SBC',  'Bengaluru City',      'Bengaluru',   'Karnataka',         'SWR'],
    ['SC',   'Secunderabad Jn',     'Hyderabad',   'Telangana',         'SCR'],
    ['HYB',  'Hyderabad Deccan',    'Hyderabad',   'Telangana',         'SCR'],
    ['ADI',  'Ahmedabad Jn',        'Ahmedabad',   'Gujarat',           'WR' ],
    ['JP',   'Jaipur Junction',     'Jaipur',      'Rajasthan',         'NWR'],
    ['LKO',  'Lucknow NR',          'Lucknow',     'Uttar Pradesh',     'NR' ],
    ['PNBE', 'Patna Junction',      'Patna',       'Bihar',             'ECR'],
    ['BPL',  'Bhopal Junction',     'Bhopal',      'Madhya Pradesh',    'WCR'],
    ['NGP',  'Nagpur Junction',     'Nagpur',      'Maharashtra',       'CR' ],
    ['VSKP', 'Visakhapatnam',       'Vizag',       'Andhra Pradesh',    'ECoR'],
    ['GHY',  'Guwahati',            'Guwahati',    'Assam',             'NFR'],
    ['JAT',  'Jammu Tawi',          'Jammu',       'Jammu & Kashmir',   'NR' ],
    ['TVC',  'Thiruvananthapuram',  'Trivandrum',  'Kerala',            'SR' ],
    ['MAQ',  'Mangaluru Central',   'Mangalore',   'Karnataka',         'SR' ],
    ['ERS',  'Ernakulam Junction',  'Kochi',       'Kerala',            'SR' ],
    ['CBE',  'Coimbatore Jn',       'Coimbatore',  'Tamil Nadu',        'SR' ],
    ['MYS',  'Mysuru Junction',     'Mysore',      'Karnataka',         'SWR'],
    ['PUNE', 'Pune Junction',       'Pune',        'Maharashtra',       'CR' ],
    ['VSG',  'Vasco Da Gama',       'Vasco',       'Goa',               'SWR'],
    ['BBS',  'Bhubaneswar',         'Bhubaneswar', 'Odisha',            'ECoR'],
    ['PURI', 'Puri',                'Puri',        'Odisha',            'ECoR'],
    ['RNC',  'Ranchi Junction',     'Ranchi',      'Jharkhand',         'SER'],
    ['TATA', 'Tatanagar Jn',        'Jamshedpur',  'Jharkhand',         'SER'],
    ['GAYA', 'Gaya Junction',       'Gaya',        'Bihar',             'ECR'],
    ['GKP',  'Gorakhpur Jn',        'Gorakhpur',   'Uttar Pradesh',     'NER'],
    ['BSB',  'Varanasi Junction',   'Varanasi',    'Uttar Pradesh',     'NR' ],
    ['CDG',  'Chandigarh',          'Chandigarh',  'Chandigarh',        'NR' ],
    ['ASR',  'Amritsar Junction',   'Amritsar',    'Punjab',            'NR' ],
    ['JUC',  'Jalandhar City',      'Jalandhar',   'Punjab',            'NR' ],
    ['SVDK', 'SMVD Katra',          'Katra',       'Jammu & Kashmir',   'NR' ],
    ['SRE',  'Saharanpur Jn',       'Saharanpur',  'Uttar Pradesh',     'NR' ],
    ['DDN',  'Dehradun',            'Dehradun',    'Uttarakhand',       'NR' ],
    ['ST',   'Surat',               'Surat',       'Gujarat',           'WR' ],
    ['BRC',  'Vadodara Junction',   'Vadodara',    'Gujarat',           'WR' ],
    ['RJT',  'Rajkot Junction',     'Rajkot',      'Gujarat',           'WR' ],
    ['JU',   'Jodhpur Junction',    'Jodhpur',     'Rajasthan',         'NWR'],
    ['BKN',  'Bikaner Junction',    'Bikaner',     'Rajasthan',         'NWR'],
    ['UJN',  'Ujjain Junction',     'Ujjain',      'Madhya Pradesh',    'WR' ],
    ['INDB', 'Indore Junction',     'Indore',      'Madhya Pradesh',    'WR' ],
    ['JBP',  'Jabalpur',            'Jabalpur',    'Madhya Pradesh',    'WCR'],
    ['GWL',  'Gwalior Junction',    'Gwalior',     'Madhya Pradesh',    'NCR'],
    ['KCG',  'Kacheguda',           'Hyderabad',   'Telangana',         'SCR'],
    ['BZA',  'Vijayawada Jn',       'Vijayawada',  'Andhra Pradesh',    'SCR'],
    ['TPTY', 'Tirupati',            'Tirupati',    'Andhra Pradesh',    'SCR'],
    ['TEN',  'Tirunelveli Jn',      'Tirunelveli', 'Tamil Nadu',        'SR' ],
    ['NCJ',  'Nagercoil Junction',  'Nagercoil',   'Tamil Nadu',        'SR' ],
    ['NDB',  'Nandurbar',           'Nandurbar',   'Maharashtra',       'WR' ],
    ['BSL',  'Bhusaval Junction',   'Bhusaval',    'Maharashtra',       'CR' ],
    ['MMCT', 'Mumbai Central',      'Mumbai',      'Maharashtra',       'WR' ],
    ['LTT',  'Lokmanya Tilak T',    'Mumbai',      'Maharashtra',       'CR' ],
    ['BDTS', 'Bandra Terminus',     'Mumbai',      'Maharashtra',       'WR' ],
    ['YPR',  'Yesvantpur Jn',       'Bengaluru',   'Karnataka',         'SWR'],
    ['MDU',  'Madurai Junction',    'Madurai',     'Tamil Nadu',        'SR' ],
    ['TPJ',  'Tiruchchirappalli',   'Trichy',      'Tamil Nadu',        'SR' ],
  ];
  const insStation = db.prepare('INSERT OR IGNORE INTO stations VALUES (?,?,?,?,?)');
  stations.forEach(s => insStation.run(s));
  insStation.free();

  // ─── CLASSES ─────────────────────────────────────────────────────────────────
  const classes = [
    ['1A',  'First AC',              4.5 ],
    ['2A',  'Second AC',             3.2 ],
    ['3A',  'Third AC',              2.3 ],
    ['SL',  'Sleeper Class',         0.8 ],
    ['CC',  'Chair Car',             1.0 ],
    ['EC',  'Executive Chair Car',   2.8 ],
    ['2S',  'Second Sitting',        0.4 ],
    ['GN',  'General',               0.25],
  ];
  const insClass = db.prepare('INSERT OR IGNORE INTO classes VALUES (?,?,?)');
  classes.forEach(c => insClass.run(c));
  insClass.free();

  // ─── TRAINS ──────────────────────────────────────────────────────────────────
  const trains = [
    ['12301', 'Howrah Rajdhani Express',         'Rajdhani',   'NDLS', 'HWH',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12302', 'Howrah Rajdhani Express',         'Rajdhani',   'HWH',  'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12951', 'Mumbai Rajdhani Express',         'Rajdhani',   'NDLS', 'MMCT', 'Mon,Wed,Thu,Sat'],
    ['12952', 'Mumbai Rajdhani Express',         'Rajdhani',   'MMCT', 'NDLS', 'Tue,Thu,Fri,Sun'],
    ['12009', 'Shatabdi Express',                'Shatabdi',   'NDLS', 'MMCT', 'Mon,Tue,Wed,Thu,Fri,Sat'],
    ['12010', 'Shatabdi Express',                'Shatabdi',   'MMCT', 'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat'],
    ['12269', 'Chennai Duronto Express',         'Duronto',    'NDLS', 'MAS',  'Mon,Wed,Fri'],
    ['12270', 'Chennai Duronto Express',         'Duronto',    'MAS',  'NDLS', 'Tue,Thu,Sat'],
    ['12621', 'Tamil Nadu Express',              'Superfast',  'NDLS', 'MAS',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12622', 'Tamil Nadu Express',              'Superfast',  'MAS',  'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12309', 'Rajendra Nagar Patna Rajdhani',   'Rajdhani',   'NDLS', 'PNBE', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12310', 'Patna Rajdhani Express',          'Rajdhani',   'PNBE', 'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12423', 'Dibrugarh Rajdhani Express',      'Rajdhani',   'NDLS', 'GHY',  'Tue,Fri'],
    ['12424', 'Dibrugarh Rajdhani Express',      'Rajdhani',   'GHY',  'NDLS', 'Thu,Sun'],
    ['12431', 'Trivandrum Rajdhani Express',     'Rajdhani',   'TVC',  'NDLS', 'Tue,Thu,Fri'],
    ['12432', 'Trivandrum Rajdhani Express',     'Rajdhani',   'NDLS', 'TVC',  'Sun,Tue,Wed'],
    ['12434', 'Chennai Rajdhani Express',        'Rajdhani',   'NDLS', 'MAS',  'Wed,Fri'],
    ['12433', 'Chennai Rajdhani Express',        'Rajdhani',   'MAS',  'NDLS', 'Sun,Fri'],
    ['22691', 'Bengaluru Rajdhani Express',      'Rajdhani',   'SBC',  'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['22692', 'Bengaluru Rajdhani Express',      'Rajdhani',   'NDLS', 'SBC',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12213', 'Yesvantpur Duronto Express',      'Duronto',    'YPR',  'DEE',  'Sat'],
    ['12214', 'Yesvantpur Duronto Express',      'Duronto',    'DEE',  'YPR',  'Mon'],
    ['12001', 'Bhopal Shatabdi Express',         'Shatabdi',   'NDLS', 'BPL',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12002', 'Bhopal Shatabdi Express',         'Shatabdi',   'BPL',  'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12003', 'Lucknow Shatabdi Express',        'Shatabdi',   'LKO',  'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12004', 'Lucknow Shatabdi Express',        'Shatabdi',   'NDLS', 'LKO',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12011', 'Kalka Shatabdi Express',          'Shatabdi',   'NDLS', 'KLK',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12012', 'Kalka Shatabdi Express',          'Shatabdi',   'KLK',  'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['22439', 'Vande Bharat Express',            'Vande Bharat','NDLS','SVDK', 'Mon,Wed,Thu,Fri,Sat,Sun'],
    ['22440', 'Vande Bharat Express',            'Vande Bharat','SVDK','NDLS', 'Mon,Wed,Thu,Fri,Sat,Sun'],
    ['22436', 'Vande Bharat Express',            'Vande Bharat','NDLS','BSB',  'Tue,Wed,Fri,Sat,Sun'],
    ['22435', 'Vande Bharat Express',            'Vande Bharat','BSB', 'NDLS', 'Tue,Wed,Fri,Sat,Sun'],
    ['12925', 'Paschim Express',                 'Superfast',  'BDTS','ASR',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12926', 'Paschim Express',                 'Superfast',  'ASR', 'BDTS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12627', 'Karnataka Express',               'Superfast',  'SBC',  'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12628', 'Karnataka Express',               'Superfast',  'NDLS', 'SBC',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12859', 'Gitanjali Express',               'Superfast',  'CSMT', 'HWH',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12860', 'Gitanjali Express',               'Superfast',  'HWH',  'CSMT', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12625', 'Kerala Express',                  'Superfast',  'TVC',  'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12626', 'Kerala Express',                  'Superfast',  'NDLS', 'TVC',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12137', 'Punjab Mail',                     'Superfast',  'CSMT', 'FZR',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12138', 'Punjab Mail',                     'Superfast',  'FZR',  'CSMT', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12801', 'Purushottam Express',             'Superfast',  'PURI', 'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12802', 'Purushottam Express',             'Superfast',  'NDLS', 'PURI', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12555', 'Gorakhdham Express',              'Superfast',  'GKP',  'BHI',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12556', 'Gorakhdham Express',              'Superfast',  'BHI',  'GKP',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['11019', 'Konark Express',                  'Mail/Express','CSMT', 'BBS',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['11020', 'Konark Express',                  'Mail/Express','BBS',  'CSMT', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12723', 'Telangana Express',               'Superfast',  'HYB',  'NDLS', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['12724', 'Telangana Express',               'Superfast',  'NDLS', 'HYB',  'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
  ];
  const insTrain = db.prepare('INSERT OR IGNORE INTO trains VALUES (?,?,?,?,?,?)');
  trains.forEach(t => insTrain.run(t));
  insTrain.free();

  // ─── TRAIN SCHEDULES ─────────────────────────────────────────────────────────
  // Format: [train_number, station_code, stop_number, arrival, departure, distance_km, halt_min]
  const schedules = [
    // 12301 — Howrah Rajdhani (NDLS → HWH) 1451km
    ['12301','NDLS', 1, null,    '17:00', 0,    0 ],
    ['12301','CNB',  2, '20:40', '20:50', 440,  10],
    ['12301','MGS',  3, '00:15', '00:25', 792,  10],
    ['12301','PNBE', 4, '02:35', '02:45', 991,  10],
    ['12301','HWH',  5, '10:00', null,    1451, 0 ],

    // 12302 — Howrah Rajdhani (HWH → NDLS)
    ['12302','HWH',  1, null,    '16:55', 0,    0 ],
    ['12302','PNBE', 2, '00:20', '00:30', 460,  10],
    ['12302','MGS',  3, '02:40', '02:50', 659,  10],
    ['12302','CNB',  4, '06:00', '06:10', 1011, 10],
    ['12302','NDLS', 5, '10:00', null,    1451, 0 ],

    // 12951 — Mumbai Rajdhani (NDLS → BCT) 1385km
    ['12951','NDLS', 1, null,    '16:00', 0,    0 ],
    ['12951','BPL',  2, '02:20', '02:30', 702,  10],
    ['12951','ADI',  3, '07:30', '07:40', 1067, 10],
    ['12951','BCT',  4, '10:00', null,    1385, 0 ],

    // 12952 — Mumbai Rajdhani (BCT → NDLS)
    ['12952','BCT',  1, null,    '17:40', 0,    0 ],
    ['12952','ADI',  2, '20:00', '20:10', 318,  10],
    ['12952','BPL',  3, '01:30', '01:40', 683,  10],
    ['12952','NDLS', 4, '08:35', null,    1385, 0 ],

    // 12009 — Shatabdi (NDLS → MAS)
    ['12009','NDLS', 1, null,    '06:00', 0,    0 ],
    ['12009','CNB',  2, '09:25', '09:30', 440,  5 ],
    ['12009','BPL',  3, '14:15', '14:20', 702,  5 ],
    ['12009','NGP',  4, '18:35', '18:40', 1059, 5 ],
    ['12009','SC',   5, '23:00', '23:05', 1429, 5 ],
    ['12009','MAS',  6, '02:05', null,    1665, 0 ],

    // 12010 — Shatabdi (MAS → NDLS)
    ['12010','MAS',  1, null,    '06:15', 0,    0 ],
    ['12010','SC',   2, '09:15', '09:20', 236,  5 ],
    ['12010','NGP',  3, '13:40', '13:45', 606,  5 ],
    ['12010','BPL',  4, '18:00', '18:05', 963,  5 ],
    ['12010','CNB',  5, '22:50', '22:55', 1225, 5 ],
    ['12010','NDLS', 6, '02:20', null,    1665, 0 ],

    // 12269 — Chennai Duronto (NDLS → MAS)
    ['12269','NDLS', 1, null,    '11:45', 0,    0 ],
    ['12269','MAS',  2, '10:55', null,    2188, 0 ],

    // 12621 — Tamil Nadu Express (NDLS → MAS)
    ['12621','NDLS', 1, null,    '22:30', 0,    0 ],
    ['12621','CNB',  2, '02:10', '02:15', 440,  5 ],
    ['12621','ALD',  3, '04:00', '04:05', 634,  5 ],
    ['12621','NGP',  4, '13:20', '13:25', 1176, 5 ],
    ['12621','SC',   5, '17:30', '17:35', 1546, 5 ],
    ['12621','MAS',  6, '21:30', null,    1664, 0 ],

    // 12622 — Tamil Nadu Express (MAS → NDLS)
    ['12622','MAS',  1, null,    '21:30', 0,    0 ],
    ['12622','SC',   2, '01:30', '01:35', 236,  5 ],
    ['12622','NGP',  3, '06:05', '06:10', 488,  5 ],
    ['12622','ALD',  4, '15:30', '15:35', 1030, 5 ],
    ['12622','CNB',  5, '17:25', '17:30', 1224, 5 ],
    ['12622','NDLS', 6, '21:30', null,    1664, 0 ],

    // 12309 — Patna Rajdhani (NDLS → PNBE)
    ['12309','NDLS', 1, null,    '18:55', 0,    0 ],
    ['12309','CNB',  2, '22:47', '22:57', 440,  10],
    ['12309','ALD',  3, '00:50', '01:00', 634,  10],
    ['12309','MGS',  4, '03:10', '03:20', 792,  10],
    ['12309','PNBE', 5, '06:00', null,    991,  0 ],

    // 12310 — Patna Rajdhani (PNBE → NDLS)
    ['12310','PNBE', 1, null,    '19:45', 0,    0 ],
    ['12310','MGS',  2, '22:25', '22:35', 199,  10],
    ['12310','ALD',  3, '00:35', '00:45', 357,  10],
    ['12310','CNB',  4, '02:40', '02:50', 551,  10],
    ['12310','NDLS', 5, '06:45', null,    991,  0 ],

    // 12627 — Karnataka Express (NDLS → SBC)
    ['12627','NDLS', 1, null,    '22:30', 0,    0 ],
    ['12627','CNB',  2, '02:25', '02:30', 440,  5 ],
    ['12627','NGP',  3, '11:55', '12:00', 1076, 5 ],
    ['12627','SC',   4, '17:00', '17:10', 1546, 10],
    ['12627','SBC',  5, '09:30', null,    2445, 0 ],

    // 12628 — Karnataka Express (SBC → NDLS)
    ['12628','SBC',  1, null,    '20:00', 0,    0 ],
    ['12628','SC',   2, '07:55', '08:05', 399,  10],
    ['12628','NGP',  3, '13:30', '13:35', 869,  5 ],
    ['12628','CNB',  4, '23:05', '23:10', 1369, 5 ],
    ['12628','NDLS', 5, '03:15', null,    2445, 0 ],

    // 12649 — Sampark Kranti (NDLS → SC)
    ['12649','NDLS', 1, null,    '10:00', 0,    0 ],
    ['12649','BPL',  2, '19:55', '20:05', 702,  10],
    ['12649','NGP',  3, '00:25', '00:35', 1059, 10],
    ['12649','SC',   4, '10:00', null,    1546, 0 ],

    // 12925 — Paschim Express (BCT → ADI)
    ['12925','BDTS', 1, null,    '11:30', 0,    0 ],
    ['12925','ST',   2, '14:45', '14:50', 252,  5 ],
    ['12925','BRC',  3, '16:30', '16:40', 381,  10],
    ['12925','RTM',  4, '20:45', '20:55', 642,  10],
    ['12925','KOTA', 5, '00:05', '00:15', 908,  10],
    ['12925','NDLS', 6, '10:40', '11:05', 1374, 25],
    ['12925','ASR',  7, '20:10', null,    1822, 0 ],

    // 22439 - Vande Bharat (NDLS -> SVDK)
    ['22439','NDLS', 1, null,    '06:00', 0,    0 ],
    ['22439','UMB',  2, '08:10', '08:12', 199,  2 ],
    ['22439','LDH',  3, '09:19', '09:21', 313,  2 ],
    ['22439','JAT',  4, '12:38', '12:40', 577,  2 ],
    ['22439','SVDK', 5, '14:00', null,    655,  0 ],

    // 22440 - Vande Bharat (SVDK -> NDLS)
    ['22440','SVDK', 1, null,    '15:00', 0,    0 ],
    ['22440','JAT',  2, '16:13', '16:15', 78,   2 ],
    ['22440','LDH',  3, '19:32', '19:34', 342,  2 ],
    ['22440','UMB',  4, '20:48', '20:50', 456,  2 ],
    ['22440','NDLS', 5, '23:00', null,    655,  0 ],

    // 22436 - Vande Bharat (NDLS -> BSB)
    ['22436','NDLS', 1, null,    '06:00', 0,    0 ],
    ['22436','CNB',  2, '10:08', '10:10', 440,  2 ],
    ['22436','PRYJ', 3, '12:08', '12:10', 634,  2 ],
    ['22436','BSB',  4, '14:00', null,    759,  0 ],

    // 22435 - Vande Bharat (BSB -> NDLS)
    ['22435','BSB',  1, null,    '15:00', 0,    0 ],
    ['22435','PRYJ', 2, '16:30', '16:32', 124,  2 ],
    ['22435','CNB',  3, '18:30', '18:32', 319,  2 ],
    ['22435','NDLS', 4, '23:00', null,    759,  0 ],

    // 12431 - Trivandrum Rajdhani (TVC -> NDLS)
    ['12431','TVC',  1, null,    '14:40', 0,    0 ],
    ['12431','ERS',  2, '18:25', '18:30', 206,  5 ],
    ['12431','MAQ',  3, '23:45', '23:55', 619,  10],
    ['12431','VSG',  4, '05:40', '05:50', 989,  10],
    ['12431','PUNE', 5, '15:20', '15:30', 1472, 10],
    ['12431','BCT',  6, '18:50', '19:05', 1664, 15],
    ['12431','BRC',  7, '23:35', '23:45', 2045, 10],
    ['12431','KOTA', 8, '04:30', '04:40', 2573, 10],
    ['12431','NDLS', 9, '12:30', null,    3038, 0 ],

    // 12432 - Trivandrum Rajdhani (NDLS -> TVC)
    ['12432','NDLS', 1, null,    '06:16', 0,    0 ],
    ['12432','KOTA', 2, '11:10', '11:20', 465,  10],
    ['12432','BRC',  3, '16:50', '17:00', 993,  10],
    ['12432','BCT',  4, '21:35', '21:50', 1374, 15],
    ['12432','PUNE', 5, '01:05', '01:15', 1566, 10],
    ['12432','VSG',  6, '10:40', '10:50', 2049, 10],
    ['12432','MAQ',  7, '16:35', '16:45', 2419, 10],
    ['12432','ERS',  8, '22:15', '22:20', 2832, 5 ],
    ['12432','TVC',  9, '01:50', null,    3038, 0 ],

    // 12625 - Kerala Express (TVC -> NDLS)
    ['12625','TVC',  1, null,    '12:30', 0,    0 ],
    ['12625','ERS',  2, '16:20', '16:25', 206,  5 ],
    ['12625','CBE',  3, '19:55', '20:00', 411,  5 ],
    ['12625','TPTY', 4, '02:35', '02:40', 887,  5 ],
    ['12625','BZA',  5, '08:00', '08:10', 1271, 10],
    ['12625','NGP',  6, '20:15', '20:20', 1944, 5 ],
    ['12625','BPL',  7, '02:30', '02:40', 2333, 10],
    ['12625','NDLS', 8, '13:30', null,    3035, 0 ],

    // 12626 - Kerala Express (NDLS -> TVC)
    ['12626','NDLS', 1, null,    '20:10', 0,    0 ],
    ['12626','BPL',  2, '05:20', '05:30', 702,  10],
    ['12626','NGP',  3, '11:45', '11:50', 1091, 5 ],
    ['12626','BZA',  4, '00:05', '00:15', 1764, 10],
    ['12626','TPTY', 5, '05:35', '05:40', 2148, 5 ],
    ['12626','CBE',  6, '12:25', '12:30', 2624, 5 ],
    ['12626','ERS',  7, '16:55', '17:00', 2829, 5 ],
    ['12626','TVC',  8, '22:30', null,    3035, 0 ],
  ];

  const insSched = db.prepare(
    'INSERT OR IGNORE INTO train_schedules (train_number,station_code,stop_number,arrival_time,departure_time,distance_km,halt_minutes) VALUES (?,?,?,?,?,?,?)'
  );
  schedules.forEach(s => insSched.run(s));
  insSched.free();

  // ─── PNR BOOKINGS ─────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10); // e.g. 2026-03-13
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const pnrs = [
    ['1234567890', '12301', today,     'NDLS', 'HWH',  '2A', 'B1',  today,     4800],
    ['2345678901', '12301', today,     'NDLS', 'HWH',  'SL', 'S4',  yesterday, 1450],
    ['3456789012', '12951', today,     'NDLS', 'BCT',  '1A', 'H1',  yesterday, 6200],
    ['4567890123', '12621', today,     'NDLS', 'MAS',  'SL', 'S7',  yesterday, 1220],
    ['5678901234', '12009', tomorrow,  'NDLS', 'MAS',  'CC', 'C2',  today,     3500],
    ['6789012345', '12309', today,     'NDLS', 'PNBE', '3A', 'B3',  yesterday, 1950],
    ['7890123456', '12627', tomorrow,  'NDLS', 'SBC',  'SL', 'S2',  today,     1680],
    ['8901234567', '12301', yesterday, 'NDLS', 'HWH',  '3A', 'B2',  yesterday, 2900],
    ['9012345678', '12952', today,     'BCT',  'NDLS', '2A', 'A1',  yesterday, 4100],
    ['1122334455', '12622', tomorrow,  'MAS',  'NDLS', 'SL', 'S11', today,     1340],
    ['2233445566', '12310', today,     'PNBE', 'NDLS', '3A', 'B4',  yesterday, 2100],
    ['3344556677', '12649', today,     'NDLS', 'SC',   '2A', 'A2',  yesterday, 5400],
  ];
  const insPnr = db.prepare(
    'INSERT OR IGNORE INTO pnr_bookings VALUES (?,?,?,?,?,?,?,?,?)'
  );
  pnrs.forEach(p => insPnr.run(p));
  insPnr.free();

  // ─── PASSENGERS ──────────────────────────────────────────────────────────────
  const passengers = [
    // PNR 1234567890 — 12301 Howrah Rajdhani
    [null, '1234567890', 'Rahul Sharma',      34, 'M', 'LB',  'B1-21', 'CNF'],
    [null, '1234567890', 'Priya Sharma',       30, 'F', 'UB',  'B1-22', 'CNF'],
    // PNR 2345678901
    [null, '2345678901', 'Amit Kumar',         45, 'M', 'LB',  'S4-23', 'CNF'],
    [null, '2345678901', 'Sunita Devi',         42, 'F', 'MB',  'S4-24', 'CNF'],
    [null, '2345678901', 'Rohit Kumar',         18, 'M', 'UB',  'S4-25', 'CNF'],
    // PNR 3456789012
    [null, '3456789012', 'Vikram Malhotra',    55, 'M', 'LB',  'H1-1',  'CNF'],
    [null, '3456789012', 'Meera Malhotra',     50, 'F', 'LB',  'H1-2',  'CNF'],
    // PNR 4567890123
    [null, '4567890123', 'Suresh Yadav',       28, 'M', 'UB',  'S7-52', 'CNF'],
    // PNR 5678901234
    [null, '5678901234', 'Anaya Singh',        24, 'F', 'N/A', 'C2-12', 'CNF'],
    [null, '5678901234', 'Karan Singh',        27, 'M', 'N/A', 'C2-13', 'CNF'],
    // PNR 6789012345
    [null, '6789012345', 'Deepak Verma',       38, 'M', 'LB',  'B3-31', 'CNF'],
    [null, '6789012345', 'Radha Verma',        35, 'F', 'UB',  'B3-32', 'CNF'],
    [null, '6789012345', 'Neha Verma',         10, 'F', 'SL',  'B3-33', 'CNF'],
    // PNR 7890123456
    [null, '7890123456', 'Arjun Nair',         32, 'M', 'SL',  'S2-12', 'WL/4'],
    [null, '7890123456', 'Divya Nair',         30, 'F', 'LB',  'S2-13', 'WL/5'],
    // PNR 8901234567
    [null, '8901234567', 'Mohan Das',          60, 'M', 'LB',  'B2-11', 'CNF'],
    // PNR 9012345678
    [null, '9012345678', 'Pooja Iyer',         29, 'F', 'LB',  'A1-5',  'CNF'],
    [null, '9012345678', 'Raj Iyer',           33, 'M', 'UB',  'A1-6',  'CNF'],
    // PNR 1122334455
    [null, '1122334455', 'Kavya Reddy',        26, 'F', 'UB',  'S11-44','CNF'],
    [null, '1122334455', 'Arun Reddy',         28, 'M', 'LB',  'S11-43','CNF'],
    // PNR 2233445566
    [null, '2233445566', 'Ravi Shankar',       52, 'M', 'LB',  'B4-21', 'RAC/3'],
    // PNR 3344556677
    [null, '3344556677', 'Pradeep Joshi',      41, 'M', 'LB',  'A2-7',  'CNF'],
    [null, '3344556677', 'Lata Joshi',         38, 'F', 'LB',  'A2-8',  'CNF'],
  ];
  const insPax = db.prepare(
    'INSERT OR IGNORE INTO passengers (id,pnr,name,age,gender,berth_pref,seat_number,booking_status) VALUES (?,?,?,?,?,?,?,?)'
  );
  passengers.forEach(p => insPax.run(p));
  insPax.free();

  // ─── DYNAMIC TRAIN RUNNING STATUS (Realistic Live Simulation) ──────────────────
  const nowIST = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hourCycle: 'h23' });
  const [currH, currM] = nowIST.split(':').map(Number);
  const currentAbsoluteMins = currH * 60 + currM;
  
  const runningStatus = [];
  
  // Group schedule stops logically per train
  const trainStops = {};
  schedules.forEach(s => {
    if (!trainStops[s[0]]) trainStops[s[0]] = [];
    trainStops[s[0]].push(s);
  });

  for (let tNum in trainStops) {
    const stops = trainStops[tNum];
    let prevSchedMins = -1;
    let dayOffset = 0;
    
    // Assign a random consistent delay per-train: 0, 15, 30, or 45 mins late.
    const delayMins = Math.floor(Math.random() * 4) * 15;
    
    for (let i = 0; i < stops.length; i++) {
        const [tr, station, stop_num, arr, dep, dist, halt] = stops[i];
        const timeRef = arr || dep;
        let [h, m] = timeRef.split(':').map(Number);
        
        let schedMins = h * 60 + m;
        
        // Multi-day journey crossover detection (e.g. 23:30 -> 02:15 next day)
        if (schedMins < prevSchedMins - 180) {
            dayOffset += 24 * 60;
        }
        prevSchedMins = schedMins;
        
        const absoluteStopMins = schedMins + dayOffset;
        
        // Let's assume the train's journey Day 1 represents the current 24-hour bracket.
        // It has passed if its absolute time + delay is less than or equal to current true absolute time.
        // Also handle scenarios where the train hasn't departed yet today at all.
        let hasPassed = 0;
        if ((absoluteStopMins + delayMins) <= currentAbsoluteMins) {
             hasPassed = 1;
        }

        let actual_arr = arr;
        let actual_dep = dep;

        if (hasPassed) {
             if (arr) {
                let totalM = m + delayMins;
                let rh = (h + Math.floor(totalM / 60)) % 24;
                let rm = totalM % 60;
                actual_arr = `${rh.toString().padStart(2,'0')}:${rm.toString().padStart(2,'0')}`;
             }
             if (dep) {
                let [dh, dm] = dep.split(':').map(Number);
                let totalM = dm + delayMins;
                let rh = (dh + Math.floor(totalM / 60)) % 24;
                let rm = totalM % 60;
                actual_dep = `${rh.toString().padStart(2,'0')}:${rm.toString().padStart(2,'0')}`;
             }
        }
        
        runningStatus.push([
            tNum,
            station,
            today,
            hasPassed ? actual_arr : null,
            hasPassed ? actual_dep : null,
            delayMins,
            delayMins,
            Math.floor(Math.random() * 6) + 1, // Platform 1-6
            hasPassed
        ]);
    }
  }

  const insRS = db.prepare(
    'INSERT OR IGNORE INTO train_running_status (train_number,station_code,status_date,actual_arrival,actual_departure,delay_arrival_min,delay_depart_min,platform_number,has_passed) VALUES (?,?,?,?,?,?,?,?,?)'
  );
  runningStatus.forEach(r => insRS.run(r));
  insRS.free();

  // ─── SAVE DATABASE ───────────────────────────────────────────────────────────
  const data = Buffer.from(db.export());
  fs.writeFileSync(DB_PATH, data);
  db.close();

  console.log('✅ Database seeded successfully!');
  console.log(`📁 Saved to: ${DB_PATH}`);
  console.log(`   Zones:    ${zones.length}`);
  console.log(`   Stations: ${stations.length}`);
  console.log(`   Trains:   ${trains.length}`);
  console.log(`   Schedule: ${schedules.length} stops`);
  console.log(`   PNRs:     ${pnrs.length}`);
  console.log(`   Passengers: ${passengers.length}`);
}

seedDatabase().catch(console.error);
