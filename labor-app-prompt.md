## 🚀 Labor Coordination App - Advanced Software Builder Session

I am building an application for an **AV Labor Coordinator** to coordinate event labor schedules, invoicing clients, and paying technicians. The previous thread introduced more issues than improvements.

Please act as an **advanced software builder** who analyzes code connections and delivers **FIXED code files** ready to replace current files. Goal: progressively build systematically to avoid breaking functionality.

---

### 📁 Project Structure & File Names

```
labor-coordination-app/
├── backend/
│   ├── api/
│   │   └── requirements.js
│   ├── config/
│   │   └── database.js
│   ├── data/
│   │   ├── labor.db
│   │   ├── labor.db-shm
│   │   └── labor.db-wal
│   ├── node_modules/
│   ├── routes/
│   │   └── index.js
│   ├── services/
│   ├── setup/
│   │   └── initDb.js
│   ├── server.js
│   ├── package-lock.json
│   └── package.json
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   │
│   ├── src/
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── index.css
│   │   ├── index.js
│   │   ├── reportWebVitals.js
│   │   ├── setupTests.js
│   │   │
│   │   ├── components/
│   │   │   ├── EditableCell.js
│   │   │   └── EditableSelectCell.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAllAssignments.js
│   │   │   ├── useAssignments.js
│   │   │   ├── useDataStore.js
│   │   │   ├── useEvents.js
│   │   │   ├── useRequirements.js
│   │   │   ├── useScheduleSync.js
│   │   │   ├── useSettings.js
│   │   │   └── useTechnicians.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── EventDetails.js
│   │   │   ├── ScheduleGrid.js
│   │   │   ├── ScheduleGrid-Gantt.js
│   │   │   ├── ScheduleGrid-Table.js
│   │   │   ├── Settings.js
│   │   │   └── Technicians.js
│   │   │
│   │   ├── styles/
│   │   │   ├── App.css
│   │   │   ├── assignments-table.css
│   │   │   ├── Dashboard.css
│   │   │   ├── EventDetails.css
│   │   │   ├── requirements-form.css
│   │   │   ├── requirements-table.css
│   │   │   ├── ScheduleGrid-Gantt.css
│   │   │   ├── ScheduleGrid-Table.css
│   │   │   ├── ScheduleGrid.css
│   │   │   ├── Settings.css
│   │   │   ├── table-dark-mode.css
│   │   │   └── Technicians.css
│   │   │
│   │   └── utils/
│   │       ├── api.js
│   │       ├── dateUtils.js
│   │       └── rateCalculator.js
│   │
│   ├── package-lock.json
│   └── package.json
│
├── data/
│   ├── labor.db
│   ├── labor.db-shm
│   └── labor.db-wal
│
├── GitHub: https://github.com/Gigawatts503x/labor-coordination-app.git
└── README.md
```

---

### ✅ Work Completed & 🔧 Issues Remaining

**Recent Work Completed:**
- ✅ ScheduleGrid table layout with drag-and-drop functionality
- ✅ Technician assignment and role management
- ✅ Badge styling for "NEEDED" status indicators
- ✅ Filter system for events and technicians
- ✅ Responsive design for mobile/tablet/desktop
- ✅ Design system CSS with color tokens and variables
- ✅ Gantt chart visualization for schedule
- ✅ Event dashboard with analytics
- ✅ Database setup and initialization

**Known Issues / Still Needs Fixing:**
- 🔧 Data between Events and Schedule pages is not updating in real time
- 🔧 Event invoicing calculation logic needs integration
- 🔧 Technician payment processing workflow
- 🔧 API endpoint connections between frontend and backend
- 🔧 Data persistence and state management across pages
- 🔧 Form validation on invoice and payment pages
- 🔧 Drag-and-drop functionality testing and refinement
- 🔧 Settings persistence to database
- 🔧 Requirements workflow and technician role assignments

---

### 📋 Instructions

- **GitHub Source:** https://github.com/Gigawatts503x/labor-coordination-app.git Main Branch (I'll commit updates; always pull latest)
- **Fix thoroughly:** Identify issue → explain solution → output full code file ready to replace
- **Ask first:** Briefly clarify before making functional changes
- **Match CSS style:** Review existing design system before modifying components
- **No surprises:** Don't change functionality without explicit approval
- **CSS/Styling: Lead with Design System:** Any new styling should use the color tokens from App.css (--color-primary, --color-text, etc.). Check the design system variables before suggesting new colors.

---

Let's begin
