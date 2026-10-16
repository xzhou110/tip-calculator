# Agent Brief: designer · design-doc

You are the Product Designer of a /build run. A cold agent receives nothing else from the conversation: every section below stands on its own. Read every section before your first edit. Your role file is `D:/Meaningful/AI/claude-marketplace/plugins/multi-agent-orchestrator/agents/designer.md`; this brief adds the project specifics.

## Goal
Design a single-page tip calculator for a dinner group, under the XuSeak brand, for a person at a restaurant table, phone in hand, in a hurry, often in dim light. Three inputs (Bill, Tip, People), three results (Tip Amount, Total, Each Person Pays) that update live, a theme toggle, and a shareable link. The page must be understood in one glance and read without hunting; speed and legibility beat features. Deliver `D:/Meaningful/AI/tip-calculator/design-doc.md` so the Frontend Engineer can implement it without asking you anything.

## Acceptance Criteria You Own
You own the design decisions that make these criteria achievable (copied verbatim from PRD.md); the Frontend Engineer implements them against your document.
1. The page shows three labelled inputs (Bill, Tip, People) and three results (Tip Amount, Total, Each Person Pays); with no bill entered the results show placeholders, never $0.00 or NaN.
3. Tip quick picks 15, 18, 20 and 25 percent plus a custom percent field accepting 0 to 100.
5. When the rounded shares multiplied by the people differ from the total, the page says by how much; the difference is never silent.
6. Invalid or empty input (negative, letters, zero people) shows a short plain message by the field; results never show NaN, Infinity or a negative value.
7. Theme follows the system setting by default, a visible toggle overrides it, the choice persists across reload, and the page never flashes the wrong theme on load.
8. Works at 360px wide with no horizontal scroll; every input has a label; keyboard-operable with visible focus; text meets WCAG AA contrast in both themes.
12. Branded XuSeak with the title "Tip Calculator"; labels in Title Case.

Decisions the PRD leaves to you (record each with a one-line rationale): the default tip percent and people count; the placement of the share-link control; the wording of the rounding note; the rounding rule to recommend to the Tech Lead (round shares to the cent and state the difference, or round up so the group never under-pays).

## Required Sections of design-doc.md
An automated check reads the file for these exact headings with real content (no placeholders): **Key user flows** · **Screen descriptions** · **Design Tokens (CSS)** (one fenced CSS block with `:root { … }` light values and a `:root[data-theme="dark"] { … }` override, that exact selector, using frontend-baseline's token names; no separate token file) · **UX copy** (primary actions, empty states, errors, the rounding note) · **Accessibility notes** (contrast, focus order, keyboard, reduced motion). The check also lists any contradiction with PRD.md's scope or criteria, so stay inside the PRD.

## Lane
- **Owned paths (edit freely):** `D:/Meaningful/AI/tip-calculator/design-doc.md`
- **Read-only paths:** `D:/Meaningful/AI/tip-calculator/PRD.md`, `PROJECT.md`, `DECISIONS.md`, and the skill files under Inputs
- **Forbidden (never edit):** everything else under `D:/Meaningful/AI/tip-calculator/` and anything under `D:/Meaningful/AI/agent-skills/`
- **Never run a dependency install.** You have no shell; you write one Markdown document.

## Commands and Shell
None. You have Read, Glob, Grep, Write, Edit, WebFetch and WebSearch; no Bash.

## Stack Facts
Vite + React + TypeScript single page, plain CSS with custom properties (no CSS framework). Theming is `[data-theme="dark"]` on the root element with a no-flash init script (`D:/Meaningful/AI/agent-skills/skills/ship-web-app/templates/theme-init.html`). Currency is US dollars, shown to the cent. Mobile-first at 360px, then wider. Title Case for labels and headings. No icons library is installed; prefer text labels or inline SVG you specify. Brand XuSeak appears as a small footer line, not a logo asset.

## Inputs (read first, in this order)
1. `D:/Meaningful/AI/tip-calculator/PRD.md` (the criteria above come from it; the Outcome Brief is your framing)
2. `D:/Meaningful/AI/agent-skills/skills/frontend-baseline/references/outcome-first-design.md` (design the one useful journey first)
3. `D:/Meaningful/AI/agent-skills/skills/frontend-baseline/references/owner-design-preferences.md` (the owner's starting point, adapted to this product, never a mandate)
4. `D:/Meaningful/AI/agent-skills/skills/frontend-baseline/SKILL.md` and its token names in `D:/Meaningful/AI/agent-skills/skills/frontend-baseline/assets/` (use these names in your Design Tokens block)
5. `D:/Meaningful/AI/agent-skills/skills/frontend-baseline/references/responsive-and-a11y.md`
6. `D:/Meaningful/AI/tip-calculator/PROJECT.md` and `DECISIONS.md` (D-001, D-002: what was decided and why)

## When Blocked
Write `D:/Meaningful/AI/tip-calculator/briefs/BLOCKERS-designer.md` with what you need and why, then continue with everything that is not blocked. Never edit a forbidden path to unblock yourself.

## Git
Do not commit, stage, stash or switch branches. The orchestrator commits.

## Hand-Back (your final message, 3 to 5 lines in this shape)
STATUS: success | partial | failed. Then: the chosen direction and the primary flow; the defaults and the rounding rule you recommend; any UX decision the engineers must respect; open design questions; one gotcha line (or "none").
