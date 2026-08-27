# Mirai Labs Technical Assessment A: Placement Week Scheduler & Dynamic Replanner

A production-grade scheduling engine and coordinator dashboard designed to manage college placement weeks. This system generates feasible interview schedules under complex constraints and performs **minimum-disruption replanning** when real-world disruptions (e.g., delays, dropouts, room unavailability) occur.

This project is a comprehensive solution for the **Mirai Labs Software Developer Intern Technical Assessment — Assignment A**.

---

## 🏗 Architecture & Tech Stack

The project follows a clean layered architecture (Routes -> Services -> Models) built in a single monorepo.

* **Backend Environment:** Node.js, Express.js
* **Database:** **MongoDB Atlas** (Cloud Persistence). The application explicitly uses a persistent cloud database as the single source of truth for all manual management and scheduling data.
* **Frontend:** React, TypeScript, Tailwind CSS, Vite, React Router DOM
* **Deployment:** Hosted entirely on **Vercel** (Frontend via Vercel Static Build, Backend via Vercel Serverless Functions).

---

## ✨ Core Features

### 1. Realistic Dataset Generation
The system features a realistic demo dataset generator that instantly spins up data reflecting real-world university placements:
* 35 Companies with varied priority tiers (1-3), interview durations, and availability windows.
* 800 Students with varied branches and CGPAs.
* 20 Interview Rooms and specific panels attached to companies.
* **Realistic Overlap:** The generator simulates the phenomenon where top-performing students are shortlisted by multiple high-tier companies, deliberately creating scheduling bottlenecks.

### 2. Manual Coordinator Management (CRUD)
The dashboard provides full manual data management natively integrated with MongoDB:
* **Students Page:** View all students, their shortlists, and statuses. Coordinators can explicitly add new students, edit details, or trigger a "Withdraw" action.
* **Companies & Panels Pages:** View company requirements and individually mark specific panels as available/unavailable.
* **Rooms Page:** Monitor and toggle physical room availability.
* **Full Schedule Page:** A comprehensive table with advanced filtering (by Day, Status, text search) to view the state of the placement week.

### 3. Baseline Scheduling Policy
The baseline scheduler generates the initial interview timetable using a **Greedy Score-Based Heuristic**.

**Hard Constraints Enforced:**
1. No student can have overlapping interviews.
2. No room can host multiple interviews simultaneously.
3. No panel can conduct multiple interviews simultaneously.
4. Interviews must occur strictly within the company's specified time window and placement day.
5. Students must meet the CGPA cutoff and be explicitly shortlisted by the company.

**Scoring Logic:**
The scheduler attempts to place interviews as early as possible while minimizing the waiting time (gaps) between a student's interviews on the same day. Priority 1 companies get scheduled first.

**Infeasibility Reporting:**
If an interview slot cannot be found due to severe bottlenecks, it is explicitly preserved in the database and marked `UNSCHEDULED` with a concrete reason (e.g., "No room available" or "Company time window exhausted"). It never silently drops requests.

### 4. Minimum-Disruption Replanning (The Heart of the Assignment)
Replanning is the core technical challenge of this assignment. When a real-world disruption occurs, the system avoids regenerating the entire schedule from scratch. Instead, it aims for a **Valid schedule + minimum necessary changes**.

**Supported Disruptions:**
1. **Company Delay:** (e.g., Recruiter is 3 hours late).
2. **Panel Drop:** (e.g., 1 out of 3 panels for a company becomes unavailable).
3. **Student Withdrawal:** (e.g., Student gets placed off-campus and withdraws).
4. **Room Unavailable:** (e.g., AC breaks down in Room 4).

**The Local Repair Algorithm:**
1. **Freeze:** Load the current schedule version and lock all unaffected appointments into the new version to minimize churn.
2. **Invalidate:** Find interviews directly invalidated by the disruption and release their resources.
3. **Strong Local Repair:** Attempt to slot the invalidated interviews into remaining empty gaps. The algorithm assigns a high score to slots that are closest to the original time, strongly preferring to keep the interview on the same day with minimal time drift. 
4. **Fallback:** If local repair fails, mark the appointment as `UNSCHEDULED`.

### 5. Schedule Versioning, Diffs, and Metrics
* **Versioning:** Every replan creates a new `ScheduleVersion` document linking to its parent. The previous schedule is permanently preserved.
* **Replan Diff:** The system compares Version N with Version N+1 to generate a human-readable diff summarizing exactly what moved, what was cancelled, what was newly scheduled, and identifying the affected stakeholders (students and companies that must be notified).
* **Metrics & Replan Cost:**
  * Calculates Scheduled Rate, Student Clashes, Room Utilization, and **Replan Churn** (percentage of existing interviews moved/cancelled).
  * **Configurable Cost Model:** `Cost = (Moved * 1) + (Affected Students * 2) + (Cancellations * 10)`. The cost penalizes cancellations heavily, providing an explainable metric for schedule quality.

---

## 🚀 How to Run and Test

### A. Live Production (Vercel)
The complete application is continuously deployed. 
- You can access the live dashboard here: **[Vercel Deployment URL]** *(Insert your Vercel URL here)*.

### B. Running Locally
Ensure you have **Node.js (v18+)** installed. The project points to a MongoDB Atlas cluster, ensure your IP is whitelisted or set to `0.0.0.0/0` in Atlas.

#### 1. Start the Backend
Open a terminal in the root directory:
```bash
cd backend
npm install
npm start
```
The backend API will run on `http://localhost:5000`.

#### 2. Start the Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🛡 Live Defense Demonstration Guide

During a technical evaluation, you can demonstrate the robustness of the system using this workflow:

1. **Initial Setup:** Click **"Regenerate Dataset & Baseline"** to prove the system can generate a complex 800-student dataset and schedule it from scratch while enforcing hard constraints.
2. **Review Metrics:** Show the Dashboard metrics (Scheduled Rate, Replan Churn at 0%).
3. **Manual Validation:** Navigate to the **Students Page**. Edit a student or manually withdraw them to show that manual CRUD operations persist to MongoDB.
4. **Execute a Complex Disruption:**
   - On the Dashboard, use the **Disruption Simulator**.
   - Select **Company Delay** and delay a major Day-1 recruiter by 3 hours.
   - Click **Inject Disruption & Replan**.
5. **Explain the Output:**
   - The UI will immediately show the **Replan Diff**.
   - Show how unaffected students were kept at their exact original times.
   - Show how the affected students were shifted slightly using *Local Repair*, rather than randomizing the entire day.
   - Point to the **Replan Cost** and **Affected Stakeholders** list as proof of enterprise readiness.
