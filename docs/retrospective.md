# Retrospective — HALCYON / Vesper-01

**Session:** the full `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement-spec` → `/code-review` → release cycle for the scroll-to-orbit landing page.

## What worked

- **Context pointers beat prose.** The spec lived in issue #1, the language in `GLOSSARY.md`, and the decisions in `docs/adr/`. Implementers and reviewers could read the same sources instead of a retold brief.
- **One test seam carried the story.** `src/mission/mission.ts` made act, telemetry, camera and reduced-still behavior testable without a browser. The two-axis review found genuine gaps because the spec was explicit.
- **Evidence as a build artifact.** `pnpm evidence` captures the same shots the README and PRs use. The hand-cropped evidence drift from the early tickets is gone.
- **CI as the guardrail.** Typecheck, lint, 43 unit tests, 16 Playwright tests, axe and the bundle budget all run on every PR. The first CI run caught nothing, which is the point of having it.

## Improvements applied during the cycle

- **Navigation:** `AGENTS.md` now points at the spec, glossary, ADRs, standards and evidence generator.
- **Automated checks:** added `.github/workflows/ci.yml`, the axe E2E audit, the 360 px audit, the WebGL-off test, and the bundle-budget script.
- **Performance standards:** removed full-screen `backdrop-filter` and animated grain, merged static pad geometry, made the ground fill unlit, tiered the Earth shader, added an adaptive DPR floor, and removed per-frame allocations. These are now review rules in `CODING_STANDARDS.md`.
- **Dependency reality:** npm's arborist failed on the dependency graph; pnpm is the lockfile and now the only documented package manager.
- **Spec deviations are recorded:** the countdown scroll-snap was removed after it froze the clock under ScrollSmoother; a comment on issue #1 and the ticket #3 PR record the replacement (five stepped status beats + sequence bar).

## Candidates not applied

These are reasonable next improvements, not release blockers:

1. **Compress evidence.** `docs/evidence` is ~12 MB of lossless PNG. A JPEG/WebP export step or `pngquant` would keep the README quality and shrink the repository.
2. **Pre-commit hook.** CI is the guardrail; a local hook would shorten the feedback loop but adds another place for the checks to drift.
3. **Visual regression screenshots.** The evidence script captures the acts but does not diff them. Pixel diffs would catch camera regressions that unit tests cannot.
4. **JS code splitting.** The initial bundle is 246 KB gzipped, under the 350 KB budget. Splitting the scene from the chrome is only worth it if the budget tightens.
5. **Rocket deduplication.** The pad geometry is merged; the rocket still uses per-part meshes because several parts animate independently. It is a deliberate trade-off, not an oversight.

## What to keep

- The **spec + ticket + PR** chain made a large creative build reviewable.
- The **parallel Standards/Spec review** found independent classes of issue; keep the two axes separate.
- The **evidence generator** is the cheapest way to keep a visual README honest.
