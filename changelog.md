# Changelog

All notable changes to this project should be documented in this file.

## [Unreleased]

### Added
- Added a Docker Compose quick-start section to `README.md` with:
  - `docker compose up -d --build backend frontend`
  - `docker compose ps`
  - `docker compose logs -f backend frontend`
  - `docker compose down`
- Forecast period mini buttons in main chart card header: "Next 7 days", "Upcoming month", "Custom" (with inline date inputs when Custom is selected)
- Sparklines on quick stats and side cards with green/red coloring based on trend direction

### Changed

#### Dashboard & Layout
- **Main card header**: Value/units moved under title for all period options (Next 7 days, Upcoming month, Custom)
- **Main card height**: Increased to match combined height of three side cards; uses `lg:items-stretch` for proportional layout across all period selections
- **Layout consistency**: Same format and sizing for Next 7 days, Upcoming month, and Custom; Custom date inputs on separate row below period buttons to prevent layout shift
- **Side cards**: Reduced size (narrower `lg:w-56`, compact padding, smaller typography, smaller sparklines)
- **Quick stats card titles**: Slightly larger (`text-sm md:text-base`) for better readability

#### Colors & Styling
- **Page background**: Darker pink gradient (`#e8c4c8` → `#924448`) on Dashboard, Upload, and Settings
- **Navbar background**: Warm cream/beige gradient (`#f2efec` → `#e5dfd9` → `#d1c7be`) swapped from page background
- **Percentage badges**: Pill-shaped with solid dark green (`bg-emerald-700`) for positive, dark red (`bg-rose-700`) for negative
- **Quick stats percentage format**: Decimal format (e.g. `+12.4%`, `-4.1%`)

#### Typography
- **Font**: Switched from Playfair Display + Source Sans 3 to Montserrat for both display and body
- **Global font**: `index.css` body font updated from Source Sans 3 to Montserrat
- **Header text**: "Sales Forecasting" section (title, description, last updated) set to black for better visibility
- **Navbar text**: Menu items and user section use black/dark gray (`text-gray-900`) with larger size (`text-base`) and `font-semibold`

#### Navbar
- **Redesign**: Frosted layout with icon circles, active state highlighting, structured user section
- **Logo**: Matches login page style—stacked "Pink" (font-black) and "Cafe" (font-thin), centered, with Cafe offset slightly left
- **Gradient**: Warm cream gradient (swapped with page background); previously used 9-stop pink gradient
- **Readability**: Improved contrast with `text-gray-900`, `font-semibold`, larger nav items

#### Cards
- **Quick stats & side cards**: Brown header (`bg-pinkcafe2`) with white body; pill badges for percentage changes
- **Card structure**: Header with icon + change badge; white content area with label, value, sparkline

#### Upload Page
- **Centering**: Upload CSV card centered vertically and horizontally on the page

#### Background Consistency
- **Unified background**: Dashboard, Upload, and Settings pages share the same gradient
- **Unified fonts**: Montserrat applied across all pages


