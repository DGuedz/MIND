#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: encode-mobile-hero.sh <input-video> <output-dir> <base-name> [poster-width]" >&2
  exit 2
fi

INPUT="$1"
OUT_DIR="$2"
BASE="$3"
POSTER_WIDTH="${4:-960}"

mkdir -p "$OUT_DIR"

ffmpeg -y -i "$INPUT" -map_metadata -1 \
  -vf "select=eq(n\\,0),scale=${POSTER_WIDTH}:-1" \
  -frames:v 1 -update 1 -q:v 3 \
  "$OUT_DIR/${BASE}-poster.jpg"

ffmpeg -y -i "$INPUT" -map_metadata -1 \
  -c:v libsvtav1 -preset 6 -crf 34 \
  -pix_fmt yuv420p -movflags +faststart -an \
  "$OUT_DIR/${BASE}-mobile-av1.mp4"

ffmpeg -y -i "$INPUT" -map_metadata -1 \
  -c:v libx265 -preset slow -crf 26 \
  -tag:v hvc1 -pix_fmt yuv420p \
  -movflags +faststart -an \
  "$OUT_DIR/${BASE}-mobile-hevc.mp4"

ffmpeg -y -i "$INPUT" -map_metadata -1 \
  -c:v libx264 -preset slow -crf 24 \
  -pix_fmt yuv420p -movflags +faststart -an \
  "$OUT_DIR/${BASE}-fallback-h264.mp4"

ffmpeg -y -i "$INPUT" -map_metadata -1 \
  -c:v libx265 -preset medium -crf 24 \
  -tag:v hvc1 -pix_fmt yuv420p \
  -x265-params "keyint=1:min-keyint=1:scenecut=0" \
  -movflags +faststart -an \
  "$OUT_DIR/${BASE}-scrub-hevc.mp4"

du -h "$OUT_DIR/${BASE}-poster.jpg" \
  "$OUT_DIR/${BASE}-mobile-av1.mp4" \
  "$OUT_DIR/${BASE}-mobile-hevc.mp4" \
  "$OUT_DIR/${BASE}-fallback-h264.mp4" \
  "$OUT_DIR/${BASE}-scrub-hevc.mp4"
