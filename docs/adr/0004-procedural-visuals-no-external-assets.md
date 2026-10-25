# Procedural visuals, no external 3D or image assets

**Status:** accepted

Every visual in the scene is generated at runtime from primitives, canvas textures, and shaders; the only network asset is the font stylesheet. This keeps the repo self-contained, makes the page reproducible offline, and avoids licensing ambiguity for a public demo. The trade-off is that the rocket's surface detail is impressionistic rather than photoreal, which suits the editorial art direction and the performance budget.
