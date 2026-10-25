# Progressive enhancement is a release gate

**Status:** accepted

Reduced motion and WebGL-off are treated as first-class art directions, not graceful failures, and both are exercised by automated tests before merge. The page must tell the complete Vesper-01 story and expose every conversion path with the canvas absent and with all scroll-linked motion disabled. The cost is extra DOM and a second visual composition; the benefit is that the page is usable by people who cannot or will not run the cinematic layer, and the content survives a broken GPU driver.
