# Agent Brief: release-engineer · clean-clone CI-parity build and release readiness (Phase A)

You are the Release Engineer of a /build run at the FULL verification row. A cold agent receives nothing else from the conversation: every section below stands on its own. Read every section before you start. Your role file is `D:/Meaningful/AI/claude-marketplace/plugins/multi-agent-orchestrator/agents/release-engineer.md`; this brief adds the project specifics.

## Goal
Prove that the release commit `bd173070eb0f18413ea6920cda7d6bb06295dfae` of the Tip Calculator builds from a clean clone exactly as GitHub Actions will build it, prepare the first publication, and hand back READY with the exact commands. **This is Phase A only.** Nothing is published: the repository `xzhou110/tip-calculator` does not exist yet, and creating it, enabling Pages and pushing are the orchestrator's after the owner's explicit yes at the deploy gate. You run nothing irreversible: no `gh repo create`, no `git push`, no `gh api` POST, no `gh auth refresh`.

## Deploy Target (not pre-approved)
A new public GitHub repository `xzhou110/tip-calculator` with GitHub Pages built by the workflow in `.github/workflows/deploy.yml` (Actions source), live at `https://xzhou110.github.io/tip-calculator/`. The first publication needs the owner's yes; your brief does not carry it.

## Steps
1. **Read** `D:/Meaningful/AI/tip-calculator/tech-plan.md` § Release Verification and the deploy notes at the end of § Shared foundation to scaffold, `test-report.md`, `review-findings.md` and `STATE.md` (the release commit is `bd173070eb0f18413ea6920cda7d6bb06295dfae`, the scaffold and rollback point is `51c789d9523e5f4f043b1e8510f9ce59063543a1`).
2. **Clean clone, CI parity** (qa-sweep step 6): `git clone D:/Meaningful/AI/tip-calculator <your scratchpad>/tip-calculator-ci` (a folder outside the repository; never clone into the project). In the clone's `app/` run exactly the workflow's steps with the stamp set as Actions sets it: `GITHUB_SHA=bd173070eb0f18413ea6920cda7d6bb06295dfae npm ci`, `npm test`, `GITHUB_SHA=bd173070eb0f18413ea6920cda7d6bb06295dfae npm run build`, `npm run size` (Git Bash: `GITHUB_SHA=… npm run build`; PowerShell: `$env:GITHUB_SHA='…'; npm run build`). Record every exit code, the test count, the `Bundle size:` line and the asset file names. Then assert in the clone's `app/dist/index.html`: `<title>Tip Calculator</title>`, `<meta name="build-commit" content="bd173070eb0f18413ea6920cda7d6bb06295dfae" />` (the placeholder is gone), and `src="./assets/index-…js"` (relative). Compare the clone's asset hashes with the working copy's `app/dist/` after `npm run build` there too: same source, same hashes (web-ship-check § After Deploy, "the live bundle is the one you tested").
3. **Workflow readiness:** confirm `.github/workflows/deploy.yml` runs the same four npm steps you ran (`npm ci`, `npm test`, `npm run build`, `npm run size`) with Node 24 and `cache-dependency-path: app/package-lock.json`; confirm `app/package-lock.json` is committed. Report whether the GitHub token carries the `workflow` scope (`gh auth status` prints the scopes; pushing `.github/workflows/*` needs it); if it does not, say so and name the owner's command `gh auth refresh -h github.com -s workflow`; do not run it.
4. **Pre-publication scans (read-only):** `node C:/Users/xzhou/.claude/git-hooks/secret-scan.mjs --history` in `D:/Meaningful/AI/tip-calculator` (the history scan the rules require before a repository's first public push); `git -C D:/Meaningful/AI/tip-calculator ls-files` must contain no `node_modules`, `dist`, `.env`, binaries or private files; `git -C D:/Meaningful/AI/tip-calculator status --porcelain` must be empty (everything committed). Report each result verbatim.
5. **Write the release note** `D:/Meaningful/AI/tip-calculator/release-note.md`: state READY or NOT READY with reasons; what will ship (commit, title, bundle size); the exact Phase B commands in order, for the orchestrator to run after the owner's yes:
   ```
   gh repo create xzhou110/tip-calculator --public --source D:/Meaningful/AI/tip-calculator --remote origin --description "Tip Calculator: split a dinner bill with the tip, to the cent (XuSeak)"
   gh api --method POST repos/xzhou110/tip-calculator/pages -f build_type=workflow
   git -C D:/Meaningful/AI/tip-calculator push -u origin main
   ```
   then the live check from tech-plan § Release Verification (wait for the deploy run of the pushed SHA to succeed, then poll the bare URL for the title marker and `build-commit` equal to the pushed SHA, 30-minute timeout, never requesting the URL before the run succeeds); the post-deploy items from web-ship-check § After Deploy, each marked run or not applicable (the `?t=` wording there is superseded: the CDN ignores the query string, the stamp is the proof); and the rollback (revert to the scaffold `51c789d9523e5f4f043b1e8510f9ce59063543a1` or the last milestone commit, then push).

## Lane
- **Owned paths (edit freely):** `D:/Meaningful/AI/tip-calculator/release-note.md`; your clone under your scratchpad
- **Read-only paths:** everything else under `D:/Meaningful/AI/tip-calculator/`
- **Forbidden (never edit):** every product and record file. **Never** create the remote repository, push, enable Pages, change auth, or run a dependency install in the working copy (`npm ci` runs only in your clone).

## Commands and Shell
Shell: the Bash tool (Git Bash) or Windows PowerShell 5.1 (no `&&`; use `;`). Read `D:/Meaningful/AI/agent-skills/rules/machine-windows.md` first (BOMs, `MSYS_NO_PATHCONV=1` when a leading-slash value must reach Node unconverted, `py` not `python`, GitHub CLI at `C:/Program Files/GitHub CLI/gh.exe`, not on Git Bash's PATH). Node 24.16, npm 11.

## Inputs (read first, in this order)
1. `D:/Meaningful/AI/tip-calculator/tech-plan.md` § Release Verification, § Shared foundation to scaffold (deploy notes)
2. `D:/Meaningful/AI/agent-skills/skills/web-ship-check/SKILL.md` § After Deploy
3. `D:/Meaningful/AI/agent-skills/skills/qa-sweep/SKILL.md` step 6 (the clean-clone CI-parity build)
4. `D:/Meaningful/AI/agent-skills/rules/machine-windows.md`
5. `D:/Meaningful/AI/tip-calculator/test-report.md`, `review-findings.md`, `STATE.md`

## When Blocked
Write `D:/Meaningful/AI/tip-calculator/briefs/BLOCKERS-release-engineer.md` with what you need and why, then continue with everything that is not blocked.

## Git
Do not commit, stage, stash, switch branches or push.

## Hand-Back (your final message, 3 to 5 lines)
STATUS: success | partial | failed. Then: READY or NOT READY with the reason; the clean-clone results (exit codes, tests, bundle size, stamp and hash checks); the scan results and the `workflow` scope; the exact Phase B commands and the rollback; confirmation that nothing irreversible ran; one gotcha line (or "none").
