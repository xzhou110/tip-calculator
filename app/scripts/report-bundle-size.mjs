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
