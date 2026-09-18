# Ewo Hub - Project Context

## Project Overview
The Ewo Hub is an internal management portal for video editors, illustrators, and ads design teams. It serves as a unified workspace offering daily progress reporting, attendance logging (clock-in/out), schedule viewing, leave application, team resources/wiki, and client moodboard guidelines.

## Tech Stack
-   **Frontend**: React.js, Vite, React Router DOM, Framer Motion (for animations), Lucide React (for icons).
-   **Styling**: Pure CSS using a strictly defined variables system (`src/styles/variables.css`). Relies on flexbox, CSS grids, and modern layout properties avoiding heavy frameworks like Tailwind unless strictly needed.
-   **Backend**: Serverless Google Apps Script (`appscript/Code.gs`). The app communicates via `doPost` to read and write rows into an internal Google Sheets database.

## Architecture & Authentication
-   **Authentication**: Custom implementation checking `Employee List` via `Code.gs`. Upon successful login (`LoginPage.jsx`), user data (`userName`, `userEmail`, `userRole`, and `loginTimestamp`) is persisted into standard `localStorage`.
-   **Session Security**: Managed by `ProtectedRoute.jsx`. Sessions expire after 30 days based on `loginTimestamp` logic. Legacy role-selection mechanisms have been fully purged from the codebase.
-   **Data Storage (Frontend)**: Highly dependent on `localStorage` for forms state resilience, autocomplete caching (`ewo_all_projects_cache`), custom client entries, and auth credentials.
-   **API Proxy & Edge Caching**: To hide the Google Apps Script URL from the frontend and prevent network waterfalls, the project uses a **Cloudflare Pages Function** (`functions/api/exec.js`) as a proxy endpoint (`/api/exec`). This proxy aggressively caches all `GET` requests using Cloudflare's Edge Cache for 5 minutes (`s-maxage=300`). 
    - Whenever fresh data is required (e.g. user clicks Refresh or cache expires), frontend fetchers (`projectFetcher.js`) pass `forceRefresh: true`, which appends `&_refresh=true&_t=${Date.now()}`.
    - Cloudflare Pages Function checks `url.searchParams.has('_refresh')`, sets `Cache-Control: no-store, no-cache, must-revalidate`, and fetches directly upstream from Apps Script, bypassing edge caching completely. `POST` requests are never cached.

## Duplicate Submission Prevention Architecture
To prevent duplicate progress logs caused by rapid double-clicks, slow network connections, or browser retries:
1.  **Frontend In-Flight Lock & Persistent Submission ID (`ProgressFormPage.jsx`)**:
    - `isSubmittingRef` boolean ref blocks concurrent click events.
    - `submissionIdRef` generates and preserves a unique `sub_${Date.now()}_${random}` token across retries for the same form state. It only regenerates after a successful submission or form reset. If a network timeout causes a retry, the *exact same* ID is sent.
2.  **Backend Lock & Content Deduplication (`Code.gs`)**:
    - `LockService.getScriptLock()` is acquired early to prevent concurrent race conditions.
    - Idempotency check: Looks up `submissionId` in `SubmissionLog` *before* handling any Google Drive screenshot uploads.
    - Content deduplication: Inspects the last 25 rows in `Progress_VideoEditor` for matching `[Date, Editor, Project Title, Client, Scene(s)]`. If a duplicate is submitted within 60 minutes, it returns `{ success: true, message: "Progress already submitted (duplicate detected).", isDuplicate: true }` without writing a duplicate row or creating orphaned Drive files.
3.  **Admin UI Duplicate Auditing (`ProgressLog.jsx`)**:
    - Client-side deduplication detector tags rows that share the same `[date, editor, title, client, scenes]`.
    - Renders a warning `Duplicate` badge on repeated entries.
    - Provides a "Hide Duplicates" toggle in the filter bar so administrators can declutter historical duplicates.

## Role Mapping & Attendance Consistency
- **Role Badge Mapping**: Standardized via `getRoleBadge(role)`. Any role string containing "editor" or "ve" (e.g. `Sr. Video Editor`) maps to `VE` (`.admin-role-pill.ve`). Any role containing "illustr" or "ill" maps to `ILL` (`.admin-role-pill.ill`).
- **Attendance Sheet Routing**: `AttendanceCard.jsx` checks the raw user role (`userRoleRaw`) for "editor" to ensure video editors are always routed to `Attendance_VideoEditor` regardless of display title.
- **Admin Attendance Role Resolution**: `handleGetAdminAttendance` in `Code.gs` cross-references the official employee directory in `Employee List` so users (such as "Zayn") receive their true role (`Sr. Video Editor`) instead of default sheet tab inferences.

## UI Table Styling & Schedule Standards
- **Global Table Styling (`.admin-table`)**:
  - Unified across `AdminPage.jsx` and `YourSchedule.jsx`. Inline table override styles are avoided.
  - Table `#` index columns use `.col-num` (`width: 48px; min-width: 48px; padding: 10px 4px !important; white-space: nowrap !important; text-align: center; font-variant-numeric: tabular-nums;`) to completely prevent vertical character-wrapping (e.g. `13` splitting into `1` and `3`).
  - "Role" and "Brief" columns are removed from `YourSchedule.jsx` to maximize space. Brief links are now directly embedded into the Project Name as a styled interactive hyperlink (`.ys-table-project-link`) with an external link indicator.
  - Text wrapping is enabled for `Project`, `Client`, and `Notes` columns (`word-break: break-word; white-space: normal;`) to prevent horizontal overflow and truncation. The `Risk` column width is expanded to `120px` (`min-width: 120px`).
  - Deadlines are formatted cleanly using `formatScheduleDate` (e.g., `18 Sep 2026`).
- **Dashboard Schedule Widget & Schedule Filtering (`YourSchedule.jsx`)**:
  - **Category/Status Filtering**: Ignores and filters out projects in `"Ready to Illus"` or `"Ready to review"` categories.
  - **Internal MMB Scheduling**: For internal projects (`clients === 'Internal MMB'`), only projects with `"Ready to Edit"` or `"Editor on Duty"` are eligible to appear on the editor's schedule.
  - **Widget Ordering**: Client projects are prioritized and displayed *first*, followed by internal projects. Within each group, items are sorted chronologically by deadline date (earliest deadlines first).
  - **Clean Widget Design**: Minimal, clutter-free 2-row card displaying only the client tag (top left), deadline chip (top right), project title (bottom row), and full-height Google Drive folder button along the right edge. All secondary status badges and risk labels are omitted from the widget.

## Folder Tree Structure
```text
D:\Praktek\Progress Editor Ewo\
├── .agents/                    # Agent-specific workflows and rules
├── appscript/
│   └── Code.gs                 # The core backend logic (Google Apps Script). MUST NOT be ignored.
├── public/                     # Static assets (Favicons, PDFs, illustrations)
│   ├── login-illustration.png  # Parallax hero image for LoginPage
│   ├── logo.jpg
│   └── moodboard/              # Client moodboard static reference assets
│       └── images/             # Extracted reference images (image1.png - image19.png)
├── src/
│   ├── components/
│   │   ├── admin/              # Admin pages modules (LeaveManager, ProjectManager, ProgressLog, AttendancePanel)
│   │   ├── layout/             # Structural views (Layout, Sidebar, ProtectedRoute, PageWrapper)
│   │   ├── ui/                 # Reusable primitive atomic components (Badge, Button, Card, Modal, SearchInput)
│   │   ├── AttendanceCard.jsx  # Interactive Clock-in/Clock-out module
│   │   ├── ProgressForm.jsx
│   │   └── UpcomingDeadlines.jsx
│   ├── data/                   # Static data stores
│   │   ├── lessons.json        # Learning courses & lesson curriculum data
│   │   └── clientMoodboardData.js # Client moodboard schema & profiles database
│   ├── hooks/                  # Global React hooks
│   ├── pages/                  # Top-level application routes
│   │   ├── AdminPage.jsx       # Admin dashboard & unified view for tables
│   │   ├── ClientMoodboard.jsx # Client moodboard gallery, rules, specs & AI prompts
│   │   ├── Dashboard.jsx       # User landing page with daily overview
│   │   ├── LoginPage.jsx       # Custom-branded 2-pane authentication wall
│   │   ├── ProgressFormPage.jsx# Daily tasks tracking submission UI
│   │   └── (Other operational pages like Learn, Wiki, Resources, Schedule)
│   ├── styles/                 # Master CSS stylesheets logically split by concern
│   │   ├── variables.css       # Color palettes, spaces, radiuses, shadows
│   │   ├── clientMoodboard.css # Client moodboard & anti-stretch gallery styles
│   │   └── *.css               # Feature-specific stylesheets
│   ├── utils/                  # Helper logic modules
│   ├── App.jsx                 # Route declarations & AnimatePresence provider
│   └── main.jsx                # React DOM Mount node
└── vite.config.js              # Vite compiler config
```

## Client Moodboard Module (`/client-moodboard`)

### Overview
The Client Moodboard serves as an interactive visual reference guide for illustrators and video editors at PT. MATA TERBUKA LEBAR. It provides client-specific character styles, background requirements, narrator ratios, turnaround deadlines, gore/sexual censorship rules, Gemini AI background prompts, scene generation spreadsheets, and video reference links.

### How to Add More Client Data Later
When new client briefs and moodboard references are finalized (e.g. for `Bryan`, `Christen`, `Damian`, `Dena`, `Lukas`, `Meisha`, `Bryian`, `Miguel`, `Patyrick`, or entirely new clients):

1. **Add Reference Images**:
   - Place all visual reference images into `public/moodboard/images/` (e.g., `bryan-char.png`, `bryan-bg1.png`, etc.).
   - Standard image dimensions and non-standard sizes (e.g., ultra-wide panoramas, square icons, 16:9 shots) are automatically handled without stretching.

2. **Update the Database in `src/data/clientMoodboardData.js`**:
   Find the client entry in `CLIENTS_DATA` (or add a new object to the array) and configure:
   ```javascript
   {
       id: 'bryan',                              // Unique lowercase slug
       name: 'Bryan',                            // Client display name
       channel: 'Bryan Channel',                 // Channel name (optional)
       status: CLIENT_STATUS.ACTIVE,             // Switch from COMING_SOON to ACTIVE
       badge: 'Anime 2D Cel',                    // Style tag badge
       folderUrl: 'https://drive.google.com/...',// Client asset root folder
       sampleDriveUrl: 'https://drive.google.com/...', // Video sample link
       specs: {
           characterStyle: '2D Cel Shading Anime',
           backgroundStyle: 'Hand-painted 2D Background (No AI)',
           narratorRequirement: 'Tidak Ada',
           hasThumbnail: true,                   // true | false
           projectDuration: '10 menit - 15 menit',
           turnaroundTime: '7 Hari',
           violenceGore: 'Diperbolehkan luka minim',
           sexualContent: 'Sensor Kreatif Minimalis',
           specialNotes: 'Catatan teknis khusus atau arahan ending.',
           bgPrompt: 'Optional: prompt teks Gemini AI jika klien menggunakan background AI',
           sheetUrl: 'Optional: link Google Sheet scene generation',
           competitorRef: {                      // Optional competitor benchmark
               title: 'Competitor Video Title',
               channel: '@ChannelHandle',
               url: 'https://youtube.com/...'
           }
       },
       images: [
           {
               id: 'bryan-char',
               src: '/moodboard/images/bryan-char.png',
               category: 'character',            // 'character' | 'narrator' | 'background' | 'sample'
               label: 'Karakter: 2D Cel Anime',
               aspectRatio: 1.78,                // Width divided by Height (e.g. 1920/1080 = 1.78)
               resolution: '1920 × 1080 px',
               tag: '2D Cel Shading',
               description: 'Penjelasan style lineart dan shading karakter.'
           },
           {
               id: 'bryan-bg',
               src: '/moodboard/images/bryan-bg.png',
               category: 'background',
               label: 'Background: Scene Utama',
               aspectRatio: 1.78,
               resolution: '1920 × 1080 px',
               tag: 'Hand-painted',
               description: 'Latar belakang dengan palet warna hangat.'
           }
       ]
   }
   ```
3. **Automatic UI Propagation**:
   - The UI automatically adds the client to the tab filter buttons, search index, specs matrix, AI prompt copy card, and anti-stretch gallery with zero component changes required!
   - Ultra-wide reference strips (`aspectRatio > 2.2`) will automatically span across 2 grid columns for optimal legibility.
   - All images are automatically wired to the full-resolution Interactive Lightbox Modal with zoom and arrow key navigation.

### Non-Standard Image Presentation Standard
To prevent visual distortion or stretching across varied image sizes:
- All cards utilize `object-fit: contain` within framed containers with `background: #090d16`.
- A blurred replica backdrop (`filter: blur(24px); opacity: 0.35`) provides depth without clipping actual reference content.
- Native aspect ratios (`X:1`) and exact pixel dimensions are displayed on every card and in the lightbox viewer.

## Important Development Rules
1. **Forms Validation**: Always lock inputs logically whenever the value comes from an authenticated user context (e.g., locking the editor name field using `userName`). 
2. **Branding & UI**: The UI emphasizes rounded corners, subtle interactive gradients, framer-motion micro-animations, and minimal, uncluttered layouts. Adhere to internal CSS variables (i.e., `var(--primary-600)`).
3. **Admin Backend Deployment**: **Crucial:** Any updates applied to `appscript/Code.gs` MUST be manually redeployed to Google Apps Script as a 'New Deployment' before the frontend can consume the new logic.
4. **Secrets Management**: DO NOT commit API keys or sensitive credentials into Git history. Adhere strictly to the `.gitignore` exclusions.
