# Coding standards (review bar)

Read this before reviewing a PR. It is deliberately short; use `AGENTS.md` for navigation and `GLOSSARY.md` for language.

## Motion

- A user who prefers reduced motion sees the same content in the same order with no scroll-linked camera, no parallax, no marquee, and no auto-playing sequence. Reveals resolve immediately.
- Smooth scrolling exists only in full motion. Touch devices use native scrolling.
- An animation that cannot be disabled from `src/motion/preferences.ts` is a bug.
- Scroll progress must be owned by the Story Director. A `scrollY` read inside the Three.js layer fails review.

## Accessibility

- Keyboard reaches every interactive element in document order; focus is always visible.
- The canvas is `aria-hidden`. Any meaning rendered there is also in the document or in the telemetry alternative.
- The Act Rail is a `<nav>` with links, not a decorative list of dots.
- A phone at 360 px must not scroll horizontally. Minimum touch target is 44 × 44 px.
- Color contrast meets WCAG AA for body and UI text; decorative labels may be lower contrast only when duplicated by accessible text.

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

- Cap DPR at 1.75 and degrade to 1.25 on sustained slowness.
- New per-frame work must reuse vectors and materials. No allocations in the render loop.
- The initial JS payload budget is 350 KB gzipped. The build script fails above it.
