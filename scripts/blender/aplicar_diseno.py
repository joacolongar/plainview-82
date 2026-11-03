"""Aplica un diseño a la remera base: color de tela + una o más estampas, horneadas en una sola textura.

Abre modelos/remera-base.blend (no la modifica ni vuelve a simular), arma la textura de color base y guarda
modelos/disenos/<nombre>/remera-<nombre>.blend y .glb. Se corre con scripts/blender/aplicar-diseno.sh:

    scripts/blender/aplicar-diseno.sh --nombre <nombre> --color '#1a1a1a' \\
        --estampa frente <imagen> <ancho cm> <cm debajo del escote> <cm al costado> [--estampa ...]

- Las rutas de las imágenes son relativas a la raíz del repo (o absolutas de Windows). PNG o WEBP, con transparencia.
- <cm debajo del escote>: del centro del escote (el de adelante para el frente, el de atrás para la espalda) al borde
  de arriba de la estampa, medido sobre la tela.
- <cm al costado>: del centro de la remera al centro de la estampa; positivo es a la derecha de quien mira
  ese lado de la remera (de frente para el frente, de espaldas para la espalda).
- El alto sale de las proporciones de la imagen: nunca se estira.

Cómo se hornea: las UV de frente y espalda son la tela aplanada, sin deformar (lo mide remera_base.py), así que una
estampa de N cm es un rectángulo de N cm en la textura. Se pinta la textura del color de la tela y cada imagen se
compone encima respetando su transparencia, en los mismos valores sRGB del archivo (los colores no cambian).
El material queda con un solo nodo de imagen en Base Color: sin nodos Mix.
"""
import argparse
import os
import re
import sys
from pathlib import Path

import bpy
import numpy as np

RAIZ = Path(__file__).resolve().parents[2]
BASE = RAIZ / 'modelos' / 'remera-base.blend'
LIMITE_GLB = 3 * 1024 * 1024
RESOLUCIONES = (4096, 2048)  # la primera que deje el .glb debajo de 3 MB
SUBMUESTRAS = 4              # por lado, al achicar la imagen: promedia en vez de saltear píxeles

p = argparse.ArgumentParser(prog='aplicar-diseno.sh', description=__doc__.split('\n')[0])
p.add_argument('--nombre', required=True, help='nombre de la carpeta: minúsculas, números y guiones')
p.add_argument('--color', required=True, help="color de la tela, '#rrggbb'")
p.add_argument('--estampa', nargs=5, action='append', default=[],
               metavar=('LUGAR', 'IMAGEN', 'ANCHO_CM', 'DEBAJO_CM', 'COSTADO_CM'),
               help='frente o espalda, imagen, ancho, cm debajo del escote, cm al costado (repetible)')
p.add_argument('--rugosidad', type=float, default=0.9)
p.add_argument('--brillo', type=float, default=0.18, help='color del sheen (gris, 0 a 1)')
args = p.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


def error(texto):
    print(f'ERROR: {texto}', file=sys.stderr)
    sys.exit(1)


if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', args.nombre):
    error(f'nombre inválido: {args.nombre!r} (minúsculas, números y guiones)')
m = re.fullmatch(r'#?([0-9a-fA-F]{6})', args.color)
if not m:
    error(f"color inválido: {args.color!r} (tiene que ser '#rrggbb')")
TELA = np.array([int(m.group(1)[i:i + 2], 16) / 255 for i in (0, 2, 4)])  # sRGB, como los PNG
if not BASE.exists():
    error(f'no está la base: {BASE} (se genera con remera_base.py)')

ESTAMPAS = []
for lugar, imagen, ancho, debajo, costado in args.estampa:
    if lugar not in ('frente', 'espalda'):
        error(f'lugar inválido: {lugar!r} (frente o espalda)')
    ruta = Path(imagen) if Path(imagen).is_absolute() else RAIZ / imagen
    if not ruta.is_file():
        error(f'no encuentro la imagen: {ruta}')
    try:
        ancho, debajo, costado = float(ancho), float(debajo), float(costado)
    except ValueError:
        error(f'ancho, debajo y costado tienen que ser números (en cm): {imagen}')
    if ancho <= 0 or debajo < 0:
        error(f'ancho > 0 y debajo >= 0: {imagen}')
    ESTAMPAS.append((lugar, ruta, ancho / 100, debajo / 100, costado / 100))

bpy.ops.wm.open_mainfile(filepath=str(BASE))
bpy.context.preferences.filepaths.save_version = 0  # sin remera-<nombre>.blend1
remera = bpy.data.objects['Remera']
MAPA = remera['mapa_uv'].to_dict()


def leer(ruta):
    """Píxeles RGBA de la imagen, de arriba hacia abajo, en los valores del archivo (sRGB, alfa sin premultiplicar)."""
    img = bpy.data.images.load(str(ruta))
    img.alpha_mode = 'STRAIGHT'
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    bpy.data.images.remove(img)
    return px.reshape(h, w, 4)[::-1]  # Blender guarda la fila de abajo primero


def muestrear(fuente, ancho_px, alto_px, x0, y0):
    """La imagen achicada (o agrandada) a un rectángulo de ancho_px x alto_px que arranca en (x0, y0), en píxeles
    fraccionarios de la textura: promedio de SUBMUESTRAS² puntos bilineales por píxel, con el color premultiplicado."""
    h, w = fuente.shape[:2]
    pre = fuente.copy()
    pre[..., :3] *= pre[..., 3:4]
    ix0, iy0 = int(np.floor(x0)), int(np.floor(y0))
    ix1, iy1 = int(np.ceil(x0 + ancho_px)), int(np.ceil(y0 + alto_px))
    acum = np.zeros((iy1 - iy0, ix1 - ix0, 4))
    for sy in range(SUBMUESTRAS):
        for sx in range(SUBMUESTRAS):
            cx = np.arange(ix0, ix1) + (sx + 0.5) / SUBMUESTRAS
            cy = np.arange(iy0, iy1) + (sy + 0.5) / SUBMUESTRAS
            fx = (cx - x0) / ancho_px * w - 0.5
            fy = (cy - y0) / alto_px * h - 0.5
            dentro_x = (cx >= x0) & (cx < x0 + ancho_px)
            dentro_y = (cy >= y0) & (cy < y0 + alto_px)
            fx = np.clip(fx, 0, w - 1)
            fy = np.clip(fy, 0, h - 1)
            x_a = np.floor(fx).astype(int)
            y_a = np.floor(fy).astype(int)
            x_b, y_b = np.minimum(x_a + 1, w - 1), np.minimum(y_a + 1, h - 1)
            tx, ty = (fx - x_a)[None, :, None], (fy - y_a)[:, None, None]
            arriba = pre[y_a][:, x_a] * (1 - tx) + pre[y_a][:, x_b] * tx
            abajo = pre[y_b][:, x_a] * (1 - tx) + pre[y_b][:, x_b] * tx
            valor = arriba * (1 - ty) + abajo * ty
            acum += valor * (dentro_y[:, None] & dentro_x[None, :])[..., None]
    return acum / SUBMUESTRAS ** 2, ix0, iy0


def hornear(res):
    """La textura de color base (filas de arriba hacia abajo): la tela y las estampas encima."""
    tex = np.empty((res, res, 3))
    tex[...] = TELA
    informe = []
    for lugar, ruta, ancho, debajo, costado in ESTAMPAS:
        mapa = MAPA[lugar]
        fuente = leer(ruta)
        alto = ancho * fuente.shape[0] / fuente.shape[1]
        # dentro de la tela del frente o de la espalda (sin pasar el ruedo ni el doblez del costado)
        if abs(costado) + ancho / 2 > mapa['medio_ancho'] - 0.01:
            error(f'{ruta.name}: se sale por el costado ({abs(costado) * 100 + ancho * 50:.1f} cm del centro, '
                  f'máximo {mapa["medio_ancho"] * 100 - 1:.0f})')
        if debajo + alto > mapa['escote_a_ruedo'] - 0.005:
            error(f'{ruta.name}: se pasa del ruedo ({(debajo + alto) * 100:.1f} cm debajo del escote, '
                  f'máximo {mapa["escote_a_ruedo"] * 100 - 0.5:.1f})')
        s = mapa['uv_por_metro']
        u_izq = mapa['u_centro'] + (costado - ancho / 2) * s
        v_arriba = mapa['v_escote'] - debajo * s
        x0, y0 = u_izq * res, (1 - v_arriba) * res  # en píxeles, con y para abajo
        capa, ix0, iy0 = muestrear(fuente, ancho * s * res, alto * s * res, x0, y0)
        zona = tex[iy0:iy0 + capa.shape[0], ix0:ix0 + capa.shape[1]]
        zona[...] = capa[..., :3] + zona * (1 - capa[..., 3:4])
        informe.append(f'{lugar}: {ruta.name} {ancho * 100:.1f} x {alto * 100:.1f} cm, '
                       f'{ancho * s * res:.0f} x {alto * s * res:.0f} px')
    return tex, informe


def material(img):
    mat = bpy.data.materials.new(f'Remera {args.nombre}')
    mat.use_nodes = True
    nodos = mat.node_tree.nodes
    bsdf = next(n for n in nodos if n.type == 'BSDF_PRINCIPLED')
    imagen = nodos.new('ShaderNodeTexImage')
    imagen.image = img
    imagen.location = (bsdf.location.x - 350, bsdf.location.y)
    mat.node_tree.links.new(imagen.outputs['Color'], bsdf.inputs['Base Color'])
    # el glTF exporta el sheen como el color del tinte (no tiene peso): con peso 1, Blender y la web se ven igual
    for nombre, valor in [('Metallic', 0.0), ('Roughness', args.rugosidad), ('Sheen Weight', 1.0),
                          ('Sheen Roughness', 0.5), ('Sheen Tint', (args.brillo, args.brillo, args.brillo, 1))]:
        bsdf.inputs[nombre].default_value = valor
    return mat


carpeta = RAIZ / 'modelos' / 'disenos' / args.nombre
carpeta.mkdir(parents=True, exist_ok=True)
ruta_glb = carpeta / f'remera-{args.nombre}.glb'
for res in RESOLUCIONES:
    tex, informe = hornear(res)
    img = bpy.data.images.new(f'remera-{args.nombre}-color', res, res, alpha=False)
    rgba = np.ones((res, res, 4), dtype=np.float32)
    rgba[..., :3] = np.clip(tex[::-1], 0, 1)
    img.pixels.foreach_set(rgba.ravel())
    img.file_format = 'PNG'
    img.pack()
    mat = material(img)
    remera.data.materials.clear()
    remera.data.materials.append(mat)
    for o in bpy.context.view_layer.objects:
        o.select_set(o is remera)
    bpy.context.view_layer.objects.active = remera
    bpy.ops.export_scene.gltf(filepath=str(ruta_glb), export_format='GLB', use_selection=True, export_apply=True,
                              export_cameras=False, export_lights=False, export_materials='EXPORT',
                              export_image_format='AUTO', export_yup=True)
    peso = ruta_glb.stat().st_size
    if peso < LIMITE_GLB or res == RESOLUCIONES[-1]:
        break
    print(f'{res} px: el .glb pesa {peso / 1024 / 1024:.2f} MB, pruebo más chico')
    bpy.data.materials.remove(mat)
    bpy.data.images.remove(img)

bpy.ops.wm.save_as_mainfile(filepath=str(carpeta / f'remera-{args.nombre}.blend'))
print('DISEÑO', args.nombre, f'textura {res} px', f'glb {peso} bytes ({peso / 1024:.0f} KB)', *informe, sep='\n  ')
if peso >= LIMITE_GLB:
    error(f'el .glb pesa {peso / 1024 / 1024:.2f} MB, más que 3 MB aun con {res} px')
