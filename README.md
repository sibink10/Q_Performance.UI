# QHRMS — Performance Module

Production-ready React frontend for the QHRMS Performance Management module.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + Vite |
| Routing | React Router v6 |
| State Management | Redux Toolkit |
| UI Components | Material UI (MUI) v5 |
| Auth | JWT (localStorage + Axios interceptor) |
| Charts | Recharts (Radar chart) |
| Date Handling | Day.js + MUI DatePicker |
| HTTP Client | Axios |

---

## Folder Structure

```
src/
├── app/
│   └── store.js                    # Redux store (combines all slices)
│
├── features/
│   ├── auth/
│   │   └── authSlice.js            # JWT auth state + login/logout thunks
│   └── performance/
│       ├── performanceSlice.js     # All performance state + reducers
│       └── performanceThunks.js    # All async API thunks
│
├── components/
│   └── common/
│       └── index.jsx               # AppInput, AppLoader, AppModal,
│                                   #   StatusChip, RatingInput
│       AppButton.jsx               # Button with loading state
│
├── pages/
│   ├── auth/
│   │   └── Login.jsx               # Public login page
│   ├── config/                     # ADMIN ONLY
│   │   ├── PerformanceConfig.jsx   # Appraisal cycle & timeline settings
│   │   ├── FocusAreas.jsx          # Manage performance focus areas
│   │   └── ReviewFormDesign.jsx    # Build review form templates
│   ├── operations/                 # ADMIN ONLY
│   │   ├── OperationsPerformance.jsx  # Dashboard with employee status table
│   │   └── AssignReviewForm.jsx    # 3-step form assignment wizard
│   └── employee/                   # ALL USERS
│       ├── EmployeePerformance.jsx # Tabbed dashboard (pending/submitted/others)
│       ├── SelfEvaluationForm.jsx  # Fill self-evaluation (also manager mode)
│       └── MyResults.jsx           # Published results + radar chart
│
├── hooks/
│   ├── useAuth.js                  # Auth state + actions hook
│   └── usePerformance.js           # All performance state + dispatch hook
│
├── services/
│   ├── api.js                      # Axios instance with JWT interceptor
│   └── performanceService.js       # All performance API endpoints
│
├── routes/
│   ├── PrivateRoute.jsx            # Auth guard (+ admin guard)
│   └── AppRoutes.jsx               # Central route definitions
│
├── layouts/
│   └── MainLayout.jsx              # AppBar + role-aware sidebar
│
└── utils/
    ├── constants.js                # Rating scales, phases, FY list, etc.
    └── helpers.js                  # Score calculators, date helpers, etc.
```

---

## Roles & Access

| Route | Employee | Admin |
|-------|----------|-------|
| `/performance` | ✅ | ✅ |
| `/performance/review/:id` | ✅ | ✅ |
| `/performance/results` | ✅ | ✅ |
| `/operations/performance` | ❌ | ✅ |
| `/operations/performance/assign` | ❌ | ✅ |
| `/config/performance` | ❌ | ✅ |
| `/config/performance/focus-areas` | ❌ | ✅ |
| `/config/performance/review-forms` | ❌ | ✅ |

---

## Performance Review Workflow

```
Admin: Config ──► Create Focus Areas ──► Build Review Form
         │
Admin: Operations ──► Assign Form to Employees
         │
Employee: Self Evaluation (Phase 1)
         │
Manager: Team Evaluation (Phase 2)
         │
Admin/HR: Review, Calibrate, Normalize (Phase 3)
         │
Admin: Publish Ratings ──► Employee: View Results
```

---

## Setup

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Production build
```

### Environment Variables

Create `.env.local`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Key Features

- **JWT Auth** — Auto-attached via Axios interceptor; 401 → redirect to login
- **Role Guards** — PrivateRoute with `requireAdmin` flag
- **Redux Toolkit** — Normalized state with async thunks per API call
- **Score Engine** — `helpers.js` calculates weighted question/focus area/overall scores
- **Radar Chart** — Recharts-based spider chart for self vs manager vs final
- **Timeline Extension** — Global and per-employee deadline management
- **Draft Save** — Self-evaluations auto-persist before final submission
- **3-Step Assignment Wizard** — Form → Employees → Timelines → Confirm
