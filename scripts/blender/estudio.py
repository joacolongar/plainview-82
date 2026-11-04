"""Genera la luz de estudio: un entorno HDR neutro que comparten la web y los renders de Blender.

Escribe web/public/3d/estudio.hdr. Lo usan el visor 3D de la ficha (<model-viewer environment-image>) y los .blend
de cada diseño (aplicar_diseno.py lo pone como mundo), así la remera se ve igual en la web y en las imágenes.
Se corre con scripts/blender/estudio.sh (usa el numpy de Blender); solo hace falta de nuevo si se cambia la luz.

La luz "pareja" (la opción A elegida el 2026-11-03): un domo parejo con cajas grandes adelante, atrás y arriba,
gris puro (sin tintes) y el piso más oscuro. Está normalizada para que el pecho reciba una irradiancia de π: con la
vista Khronos PBR Neutral, una tela de color c se ve de color c (el cian del cartel medido: ΔE 1,5 contra el archivo).
Adelante y atrás reciben la misma luz, porque en la web la luz queda fija mientras la remera gira.
"""
import math
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parents[2]
SALIDA = RAIZ / 'web' / 'public' / '3d' / 'estudio.hdr'
W, H = 256, 128  # el entorno es liso: no hace falta más (pesa 128 KB)


def direcciones():
    """La dirección de cada píxel del equirectangular (convención de Blender: Z arriba) y su ángulo sólido."""
    u = (np.arange(W) + 0.5) / W
    v = 1 - (np.arange(H) + 0.5) / H  # la fila 0 del archivo es la de arriba
    phi, el = np.meshgrid((u - 0.5) * 2 * np.pi, (v - 0.5) * np.pi)
    d = np.stack([-np.cos(el) * np.cos(phi), np.cos(el) * np.sin(phi), np.sin(el)], -1)
    return d, np.cos(el) * (2 * np.pi / W) * (np.pi / H)


D, ANGULO = direcciones()


def caja(direccion, sigma_grados, intensidad):
    """Una caja de luz difusa: brillo que cae suave (gaussiana) alrededor de una dirección."""
    n = np.array(direccion, float)
    n /= np.linalg.norm(n)
    angulo = np.arccos(np.clip(D @ n, -1, 1))
    return intensidad * np.exp(-(angulo / math.radians(sigma_grados)) ** 2)


def irradiancia(L, normal):
    return float((np.clip(D @ np.array(normal, float), 0, None) * L * ANGULO).sum())


piso = np.where(D[..., 2] < 0, 0.55, 1.0)  # el piso del estudio devuelve menos luz que el techo
L = piso + caja((0, -1, .35), 40, 1.2) + caja((0, 1, .35), 40, 1.2) + caja((0, 0, 1), 45, .8)
L *= math.pi / irradiancia(L, (0, -1, 0))  # la remera mira a -Y

# Formato Radiance (RGBE): cada píxel guarda R, G, B y un exponente común. Sin compresión RLE (se lee igual)
rgb = np.repeat(L[..., None], 3, -1)
mayor = rgb.max(-1)
exp = np.floor(np.log2(mayor)) + 1
rgbe = np.empty((H, W, 4), np.uint8)
rgbe[..., :3] = np.clip(rgb * (256 / np.exp2(exp))[..., None], 0, 255).astype(np.uint8)
rgbe[..., 3] = (exp + 128).astype(np.uint8)
SALIDA.parent.mkdir(parents=True, exist_ok=True)
SALIDA.write_bytes(b'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n' + f'-Y {H} +X {W}\n'.encode() + rgbe.tobytes())
print('ESTUDIO', SALIDA, f'{SALIDA.stat().st_size} bytes', f'atrás/adelante {irradiancia(L, (0, 1, 0)) / math.pi:.2f}')
