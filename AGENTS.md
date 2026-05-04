# AGENTS.md

## Project

Astro static site: **InfoU** with Schedule Builder, Grade Tracker, Course Notes, and Bus Schedules. Tools for UCR students.

## Running

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Stack

- **Astro 6.x** — Static site generator
- **React 19** via `@astrojs/react` — interactive Schedule Builder island
- **Tailwind CSS** via PostCSS (NOT `@astrojs/tailwind` — incompatible with Astro 6)
- **Zustand** — lightweight state for schedule store
- **Font Awesome 6.4.0** via CDN (free icons)
- **Google Fonts** (Inter) via `@import`
- **Canvas 2D API** — native schedule PNG export (no html2canvas)
- **localStorage** for persistence, keys:
  - `weighted_grade_tracker_v1` (grades)
  - `infoU_theme` (dark/light)
  - `infoU_schedule_v2` (schedule builder courses)
  - `infoU_notes_v1` (course notes)

## Structure

```
src/
  layouts/BaseLayout.astro        # Shared HTML shell with fonts, icons, theme, footer, toast/confirm modals
  components/Nav.astro            # Navigation bar with dropdown (shared across pages)
  components/schedule/
    ScheduleBuilder.jsx           # Main React island: form + calendar + share
    CourseForm.jsx                # Add-course form (name, day checkboxes, hours, color)
    CalendarGrid.jsx              # Weekly grid Mon-Sun, hourly blocks (CSS grid)
    ShareModal.jsx                # Share link + PNG export
  pages/
    index.astro                   # Home/menu page
    schedule.astro                # Schedule Builder (client:load React)
    grades.astro                  # Weighted grade tracker + semester average
    apuntes.astro                 # Course notes page
    buses.astro                   # Bus schedules (internal + external)
  stores/
    scheduleStore.js              # Zustand store with localStorage persistence + migration
  utils/
    conflicts.js                  # Hour overlap detection, constants (DAYS, HOURS, formatHour)
    exportCanvas.js               # Native Canvas 2D API for PNG export
  scripts/
    grades.js                     # Client-side JS for grade tracker
    apuntes.js                    # Client-side JS for course notes
  styles/
    global.css                    # Tailwind directives
public/
  grades.js                       # Copy of src/scripts/grades.js (served as-is)
  apuntes.js                      # Copy of src/scripts/apuntes.js (served as-is)
  ui.js                           # Shared utilities: showToast(), showConfirm()
  theme.css                       # Dark/light mode overrides via html.dark selectors
  favicon.svg
```

## Architecture

- **Schedule Builder**: User creates courses via form (name, Mon-Sun checkboxes, start/end hour, color picker). Courses stored in localStorage. Grid uses CSS grid with hourly 50-min blocks (07:00-22:00). Conflicts detected with red highlight. Share via Base64 URL param or native Canvas API PNG download.
- **Grade Tracker**: State object with courses, assignments, per-tab scales. Full re-render pattern (`save()` → `render()`). Real-time `oninput` grade preview with UCR status (Aprobado / Ampliación / Reprobado) and grade rounding. Weighted average with 5.0 floor per UCR reglamento.
- **Course Notes (Apuntes)**: Organize notes by course with color tags. Add/edit/delete inline. Search by title/content. Stored in localStorage.
- **Bus Schedules**: Static Astro rendering with 2 internal + 11 external routes. Live countdown timer via client-side setInterval. Pill toggle (Interno/Externo).
- **Navigation**: Shared `Nav.astro` with dropdown for "Notas" (Control de Notas + Apuntes). 4 pills total: Inicio, Buses, Horario, Notas ▾.
- **Notifications**: Custom toast (`showToast`) and confirm modal (`showConfirm`) in `public/ui.js`, replaces all native `alert()` / `confirm()`.
- Passing threshold: scale 10 → 7.0 (rounded), scale 100 → 70 (rounded). Grades below 5.0 base10 count as 5.0 for semester average.
- Uses `crypto.randomUUID()` for IDs — requires secure context (HTTPS or localhost).

## Conventions

- React components in `src/components/schedule/` use `.jsx`, loaded via `<ScheduleBuilder client:load />`
- All other JS is vanilla (grades tracker, notes, bus timer, ui utilities)
- `escapeHtml()` is used for XSS protection on user input
- Client-side scripts in `public/` are served as-is with `<script is:inline>`. **Keep `src/scripts/*.js` and `public/*.js` in sync** (copy after edits)
- Pages use `BaseLayout.astro` with `activePage` prop for nav highlighting
- Dark mode uses `public/theme.css` with `html.dark` selectors (NOT Tailwind `dark:` variants)
- Toggle classes: `dark-surface`, `dark-text-primary`, `dark-border`, etc. (defined in theme.css)
- Bus page timer uses `data-group` attributes for direction-based filtering

## Documentation

Keep `README.md` and `DESIGN.md` updated as the project evolves:

- **README.md** — update when adding/removing features, changing the tech stack, modifying environment setup, or adding new localStorage keys
- **DESIGN.md** — update when changing visual conventions (colors, spacing, component patterns, dark mode classes), adding new page layouts, modifying button/form styles, or changing the UCR-specific logic (rounding, status rules)

Check both files after every significant change. If the change affects how the project looks, feels, or is used by developers, the docs should reflect it.
