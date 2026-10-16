// Completion sweep for the Tip Calculator: qa-sweep's full sweep adapted to a static SPA (DECISIONS D-002 C).
// The orchestrator runs it after the integration checkpoint and the QA/review fix round, with the PRODUCTION bundle
// served statically:  preview_start "tip-calculator-preview"  (vite preview of app/dist at http://127.0.0.1:4182), then
//   Workflow({ scriptPath: '<this file>', args: { projectRoot, base, scaffoldSha, releaseSha } })
// Three testers fit a page with no server, no API and no data layer: static bundle and serving, data and privacy, code
// review of the lane. Each finding gets two refuters with different lenses; a completeness critic closes. Every agent()
// sets a model: the session model is the owner's ceiling and never the default for mechanical work (qa-sweep Lessons,
// 2026-10-15). Read the result with D:/Meaningful/AI/agent-skills/skills/qa-sweep/assets/summarize-qa.mjs.
export const meta = {
  name: 'qa-sweep-tip-calculator',
  description: 'Completion sweep of the Tip Calculator production bundle on 127.0.0.1:4182: three static-SPA testers, two refuters per finding, a completeness critic',
  phases: [
    { title: 'Find', detail: 'three testers: static bundle and serving, data and privacy, code review of the lane' },
    { title: 'Verify', detail: 'two skeptics per finding try to refute it against the served bundle and the code' },
    { title: 'Critic', detail: 'one agent asks what the plan missed' },
  ],
}

if (args.dryRun) return { dryRun: true, script: 'qa/sweep.workflow.js', note: 'loaded and parsed; no agent spawned' }
const ROOT = args.projectRoot
const BASE = args.base
const SCAFFOLD = args.scaffoldSha
const RELEASE = args.releaseSha

const RULES = `Context: ${ROOT} is a client-only Vite + React + TypeScript single page (the Tip Calculator, XuSeak brand) with no server, no API, no data layer and no accounts. Its PRODUCTION bundle (app/dist, built locally from commit ${RELEASE}, so its build-commit stamp reads "local") is already served at ${BASE} by vite preview. Do NOT start or stop any server and do NOT run npm run dev or npm run preview. Test from Bash with curl or small node scripts (Node 24 has fetch and runs .ts files directly: import project modules with their .ts extension from ${ROOT}/app/src). Use absolute paths. Never use node -e with backticks or template literals; write any script to a file under your scratchpad or temp folder first, never into the repository. Windows: read D:/Meaningful/AI/agent-skills/rules/machine-windows.md first (Git Bash path conversion, no PowerShell redirection for files, py not python).
Hard limits: never modify, stage or commit any file in the repository (report only, no fixes). The only allowed writes inside it are npx tsc --noEmit (writes nothing) and npm run build in ${ROOT}/app, which rewrites the git-ignored app/dist with the same content. Never run a dependency install. Read nothing outside ${ROOT} except the owner's skill and rule files under D:/Meaningful/AI/agent-skills.
Read the records freely to learn the intended behaviour: PRD.md (12 acceptance criteria), api-contract.md (frozen types, parse rules in order, golden cases, URL and storage contracts, the exact copy strings), design-doc.md (revision 3), tech-plan.md, DECISIONS.md, test-report.md and review-findings.md. A finding is a concrete defect with a reproducible command and observed-versus-expected output; style opinions and the wording of the records are not findings. Severity scale: blocker = wrong money shown, or the page unusable for a normal visitor; bug = wrong behaviour with a workaround; nit = cosmetic or robustness. Also list what you tested that PASSED (one line each). Your final output is data for an orchestrator, not prose for a person.`

const FINDINGS = { type: 'object', properties: {
  findings: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, severity: { type: 'string', enum: ['blocker', 'bug', 'nit'] }, area: { type: 'string' }, repro: { type: 'string' }, observed: { type: 'string' }, expected: { type: 'string' }, file: { type: 'string' }, suggestedFix: { type: 'string' } }, required: ['title', 'severity', 'area', 'repro', 'observed', 'expected'] } },
  passed: { type: 'array', items: { type: 'string' } },
  timings: { type: 'array', items: { type: 'string' } },
  cleanupDone: { type: 'boolean' },
}, required: ['findings', 'passed'] }
const VERDICT = { type: 'object', properties: { refuted: { type: 'boolean' }, reproduced: { type: 'boolean' }, severity: { type: 'string', enum: ['blocker', 'bug', 'nit'] }, reasoning: { type: 'string' } }, required: ['refuted', 'reproduced', 'reasoning'] }
const GAPS = { type: 'object', properties: { gaps: { type: 'array', items: { type: 'object', properties: { what: { type: 'string' }, why: { type: 'string' }, howToTest: { type: 'string' } }, required: ['what', 'why'] } }, overallAssessment: { type: 'string' } }, required: ['gaps', 'overallAssessment'] }

const TESTERS = [
  { key: 'static-spa', model: 'sonnet', prompt: `${RULES}
You test the built single-page app as served from app/dist and the bundle itself. FIRST, in ${ROOT}/app run npx tsc --noEmit, then npm run build (allowed: it only rewrites dist/) and npm run size; record the exit codes, the asset file names and the Bundle size line. Then against ${BASE}: GET / returns 200 text/html containing <title>Tip Calculator</title>, the inline no-flash theme script reading localStorage key tip-calculator.theme.v1, <meta name="build-commit" content="local"> (a local build), and asset references that are relative (src="./assets/index-<hash>.js", href="./assets/index-<hash>.css"); each referenced asset returns 200 with a JavaScript or CSS content type; a missing asset (/assets/nope.js) returns 404; traversal attempts (/../package.json, /%2e%2e/package.json, /assets/../../package.json, /..%5cpackage.json) never serve a file from outside dist (vite preview is the local stand-in for GitHub Pages; report exactly what it returns). Then read the served JS bundle: it contains no http:// or https:// URL except the XuSeak footer link (classify every hit: a link printed in content is fine, anything fetched is not), no /@vite/client, no localhost, no console.error or console.log left in; exactly one replaceState( and zero pushState(; hashchange, matchMedia and prefers-color-scheme are present; inputmode, aria-describedby, aria-invalid, aria-pressed and role="status" strings are present; the exact copy strings from api-contract.md § Error Shapes the UI Renders (with the typographic apostrophe and the × and ¢ signs) are present. The served CSS references no external font or image, contains the dark override selector and a prefers-reduced-motion rule. Report the bundle size and anything console-visible you can infer statically.` },
  { key: 'data-privacy', model: 'sonnet', prompt: `${RULES}
You test the privacy claims and the publication hygiene of a repository about to go public for the first time. Run from ${ROOT} and report results verbatim: git ls-files must contain no node_modules, dist, .env, *.log, binaries (.png .jpg .pdf .woff2 .zip .docx) and nothing under a private/ or local/ folder; git check-ignore -v on app/node_modules/x, app/dist/index.html and .env; grep every tracked text file for US phone-number patterns and street-address patterns and report every hit with file:line (money examples such as $86.40 are not phone numbers; expected: none); confirm git config --global core.hooksPath points at the user’s ~/.claude/git-hooks and that pre-commit and pre-push exist there; grep app/src for every storage call (localStorage, sessionStorage, indexedDB, document.cookie): only the key tip-calculator.theme.v1 may be read or written, and only a theme value; grep app/src and the served bundle at ${BASE} for fetch(, XMLHttpRequest, sendBeacon, navigator.share, new Image, and analytics vendor strings (gtag, ga(, plausible, segment, hotjar, sentry, mixpanel, posthog): none may send anything anywhere; read app/src/state and app/src/lib/urlState.ts and run buildShareUrl and serializeHash from a node script on sample inputs (including a bill, a query string ?t=1 in the href and a bad hash) to confirm the inputs go only into the URL fragment and that only valid fields are written; confirm the one external link carries rel="noopener noreferrer"; confirm no secret, token, key or identity value sits in any tracked file (environment variable names only, if any). Run npm test in ${ROOT}/app (read-only) and record the test count and exit code.` },
  { key: 'code-review', model: 'opus', prompt: `${RULES}
You review the frontend lane for correctness defects only. Run: git -C ${ROOT} log --oneline ${SCAFFOLD}..HEAD and git -C ${ROOT} diff --stat ${SCAFFOLD}..HEAD -- app/src, then read every file under ${ROOT}/app/src. Check against api-contract.md: parseBill, parseTip and parsePeople apply their rules in the stated order (a lone "-", "$-5", "-$5", "86.", ".5", "1e3", "+5", "007", "000", "$1,234.56", a 10-digit whole-dollar bill, a 16-digit people count, "100.00" versus "100.01", a "%" suffix, non-ASCII digits, "-0"); tip rounds half up; shares round up; overage is 0..people-1; collected equals share × people; computeSplit throws RangeError only on out-of-contract inputs; evaluate never throws and never yields NaN, Infinity or a negative; the status-line and field-message strings equal the contract's exactly, including the typographic apostrophe, × and ¢. Check the hooks: hydration once and synchronously from the hash; history.replaceState only (never pushState), after a 150 ms quiet period, skipped when the URL would not change, the timer cleared on the next change and on unmount; the hashchange listener added once and removed on unmount; the matchMedia change listener removed on unmount and ignored after an explicit theme choice; StrictMode double-invocation of effects is harmless; a thrown replaceState, localStorage or clipboard call is caught with no console output; no stale closure over fields inside the debounce; Copy Link copies the flushed URL. Check the components: controlled inputs that never reformat while typing, type="text" with inputmode, a visible label per field, unique ids for aria-describedby, aria-invalid only on errors, aria-pressed on the quick picks and the theme segments, role="status" debounced 700 ms, the display card before the inputs in the DOM with no CSS order, Enter never submits, ArrowUp and ArrowDown step Tip and People, the autofocus rule (Bill, only with no bill in the URL and a fine pointer). Check the CSS by inspection for 360px overflow risks (min-width: 0, overflow-wrap, min() caps), the prefers-reduced-motion rule and the :focus-visible ring. Whenever a hypothesis can be tested, test it with a node script that imports the .ts module (Node 24, relative .ts imports; script in your scratchpad) instead of speculating. Report only defects you demonstrated or can argue precisely with a repro; everything else goes in passed.` },
]

const refute = (f, lens) => agent(`${RULES}
You are a skeptical verifier (${lens}). A tester reported this defect in the production bundle:
TITLE: ${f.title}
SEVERITY: ${f.severity}
AREA: ${f.area}
REPRO: ${f.repro}
OBSERVED: ${f.observed}
EXPECTED: ${f.expected}
${f.file ? 'FILE: ' + f.file : ''}
Try to REFUTE it. Reproduce the exact steps against ${BASE} or with a node script against the modules under ${ROOT}/app/src, and read the relevant code and records. It is refuted if it does not reproduce, if the stated "expected" behaviour is not what api-contract.md, design-doc.md, PRD.md or DECISIONS.md intend (the contract wins over the design doc), or if it is a style preference rather than a defect. If you are uncertain, set refuted=true. Re-grade the severity on the project's scale (blocker, bug, nit) and say in one paragraph what you ran and saw.`, { phase: 'Verify', schema: VERDICT, model: 'sonnet', label: `verify:${lens}:${f.title.slice(0, 36)}` })

phase('Find')
log('Three testers run in parallel against the production bundle on :4182; each finding then gets two independent refuters')
const results = await pipeline(
  TESTERS,
  t => agent(t.prompt, { phase: 'Find', schema: FINDINGS, model: t.model, label: `test:${t.key}` }),
  async (r, t) => {
    if (!r) return { key: t.key, passed: [], findings: [], failedToRun: true }
    const judged = await parallel(r.findings.map(f => () =>
      parallel([() => refute(f, 'reproduce-it'), () => refute(f, 'is-it-really-a-defect')])
        // a refuter that died (usage limit, crash) is NOT a refutation: such a finding is "unverified" and must be checked by hand
        .then(vs => { const v = vs.filter(Boolean); return { ...f, votes: v, unverified: v.length < 2 && !v.some(x => x.refuted), confirmed: v.length === 2 && v.every(x => !x.refuted), reproducedBy: v.filter(x => x.reproduced).length, severity: (v.find(x => x.severity) || f).severity } })))
    return { key: t.key, passed: r.passed, timings: r.timings || [], cleanupDone: r.cleanupDone, findings: judged.filter(Boolean) }
  },
)
const all = results.filter(Boolean)
const confirmed = all.flatMap(r => r.findings.filter(f => f.confirmed).map(f => ({ ...f, tester: r.key })))
const unverified = all.flatMap(r => r.findings.filter(f => f.unverified).map(f => ({ ...f, tester: r.key })))
const refuted = all.flatMap(r => r.findings.filter(f => !f.confirmed && !f.unverified).map(f => ({ ...f, tester: r.key })))
log(`${confirmed.length} finding(s) confirmed, ${unverified.length} unverified (refuters failed), ${refuted.length} refuted; asking the critic what the plan missed`)

phase('Critic')
const critic = await agent(`${RULES}
You are the completeness critic. Three testers covered: ${TESTERS.map(t => t.key).join(', ')}. Here is what they report as PASSED (one line each):
${JSON.stringify(all.map(r => ({ tester: r.key, passed: r.passed })), null, 1)}
Confirmed defects so far: ${JSON.stringify(confirmed.map(f => ({ title: f.title, severity: f.severity })))}
Read PRD.md (the Outcome Brief and the 12 criteria) and design-doc.md § Key User Flows to learn what the page promises a visitor at a restaurant table. The orchestrator separately runs the browser pass in a real browser (the journey 86.40, 20%, 4 people reads $25.92; light and dark; a reload keeps the theme; 360px with no horizontal scroll; the keyboard path; a clean console), so do not list those as gaps unless a specific sub-case is missing. List concrete gaps the plan missed, each with how to test it, then give a one-paragraph overall assessment of readiness for the first publication based ONLY on the evidence above. Do not run tests yourself beyond reading files.`, { phase: 'Critic', schema: GAPS, model: 'sonnet', label: 'critic:what-was-missed' })

return { confirmed, unverified, refuted, passed: all.map(r => ({ tester: r.key, passed: r.passed, timings: r.timings, cleanupDone: r.cleanupDone, failedToRun: !!r.failedToRun })), critic }
