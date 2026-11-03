#!/usr/bin/env bash
# Aplica un diseño a la remera base con el Blender de Windows, sin abrir la interfaz.
# Los parámetros van tal cual a aplicar_diseno.py (ver su ayuda: scripts/blender/aplicar-diseno.sh --help).
set -euo pipefail
BLENDER="/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
SCRIPT="$(wslpath -w "$(dirname "$(readlink -f "$0")")/aplicar_diseno.py")"
cd /mnt/c  # el .exe de Windows no arranca bien desde una carpeta de WSL
"$BLENDER" --background --factory-startup --python-exit-code 1 --python "$SCRIPT" -- "$@"
