---
name: mobile-video-render-qa
description: "Use after video/motion frontend changes to verify mobile-first rendering: Vite/Next build, route bodies, video/poster HTTP status, desktop/mobile screenshots, nonblank video/canvas, no text overlap, no layout shift, and responsive smoothness evidence."
---

# Mobile Video Render QA

Do not trust build success alone. Verify the actual route and media paths.

## Required Checks

1. Build or typecheck.
2. Start local preview/dev server.
3. Check `/` and target route return `200`.
4. Check video and poster paths return `200`.
5. Inspect one mobile viewport and one desktop viewport.
6. If browser automation fails, report that limitation instead of claiming visual success.

## HTTP Check

```bash
node .agents/skills/mobile-video-render-qa/scripts/check-video-routes.mjs http://localhost:5177 / /hero-poster.jpg /hero-mobile-av1.mp4
```

## Visual Pass Criteria

- no visible boxes behind transparent video unless requested;
- no clipped headline fragments during transition;
- video/canvas nonblank;
- scroll/tap affordance visible on mobile;
- text stays inside containers;
- no route-level 404;
- no console media errors if browser automation is available.

## CloudDocs Note

In this repo, Vite can listen while GET routes hang if iCloud has dataless dependency files. For validation-critical checks, copy the landing app to `/tmp`, reinstall, and run the server there.
