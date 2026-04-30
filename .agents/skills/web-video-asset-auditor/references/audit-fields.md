# Audit Fields

- `codec`: video codec from ffprobe.
- `pixFmt`: pixel format. Formats containing `yuva`, `argb`, `rgba`, or `bgra` usually indicate alpha.
- `fps`: approximate frames per second.
- `keyframes`: count of key frames sampled by ffprobe.
- `allKeyframes`: true when every reported frame is a keyframe.
- `metadataKeys`: top-level container metadata. Export-app fields should be stripped in production encodes.
- `recommendations`: agent actions derived from evidence.
