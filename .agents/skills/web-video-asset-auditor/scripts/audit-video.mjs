#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";

const input = process.argv[2];
if (!input) {
  console.error("Usage: audit-video.mjs <video-file>");
  process.exit(2);
}

function ffprobe(args) {
  return execFileSync("ffprobe", ["-v", "error", ...args, input], { encoding: "utf8" });
}

function parseRate(rate) {
  if (!rate || rate === "0/0") return null;
  const [a, b] = rate.split("/").map(Number);
  return b ? a / b : a;
}

const json = JSON.parse(ffprobe([
  "-show_entries",
  "format=duration,size,bit_rate:format_tags:stream=index,codec_type,codec_name,codec_tag_string,width,height,pix_fmt,avg_frame_rate,r_frame_rate,nb_frames,duration,bit_rate:stream_tags",
  "-of",
  "json",
]));

const video = (json.streams || []).find((s) => s.codec_type === "video") || {};
let keyframes = null;
let totalFrames = video.nb_frames ? Number(video.nb_frames) : null;
try {
  const frames = ffprobe([
    "-select_streams",
    "v:0",
    "-show_frames",
    "-show_entries",
    "frame=key_frame",
    "-of",
    "csv=p=0",
  ])
    .trim()
    .split(/\n+/)
    .filter(Boolean);
  keyframes = frames.filter((line) => line.startsWith("1")).length;
  totalFrames = frames.length || totalFrames;
} catch (_) {
  keyframes = null;
}

const pixFmt = video.pix_fmt || "";
const tags = { ...(json.format?.tags || {}), ...(video.tags || {}) };
const metadataKeys = Object.keys(tags);
const alphaLikely = /(^|[^a-z])(yuva|rgba|argb|bgra|ya)/i.test(pixFmt) || /alpha/i.test(metadataKeys.join(" "));
const sizeBytes = Number(json.format?.size || statSync(input).size);
const durationSeconds = Number(video.duration || json.format?.duration || 0);
const fps = parseRate(video.avg_frame_rate) || parseRate(video.r_frame_rate);
const allKeyframes = totalFrames ? keyframes === totalFrames : false;

const recommendations = [];
if (!allKeyframes) recommendations.push("For scroll scrub, create an all-intra/keyframe-dense variant.");
if (alphaLikely) recommendations.push("Preserve transparent compositing; do not add background boxes behind the video.");
if (sizeBytes > 3000000) recommendations.push("Create a mobile codec ladder and poster before first-viewport use.");
if (metadataKeys.length) recommendations.push("Strip production metadata with -map_metadata -1.");

console.log(JSON.stringify({
  input,
  codec: video.codec_name || null,
  codecTag: video.codec_tag_string || null,
  width: video.width || null,
  height: video.height || null,
  pixFmt,
  fps,
  durationSeconds,
  frameCount: totalFrames,
  keyframes,
  allKeyframes,
  alphaLikely,
  sizeBytes,
  bitRate: Number(video.bit_rate || json.format?.bit_rate || 0) || null,
  metadataKeys,
  recommendations,
}, null, 2));
