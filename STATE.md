# State

Live snapshot of where the build is. The orchestrator keeps this current: overwrite, never append. Small runs prune the Done list to the artifacts their tier produces.

---

- **Product:** Tip Calculator, a single-page tip and bill splitter for a dinner group (XuSeak), deployed free on GitHub Pages
- **Phase:** Completion gate (the adapted full sweep and the release engineer's clean-clone build, in parallel)
- **Last updated:** 2026-10-16T05:38Z

## Done
- [x] project home registered (PROJECT.md · AGENTS.md row · x-command-center projectDirectories, committed there)
- [x] research-brief.md: skipped (D-002 A)
- [x] PRD.md (12 criteria; the owner's go in D-002)
- [x] design-doc.md (revision 3)
- [x] tech-plan.md + api-contract.md  (contract frozen? yes, 2026-10-16T06:36Z)
- [x] scaffold committed  (SHA: 51c789d9523e5f4f043b1e8510f9ce59063543a1)
- [x] frontend lane (273 tests; hand-back in RUN_LOG)
- [x] integration checkpoint passed (commit 2d661a0; browser pass in RUN_LOG)
- [x] test-report.md  (FULL row; 10 of 12 pass, 4 fixed in the fix round, 7 and 8 verified by the orchestrator)
- [x] review-findings.md  (FULL row; verdict: ship-with-fixes; 14 findings, 9 fixed in the fix round, 6 carried forward; no must-fix)
- [ ] completion sweep adapted to a static SPA + clean-clone CI-parity build  (FULL row; D-002 C)
- [ ] PM acceptance
- [ ] everyday launch: n/a (web app)
- [ ] deployed  (approval: asked at the deploy gate; first publication, new public repo, new Pages site)

## In progress
- qa/sweep.workflow.js (3 testers, refuters, critic) and the release-engineer (haiku, Phase A) in parallel; release candidate e9b9e6d

## Blocked / open questions
- none now; the deploy gate needs the owner's own yes later

## Open findings (carried forward)
- R-6 · low · stepping Tip or People from an invalid value starts from 0 or 1 (the contract's rule); clamping to the bound would be kinder; revisit with real use
- R-7 · low · at absurd bounds the rounded-up status line runs to a third line at 360px (the card grows); accepted as a bounds-only edge
- R-9 · low · each message slot is aria-live="polite" beside the role="status" region, so the Tip helper may be re-announced; needs an NVDA or VoiceOver check before changing
- R-11 · low · select-on-focus by tap on iOS Safari is unproven on this machine; check on an iPhone, and if it fails defer the selection with requestAnimationFrame
- R-12 · low · a field change within 700 ms of Copy Link can replace "Link copied." in the single status region; accepted edge
- R-14 · low · the URL-write runtime rules (replaceState only, the no-op skip, the swallowed throw) have no automated test; export writeUrl with fakes and test it in node

## Pending re-runs
- none

## Candidate learnings (unplaced)
- fixed in the plugin as v0.3.1 (report it, nothing left to place): build-verify's auditor and refuters inherited the session model; a workflow agent() without an agentType must set a model, and npm test now guards it
- the owner's go took about five hours to arrive, so the 5-hour quota window reset between Step 0 and fan-out; the measured delta must be read from the weekly windows (candidate for the playbook's Cost paragraph)

## Resume
- **quota readout at Step 0:** 5-hour 12% · weekly all models 31% · weekly Fable 60% · context 118k (2026-10-16T00:33Z)
- **quota readout before fan-out:** 5-hour 2% (window reset) · weekly all models 32% · weekly Fable 62% · context 226k (2026-10-16T05:38Z)
- **scaffold SHA:** 51c789d9523e5f4f043b1e8510f9ce59063543a1 (the lane-diff baseline and the rollback point)
- **workflow runs:** plan.workflow.js · wf_75859edd-2e0 · briefs/plan.args.json · completed 48.1 min, both artifacts written, checks ok:false on wording, PM resolved (D-006)
- **workflow runs:** build-verify.workflow.js · wf_4bde4caf-14b · briefs/build-verify.args.json · running (started 2026-10-16T06:37Z)
- **workflow runs:** build-verify.workflow.js (fix round) · wf_0cc3835a-eb8 · briefs/build-verify-fix.args.json · completed 6.3 min, all nine fixes landed, audit passes
- **workflow runs:** qa/sweep.workflow.js · wf_58536bc1-dfe · qa/sweep.args.json · running

## Next
- when plan.workflow.js returns: read tech-plan.md (Shared foundation to scaffold, lanes, High-risk surfaces, Spike result) and api-contract.md; freeze the contract; scaffold; install; commit the scaffold; record its SHA; write briefs/frontend-engineer.md (and a second lane brief only if named), briefs/qa-tester.md, briefs/reviewer.md; run build-verify.workflow.js
