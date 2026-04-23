# Auto Skill Router Enabled

This repository uses Auto Skill Router as the default execution entry point for substantial tasks.

Start here:
```bash
okto-route "Describe your task" --auto-files
```

Project playbook:
- `.agents/skills/ffmpeg-video-optimizer/SKILL.md`
- `.trae/auto-skill-router.md`

Starter prompt:
- `.trae/prompts/auto-router-kickoff.txt`

Security overlays:
- `AGENTS.md`
- `CLAUDE.md`
- `governance/PROJECT_RULES.md`
- `governance/USER_RULES.md`
- `governance/PROMPT_INJECTION_EVALS.md`

Knowledge overlays:
- `governance/SOURCE_KNOWLEDGE_BASE.md`
- `governance/SOURCE_REGISTRY.json`
