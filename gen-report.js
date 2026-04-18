const{Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,BorderStyle,AlignmentType,HeadingLevel}=require('docx');
const fs=require('fs');
const h=(t,l=HeadingLevel.HEADING_1)=>new Paragraph({heading:l,spacing:{before:300,after:150},children:[new TextRun({text:t,bold:true})]});
const h2=t=>h(t,HeadingLevel.HEADING_2);
const h3=t=>h(t,HeadingLevel.HEADING_3);
const p=t=>new Paragraph({spacing:{after:120,line:360},children:[new TextRun({text:t,size:24})]});
const b=t=>new Paragraph({spacing:{after:120},children:[new TextRun({text:t,bold:true,size:24})]});
const bl=t=>new Paragraph({bullet:{level:0},spacing:{after:80},children:[new TextRun({text:t,size:24})]});
const ph=t=>new Paragraph({spacing:{before:200,after:200},alignment:AlignmentType.CENTER,children:[new TextRun({text:`[ ${t} ]`,italics:true,color:'FF0000',size:28})]});
const brd={style:BorderStyle.SINGLE,size:1,color:'000000'};
const brds={top:brd,bottom:brd,left:brd,right:brd};
function tbl(hds,rows){
  const hr=new TableRow({children:hds.map(x=>new TableCell({borders:brds,shading:{fill:'2C3E50'},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:x,bold:true,color:'FFFFFF',size:20})]})]}))});
  const dr=rows.map(r=>new TableRow({children:r.map(c=>new TableCell({borders:brds,children:[new Paragraph({children:[new TextRun({text:String(c),size:20})]})]}))}));
  return new Table({width:{size:9000,type:WidthType.DXA},rows:[hr,...dr]});
}

const sects = [];

// TITLE PAGE
sects.push(
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:3000},children:[new TextRun({text:'Smart Railway Operations',size:56,bold:true,color:'1A5276'})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:100},children:[new TextRun({text:'Management System',size:56,bold:true,color:'1A5276'})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:200,after:100},children:[new TextRun({text:'(IndianRail Live)',size:40,italics:true,color:'2E86C1'})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:400},children:[new TextRun({text:'Database Management System — Course Project Report',size:28})]}),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:600},children:[new TextRun({text:'Submitted by:',size:24})]}),
  ph('Your Name Here'),
  ph('Roll Number / Registration Number'),
  ph('Course Name & Code'),
  ph('Instructor Name'),
  ph('Department & University Name'),
  new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:400},children:[new TextRun({text:'April 2026',size:24})]})
);

// ABSTRACT
sects.push(h('1. Abstract'));
sects.push(p('The Smart Railway Operations Management System (IndianRail Live) is a comprehensive database-driven web application that simulates the core functionalities of the Indian Railways\' National Train Enquiry System (NTES). The system models the complex, multi-layered data relationships inherent in a national-scale railway network — including railway zones, stations, train schedules, passenger bookings, live running status, and automated delay notifications — within a rigorously normalized relational database.'));
sects.push(p('The primary motivation behind this project is to demonstrate how real-world logistical data structures can be efficiently mapped into a relational schema and queried using Structured Query Language (SQL). The application supports live train running status tracking with journey progress visualization, PNR (Passenger Name Record) status lookups across linked booking and passenger tables, inter-station train search using schedule intersection queries, live station departure boards with platform and delay data, dynamic ticket booking with transactional integrity (BEGIN/COMMIT/ROLLBACK), and automated trigger-based delay notification generation.'));
sects.push(p('The technology stack consists of SQLite as the relational database engine (accessed via sql.js), Node.js with Express.js for the RESTful API backend, and a vanilla HTML/CSS/JavaScript frontend. The database comprises 9 interrelated entities (including a trigger-driven notifications table) normalized up to BCNF, with strict primary and foreign key constraints ensuring referential integrity throughout. The system seeds itself with realistic Indian Railways data — 14 railway zones, 60+ stations, 40+ trains with full multi-stop schedules, and procedurally simulated live delay states — making it a fully self-contained, demonstrable DBMS project.'));

// OBJECTIVES
sects.push(h('2. Objectives'));
sects.push(p('The primary objectives of this project are:'));
sects.push(bl('To design a well-structured, normalized relational database schema that models the Indian Railway network with entities for zones, stations, trains, schedules, bookings, passengers, and live running status.'));
sects.push(bl('To implement and enforce referential integrity using primary keys, foreign keys, and constraint definitions across all entity tables.'));
sects.push(bl('To demonstrate normalization principles (1NF through BCNF) by decomposing data into atomic, non-redundant relational tables.'));
sects.push(bl('To construct complex SQL queries involving multi-table JOINs, aggregate functions (MAX, COUNT), subqueries, and conditional logic for real-time data retrieval.'));
sects.push(bl('To implement ACID-compliant transactions for ticket booking operations using BEGIN TRANSACTION, COMMIT, and ROLLBACK.'));
sects.push(bl('To utilize database triggers for automated event-driven notifications when train delays exceed a defined threshold.'));
sects.push(bl('To build a functional RESTful API layer exposing the database operations to a web-based frontend client.'));
sects.push(bl('To simulate real-time train running status using server-time comparisons against scheduled timetable data stored in the database.'));

// SCOPE
sects.push(h('3. Scope'));
sects.push(h2('3.1 In Scope'));
sects.push(bl('Relational database design and implementation for Indian Railway operations using SQLite.'));
sects.push(bl('CRUD operations on all core entities: zones, stations, trains, schedules, classes, bookings, and passengers.'));
sects.push(bl('Live train tracking simulation using procedural delay injection and time-based comparisons.'));
sects.push(bl('PNR status enquiry with multi-table JOIN queries across bookings, passengers, trains, stations, and classes.'));
sects.push(bl('Train search between arbitrary station pairs using schedule intersection logic.'));
sects.push(bl('Station live departure/arrival board generation.'));
sects.push(bl('Ticket booking with concurrency control via SQL transactions.'));
sects.push(bl('Trigger-based automated notification system for significant delays (>30 minutes).'));
sects.push(h2('3.2 Assumptions'));
sects.push(bl('The system operates on simulated data and does not connect to any live Indian Railways API or external data source.'));
sects.push(bl('Train schedules are seeded with realistic Indian Railways timetable data but may not reflect actual current schedules.'));
sects.push(bl('Delay simulation uses random procedural generation tied to server clock for demonstration purposes.'));
sects.push(bl('The system is designed as a single-user academic prototype; production-grade multi-user concurrency is not implemented.'));
sects.push(h2('3.3 Limitations'));
sects.push(bl('No user authentication or role-based access control is implemented.'));
sects.push(bl('Payment gateway integration is not included; fare calculation is algorithmic only.'));
sects.push(bl('The database uses SQLite (file-based), which is not suitable for high-concurrency production deployments.'));
sects.push(bl('Real-time updates use simulation rather than actual GPS or signaling data.'));

// SCHEMA DEFINITION
sects.push(h('4. Schema Definition'));
sects.push(h2('4.1 Entity Identification'));
sects.push(p('The following entities have been identified and implemented as relational tables in the database:'));
sects.push(tbl(['Entity (Table)','Primary Key','Description'],[
  ['zones','zone_code (TEXT)','Administrative railway zones (e.g., Northern Railway, Western Railway)'],
  ['stations','station_code (TEXT)','Railway stations with geographical and zonal mapping'],
  ['trains','train_number (TEXT)','Base train information with source/destination and operating days'],
  ['train_schedules','id (INTEGER AUTO)','Multi-stop itinerary for each train with times and distances'],
  ['classes','class_code (TEXT)','Travel class types (1A, 2A, 3A, SL, CC, etc.) with fare rates'],
  ['pnr_bookings','pnr (TEXT)','Master booking records linking passengers to trains and journeys'],
  ['passengers','id (INTEGER AUTO)','Individual passenger records with berth allocation and booking status'],
  ['train_running_status','id (INTEGER AUTO)','Dynamic live status tracking delays, platforms, and passage'],
  ['notifications','id (INTEGER AUTO)','Trigger-generated delay alert messages'],
]));

sects.push(h2('4.2 Entity Relationships'));
sects.push(p('The relationships between entities are as follows:'));
sects.push(bl('zones → stations: One-to-Many (one zone contains many stations)'));
sects.push(bl('stations → trains: One-to-Many via source_code and dest_code foreign keys'));
sects.push(bl('trains → train_schedules: One-to-Many (one train has many scheduled stops)'));
sects.push(bl('stations → train_schedules: One-to-Many (one station appears in many schedules)'));
sects.push(bl('trains → pnr_bookings: One-to-Many (one train has many bookings)'));
sects.push(bl('stations → pnr_bookings: One-to-Many via from_station and to_station'));
sects.push(bl('classes → pnr_bookings: One-to-Many (one class type used in many bookings)'));
sects.push(bl('pnr_bookings → passengers: One-to-Many (one PNR has multiple passengers)'));
sects.push(bl('trains → train_running_status: One-to-Many (one train has status entries per station per date)'));
sects.push(bl('stations → train_running_status: One-to-Many'));
sects.push(bl('trains → notifications: One-to-Many (trigger-generated from running status updates)'));

sects.push(h2('4.3 Detailed Table Schemas'));

// zones
sects.push(h3('4.3.1 zones'));
sects.push(tbl(['Column','Type','Constraint'],[['zone_code','TEXT','PRIMARY KEY'],['zone_name','TEXT','NOT NULL']]));

// stations
sects.push(h3('4.3.2 stations'));
sects.push(tbl(['Column','Type','Constraint'],[['station_code','TEXT','PRIMARY KEY'],['station_name','TEXT','NOT NULL'],['city','TEXT','NOT NULL'],['state','TEXT','NOT NULL'],['zone_code','TEXT','FK → zones(zone_code)']]));

// trains
sects.push(h3('4.3.3 trains'));
sects.push(tbl(['Column','Type','Constraint'],[['train_number','TEXT','PRIMARY KEY'],['train_name','TEXT','NOT NULL'],['train_type','TEXT','NOT NULL'],['source_code','TEXT','FK → stations(station_code)'],['dest_code','TEXT','FK → stations(station_code)'],['runs_on','TEXT','NOT NULL, DEFAULT All days'],['capacity','INTEGER','NOT NULL, DEFAULT 5']]));

// train_schedules
sects.push(h3('4.3.4 train_schedules'));
sects.push(tbl(['Column','Type','Constraint'],[['id','INTEGER','PRIMARY KEY AUTOINCREMENT'],['train_number','TEXT','FK → trains(train_number)'],['station_code','TEXT','FK → stations(station_code)'],['stop_number','INTEGER','NOT NULL'],['arrival_time','TEXT','Nullable (NULL for source)'],['departure_time','TEXT','Nullable (NULL for destination)'],['distance_km','INTEGER','NOT NULL, DEFAULT 0'],['halt_minutes','INTEGER','NOT NULL, DEFAULT 2']]));

// classes
sects.push(h3('4.3.5 classes'));
sects.push(tbl(['Column','Type','Constraint'],[['class_code','TEXT','PRIMARY KEY'],['class_name','TEXT','NOT NULL'],['fare_per_km','REAL','NOT NULL']]));

// pnr_bookings
sects.push(h3('4.3.6 pnr_bookings'));
sects.push(tbl(['Column','Type','Constraint'],[['pnr','TEXT','PRIMARY KEY'],['train_number','TEXT','FK → trains(train_number)'],['journey_date','TEXT','NOT NULL'],['from_station','TEXT','FK → stations(station_code)'],['to_station','TEXT','FK → stations(station_code)'],['class_code','TEXT','FK → classes(class_code)'],['coach','TEXT','NOT NULL'],['booking_date','TEXT','NOT NULL'],['total_fare','REAL','NOT NULL']]));

// passengers
sects.push(h3('4.3.7 passengers'));
sects.push(tbl(['Column','Type','Constraint'],[['id','INTEGER','PRIMARY KEY AUTOINCREMENT'],['pnr','TEXT','FK → pnr_bookings(pnr)'],['name','TEXT','NOT NULL'],['age','INTEGER','NOT NULL'],['gender','TEXT','NOT NULL'],['berth_pref','TEXT','DEFAULT No Preference'],['seat_number','TEXT','Nullable'],['booking_status','TEXT','DEFAULT CNF']]));

// train_running_status
sects.push(h3('4.3.8 train_running_status'));
sects.push(tbl(['Column','Type','Constraint'],[['id','INTEGER','PRIMARY KEY AUTOINCREMENT'],['train_number','TEXT','FK → trains(train_number)'],['station_code','TEXT','FK → stations(station_code)'],['status_date','TEXT','NOT NULL'],['actual_arrival','TEXT','Nullable'],['actual_departure','TEXT','Nullable'],['delay_arrival_min','INTEGER','DEFAULT 0'],['delay_depart_min','INTEGER','DEFAULT 0'],['platform_number','INTEGER','DEFAULT 1'],['has_passed','INTEGER','DEFAULT 0']]));

// notifications
sects.push(h3('4.3.9 notifications'));
sects.push(tbl(['Column','Type','Constraint'],[['id','INTEGER','PRIMARY KEY AUTOINCREMENT'],['train_number','TEXT','NOT NULL'],['message','TEXT','NOT NULL'],['created_at','DATETIME','DEFAULT CURRENT_TIMESTAMP']]));

// NORMALIZATION
sects.push(h2('4.4 Normalization Process'));
sects.push(h3('4.4.1 Unnormalized Form (UNF) — Initial Analysis'));
sects.push(p('In an unnormalized scenario, all railway data could be stored in a single flat table containing repeating groups and multi-valued attributes. For example, a single "TrainJourney" record might contain: train number, train name, train type, source station name, source city, source state, source zone, destination station name, destination city, destination state, destination zone, all intermediate stop names, all stop times, all stop distances, passenger names, passenger ages, genders, berth preferences, seat numbers, booking statuses, PNR numbers, journey dates, fare amounts, class names, delay information, platform numbers, and notification messages — all in one row with repeating groups for stops and passengers.'));

sects.push(h3('4.4.2 First Normal Form (1NF)'));
sects.push(p('To achieve 1NF, all repeating groups are eliminated and each field contains only atomic (indivisible) values. The single flat table is decomposed so that:'));
sects.push(bl('Each column holds a single value (no comma-separated lists except runs_on which is a display attribute, not a relational key).'));
sects.push(bl('Multi-valued attributes like "list of stops" become separate rows in train_schedules.'));
sects.push(bl('Multiple passengers per booking become separate rows in the passengers table.'));
sects.push(bl('A primary key is defined for every table.'));

sects.push(h3('4.4.3 Second Normal Form (2NF)'));
sects.push(p('2NF requires that all non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies). Since most tables use single-column primary keys (zone_code, station_code, train_number, pnr, class_code), partial dependency does not arise. For composite-key scenarios:'));
sects.push(bl('train_schedules uses a surrogate key (id) but logically depends on (train_number, station_code). Station details (station_name, city, state) are NOT stored here — they reside in the stations table and are accessed via JOIN. This eliminates partial dependency.'));
sects.push(bl('train_running_status similarly uses a surrogate key with logical dependency on (train_number, station_code, status_date). No station or train attributes are duplicated.'));
sects.push(bl('passengers depends on pnr (foreign key) but has its own surrogate primary key. Booking-level attributes (train_number, journey_date, fare) are NOT repeated per passenger — they remain in pnr_bookings.'));

sects.push(h3('4.4.4 Third Normal Form (3NF)'));
sects.push(p('3NF requires elimination of transitive dependencies. In our schema:'));
sects.push(bl('Station\'s zone_name is NOT stored in the stations table; only zone_code (FK) is stored. The zone_name is retrieved via JOIN with the zones table. This eliminates the transitive dependency: station_code → zone_code → zone_name.'));
sects.push(bl('Train source/destination station names are NOT stored in the trains table; only station codes are stored as foreign keys. Station names are resolved via JOINs.'));
sects.push(bl('In pnr_bookings, class_name is NOT stored — only class_code (FK) is present. The class_name and fare_per_km are accessed from the classes table.'));
sects.push(bl('Passenger details do not include any train or journey information directly — they reference the PNR, which in turn references the train and stations.'));

sects.push(h3('4.4.5 Boyce-Codd Normal Form (BCNF)'));
sects.push(p('BCNF requires that for every non-trivial functional dependency X → Y, X must be a superkey. Our schema satisfies BCNF because:'));
sects.push(bl('Every table\'s functional dependencies have the primary key (or a superkey) as the determinant.'));
sects.push(bl('No non-key attribute determines another non-key attribute in any table.'));
sects.push(bl('The use of surrogate keys (AUTOINCREMENT id) in train_schedules, passengers, train_running_status, and notifications ensures that each row is uniquely identifiable without composite key ambiguity.'));
sects.push(bl('All foreign key references point to primary keys of their respective parent tables, maintaining clean dependency chains.'));

// ER DIAGRAM
sects.push(h('5. Entity-Relationship Diagram'));
sects.push(p('The ER diagram below illustrates all entities, their attributes, primary keys (underlined), foreign key relationships, and cardinalities in the Smart Railway Operations Management System database.'));
sects.push(ph('INSERT ER DIAGRAM HERE — Use Draw.io, Lucidchart, or similar tool to create the ER diagram showing all 9 entities with their attributes, PKs, FKs, and relationship cardinalities (1:N, M:N). Export as an image and paste here.'));
sects.push(p('Key cardinalities in the ER diagram:'));
sects.push(tbl(['Relationship','Cardinality','Description'],[
  ['zones — stations','1 : N','One zone has many stations'],
  ['stations — trains','1 : N','One station is source/dest of many trains'],
  ['trains — train_schedules','1 : N','One train has many scheduled stops'],
  ['stations — train_schedules','1 : N','One station appears in many train schedules'],
  ['trains — pnr_bookings','1 : N','One train has many bookings'],
  ['classes — pnr_bookings','1 : N','One class type in many bookings'],
  ['pnr_bookings — passengers','1 : N','One PNR has many passengers'],
  ['trains — train_running_status','1 : N','One train has many status records'],
  ['train_running_status — notifications','1 : N (via trigger)','Delay updates trigger notifications'],
]));

// APPLICATION EXPLANATION
sects.push(h('6. DBMS Application — Explanation and Screenshots'));
sects.push(h2('6.1 Technology Stack'));
sects.push(tbl(['Component','Technology','Purpose'],[
  ['Database','SQLite (via sql.js)','Relational database engine — stores all entities'],
  ['Backend','Node.js + Express.js','RESTful API server exposing SQL queries as HTTP endpoints'],
  ['Frontend','HTML5, CSS3, JavaScript','User interface for querying and displaying database results'],
]));

sects.push(h2('6.2 Key DBMS Concepts Demonstrated'));

sects.push(h3('6.2.1 Complex Multi-Table JOIN Queries'));
sects.push(p('The application extensively uses SQL JOINs to retrieve related data across normalized tables. For example, the Train Running Status query joins 4 tables (trains, stations ×2, train_schedules, train_running_status) with LEFT JOIN for optional running status data:'));
sects.push(p('SELECT ts.stop_number, ts.arrival_time, ts.departure_time, s.station_code, s.station_name, COALESCE(rs.delay_arrival_min, 0) AS delay_arrival_min, COALESCE(rs.has_passed, 0) AS has_passed FROM train_schedules ts JOIN stations s ON ts.station_code = s.station_code LEFT JOIN train_running_status rs ON rs.train_number = ts.train_number AND rs.station_code = ts.station_code WHERE ts.train_number = ?'));

sects.push(h3('6.2.2 ACID Transactions'));
sects.push(p('Ticket booking uses explicit transaction control to ensure atomicity. The server executes BEGIN TRANSACTION before inserting into pnr_bookings and passengers, and issues COMMIT on success or ROLLBACK on failure. This guarantees that a booking is either fully completed (PNR + all passengers inserted) or fully rolled back, preventing orphaned or partial records.'));

sects.push(h3('6.2.3 Database Triggers'));
sects.push(p('An AFTER UPDATE trigger on train_running_status automatically inserts a notification record into the notifications table whenever a train\'s delay exceeds 30 minutes. The trigger SQL is:'));
sects.push(p('CREATE TRIGGER delay_notification AFTER UPDATE ON train_running_status WHEN NEW.delay_arrival_min > 30 OR NEW.delay_depart_min > 30 BEGIN INSERT INTO notifications (train_number, message) VALUES (NEW.train_number, \'Train \' || NEW.train_number || \' is significantly delayed...\'); END;'));

sects.push(h3('6.2.4 Aggregate Functions and Grouping'));
sects.push(p('The Delayed Passengers query uses MAX() aggregate function and GROUP BY to identify the maximum delay per passenger across all station stops, then orders results by severity:'));
sects.push(p('SELECT p.name, MAX(rs.delay_arrival_min, rs.delay_depart_min) as max_delay FROM passengers p JOIN pnr_bookings pb ON p.pnr = pb.pnr JOIN train_running_status rs ON pb.train_number = rs.train_number GROUP BY p.pnr, p.id ORDER BY max_delay DESC'));

sects.push(h3('6.2.5 Dynamic Fare Calculation'));
sects.push(p('Fare computation queries the classes table for fare_per_km and the train_schedules table for distance between boarding and alighting stations, performing arithmetic computation entirely within the application logic layer while reading base data from normalized tables.'));

sects.push(h2('6.3 Application Modules and Screenshots'));

sects.push(h3('6.3.1 Live Train Running Status'));
sects.push(p('Users enter a train number to query its live running status. The system executes a multi-table JOIN across trains, stations, train_schedules, and train_running_status to render a complete journey progress view with station-wise delay information and a visual progress bar.'));
sects.push(ph('INSERT SCREENSHOT: Train Running Status page showing train 12301 Howrah Rajdhani with journey progress bar, station-wise schedule table with arrival/departure times, delay status, and platform numbers'));

sects.push(h3('6.3.2 PNR Status Lookup'));
sects.push(p('PNR lookup queries pnr_bookings JOIN trains JOIN stations (×2) JOIN classes for booking details, and a separate query on the passengers table for the passenger manifest. Results display booking overview (train, date, class, fare) alongside individual passenger berth allocations and confirmation status (CNF/WL/RAC).'));
sects.push(ph('INSERT SCREENSHOT: PNR Status page showing booking details card (PNR, train, date, class, fare) and passenger details table with names, ages, berth preferences, seat numbers, and booking status'));

sects.push(h3('6.3.3 Trains Between Stations'));
sects.push(p('This module performs a self-join on train_schedules (ts1 JOIN ts2 on same train_number where ts1.stop_number < ts2.stop_number) to find all trains that pass through both the source and destination stations in the correct order. Results include departure/arrival times and computed distance.'));
sects.push(ph('INSERT SCREENSHOT: Trains Between Stations results showing NDLS to HWH route with list of available trains, departure/arrival times, distance, and train type badges'));

sects.push(h3('6.3.4 Station Live Board'));
sects.push(p('The station board aggregates all trains passing through a given station by querying train_schedules JOIN trains JOIN stations (for source/destination names) with LEFT JOIN on train_running_status for real-time delay and platform data.'));
sects.push(ph('INSERT SCREENSHOT: Station Live Board for NDLS (New Delhi) showing all arriving/departing trains with scheduled times, delays, platform numbers, and status'));

sects.push(h3('6.3.5 Ticket Booking'));
sects.push(p('The booking module first searches available trains between stations, then collects passenger details and class selection. On submission, it executes an ACID transaction: INSERT into pnr_bookings followed by INSERT into passengers, wrapped in BEGIN TRANSACTION / COMMIT with ROLLBACK on error.'));
sects.push(ph('INSERT SCREENSHOT: Ticket Booking page showing train selection, passenger form, class selector with dynamic fare calculation, and booking confirmation with generated PNR'));

sects.push(h3('6.3.6 Automated Delay Notifications (SMS Outbox)'));
sects.push(p('This module displays notifications auto-generated by the database trigger (delay_notification) whenever a train\'s delay exceeds 30 minutes. The notifications table is populated entirely by the trigger — no application code explicitly inserts into it.'));
sects.push(ph('INSERT SCREENSHOT: SMS Outbox / Notifications page showing trigger-generated delay alerts with train numbers, delay messages, and timestamps'));

sects.push(h3('6.3.7 Delayed Passengers Alert'));
sects.push(p('This module executes a complex aggregate query joining passengers, pnr_bookings, trains, and train_running_status to identify all passengers whose journeys are affected by current delays, ranked by delay severity.'));
sects.push(ph('INSERT SCREENSHOT: Delay Alerts page showing affected passengers with names, PNR numbers, train details, routes, and delay duration'));

// CONCLUSION
sects.push(h('7. Conclusion'));
sects.push(p('This project successfully demonstrates the design and implementation of a well-structured, normalized relational database for modelling the complex data relationships in a national railway operations system. The database schema — comprising 9 entities normalized to BCNF — eliminates data redundancy while maintaining referential integrity through carefully defined primary and foreign key constraints.'));
sects.push(p('Key DBMS concepts implemented include multi-table JOIN queries (up to 4 tables), ACID-compliant transactions for booking operations, database triggers for automated event-driven notifications, aggregate functions with GROUP BY for analytical queries, and COALESCE/LEFT JOIN patterns for handling optional real-time data. The procedural data simulation layer demonstrates how time-series operational data can be modelled and queried within a relational framework.'));
sects.push(p('The system proves that a carefully normalized relational schema, combined with efficient SQL query design, can power a feature-rich application without requiring denormalization or NoSQL alternatives — validating the enduring relevance of relational database principles for structured, relationship-heavy domains like transportation management.'));

// REFERENCES
sects.push(h('8. References'));
sects.push(bl('Elmasri, R. & Navathe, S.B. — Fundamentals of Database Systems (7th Edition)'));
sects.push(bl('SQLite Official Documentation — https://www.sqlite.org/docs.html'));
sects.push(bl('sql.js Library — https://github.com/sql-js/sql.js'));
sects.push(bl('Express.js Official Documentation — https://expressjs.com/'));
sects.push(bl('Indian Railways NTES — https://enquiry.indianrail.gov.in/ntes/'));

const doc = new Document({
  creator: 'Smart Railway DBMS Project',
  title: 'Smart Railway Operations Management System - DBMS Project Report',
  description: 'Course project report for Database Management System',
  sections: [{ children: sects }],
});

Packer.toBuffer(doc).then(buf => {
  const out = require('path').join(__dirname, 'DBMS_Project_Report.docx');
  fs.writeFileSync(out, buf);
  console.log('Report generated: ' + out);
});
