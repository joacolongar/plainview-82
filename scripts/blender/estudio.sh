#!/usr/bin/env bash
# Genera la luz de estudio (web/public/3d/estudio.hdr) con el Blender de Windows, sin abrir la interfaz.
set -euo pipefail
BLENDER="/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
SCRIPT="$(wslpath -w "$(dirname "$(readlink -f "$0")")/estudio.py")"
cd /mnt/c  # el .exe de Windows no arranca bien desde una carpeta de WSL
"$BLENDER" --background --factory-startup --python-exit-code 1 --python "$SCRIPT"
