# State

Live snapshot of where the build is. The orchestrator keeps this current: overwrite, never append. Small runs prune the Done list to the artifacts their tier produces.

---

- **Product:** Tip Calculator, a single-page tip and bill splitter for a dinner group (XuSeak), deployed free on GitHub Pages
- **Phase:** Design (plan.workflow.js running: designer, then tech lead)
- **Last updated:** 2026-10-16T05:38Z

## Done
- [x] project home registered (PROJECT.md · AGENTS.md row · x-command-center projectDirectories, committed there)
- [x] research-brief.md: skipped (D-002 A)
- [x] PRD.md (12 criteria; the owner's go in D-002)
- [ ] design-doc.md (running)
- [ ] tech-plan.md + api-contract.md  (contract frozen? no)
- [ ] scaffold committed  (SHA: )
- [ ] frontend lane
- [ ] integration checkpoint passed
- [ ] test-report.md  (FULL row)
- [ ] review-findings.md  (FULL row; verdict: pending)
- [ ] completion sweep adapted to a static SPA + clean-clone CI-parity build  (FULL row; D-002 C)
- [ ] PM acceptance
- [ ] everyday launch: n/a (web app)
- [ ] deployed  (approval: asked at the deploy gate; first publication, new public repo, new Pages site)

## In progress
- plan.workflow.js: designer (opus) → design-doc.md, then tech-lead (opus) → tech-plan.md and api-contract.md

## Blocked / open questions
- none now; the deploy gate needs the owner's own yes later

## Open findings (carried forward)
- none

## Pending re-runs
- none

## Candidate learnings (unplaced)
- fixed in the plugin as v0.3.1 (report it, nothing left to place): build-verify's auditor and refuters inherited the session model; a workflow agent() without an agentType must set a model, and npm test now guards it
- the owner's go took about five hours to arrive, so the 5-hour quota window reset between Step 0 and fan-out; the measured delta must be read from the weekly windows (candidate for the playbook's Cost paragraph)

## Resume
- **quota readout at Step 0:** 5-hour 12% · weekly all models 31% · weekly Fable 60% · context 118k (2026-10-16T00:33Z)
- **quota readout before fan-out:** 5-hour 2% (window reset) · weekly all models 32% · weekly Fable 62% · context 226k (2026-10-16T05:38Z)
- **scaffold SHA:** none yet
- **workflow runs:** plan.workflow.js · wf_75859edd-2e0 · briefs/plan.args.json · running (started 2026-10-16T05:38Z)

## Next
- when plan.workflow.js returns: read tech-plan.md (Shared foundation to scaffold, lanes, High-risk surfaces, Spike result) and api-contract.md; freeze the contract; scaffold; install; commit the scaffold; record its SHA; write briefs/frontend-engineer.md (and a second lane brief only if named), briefs/qa-tester.md, briefs/reviewer.md; run build-verify.workflow.js
