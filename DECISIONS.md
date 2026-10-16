# Decision Log

ADR-style record of every non-obvious decision: scope cuts, stack choices, trade-offs. This is the "why the product is the way it is" doc; re-read it months later. One entry per decision, numbered. The placement step (SKILL.md Step 3 phase 8b) appends `placed: PROJECT.md §3 | skill <name> (Lessons) | proposed in the final report` to entries it routed; every entry decided by the human is reviewed there; absent means history only.

---

<!-- TEMPLATE — copy this block per decision -->
## D-000 <short title>
- **decision:** <what was decided>
- **context:** <what prompted it>
- **alternatives considered:** <options not taken>
- **rationale:** <why this one>
- **decided by:** <orchestrator | human | role name>
- **reversible:** yes | no
- **date:** YYYY-MM-DD

---

## D-001 Build tier, verification and name
- **decision:** tier FULL BUILD · verification qa-sweep row "Major feature, shared architecture change, app completion, or release milestone" (full relevant automated suite, production build, main user journeys, independent QA, clean-checkout verification; the full sweep at completion) · lifted by none (a new product is the FULL row itself) · stop point: typecheck, unit tests and production build exit 0; the PRD journey in a real browser, console clean, light and dark, at phone width; QA test-report with every criterion tested; the reviewer's verdict after the refuters; the completion sweep adapted to a static SPA; the clean-clone CI-parity build · name: folder, repository and Pages path `tip-calculator`, app title "Tip Calculator", brand XuSeak
- **context:** the /build request "A single-page tip calculator for a dinner group: enter the bill, the tip percent and the number of people, see each person's share; light and dark; deploy it free." It is the Should Trigger request of claude-marketplace/test/evals/build.md: this run is the acceptance test of plugin v0.3.0's workflow scripts.
- **four-question test:** genuinely complex: on the product alone no (one page of arithmetic; alone it would drop to MULTI-DOMAIN, designer plus frontend), but a new product is the FULL row by definition and the run's purpose is the full pipeline, so the FULL row stands and the cost is flagged in the brief · value justifies cost: yes, as the acceptance test · viable for agents: yes · error recoverable: yes (nothing is live until the deploy gate)
- **name alternatives considered:** `dinner-bill-split`, `tip-split` (name the output rather than the tool); `tip-calculator` is the owner's own words and explains itself to a first-time reader years later
- **crew and models:** researcher → skipped, proposed in the brief (demand is not in question for a tip calculator and the ask is fully specified; a public XuSeak product would normally keep it) · designer → opus, run (public product; the UI adapts no named app) · tech-lead → opus, run · frontend-engineer → opus, run (one lane; a second lane only if the Tech Lead names the pure-logic module as its own lane) · backend-engineer → skipped (no server: a client-only app has no secrets) · data-engineer → skipped unless the Tech Lead names a lane · qa-tester → sonnet, run (FULL row) · reviewer → opus, run (FULL row) · integration auditor and refuters → the script's default, which inherits the session model (brief proposal D) · release-engineer → haiku, run (web target; no everyday-launch deliverable)
- **Est. cost:** measured headroom at start: 5-hour 88% left, weekly all models 69% left, weekly Fable 40% left; no comparable v0.3.0 run exists; Est. (guess) 10 to 14 agent runs for the pipeline (2 opus planners, 2 haiku artifact checks, 1 to 2 opus engineers, 1 auditor, 1 sonnet QA, 1 opus reviewer, 0 to 4 refuters, 1 haiku release) plus the completion sweep adapted to a static SPA (about 6 to 10 more); the orchestrator session itself spends Fable
- **acceptance criteria (small runs):** n/a, a FULL run: PRD.md
- **decided by:** orchestrator
- **reversible:** yes
- **date:** 2026-10-15

## D-002 The owner's go on the Build Brief and its four proposals
- **decision:** go received; A: the Researcher is skipped · B: the shareable link (the three inputs in the URL) is in scope as PRD criterion 9 · C: the completion sweep is qa-sweep's full sweep adapted to a static SPA (production bundle built and served statically; the checks that apply run; every skipped check listed by name as not applicable, never as passed) · D: build-verify.workflow.js is patched before its first run so the integration auditor and the refuters set `model: 'sonnet'` (the refuters at default effort, not low), with a guard in claude-marketplace/test/plugin.test.mjs that every `agent(` call without an agentType sets a model; shipped as plugin v0.3.1
- **context:** the Build Brief's section 10; the two agents without a model inherited the session model (Fable, the policy's ceiling); a refuter that wrongly drops a real high-severity finding is the costly mistake, so its effort is not lowered
- **alternatives considered:** run v0.3.0 byte-for-byte and patch after grading (faithful to the acceptance test, spends Fable on mechanical work); keep the refuters at effort low (cheaper, riskier)
- **rationale:** the defect was found by reading before the run; fixing a found defect before spending quota on it is the cost-conscious reading of the playbook, and the fix is itself graded by the run
- **decided by:** human (the owner's words, forwarded by the session that started this one: "Go with the defaults A to D, with the refinement to D: the auditor on sonnet, the refuters on sonnet at default effort, and the test guard added as 0.3.1."); the deploy gate still needs its own yes
- **reversible:** yes
- **date:** 2026-10-15

## D-003 Rounding rule, defaults and the app folder
- **decision:** Tip Amount rounds half up to the cent; Total = Bill + the displayed tip; each share is rounded UP to the cent and the overage (0 to people − 1 cents) is always stated ("Rounded up to the cent: 3 × $39.34 = $118.02, 2¢ over the Total"); defaults 20% and 2 people; the Vite app lives in `app/` like the sibling apps
- **context:** PRD § Decisions Left to the Crew; the Designer recommended the rule and the Tech Lead made it exact in `computeSplit` (tech-plan Key decisions 1 and 4)
- **alternatives considered:** nearest-cent shares (the table can come up short and someone must cover it, the argument the product exists to end); the app at the repository root (mixes build records with app files, diverges from the siblings)
- **rationale:** the table is never short, every person pays the same, and the difference is visible; "uneven split" is not used because PRD Out reserves it for unequal shares (the frozen name is `roundedUp`)
- **decided by:** designer and tech-lead within the PRD's delegation; the owner sees the one user-visible rule at acceptance
- **reversible:** yes
- **date:** 2026-10-15

## D-004 Base path wording and the live check without query-string cache-busting
- **decision:** PRD Constraints now read "served at `/tip-calculator/` with Vite `base: './'`"; AC11's live check asserts the title marker plus a `<meta name="build-commit">` equal to the pushed SHA (stamped by a four-line Vite plugin from `GITHUB_SHA`), polling the bare URL after the deploy run succeeds, 30-minute timeout, never requesting the URL before the run succeeds
- **context:** the Tech Lead's spike: a never-used `?t=` value on the unclaimed path returned `X-Cache: HIT`, `Age: 990`; the orchestrator confirmed on the live sibling car-shopping (a fresh `?probe=` value: `X-Cache: HIT`, `Age: 38`, `Cache-Control: max-age=600`), so GitHub Pages' CDN leaves the query string out of its cache key and `?t=<now>` busts nothing
- **alternatives considered:** keep the literal "cache-busted" wording and a `?t=` request (proves nothing); `base: '/tip-calculator/'` (works, but hard-codes the repository name and breaks `vite preview` and a served `dist/`)
- **rationale:** a cached copy cannot contain a SHA that did not exist when it was cached, so the stamp is the stronger proof of the intent behind "cache-busted" (assert the app's own fresh content, never a bare 200)
- **decided by:** orchestrator, on the Tech Lead's recommendation
- **learning to place:** web-ship-check's "cache-bust with `?t=<now>`" advice is wrong for GitHub Pages' CDN; a dated Lessons line in that skill (phase 8b)
- **reversible:** yes
- **date:** 2026-10-15

## D-005 Exactness bounds are technical limits, not caps
- **decision:** Bill under $1,000,000,000 (`MAX_BILL_CENTS` 99,999,999,999) and People at most 15 digits (`MAX_PEOPLE` 999,999,999,999,999), each refused with a plain message; AC4 amended to say so
- **context:** integer-cent arithmetic stays exact only inside `Number.MAX_SAFE_INTEGER`; the contract test proves `MAX_BILL_CENTS × MAX_TIP_BP + 5000` is a safe integer
- **alternatives considered:** no bound (silently wrong cents above 2^53); BigInt everywhere (plumbing for values no dinner table reaches)
- **rationale:** the core rule "No invented caps" is about the owner's data and runs; a named precision limit with its reason and a message is not an invented cap
- **decided by:** orchestrator, on the Tech Lead's Key decision 13
- **reversible:** yes
- **date:** 2026-10-15

## D-006 The PM resolved the plan checks' residual findings at the gate instead of a third planner run
- **decision:** plan.workflow.js returned `contractReadyToFreeze: false` after one retry per role; every residual item was a PRD wording conflict (D-004, D-005) or an internal design-doc inconsistency (a lone "-", the 48px claim, the tab-order sentence, the "uneven" wording, the theme key), so the orchestrator amended PRD.md and design-doc.md (revision 3) itself and froze the contract
- **context:** both artifacts had every required section with real content; the checker's `ok` conflates "contradicts the PRD" with "inconsistent with itself" and "a judgement call", and one check put a non-section note in `missingSections`
- **alternatives considered:** a second retry of each role (an opus run each, about 20 minutes, for wording the PM can settle in minutes)
- **rationale:** the playbook routes back only what sits inside a lane's own logic; wording and consistency are the PM's to fix at the gate, logged here
- **learning to place:** the artifact checker should report PRD contradictions (blocking) apart from internal notes (non-blocking) and keep `missingSections` to the listed headings; a script fix in claude-marketplace (graded with the eval)
- **decided by:** orchestrator
- **reversible:** yes
- **date:** 2026-10-15
