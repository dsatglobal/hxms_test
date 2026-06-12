# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run lint       # Type-check with tsc --noEmit (no test suite exists)
npm run preview    # Preview production build
```

Requires a `GEMINI_API_KEY` in `.env.local` (see `.env.example`).

## Architecture

This is a **single-page React + Vite + TypeScript** app — a multi-tenant SaaS demo for container haulage logistics (HMS). There is no backend; all state is persisted to `localStorage` per-tenant.

### Key structural patterns

**Multi-tenancy via localStorage isolation**  
Each tenant gets a keyed namespace: `hms_db_<subdomain>_<datatype>`. Switching tenants (via the top bar dropdown) triggers a `useEffect` in `App.tsx` that reloads all state from localStorage. The `MOCK_TENANTS` array in `src/data.ts` is the tenant registry.

**All state lives in `App.tsx`**  
There is no Redux, Zustand, or context. Every data collection (jobs, customers, invoices, drivers, etc.) is `useState` in `App.tsx`. Components receive slices as props and call handler callbacks (`onAdd*`, `onUpdate*`, `onDelete*`) that update state and persist to localStorage via `handleSaveTenantState`.

**Region-based access control**  
`filterByRegion()` in `App.tsx` filters every data array before passing to components. Users with `regionAccess: ["ALL"]` can switch between regions via the top bar; others see only their `regionId`. New records are enriched with `currentUser.regionId` on creation.

**Role-based nav visibility**  
Navigation groups (OPERATIONS, ACCOUNTING, ADMINISTRATION) are conditionally rendered based on `currentUser.role` (`administrator`, `region_admin`, `dispatcher`, `billing`). User switching is done through Administration Console or the sidebar footer button.

**Job lifecycle flow**  
`pending` → `scheduled` (ROT confirmed) → `active` (driver assigned) → `completed` (all milestones done) or `exception`. Jobs carry an embedded `milestones[]` array (scenario-specific steps). Scenarios: `IMP`, `EXP`, `Inland`, `EMTY`, `RETURN`.

**Milestone workflows**  
`createMilestonesForScenario(scenario)` in `src/data.ts` generates the default milestone steps per job type. Admins can customize these via the Workflow Milestones view, stored as `WorkflowMilestoneConfig[]`.

**Quotation → Booking flow**  
`QuotationWizard` sets `prefilledBookingContext` in `App.tsx` and navigates to `booking` tab. `JobBooker` consumes this context to pre-populate the booking form and creates Job + ROT + ConsignmentNote atomically via `handleAddJob`.

### Source layout

- `src/App.tsx` — root component, all state, all handlers, tab-based routing
- `src/types.ts` — all TypeScript interfaces
- `src/data.ts` — mock seed data, `createMilestonesForScenario`, `MOCK_TENANTS`, initial constants
- `src/components/` — one file per view/feature; components are self-contained and stateless (receive props + callbacks)
- `index.html` — Vite entry point
