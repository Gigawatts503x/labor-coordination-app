# Labor Coordinator App - Project Outline

## Project Overview
Full-stack labor coordination and event management system built with **React** (frontend) and **Node.js/Express** (backend). Manages event requirements, technician assignments, pay calculations, and scheduling with conflict detection.

**Tech Stack:** React, JavaScript, Node.js, Express, PostgreSQL/MySQL, CSS3

---

## Current Architecture

### Frontend Structure
```
src/
├── components/
│   ├── EditableCell.js          (Inline editable table cells)
│   ├── EditableSelectCell.js    (Inline editable select dropdowns)
│   └── [Other components]
├── pages/
│   └── EventDetails.js          (Main event management component)
├── hooks/
│   ├── useAssignments.js        (Assignments API hook)
│   ├── useEvents.js
│   ├── useTechnicians.js
│   └── usePositions.js
├── utils/
│   └── api.js                   (API client for all requests)
└── styles/
    ├── EventDetails.css
    ├── requirements-table.css
    ├── assignments-table.css
    ├── requirements-form.css
    └── table-dark-mode.css
```

### Core Features
1. **Requirements Management**
   - Create/edit/delete event requirements
   - Define: date, location, set/start/end/strike times, position, techs needed
   - Inline editable cells for quick updates
   - Filter & sort by date, location, position
   - Coverage tracking (assigned/needed count)

2. **Assignments Management**
   - Assign technicians to requirements
   - Inline editing: date, start/end times, position, hours, rate type
   - Bulk edit functionality (right-click context menu)
   - Conflict detection (prevents double-booking)
   - Track: tech pay, customer billing

3. **Additional Features**
   - Settings modal (half-day/full-day hours, OT thresholds, DOT settings, base rates)
   - Summary calculations (total tech pay, total customer bill)
   - Responsive table layouts with dark mode support

---

## Recent Changes (Current Session)

### 1. Explicit "Assign" Button in Requirements Table
**Status:** In Progress
**Goal:** Better UX - users must deliberately click to assign (no accidental row clicks)

**Changes Needed:**
- Rename `handleSelectRequirement` → `handleAssignRequirement`
- Remove row `onClick` handler (no more implicit assignment on row click)
- Add new **"Assign" column** between "Assigned Techs" and "Actions"
- Button only shows when `assigned_count < techs_needed` (hides when fully staffed)
- Button text: "Assign" (orange/primary button)
- Clicking button: populates form fields + scrolls to assignment form

**Files to Update:**
- `EventDetails.js` - Replace handler, update table structure, add button logic

**Button Logic:**
```javascript
const isFull = assignedCount >= neededCount;
// Only render button if NOT full
{!isFull && (
  <button 
    className="btn btn-small btn-success"
    onClick={() => handleAssignRequirement(r)}
  >
    Assign
  </button>
)}
```

---

## File Generation Guidelines

### JavaScript Files
- Generate **complete, production-ready code**
- Use ES6+ syntax (arrow functions, destructuring, const/let)
- Include proper error handling and logging
- No TODOs or placeholder comments
- Follow existing code patterns in project

### CSS Files
- Update existing files as needed
- Use existing CSS variables and classes
- Mobile-responsive (flexbox/grid)
- Dark mode support where applicable
- Minimal, focused updates

---

## Code Style Conventions

**Current Project Standards:**
- Component structure: State → Effects → Handlers → Render
- Comment sections with `// ==========================================`
- Consistent naming: `camelCase` for variables/functions
- File imports organized by type (utils, components, styles)
- API calls centralized in `utils/api.js`
- State management: React hooks (useState, useEffect, custom hooks)

---

## Important Context for Next Thread

### API Endpoints (Backend)
Reference from `utils/api.js`:
- `GET /events/:id` - Fetch event details
- `GET /technicians` - All technicians
- `GET /requirements/:eventId` - Event requirements with coverage data
- `POST /requirements` - Create requirement
- `PATCH /requirements/:id` - Update requirement
- `DELETE /requirements/:id` - Delete requirement
- `POST /assignments` - Create assignment
- `PATCH /assignments/:id` - Update assignment (inline edits)
- `DELETE /assignments/:id` - Delete assignment
- `POST /assignments/bulk-update` - Update multiple assignments
- `GET/PUT /settings` - Company settings

### Key Data Structures

**Requirement Object:**
```javascript
{
  id, requirement_date, room_or_location,
  set_time, start_time, end_time, strike_time,
  position, techs_needed,
  assigned_count, assigned_techs: [{name, id}, ...]
}
```

**Assignment Object:**
```javascript
{
  id, event_id, technician_id, technician_name,
  assignment_date, start_time, end_time,
  position, hours_worked, rate_type,
  calculated_pay, customer_bill, requirement_id
}
```

---

## Common Patterns in Project

### Inline Cell Editing
```javascript
<EditableCell
  value={currentValue}
  type="date|time|text|number"
  onSave={value => handleSave(id, field, value)}
  displayValue="Display text"
/>
```

### Filtering & Sorting
- Filter objects store current filter state
- Sort field + direction toggle on header click
- `getFiltered AndSorted[Name]()` functions return filtered/sorted arrays

### Form Data Management
- Controlled inputs with `handleFormChange`
- Form state resets after successful submission
- Validation happens before submission (if required)

---

## Instructions for Next Thread

1. **Paste this file first** - For context
2. **Paste all .js files** - Component and hook files
3. **Paste all .css files** - Styling
4. **Describe the change needed** - Brief, specific request
5. **Reference this outline** - If new context needed, I'll ask

### Expected Response Format
- **JavaScript:** Full updated file(s) only
- **CSS:** Only changed sections or full file (as needed)
- **No explanations** - Code speaks for itself
- **Ask for files/context** - If needed to complete task

---

## Project Status

### Complete ✅
- Event CRUD
- Requirement CRUD with inline editing
- Assignment CRUD with inline editing
- Bulk edit assignments
- Scheduling conflict detection
- Coverage tracking
- Dark mode tables
- Settings management

### In Progress 🔄
- Explicit "Assign" button in requirements table
- (Remove implicit row-click assignment)

### Planned 📋
- (Add future features as needed)

---

## Quick Reference - File Purposes

| File | Purpose |
|------|---------|
| `EventDetails.js` | Main component - requirements & assignments UI + logic |
| `EditableCell.js` | Reusable inline editable cell component |
| `EditableSelectCell.js` | Reusable inline editable dropdown component |
| `useAssignments.js` | Custom hook for assignment API calls |
| `api.js` | Centralized API client - all endpoint calls |
| `EventDetails.css` | Main styling for event details page |
| `requirements-table.css` | Requirements table specific styles |
| `assignments-table.css` | Assignments table specific styles |
| `table-dark-mode.css` | Dark mode overrides for tables |

---

## Notes for Continuity

- **User:** Cody Watts (Tech Mentor Louisville)
- **Use case:** Managing AV/IT installation event labor, scheduling, and invoicing
- **Target:** Fast, clean UI with minimal friction for data entry
- **Preference:** No long explanations - focus on code updates
- **Code generation:** JavaScript files (ES6+) and CSS as needed

---

**Last Updated:** December 12, 2025
**Current Session Goal:** Add explicit "Assign" button to requirements table
