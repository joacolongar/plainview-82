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

La escena queda con la luz de estudio de la web (web/public/3d/estudio.hdr, de estudio.py) como mundo, la vista
Khronos PBR Neutral (la misma curva que usa el visor de la web) y un piso que solo junta la sombra: un render del
.blend se ve igual que la remera en la ficha. El comando queda guardado en modelos/disenos/<nombre>/aplicar.sh.

Con --web, además exporta web/public/3d/<nombre>.glb para el visor de la ficha: textura de 2048 en WebP (la de 4096
ocupa unos 64 MB en la memoria del celular) y la malla comprimida con Draco. Y la imagen fija del frente,
web/public/3d/<nombre>-frente.webp: el render de Cycles con la cámara del visor (web/src/data/camara3d.json), la misma
luz y fondo transparente; se ve mientras carga el 3D y queda si el navegador no puede mostrarlo. Y muestra dónde van los puntos de la Fe de
erratas: una posición al lado de cada estampa (en metros, con Y arriba, como el glTF) y hacia dónde mira esa cara.
También la remera del tendedero de la portada, web/public/portada/<nombre>-colgada.webp: la misma remera con la forma
colgada de dos broches (modelos/remera-tendedero.blend, de scripts/blender/remera-tendedero.sh), de frente, con cámara
ortográfica (todas a la misma escala), la misma luz y fondo transparente. Dónde caen los broches en la imagen lo escribe
en web/src/data/tendedero.json: la portada dibuja ahí los broches de madera.

Con --vuelta, la remera de tapa de la portada (web/src/data/tapa.json): una vuelta entera en Cycles (4 muestras con el
denoiser: con más no se nota la diferencia y tarda el triple), cada cuadro sobre el fondo liso de la foto, codificada en
H.264 con el FFmpeg de Blender (web/public/portada/<nombre>-vuelta.mp4) y su primer cuadro como imagen fija
(<nombre>-vuelta.webp). Tarda unos 25 minutos.
"""
import argparse
import json
import math
import os
import re
import shlex
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

RAIZ = Path(__file__).resolve().parents[2]
BASE = RAIZ / 'modelos' / 'remera-base.blend'
LIMITE_GLB = 3 * 1024 * 1024
RESOLUCIONES = (4096, 2048)  # la primera que deje el .glb debajo de 3 MB
ESTUDIO = RAIZ / 'web' / 'public' / '3d' / 'estudio.hdr'
CAMARA = json.loads((RAIZ / 'web' / 'src' / 'data' / 'camara3d.json').read_text(encoding='utf-8'))  # la del visor
TAPA = json.loads((RAIZ / 'web' / 'src' / 'data' / 'tapa.json').read_text(encoding='utf-8'))
TENDEDERO = RAIZ / 'modelos' / 'remera-tendedero.blend'
PORTADA = RAIZ / 'web' / 'public' / 'portada'
ANCHO_COLGADA = 450  # px: 3x de los 150 px que ocupa en el tendedero
MARGEN_COLGADA = 0.02  # m de aire alrededor de la remera colgada
LADO_FRENTE = 900  # la imagen fija del frente: cuadrada (el visor la recorta a los costados, como al 3D)
SEPARACION = 0.05  # el punto de la Fe de erratas va a 5 cm del borde de su estampa (el círculo no la toca)
SUBMUESTRAS = 4              # por lado, al achicar la imagen: promedia en vez de saltear píxeles

p = argparse.ArgumentParser(prog='aplicar-diseno.sh', description=__doc__.split('\n')[0])
p.add_argument('--nombre', required=True, help='nombre de la carpeta: minúsculas, números y guiones')
p.add_argument('--color', required=True, help="color de la tela, '#rrggbb'")
p.add_argument('--estampa', nargs=5, action='append', default=[],
               metavar=('LUGAR', 'IMAGEN', 'ANCHO_CM', 'DEBAJO_CM', 'COSTADO_CM'),
               help='frente o espalda, imagen, ancho, cm debajo del escote, cm al costado (repetible)')
p.add_argument('--rugosidad', type=float, default=0.9)
p.add_argument('--brillo', type=float, default=0.10, help='color del sheen (gris, 0 a 1): más alto, más gris el negro')
p.add_argument('--web', action='store_true', help='exporta también web/public/3d/<nombre>.glb (2048, WebP y Draco)')
p.add_argument('--vuelta', action='store_true', help='renderiza la vuelta de la tapa de la portada (unos 25 minutos)')
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



def estudio():
    """La luz de la web en el .blend: el HDR de estudio como mundo, la curva Neutral y la sombra de contacto."""
    if not ESTUDIO.exists():
        error(f'no está la luz de estudio: {ESTUDIO} (se genera con scripts/blender/estudio.sh)')
    escena = bpy.context.scene
    for o in [o for o in bpy.data.objects if o.type == 'LIGHT']:  # las luces de la base: las reemplaza el HDR
        bpy.data.objects.remove(o)
    mundo = bpy.data.worlds.new('Estudio web')
    mundo.use_nodes = True
    fondo = next(n for n in mundo.node_tree.nodes if n.type == 'BACKGROUND')
    hdr = mundo.node_tree.nodes.new('ShaderNodeTexEnvironment')
    hdr.image = bpy.data.images.load(str(ESTUDIO))
    mundo.node_tree.links.new(hdr.outputs['Color'], fondo.inputs['Color'])
    fondo.inputs['Strength'].default_value = 1.0
    escena.world = mundo
    escena.view_settings.view_transform = 'Khronos PBR Neutral'
    escena.view_settings.look = 'None'
    escena.view_settings.exposure = 0
    escena.render.engine = 'CYCLES'
    escena.render.film_transparent = True
    # El piso solo junta la sombra (shadow catcher), justo debajo del ruedo, como la sombra del visor
    esquinas = [remera.matrix_world @ Vector(c) for c in remera.bound_box]
    bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, min(c.z for c in esquinas) - 0.003))
    piso = bpy.context.active_object
    piso.name = 'Piso (sombra)'
    piso.is_shadow_catcher = True


def punto_en_tela(lugar, u, v):
    """El punto de la tela que cae en (u, v) de la textura, en coordenadas del glTF (Y arriba). La tela tiene grosor
    (cara de afuera y de adentro con la misma UV): se queda con la de más afuera."""
    malla = remera.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    uv = malla.uv_layers.active.data
    malla.calc_loop_triangles()
    afuera = -1 if lugar == 'frente' else 1  # el frente mira a -Y en Blender; la espalda, a +Y
    mejor = None
    for t in malla.loop_triangles:
        a, b, c = (uv[i].uv for i in t.loops)
        den = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
        if abs(den) < 1e-12:
            continue
        l1 = ((b.y - c.y) * (u - c.x) + (c.x - b.x) * (v - c.y)) / den
        l2 = ((c.y - a.y) * (u - c.x) + (a.x - c.x) * (v - c.y)) / den
        l3 = 1 - l1 - l2
        if min(l1, l2, l3) < -1e-6:
            continue
        va, vb, vc = (malla.vertices[i].co for i in t.vertices)
        pos = remera.matrix_world @ (va * l1 + vb * l2 + vc * l3)
        if mejor is None or pos.y * afuera > mejor.y * afuera:
            mejor = pos
    if mejor is None:
        error(f'no encontré la tela en u={u:.3f}, v={v:.3f}')
    return [mejor.x, mejor.z, -mejor.y]


def puntos():
    """Un punto por estampa, a SEPARACION de su borde: al costado (hacia donde está corrida), si no entra abajo y si no
    arriba (en la esquina de ese lado). Se queda con el primero que cae en la cara (no en el doblez del costado, donde
    no se ve de frente) y no pisa otra estampa."""
    cajas = []  # (lugar, x0, x1, y0, y1) en metros sobre la tela: x al costado, y debajo del escote
    for lugar, ruta, ancho, debajo, costado in ESTAMPAS:
        alto_px, ancho_px = leer(ruta).shape[:2]
        cajas.append((lugar, costado - ancho / 2, costado + ancho / 2, debajo, debajo + ancho * alto_px / ancho_px))
    for (lugar, ruta, ancho, debajo, costado), (_, *caja) in zip(ESTAMPAS, cajas):
        mapa = MAPA[lugar]
        s = mapa['uv_por_metro']
        alto = caja[3] - caja[2]
        lado = 1 if costado >= 0 else -1
        esquina = costado + lado * (ancho / 2 - 0.03)
        opciones = [(costado + lado * (ancho / 2 + SEPARACION), debajo + alto / 2),  # al costado
                    (esquina, debajo + alto + SEPARACION),                            # abajo
                    (esquina, debajo - SEPARACION)]                                    # arriba

        def libre(x, y):
            en_la_cara = abs(x) <= mapa['medio_ancho'] - 0.05 and 0.03 <= y <= mapa['escote_a_ruedo'] - 0.03
            pisa = any(l == lugar and x0 - 0.02 < x < x1 + 0.02 and y0 - 0.02 < y < y1 + 0.02 for l, x0, x1, y0, y1 in cajas)
            return en_la_cara and not pisa

        x, y = next((o for o in opciones if libre(*o)), opciones[-1])
        posicion = punto_en_tela(lugar, mapa['u_centro'] + x * s, mapa['v_escote'] - y * s)
        # La normal es la de la cara (frente o espalda), no la de la tela en ese lugar: en un pliegue apunta para
        # cualquier lado. El visor esconde el punto cuando esa cara de la remera no mira a la cámara
        normal = [0, 0, 1] if lugar == 'frente' else [0, 0, -1]
        centro = punto_en_tela(lugar, mapa['u_centro'] + costado * s, mapa['v_escote'] - (debajo + alto / 2) * s)
        redondo = lambda xs: [round(n, 4) for n in xs]
        # el centro de la estampa sirve para apuntar la cámara (el botón DETALLE va al de la principal)
        print(f'PUNTO {lugar} {ruta.name}: posicion {redondo(posicion)} normal {redondo(normal)} centro {redondo(centro)}')


def exportar_web():
    """El .glb del visor: textura de 2048 en WebP y la malla con Draco. No cambia el .blend (la de 4096 queda)."""
    salida = RAIZ / 'web' / 'public' / '3d' / f'{args.nombre}.glb'
    nodo = next(n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE')
    grande = nodo.image
    chica = grande.copy()
    chica.scale(2048, 2048)
    nodo.image = chica
    for o in bpy.context.view_layer.objects:  # solo la remera (el piso de la sombra no va a la web)
        o.select_set(o is remera)
    bpy.ops.export_scene.gltf(filepath=str(salida), export_format='GLB', use_selection=True, export_apply=True,
                              export_cameras=False, export_lights=False, export_materials='EXPORT',
                              export_image_format='WEBP', export_image_quality=90,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=10,
                              export_yup=True)
    nodo.image = grande
    bpy.data.images.remove(chica)
    print('WEB', salida.relative_to(RAIZ), f'{salida.stat().st_size / 1024:.0f} KB')
    frente()
    puntos()
    colgada()


def frente():
    """La imagen fija del frente: Cycles con la cámara exacta del visor (órbita, objetivo y campo visual vertical)."""
    escena = bpy.context.scene
    camara = bpy.data.objects.new('Cámara web', bpy.data.cameras.new('Cámara web'))
    escena.collection.objects.link(camara)
    escena.camera = camara
    th, ph, r = math.radians(CAMARA['theta']), math.radians(CAMARA['phi']), CAMARA['radio']
    ox, oy, oz = CAMARA['objetivo']
    # La órbita es la de model-viewer (glTF, Y arriba); en Blender, Z arriba: (x, y, z) del glTF → (x, -z, y)
    gx, gy, gz = ox + r * math.sin(ph) * math.sin(th), oy + r * math.cos(ph), oz + r * math.sin(ph) * math.cos(th)
    camara.location = (gx, -gz, gy)
    camara.rotation_euler = (Vector((ox, -oz, oy)) - camara.location).to_track_quat('-Z', 'Y').to_euler()
    camara.data.sensor_fit = 'VERTICAL'
    camara.data.angle_y = math.radians(CAMARA['fov'])
    escena.render.resolution_x = escena.render.resolution_y = LADO_FRENTE
    escena.render.resolution_percentage = 100
    escena.cycles.samples = 128
    escena.cycles.use_denoising = True
    ajustes = escena.render.image_settings
    ajustes.file_format = 'WEBP'
    ajustes.color_mode = 'RGBA'  # fondo transparente: se apoya sobre el mismo papel del visor
    ajustes.quality = 82
    salida = RAIZ / 'web' / 'public' / '3d' / f'{args.nombre}-frente.webp'
    escena.render.filepath = str(salida)
    bpy.ops.render.render(write_still=True)
    print('FRENTE', salida.relative_to(RAIZ), f'{salida.stat().st_size / 1024:.0f} KB')


def colgada():
    """La remera del tendedero: una copia con la forma colgada de broches, de frente, ortográfica y transparente.
    El encuadre sale de la malla colgada (es la misma para todos los diseños): todas las remeras quedan a la misma
    escala y con los broches en el mismo lugar, que se anota en tendedero.json para la portada."""
    if not TENDEDERO.exists():
        error(f'no está la remera colgada: {TENDEDERO} (se genera con scripts/blender/remera-tendedero.sh)')
    with bpy.data.libraries.load(str(TENDEDERO)) as (_, destino):
        destino.meshes = ['Remera']
    forma = destino.meshes[0]
    if len(forma.vertices) != len(remera.data.vertices):
        error('la remera colgada no tiene la misma malla que la base: regenerar las dos')
    copia = remera.copy()
    copia.data = remera.data.copy()
    escena = bpy.context.scene
    escena.collection.objects.link(copia)
    coords = np.empty(len(forma.vertices) * 3)
    forma.vertices.foreach_get('co', coords)
    copia.data.vertices.foreach_set('co', coords)
    copia.data.update()
    ocultas = [o for o in escena.objects if o is not copia and o.type == 'MESH']  # la remera en la percha y el piso
    for o in ocultas:
        o.hide_render = True
    ev = copia.evaluated_get(bpy.context.evaluated_depsgraph_get())
    pts = [copia.matrix_world @ v.co for v in ev.to_mesh().vertices]
    x0, x1 = min(p.x for p in pts) - MARGEN_COLGADA, max(p.x for p in pts) + MARGEN_COLGADA
    z0, z1 = min(p.z for p in pts) - MARGEN_COLGADA, max(p.z for p in pts) + MARGEN_COLGADA
    camara = bpy.data.objects.new('Cámara tendedero', bpy.data.cameras.new('Cámara tendedero'))
    escena.collection.objects.link(camara)
    camara.data.type = 'ORTHO'
    camara.data.sensor_fit = 'HORIZONTAL'
    camara.data.ortho_scale = x1 - x0
    camara.location = ((x0 + x1) / 2, -3, (z0 + z1) / 2)  # de frente: el frente mira a -Y
    camara.rotation_euler = (math.radians(90), 0, 0)
    escena.camera = camara
    escena.render.resolution_x = ANCHO_COLGADA
    escena.render.resolution_y = round(ANCHO_COLGADA * (z1 - z0) / (x1 - x0))
    escena.render.resolution_percentage = 100
    escena.render.film_transparent = True
    escena.cycles.samples = 128
    escena.cycles.use_denoising = True
    ajustes = escena.render.image_settings
    ajustes.media_type = 'IMAGE'
    ajustes.file_format = 'WEBP'
    ajustes.color_mode = 'RGBA'
    ajustes.quality = 82
    PORTADA.mkdir(parents=True, exist_ok=True)
    salida = PORTADA / f'{args.nombre}-colgada.webp'
    escena.render.filepath = str(salida)
    bpy.ops.render.render(write_still=True)
    # los broches: el punto más alto de la tela en cada franja de broche (x = ±0,24 m), en % de la imagen
    broches = []
    for lado in (-1, 1):
        franja = [p for p in pts if abs(p.x - lado * 0.24) < 0.012]
        tope = max(franja, key=lambda p: p.z)
        broches.append([round((tope.x - x0) / (x1 - x0) * 100, 1), round((z1 - tope.z) / (z1 - z0) * 100, 1)])
    datos = {
        'nota': 'Lo escribe aplicar_diseno.py --web (no editar a mano): el tamaño de las imágenes del tendedero '
                '(web/public/portada/<diseño>-colgada.webp) y dónde caen los broches, en % del ancho y del alto',
        'ancho': escena.render.resolution_x, 'alto': escena.render.resolution_y, 'broches': broches,
    }
    (RAIZ / 'web' / 'src' / 'data' / 'tendedero.json').write_text(json.dumps(datos, ensure_ascii=False, indent=2) + '\n',
                                                                  encoding='utf-8', newline='\n')
    for o in ocultas:
        o.hide_render = False
    bpy.data.objects.remove(camara)
    bpy.data.objects.remove(copia)
    bpy.data.meshes.remove(forma)
    print('COLGADA', salida.relative_to(RAIZ), f'{salida.stat().st_size / 1024:.0f} KB', 'broches', broches)


def vuelta():
    """La vuelta de la tapa: la remera (en la percha) gira una vez delante de la cámara, con la luz quieta (como el
    giro del visor). Cada cuadro sale transparente, se compone sobre el fondo liso de la foto en los valores sRGB del
    archivo (como lo pintaría el navegador) y el FFmpeg de Blender los junta en un MP4 H.264 sin sonido."""
    import shutil
    import tempfile
    escena = bpy.context.scene
    camara = bpy.data.objects.new('Cámara tapa', bpy.data.cameras.new('Cámara tapa'))
    escena.collection.objects.link(camara)
    c = TAPA['camara']
    ph = math.radians(c['phi'])
    objetivo = Vector((0, 0, c['objetivo_y']))
    camara.location = objetivo + Vector((0, -c['radio'] * math.sin(ph), c['radio'] * math.cos(ph)))
    camara.rotation_euler = (objetivo - camara.location).to_track_quat('-Z', 'Y').to_euler()
    camara.data.sensor_fit = 'VERTICAL'
    camara.data.angle_y = math.radians(c['fov'])
    escena.camera = camara
    escena.render.resolution_x, escena.render.resolution_y = TAPA['ancho'], TAPA['alto']
    escena.render.resolution_percentage = 100
    escena.render.film_transparent = True
    escena.cycles.samples = TAPA['muestras']
    escena.cycles.use_denoising = True
    ajustes = escena.render.image_settings
    ajustes.media_type = 'IMAGE'
    ajustes.file_format = 'PNG'
    ajustes.color_mode = 'RGBA'
    m = re.fullmatch(r'#([0-9a-f]{6})', TAPA['fondo'])
    fondo = np.array([int(m.group(1)[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)
    temporal = Path(tempfile.mkdtemp(prefix='vuelta-'))
    giro = remera.rotation_euler.z
    n = TAPA['cuadros']
    try:
        for f in range(n):
            remera.rotation_euler.z = giro + 2 * math.pi * f / n
            escena.render.filepath = str(temporal / f'c-{f:03d}.png')
            bpy.ops.render.render(write_still=True)
            img = bpy.data.images.load(escena.render.filepath)
            img.colorspace_settings.name = 'Non-Color'  # los valores del archivo, sin convertir
            img.alpha_mode = 'STRAIGHT'
            px = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32)
            img.pixels.foreach_get(px)
            px = px.reshape(-1, 4)
            px[:, :3] = px[:, :3] * px[:, 3:4] + fondo * (1 - px[:, 3:4])
            px[:, 3] = 1
            img.pixels.foreach_set(px.ravel())
            img.file_format = 'PNG'
            img.save()
            if f == 0:  # la imagen fija: el primer cuadro, en WebP
                ajustes.file_format = 'WEBP'
                ajustes.color_mode = 'RGB'
                ajustes.quality = 82
                poster = PORTADA / f'{args.nombre}-vuelta.webp'
                PORTADA.mkdir(parents=True, exist_ok=True)
                img.save_render(str(poster), scene=escena)
                ajustes.file_format = 'PNG'
                ajustes.color_mode = 'RGBA'
            bpy.data.images.remove(img)
            print(f'VUELTA cuadro {f + 1}/{n}', flush=True)
        remera.rotation_euler.z = giro
        # el video: una escena aparte con los cuadros en el editor de video, sin curva de color (ya la tienen)
        video = bpy.data.scenes.new('Vuelta')
        video.view_settings.view_transform = 'Standard'
        video.render.resolution_x, video.render.resolution_y = TAPA['ancho'], TAPA['alto']
        video.render.resolution_percentage = 100
        video.render.fps = TAPA['fps']
        video.frame_start, video.frame_end = 1, n
        tira = video.sequence_editor_create().strips.new_image('vuelta', str(temporal / 'c-000.png'), 1, 1)
        for f in range(1, n):
            tira.elements.append(f'c-{f:03d}.png')
        tira.colorspace_settings.name = 'sRGB'
        r = video.render
        r.image_settings.media_type = 'VIDEO'
        r.image_settings.file_format = 'FFMPEG'
        r.ffmpeg.format = 'MPEG4'
        r.ffmpeg.codec = 'H264'
        r.ffmpeg.constant_rate_factor = 'CUSTOM'
        r.ffmpeg.custom_constant_rate_factor = TAPA['calidad']
        r.ffmpeg.ffmpeg_preset = 'BEST'
        r.ffmpeg.gopsize = n
        r.ffmpeg.audio_codec = 'NONE'
        mp4 = PORTADA / f'{args.nombre}-vuelta.mp4'
        r.filepath = str(mp4)
        r.use_file_extension = False
        bpy.ops.render.render(animation=True, scene=video.name)
        bpy.data.scenes.remove(video)
    finally:
        shutil.rmtree(temporal, ignore_errors=True)
    bpy.data.objects.remove(camara)
    print('VUELTA', mp4.relative_to(RAIZ), f'{mp4.stat().st_size / 1024:.0f} KB,', poster.relative_to(RAIZ),
          f'{poster.stat().st_size / 1024:.0f} KB')


estudio()
if args.web:
    exportar_web()
if args.vuelta:
    vuelta()
# El comando que armó este diseño, para poder rehacerlo (con otro brillo, otra luz…) sin adivinar las medidas
argumentos = sys.argv[sys.argv.index('--') + 1:]
(carpeta / 'aplicar.sh').write_text('#!/usr/bin/env bash\n# Rehace este diseño (lo escribe aplicar_diseno.py; correr desde la raíz del repo)\n'
                                    f'scripts/blender/aplicar-diseno.sh {shlex.join(argumentos)}\n', encoding='utf-8', newline='\n')
bpy.ops.wm.save_as_mainfile(filepath=str(carpeta / f'remera-{args.nombre}.blend'))
print('DISEÑO', args.nombre, f'textura {res} px', f'glb {peso} bytes ({peso / 1024:.0f} KB)', *informe, sep='\n  ')
if peso >= LIMITE_GLB:
    error(f'el .glb pesa {peso / 1024 / 1024:.2f} MB, más que 3 MB aun con {res} px')
