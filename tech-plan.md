# Tech Plan: Tip Calculator

Tech Lead, 2026-10-15. Inputs read: `briefs/tech-lead.md`, `PRD.md`, `design-doc.md` (revision 2), `PROJECT.md`, `DECISIONS.md` (D-001, D-002), `ship-web-app/SKILL.md` (§ Default Stack) with its `templates/` and `references/architecture.md` and `references/deploy-github-pages.md`, `frontend-baseline/assets/theme-init.html` and `theme-toggle.md`, `web-ship-check` (live-marker check), `rules/machine-windows.md`, and the sibling `car-shopping/app/` (`vite.config.ts`, `tsconfig.json`, `package.json`, `index.html`, `src/types.ts`, `.github/workflows/deploy.yml`), cross-checked against the deploy workflows and installed versions of `apartment-shopping`, `car-tco-compare` and `wisdom-knowledge-base`.

The keystone is `api-contract.md`: frozen types, constants, the storage and URL-state contracts, every pure-module signature with its exact rules and the golden test cases. This plan is the architecture and the scaffold list around it.

## Stack and rationale

| Layer | Choice | Why |
|---|---|---|
| App | **Vite + React + TypeScript** single-page app, no router | The owner's default stack (`ship-web-app` § Default Stack). One screen needs no router; the URL state lives in the hash. |
| Logic | **Pure TypeScript modules in `app/src/lib/`**, no DOM, no React: `calc.ts` (the calculation module of AC10), `format.ts`, `messages.ts`, `urlState.ts`, `theme.ts` | The skill's highest-leverage rule: the UI only renders. The design doc asks for the same thing ("the whole UI uses no maths of its own"), so even the status-line selection and the stepper arithmetic are pure functions with tests. |
| Money | **Integer cents; tip percent as integer basis points** (hundredths of a percent) | Exact arithmetic with no floating-point drift and no decimal library (Key decisions 2 and 3). |
| Tests | **Vitest, `environment: 'node'`**, unit tests only | AC10 asks for unit tests of the pure module; the UI is proved by QA in a real browser. No jsdom, no Testing Library: two fewer dependencies. |
| Styling | **Plain CSS custom properties** with `:root[data-theme="dark"]`; tokens copied from design-doc.md § Design Tokens | The owner's default; the design doc is the only token source. |
| Theme | **Inline no-flash script in `index.html`** (adapted from `ship-web-app/templates/theme-init.html`) plus a small React hook | AC7: the theme is set before first paint. |
| Hosting and CI | **GitHub Pages + GitHub Actions** on push to `main`, public repo `xzhou110/tip-calculator`, served at `https://xzhou110.github.io/tip-calculator/` | The owner's default; free for a public repository. The workflow is the sibling-proven one (same action majors in four repos). |
| Backend, data layer, secrets, analytics | **None** | PRD scope; nothing leaves the browser except a link the user chooses to share. |

**Versions.** React 19, Vite 7, `@vitejs/plugin-react` 5, Vitest 3.2, TypeScript 5.9, `@types/node` 24 (exact ranges under Shared foundation). The siblings run React 18.3, Vite 5.4, Vitest 2.1 and TypeScript 5.9.3; this plan moves one step newer on purpose (Key decision 9) and names the sibling set as the fallback if the install fails. The config shapes are identical across both sets.

**Deviations from the skill's default pipeline, each with its reason.** No localStorage autosave of the inputs (the PRD excludes saved history and the design's first open is empty; the URL hash already survives a reload). No PWA manifest (the PRD excludes the offline service worker and nothing asks for install). Vitest runs in `node` (no component tests). The theme storage key is namespaced instead of the template's `appTheme` (Key decision 5).

**Cost.** $0. GitHub Pages and Actions minutes are free for a public repository; there are no paid APIs or keys.

## System design

```
Browser, one origin shared with every xzhou110 Pages site (https://xzhou110.github.io)

index.html  [frozen]
 |-- <head> inline no-flash script (runs before CSS and the bundle)
 |      reads localStorage['tip-calculator.theme.v1'] ('light' | 'dark'),
 |      else prefers-color-scheme  -->  <html data-theme="light|dark">
 |-- <title>Tip Calculator</title>   (the live-check marker, present without JS)
 '-- /src/main.tsx --> <App/>
        |
        |-- useTheme()  ------------------> lib/theme.ts (pure) --> localStorage (theme key only)
        |      follows the system live until the user picks; Light | Dark writes the key
        |
        |-- useSplitState()
        |      state = FieldTexts { bill, tip, people }   (raw strings: the ONLY input state)
        |      mount:      lib/urlState.parseHash(location.hash) --> FieldTexts (bad values -> defaults)
        |      hashchange: re-hydrate the same way
        |      change:     150 ms trailing write: history.replaceState(buildShareUrl(href, fields))
        |      evaluation = useMemo(evaluate(fields))      (synchronous on every keystroke)
        |
        |-- lib/calc.ts (pure)      parseBill / parseTip / parsePeople --> computeSplit (integer cents)
        |                           evaluate --> Evaluation { ready + SplitResult | incomplete + which fields }
        |                           stepTip / stepPeople / pressedPick
        |-- lib/messages.ts (pure)  FieldMessage x3, StatusLine, screen-reader announcement
        |-- lib/format.ts (pure)    "$25.92", "2¢", "1,500", canonical "86.40" / "17.5"
        |
        '-- components (render only): Header + ThemeToggle, ResultsCard, BillField,
            TipField (picks + field), PeopleField (stepper), CopyLinkButton, Footer, SrStatus

Build and deploy:  push main --> Actions: npm ci, npm test, npm run build (tsc + vite),
                   npm run size (bundle-size table to the job summary)
                   --> upload app/dist --> GitHub Pages, served at /tip-calculator/
                   (Vite base './' resolves every asset under /tip-calculator/;
                    content-hashed asset names; index.html stamped with the commit SHA)

Live check (AC11): after the deploy run succeeds, poll https://xzhou110.github.io/tip-calculator/
                   until 200 + <title>Tip Calculator</title> + build-commit == pushed SHA
                   (a cached 404 or an older SHA means not yet live; 30 min timeout)
```

**One data flow.** Keystroke → `setField` → render → `evaluate(fields)` → results, field messages and status line all re-derive in the same render. A separate effect writes the hash 150 ms after the last change. Nothing is asynchronous except that URL write, the 700 ms screen-reader announcement and the clipboard.

**Logic in a second runtime (flagged).** One piece only: the theme resolution and storage key exist in the inline `index.html` script, because it must run before the bundle, and again in `lib/theme.ts` and `constants.ts`. The coupling is explicit: `app/src/contract.test.ts` (frozen) fails if `index.html` stops reading `THEME_STORAGE_KEY`. There is no cron, Edge Function or server, so the calculation itself exists only once. A second, softer coupling: the two `theme-color` meta values in `index.html` equal the `--surface-2` token in each theme (`#f4f5f2`, `#16181c`); change both together.

## Data model

There is no database and no server. The model is four in-memory shapes, one URL fragment and one storage key; the full TypeScript lives in `api-contract.md` § Frozen Types.

| Entity | Shape | Lives in | Notes |
|---|---|---|---|
| `FieldTexts` | `{ bill: string; tip: string; people: string }` | React state | Exactly what was typed. The only input state; the app never reformats it while the user types. |
| `ParsedFields` | one `ParseResult` per field: `valid` with a value, `empty`, or `invalid` with a named problem | derived | Bill in cents (`Cents`), Tip in basis points (`BasisPoints`, 2000 = 20%), People as an integer. |
| `SplitResult` | `tipCents`, `totalCents`, `shareCents`, `collectedCents`, `overageCents`, `kind` ('one', 'even' or 'roundedUp') | derived | Integer cents throughout. `overageCents` is always 0 to people − 1. `roundedUp` means every person still pays the same share, rounded up to the cent; it is deliberately not called "uneven", which the PRD reserves for the excluded unequal-shares feature. |
| `Evaluation` | `ready` (parsed, inputs, result) or `incomplete` (parsed, invalid fields, empty fields) | derived | Drives the placeholders (AC1, AC6), the status line and the field messages. |
| URL hash | `#bill=86.40&tip=20&people=4` | `location.hash` | Canonical values of the valid fields only; per-field fallback to defaults on load (AC9). |
| Theme | `'light'` or `'dark'` under `tip-calculator.theme.v1` | `localStorage` | Absent means follow the system (AC7). The only thing ever stored. |

**Units and bounds.** Bill: 0 to $999,999,999.99 with at most 2 decimals. Tip: 0 to 100 percent with at most 2 decimals. People: whole numbers from 1 to 999,999,999,999,999. The upper bounds are not product caps: they are the points where every intermediate product stays an exact integer in a JavaScript number (`Number.MAX_SAFE_INTEGER`), which `contract.test.ts` proves. A real table never reaches them, and crossing one shows a plain message rather than a wrong cent.

**Rounding rule (AC5, from the design doc, made exact here).** Tip Amount = bill × percent ÷ 100 rounded half up to the cent. Total = Bill + the displayed Tip Amount. Each Person Pays = Total ÷ People rounded **up** to the cent. Overage = share × people − Total, from 0 to people − 1 cents, and it is always stated. Worked: 86.40, 20%, 4 people gives $17.28, $103.68, $25.92, even. 100, 18%, 3 people gives $18.00, $118.00, $39.34, collected $118.02, 2¢ over.

## File/module layout and lanes

Paths are relative to the project root `D:/Meaningful/AI/tip-calculator/` (also the repository root). The build-verify script runs `npm run typecheck`, `npm test` and `npm run build` in **`D:/Meaningful/AI/tip-calculator/app`**.

```
tip-calculator/
  .github/workflows/deploy.yml     shared, frozen
  .gitignore                       shared
  PRD.md design-doc.md tech-plan.md api-contract.md PROJECT.md DECISIONS.md
  STATE.md RUN_LOG.md README.md briefs/**                    orchestrator records
  app/
    package.json package-lock.json tsconfig.json vite.config.ts index.html   shared, frozen
    src/
      types.ts constants.ts contract.test.ts                                shared, frozen
      main.tsx App.tsx styles.css           lane (scaffolded as stubs, the engineer replaces them)
      lib/calc.ts + calc.test.ts            lane: parse, computeSplit, evaluate, steps, pressedPick
      lib/format.ts + format.test.ts        lane: money, overage, count, canonical texts
      lib/messages.ts + messages.test.ts    lane: field messages, status line, announcement
      lib/urlState.ts + urlState.test.ts    lane: parseHash, serializeHash, buildShareUrl
      lib/theme.ts + theme.test.ts          lane: resolveTheme, read and write storage
      state/useSplitState.ts state/useTheme.ts                              lane
      components/*.tsx                                                      lane
    scripts/report-bundle-size.mjs          shared, frozen (bundle-size report, PRD Success Metric)
```

### Lane 1: Frontend Engineer (the only lane)

- **Owns (edit freely):** `app/src/**` and `app/public/**`, **except** the three frozen files below.
- **Builds:** the five pure modules with their Vitest suites first (the golden cases in `api-contract.md` are the minimum for `calc.test.ts`), then the two hooks, then the components and `styles.css` from design-doc.md.
- **Must not touch:** every shared file listed next. A needed change (a dependency, a type, a constant, the HTML shell, the workflow) is a change request to the orchestrator, never an edit.

### Shared Files No Lane May Touch

- `app/package.json`, `app/package-lock.json` (no dependency added or bumped inside a lane)
- `app/tsconfig.json`, `app/vite.config.ts`, `app/index.html`
- `app/src/types.ts`, `app/src/constants.ts`, `app/src/contract.test.ts`
- `app/scripts/report-bundle-size.mjs`
- `.github/workflows/deploy.yml`, `.gitignore`
- the orchestrator's records: `PRD.md`, `design-doc.md`, `tech-plan.md`, `api-contract.md`, `PROJECT.md`, `DECISIONS.md`, `STATE.md`, `RUN_LOG.md`, `README.md`, `briefs/**`

**No second lane.** The pure modules are a few hundred lines that the UI consumes on every interaction. Writing them test-first takes one engineer minutes, while a second agent would add an Opus run and an integration seam for no parallel gain. The contract is still precise enough that a pure-logic lane (`app/src/lib/**`) could be split off later without renegotiation.

## Shared foundation to scaffold

The orchestrator creates exactly these files, then runs `npm install` in `app/` (which writes `package-lock.json`, to be committed: CI uses `npm ci`), then `npm run typecheck`, `npm test` (5 contract tests pass), `npm run build` and `npm run size`, all exiting 0, before committing the scaffold (record the size line in RUN_LOG.md as the empty-shell baseline). Write every file as UTF-8 **without a BOM** (`rules/machine-windows.md`: never PowerShell `>` or `Out-File`). Every scaffold file below is pure ASCII.

### Dependencies

| Package | Range | Kind | Purpose |
|---|---|---|---|
| `react` | `^19.1.0` | dependency | UI library (default stack) |
| `react-dom` | `^19.1.0` | dependency | DOM renderer (`createRoot`) |
| `vite` | `^7.1.0` | dev | Dev server and production bundler; content-hashed asset names, so a new deploy's JS and CSS never collide with a cached old file |
| `@vitejs/plugin-react` | `^5.0.0` | dev | JSX transform and Fast Refresh for Vite |
| `typescript` | `~5.9.2` | dev | `tsc --noEmit` typecheck (tilde: TypeScript minors can change types) |
| `vitest` | `^3.2.4` | dev | Unit tests for the pure modules (node environment, no DOM) |
| `@types/react` | `^19.1.0` | dev | React types |
| `@types/react-dom` | `^19.1.0` | dev | React DOM types |
| `@types/node` | `^24.0.0` | dev | Types for `vite.config.ts` and the contract test's `node:fs` read; matches Node 24 locally and in CI |

**Fallback if `npm install` fails on a peer conflict:** the sibling-proven set: `react` and `react-dom` `^18.3.1`, `@types/react` `^18.3.12`, `@types/react-dom` `^18.3.1`, `vite` `^5.4.11`, `@vitejs/plugin-react` `^4.3.4`, `vitest` `^2.1.8`. Keep `typescript` and `@types/node`. Every config file below stays unchanged; record the swap in DECISIONS.md.

### `app/package.json`

```json
{
  "name": "tip-calculator",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "description": "Tip Calculator: split a dinner bill with the tip, to the cent (XuSeak)",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "tsc --noEmit && vite build",
    "size": "node scripts/report-bundle-size.mjs",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.9.2",
    "vite": "^7.1.0",
    "vitest": "^3.2.4"
  }
}
```

The four scripts the build calls: `typecheck` (`tsc --noEmit`), `test` (`vitest run`, which exits non-zero on any failure and on zero test files), `build` (typecheck, then `vite build` into `app/dist`) and `dev` (local dev server). One more, outside the build-verify trio: `size` measures the built bundle for the PRD's Success Metric (§ Release Verification); it runs after `build` and never fails on size. `npm` runs scripts through `cmd.exe` on Windows, so the `&&` in `build` is safe there and on the Ubuntu runner.

### `app/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node", "vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

This is the skill template's tsconfig with two changes. It moves to ES2022 (Vite 7's default browser target already covers it, and it gives `replaceAll` and `at()`). It also adds explicit `types`, for the `node:fs` contract test and Vite's client types (no `vite-env.d.ts` needed).

### `app/vite.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The commit this build came from: GitHub Actions sets GITHUB_SHA; a local build says 'local'.
// Stamped into index.html as the live check's proof of freshness (tech-plan.md, Release
// Verification): GitHub Pages' CDN ignores the query string, so only content proves a page is new.
const buildCommit = process.env.GITHUB_SHA ?? 'local';

// base './': relative asset URLs. On GitHub Pages they resolve under /tip-calculator/ (the
// PRD's base path); under `vite preview` and a served dist/ they resolve under /. The build
// never hard-codes the repository name. Same value as the skill template and car-shopping.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'stamp-build-commit',
      transformIndexHtml: (html: string) => html.replace('__BUILD_COMMIT__', buildCommit),
    },
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

The inline plugin is four lines and uses Vite's stable `transformIndexHtml` hook (unchanged from Vite 5 to 7, so the fallback set keeps it). It runs in `dev` too, where the stamp reads `local`. The public commit SHA of a public repository is the only build metadata in the page.

### `app/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tip Calculator</title>
    <meta name="build-commit" content="__BUILD_COMMIT__" />
    <meta name="description" content="Split a dinner bill with the tip, to the cent. Enter the bill, pick a tip, set the people." />
    <meta name="theme-color" content="#f4f5f2" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#16181c" media="(prefers-color-scheme: dark)" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%2324776a'/%3E%3Cpath d='M20 46L44 18' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3Ccircle cx='22' cy='22' r='6' fill='white'/%3E%3Ccircle cx='42' cy='42' r='6' fill='white'/%3E%3C/svg%3E" />
    <!-- No-flash theme: runs before the stylesheet and the bundle. The key must equal
         THEME_STORAGE_KEY in src/constants.ts (src/contract.test.ts guards the pair). -->
    <script>
      (function () {
        var t = null;
        try {
          t = window.localStorage.getItem('tip-calculator.theme.v1');
        } catch (e) {}
        if (t !== 'light' && t !== 'dark') {
          t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.dataset.theme = t;
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

The favicon is an inline SVG data URI (a "%" on the accent teal). The browser therefore never requests `/favicon.ico` at the origin root, which belongs to the portfolio user site and could log a 404 in the console. Unlike the template, blocked storage falls back to the system setting instead of forcing light.

### `app/src/types.ts` (frozen)

The full contents are in `api-contract.md` § Frozen Types; scaffold them verbatim. They are declarations only, so the stub is the final file.

### `app/src/constants.ts` (frozen)

The full contents are in `api-contract.md` § Frozen Constants; scaffold them verbatim.

### `app/src/contract.test.ts` (frozen)

```ts
// FROZEN CONTRACT GUARD (api-contract.md). Do not edit in a build lane.
// Keeps index.html and constants.ts in sync, and proves the input bounds keep the math exact.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FIELDS,
  FIELD_ORDER,
  MAX_BILL_CENTS,
  MAX_PEOPLE,
  MAX_TIP_BP,
  THEME_STORAGE_KEY,
  TIP_PICKS_BP,
} from './constants';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('frozen contract', () => {
  it('the no-flash script in index.html reads the same theme key as the app', () => {
    expect(indexHtml).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
  });

  it('index.html carries the title marker the live check asserts', () => {
    expect(indexHtml).toContain('<title>Tip Calculator</title>');
  });

  it('index.html carries the build-commit placeholder that vite.config.ts stamps', () => {
    expect(indexHtml).toContain('<meta name="build-commit" content="__BUILD_COMMIT__" />');
  });

  it('defaults, quick picks and field order match the contract', () => {
    expect(DEFAULT_FIELDS).toEqual({ bill: '', tip: '20', people: '2' });
    expect(TIP_PICKS_BP).toEqual([1500, 1800, 2000, 2500]);
    expect(FIELD_ORDER).toEqual(['bill', 'tip', 'people']);
  });

  it('the input bounds keep every intermediate value an exact integer', () => {
    expect(Number.isSafeInteger(MAX_BILL_CENTS * MAX_TIP_BP + 5000)).toBe(true);
    expect(Number.isSafeInteger(2 * MAX_BILL_CENTS + MAX_PEOPLE)).toBe(true);
  });
});
```

### `app/scripts/report-bundle-size.mjs` (frozen)

Zero dependencies (Node built-ins only), outside `tsconfig`'s `include`, so it is neither typechecked nor bundled.

```js
// Bundle size report (PRD Success Metrics: measured and reported, no target is imposed).
// Run after `npm run build`: `npm run size`. Prints raw and gzip bytes for every file in
// dist/ plus the totals; in GitHub Actions it also appends the table to the job summary.
// It never fails on size; it exits 1 only when dist/ is missing.
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const dist = fileURLToPath(new URL('../dist', import.meta.url));
if (!existsSync(dist)) {
  console.log('dist/ not found: run npm run build first.');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );

const rows = walk(dist)
  .map((file) => {
    const bytes = readFileSync(file);
    return {
      name: relative(dist, file).split(sep).join('/'),
      raw: bytes.length,
      gzip: gzipSync(bytes, { level: 9 }).length,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const total = rows.reduce((sum, r) => ({ raw: sum.raw + r.raw, gzip: sum.gzip + r.gzip }), { raw: 0, gzip: 0 });
const kib = (n) => `${(n / 1024).toFixed(1)} KiB`;
const table = [
  '| File | Raw | Gzip |',
  '|---|---:|---:|',
  ...rows.map((r) => `| ${r.name} | ${kib(r.raw)} | ${kib(r.gzip)} |`),
  `| Total | ${kib(total.raw)} | ${kib(total.gzip)} |`,
].join('\n');

console.log(`Bundle size: ${total.raw} bytes raw, ${total.gzip} bytes gzip (${rows.length} files in dist/)`);
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Bundle Size\n\n${table}\n`);
}
```

### Lane Stubs (scaffolded so the scaffold commit builds; the engineer replaces them)

`app/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`app/src/App.tsx`:

```tsx
export default function App() {
  return (
    <main>
      <h1>Tip Calculator</h1>
    </main>
  );
}
```

`app/src/styles.css`:

```css
/* Frontend lane: replace with design-doc.md's Design Tokens block and the page styles. */
:root { color-scheme: light; }
:root[data-theme='dark'] { color-scheme: dark; }
```

### `.gitignore` (repository root)

```
node_modules/
dist/
coverage/
*.log
.DS_Store
Thumbs.db
.env
.env.*
*.local
```

### `.github/workflows/deploy.yml` (frozen)

This is the sibling-proven workflow (the same action majors run in car-shopping, apartment-shopping, car-tco-compare and wisdom-knowledge-base), adapted in three ways: Node 24 for parity with this machine; `npm test` before the build, so a broken engine never deploys; and `npm run size` after it, so every deploy's job summary records the bundle size. `GITHUB_SHA`, which `vite.config.ts` stamps into the page, is set by Actions on every run; no `env:` entry is needed.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# One deployment at a time; never cancel one in progress.
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: app/package-lock.json
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm run size
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Deploy notes for the release step, after the owner's yes at the gate.** Pushing `.github/workflows/*` needs the `workflow` OAuth scope (`gh auth refresh -h github.com -s workflow`). Enable Pages with the Actions source before the first run (`gh api --method POST repos/xzhou110/tip-calculator/pages -f build_type=workflow`), or the first run fails. Run `node ~/.claude/git-hooks/secret-scan.mjs --history` before the first public push. If the run shows a Node 20 actions-runtime deprecation annotation, bumping to the current action majors is a follow-up rather than a blocker, since the four siblings deploy with these majors today.

**Scaffold acceptance.** After the build, `app/dist/index.html` contains the inline theme script and `<meta name="build-commit" content="local" />` (the placeholder is gone), and references `./assets/index-<hash>.js` and `./assets/index-<hash>.css` (relative, no leading slash). `npm run size` exits 0 and prints a `Bundle size:` line.

## Release Verification (AC11 and the Bundle-Size Metric)

Not a required section. It closes two PRD items the scaffold alone does not prove, and it runs only after the owner's yes at the deploy gate and the push. The orchestrator (or QA, on the orchestrator's instruction) runs it; the commands are Git Bash and need no install.

### Live Check (AC11): Commit-Stamped, Not Query-Busted

**Why not `?t=`.** The spike (§ Spike result) proved that GitHub Pages' CDN leaves the query string out of its cache key: a never-used `?t=` value got the same cached 404 (`X-Cache: HIT`, `Age: 990`). So `?t=<now>` busts nothing at the CDN. A 200 seen that way could be a stale copy, and a 404 could be the cached pre-deploy 404. Instead the page carries its own proof: `vite.config.ts` stamps `index.html` with the commit the Actions build came from (`<meta name="build-commit" content="<GITHUB_SHA>" />`). A stale cached copy cannot contain the SHA that was just pushed, so matching it is the cache-busted proof AC11 asks for.

**Step 1: wait for the deploy run of the pushed commit to succeed.** Do not request the live URL before this: once a cached 404 expires, any request seeds a fresh one.

```bash
SHA=$(git -C D:/Meaningful/AI/tip-calculator rev-parse HEAD)
RUN=$(gh run list --repo xzhou110/tip-calculator --workflow deploy.yml --commit "$SHA" --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN" --repo xzhou110/tip-calculator --exit-status
```

An empty `RUN` means Actions has not queued the run yet; repeat the second line a few seconds later. A non-zero exit from `gh run watch` means the deploy failed: stop and report, nothing is live.

**Step 2: poll the bare URL until the new page is served.** Run it as a background command, since it waits.

```bash
URL='https://xzhou110.github.io/tip-calculator/'
END=$(( $(date +%s) + 1800 ))
until BODY=$(curl -sf "$URL") \
  && printf '%s' "$BODY" | grep -qF '<title>Tip Calculator</title>' \
  && printf '%s' "$BODY" | grep -qF "<meta name=\"build-commit\" content=\"$SHA\""; do
  if [ "$(date +%s)" -ge "$END" ]; then echo 'NOT LIVE YET after 30 min'; curl -sI "$URL"; exit 1; fi
  sleep 30
done
curl -sI "$URL" | grep -iE '^(HTTP|age|x-cache)'
JS=$(printf '%s' "$BODY" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -n 1)
curl -s --compressed -o /dev/null -w 'js %{http_code} %{content_type} %{size_download} bytes over the wire\n' "$URL$JS"
```

- **Pass:** HTTP 200, the title marker, `build-commit` equal to the pushed SHA, and the referenced `assets/index-<hash>.js` returning 200 with a JavaScript content type. The asset URL resolves under `/tip-calculator/assets/`, which also proves the PRD's base path in the real runtime.
- **Not yet live (keep polling):** any 404, cached or fresh; a 200 without the marker (a disabled Pages site falls through to the user site's 404 page, which is HTTP 200); a 200 carrying an older SHA.
- **Timeout, with its reason:** 30 minutes. The spike saw the pre-deploy 404 still served from cache at `Age: 990` seconds (16.5 minutes), and its lifetime is unknown; 30 minutes is about twice the observed age. On a timeout the result is "deployed, not yet verified live", reported with the last status, `Age` and `X-Cache` headers. AC11 is never marked passed on a timeout. Re-run step 2 later; never redeploy to "fix" a cached response.
- **QA's browser pass** then opens the same bare URL in a fresh browser context, runs the Outcome Brief journey, reads `document.querySelector('meta[name="build-commit"]').content` (must equal `$SHA`), and confirms the network log holds only `xzhou110.github.io` requests (no backend, no analytics).

### Bundle Size (PRD Success Metric)

- **Measured** by `app/scripts/report-bundle-size.mjs` (`npm run size`): raw and gzip bytes for every file in `app/dist/`, plus the totals. The gzip figure is gzip at level 9, close to but not identical to what the CDN sends, so the live figure below is reported beside it. No target is imposed, and the script never fails on size.
- **Reported** in three places:
  1. **Every deploy:** the workflow's `npm run size` step writes the table to the Actions job summary.
  2. **QA's report:** QA runs `npm run build`, then `npm run size`, on the release commit in `app/` and quotes the `Bundle size:` line.
  3. **The live check:** its last line gives the JS bytes actually sent over the wire.
- The orchestrator puts both numbers (the build total and the live JS transfer) in the release hand-back to the owner. The scaffold's baseline goes in RUN_LOG.md.

## High-risk surfaces

**None from the override list.** Here is why, item by item:

- **Auth and permissions:** there are no accounts, sessions, roles or server.
- **Payments:** the app computes amounts but never moves money and has no payment provider.
- **Privacy:** nothing is collected, sent or logged. The bill amount sits in the URL **fragment**, which browsers never send in HTTP requests, so it leaves the device only when the user shares the link. There is no analytics, no third-party script and no font CDN; the one external link (XuSeak footer) uses `rel="noopener noreferrer"`. The only build metadata in the page is the commit SHA of the public repository. The repository has no secrets, and the privacy hooks still run on every commit.
- **Data loss:** the only stored value is the theme choice, and the inputs are recoverable from the URL.

Not on the list, but named so the gates cover them:

1. **Money-math correctness** is the product's core risk. It is covered by integer-only arithmetic, the golden cases in `api-contract.md` and AC10.
2. **The first publication** (a new public repository and Pages site) waits for the owner's explicit yes (PRD Constraints).
3. **The origin is shared.** localStorage on `xzhou110.github.io` is shared by every Pages app of the owner, so the theme key is namespaced.

## Spike result

**The assumptions tested.** Nothing external can invalidate a client-only calculator's architecture. The closest thing is the deploy target, and AC11's live check depends on it in two ways:

1. `/tip-calculator/` on the shared `xzhou110.github.io` origin is unclaimed (no folder in the portfolio user-site repository serves it).
2. The check can see past the CDN cache.

The first probe also seeded a cached 404, which made the second question answerable.

| # | Date (UTC) | Command (free, unauthenticated, read-only HEAD, Git Bash) | Response (relevant headers) |
|---|---|---|---|
| 1 | 2026-10-16 06:03Z | `curl -sI "https://xzhou110.github.io/tip-calculator/?t=$(date +%s)"` | `404 Not Found` · `Server: GitHub.com` · `Content-Length: 950` · `x-proxy-cache: MISS` · `X-Cache: MISS` · `Via: 1.1 varnish` · no `Cache-Control` |
| 2 | 2026-10-16 about 06:16Z (the plan check's re-probe) | the same `curl -sI`, with three different `?t=` values and the bare path | `404` · `X-Cache: HIT` · `Age: 787`, then `797`, `799`, `801` for every variant |
| 3 | 2026-10-16 06:19:31Z (this revision) | `curl -sI "https://xzhou110.github.io/tip-calculator/?t=$(date +%s%N)"` (a never-used nanosecond value) | `404 Not Found` · `Content-Length: 950` · `ETag: "6ad147f0-3b6"` · `x-proxy-cache: MISS` · `X-Cache: HIT` · `X-Cache-Hits: 0` · `Age: 990` · `X-Served-By: cache-pao-kpao1770025-PAO` · `Via: 1.1 varnish` |

**Reading.**

- **The path is unclaimed.** It returns a real 404, not a 200 from a user-site folder, so the project site will be the only thing serving it.
- **The CDN ignores the query string.** Probe 3 used a value no one had ever requested, and it still got `X-Cache: HIT` with `Age: 990`, an object cached at about 06:03Z, the moment of probe 1. GitHub Pages' Fastly layer therefore leaves the query string out of the cache key. The first revision of this plan read probe 1's `MISS` as proof that `?t=` busts the cache; that reading was wrong, because the MISS was only the first request for the path.
- **A 404 is cached for at least 990 seconds.** Its real lifetime is unknown, because the 404 carries no `Cache-Control` header.

**Consequences for the plan.**

- AC11's live check does not rely on `?t=`. It matches content: the commit SHA stamped into `index.html` at build time (§ Release Verification, `vite.config.ts`).
- The check polls the bare URL after the deploy run succeeds, treats any 404 (cached or not) and any older SHA as not yet live, and has a 30-minute timeout sized from the 990-second observation.
- `?t=` stays harmless: the app ignores and preserves the query string, so a buster in a link cannot change the split.

**Not spiked, on purpose.**

- **npm package versions:** the orchestrator's install is the probe, with the sibling set as the named fallback.
- **The Pages and Actions setup:** proven by four sibling repositories with the same action majors.
- **How long a stale page lasts after a deploy:** this cannot be measured without publishing, which waits for the owner's yes. The poll's timeout covers it, and the outcome is reported, never assumed.

**Spike needed:** none. The commit stamp is proved by construction: a cached copy cannot contain a SHA that did not exist when it was cached. Its one runtime unknown, the cache lifetime, is handled by the poll and the timeout above.

## Key decisions

| # | Decision | Alternative rejected, and why |
|---|---|---|
| 1 | **The Vite app lives in `app/`**; the repository root holds the build records and the workflow. | **Repository root:** one fewer `cd`, but it mixes the /build records with app files, diverges from car-shopping and apartment-shopping, and needs the template workflow's three paths edited. |
| 2 | **Money as integer cents** end to end; dollars appear only in formatted strings. | **Decimal numbers** (`toFixed`, `Math.round(x * 100)`): binary floating point turns 1.005 × 100 into 100.49999, so half-cent rounding breaks. **A decimal library** (big.js, decimal.js): a dependency for three operations. |
| 3 | **Tip percent as integer basis points**, so the custom field accepts 0 to 100 at hundredths precision (17.5, 17.25). More than two decimals shows "Use up to two decimals, like 17.5". | **Any number of decimals** via BigInt or a rational type: exactness for a precision no diner types, at the cost of BigInt plumbing in parsing, stepping and formatting. |
| 4 | **Rounding:** tip half up to the cent; Total = Bill + displayed tip; share rounded **up** to the cent; the overage (0 to people − 1 cents) is always stated. This is the design doc's recommendation, made exact in `computeSplit`. | **Nearest-cent shares:** the table can be up to people ÷ 2 cents short and someone must cover it, which is the argument the PRD wants to end. **Banker's rounding for the tip:** unfamiliar to diners and differs from hand arithmetic. |
| 5 | **Theme key `tip-calculator.theme.v1`**, versioned. This contract supersedes the `appTheme` key named in design-doc.md Flow 6 and Region 1. | **The template's `appTheme`:** localStorage is per origin and every owner app on Pages shares `https://xzhou110.github.io`, so a generic key would let apps overwrite each other's theme. The siblings already namespace theirs (`garage.theme`, `apt.theme`, `carTcoTheme`, `wkb-theme`). |
| 6 | **URL state in the hash** (`#bill=86.40&tip=20&people=4`), written with `history.replaceState` after a 150 ms quiet period, with per-field fallback to defaults on load and re-hydration on `hashchange`. | **Query string:** sends the bill amount to GitHub's servers and CDN logs on every load, and the CDN ignores the query anyway (§ Spike result), so it buys nothing. **`pushState` per keystroke:** floods history, so Back would step through digits. **Unthrottled writes:** holding ArrowUp exceeds Safari's 100-per-30-seconds `replaceState` limit (a thrown `SecurityError`) and Chrome's navigation-throttle console warning. **Compressed state** (lz-string): unreadable links for three numbers. |
| 7 | **The inputs live only in the URL**; no localStorage autosave. | **The skill's default autosave:** the PRD excludes saved history, the design's first open is deliberately empty, and a reload already keeps the hash. |
| 8 | **Copy strings and status-line selection in pure `lib/messages.ts`**, asserted by tests and copied verbatim from design-doc.md UX Copy. | **Strings inline in components:** the selection logic ("which fields to name", the even, rounded-up and one-person sentences) would live in the UI and need DOM tests, against the design's "the UI uses no maths of its own". |
| 9 | **React 19, Vite 7, Vitest 3.2**, with the sibling set as the fallback. | **The sibling set (React 18.3, Vite 5.4, Vitest 2.1):** proven here, but the Vite 5 line is out of active maintenance and its esbuild carries a dev-server advisory that `npm audit` flags on a brand-new public repository. The config shape is identical, so the fallback costs nothing. |
| 10 | **One lane.** | **A second pure-logic lane:** not genuinely independent (the UI consumes it everywhere), and too small to pay for an extra agent run and an integration seam. |
| 11 | **The app is served at the PRD's base path `/tip-calculator/`, with Vite's `base` option set to `'./'`** (relative asset URLs, which resolve under `/tip-calculator/` on Pages). The live check proves it: the referenced `assets/index-<hash>.js` returns 200 under `/tip-calculator/assets/`. | **`base: '/tip-calculator/'`:** it also works on Pages, but it hard-codes the repository name into every asset URL, so a rename or a fork produces the classic blank page that `ship-web-app`'s template warns about. It also departs from the template and car-shopping, both of which use `'./'`. An env-var variant of it is mangled by Git Bash path conversion (`rules/machine-windows.md`). |
| 12 | **Unit tests in the node environment only.** | **Component tests with jsdom and Testing Library:** AC10 asks for unit tests of the pure module, and a real browser (QA) is the only proof of focus, theme and layout behavior anyway. |
| 13 | **Exactness bounds:** bill under $1 billion, people at most 15 digits, each with a plain message ("Enter a bill under $1 billion", "Enter a smaller number of people"). | **No bound:** above `2^53` the math silently returns wrong cents. **BigInt everywhere:** complexity for values no table reaches. These are named technical limits with their reason, not product caps. |
| 14 | **The no-flash script falls back to the system setting** when storage is blocked. | **The template's hard `'light'` fallback:** a user in a dark room with storage blocked would get a flash of light, against AC7. |
| 15 | **CI runs `npm test` before `npm run build`.** | **Build only, like the siblings:** the build already typechecks, but only the tests catch wrong cents. |
| 16 | **AC11's live check matches a build-commit stamp** (`<meta name="build-commit">`, filled from `GITHUB_SHA` by a four-line Vite plugin). It polls the bare URL after the deploy run succeeds, with a 30-minute timeout. | **`?t=<now>`, as `web-ship-check` suggests:** the spike proved GitHub Pages' CDN ignores the query string, so it proves nothing. **Comparing the live `assets/index-<hash>.js` with a local build's:** needs a local build of the exact pushed tree, and a Windows checkout (line endings, local paths) can change the hash, so a false "stale" is possible. **A `version.json` file:** a second request and a second file to keep in sync, for the same proof. |
| 17 | **The bundle size is measured by a zero-dependency script** (`npm run size`: raw and gzip per file and the totals) and reported in the CI job summary, QA's report and the release hand-back, with the live JS transfer size beside it. | **`size-limit` or `rollup-plugin-visualizer`:** a dependency for one number, and `size-limit` is built around a budget the PRD explicitly does not impose. **Reading Vite's build log by eye:** gives no total, and nothing is written down unless someone copies it. |
| 18 | **The rounded-up state is named `roundedUp`** in `SplitKind` and `StatusKind`. | **`uneven`** (design-doc.md's prose word): every person still pays the same share, and PRD Out excludes "uneven splits" (unequal shares), so a frozen `uneven` name would invite the excluded feature. Users never see either name; the copy says "Rounded up to the cent". |

None of these needs the owner's sign-off: the PRD delegates the rounding rule and the folder choice to the crew, and the rest are reversible implementation choices. Two items are for the owner's awareness:

- **Decision 4 at acceptance:** the one user-visible rule (shares rounded up, the overage stated).
- **The wording of PRD Constraints, line 43** ("the base path is `/tip-calculator/`"): the plan meets it as the served path (Decision 11). If the owner reads it as the literal Vite `base` value, it is a one-line change to `vite.config.ts` plus the scaffold-acceptance line; the live check works unchanged. **Recommended:** the orchestrator amends the PRD line to "served at `/tip-calculator/`".

## Out of scope

- Everything the PRD lists as out: itemized or uneven splits, tax handling, currencies or locales other than a US-dollar format, saved history, accounts, an offline service worker, analytics, a backend, a native app.
- A PWA manifest and install prompt (there is no offline mode, and nothing asks for install).
- A native share sheet (`navigator.share`) and a third "System" theme segment (both open questions in the design doc, deliberately left out).
- Component, end-to-end or visual-regression test suites (QA proves the UI in a real browser; AC10 covers the pure module).
- A router, a state library, a CSS framework or any runtime dependency beyond React.
- A custom domain, a CDN other than GitHub Pages, and any server-side rendering or SEO work.
- Localization, and any number format other than `en-US` USD.
