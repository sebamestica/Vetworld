#!/usr/bin/env bash
# Copia las skills canónicas (.agents/skills) a .claude/skills para que Claude Code las descubra.
# .claude/skills es generado e ignorado por Git; editar siempre .agents/skills.
set -euo pipefail
cd "$(dirname "$0")/../.."
rm -rf .claude/skills && mkdir -p .claude/skills
for d in .agents/skills/*/ .agents/skills/vendor/*/; do
  [ -f "$d/SKILL.md" ] || continue
  cp -r "$d" ".claude/skills/$(basename "$d")"
done
ls .claude/skills | wc -l
