# Admin Page Plan — EWO Editor Hub

## Overview

A **password-protected `/admin` page** that gives supervisors/managers a real-time, read-only dashboard to monitor all employee activity across the EWO Editor Hub system. The admin page pulls data from the same Google Sheets backend (via new GET endpoints in `Code.gs`) and presents it through a polished, card-based dashboard UI.

---

## Data Sources (Google Sheets)

| Sheet | Columns | Purpose |
|---|---|---|
| `Progress_VideoEditor` | No, Tanggal, Editor, Judul, Klien, Jumlah_Scene, Comment, Screenshot | VE daily progress |
| `Progress_Illustrator` | No, Tanggal, Editor, Judul, Klien, Jumlah_Scene, Comment, Screenshot | Illustrator daily progress |
| `Attendance_VideoEditor` | ID, Date, Name, Clock In, Clock Out, Jumlah_Scene, Duration, Status, To-Do | VE attendance |
| `Attendance_Illustrator` | ID, Date, Name, Clock In, Clock Out, Jumlah_Scene, Duration, Status, To-Do | Illustrator attendance |
| `Upcoming_Deadline` | Title/Milestone, Client, Deadline Date | Project deadlines |
| `Cuti` | ID, No, Tanggal, Nama, Role, Start, End, Duration, Alasan, Notes, Approval, Message | Leave requests |

**Employee Roster** (from `ProgressForm.jsx`):
- **Video Editors**: Zayn, Dadan, Faqih
- **Illustrators**: Vanda, Rosdiana, Dayah

---

## Admin Page Sections

### 1. 🔐 Authentication Gate
- Simple password prompt modal (hardcoded password or env variable)
- Password stored in `sessionStorage` to persist across page refreshes within the session
- No access to admin data without correct password

### 2. 📊 Overview Stats Strip (Top)
A horizontal row of summary stat cards:
- **Total Scenes Today** — sum of all `Jumlah_Scene` from both Progress sheets for today
- **Currently Clocked In** — count of employees with Clock In but no Clock Out today
- **Pending Leave Requests** — count of `Cuti` rows where Approval = "Pending"
- **Active Deadlines** — count of deadlines not yet passed

### 3. 👥 Live Attendance Panel
A table or card grid showing **each employee's current status for today**:

| Employee | Role | Status | Clock In | Clock Out | Duration | Scenes Today |
|---|---|---|---|---|---|---|
| Zayn | Video Editor | 🟢 Working | 9:00 AM | — | 3h 20m | 25 |
| Dadan | Video Editor | ⚪ Not Clocked In | — | — | — | 0 |
| Vanda | Illustrator | 🔴 Clocked Out | 8:30 AM | 5:30 PM | 9h | 18 |

- Color-coded status badges: 🟢 Working, 🔴 Clocked Out, ⚪ Not Clocked In, 🟡 On Leave
- Filter by role (All / Video Editor / Illustrator)

### 4. 📈 Progress Log (Scrollable Table)
A detailed, filterable log of all progress submissions:
- Columns: Date, Editor, Role, Project Title, Client, Scenes, Comment
- **Filters**: Date range picker, Editor dropdown, Client dropdown, Role toggle
- **Sort** by any column
- Paginated or virtual scroll for large datasets
- Search bar for quick project title lookup

### 5. 📅 Leave Management Panel
List of all leave requests with status management:
- Shows: Name, Role, Submitted Date, Leave Period (Start → End), Duration, Reason, Status
- Status badges: 🟡 Pending, 🟢 Approved, 🔴 Rejected
- **Admin actions**: Approve / Reject buttons with optional message field
- Filter by status (All / Pending / Approved / Rejected)

### 6. ⏰ Attendance History
A date-filtered view of historical attendance data:
- Date picker to view any past date
- Same table layout as Live Attendance but for selected date
- Weekly/monthly summary view with total hours and scenes per employee

### 7. 🎯 Upcoming Deadlines
Reuses existing `Upcoming_Deadline` data, displayed as:
- Timeline or card list sorted by deadline proximity
- Color-coded urgency: 🔴 Overdue, 🟡 This Week, 🟢 Future

---

## New Backend Endpoints (Code.gs)

### GET Endpoints (via `doGet`)
| Action | Parameters | Returns |
|---|---|---|
| `getAdminOverview` | — | Stats: total scenes today, clocked-in count, pending leaves, active deadlines |
| `getAdminAttendance` | `date` (optional, defaults to today) | All attendance rows for the given date, both teams |
| `getAdminProgress` | `startDate`, `endDate`, `editor`, `client` (all optional) | Filtered progress log from both teams |
| `getAdminLeaves` | `status` (optional) | All leave requests, optionally filtered by status |

### POST Endpoints (via `doPost`)
| Action | Parameters | Returns |
|---|---|---|
| `updateLeaveStatus` | `id`, `status` ("Approved"/"Rejected"), `message` (optional) | Updates the Cuti sheet row |

---

## Frontend Structure

### New Files
```
src/
├── pages/
│   └── AdminPage.jsx           # Main admin page component
├── components/
│   └── admin/
│       ├── AdminAuthGate.jsx    # Password modal
│       ├── OverviewStats.jsx    # Top stats strip
│       ├── AttendancePanel.jsx  # Live attendance table
│       ├── ProgressLog.jsx      # Filterable progress table
│       ├── LeaveManager.jsx     # Leave approval panel
│       └── AttendanceHistory.jsx # Historical attendance view
├── styles/
│   └── admin.css               # Admin page styles
```

### Modified Files
- `App.jsx` — Add `/admin` route (outside ProtectedRoute, uses own auth)
- `src/pages/index.js` — Export AdminPage
- `appscript/Code.gs` — Add new GET/POST handlers for admin data

---

## Access & Security
- The `/admin` route is **separate from the role-based ProtectedRoute** — it doesn't require a "role" in localStorage
- A simple password gate provides access control
- Admin session lives in `sessionStorage` (cleared when tab closes)
- Admin page is **not visible in the sidebar** for regular users

---

## UI/UX Notes
- Follows existing design system (`variables.css` tokens)
- Dark header/accent for admin to visually distinguish from regular editor views
- Responsive: works on desktop (primary) and tablet
- Loading skeletons while fetching data
- Auto-refresh option (poll every 60s or manual refresh button)
- Uses Lucide icons consistent with the rest of the app