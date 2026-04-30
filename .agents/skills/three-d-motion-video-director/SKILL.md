---
name: three-d-motion-video-director
description: "Use when designing, regenerating, or specifying 3D animated video assets for web hero sections, transparent overlays, product objects, scroll reveals, and mobile-first interactive motion before FFmpeg encoding or frontend integration."
---

# 3D Motion Video Director

Use before encoding when the source asset is still negotiable or needs art-direction fixes.

## Asset Brief

Specify:

- aspect ratio targets: mobile 9:16, desktop 16:9 or safe central 1:1 subject;
- subject safe area: central 60 percent width for mobile;
- background: transparent alpha or full-bleed, never ambiguous;
- camera: slow, readable, no micro-jitter;
- loop: exact loop or one-shot reveal;
- interaction: scroll scrub, hover activation, autoplay, or mouse timeline;
- text collision zones: where words may sit under or around the object.

## Quality Requirements

- 24-30 fps for normal web motion.
- 60 fps only if interaction needs it and byte budget allows.
- Clean edges for alpha; no dark halo if composited over black.
- No tiny UI text baked into video unless it remains readable on mobile.
- Leave 10-15 percent top/bottom safe margin for mobile browser chrome.

## Handoff To FFmpeg

Request a high-quality master first, then encode derivatives. Do not optimize the only source copy.

Recommended master:

- ProRes 4444 or PNG/WebP sequence for alpha.
- ProRes 422 HQ or high-bitrate H.264/HEVC for opaque video.
- Keep duration under 6 seconds for first-viewport hero unless there is a hard reason.

## Handoff To Frontend

Tell the integrator whether the video is:

- transparent overlay;
- full background;
- scrub-controlled;
- hover/mouse activated;
- decorative only.
