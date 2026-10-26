# Coding standards (review bar)

Read this before reviewing a PR. It is deliberately short; use `AGENTS.md` for navigation and `GLOSSARY.md` for language.

## Motion

- A user who prefers reduced motion sees the same content in the same order with no scroll-linked camera, no parallax, no marquee, and no auto-playing sequence. Reveals resolve immediately.
- Reduced motion maps each act to a static **reduced still**; adding an act means adding a still and a test.
- Smooth scrolling exists only in full motion. Touch devices use native scrolling. The motion toggle rebuilds ScrollSmoother live and persists.
- An animation that cannot be disabled from `src/motion/preferences.ts` is a bug.
- Scroll progress is owned by the Story Director. A `scrollY` read inside the Three.js layer fails review.

## Accessibility

- Keyboard reaches every interactive element in document order; focus is always visible.
- The canvas is `aria-hidden`. Any meaning rendered there is also in the document or in the telemetry alternative.
- The Act Rail is a `<nav>` with links, not a decorative list of dots.
- A phone at 360 px must not scroll horizontally. Key touch targets are at least 44 × 44 px.
- Color contrast meets WCAG AA for body and UI text; decorative labels may be lower contrast only when duplicated by accessible text.
- `pnpm test:e2e` must keep axe clean in full and reduced motion.

## Architecture

- Pure mission math and formatting live in `src/mission/` with no DOM or Three.js imports.
- Three.js modules own geometry, materials, and particles only. DOM modules own DOM.
- GSAP registration happens once in `src/motion/gsap.ts`.
- New dependencies need a named job and a bundle-size check. No post-processing composer, no physics engine, no UI framework.
- Every plugin in the GSAP roster has a visible job recorded in the spec; dead spectacle fails review.

## Testing

- Unit tests assert external behavior and formatting, never Three.js internals.
- E2E tests assert what a user can see or do: navigation, act state, menu behavior, fallbacks, and no console errors.
- Every ticket ships with the tests that prove its acceptance criteria. Evidence shots are generated, not hand-cropped.

## Performance

- No full-screen `backdrop-filter` and no animated grain. They were removed after measurement; use more opaque translucent surfaces instead.
- Merge static scene geometry by material. The large ground fill is unlit; the Earth shader is tiered by segments and octaves.
- Cap DPR at 1.75; the adaptive floor is 0.85. Particle counts scale by device tier.
- No per-frame allocations. Reuse camera keys, vectors, and samplers; the render loop must not build objects.
- The initial JS budget is 350 KB gzipped. The build fails above it.
