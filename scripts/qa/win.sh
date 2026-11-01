#!/usr/bin/env bash
# Ejecuta un comando en el Node de Windows desde WSL (node_modules se instaló en Windows).
# Uso: scripts/qa/win.sh npm run -s test
set -euo pipefail
cd "$(dirname "$0")/../.."
exec cmd.exe /d /c "cd /d C:\\dev\\Vetworld && $*"
