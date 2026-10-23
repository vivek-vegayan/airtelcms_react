import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Heavy libraries that only a few screens use. Each gets its own chunk so it
// is downloaded when one of those screens (or its export button) first needs
// it, instead of riding along in the 'vendor' chunk every page loads.
//
// pdf.js is ~430KB that only the MOP validation workspace needs, and that
// screen lazy-loads its canvas, so this chunk is fetched on the first Validate
// click and never on app start. Anchored on the package directory so it
// matches the standalone `react-pdf` viewer only - a bare 'react-pdf'
// substring would also catch `@react-pdf/renderer`, a different library
// (team-management's employee PDF export) that gets its own group below.
const HEAVY_CHUNK_GROUPS: Array<[RegExp, string]> = [
  [/node_modules[\\/](pdfjs-dist|react-pdf)[\\/]/, 'pdfjs'],
  [/node_modules[\\/]@react-pdf[\\/]/, 'pdf-export'],
  [/node_modules[\\/]exceljs[\\/]/, 'excel'],
  [/node_modules[\\/](chart\.js|react-chartjs-2|@kurkle)[\\/]/, 'charts'],
  [/node_modules[\\/]react-big-calendar[\\/]/, 'calendar'],
]

type ModuleInfoLookup = (id: string) => {
  importers: readonly string[]
  dynamicImporters: readonly string[]
} | null

const directGroup = (id: string) =>
  HEAVY_CHUNK_GROUPS.find(([pattern]) => pattern.test(id))?.[1]

// A dependency follows its heavy library into that library's chunk only when
// nothing else imports it - e.g. fontkit/yoga-layout, which only
// @react-pdf/renderer uses. Anything also reachable from app code or another
// library (React, date-fns, ...) stays in 'vendor'. That keeps the import
// direction one-way (heavy chunk -> vendor, never back), which is what makes
// these splits safe from the cross-chunk initialization cycle described in
// manualChunks below.
const resolveChunk = (
  id: string,
  getModuleInfo: ModuleInfoLookup,
  memo: Map<string, string>,
  visiting: Set<string>,
): string => {
  const cached = memo.get(id)
  if (cached) return cached
  const direct = directGroup(id)
  if (direct) return direct
  // App code, or an import cycle we're already inside of: not exclusive to
  // any one heavy library.
  if (!id.includes('node_modules') || visiting.has(id)) return 'vendor'

  visiting.add(id)
  const info = getModuleInfo(id)
  const importers = info ? [...info.importers, ...info.dynamicImporters] : []
  const groups = new Set(
    importers.map((importer) => resolveChunk(importer, getModuleInfo, memo, visiting)),
  )
  visiting.delete(id)

  const [only] = groups
  const chunk = groups.size === 1 && only !== 'vendor' ? only : 'vendor'
  memo.set(id, chunk)
  return chunk
}

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
  // Per-build cache for resolveChunk's importer walk.
  const heavyChunkMemo = new Map<string, string>()

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
          manualChunks(id: string, { getModuleInfo }) {
            if (!id.includes('node_modules')) return undefined
            // The heavy, screen-specific libraries (see HEAVY_CHUNK_GROUPS)
            // and the dependencies only they use are safe to split despite
            // the note below: they import React/vendor one way and nothing
            // in 'vendor' imports back into them, so there is no cross-chunk
            // cycle to trip over.
            const heavy = resolveChunk(id, getModuleInfo, heavyChunkMemo, new Set())
            if (heavy !== 'vendor') return heavy
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
