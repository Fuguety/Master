# Atlas Notebook

Atlas Notebook is a full-screen, flat 2D world-map workspace for researching universities, companies, and location-based sticky Notes. It combines MapLibre navigation, clustered map tags, country facts and highlighting, type-specific scoring and filters, one shared Supabase dataset, versioned JSON backup, and five presentation-only themes.

The React frontend is deployed as static GitHub Pages files. Every visitor starts from the same base dataset in Supabase and can freely edit or import a browser-local working copy. Only accounts listed in the protected `app_admins` table can publish that working copy with the explicit **Save** button. Supabase Row Level Security (RLS) enforces that publishing boundary independently of the UI.

## Features

- Smooth MapLibre GL JS panning, zooming, touch gestures, keyboard navigation, and map controls
- Infinite horizontal world wrapping with normalized stored longitudes and repeated interactive layers
- Flat cartographic and satellite base maps; no globe or pitch mode
- Detailed country geometry, configurable country colors, opacity, visibility, and notes
- Major-place labels and national boundaries in the built-in satellite style
- Explicit **Create Tag** placement mode for map clicks, with a visible indicator, crosshair cursor, Escape cancellation, and configurable automatic exit
- University, Company, and Note tags with separate forms, icons, schemas, validation, and detail views
- Search-first quick creation by country, city, or precise place, with coordinates retained in an advanced correction section
- Automatic reverse geocoding on map creation plus searchable country/city selection that synchronizes the draft marker and camera
- Interactive half-star score inputs and searchable chip-based multi-select filters
- Resizable desktop panels and draggable, minimizable, resizable multi-tag detail windows with saved placement and size
- Keyboard-accessible tag browsing and coordinate-based tag/country creation alongside map-pointer workflows
- Drag-to-move unclustered tags, compact GeoJSON rendering, marker collision handling, and automatic clustering
- Compact MapLibre marker previews on pointer hover and keyboard focus, with title/type/rating summaries and title-only Notes
- Ordered draft/detail camera intents that cancel stale transitions and preserve wrapped creation coordinates
- Add, edit, and delete tag notes and HTTP/HTTPS research sources
- Transparent 0–5-star ratings with one-decimal display and per-field contribution details
- Independent, combinable University and Company filters with searchable categories/options and one-action reset
- English, original/local, and combined geographic-name presentation modes
- Country information, in-country record search, and explicit repeated-click actions at the exact selected coordinate
- Configurable LOCAL/EUR/USD/BRL monetary display with cached, dated exchange rates when source values are available
- Public shared reads, visitor-local editing/import, and administrator-only publishing through Supabase Auth, PostgREST, and RLS
- Explicit administrator Save with loading, dirty, success, and error states
- Validated, size-limited, versioned JSON import and export with merge and replace modes
- Five responsive themes: Modern, Neon Grid, 1990s Web, Field Archive, and Nautical Chart
- Semantic forms, focus management, reduced-motion support, locale-aware numbers, and responsive desktop/mobile panels

## Technology

| Area        | Implementation                                                        |
| ----------- | --------------------------------------------------------------------- |
| Application | React 19, TypeScript 5.8, Vite 7                                      |
| Map         | MapLibre GL JS 5                                                      |
| Geography   | Turf.js and GeoJSON                                                   |
| Validation  | Zod at form/import boundaries plus JSON Schema documents              |
| Persistence | Supabase Postgres/PostgREST with Auth and Row Level Security          |
| Tests       | Vitest, jsdom, Testing Library matchers                               |
| Quality     | ESLint, Prettier, strict TypeScript                                   |
| Styling     | CSS Modules, shared CSS variables, separate theme and animation files |

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (required by the installed Vite version)
- npm
- A free Supabase project
- A GitHub repository with Pages enabled for deployment
- A modern browser with WebGL
- Network access to the selected map/style providers and country-geometry endpoint

## Install and run

```powershell
npm ci
npm run dev
```

Vite prints the local development URL, normally `http://localhost:5173`.

Without Supabase configuration, the application runs in local mode with the checked-in example data; editing, JSON import, and export still work for the current page session. To load and publish the shared base dataset, copy the template and set the two public project values:

```powershell
Copy-Item .env.example .env
npm run dev
```

Restart Vite after changing `.env`.

`VITE_SUPABASE_ANON_KEY` is Supabase's public anon/publishable key and is expected to appear in the browser bundle. Never use a service-role key, database password, admin password, or other privileged secret in `.env`, any `VITE_*` variable, repository variable, or frontend source.

## Supabase database and authentication setup

1. Create a Supabase project at <https://supabase.com/dashboard> and wait for its database to become ready.
2. Open **SQL Editor**, create a new query, paste the complete contents of [`supabase/migrations/20260930000000_shared_dataset.sql`](supabase/migrations/20260930000000_shared_dataset.sql), and run it once. The migration:
   - creates the single `shared_datasets` row and seeds it with the repository's current example bundle;
   - creates the private `app_admins` allowlist;
   - enables RLS;
   - grants public `SELECT` access only;
   - grants `UPDATE` only when `is_admin()` finds the signed-in user's ID in `app_admins`;
   - does not grant browser clients `INSERT`, `DELETE`, or access to the admin allowlist.
3. In **Authentication → Providers → Email**, keep Email/Password enabled. Configure email confirmation to match the desired account workflow.
4. In **Authentication → Users**, choose **Add user → Create new user** and create a confirmed user with email `admin@atlas.invalid` and password `admin`. The application maps the visible username `admin` to that Auth email. The password exists only in Supabase Auth and is never added to this repository or frontend bundle. `admin` is intentionally weak and should be changed before exposing valuable data publicly.
5. Return to **SQL Editor** and promote that exact account by running:

   ```sql
   insert into public.app_admins (user_id)
   select id
   from auth.users
   where lower(email) = lower('admin@atlas.invalid')
   on conflict (user_id) do nothing;
   ```

   If the statement inserts no row, verify the `admin@atlas.invalid` user exists in **Authentication → Users**.
6. Open **Project Settings → API**. Copy the Project URL and the public anon/publishable key into `.env`:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
   VITE_BASE_PATH=/
   ```

7. Run `npm run dev`. An anonymous browser should load the seed data and may edit or import its local working copy without an account. Use username `admin` and password `admin` in **Administrator login** to reveal the global **Save** button, which publishes that working copy as the shared base.

To revoke an administrator without deleting their Auth account:

```sql
delete from public.app_admins
where user_id = (select id from auth.users where lower(email) = lower('admin@atlas.invalid'));
```

## GitHub Pages deployment

The checked-in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds Vite with `VITE_BASE_PATH=/Master/`, uploads `dist`, and deploys it through GitHub Pages.

1. Push the repository to `Fuguety/Master` with the deployment branch named `main`.
2. In **GitHub → Settings → Secrets and variables → Actions → Variables**, add repository variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Use the same public values from Supabase. The workflow also accepts Actions secrets with those names, although variables are appropriate because both values are public browser configuration. Do not create a service-role variable.
3. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
4. Push to `main`, or open **Actions → Deploy GitHub Pages → Run workflow**.
5. After both jobs succeed, open `https://fuguety.github.io/Master/`.

If the two Supabase values are absent, the workflow emits a warning and still deploys. The site then runs in **Local only** mode with bundled data; shared reads, administrator login, and publishing remain unavailable until both values are configured and the workflow is rerun.

For a renamed repository, change `VITE_BASE_PATH` in the workflow to `/<repository-name>/`. For a root user/organization site or an appropriate custom domain, use `/`.

### Deployment smoke test

1. Open the deployed site in a private window. Confirm the seeded records load; editing, import, export, and refresh work; and the global **Save** button is absent.
2. Attempt to log in with an ordinary Supabase Auth user who is not in `app_admins`. The app must report that the account is not an administrator. A direct `PATCH` made with that user's access token must affect zero rows or return a permission error because of RLS.
3. Log in with the promoted administrator. Edit one record; confirm the header shows **Ready to publish**, then click **Save** and accept the overwrite confirmation. Confirm the success message appears.
4. Reload the private window or choose **Data → Refresh**. Confirm the administrator's change is visible there.
5. Inspect the built files or browser Sources. The public project URL and anon/publishable key will be present by design. Confirm no password, `sb_secret_...` key, service-role JWT, database URL/password, or `SUPABASE_SERVICE_ROLE_KEY` is present.

### Commands

| Command              | Purpose                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `npm run dev`        | Start the Vite development server                                     |
| `npm run build`      | Type-check and create an optimized `dist/` build                      |
| `npm run preview`    | Serve the production build locally                                    |
| `npm run typecheck`  | Run strict project TypeScript checks                                  |
| `npm run lint`       | Lint all TypeScript and React source files with zero warnings allowed |
| `npm test`           | Run the Vitest suite once                                             |
| `npm run test:watch` | Run Vitest in watch mode                                              |
| `npm run format`     | Format CSS, JSON, Markdown, and HTML with Prettier                    |
| `npm run data:countries` | Refresh the checked-in sovereign-country dataset from its documented maintenance sources |
| `npm run check`      | Run type-check, lint, tests, and production build                     |

## Using the application

### Navigate and change the map

- Drag the map background to pan; use the wheel, pinch, or the `+`/`−` controls to zoom.
- Continue dragging left or right across the International Date Line; the flat map, tags, clusters, and country highlights repeat seamlessly.
- With the map focused, MapLibre supports arrow-key panning and `+`/`−` zooming.
- Choose **Map** or **Satellite** from the map-style control. Application-owned tag and country layers are restored after every base-style change.
- Click a cluster to smoothly zoom to its expansion level. Individual markers become draggable after the cluster separates.
- Open settings to disable or re-enable clustering. Map style and clustering choices are remembered locally.

### Create, inspect, edit, move, and delete a tag

1. Choose **Create Tag** in the map toolbar, then click an unoccupied map position. The mode is disabled by default, exits after placement according to `src/config/interaction-config.json`, and can be cancelled with Escape. Alternatively, open **Tags** and search for a country, city, or precise place; manual longitude/latitude correction remains under **Advanced coordinate correction**.
2. Choose **University**, **Company**, or **Note**.
3. Complete the type-specific form. Reverse geocoding fills the location when available; country/city selections update all location fields, the draft marker, and camera together.
4. Add optional notes and source links. A source row is ignored when empty; completed source URLs must use HTTP or HTTPS.
5. Review the live calculated rating, then save.
6. Click markers to open multiple independent detail windows. The card renders before the padded camera transition, and map controls move away from the occupied viewport.
7. Choose **Edit** or **Delete** from the details view. Destructive actions should be confirmed by the application.
8. Drag an unclustered marker to update its coordinates; the committed position is persisted. An unlocked Note and its window can move, while locking it prevents both marker and window dragging and resizing.

Hover an unclustered marker to inspect its compact preview. Keyboard users can Tab through the currently rendered unclustered marker equivalents; focus shows the same preview and activation opens the full record. Previews close for clustering, dragging, style changes, deletion, blur, pointer leave, or an already-open detail window.

Map creation uses a lower draft zoom immediately after placement. The draft marker, fields, wrapped coordinate, and padded camera remain synchronized while editing. Saving promotes the coordinate to the normal detail zoom; canceling stops the pending camera intent without restoring an older selection.

University score inputs cover location, quality of life, affordability, job opportunity, job-placement support, regional companies, global/local reputation and ranking, commute, and country tier. Company score inputs cover payment, career growth, location, country tier, work model, and internship availability. Company industry and specialization are optional descriptive/filterable fields.

### Highlight a country

1. Open the country-highlight tool; country-selection mode becomes active.
2. Click a country boundary, or search the complete ISO country catalog with the keyboard-accessible autocomplete.
3. Choose a six-digit hex color, opacity, visibility, and an optional note.
4. Save the overlay. Selecting an existing highlighted country allows it to be changed or deleted.

Country identity uses uppercase ISO-style three-letter codes such as `BRA`, `DEU`, and `USA`. Outside highlight editing, clicking a visible highlighted country opens its read-only Country Information panel immediately; clicking another switches directly, and the repeated-click close behavior is configurable. Inside the explicit country-highlight tool, clicks retain the existing edit workflow and repeated-click action menu. Create Tag Mode and country selection are mutually exclusive.

### Filter tags

University and Company filter states are separate. Dimensions combine with logical **AND**; multiple selections inside one dimension act as accepted alternatives. Numeric limits are inclusive. A missing numeric value passes while that dimension is inactive and is excluded when the dimension becomes active.

University filters include country, city, minimum rating, affordability, quality of life, job opportunities, job-placement support, regional companies, combined or individual reputation, combined or individual ranking, commute, and country tier.

Company filters include country, city, minimum rating, payment, career growth, location, work model, internship availability, industry, company area, and country tier.

Use the search field at the top of either filter panel to find categories or individual options. Matching accordions open automatically, matches are highlighted, and Arrow keys, Enter, Escape, and the clear button are supported. Use **Reset all** to clear only that tag type's constraints. Filtering updates the map's compact GeoJSON source rather than hiding DOM markers one by one.

The Tags tool independently shows or hides University, Company, and Note markers. Tag-type visibility is remembered locally; detailed filter values reset when the application reloads.

### Geographic names and country information

Settings offers **English names**, **Original/local names**, and **English name with original name**. ISO codes remain the canonical identifiers; translated labels are presentation only. Bundled country names support these modes where the source dataset provides a native name. City results use the configured geocoder's returned labels. Provider-owned base-map labels cannot always be changed dynamically, so a third-party style may retain its own label language; choose a compatible MapLibre style or label layer when deployment requires complete label-language control.

The Country Information panel reads static facts only from `src/data/countries.json`. Its 195 sovereign-country records include ISO codes, English/native names, capital, population, area, currency and symbol, languages, continent/region/subregion, NATO membership, editable/optional country tier, available minimum wage, source, and update date. Missing values are explicitly shown as **Data unavailable**. Record membership prefers canonical country codes and uses Turf point-in-polygon checks when a code is absent and geometry is available.

The monetary selector supports local currency, EUR, USD, and BRL. Conversion preserves the bundled source amount, uses `VITE_CURRENCY_RATE_ENDPOINT`, stores the rate date, caches successful rates for 12 hours, and safely returns unavailable when a rate cannot be resolved. The default Frankfurter endpoint requires no client secret; never place private API keys in `VITE_*` values. Time-sensitive wage and NATO fields are isolated in the bundled snapshot and carry a maintenance date.

### Change the theme

Open settings and choose one of:

- **Modern** — neutral contemporary surfaces
- **Neon Grid** — an original Tron-inspired cyan/magenta presentation
- **1990s Web** — an accessible early-web interpretation
- **Field Archive** — an original World War II-era paper-and-ink interface
- **Nautical Chart** — an original pirate-inspired parchment and ocean treatment

Themes modify CSS variables and presentation only. They never alter tag data, filters, ratings, or map logic. The chosen theme is stored under `atlas-notebook-theme` in `localStorage`; if browser storage is unavailable, selection still works for the current page session.

### Import and export data

The data manager exports a UTF-8, versioned JSON bundle. Available export scopes can limit the downloaded entity collections while retaining the bundle envelope. Import, export, and refresh are available to everyone. An import requires confirmation and changes only the visitor's local working copy. If an administrator is logged in, the global **Save** button can then publish that working copy as the shared base. Imports support:

- **Merge** — preserve current records and upsert incoming records by `id`; incoming records win on conflicts.
- **Replace** — atomically replace all University, Company, Note, and country-overlay collections after the entire bundle validates.

Imports are parsed as JSON, migrated at the version boundary, validated with strict Zod schemas, and limited to 10 MiB before the working copy changes. Unknown fields, malformed coordinates, invalid colors, non-HTTP source URLs, and unsupported versions are rejected. A second confirmation on administrator **Save** is required before the shared row is overwritten.

Export before using replace mode when the current data matters. A scoped export keeps non-selected arrays empty to remain schema-valid: importing that file in **merge** mode affects only its populated scope, while importing it in **replace** mode also clears the non-selected collections.

## Map providers, attribution, and environment configuration

| Resource                    | Built-in default                          | Configuration                                                           |
| --------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| Cartographic tiles          | OpenStreetMap raster tiles                | Set `VITE_CARTOGRAPHIC_STYLE_URL` to a MapLibre Style Specification URL |
| Satellite imagery           | Esri World Imagery raster endpoint        | Set `VITE_SATELLITE_TILE_URL` to an XYZ tile template                   |
| Satellite attribution       | Esri imagery attribution text             | Set matching plain text in `VITE_SATELLITE_ATTRIBUTION`                 |
| Satellite labels/boundaries | OpenFreeMap vector TileJSON and glyphs    | Defined in `src/map/mapStyles.ts`                                       |
| Country polygons            | `datasets/geo-countries` through jsDelivr | Defined in `src/map/CountryOverlayManager.ts`                           |
| Geocoding                   | OpenStreetMap Nominatim                   | Set `VITE_GEOCODING_ENDPOINT` to a compatible proxy/provider endpoint  |
| Currency rates              | Frankfurter public endpoint               | Set `VITE_CURRENCY_RATE_ENDPOINT` to a compatible key-free proxy       |

The included `.env.example` points the cartographic style at OpenFreeMap Liberty and the satellite layer at Esri World Imagery. When `VITE_CARTOGRAPHIC_STYLE_URL` is absent, the code uses its built-in OpenStreetMap raster style. If satellite tiles change, their matching plain-text attribution must change too. OpenFreeMap's TileJSON supplies its own vector attribution, and MapLibre renders all provider attribution through its attribution control.

Operational notes:

- Remote map tiles, style JSON, fonts, vectors, and country polygons are not packaged for offline use.
- Country facts, names, codes, and representative centers are loaded from the checked-in `src/data/countries.json`; no static country-information API is called at runtime. City search and reverse geocoding still require the configured provider.
- Respect the geocoding provider's usage policy. High-volume production deployments should use an approved provider or server-side proxy with rate limiting and caching.
- Review every provider's current attribution, acceptable-use, rate-limit, caching, and commercial-use terms before production deployment. The public OpenStreetMap tile service is not intended to be an unrestricted high-volume production CDN.
- Country geometry is pinned to `datasets/geo-countries` commit `185beb1137f6e9f5d916c91916f0159c20fbab30`; self-host that snapshot when deployment policy requires control over availability or caching.
- A replacement style/endpoint must be HTTPS in an HTTPS deployment, allow browser CORS, use the expected XYZ placeholders where applicable, and remain compatible with MapLibre.
- Replacement style documents must retain the flat Mercator projection so horizontal world wrapping remains available; globe projection is intentionally unsupported.
- `VITE_*` values are embedded into client assets at build time. Never place secrets or private API keys in them.
- Provider failures are surfaced without silently replacing the last loaded shared snapshot.

## Shared persistence behavior

`public.shared_datasets` contains one row with ID `atlas`. The entire versioned application bundle is stored in its `data` JSONB column so the existing import/export schema remains the network boundary. Every mount and explicit refresh fetches this row. Every visitor's tag, Papis, note, country-overlay, and import actions update only an in-memory working copy. The database changes only when an authenticated administrator confirms the global **Save** action.

The migration seeds the row from the checked-in example University, Company, Note, and country-overlay records. Later edits to `src/data/*.json` do not change an existing Supabase row. Import into a working copy, review it, then log in as the administrator and use **Save** when a shared replacement or merge is intentional.

RLS permits `SELECT` to `anon` and `authenticated`. Database `UPDATE` requires both an authenticated JWT and membership in `app_admins`. Local editing does not grant database access; a forged publish request from a non-admin is rejected by Postgres. `INSERT`, `DELETE`, and direct browser access to `app_admins` are not granted.

Presentation preferences use separate `localStorage` keys for the theme, map style, clustering, visible types, geographic-name mode, panel width, and floating-window geometry. They are not included in data exports.

Supabase access/refresh tokens are retained in tab storage by default and in local storage only when **Remember this login** is selected. Passwords are sent directly to Supabase Auth over HTTPS and are never stored by application code. Exported JSON remains the portable backup mechanism.

## Data files and schemas

### Editable records and configuration

| File                             | Purpose                                            |
| -------------------------------- | -------------------------------------------------- |
| `src/data/universities.json`     | Example University records used by the SQL seed     |
| `src/data/companies.json`        | Example Company records used by the SQL seed        |
| `src/data/notes.json`            | Example sticky Note records used by the SQL seed    |
| `src/data/countries.json`        | Bundled 196-record static information snapshot      |
| `src/data/country-overlays.json` | Example country highlights used by the SQL seed     |
| `src/config/scoring-config.json` | Rating ranges, criteria, weights, and mappings     |
| `src/config/theme-config.json`   | Five theme definitions and the default theme       |
| `src/config/interaction-config.json` | Create-mode and repeated-country-click behavior |

Example records demonstrate the complete shape. Fictional company examples and research notes are illustrative, not authoritative current rankings, prices, or employment advice.

### JSON Schema documents

Draft 2020-12 schemas live in `src/schemas/`:

- `university.schema.json`
- `company.schema.json`
- `note.schema.json`
- `country-overlay.schema.json`
- `country-data.schema.json`
- `scoring-config.schema.json`
- `theme-config.schema.json`

Runtime validation lives separately in `src/validation/` and is intentionally strict: unknown properties are rejected, text and array sizes are bounded, coordinates must be WGS84 values, country codes are uppercase three-letter identifiers, final ratings are 0–5 in 0.1 increments, and timestamps use ISO 8601.

### Maintaining the bundled country dataset

`src/data/countries.json` is application-owned reference data and is never included in user import/export bundles or browser entity stores. To refresh it, review the source/version/date and the explicit NATO, tier, and minimum-wage overrides in `scripts/generate-country-dataset.mjs`, then run:

```powershell
npm run data:countries
npm run check
```

The generator selects 195 sovereign records, merges maintained `world-countries` metadata with a snapshot from the public `countries-states-cities-database`, sorts by English name, and writes UTF-8 JSON. `countryTier` remains `null` unless Atlas configuration supplies a value, and minimum wage remains `null` unless an explicit dated override exists; the application never guesses either value.

### Import/export envelope

Version 2 bundles use this top-level contract:

```json
{
    "version": 2,
    "exportedAt": "2026-08-05T12:00:00.000Z",
    "universities": [],
    "companies": [],
    "notes": [],
    "countryOverlays": []
}
```

`version` is required. Future versions are rejected. The registered version 1 to version 2 migration adds an empty `notes` collection, so existing exports remain importable. Scoring and theme configuration are repository configuration and are not part of the user-data bundle.

## Rating system

Scoring is independent of React in `src/scoring/`. The UI calls the same functions for live previews, saved `finalRating` values, and popup explanations.

For each available criterion `i`:

```text
normalized_i = normalize(raw_i, configured range or mapping)
precise rating = sum(normalized_i * weight_i) / sum(included weight_i)
final rating = clamp(precise rating, 0, 5), rounded to one decimal place
effective weight_i = weight_i / sum(included weight_i)
contribution_i = normalized_i * effective weight_i
```

Linear values are clamped to their configured input range and projected onto 0–5. Rankings use inverse-linear normalization, so a lower rank scores higher. Boolean and categorical values use named mappings from configuration.

Missing values (`null`, `undefined`, or blank strings), invalid mappings, and invalid configured weights are excluded. Remaining positive weights are renormalized to 100%; missing data is not silently treated as zero. If no criterion is usable, the final result is `0.0`. The score breakdown lists raw values, normalized scores, configured/effective weights, contributions, exclusions, and the final explanation.

### Default University weights

| Criterion             | Weight | Normalization         |
| --------------------- | -----: | --------------------- |
| Location              |     10 | Linear 0–5            |
| Quality of life       |     10 | Linear 0–5            |
| Affordability         |     10 | Linear 0–5            |
| Job opportunities     |     12 | Linear 0–5            |
| Job-placement support |      8 | Boolean mapping       |
| Regional companies    |      8 | Linear 0–5            |
| Global reputation     |      8 | Linear 0–5            |
| Local reputation      |      6 | Linear 0–5            |
| Global ranking        |      8 | Inverse-linear 1–1000 |
| Local ranking         |      5 | Inverse-linear 1–100  |
| Commute               |      5 | Linear 0–5            |
| Country tier          |     10 | Category mapping      |

### Default Company weights

| Criterion               | Weight | Normalization    |
| ----------------------- | -----: | ---------------- |
| Payment                 |     25 | Linear 0–5       |
| Career growth           |     25 | Linear 0–5       |
| Location                |     15 | Linear 0–5       |
| Country tier            |     15 | Category mapping |
| Work model              |     10 | Category mapping |
| Internship availability |     10 | Boolean mapping  |

### Default mappings

| Mapping                 | Values                                                 |
| ----------------------- | ------------------------------------------------------ |
| Job-placement support   | `true = 5`, `false = 1`                                |
| Internship availability | `true = 5`, `false = 2`                                |
| Country tier            | `tier-1 = 5`, `tier-2 = 4`, `tier-3 = 3`, `tier-4 = 2` |
| Work model              | `remote = 4.5`, `hybrid = 5`, `on-site = 3.5`          |

Edit `src/config/scoring-config.json` to change weights, ranges, or mappings. Keep referenced mapping names valid, criterion fields unique within a model, values inside 0–5, and weights positive. Run `npm run check` after changes; configuration validation tests guard both structure and cross-references.

On startup and after every import, stored `finalRating` values are recalculated with the active configuration and only changed derived values are written back. This keeps minimum-rating filters, clustered map data, popups, and later exports consistent after weights change or an imported file contains stale scores.

## Architecture

```text
src/
├── application/       React-facing workflows, draft factories, mutations, validation
├── components/        Shared UI, panels, controls, forms, and type filters
├── config/            Scoring and theme JSON configuration
├── data/              Example entity JSON and database seed sources
├── filters/           Compiled predicates and single-pass filtering services
├── hooks/             Map lifecycle, focus, media query, and field-update hooks
├── map/               MapLibre component, styles, layers, interactions, and icons
├── popups/            Type adapters, shared tag details, and score breakdown
├── schemas/           Portable JSON Schema documents
├── scoring/           Pure normalization and weighted-calculation services
├── services/          Configurable geocoding and atomic location synchronization
├── storage/           Repository contracts, drivers, bundle tools, and DAL facade
├── styles/            Global variables, animation, utility, and base styles
├── tags/              University/Company forms and reusable form sections
├── tests/             Unit and workflow tests
├── themes/            Theme provider plus one stylesheet per visual theme
├── types/             Domain and configuration types
├── utils/             IDs, coordinate normalization, and GeoJSON conversion
└── validation/        Runtime Zod schemas and safe parsing boundaries
```

The root application composes these modules; business rules do not live in presentational components. MapLibre owns one canvas and one set of pointer listeners. React owns records and panels. The tag layer receives only filtered compact GeoJSON, while complete domain records remain in typed application state. Storage drivers sit behind asynchronous repositories, and validation/scoring run before trusted records are persisted.

### Development conventions

- Keep one React component per file and one major feature per folder.
- Give major components their own CSS Module; keep shared variables, animations, utilities, globals, and theme-specific rules in their dedicated stylesheets.
- Keep UI, map behavior, filtering, validation, scoring, persistence, themes, and geographic utilities separate.
- Prefer small strongly typed functions and reusable hooks over inline business rules or duplicate helpers.
- Use Allman braces and three blank lines between function declarations.
- Place a short documentation comment before every function describing its purpose, consumer, important inputs, and output.
- Register external listeners once, refresh callback references as state changes, and pair every resource with cleanup.
- Keep files focused and split them before they become difficult to review (roughly 300–500 lines where practical).

### API or database extension

UI consumers depend on the `AtlasDataAccess` and `RecordRepository<T>` contracts in `src/storage/types.ts`, not directly on browser APIs. To add a server:

1. Implement the repository methods (`getAll`, `getById`, `save`, `saveMany`, `delete`, and `clear`) against an HTTP API or database gateway.
2. Implement bundle load/import/export semantics, including validation and version handling.
3. Select the new adapter in the data-access factory used by `useAtlasData`.
4. Preserve the existing domain types or add an explicit transport-to-domain mapper.

Scoring accepts an injected `ScoringConfig`, so a validated remote configuration can replace the bundled defaults without changing UI code. Map provider URLs are already isolated in `src/map/mapStyles.ts`.

## Accessibility and responsive behavior

- Semantic headings, sections, lists, forms, fieldsets, labels, and status regions
- Skip link to the map workspace
- Keyboard-operable style radios and tool rail with arrow/Home/End navigation
- Focus-trapped dialogs/drawers, Escape dismissal, and focus restoration
- Visible `:focus-visible` treatment and high-contrast preference adjustments
- Global reduced-motion behavior through `prefers-reduced-motion`
- Locale-aware rating and coordinate formatting through `Intl.NumberFormat`
- Mobile bottom navigation/drawers, safe-area insets, and control offsets that reduce panel/map collisions
- Collision-aware MapLibre symbols and grouped clusters to reduce marker overlap

Map canvases are intrinsically visual. The surrounding labeled controls, editable coordinate fields, list-based details, filters, and forms provide keyboard-accessible alternatives for record operations. WCAG 2.2 guidance informs the implementation, but production teams should still perform automated and manual audits with their supported browsers, zoom levels, contrast modes, keyboards, and screen readers.

## Security and privacy

- React renders user text as text rather than executable HTML.
- Zod rejects unknown imported fields and enforces bounded values.
- Source links accept only HTTP/HTTPS and open with `noopener noreferrer`.
- Imported JSON is never evaluated and is limited to 10 MiB.
- Overlay colors are schema-validated and sanitized before becoming MapLibre paint values.
- Supabase RLS allows public reads but checks the protected administrator allowlist for every update.
- The frontend contains only the public Supabase URL and anon/publishable key; privileged credentials stay outside GitHub Pages.
- The supplied HTML includes a CSP-compatible baseline for scripts, images, connections, fonts, styles, and MapLibre workers.

The default CSP permits broad HTTPS map resources and inline styles required by current UI/map rendering. For production, deliver CSP as an HTTP response header and narrow `connect-src`/`img-src` to the exact chosen providers while retaining the MapLibre worker requirements (`worker-src 'self' blob:`). Development HMR may also require the local Vite WebSocket origin. Test any stricter policy against style JSON, raster/vector tiles, glyphs, GeoJSON, blob workers, and dynamically applied styles.

The shared dataset is intentionally public. Do not store private or regulated information in records. Treat remembered login sessions, exported JSON files, notes, and research URLs according to their sensitivity.

## Performance decisions

- MapLibre renders tags through one clustered GeoJSON source (`clusterRadius: 52`, `clusterMaxZoom: 13`) rather than individual React marker trees.
- Feature properties stay compact; full records use an O(1) ID lookup map.
- Text filters compile normalized `Set` lookups and each tag type is filtered in a single pass.
- Map listeners are registered once, callbacks are refreshed without re-registration, and all listeners/map resources are removed on unmount.
- Administrator marker dragging previews source coordinates and commits one draft update at drag end.
- Application layers are reinstalled after style changes without recreating the React app.
- Map controls honor panel insets and CSS safe areas; symbol collision rules and clustering limit overlap.
- Vite produces separate MapLibre and validation chunks, splits CSS, targets ES2022, and emits source maps.
- Horizontal world copies remain enabled for seamless navigation; rotation, pitch, and globe projection stay disabled to preserve the flat map.

For very large datasets, the existing boundaries support moving filter/search work to a Web Worker, serving vector tiles, paginating repository reads, or querying a backend spatial index without rewriting forms or scoring.

## Tests

The Vitest suite covers:

- linear, inverse, boolean, and categorical normalization
- missing-value renormalization and contribution totals
- University and Company scoring
- independent/combinable filter behavior and resets
- Zod validation for examples, configuration, tags, overlays, URLs, and unknown fields
- WGS84/Web Mercator coordinate utilities and Turf geometry operations
- compact cluster-ready GeoJSON conversion
- application draft, validation, note, and source workflows
- country/city autocomplete, geocoding synchronization, optional tag fields, star ratings, and searchable multi-selects
- panel resizing, duplicate-safe multi-window details, and wrapped location camera transitions
- first-run seeding, repository CRUD, merge/replace imports, exports, and malformed-data rejection
- stale-selection cleanup, explicit creation mode, Escape handling, pinned windows, highlighted-country browsing/hover, and all 195 bundled country records
- marker preview content/cleanup/keyboard focus and ordered draft/detail camera behavior across wrapped longitudes

Run the complete quality gate:

```powershell
npm run check
```

## Logical implementation phases

The codebase is organized so each phase can be verified before the next one changes integration behavior:

1. **Foundation** — Vite/React/TypeScript setup, shared types, CSS foundations, five themes, example JSON, and schemas.
2. **Domain services** — Zod validation, configurable scoring, optimized predicates, and geographic utilities.
3. **Persistence** — Supabase shared dataset client, Auth session handling, RLS migration, versioning, and safe import/export.
4. **Map canvas** — base styles, providers/attribution, country layers, clustered tag layers, navigation, clicks, selection, and dragging.
5. **Feature UI** — type chooser, University/Company editors, notes, sources, detail cards, country editor, filters, settings, and data manager.
6. **Integration and hardening** — responsive composition, focus/control collision handling, cleanup, CSP review, tests, lint, type-check, and production build.

After a phase or material change, use:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

### Release verification checklist

- Run `npm ci` from a clean checkout and then `npm run check`.
- Test both map styles and verify visible provider attribution and network/CORS behavior.
- On a fresh origin, confirm seed data appears once and survives reload.
- Create, score, edit, drag, reload, and delete one tag of each type.
- Add/edit/delete notes and sources; inspect the popup score explanation.
- Create/edit/hide/delete a country overlay in both base styles.
- Combine and reset every University and Company filter family.
- Exercise all five themes at desktop, mobile, 200% zoom, reduced motion, and increased contrast.
- Round-trip an export through merge and replace import; confirm malformed and future-version files fail without partial writes.
- Test keyboard-only navigation and at least one screen reader/browser pairing.
- Validate the deployed CSP, HTTPS, caching, provider quotas/terms, and error behavior with a provider unavailable.

## Production deployment

`npm run build` creates static assets in `dist/`. Deploy that directory to an HTTPS static host. The application currently uses a root-relative Vite entry; configure Vite's `base` if hosting under a URL subpath.

Before release:

- choose production-grade tile/style/geometry hosting and keep required attribution visible;
- set provider environment variables during the build;
- configure CORS and CSP for only those endpoints;
- use immutable or pinned external data where reproducibility matters;
- set appropriate caching for hashed application assets without violating tile-provider rules;
- verify WebGL/worker support and a usable error state in target browsers;
- add authentication, authorization, server validation, encryption, backups, and conflict handling before introducing shared or sensitive cloud data.
