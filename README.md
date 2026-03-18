# Project: Smart Railway Operations Management System (IndianRail Live)

## 1. Project Title
**IndianRail Live** - A Web-based National Train Enquiry System (NTES) Simulation

## 2. Project Overview
The "Smart Railway Operations Management System" is a comprehensive Database Management System (DBMS) project designed to model the complex data relationships of a national railway network. Inspired by the Indian Railways NTES, this project provides a full-stack web application that allows users to track live train running statuses, seamlessly query PNR (Passenger Name Record) details, view live station boards, and receive automated delay alerts. 

Rather than relying on external APIs, this system utilizes a fully independent relational database architecture where live journey progress and delays are procedurally simulated using actual server-time comparisons against scheduled timetables.

## 3. Technology Stack
This project was built from scratch using a lightweight but powerful technology stack:

### Frontend (Client-side)
* **HTML5:** Semantic structuring of the UI consisting of separated interactive tabs (Status, PNR, Station Board, Delays).
* **Vanilla CSS3:** Custom styling utilizing CSS variables, responsive flexbox/grid layouts, keyframe animations, and modern UI paradigms.
* **Vanilla JavaScript (ES6+):** Asynchronous `fetch` calls to the backend REST API, DOM manipulation, and dynamic progress bar calculations.

### Backend (Server-side)
* **Node.js:** The runtime environment executing the server logic.
* **Express.js:** Web framework used to define RESTful API endpoints (`/api/trains`, `/api/pnr/:pnr`, `/api/delayed-passengers`, etc.).

### Database (DBMS Layer)
* **SQLite (via `sql.js`):** A self-contained, serverless, relational database engine. SQLite was chosen to model complex real-world relationships natively while keeping the application extremely portable and self-hosted.

## 4. Key DBMS Concepts Implemented
As a DBMS-focused academic project, the core engineering occurs in the database layer. The following concepts have been thoroughly implemented:

1. **Relational Database Design (Normalized Schema):** The database is heavily normalized to eliminate redundancy, utilizing 8 distinct interlocking tables.
2. **Primary & Foreign Key Constraints:** Strict referential integrity is enforced (e.g., A `passenger` must reference a valid `pnr`, which references a valid `train_number`).
3. **Complex SQL Queries:** Substantial use of multi-table `JOIN`s, `GROUP BY`, aggregate functions (`MAX()`), and string manipulation directly within SQL to format passenger manifests and delay metrics.
4. **Procedural Data Simulation:** Database seeding includes a complex simulation algorithm that compares the local hardware `Date()` timezone to the scheduled timetables, injecting procedural random delays into the database to mimic real-time network states.

## 5. Database Schema & Tables
The project comprises the following entity tables:
* `zones`: Administrative railway zones.
* `stations`: Railway stations mapped to geographical cities, states, and zones.
* `trains`: Base train information, types (Rajdhani, Vande Bharat, etc.), mapping `source` and `destination` stations.
* `train_schedules`: Detailed multi-stop itineraries for every train defining arrival/departure times, distance intervals, and halts.
* `classes`: Travel accommodations (1A, SL, CC, etc.) and fare generation modifiers.
* `pnr_bookings`: Master booking records mapping financial data, trains, and origin-destination logic.
* `passengers`: Child records to PNRs, storing age, gender, berth allocations, and ticket confirmation states (CNF, WL, RAC).
* `train_running_status`: The dynamic table tracking actual departure/arrival metrics and calculated delays across the network.

## 6. Core Features & Deliverables
* **Live Train Running Status:** Calculates and visually represents the dynamic percentage of a train's journey completion using SQL time-checks.
* **PNR Status Lookup:** Queries multiple linked tables to output booking overview alongside an itemized passenger list.
* **Trains Between Stations:** Evaluates train routes passing safely between user-defined "From" and "To" station codes.
* **Live Station Departure Boards:** Aggregates arriving and departing trains at specific stations with platform data.
* **Dynamic Delay Alerts Panel:** Uses deeply nested aggregate SQL logic to flag all active PNR bookings that are affected by procedural delays on the network.

## 7. Conclusion
This project successfully demonstrates the mapping of real-world logistical data structures into a fully functional Relational Database model. By building a custom end-to-end web client, it proves how efficiently normalized data can be queried, joined, and presented mathematically to end-users without relying on massive, bloated frameworks.
