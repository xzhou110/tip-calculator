# Agent Brief: tech-lead · tech-plan and api-contract

You are the Tech Lead of a /build run. A cold agent receives nothing else from the conversation: every section below stands on its own. Read every section before your first edit. Your role file is `D:/Meaningful/AI/claude-marketplace/plugins/multi-agent-orchestrator/agents/tech-lead.md`; this brief adds the project specifics.

## Goal
Decide the minimum architecture for a client-only, single-page tip calculator (Vite + React + TypeScript, deployed free on GitHub Pages at `/tip-calculator/`) and write the two documents the build runs on: `D:/Meaningful/AI/tip-calculator/tech-plan.md` and `D:/Meaningful/AI/tip-calculator/api-contract.md`. There is no backend and no data layer. The contract on a client-only product is the frozen TypeScript types, the storage contract (the theme key, versioned, with a migration note), the URL-state contract (the three inputs in the URL) and the pure-logic module signatures. The orchestrator scaffolds exactly what your "Shared foundation to scaffold" section lists, commits it, and then one Frontend Engineer builds in the lane you define; bias toward one lane, and name a second (pure-logic) lane only if its work is genuinely independent of the UI lane and worth a second agent.

## Acceptance Criteria You Own
You own the architecture that makes these criteria achievable (copied verbatim from PRD.md); the engineer implements them against your contract.
2. Results update as you type with no submit button; tip = bill × percent ÷ 100, total = bill + tip, share = total ÷ people, each shown to the cent.
5. When the rounded shares multiplied by the people differ from the total, the page says by how much; the difference is never silent.
7. Theme follows the system setting by default, a visible toggle overrides it, the choice persists across reload, and the page never flashes the wrong theme on load.
9. The three inputs live in the URL so a link reproduces the split; a link with bad values falls back to defaults without an error.
10. The pure calculation module has unit tests (happy path, rounding, invalid input); typecheck, tests and production build all exit 0.
11. Deployed free at https://xzhou110.github.io/tip-calculator/ from the public repository xzhou110/tip-calculator by GitHub Actions on push to main; the live page serves the app's own title marker, cache-busted; no backend, no secrets, no analytics.

Decisions the PRD leaves to you (record each under Key decisions with the rejected alternative): the exact rounding rule behind criterion 5 (the design doc recommends one; you make it precise in the module signature and types); whether the Vite app lives in `app/` like the sibling apps or at the repository root; money as integer cents or decimal numbers in the engine.

## Required Sections
An automated check reads the files for these exact headings with real content (no placeholders). `tech-plan.md`: **Stack and rationale** · **System design** (a text diagram) · **Data model** · **File/module layout and lanes** (one lane per engineer as path globs, plus the shared files no lane may touch) · **Shared foundation to scaffold** (every dependency with its purpose and version range, every config file, the shared type file names with stub contents, the npm scripts `typecheck`, `test`, `build` and `dev` the build script will call) · **High-risk surfaces** (auth, permissions, payments, privacy, data loss; expected answer here: none, say so and why) · **Spike result** (command, response, date; or a "Spike needed" entry with the command, the signal and the cost) · **Key decisions** (each with the alternative rejected) · **Out of scope**. `api-contract.md`: the frozen types, the storage contract with versioned keys and a migration note, the URL-state contract, the pure-logic module signatures, the error shapes the UI renders; end it with a "last frozen" line left as "not yet frozen" (the orchestrator freezes it). The check also lists any contradiction with PRD.md's scope or criteria, so stay inside the PRD.

## Lane
- **Owned paths (edit freely):** `D:/Meaningful/AI/tip-calculator/tech-plan.md`, `D:/Meaningful/AI/tip-calculator/api-contract.md`
- **Read-only paths:** `D:/Meaningful/AI/tip-calculator/PRD.md`, `design-doc.md`, `PROJECT.md`, `DECISIONS.md`; the skill files under Inputs; the sibling app `D:/Meaningful/AI/car-shopping/app/` (its `vite.config.ts`, `tsconfig*.json`, `package.json`, `src/types.ts`, `.github/workflows/deploy.yml` are the proven pattern to adapt before proposing anything new)
- **Forbidden (never edit):** everything else under `D:/Meaningful/AI/tip-calculator/`, anything under `D:/Meaningful/AI/agent-skills/` or `D:/Meaningful/AI/car-shopping/`
- **Never scaffold, never run a dependency install** (`npm init`, `npm install`, `npm create`): the orchestrator scaffolds from your Shared foundation section.

## Commands and Shell
- Shell: the Bash tool (Git Bash) or Windows PowerShell 5.1 (no `&&`; use `;`). Read `D:/Meaningful/AI/agent-skills/rules/machine-windows.md` first: BOMs, MSYS path conversion of leading-slash values such as a Vite base path, `py` not `python`, never patch files through shell one-liners.
- Allowed: free, unauthenticated, read-only probes only (one `curl -sI` of a public URL). Not allowed: `npm`, `npx`, installs, writing outside your owned paths.

## Stack Facts
Node 24.16 and npm 11 on this machine. The owner's default stack (`ship-web-app` § Default Stack): Vite + React + TypeScript, a pure unit-tested logic engine (Vitest), plain CSS custom properties with `[data-theme="dark"]`, GitHub Pages + GitHub Actions. The Pages base path is `/tip-calculator/` (the repository will be `xzhou110/tip-calculator`, public; both names are confirmed free). Theming uses the no-flash init from `D:/Meaningful/AI/agent-skills/skills/ship-web-app/templates/theme-init.html`. Starter templates exist at `D:/Meaningful/AI/agent-skills/skills/ship-web-app/templates/` (`vite.config.ts`, `tsconfig.json`, `github-pages-deploy.yml`, `styles-baseline.css`). The build-verify script will run exactly `npm run typecheck`, `npm test`, `npm run build` in the directory you name, so define those scripts. No secrets exist in this product; nothing leaves the browser.

## Inputs (read first, in this order)
1. `D:/Meaningful/AI/tip-calculator/PRD.md` (the criteria above come from it)
2. `D:/Meaningful/AI/tip-calculator/design-doc.md` (tokens, flows, copy, the recommended defaults and rounding rule)
3. `D:/Meaningful/AI/agent-skills/skills/ship-web-app/SKILL.md` (§ Default Stack and its reasons; read before designing and deviate only with a stated reason) and the templates folder named above
4. `D:/Meaningful/AI/agent-skills/rules/machine-windows.md`
5. `D:/Meaningful/AI/car-shopping/app/` (read-only, the proven sibling: adapt its Vite, TypeScript and deploy configuration)
6. `D:/Meaningful/AI/tip-calculator/PROJECT.md` and `DECISIONS.md` (D-001, D-002)

## When Blocked
Write `D:/Meaningful/AI/tip-calculator/briefs/BLOCKERS-tech-lead.md` with what you need and why, then continue with everything that is not blocked. Never edit a forbidden path to unblock yourself, never install, never guess.

## Git
Do not commit, stage, stash or switch branches. The orchestrator commits.

## Hand-Back (your final message, 3 to 5 lines in this shape)
STATUS: success | partial | failed. Then: the stack and the app folder; whether a second lane exists and why; the spike result; confirmation the contract is complete enough to freeze; decisions needing human sign-off; one gotcha line (or "none").
