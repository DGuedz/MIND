---
name: video-motion-factory
description: "Use when planning or executing end-to-end web video motion work: 3D hero videos, transparent overlays, scroll scrub, mouse-activated playback, mobile-first responsive video, FFmpeg pipelines, smooth transitions, and autonomous-agent quality gates."
---

# Video Motion Factory

Factory router for production web video motion. It turns a raw 3D/video asset into a verified mobile-first experience.

## Use This Stack

1. `web-video-asset-auditor`: inspect the source with `ffprobe` before coding.
2. `ffmpeg-mobile-codec-ladder`: create poster, AV1, HEVC, H.264 fallback, and scrub variants.
3. `transparent-video-compositor`: preserve alpha/transparent background and layer text correctly.
4. `scroll-scrub-video-choreographer`: wire scroll, mouse, hover, and timeline behavior.
5. `mobile-video-render-qa`: verify build, routes, assets, screenshots, and mobile behavior.
6. `three-d-motion-video-director`: use when the source asset itself must be art-directed or regenerated.

## Operating Contract

- Do not claim "smooth", "ready", or "mobile-first" without route and render evidence.
- Do not put boxes, cards, dark panels, or artificial backgrounds behind transparent video unless explicitly requested.
- For scroll scrub, prefer all-intra/keyframe-dense assets or canvas frame sequences.
- For normal autoplay/hover video, prefer smaller interframe assets.
- Keep source provenance explicit: FFmpeg is the canonical multimedia toolchain; use local `ffmpeg`/`ffprobe` output as evidence.
- Treat mobile as the default target: small bytes, no layout shift, poster first, no text overlap, no forced desktop-only interactions.

## Definition Of Done

- Asset audit JSON exists or key findings are recorded.
- Encoded ladder exists and sizes are reported.
- DOM integration uses browser-supported codecs and fallbacks.
- Transparency/layering behavior matches the creative direction.
- Build passes.
- Local route returns `200`.
- Critical video/poster paths return `200`.
- At least one mobile viewport and one desktop viewport are visually checked when feasible.

## Reference

Read `references/pipeline.md` when a task spans more than one skill or when an agent needs the exact handoff order.
