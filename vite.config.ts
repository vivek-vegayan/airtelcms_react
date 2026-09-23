import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Loads .env, .env.[mode] and their .local variants exactly like Vite does
  // internally (empty prefix = don't restrict to VITE_-prefixed keys only).
  const env = loadEnv(mode, process.cwd(), '')

  // Deployment context path, e.g. "/airtelchmbeta/". Comes from VITE_APP_BASE_PATH
  // (see .env / .env.production) so retargeting a deployment - "/", "/airtelchm",
  // "/airtelchmbeta", or any future path - is a config change, not a code change.
  // BrowserRouter's basename (src/App.tsx) reads import.meta.env.BASE_URL, which
  // Vite derives from this same value, so the two can never drift apart.
  // Falls back to "/" (domain root) when unset, so a fresh clone with no env
  // override still builds a working app.
  const basePath = env.VITE_APP_BASE_PATH || '/'

  return {
    plugins: [react()],

    // ---- Single-React guarantees ----------------------------------------
    // The "Invalid hook call / Cannot read properties of null (reading
    // 'useContext')" crash in dev is never a Rules-of-Hooks violation in our
    // components: it is two *copies of React* alive in the same browser tab.
    // It shows up as mismatched dep-optimizer hashes in the stack trace, e.g.
    // MUI's useTheme running from `chunk-...js?v=1520b26f` while the renderer
    // is `react-dom_client.js?v=ed507458`. The old chunk's React has a null
    // dispatcher because the *new* React is the one actually rendering.
    //
    // Two independent guards below:
    //
    // 1. `resolve.dedupe` collapses any duplicate physical resolution of these
    //    packages to the root copy, so a transitive dep that ships its own
    //    React (or a linked package) can never introduce a second instance.
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-router',
        '@mui/material',
        '@mui/system',
        '@emotion/react',
        '@emotion/styled',
      ],
    },
    // 2. `optimizeDeps.include` pins the packages that must never be
    //    discovered *late*. Vite bumps the shared `browserHash` on every
    //    re-optimization pass; anything the first pass missed forces a second
    //    pass mid-session, and a tab that has already evaluated modules from
    //    the first pass then holds a stale React alongside the new one. These
    //    entries are the ones whose duplication is fatal rather than merely
    //    wasteful, so they are declared up front instead of being left to the
    //    scanner. Deep `@mui/icons-material/*` imports are deliberately NOT
    //    listed - the scanner already finds all ~376 of them through the
    //    React.lazy() route boundaries, and enumerating them here would make
    //    the config hash churn on every new icon import.
    optimizeDeps: {
      include: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client',
        'react-router',
        'react-redux',
        '@reduxjs/toolkit',
        '@mui/material',
        '@mui/material/styles',
        '@emotion/react',
        '@emotion/styled',
      ],
    },
    assetsInclude: ['**/*.xlsx', '**/*.xlsm'],
    base: basePath,
    server: {
      host: '0.0.0.0',  // Your server's IP address
      port: 5174,           // The port Vite will run on
      open: true,           // Optional: opens the browser automatically
    },
    build: {
      rollupOptions: {
        output: {
          // Without this, Rollup's default splitting gives every icon/helper
          // that's shared across 2+ lazy-loaded routes (see React.lazy() call
          // sites and the ~800 individual @mui/icons-material imports across
          // the app) its own tiny chunk file - 146 JS files in a prod build,
          // many under 300 bytes. Opening one page can then fire dozens of
          // near-simultaneous asset requests, which is what was tripping the
          // 429s: real payload is ~5.7MB total, so the problem is request
          // *count*, not size. Grouping vendor code into a handful of larger,
          // long-lived-cache chunks collapses that burst.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined
            // pdf.js is the one library worth keeping out of 'vendor': it is
            // ~430KB that only the MOP validation workspace needs, and that
            // screen lazy-loads its canvas, so this chunk is fetched on the
            // first Validate click and never on app start. Safe to split
            // despite the note below - react-pdf imports React one way and
            // nothing in 'vendor' imports back into it, so there is no
            // cross-chunk cycle to trip over.
            // Anchored on the package directory so it matches the standalone
            // `react-pdf` viewer only. A bare 'react-pdf' substring would also
            // catch `@react-pdf/renderer`, which is a different library that
            // team-management's employee export uses - dragging it into a chunk
            // only the MOP viewer pulls would make every export wait on pdf.js.
            if (/node_modules[\\/](pdfjs-dist|react-pdf)[\\/]/.test(id)) return 'pdfjs'
            // MUI/Emotion, React, React-DOM and React-Router have circular
            // internal references (react-is, prop-types, etc). Splitting them
            // into separate chunk *files* forces the browser to execute one
            // chunk before another has finished initializing its exports,
            // which throws "Cannot access 'X' before initialization" (or, for
            // @mui/icons-material specifically, "Cannot read properties of
            // undefined (reading 'jsx')") at runtime - a cross-chunk
            // temporal-dead-zone bug, not a server or deployment issue.
            // @mui/icons-material's createSvgIcon re-exports from
            // @mui/material/utils, so every icon module pulls in
            // @mui/material (and transitively React/Emotion) - it has the
            // same circular dependency as the rest and must stay in the same
            // chunk. Keeping everything in one 'vendor' file avoids that
            // boundary while still cutting request count vs. Rollup's
            // default per-module splitting.
            return 'vendor'
          },
        },
      },
    },
  }
})
