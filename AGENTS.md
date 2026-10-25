# Agent guide

HALCYON is a static Vite + TypeScript scrollytelling site. One fixed Three.js stage renders the story; GSAP ScrollTrigger owns scene progress; the document stays semantic and readable without WebGL or motion.

## Before changing the story or scene

Read `GLOSSARY.md` for the project's vocabulary, then the ADRs in `docs/adr/` that touch the area. Use those terms in commits, tickets, tests, and PR bodies.

- `docs/discovery/grill-session.md` — the objective, the five-act arc, and the decisions behind the page.
- `docs/agents/issue-tracker.md` — how work is tracked.
- `docs/agents/domain.md` — which domain docs to read.
- `CODING_STANDARDS.md` — the review bar, especially the motion and accessibility invariants.

## Commands

The scripts in `package.json` are the source of truth. The short version:

- `npm run dev` — local story with HMR.
- `npm run check` — typecheck, lint, unit tests, and production build. Run before every commit.
- `npm run test:e2e` — Playwright contract tests, including reduced motion and WebGL-off.
- `npm run evidence` — capture the act screenshots used in PRs and the README.

## Invariants

- ScrollTrigger produces **scene progress**; Three.js renders it. Three.js never reads `window.scrollY`.
- Every visual is procedural. No downloaded models, textures, or stock imagery.
- The page tells the whole Vesper-01 story with WebGL off and with reduced motion on. Those are release gates, not fallbacks.
- The canvas is decorative. Navigation, telemetry alternatives, and CTAs live in the document.
- Content is fiction. Keep the footer disclosure.

## Workflow

Tickets are vertical slices with blocking edges in GitHub Issues. Implement on a branch in a worktree; open a PR into the integration branch using the `/pr` template and attach an **evidence shot**. Merge only when `npm run check` and the E2E suite pass. The final integration PR goes to `main`; Pages deploys from `main`.
