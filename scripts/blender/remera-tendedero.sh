#!/usr/bin/env bash
# Simula la remera colgada de dos broches (la del tendedero de la portada) y guarda modelos/remera-tendedero.blend.
# No toca modelos/remera-base.blend. Tarda unos 3 minutos; solo se vuelve a correr si cambia la forma.
set -euo pipefail
BLENDER="/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
AQUI="$(dirname "$(readlink -f "$0")")"
SCRIPT="$(wslpath -w "$AQUI/remera_base.py")"
MODELOS="$(wslpath -w "$AQUI/../../modelos")"
cd /mnt/c  # el .exe de Windows no arranca bien desde una carpeta de WSL
"$BLENDER" --background --factory-startup --python-exit-code 1 --python "$SCRIPT" -- "$MODELOS" "$MODELOS" norender tendedero
