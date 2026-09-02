# EWO Editor Hub - Project Context

## Project Overview
The EWO Editor Hub is an internal management portal for video editors, illustrators, and ads design teams. It serves as a unified workspace offering daily progress reporting, attendance logging (clock-in/out), schedule viewing, leave application, and team resources/wiki.

## Tech Stack
-   **Frontend**: React.js, Vite, React Router DOM, Framer Motion (for animations), Lucide React (for icons).
-   **Styling**: Pure CSS using a strictly defined variables system (`src/styles/variables.css`). Relies on flexbox, CSS grids, and modern layout properties avoiding heavy frameworks like Tailwind unless strictly needed.
-   **Backend**: Serverless Google Apps Script (`appscript/Code.gs`). The app communicates via `doPost` to read and write rows into an internal Google Sheets database.

## Architecture & Authentication
-   **Authentication**: Custom implementation checking `Employee List` via `Code.gs`. Upon successful login (`LoginPage.jsx`), user data (`userName`, `userEmail`, `userRole`, and `loginTimestamp`) is persisted into standard `localStorage`.
-   **Session Security**: Managed by `ProtectedRoute.jsx`. Sessions expire after 30 days based on `loginTimestamp` logic. Legacy role-selection mechanisms have been fully purged from the codebase.
-   **Data Storage (Frontend)**: Highly dependent on `localStorage` for forms state resilience, autocomplete caching (`ewo_all_projects_cache`), custom client entries, and auth credentials.
-   **API Proxy & Edge Caching**: To hide the Google Apps Script URL from the frontend and prevent network waterfalls, the project uses a **Cloudflare Pages Function** (`functions/api/exec.js`) as a proxy endpoint (`/api/exec`). This proxy aggressively caches all `GET` requests using Cloudflare's Edge Cache for 5 minutes (`s-maxage=300`). Frontend components can bypass this cache and force a fresh fetch by appending `&_refresh=true` to their queries. `POST` requests are never cached.

## Folder Tree Structure
```text
D:\Praktek\Progress Editor Ewo\
├── .agents/                    # Agent-specific workflows and rules
├── appscript/
│   └── Code.gs                 # The core backend logic (Google Apps Script). MUST NOT be ignored.
├── public/                     # Static assets (Favicons, PDFs, illustrations)
│   ├── login-illustration.png  # Parallax hero image for LoginPage
│   └── logo.jpg
├── src/
│   ├── components/
│   │   ├── admin/              # Admin pages modules (LeaveManager, ProjectManager, ProgressLog, AttendancePanel)
│   │   ├── layout/             # Structural views (Layout, Sidebar, ProtectedRoute, PageWrapper)
│   │   ├── ui/                 # Reusable primitive atomic components (Badge, Button, Card, Modal, SearchInput)
│   │   ├── AttendanceCard.jsx  # Interactive Clock-in/Clock-out module
│   │   ├── ProgressForm.jsx
│   │   └── UpcomingDeadlines.jsx
│   ├── data/                   # Static data stores
│   ├── hooks/                  # Global React hooks
│   ├── pages/                  # Top-level application routes
│   │   ├── AdminPage.jsx       # Admin dashboard & unified view for tables
│   │   ├── Dashboard.jsx       # User landing page with daily overview
│   │   ├── LoginPage.jsx       # Custom-branded 2-pane authentication wall
│   │   ├── ProgressFormPage.jsx# Daily tasks tracking submission UI
│   │   └── (Other operational pages like Learn, Wiki, Resources, Schedule)
│   ├── styles/                 # Master CSS stylesheets logically split by concern
│   │   ├── variables.css       # Color palettes, spaces, radiuses, shadows
│   │   └── *.css               # Feature-specific stylesheets
│   ├── utils/                  # Helper logic modules
│   ├── App.jsx                 # Route declarations & AnimatePresence provider
│   └── main.jsx                # React DOM Mount node
└── vite.config.js              # Vite compiler config
```

## Important Development Rules
1. **Forms Validation**: Always lock inputs logically whenever the value comes from an authenticated user context (e.g., locking the editor name field using `userName`). 
2. **Branding & UI**: The UI emphasizes rounded corners, subtle interactive gradients, framer-motion micro-animations, and minimal, uncluttered layouts. Adhere to internal CSS variables (i.e., `var(--primary-600)`).
3. **Admin Backend Deployment**: **Crucial:** Any updates applied to `appscript/Code.gs` MUST be manually redeployed to Google Apps Script as a 'New Deployment' before the frontend can consume the new logic.
4. **Secrets Management**: DO NOT commit API keys or sensitive credentials into Git history. Adhere strictly to the `.gitignore` exclusions.
