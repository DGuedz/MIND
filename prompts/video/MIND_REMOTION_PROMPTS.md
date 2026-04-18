# MIND Remotion Prompts (TRAE)

## Prompt 0 - Project init
Create a Remotion project (1920x1080, 30fps, 60s) in `video/remotion/`. Use a dark, technical style. Provide `npm run dev` and `npm run render` instructions.

## Prompt 1 - Scene 1 (Intro terminal)
Create SceneIntro with a terminal window and typewriter animation:
- Text: `pnpm jupiter:frontier:phase2`
- Subtitle: `MIND: secure intent rail`
Duration: 6s.

## Prompt 2 - Scene 2 (Phase2 summary)
Create ScenePhase2Summary showing `assets/video/shot_02_phase2_summary.png`.
Add highlight boxes over `status` and `mocked` fields.
Duration: 10s.

## Prompt 3 - Scene 3 (Policy-ready context)
Create ScenePolicyContext showing `assets/video/shot_03_policy_ready.png`.
Highlight `suggestedMaxSlippageBps`, `riskBufferBps`, `mevRiskScore`.
Duration: 10s.

## Prompt 4 - Scene 4 (Integration test)
Create SceneIntegrationTest with `assets/video/shot_04_integration_test.png`.
Animate a subtle zoom-in and show step labels:
- `enrich` -> `intent` -> `policy`
Duration: 10s.

## Prompt 5 - Scene 5 (Integration report)
Create SceneIntegrationReport with `assets/video/shot_05_integration_report.png`.
Highlight `pass=true` and the 3 steps list.
Duration: 10s.

## Prompt 6 - Scene 6 (Policy reasons)
Create ScenePolicyReasons with `assets/video/shot_06_policy_reasons.png`.
Highlight `high_mev_risk` in the reasons array.
Duration: 10s.

## Prompt 7 - Scene 7 (CTA)
Create SceneOutro with logos `logo_mind.png` and `logo_jupiter.png`.
Text: `Artifacts + DX report attached.`
Duration: 4s.

## Assembly prompt
Assemble all scenes in sequence with smooth fades. Total duration: 60s.
