---
name: transparent-video-compositor
description: "Use when a video has or needs a transparent background/alpha layer and must interact with text, 3D objects, scroll, hover, or mouse activation without visible boxes, panels, black mats, or broken compositing."
---

# Transparent Video Compositor

Use this when the visual effect depends on the video being transparent over typography or scene content.

## Non-Negotiables

- Do not add `bg-black`, cards, panels, borders, or opaque wrappers behind the video unless requested.
- The page/section may be black; the video wrapper must remain transparent when the creative requires it.
- Text under the video should fade, dim, blur, or desaturate by timeline. It should not be hidden by a fake box.
- Preserve `pointer-events-none` on decorative video layers unless the video itself is the control.
- Use `isolation: isolate` only when blend/filter leakage is a problem, not as a substitute for real layer design.

## Layer Pattern

```tsx
<section className="relative bg-black overflow-hidden">
  <motion.div className="absolute inset-0 z-20 pointer-events-none" style={{ opacity: videoOpacity }}>
    <video className="h-full w-full object-contain" muted playsInline preload="auto" />
  </motion.div>

  <motion.div className="relative z-10" style={{ opacity: copyOpacity }}>
    {/* words intentionally live under transparent video */}
  </motion.div>
</section>
```

## Browser Reality

- WebM VP9 alpha is the practical Chromium/Firefox path.
- HEVC alpha can work on Safari/iOS when encoded and tagged correctly, but must be tested on target devices.
- MP4 AV1/H.264 alpha is not a safe generic web assumption.
- If alpha support is uncertain, use image sequence/canvas or layered PNG/WebP frames.

## Evidence Gate

Before final response, verify:

- wrapper has no opaque background class;
- video asset path returns `200`;
- copy opacity timeline reaches low opacity before the video visually crosses it;
- mobile viewport does not crop the transparent subject unexpectedly.
