# Design System — InfoU

## Brand & Tone

- **Minimal, modern, functional** — no decorative flourishes, everything serves a purpose
- **Academic-first** — neutral, serious, trustworthy; not playful
- **All text in Spanish** (Costa Rican dialect)
- **Light mode = default**, dark mode = optional toggle respected at OS level

---

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Body | Inter | 400 | 14px (text-sm) |
| Headings | Inter | 700–900 | text-lg → text-5xl |
| Labels / stats | Inter | 700 (bold) | 10–12px (text-xs) |
| Input / button text | Inter | 500–700 | text-sm |
| Mono | none | — | — |

Font is served via Google Fonts (`@import` in `<head>`).

---

## Color Palette

All colors are **Tailwind CSS v3** named colors (slate, indigo, emerald, amber, rose, violet, etc).

### Primaries

| Role | Light | Dark |
|------|-------|------|
| Accent / interactive | `indigo-500` → `indigo-600` | same (`dark-nav-active` → `#818cf8`) |
| Destructive | `red-500` → `red-600` | same |
| Success / passing | `emerald-600` | `dark-badge-emerald` / `dark-text-emerald` |
| Warning / pending | `amber-600` | `dark-amber-banner-title` / `dark-badge-amber` |
| Danger / failing | `rose-600` | `dark-badge-rose` / `dark-text-rose` |

### Surfaces (light mode)

| Component | Class |
|-----------|-------|
| Card / panel | `bg-white` + `border-slate-200/80` + `shadow-sm` |
| Nav pill | `bg-slate-100/80` |
| Active nav item | `bg-white` + `shadow-sm` |
| Muted background | `bg-slate-50` |
| Input field | `bg-white` + `border-slate-200` |
| Dashed empty state | `border-slate-200 border-dashed` |

### Surfaces (dark mode)

Dark mode is driven by **`public/theme.css`** with `html.dark` selectors overriding Tailwind utilities via `!important`.

| Component | Class | Value |
|-----------|-------|-------|
| Card / panel | `dark-surface` | `bg: #1e293b`, `border: #334155` |
| Nav bar | `dark-nav` | `bg: #0f172acc`, `border: #33415599` |
| Nav pill container | `dark-nav-pill` | `bg: #1e293bcc` |
| Active nav item | `dark-nav-active` | `bg: #334155`, `color: #818cf8` |
| Muted bg | `dark-muted-bg` | `bg: #334155` |
| Semi-transparent muted bg | `dark-muted-bg-alpha` | `bg: #33415580` |
| Input | `dark-input` | `bg: #334155`, `border: #475569`, `color: #f1f5f9` |
| Page bg | — | `#000000` (body override) |

### Text colors (dark mode)

| Role | Class | Value |
|------|-------|-------|
| Primary (headings) | `dark-text-primary` | `#f1f5f9` |
| Secondary (body) | `dark-text-secondary` | `#cbd5e1` |
| Muted (labels) | `dark-text-muted` | `#94a3b8` |
| Dim (metadata) | `dark-text-dim` | `#64748b` |

### Status colors (dark mode)

| Status | Class | Value |
|--------|-------|-------|
| Pass (Aprobado) | `dark-text-emerald` | `#6ee7b7` |
| Ampliación | `dark-amber-banner-title` | `#fde68a` |
| Fail (Reprobado) | `dark-text-rose` | `#fda4af` |

### Badge & route backgrounds (dark mode, semi-transparent)

See `public/theme.css` for `dark-badge-*` and `dark-route-*-bg` classes. One pair per color: indigo, emerald, amber, purple, rose, blue, teal, cyan, orange, slate, fuchsia.

---

## Spacing & Layout

| Measure | Value |
|---------|-------|
| Max content width | `max-w-6xl` (72rem) |
| Outer padding | `px-4 sm:px-6` |
| Card border radius | `rounded-2xl` (16px) |
| Small card / input radius | `rounded-xl` (12px) |
| Pill / button radius | `rounded-lg` (8px) |
| Card padding (inner) | `p-5` → `p-6` |
| Inter-card gap (grid) | `gap-4` → `gap-6` |
| Section margin bottom | `mb-6` → `mb-8` |
| Nav height | `h-16` |
| Top padding for content | `pt-16` (below fixed nav) |

---

## Component Patterns

### Navigation (`Nav.astro`)

- Fixed top bar, backdrop blur, border-bottom
- Logo (graduation cap icon + "InfoU" text)
- 4–5 pill links with icons, active state highlighted
- Theme toggle button (moon/sun) on the right
- "Notas" is a dropdown containing "Control de Notas" and "Apuntes"
- Responsive: labels hidden on mobile (`hidden sm:inline`)

### Cards

- White background, subtle border, soft shadow
- Rounded-2xl, padding p-5/p-6
- Dark mode: `dark-surface`
- Hover: `hover:shadow-md hover:-translate-y-1` (only on interactive cards)

### Buttons

| Style | Classes | Use |
|-------|---------|-----|
| Primary CTA | `bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg` | Add, Save, Create |
| Outline | `border border-slate-200 dark-border text-sm font-semibold text-slate-600 dark-text-secondary hover:bg-slate-50 dark-hover-surface rounded-xl` | Cancel, secondary actions |
| Ghost icon | `w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-rose-100 hover:text-rose-600` | Delete, close |

### Forms

- Input: `w-full px-4 py-2.5 rounded-xl border border-slate-200 dark-input focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm`
- Select: same as input + `appearance-none cursor-pointer`
- Label: `text-xs font-bold text-slate-400 dark-text-dim uppercase mb-1 ml-1`
- Checkbox/day pill: hidden checkbox + styled label toggle

### Grade assignment row

- One row per assignment, flex layout
- Name + weight label on left
- Grade input + status preview + delete button on right
- Graded: neutral (`bg-slate-50 dark-muted-bg-alpha`)
- Pending: amber tone (`bg-amber-50 dark-route-amber-bg`)
- Status preview: `text-[10px] font-bold`, colored by pass/ampliación/fail
- Real-time `oninput` preview + `onchange` save + `onblur` reset

### Pills / Tabs

- Container: `bg-slate-100 dark-muted-bg p-1 rounded-xl border border-slate-200 dark-border`
- Active pill: `bg-white dark-nav-active text-indigo-600 shadow-sm`
- Inactive pill: `text-slate-500 dark-nav-inactive hover:text-slate-700`

### Badges

- Small rounded-full pill, used for status labels
- `px-2 py-0.5 rounded-full text-[10px] font-bold`
- Colors match status: emerald / amber / rose

### Empty states

- Centered column with icon, heading, and subtitle
- Icon: `text-slate-300 dark-empty-icon text-3xl` in a `w-20 h-20 bg-slate-100 dark-muted-bg rounded-3xl` container
- Heading: `text-xl font-semibold text-slate-400 dark-text-dim`
- Subtitle: `text-sm text-slate-400 dark-text-dim`

### Toasts (`showToast`)

- Fixed bottom-center, stack vertically
- Rounded-xl with border, shadow-lg
- 4 types: info (blue), error (red), warning (amber), success (green)
- Auto-dismiss after 3s with fade-out
- Dark mode aware via existing theme classes

### Confirm Modal (`showConfirm`)

- Centered overlay with backdrop blur (`bg-black/40 backdrop-blur-sm`)
- White / dark-surface card, rounded-2xl, max-w-sm
- Icon + title + message + two buttons
- Returns Promise<boolean>

---

## Icons

- **Font Awesome 6.4.0** (Free) served via CDN (`/css/all.min.css`)
- Use `<i class="fas fa-*"></i>` syntax
- Common icons:
  - `fa-house` — home
  - `fa-bus` — buses
  - `fa-sticky-note` — notes / apuntes
  - `fa-calendar-alt` — schedule
  - `fa-chart-pie` — grades
  - `fa-pencil-alt` — notas dropdown
  - `fa-graduation-cap` — logo
  - `fa-moon` / `fa-sun` — theme toggle
  - `fa-trash-alt` / `fa-times` — delete/close
  - `fa-plus` — add
  - `fa-save` — save
  - `fa-search` — search
  - `fa-calculator` — grade preview
  - `fa-exclamation-triangle` / `fa-circle-exclamation` — warnings/errors
  - `fa-circle-check` — success
  - `fa-circle-info` — info
  - `fa-info-circle` — disclaimers
  - `fa-chevron-down` / `fa-chevron-up` — expand/collapse
  - `fa-arrow-right` — CTA arrows
  - `fa-palette` — color picker
  - `fa-share-alt` — share
  - `fa-clock` — hours
  - `fa-book` / `fa-book-open` — courses
  - `fa-folder-open` — empty states
  - `fa-list-ul` — task lists
  - `fa-calendar-plus` — empty schedule

---

## Animations

| Name | Keyframes | Use |
|------|-----------|-----|
| `fadeIn` | `0→8px, opacity 0→1` | Toast appear, element mount |
| `slideIn` | `-12px→0, opacity 0→1` | Section entrance |
| View transitions | Disabled (`animation: none; opacity: 1/0`) | Instant page changes |

---

## Page Layout

```
┌─ Nav (fixed top, h-16, z-50) ──────────────────────┐
│                                                      │
│  ┌─ Main content (max-w-6xl, px-4/6, pt-16) ────┐  │
│  │                                                 │  │
│  │   (page-specific content)                      │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Toast container (fixed, bottom-6, z-200) ────┐  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Confirm modal overlay (fixed, z-150) ─────────┐  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Footer (border-t, disclaimer text) ───────────┐  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

Page uses `flex flex-col min-h-screen` with footer pushed to bottom via `flex-1`.

---

## Responsive Behavior

- **Breakpoints**: Tailwind defaults — `sm: 640px`, `md: 768px`, `lg: 1024px`
- Nav: inline labels hidden on mobile, only icons visible
- Course cards: single column on mobile, 3-column grid on `lg`
- Forms: stacked on mobile, inline/grid on `sm`+
- Assignment rows: flex wrap, not clipped
- Grade inputs: `w-16` on all screens, compact
- Grid containers: `overflow-x-auto` with `min-w-[700px]` for scrollable tables

---

## Dark Mode Architecture

1. **Toggle stored** in `localStorage` key `infoU_theme` (`"dark"` | `"light"`)
2. **Theme script** in `<head>` reads localStorage → checks `prefers-color-scheme` → applies/removes `html.dark` class
3. **`public/theme.css`** contains all `html.dark .dark-*` selectors with `!important`
4. **Tailwind `darkMode: 'class'`** is configured but **NOT used** — all dark styling comes from theme.css
5. **Inline `window.setTheme()` / `window.toggleTheme()`** functions handle switching
6. Nav theme button calls `window.toggleTheme()` via `onclick`

---

## UCR-Specific Rules

### Grade Scale
- Officially 0–10, but many teachers use 0–100 internally
- Toggle between Base 10 and Base 100, conversions multiply/divide by 10

### Rounding (`roundGradeUCR`)
```
decimal < 0.25 → round down (floor)
0.25 ≤ decimal < 0.75 → round to 0.5
decimal ≥ 0.75 → round up (ceil)
```
Used for status determination only (display shows raw average).

### Status thresholds (after rounding)
| Rounded grade | Status |
|---------------|--------|
| ≥ 7.0 | Aprobado (pass) |
| 6.0–6.5 | Ampliación (right to re-exam) |
| < 6.0 | Reprobado (fail) |

### Weighted Average (Semester)
- Grades below 5.0 (base 10) are **treated as 5.0** for the calculation
- Formula: Σ(grade × credits) / Σ(credits)

---

## Data Persistence

All state is stored in `localStorage`:

| Key | Feature | Format |
|-----|---------|--------|
| `infoU_schedule_v2` | Schedule courses | JSON array of course objects |
| `infoU_notes_v1` | Course notes | JSON object with courses array |
| `infoU_theme` | Dark/light mode | `"dark"` or `"light"` |
| `weighted_grade_tracker_v1` | Grade tracker | JSON object with courses, scales, etc. |
