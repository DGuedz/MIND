---
name: scroll-scrub-video-choreographer
description: "Use to implement or fix scroll-driven, mouse-driven, hover-activated, or timeline-synced web video motion in React/Vite/Next/vanilla sites with Framer Motion, requestAnimationFrame, currentTime scrub, canvas frame sequences, responsive layout, and smooth transitions."
---

# Scroll Scrub Video Choreographer

This skill owns choreography: when video moves, when words fade, and how scroll/mouse controls time.

## Interaction Choice

- Scroll scrub: `useScroll`/IntersectionObserver + `requestAnimationFrame` + all-intra video or frames.
- Mouse activation: pointer enter starts playback or maps pointer position to timeline.
- Hover reveal: preload metadata/poster, play short optimized loop on hover, pause/reset on leave.
- Precision frame control: canvas sequence beats `<video currentTime>` when browsers lag.

## React Pattern

```tsx
const videoRef = useRef<HTMLVideoElement>(null);
const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
const videoProgress = useTransform(scrollYProgress, [0.2, 1], [0, 1], { clamp: true });

useMotionValueEvent(videoProgress, "change", (p) => {
  const video = videoRef.current;
  if (!video?.duration) return;
  requestAnimationFrame(() => {
    video.currentTime = p * video.duration;
  });
});
```

## Layer Timing

- Copy can sit below transparent video.
- Fade copy before the video crosses text-heavy regions.
- Keep scroll affordances above both layers only if they remain readable.
- Avoid negative z-index; use explicit section-local stacking.

## Mobile Rules

- Do not rely on hover only.
- Provide tap/scroll alternative.
- Use `playsInline`, `muted`, and stable dimensions.
- Use `object-contain` for transparent product/3D objects; use `object-cover` for full-bleed photographic footage.
- Do not scale text with viewport width.

## Handoff

After implementation, send to `mobile-video-render-qa`.
