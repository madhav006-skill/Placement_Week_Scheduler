# Placement Week Scheduler & Dynamic Replanner

A production-quality scheduling engine and coordinator dashboard for college placement weeks. Designed to generate feasible schedules under complex constraints and perform **minimum-disruption replanning** when real-world disruptions (delays, dropouts) occur.

## Architecture

* **Backend:** Node.js, Express, Mongoose
* **Database:** MongoDB (`mongodb-memory-server` for out-of-the-box local execution)
* **Frontend:** React, TypeScript, TailwindCSS, Vite
* **Paradigm:** Clean layered architecture (Routes -> Services -> Models)

## How to Run Locally

This project requires **Node.js** (v16+). It uses an in-memory MongoDB instance, so you **do not** need to install a database server.

### 1. Start the Backend
```bash
cd backend
npm install
npm start
```
The backend will run on `http://localhost:5000`.

### 2. Start the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 1. Data Model
* **Company**: Has priority tiers, panel counts, duration rules, and CGPA cutoffs.
* **Student**: Has CGPA and branch.
* **Shortlist**: Realistic N-to-N relationships where top students are shortlisted by multiple tier-1 companies.
* **ScheduleVersion**: Maintains a linked history of schedules to calculate "Diffs" and measure replan churn.
* **Interview**: The atomic unit (Student + Company + Room + Panel + Time).

## 2. Scheduling Policy (Baseline)
The baseline scheduler uses a **Greedy Score-Based Heuristic**.
* **Hard Constraints**: No overlapping students, no overlapping rooms, no overlapping panels.
* **Scoring Logic**: It tries to place interviews as early as possible while minimizing the waiting time (gaps) between a student's interviews on the same day. Priority 1 companies get scheduled first.
* **Infeasibility**: If a slot cannot be found, it is explicitly marked `UNSCHEDULED` with a reason (e.g., "Room/Panel conflict"). It does not silently fail.

## 3. Replanning Strategy (The Core Feature)
When a disruption occurs (e.g., a company is 3 hours late):
1. **Freeze**: All unaffected appointments are locked into the new version to minimize churn.
2. **Invalidate**: Interviews violating the new constraints are marked unscheduled and their resources are released.
3. **Strong Local Repair**: The engine attempts to slot the invalidated interviews into remaining empty gaps using the baseline scoring algorithm, preferring times close to their original slots.
4. **Diff Generation**: It explicitly calculates the changes (Moved, Cancelled) and identifies which students and companies need to be notified.

### Replan Cost Function
`Cost = (Moved Interviews * 1) + (Affected Students * 2) + (Cancellations * 10)`
The system prioritizes avoiding cancellations at all costs, followed by minimizing the number of students disturbed.

## 4. Defense & Simulation Mode
The frontend includes a **Disruption Simulator**. During a live defense, you can trigger:
* Company Arrives Late
* Panel Drops Out
* Student Withdraws
* Room Unavailable

Clicking **"Inject Disruption & Replan"** will generate a new schedule version and immediately present a human-readable **Replan Summary Log**, explaining exactly what changed and who was affected.
