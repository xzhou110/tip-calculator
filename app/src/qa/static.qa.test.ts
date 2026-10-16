// QA static checks: read source and built files for the contract's runtime rules. These prove the code
// contains the rule, NOT that a browser renders it (see test-report.md gaps).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url); // app/
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const dirFiles = (d: string) => readdirSync(new URL(d, root)).map((f) => `${d}${f}`);

describe('runtime rules in code (static)', () => {
  const split = read('src/state/useSplitState.ts');
  it('URL: replaceState never pushState, 150 ms, hashchange listener, hydrate in initializer', () => {
    expect(split).toContain('replaceState');
    expect(split).not.toContain('pushState');
    expect(split).toMatch(/URL_WRITE_DELAY_MS\s*=\s*150/);
    expect(split).toContain("addEventListener('hashchange'");
    expect(split).toMatch(/useState<FieldTexts>\(\(\) => parseHash\(window\.location\.hash\)\)/);
  });
  it('inputs: type=text with inputMode, aria-describedby, aria-invalid, labels bound by htmlFor', () => {
    for (const [f, mode, id] of [['BillField', 'decimal', 'bill'], ['TipField', 'decimal', 'tip'], ['PeopleField', 'numeric', 'people']]) {
      const s = read(`src/components/${f}.tsx`);
      expect(s).toContain('type="text"');
      expect(s).toContain(`inputMode="${mode}"`);
      expect(s).toContain(`aria-describedby="${id}-msg"`);
      expect(s).toContain('aria-invalid={');
      expect(s).toContain(`htmlFor="${id}"`);
      expect(s).toContain(`id="${id}"`);
      expect(s).not.toContain('type="number"');
    }
  });
  it('aria-pressed on picks and theme toggle, role=status region, no submit button', () => {
    expect(read('src/components/TipField.tsx')).toContain('aria-pressed');
    expect(read('src/components/ThemeToggle.tsx')).toContain('aria-pressed');
    expect(read('src/components/SrStatus.tsx')).toContain('role="status"');
    const all = dirFiles('src/components/').map(read).join('\n') + read('src/App.tsx');
    expect(all).not.toMatch(/type="submit"/);
    expect(all).not.toMatch(/console\./);
  });
  it('labels are Title Case and the brand is present', () => {
    const labels = ['Bill', 'Tip', 'People', 'Tip Amount', 'Total', 'Each Person Pays', 'Copy Link', 'Link Copied', 'Fewer People', 'More People', 'Tip Quick Picks'];
    const src = ['BillField', 'TipField', 'PeopleField', 'ResultsCard', 'CopyLinkButton', 'ThemeToggle'].map((f) => read(`src/components/${f}.tsx`)).join('\n');
    for (const l of labels) expect(src).toContain(l);
    expect(read('src/components/Header.tsx')).toContain('Tip Calculator');
    expect(read('src/components/Footer.tsx')).toContain('XuSeak');
  });
  it('no network, cookies or analytics in app source; localStorage only in useTheme', () => {
    const files = ['src/App.tsx', 'src/main.tsx', ...dirFiles('src/components/'), ...dirFiles('src/state/')];
    const src = files.map(read).join('\n');
    expect(src).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|gtag|analytics|document\.cookie|sessionStorage|indexedDB/i);
    expect(files.filter((f) => /localStorage/.test(read(f)))).toEqual(['src/state/useTheme.ts']);
  });
  it('CSS has a :focus-visible rule and no bare outline removal', () => {
    const css = read('src/styles.css');
    expect(css).toMatch(/:focus-visible/);
    const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(noComments).not.toMatch(/outline:\s*(none|0)\s*[;}]/);
  });
});

describe('source and workflow pre-checks (static, no build needed)', () => {
  it('source index.html has the build-commit placeholder', () => {
    expect(read('index.html')).toContain('<meta name="build-commit" content="__BUILD_COMMIT__" />');
  });
  it('workflow: push to main, tests before build, Pages artifact from app/dist, least permissions, no secrets', () => {
    const wf = readFileSync(new URL('../.github/workflows/deploy.yml', root), 'utf8');
    expect(wf).toMatch(/branches:\s*\[main\]/);
    expect(wf.indexOf('npm test')).toBeGreaterThan(-1);
    expect(wf.indexOf('npm test')).toBeLessThan(wf.indexOf('npm run build'));
    expect(wf).toContain('path: app/dist');
    expect(wf).toContain('actions/deploy-pages@v4');
    expect(wf).not.toMatch(/secrets\./);
    expect(wf).toMatch(/contents:\s*read/);
  });
});

// dist/ is git-ignored and deploy.yml runs `npm test` before `npm run build`, so on a clean checkout these checks skip;
// the orchestrator and the release engineer run them after a build. Found by the clean-clone CI-parity build (2026-10-16, D-008).
const hasDist = existsSync(new URL('dist/index.html', root));
describe.skipIf(!hasDist)('built page and deploy pre-checks (static, after npm run build)', () => {
  const dist = hasDist ? read('dist/index.html') : '';
  it('dist has the stamp (local, or the 40-hex commit from GITHUB_SHA), title and theme script before the bundle', () => {
    expect(dist).toContain('<title>Tip Calculator</title>');
    expect(dist).toMatch(/<meta name="build-commit" content="(?:local|[0-9a-f]{40})" \/>/);
    expect(dist).toContain('tip-calculator.theme.v1');
    expect(dist).toContain('prefers-color-scheme: dark');
    expect(dist.indexOf('tip-calculator.theme.v1')).toBeLessThan(dist.indexOf('./assets/'));
    expect(dist).toContain('<html lang="en">');
    expect(dist).not.toMatch(/maximum-scale|user-scalable/);
  });
  it('assets are relative and exist; no dev-server artefacts', () => {
    const refs = [...dist.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((m) => m[1]);
    expect(refs.length).toBe(2);
    for (const r of refs) expect(existsSync(new URL(`dist/${r.slice(2)}`, root))).toBe(true);
    expect(dist).not.toMatch(/(?:src|href)="\/(?!\/)/);
    expect(dist).not.toMatch(/@vite\/client|localhost/);
  });
  it('bundle URLs are only XML namespaces, the XuSeak footer link and react error docs', () => {
    const allowed = [/^http:\/\/www\.w3\.org\//, /^https:\/\/ai\.xuseak\.com\/$/, /^https:\/\/react\.dev\/errors\/?$/];
    for (const f of dirFiles('dist/assets/')) {
      const txt = read(f);
      expect(txt).not.toMatch(/localhost|@vite\/client|127\.0\.0\.1/);
      for (const m of txt.matchAll(/https?:\/\/[^"'`\s)\\<>]*/g)) {
        expect(allowed.some((a) => a.test(m[0])), `unexpected URL ${m[0]} in ${f}`).toBe(true);
      }
    }
  });
});
