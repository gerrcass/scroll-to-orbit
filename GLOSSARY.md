# HALCYON / Vesper-01

The shared language of the scroll-to-orbit landing page: the story, the scene, and the systems that keep them synchronized.

## Mission story

**Act**:
One of the five narrative chapters — Pad, Ignition, Ascent, Separation, Orbit — each owning a contiguous range of scene progress and a labelled block of the document.
_Avoid_: Scene, slide, step

**Vesper-01**:
The fictional first night flight of Kestrel, carrying a small satellite stack to sun-synchronous orbit from Pad 09.
_Avoid_: Launch #1, demo mission

**Kestrel**:
Halcyon's fictional two-stage, reusable small-lift launch vehicle.
_Avoid_: Rocket, ship, vehicle (when the specific vehicle is meant)

**Pad 09**:
The fictional Atlantic Range launch complex where Vesper-01 flies.
_Avoid_: Site, base

**Launch window**:
The specific future instant when Vesper-01 is scheduled to lift off; the page's live countdown target.
_Avoid_: Launch date, T-zero

**Manifest**:
The published list of upcoming Halcyon missions and their orbit profiles.
_Avoid_: Schedule, calendar

**Manifesto**:
The short editorial statement of Halcyon's operating thesis, not the launch manifest.
_Avoid_: About section

**Night shift**:
The brand idea that Halcyon serves the quiet, continuous infrastructure of orbit rather than spectacle.
_Avoid_: Use case, vertical

## Scene and motion

**Scene progress**:
A normalized 0–1 value produced by the Story Director that selects the camera key, vehicle state, particles, and article visibility for the whole page.
_Avoid_: Scroll percentage, scrollY

**Story Director**:
The façade that converts scroll and motion preferences into scene progress, act, and a telemetry snapshot. The single test seam.
_Avoid_: Controller, manager

**Camera key**:
A sampled position, look target, field of view, and roll that the camera interpolates toward for a given scene progress.
_Avoid_: Waypoint, keyframe

**Act rail**:
The fixed navigational list of acts with a moving progress indicator; a real navigation landmark, not decoration.
_Avoid_: Progress bar, dots

**Telemetry**:
The mission readouts — mission clock, altitude, velocity, downrange distance, throttle, and stage — derived from scene progress.
_Avoid_: Data, stats

**Mission clock**:
The T-minus / T-plus time display around launch.
_Avoid_: Timer, countdown (the countdown is the pre-launch sequence)

**Full motion**:
The default experience: smooth scrolling, scroll-linked camera, parallax, and ambient animation.
_Avoid_: Normal mode

**Reduced motion**:
The accessible experience selected by the OS preference or the in-page toggle: no scroll-linked camera, no parallax or marquee, static act stills, and instantly visible content.
_Avoid_: Fallback mode

**WebGL fallback**:
The designed no-WebGL experience: a CSS/SVG night-sky poster, the same copy, and static telemetry.
_Avoid_: Error state

**Evidence shot**:
A Playwright-captured screenshot of a named act at a fixed viewport, committed as proof and attached to the PR.
_Avoid_: Screenshot (when evidence is meant)

## Delivery

**Tracer ticket**:
A narrow, complete vertical slice of the page that is demoable on its own and sized for one fresh agent.
_Avoid_: Task, subtask

**Integration branch**:
The long-lived branch that accumulates completed tickets before the final review and merge to `main`.
_Avoid_: Develop, staging

**Release gate**:
The definition-of-done checklist that must be fully true before the integration branch merges.
_Avoid_: Acceptance criteria (that is per-ticket)
