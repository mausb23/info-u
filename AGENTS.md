# AGENTS.md

## Project

Astro static site: **InfoU** with Schedule Builder, Grade Tracker, and Bus Schedules.

## Running

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Stack

- **Astro 6.x** - Static site generator
- **React 19** via `@astrojs/react` — interactive Schedule Builder island
- **Tailwind CSS** via `@astrojs/tailwind` integration
- **Zustand** — lightweight state for schedule store
- **html2canvas** — export schedule to PNG
- **Font Awesome 6.4.0** via CDN
- **Google Fonts** (Inter) via `@import`
- **localStorage** for persistence, keys:
  - `weighted_grade_tracker_v1` (grades)
  - `infoU_theme` (dark/light)
  - `infoU_schedule_v2` (schedule builder courses)

## Structure

```
src/
  layouts/BaseLayout.astro        # Shared HTML shell with fonts/icons
  components/Nav.astro            # Navigation bar (shared across pages)
  components/schedule/
    ScheduleBuilder.jsx           # Main React island: form + calendar + share
    CourseForm.jsx                # Add-course form (name, day checkboxes, hours, color)
    CalendarGrid.jsx              # Weekly grid Mon-Sun, hourly blocks (CSS grid)
    ShareModal.jsx                # Share link + PNG export
  pages/
    index.astro                   # Home/menu page
    schedule.astro                # Schedule Builder (client:load React)
    grades.astro                  # Weighted grade tracker
    buses.astro                   # Bus schedules
  stores/
    scheduleStore.js              # Zustand store for user-created courses
  utils/
    conflicts.js                  # Hour overlap detection, constants (DAYS, HOURS, formatHour)
  scripts/grades.js               # Client-side JS for grade tracker
public/
  grades.js                       # Copy of grades.js served as-is
  theme.css                       # Dark/light mode overrides via CSS
  favicon.svg
```

## Architecture

- **Schedule Builder**: User creates courses via form (name, Mon-Sun checkboxes, start/end hour, color picker). Courses stored in localStorage. Grid uses CSS grid with hourly 50-min blocks (07:00-22:00). Conflicts detected with red highlight. Share via Base64 URL param or PNG download.
- **Grade Tracker**: State object `{ scale: 10|100, courses: [...] }` with full re-render pattern (`save()` → `render()`)
- **Bus Schedules**: Static Astro rendering with route data
- **Navigation**: Shared `Nav.astro` component with active page highlighting (4 tabs)
- Passing threshold: scale 10 → 7, scale 100 → 70
- Uses `crypto.randomUUID()` for IDs — requires secure context (HTTPS or localhost)

## Conventions

- React components in `src/components/schedule/` use `.jsx`, loaded via `<ScheduleBuilder client:load />`
- All other JS is vanilla (grades tracker)
- `escapeHtml()` is used for XSS protection on user input
- Client-side scripts in `public/` are served as-is with `<script is:inline>`
- Pages use `BaseLayout.astro` with `activePage` prop for nav highlighting
- Dark mode uses `public/theme.css` with `html.dark` selectors (NOT Tailwind `dark:` variants)
- Toggle classes: `dark-surface`, `dark-text-primary`, `dark-border`, etc. (defined in theme.css)
