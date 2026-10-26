# Agent guide

HALCYON is a static Vite + TypeScript scrollytelling site. One fixed Three.js stage renders the story; GSAP ScrollTrigger owns scene progress; the document stays semantic and readable without WebGL or motion. Live: https://gerrcass.github.io/scroll-to-orbit/

## Before changing the story or scene

Read `GLOSSARY.md` for the project's vocabulary, then the ADRs in `docs/adr/` that touch the area. Use those terms in commits, tickets, tests, and PR bodies.

- `docs/discovery/grill-session.md` — the objective, the five-act arc, and the decisions behind the page.
- `docs/agents/issue-tracker.md` — how work is tracked.
- `docs/agents/domain.md` — which domain docs to read.
- `CODING_STANDARDS.md` — the review bar, especially the motion, accessibility, and performance invariants.

## Commands

The scripts in `package.json` are the source of truth. The short version:

- `pnpm dev` — local story with HMR.
- `pnpm check` — typecheck, lint, unit tests, production build, and the 350 KB budget. Run before every commit.
- `pnpm test:e2e` — Playwright contract tests, including axe, reduced motion, WebGL-off, and 360 px.
- `pnpm evidence` — build, preview, and regenerate `docs/evidence/*` plus `public/og.png`.

## Invariants

- ScrollTrigger produces **scene progress**; Three.js renders it. Three.js never reads `window.scrollY`.
- Every visual is procedural. No downloaded models, textures, or stock imagery.
- The page tells the whole Vesper-01 story with WebGL off and with reduced motion on. Those are release gates, not fallbacks.
- Reduced motion maps each act to a **reduced still** in `src/mission/mission.ts`; a new act needs a still.
- The canvas is decorative. Navigation, telemetry alternatives, and CTAs live in the document.
- Content is fiction. Keep the footer disclosure.
- Performance: no full-screen `backdrop-filter`, no animated grain, merge static scene geometry, and no per-frame allocations.

## Workflow

Tickets are vertical slices with blocking edges in GitHub Issues. Implement on a branch in a worktree; open a PR into the integration branch using the `/pr` template and attach an **evidence shot**. Merge only when `pnpm check` and the E2E suite pass. The final integration PR goes to `main`; Pages deploys from `main` through `.github/workflows/deploy.yml`.
