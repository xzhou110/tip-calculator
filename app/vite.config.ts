import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The commit this build came from: GitHub Actions sets GITHUB_SHA; a local build says 'local'.
// Stamped into index.html as the live check's proof of freshness (tech-plan.md, Release
// Verification): GitHub Pages' CDN ignores the query string, so only content proves a page is new.
const buildCommit = process.env.GITHUB_SHA ?? 'local';

// base './': relative asset URLs. On GitHub Pages they resolve under /tip-calculator/ (the
// PRD's served path); under `vite preview` and a served dist/ they resolve under /. The build
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
