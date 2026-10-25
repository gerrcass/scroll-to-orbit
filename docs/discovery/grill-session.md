# Grill session — HALCYON / Vesper-01

**Date:** 2026-10-25
**Mode:** self-directed. The user asked not to be blocked on decisions, so each question below records the recommended answer, the reasoning, and the decision that was adopted.

**Facilitator:** DeepSeek V4.1 Flash 1017 (Max)

---

## The objective, stated as a challenge

> Build a production-grade scrollytelling landing page for a fictional orbital launch company in which one continuous Three.js camera move carries a visitor from a launch pad at night, through ignition and ascent, to orbital insertion — while the page remains fast on a mid-tier laptop, fully usable by keyboard and screen reader, legible at 360 px, and capable of telling the whole story with WebGL disabled or motion reduced.

That is deliberately harder than "a rocket that moves on scroll". It sets five constraints that pull against each other:

1. **Cinematic continuity** — one scene, one camera, no cuts.
2. **Narrative legibility** — every scroll act must say something, not just look good.
3. **Performance** — the 3D stage cannot compete with the copy for the main thread.
4. **Accessibility** — the story cannot live only in pixels or in motion.
5. **Testability** — the mission state must exist as data, not only as animation callbacks.

The page is the proof. If any of those five is missing, the project fails even if the rocket looks excellent.

---

## Round 1 — Story, brand, and audience

### Q1. What is the company, and what does it sell?

**Recommendation:** A small-lift, reusable launch company for the "night shift" of orbit: weather, connectivity, and Earth-observation constellations. The brand is **HALCYON Launch Systems**; the vehicle is **KESTREL**; the first flight is **VESPER-01**.

A generic "space company" would produce generic copy. A specific thesis gives every section a job: Halcyon sells *repeatability*, not spectacle. Kestrel is the vehicle that comes home.

**Decision:** Adopted. Vehicle is two-stage and reusable; mission is a night launch to sun-synchronous orbit (SSO); site is the fictional **Pad 09, Atlantic Range**.

### Q2. What is the emotional arc?

**Recommendation:** Quiet → violence → release → quiet. The page opens on the hush before ignition, gets loud and fast during ascent, then resolves into the silence of orbit. The headline **"The last quiet before orbit"** encodes the arc and gives the final section its callback.

**Decision:** Adopted. Five acts: **PAD, IGNITION, ASCENT, SEPARATION, ORBIT**. Each act has a named chapter in the Act Rail so the visitor always knows where they are.

### Q3. Is this a mission page or a company page?

**Recommendation:** Both, in this order: the mission is the proof, the company is the ask. The narrative follows Vesper-01, then pulls back to the vehicle, the manifest, and the commercial call to action.

**Decision:** Adopted. Content order: Hero → Manifesto → Vehicle → Launch → Ascent → Orbit → Manifest → Contact.

### Q4. What is the primary conversion?

**Recommendation:** "Reserve a launch window" — a low-friction mission-brief request. The form is a single email field plus orbit-profile context; it must work with JavaScript disabled by falling back to a `mailto:` action.

**Decision:** Adopted. Secondary CTA: "Meet Kestrel", which scrolls to the vehicle section.

### Q5. Is the company presented as established or pre-first-flight?

**Recommendation:** Pre-first-flight, but credible: one vehicle, one approaching window, a manifest of three missions. This makes the countdown meaningful and avoids fake heritage claims.

**Decision:** Adopted. The page is written in the voice of a company with hardware on the pad, not a company with a hundred flights.

---

## Round 2 — The scroll architecture

### Q6. One canvas or one canvas per section?

**Recommendation:** One fixed, full-viewport WebGL canvas behind a semantic document. Continuity is the product; swapping scenes would break the camera illusion and multiply GPU context cost.

**Decision:** Adopted. The canvas is `aria-hidden`; the document remains the source of meaning.

### Q7. What owns scroll state?

**Recommendation:** GSAP ScrollTrigger owns a single normalized **scene progress** value (0 → 1) for the whole story. Three.js reads that value and renders. No Three.js code reads `window.scrollY`, and no ScrollTrigger callback reaches into scene internals.

**Decision:** Adopted. A `StoryDirector` façade exposes `progress`, `act`, and a small telemetry snapshot. This is the main test seam.

### Q8. How do we avoid the "scroll-jacked slideshow" feeling?

**Recommendation:** ScrollSmoother for desktop with a short catch-up (0.8 s), native scroll on touch and reduced motion, and no scroll snapping except the countdown's deliberate three-step sequence. The 3D progress is damped, never locked to the raw scroll wheel.

**Decision:** Adopted. The countdown section may snap, because a launch sequence benefits from cadence; everything else stays fluid.

### Q9. What happens below the fold on a phone?

**Recommendation:** The same story at a lower cost: reduced particle counts, a narrower camera FOV, shorter scroll distances, no ScrollSmoother, no custom cursor, and a 3D scene that still changes but with fewer draw calls.

**Decision:** Adopted. Mobile is a first-class scene configuration, not a CSS afterthought.

### Q10. How much of the page is pinned?

**Recommendation:** Three pins at most: the countdown sequence, the vehicle schematic, and the mission-dial section. Too many pins turns the page into a hostage situation.

**Decision:** Adopted. Each pin has an accessible static fallback at reduced motion.

---

## Round 3 — Motion, plugins, and craft

### Q11. Which GSAP plugins earn their place?

**Recommendation:** Use plugins where they change the design, not for a checklist.

| Plugin | Job on this page |
| --- | --- |
| ScrollTrigger | Master story progress, act rail, pins, reveals |
| ScrollSmoother | Desktop inertial scroll; disabled for touch/reduced motion |
| SplitText | Hero and chapter line reveals, re-split on resize |
| DrawSVG | Kestrel schematic strokes, trajectory path |
| MorphSVG | Kestrel flight → landing configuration |
| MotionPath | Satellite along its orbit; scroll cue along a curve |
| ScrollTo | Nav, CTAs, act rail |
| Observer | Header scroll-direction state, cursor state |
| Flip | Mobile menu open/close, active nav pill |
| Draggable + Inertia | Mission-profile dial with snap |
| TextPlugin | Terminal-style sequence lines |
| CustomEase | Camera and reveal signature curve |
| ExpoScaleEase | Smoke expansion |
| SlowMo | Camera settle after max-Q |
| RoughEase | Engine vibration / frame judder |

**Decision:** Adopted. The spec requires each plugin to have a named, visible job; a reviewer can point at the artifact.

### Q12. How do we make the rocket feel real with primitives?

**Recommendation:** Build detail at three scales: silhouette (body, nose, boosters), surface (panel lines, livery, emissive engine bells), and atmosphere (pad lights, fog, smoke, lens dirt in CSS). The rocket itself stays simple; the *lighting* sells it.

**Decision:** Adopted. Procedural canvas texture for livery. No external 3D models.

### Q13. What is the signature moment?

**Recommendation:** **Orbital sunrise.** After the violence of ascent, the camera rolls over the Earth's limb as the sun breaks the horizon and the star field fades. It is the visual answer to "the last quiet before orbit", and it is cheap: a directional light, an atmospheric rim shader, and a warm sprite.

**Decision:** Adopted. The orbit act ends on the sunrise; the final CTA sits in its afterglow.

### Q14. Sound?

**Recommendation:** No autoplay audio. A launch page that makes noise without consent is hostile. If sound is added later, it must be opt-in and synthesized.

**Decision:** Adopted. No audio in v1.

### Q15. What is the performance budget?

**Recommendation:** On a 2020-class laptop at 1440 × 900: 60 fps target, 45 fps floor during ignition; initial JS ≤ 350 KB gzipped; LCP ≤ 2.5 s on Fast 3G; CLS ≤ 0.05. Renderer DPR capped at 1.75, dropped to 1.25 after sustained frame drops. Particles scale by device tier.

**Decision:** Adopted. The budget is checked in CI with a bundle-size assertion and in the browser with a runtime frame sampler.

---

## Round 4 — Accessibility, degradation, and truth

### Q16. What does "reduced motion" mean here?

**Recommendation:** Not "no design". It means: no scroll-linked camera, no parallax, no marquee, no custom cursor, no auto-countdown animation; content is visible by default, reveals become instant, and the 3D scene renders a small set of meaningful stills (pad, ascent, orbit) cross-faded on section entry at most.

**Decision:** Adopted. A visible **MOTION: FULL / REDUCED** control in the footer persists the choice; the OS preference is the default.

### Q17. What happens without WebGL?

**Recommendation:** A designed fallback, not an apology: a CSS/SVG night-sky poster with a Kestrel silhouette, the same copy, the same telemetry and countdown as static text. All content and CTAs work. The fallback is a test case, not a hope.

**Decision:** Adopted. `data-webgl="false"` switches the poster in; a console note explains why.

### Q18. How do we prove the story is accessible, not just technically labeled?

**Recommendation:** The telemetry has a text alternative that reads the mission state in sentences ("At T plus 2 minutes 14 seconds, Kestrel is 68 kilometres downrange, travelling at 1.4 kilometres per second"). Headings follow the acts. The Act Rail is a real navigation landmark with links. The canvas is decorative.

**Decision:** Adopted. The `TelemetrySnapshot` formatter is unit-tested and reused by the live UI, the screen-reader summary, and the static fallback.

### Q19. What do we test, and where?

**Recommendation:** One primary seam: the pure mission model (`progress → act + telemetry + camera key`). Unit-test that exhaustively. Use Playwright for the external contract: page loads without console errors, nav and CTA work, Act Rail updates on scroll, mobile menu traps focus, reduced motion removes smooth scrolling, WebGL-off shows the poster, and a representative screenshot exists for each act.

**Decision:** Adopted. Unit tests never assert on Three.js internals; E2E tests never assert on CSS implementation details.

### Q20. How do we keep the content honest if this is fiction?

**Recommendation:** A visible footer note: "HALCYON is a fictional launch company built as a design and engineering demonstration." No fake customer logos, no fake press quotes, no real agency endorsement. The numbers are plausible, not claimed as real.

**Decision:** Adopted.

---

## Round 5 — Delivery and evidence

### Q21. What is the delivery shape?

**Recommendation:** One integration branch, one tracer ticket per vertical slice, PRs with the `/pr` template and attached evidence (screenshots, test output), a final integration PR into `main`, an automatic GitHub Pages deploy, and a README with a live link and a representative hero screenshot.

**Decision:** Adopted.

### Q22. What is the definition of done?

**Recommendation:** The checklist below. If any line is false, the project is not done.

- [ ] Five acts are distinguishable in the 3D scene and in the DOM.
- [ ] Ignition produces flame, smoke, light, and camera shake.
- [ ] Stage separation is visible and narrated.
- [ ] Orbit produces the Earth limb and the orbital sunrise.
- [ ] At least ten GSAP plugins are used with named jobs.
- [ ] Hero, manifesto, vehicle, launch, ascent, orbit, manifest, and contact content is complete.
- [ ] Mobile layout works at 360 px without horizontal overflow.
- [ ] Reduced motion and WebGL-off tell the same story.
- [ ] Keyboard-only navigation reaches every interactive element.
- [ ] Unit and E2E suites pass in CI.
- [ ] GitHub Pages is live from `main`.
- [ ] README includes the live link and a screenshot.
- [ ] No open issues or PRs remain without a written reason.

**Decision:** Adopted as the release gate.

---

## Tensions we chose not to resolve

- **Cinematic ambition vs. bundle size.** Three.js and GSAP together are not tiny. We accept a ~300 KB gzipped initial payload, but not a 1 MB one. No post-processing composer; glow is additive geometry.
- **Scroll length vs. patience.** The story is long enough to breathe (roughly 8–10 viewport heights), but no act overstays. Skip links let a visitor jump to the ask.
- **Fiction vs. credibility.** We keep the copy restrained and mark the fiction in the footer rather than inventing customers.

## Assumptions

- Desktop Chromium, Firefox, Safari 17+; mobile Safari 16+ and Chrome Android.
- No CMS, no analytics, no backend. The contact form is a `mailto:` handoff.
- Fonts are loaded from Google Fonts with `display=swap` and robust local fallbacks.
- GitHub Pages is served from a project subpath; the build uses a relative base.
- The site is a static Vite build with no client-side router.
