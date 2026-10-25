# One persistent WebGL stage behind a semantic document

**Status:** accepted

Continuity is the core of the story, so the page uses a single fixed, full-viewport Three.js canvas behind a normal scrolling document rather than a canvas per section or a video. The document remains the source of meaning, navigation, and SEO; the canvas is decorative and `aria-hidden`. Per-section canvases were rejected because they break the camera illusion and multiply WebGL contexts; video was rejected because it cannot react to scroll, viewport, or motion preferences.
