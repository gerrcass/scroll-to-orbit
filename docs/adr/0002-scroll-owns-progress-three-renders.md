# Scroll owns story progress; Three.js only renders

**Status:** accepted

GSAP ScrollTrigger produces one normalized scene progress and a Story Director translates it into an act and a telemetry snapshot. Three.js reads that snapshot each frame and never listens to scroll, so the narrative state can be unit-tested without a browser, and the rendering layer can be replaced without rewriting the story. A tighter coupling — ScrollTrigger callbacks mutating Three.js objects directly — was rejected because it would make the mission model untestable and the scene impossible to reason about during review.
