"""Modela la remera 3D de Plainview 8:2 (talle M, en metros), la cuelga de una percha y la guarda como remera.blend y remera.glb.

Se corre con el Blender de Windows, sin abrir la interfaz:
    blender.exe --background --factory-startup --python remera.py -- <carpeta de salida> <carpeta de capturas> [norender]

Cómo está armada:
- Se modela la mitad derecha (x >= 0) y un Mirror en X arma la otra (con las UV espejadas en U, alrededor de 0,5).
- La remera arranca aplanada, como recién doblada sobre una mesa: frente y espalda son dos planos separados 2 cm
  (y = -B y y = +B) unidos por un doblez en los costados y en los hombros, y las mangas abiertas hacia los costados.
- La malla son anillos de media vuelta (del centro del frente al centro de la espalda, pasando por el doblez)
  apilados de abajo hacia arriba; la sisa es un hueco en el doblez del costado y de ahí sale la manga, otro tubo aplanado.
- Dobladillos y ribete son la tela doblada hacia adentro (unos anillos más), así se ven al mirar por el cuello o la manga.
- Islas UV: frente, espalda, manga y ribete. La línea del centro del frente queda recta en u = 0,5 para que,
  con el espejo, el frente sea una sola isla plana donde va la estampa.
- Después se cuelga de una percha invisible (la hacen los pines del hombro) y se simula toda la tela (Cloth).
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT_DIR, SHOT_DIR = argv[0], argv[1]
RENDER = 'norender' not in argv[2:]

bpy.context.preferences.filepaths.save_version = 0  # sin remera.blend1

# ---------------------------------------------------------------- medidas (metros; los puntos 2D son (x, z) vistos de frente)
N = 16              # segmentos de media vuelta (0 = centro del frente, 8 = doblez del costado, 16 = centro de la espalda)
PLIEGUE = N // 2
ARM0, ARM1 = 7, 9   # la sisa ocupa los segmentos 7 y 8, a los dos lados del doblez
B = 0.010           # medio espesor de la remera aplanada: frente y espalda arrancan separados 2 cm
GROSOR = 0.002      # Solidify
W = 0.29            # medio ancho del cuerpo: 58 cm de pecho en plano

# Corte oversize moderado: cuerpo recto, hombro caído (la costura de la sisa cae sobre el brazo) y sisa profunda.
Z_RUEDO = -0.40
SOBACO = Vector((W, 0.06))         # donde se juntan la costura del costado y la de abajo de la manga
PUNTA = Vector((0.285, 0.31))      # punta del hombro (arriba de la sisa)
HPS = Vector((0.09, 0.36))         # punto más alto del hombro, al lado del cuello: 76 cm hasta el ruedo
ESCOTE = (0.288, 0.340)            # centro del escote adelante y atrás
Q_BORDE = 0.05                     # los vértices de la sisa más cercanos a los dobleces (fracción de la costura)
_dir = (HPS - PUNTA).normalized()
N_HOMBRO = Vector((_dir.y, -_dir.x))  # normal de la línea del hombro, hacia arriba

# La manga arranca ya abierta hacia el costado, a unos 38° del cuerpo: si arranca horizontal, al caer se tumba hacia
# adelante o atrás (doblarse fuera del plano le cuesta menos que girar dentro de él).
MANGA_ABAJO, ANGULO_ABAJO = 0.14, math.radians(45)  # costura de abajo: largo y ángulo bajo la horizontal
MANGA_ARRIBA = 0.25       # de la punta del hombro al puño
ANCHO_PUÑO = 0.21         # medio contorno del puño (42 cm)


def costura(q):
    """Punto de la costura de la sisa: 0 en el sobaco, 1 en la punta del hombro."""
    return SOBACO.lerp(PUNTA, q)


def cuerpo(z):
    return ('cuerpo', z, z)


# (nombre, anillo, desplazamiento hacia afuera) en el orden de la tela: del doblez interno del ruedo hasta el ribete
ANILLOS = [
    ('ruedo_int2', cuerpo(Z_RUEDO + 0.026), -0.0045),
    ('ruedo_int', cuerpo(Z_RUEDO + 0.008), -0.0045),
    ('ruedo', cuerpo(Z_RUEDO), -0.00225),
    ('ruedo_ext', cuerpo(Z_RUEDO + 0.008), 0.0),
    ('ruedo_costura', cuerpo(Z_RUEDO + 0.026), -0.0012),
    ('c1', cuerpo(-0.358), 0.0),
    ('c2', cuerpo(-0.280), 0.0),
    ('c3', cuerpo(-0.200), 0.0),
    ('c4', cuerpo(-0.120), 0.0),
    ('c5', cuerpo(-0.040), 0.0),
    ('c6', cuerpo(0.020), 0.0),
    ('axila', ('axila', SOBACO.y, SOBACO.y), 0.0),
    ('s1', ('sisa', 0.130, 0.130, 0.35), 0.0),
    ('s2', ('sisa', 0.185, 0.190, 0.65), 0.0),
    ('hombro', ('hombro', 0.235, 0.255), 0.0),
    ('h1', ('cima', 0.262, 0.294, 1 / 3), 0.0),
    ('h2', ('cima', 0.277, 0.322, 2 / 3), 0.0),
    ('cuello', ('cuello', 0.0), -0.001),
    ('ribete1', ('cuello', 0.010), 0.0004),
    ('ribete_borde', ('cuello', 0.019), -0.00225),
    ('ribete_int', ('cuello', 0.010), -0.0045),
    ('ribete_int2', ('cuello', 0.002), -0.0045),
]
K = {nombre: k for k, (nombre, _, _) in enumerate(ANILLOS)}
AXILA, HOMBRO, K_CUELLO = K['axila'], K['hombro'], K['cuello']


def escote(atras, w):
    """El escote (adelante o atrás) del centro al HPS; con w > 0, la línea del ribete a w de la costura, hacia la boca.

    Adelante y atrás terminan en el mismo punto del doblez (w adentro del HPS, a su misma altura): si el ribete de
    atrás, que es casi recto, se corriera por su normal, asomaría por arriba del hombro y se cruzaría con el de adelante.
    """
    zc = ESCOTE[1 if atras else 0] + w
    ancho = HPS.x - w
    return [Vector((ancho * math.sin(phi), zc + (HPS.y - zc) * (1 - math.cos(phi))))
            for phi in (math.pi / 2 * j / PLIEGUE for j in range(PLIEGUE + 1))]


def contorno(anillo):
    """Las líneas del anillo en el frente y en la espalda (j = 0 en el centro ... 8 en el doblez) y la normal del doblez."""
    tipo = anillo[0]
    if tipo == 'cuello':
        return escote(False, anillo[1]), escote(True, anillo[1]), N_HOMBRO
    zf, zb = anillo[1], anillo[2]
    if tipo == 'cuerpo':
        p7, doblez, n = Vector((W - B, zf)), Vector((W, zf)), Vector((1, 0))
    elif tipo == 'axila':
        p7, doblez, n = costura(Q_BORDE), SOBACO, Vector((1, 0))
    elif tipo == 'sisa':
        p7, doblez, n = costura(anillo[3]), None, None
    elif tipo == 'hombro':
        p7, doblez, n = costura(1 - Q_BORDE), PUNTA, (Vector((1, 0)) + N_HOMBRO).normalized()
    else:  # 'cima': entre la punta del hombro y el cuello, el doblez es la costura del hombro
        doblez = PUNTA.lerp(HPS, anillo[3])
        p7, n = doblez - N_HOMBRO * B, N_HOMBRO

    def linea(zc):  # sale horizontal del centro (sin pico al espejar) y sube hasta el borde
        return [Vector((p7.x * j / 7, zc + (p7.y - zc) * (j / 7) ** 2)) for j in range(PLIEGUE)] + [doblez]

    return linea(zf), linea(zb), n


CONTORNOS = [contorno(R) for _, R, _ in ANILLOS]


def punto_anillo(k, i, off):
    adelante, atras, n = CONTORNOS[k]
    if i < PLIEGUE:
        p, y, normal = adelante[i], -B, Vector((0, -1, 0))
    elif i > PLIEGUE:
        p, y, normal = atras[N - i], B, Vector((0, 1, 0))
    else:
        p, y, normal = adelante[PLIEGUE], 0.0, Vector((n.x, 0, n.y))
    return Vector((p.x, y, p.y)) + normal * off


def suave(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- malla
bm = bmesh.new()
isla = bm.faces.layers.int.new('isla')  # 0 frente, 1 espalda, 2 manga, 3 ribete, 4 doblez interno del ruedo


def en_sisa(k, i):
    """Vértices que quedan adentro del hueco de la sisa (no se crean)."""
    return AXILA < k < HOMBRO and ARM0 < i < ARM1


V = []
for k, (nombre, R, off) in enumerate(ANILLOS):
    V.append([None if en_sisa(k, i) else bm.verts.new(punto_anillo(k, i, off)) for i in range(N + 1)])

for k in range(len(ANILLOS) - 1):
    for i in range(N):
        if AXILA <= k < HOMBRO and ARM0 <= i < ARM1:
            continue
        f = bm.faces.new((V[k][i], V[k][i + 1], V[k + 1][i + 1], V[k + 1][i]))
        f[isla] = 3 if k >= K_CUELLO else 4 if k < K['ruedo'] else (0 if i < PLIEGUE else 1)

# borde de la sisa, dando la vuelta: abajo de adelante hacia atrás, sube atrás, arriba hacia adelante, baja adelante
sisa = ([V[AXILA][i] for i in range(ARM0, ARM1 + 1)]
        + [V[k][ARM1] for k in range(AXILA + 1, HOMBRO)]
        + [V[HOMBRO][i] for i in range(ARM1, ARM0 - 1, -1)]
        + [V[k][ARM0] for k in range(HOMBRO - 1, AXILA, -1)])
M = len(sisa)
J_COSTURA = (ARM1 - ARM0) // 2  # el vértice de abajo de todo de la sisa (el doblez del sobaco)

# la manga aplanada: cada vértice de la sisa tiene su altura q en la costura y su lado (frente, espalda o doblez);
# los anillos van de la sisa al puño: la punta de abajo del puño sale de la costura de abajo y la de arriba queda a
# ANCHO_PUÑO de ella y a MANGA_ARRIBA de la punta del hombro (la intersección de los dos círculos)
PUÑO_ABAJO = SOBACO + Vector((math.cos(ANGULO_ABAJO), -math.sin(ANGULO_ABAJO))) * MANGA_ABAJO
_d = (PUÑO_ABAJO - PUNTA).length
_u = (PUÑO_ABAJO - PUNTA) / _d
_a = (MANGA_ARRIBA ** 2 - ANCHO_PUÑO ** 2 + _d ** 2) / (2 * _d)
PUÑO_ARRIBA = PUNTA + _u * _a + Vector((-_u.y, _u.x)) * math.sqrt(MANGA_ARRIBA ** 2 - _a ** 2)
arriba = (PUÑO_ARRIBA - PUÑO_ABAJO).normalized()
eje_sisa = PUNTA - SOBACO

ANILLOS_MANGA = [('t', t / 8, 0) for t in range(1, 9)] + [  # 8 anillos: resolución para los pliegues de la tela
                 ('puño', 0.022, -0.0012), ('puño', 0.008, 0.0), ('puño', 0.0, -0.00225),
                 ('puño', 0.008, -0.0045), ('puño', 0.024, -0.0045)]
FIN_TRAMO = 0.03  # el tramo liso termina 3 cm antes del puño
filas_manga = [sisa]
for tipo, val, off in ANILLOS_MANGA:
    fila = []
    for v in sisa:
        p0 = Vector((v.co.x, v.co.z))
        q = (p0 - SOBACO).dot(eje_sisa) / eje_sisa.length_squared
        p1 = PUÑO_ABAJO.lerp(PUÑO_ARRIBA, q)
        largo = (p1 - p0).length
        u = (p1 - p0) / largo
        p = p0 + u * ((largo - FIN_TRAMO) * val) if tipo == 't' else p1 - u * val
        lado = 0 if abs(v.co.y) < 1e-6 else (1 if v.co.y > 0 else -1)
        afuera = Vector((0, lado, 0)) if lado else Vector((arriba.x, 0, arriba.y)) * (1 if q > 0.5 else -1)
        fila.append(bm.verts.new(Vector((p.x, lado * B, p.y)) + afuera * off))
    filas_manga.append(fila)

for a_, b_ in zip(filas_manga, filas_manga[1:]):
    for j in range(M):
        f = bm.faces.new((a_[j], a_[(j + 1) % M], b_[(j + 1) % M], b_[j]))
        f[isla] = 2


# costuras para las UV
def costura_uv(v1, v2):
    bm.edges.get((v1, v2)).seam = True


for k in range(len(ANILLOS) - 1):
    if k < AXILA or HOMBRO <= k < K_CUELLO:
        costura_uv(V[k][PLIEGUE], V[k + 1][PLIEGUE])   # costados y hombros
for j in range(M):
    costura_uv(sisa[j], sisa[(j + 1) % M])
for i in range(N):
    costura_uv(V[K_CUELLO][i], V[K_CUELLO][i + 1])
    costura_uv(V[K['ruedo']][i], V[K['ruedo']][i + 1])
for a_, b_ in zip(filas_manga, filas_manga[1:]):
    costura_uv(a_[J_COSTURA], b_[J_COSTURA])

for f in bm.faces:
    f.smooth = True


def largo_columna(filas, j):
    return sum((b_[j].co - a_[j].co).length for a_, b_ in zip(filas, filas[1:]))


J_ARRIBA = ARM1 - ARM0 + 1 + (HOMBRO - AXILA - 1) + (ARM1 - ARM0) // 2  # el vértice de la costura del hombro
BORDE = 1 + [n for n, (tipo, val, _) in enumerate(ANILLOS_MANGA) if tipo == 'puño' and val == 0.0][0]
borde = filas_manga[BORDE]
MEDIDAS = dict(
    manga_arriba=largo_columna(filas_manga[:BORDE + 1], J_ARRIBA),
    manga_abajo=largo_columna(filas_manga[:BORDE + 1], J_COSTURA),
    contorno_puño=sum((borde[(j + 1) % M].co - borde[j].co).length for j in range(M)),
    contorno_sisa=sum((sisa[(j + 1) % M].co - sisa[j].co).length for j in range(M)),
    linea_hombro=sum((V[k + 1][PLIEGUE].co - V[k][PLIEGUE].co).length for k in range(HOMBRO, K_CUELLO)),
    ancho_pecho=2 * W,
    largo_hps_ruedo=HPS.y - Z_RUEDO,
)

# el origen en el centro de la remera (en x queda en 0 por el espejo)
xs = [v.co for v in bm.verts]
cy = (min(c.y for c in xs) + max(c.y for c in xs)) / 2
cz = (min(c.z for c in xs) + max(c.z for c in xs)) / 2
bmesh.ops.translate(bm, verts=bm.verts[:], vec=Vector((0, -cy, -cz)))
bm.verts.index_update()
vidx = {(k, i): v.index for k, fila in enumerate(V) for i, v in enumerate(fila) if v is not None}

# ---------------------------------------------------------------- escena nueva
bpy.ops.wm.read_homefile(use_empty=True)
escena = bpy.context.scene
escena.name = 'Remera'
coleccion = bpy.data.collections.new('Remera')
escena.collection.children.link(coleccion)

malla = bpy.data.meshes.new('Remera')
bm.to_mesh(malla)
bm.free()
obj = bpy.data.objects.new('Remera', malla)
coleccion.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# frente mirando a -Y: chequeo con una cara del pecho
pecho = [p for p in malla.polygons if malla.attributes['isla'].data[p.index].value == 0 and p.center.z > 0]
if sum(p.normal.y for p in pecho) > 0:
    malla.flip_normals()

# ---------------------------------------------------------------- UV
UV_POR_METRO = {0: 1.0, 1: 0.15}
# (u0, v0, u1, v1) de la mitad modelada; el espejo copia del otro lado de 0,5. El frente se queda con casi toda la
# textura (es donde va la estampa); espalda, manga, ribete y doblez del ruedo, negros lisos, van en la franja de abajo.
CASILLAS = {
    0: (0.5, 0.13, 0.998, 0.998),
    1: (0.5, 0.004, 0.55, 0.122),
    2: (0.56, 0.004, 0.80, 0.122),
    3: (0.82, 0.004, 0.998, 0.058),
    4: (0.82, 0.066, 0.998, 0.122),
}

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bm = bmesh.from_edit_mesh(malla)
uv = bm.loops.layers.uv.verify()
tag = bm.faces.layers.int.get('isla')
bm.verts.ensure_lookup_table()
columna = {0: [vidx[(k, 0)] for k in range(K['ruedo'], K_CUELLO + 1)],
           1: [vidx[(k, N)] for k in range(K['ruedo'], K_CUELLO + 1)]}

for t, col in columna.items():
    largo = 0.0
    prev = None
    for vi in col:
        v = bm.verts[vi]
        if prev is not None:
            largo += (v.co - prev).length
        prev = v.co.copy()
        for l in v.link_loops:
            if l.face[tag] == t:
                l[uv].uv = (0.5, CASILLAS[t][1] + largo * UV_POR_METRO[t])
                l[uv].pin_uv = True
bmesh.update_edit_mesh(malla)
bpy.ops.uv.unwrap(method='CONFORMAL', margin=0.0)

bm = bmesh.from_edit_mesh(malla)
uv = bm.loops.layers.uv.verify()
tag = bm.faces.layers.int.get('isla')
bm.verts.ensure_lookup_table()


def lazos(t):
    return [l for f in bm.faces if f[tag] == t for l in f.loops]


def caja(ls):
    us = [l[uv].uv.x for l in ls]
    vs = [l[uv].uv.y for l in ls]
    return min(us), min(vs), max(us), max(vs)


def transformar(ls, fn):
    for l in ls:
        l[uv].uv = fn(l[uv].uv.copy())


informe = {}
for t in (0, 1):
    ls = lazos(t)
    col = columna[t]
    abajo = [l for l in bm.verts[col[0]].link_loops if l.face[tag] == t][0][uv].uv.copy()
    arriba = [l for l in bm.verts[col[-1]].link_loops if l.face[tag] == t][0][uv].uv.copy()
    eje = arriba - abajo
    ang = math.atan2(eje.x, eje.y)  # cuánto se inclinó la línea del centro
    rot = Matrix.Rotation(ang, 2)
    transformar(ls, lambda p: rot @ (p - abajo) + Vector((0.5, 0)))
    # el costado tiene que quedar del lado que corresponde (frente: u > 0,5 visto de frente)
    costado = sum(l[uv].uv.x - 0.5 for l in ls) / len(ls)
    lado = 1 if costado > 0 else -1
    u0, v0, u1, v1 = caja(ls)
    ancho = max(u1 - 0.5, 0.5 - u0)
    cu0, cv0, cu1, cv1 = CASILLAS[t]
    esc = min((cu1 - cu0) / ancho, (cv1 - cv0) / (v1 - v0))
    transformar(ls, lambda p: Vector((0.5 + (p.x - 0.5) * esc, cv0 + (p.y - v0) * esc)))
    u0, v0, u1, v1 = caja(ls)
    desvio = max(abs(l[uv].uv.x - 0.5) for vi in col for l in bm.verts[vi].link_loops if l.face[tag] == t)
    cruza = (0.5 - u0) if lado > 0 else (u1 - 0.5)
    informe[t] = dict(lado=lado, caja=(round(u0, 3), round(v0, 3), round(u1, 3), round(v1, 3)),
                      desvio_centro=desvio, cruza_espejo=cruza)

for t in (2, 3, 4):
    ls = lazos(t)
    u0, v0, u1, v1 = caja(ls)
    cu0, cv0, cu1, cv1 = CASILLAS[t]
    if (u1 - u0 > v1 - v0) != (cu1 - cu0 > cv1 - cv0):  # girar 90° si así entra mejor
        transformar(ls, lambda p: Vector((-p.y, p.x)))
        u0, v0, u1, v1 = caja(ls)
    esc = min((cu1 - cu0) / (u1 - u0), (cv1 - cv0) / (v1 - v0))
    transformar(ls, lambda p: Vector((cu0 + (p.x - u0) * esc, cv0 + (p.y - v0) * esc)))
    informe[t] = dict(caja=tuple(round(x, 3) for x in caja(ls)))

for f in bm.faces:
    for l in f.loops:
        l[uv].pin_uv = False


# deformación del frente en la zona de la estampa: área UV / área real
def area_uv(f):
    pts = [l[uv].uv for l in f.loops]
    return abs(sum(pts[i].x * pts[i - 1].y - pts[i - 1].x * pts[i].y for i in range(len(pts)))) / 2


ESTAMPA_Z = (ESCOTE[0] - 0.07 - 0.40 - cz, ESCOTE[0] - 0.07 - cz)  # 30 x 40 cm, 7 cm debajo del escote
ratios = []
for f in bm.faces:
    if f[tag] == 0:
        c = f.calc_center_median()
        if c.x < 0.15 and ESTAMPA_Z[0] < c.z < ESTAMPA_Z[1]:
            ratios.append(math.sqrt(area_uv(f) / f.calc_area()))
media = sum(ratios) / len(ratios)
informe['estampa'] = dict(caras=len(ratios), escala_min=min(ratios) / media, escala_max=max(ratios) / media,
                          px_por_cm=media * 2048 / 100)
bmesh.update_edit_mesh(malla)
bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------- espejo y subdivisión (aplicados: la tela se simula entera)
def aplicar(mod):
    bpy.ops.object.modifier_apply(modifier=mod.name)


m = obj.modifiers.new('Espejo', 'MIRROR')
m.use_axis = (True, False, False)
m.use_clip = True
m.use_mirror_merge = True
m.merge_threshold = 0.0005
m.use_mirror_u = True
aplicar(m)
m = obj.modifiers.new('Suavizado', 'SUBSURF')
m.levels = 1
m.uv_smooth = 'PRESERVE_BOUNDARIES'
aplicar(m)

# ---------------------------------------------------------------- colgada de la percha (Cloth)
# La percha es invisible y no se exporta: una percha de ropa de 42 cm, con los brazos que bajan del cuello a las
# puntas y los hombros redondeados, más gruesos hacia afuera. La sostienen los pines: la franja de tela que se apoya en
# la percha (el doblez del hombro y 1,5 cm a cada lado) está fija, y una forma clave la lleva en el primer segundo de
# la línea de la remera aplanada a la de la percha (baja con la caída de los brazos y se abre con su espesor).
# El resto de la tela cuelga libre, sin colisionador: probé la percha como colisionador y el choque contra una pieza
# tan fina rebota, engancha la tela y la remera no se queda quieta nunca.
# La gravedad viene apenas inclinada para que las dos mangas no queden idénticas.
# Todo es determinista: mismo script, mismo resultado.
CUADROS = 250                # a 24 cuadros por segundo: 10 s, para que se asiente del todo
MASA = 0.10                  # kg por vértice
GRAVEDAD = Vector((0.05, 0.0, -9.81))
PERCHA = dict(medio_ancho=0.21, caida=0.040, franja=0.015, cuadros_bajada=24)
CIZALLA_MANGA = 500.0
FLEXION_MANGA = 0.8         # las mangas y la punta del hombro, algo más duras: si no, caen pegadas al cuerpo

malla = obj.data
islas_cara = [d_.value for d_ in malla.attributes['isla'].data]
islas_vert = [set() for _ in malla.vertices]
caras_arista = {}
for p in malla.polygons:
    for vi in p.vertices:
        islas_vert[vi].add(islas_cara[p.index])
    for ek in p.edge_keys:
        caras_arista[ek] = caras_arista.get(ek, 0) + 1
co0 = [v.co.copy() for v in malla.vertices]
de_manga = [s == {2} for s in islas_vert]
sisa_v = [i for i, s in enumerate(islas_vert) if 2 in s and len(s) > 1]
puño_v = {vi for p in malla.polygons if islas_cara[p.index] == 2
          for ek in p.edge_keys if caras_arista[ek] == 1 for vi in ek}
z_ruedo = min(c.z for c in co0)


def lado_de(i):
    return 1 if co0[i].x > 0 else -1


def distancia(i, grupo):
    return min((co0[i] - co0[j]).length for j in grupo if lado_de(j) == lado_de(i))


def en_estampa(c):
    return abs(c.x) < 0.15 and ESTAMPA_Z[0] < c.z < ESTAMPA_Z[1]


def fuera_de_estampa(c):
    """Cuánto queda c afuera del rectángulo de la estampa (0 adentro)."""
    dx = max(0.0, abs(c.x) - 0.15)
    dz = max(0.0, ESTAMPA_Z[0] - c.z, c.z - ESTAMPA_Z[1])
    return math.hypot(dx, dz)


def linea_hombro(x):
    """Altura (sin centrar) del doblez del hombro en x."""
    return HPS.y + (x - HPS.x) * (PUNTA.y - HPS.y) / (PUNTA.x - HPS.x)


def percha_arriba(x):
    """Altura del lomo de la percha: arranca en el HPS y baja PERCHA['caida'] hasta la punta (curva suave)."""
    t = (x - HPS.x) / (PERCHA['medio_ancho'] - HPS.x)
    return HPS.y - PERCHA['caida'] * t ** 1.5


def percha_espesor(x):
    """Medio espesor de la percha: finita al lado del cuello, más gruesa en los hombros."""
    return 0.006 + 0.008 * suave((x - 0.12) / 0.08)


# flexión: los dobladillos (puño, ruedo) y el ribete son tela doble, más dura; así el puño no se cierra
# estructural: la zona de la estampa casi no se estira (rigidez a pleno con 5 cm de transición); la tela doble, a medias
flexion = obj.vertex_groups.new(name='flexion')
rigidez = obj.vertex_groups.new(name='rigidez')
pin = obj.vertex_groups.new(name='pin')
sin_autocolision = obj.vertex_groups.new(name='sin_autocolision')
cizalla = obj.vertex_groups.new(name='cizalla')
destino = {}
for i, c in enumerate(co0):
    doble = 0.0
    if de_manga[i]:
        doble = 1.0 - suave((distancia(i, puño_v) - 0.03) / 0.02)
    elif 3 in islas_vert[i] or 4 in islas_vert[i] or c.z < z_ruedo + 0.03:
        doble = 1.0
    zona_manga = de_manga[i] or (abs(c.x) > PERCHA['medio_ancho'] - 0.02 and c.z + cz > SOBACO.y)
    if zona_manga:
        doble = max(doble, FLEXION_MANGA)
    cizalla.add([i], 1.0 if zona_manga else 0.0, 'REPLACE')
    estampa = 1.0 - suave(fuera_de_estampa(c) / 0.05) if islas_vert[i] == {0} else 0.0
    flexion.add([i], doble, 'REPLACE')
    if doble == 1.0 or islas_vert[i] & {3, 4}:  # el grupo cuenta por pertenencia, no por peso
        sin_autocolision.add([i], 1.0, 'REPLACE')
    rigidez.add([i], max(estampa, 0.5 * doble), 'REPLACE')
    # la franja que apoya en la percha: cerca del doblez del hombro, del cuello a la punta de la percha
    x, z = abs(c.x), c.z + cz
    abajo_del_doblez = linea_hombro(x) - z
    apoya = (HPS.x <= x <= PERCHA['medio_ancho'] and not de_manga[i] and 3 not in islas_vert[i]
             and -0.002 <= abajo_del_doblez <= PERCHA['franja'])
    pin.add([i], 1.0 if apoya else 0.0, 'REPLACE')
    if apoya:  # baja con la percha y se abre hasta su espesor (la tela la envuelve)
        y = c.y
        if abs(y) > 0.002:
            y = math.copysign(max(abs(y), percha_espesor(x)), y)
        destino[i] = Vector((c.x, y, percha_arriba(x) - abajo_del_doblez - cz))

obj.shape_key_add(name='Aplanada')
llave = obj.shape_key_add(name='En la percha', from_mix=False)
for i, p in destino.items():
    llave.data[i].co = p
llave.value = 0.0
llave.keyframe_insert('value', frame=1)
llave.value = 1.0
llave.keyframe_insert('value', frame=PERCHA['cuadros_bajada'])

escena.frame_start, escena.frame_end = 1, CUADROS
escena.gravity = GRAVEDAD
tela = obj.modifiers.new('Tela', 'CLOTH')
s = tela.settings
s.quality = 10
s.mass = MASA
s.air_damping = 30.0   # mucho aire: se asienta antes, sin cambiar dónde queda
s.tension_stiffness = s.compression_stiffness = 60.0   # algodón de peso medio: poco elástico
s.shear_stiffness = 20.0
s.bending_stiffness = 0.6
s.vertex_group_structural_stiffness = rigidez.name
s.tension_stiffness_max = s.compression_stiffness_max = 250.0
s.vertex_group_bending = flexion.name
s.bending_stiffness_max = 8.0
# la manga baja girando en el plano de la tela (cizalla en el hombro y la sisa), no doblándose: ahí, más dura
s.vertex_group_shear_stiffness = cizalla.name
s.shear_stiffness_max = CIZALLA_MANGA
s.vertex_group_mass = pin.name
s.pin_stiffness = 1.0
c = tela.collision_settings
c.use_collision = False
c.use_self_collision = True   # frente y espalda (y las dos caras de cada manga) no se atraviesan
c.self_distance_min = 0.001
# en la tela doble (puños, ruedo, ribete) las dos capas se juntan en el doblez y la autocolisión las separa a los
# empujones hasta inflar o hacer explotar la remera: esos vértices quedan afuera (Blender mira si están en el grupo,
# no el peso).
c.vertex_group_self_collisions = sin_autocolision.name
c.collision_quality = 4
tela.point_cache.frame_start, tela.point_cache.frame_end = 1, CUADROS
previo = None
for f in range(1, CUADROS + 1):
    escena.frame_set(f)
    if f == CUADROS - 12:
        previo = [v.co.copy() for v in obj.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
P = [v.co.copy() for v in obj.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
asentamiento = max((P[i] - previo[i]).length for i in range(len(previo)))  # en el último medio segundo
# con formas clave no se puede aplicar el modificador: se copia la forma final y se borran las dos cosas
obj.modifiers.remove(tela)
obj.shape_key_clear()
escena.frame_set(1)
for v, p in zip(malla.vertices, P):
    v.co = p
malla.update()
for nombre in ('flexion', 'rigidez', 'pin', 'sin_autocolision', 'cizalla'):
    obj.vertex_groups.remove(obj.vertex_groups[nombre])

# frente y espalda no se tienen que atravesar: caras que se cruzan sin compartir vértices
from mathutils.bvhtree import BVHTree
bmc = bmesh.new()
bmc.from_mesh(malla)
bmc.faces.ensure_lookup_table()
arbol = BVHTree.FromBMesh(bmc)
NOMBRES_ISLA = ('frente', 'espalda', 'manga', 'ribete', 'ruedo')
cruces = {}
for i, j in arbol.overlap(arbol):
    if i < j and not {v.index for v in bmc.faces[i].verts} & {v.index for v in bmc.faces[j].verts}:
        par = '-'.join(sorted((NOMBRES_ISLA[islas_cara[i]], NOMBRES_ISLA[islas_cara[j]])))
        cruces[par] = cruces.get(par, 0) + 1
bmc.free()

# estiramiento de la zona de la estampa: por cada triángulo del frente, los estiramientos principales entre la remera
# aplanada (sin tensión) y la colgada; > 1 es tela estirada, < 1 es tela que se junta en un pliegue
malla.calc_loop_triangles()
estiros, areas = [], []
for tri in malla.loop_triangles:
    a, b, c_ = tri.vertices
    if islas_cara[tri.polygon_index] != 0 or not en_estampa((co0[a] + co0[b] + co0[c_]) / 3):
        continue
    e1, e2 = co0[b] - co0[a], co0[c_] - co0[a]
    u = e1.normalized()
    v = e1.cross(e2).cross(e1).normalized()
    inv = Matrix(((e1.dot(u), e2.dot(u)), (e1.dot(v), e2.dot(v)))).inverted()
    f1, f2 = P[b] - P[a], P[c_] - P[a]
    g1, g2 = f1 * inv[0][0] + f2 * inv[1][0], f1 * inv[0][1] + f2 * inv[1][1]
    m11, m12, m22 = g1.dot(g1), g1.dot(g2), g2.dot(g2)
    medio, raiz = (m11 + m22) / 2, math.sqrt(max(0.0, ((m11 - m22) / 2) ** 2 + m12 * m12))
    estiros.append(math.sqrt(medio + raiz))
    areas.append(math.sqrt(medio + raiz) * math.sqrt(max(0.0, medio - raiz)))
estiros.sort()


def rango_y(indices):
    ys = [P[i].y for i in indices]
    return max(ys) - min(ys)


torso = [i for i in range(len(co0)) if 2 not in islas_vert[i]]
hps_z = HPS.y - cz


def angulo_manga(lado):
    sis = [P[i] for i in sisa_v if lado_de(i) == lado]
    pun = [P[i] for i in puño_v if lado_de(i) == lado]
    eje = sum(pun, Vector()) / len(pun) - sum(sis, Vector()) / len(sis)
    return math.degrees(math.atan2(abs(eje.x), -eje.z))  # 0° = colgando derecho, 90° = horizontal


informe['tela'] = dict(
    asentamiento_mm=round(asentamiento * 1000, 2),
    caras_cruzadas=cruces,
    bajo_en_la_percha_mm=round(sum(co0[i].z - P[i].z for i in torso) / len(torso) * 1000, 1),
    profundidad_ruedo_cm=round(rango_y([i for i in torso if co0[i].z < z_ruedo + 0.001]) * 100, 1),
    profundidad_abajo_cm=round(rango_y([i for i in torso if co0[i].z < z_ruedo + 0.10]) * 100, 1),
    profundidad_hombros_cm=round(rango_y([i for i in torso if co0[i].z > hps_z - 0.10]) * 100, 1),
    profundidad_total_cm=round(rango_y(range(len(P))) * 100, 1),
    angulo_mangas={lado: round(angulo_manga(lado), 1) for lado in (1, -1)},
    huella=hash(tuple(round(x, 5) for p in P for x in p)),
)
informe['estiramiento_estampa'] = dict(
    triangulos=len(estiros),
    max_pct=round((estiros[-1] - 1) * 100, 2),
    p95_pct=round((estiros[int(0.95 * len(estiros))] - 1) * 100, 2),
    medio_pct=round((sum(estiros) / len(estiros) - 1) * 100, 2),
    area_min_max=(round(min(areas), 3), round(max(areas), 3)),
)

# la remera colgada vuelve a tener el origen en su centro
xs = [obj.matrix_world @ v.co for v in malla.vertices]
centro = Vector([(min(c_[a] for c_ in xs) + max(c_[a] for c_ in xs)) / 2 for a in range(3)])
malla.transform(Matrix.Translation(-centro))

m = obj.modifiers.new('Grosor', 'SOLIDIFY')
m.thickness = GROSOR
m.offset = -1.0
m.use_even_offset = False   # con grosor parejo, en el doblez del puño colgado sale una astilla
m.use_quality_normals = True
m.use_rim = True

# ---------------------------------------------------------------- material
mat = bpy.data.materials.new('Algodón negro')
mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']
for nombre, valor in [('Base Color', (0.022, 0.022, 0.024, 1)), ('Metallic', 0.0), ('Roughness', 0.9),
                      ('Sheen Weight', 0.2), ('Sheen Roughness', 0.4), ('Sheen Tint', (0.5, 0.5, 0.5, 1))]:
    if nombre in bsdf.inputs:
        bsdf.inputs[nombre].default_value = valor
obj.data.materials.append(mat)

# ---------------------------------------------------------------- números
dg = bpy.context.evaluated_depsgraph_get()
ev = obj.evaluated_get(dg)
me = ev.to_mesh()
me.calc_loop_triangles()
tris = len(me.loop_triangles)
xs = [ev.matrix_world @ v.co for v in me.vertices]
dims = [max(c[a] for c in xs) - min(c[a] for c in xs) for a in range(3)]
ev.to_mesh_clear()


print('MEDIDAS', {k: round(v, 3) for k, v in MEDIDAS.items()})
print('INFORME', dict(triangulos=tris, caras_malla=len(malla.polygons), medidas_m=[round(x, 3) for x in dims],
                      **{str(k): v for k, v in informe.items()}))

# ---------------------------------------------------------------- luces y cámara (solo para las capturas)
mundo = bpy.data.worlds.new('Estudio')
mundo.use_nodes = True
fondo = mundo.node_tree.nodes['Background']
fondo.inputs[0].default_value = (0.42, 0.40, 0.37, 1)
fondo.inputs[1].default_value = 0.6
escena.world = mundo

rig = bpy.data.objects.new('Luces', None)
coleccion.objects.link(rig)
for nombre, pos, energia, tam in [('Principal', (-1.3, -1.8, 1.4), 160, 1.6), ('Relleno', (1.6, -1.2, 0.3), 60, 2.0),
                                  ('Contra', (0.6, 1.9, 1.3), 140, 1.2)]:
    luz = bpy.data.lights.new(nombre, 'AREA')
    luz.energy = energia
    luz.size = tam
    lo = bpy.data.objects.new(nombre, luz)
    lo.location = pos
    lo.rotation_euler = (Vector((0, 0, 0)) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
    lo.parent = rig
    coleccion.objects.link(lo)

cam = bpy.data.objects.new('Cámara', bpy.data.cameras.new('Cámara'))
cam.data.lens = 70
coleccion.objects.link(cam)
escena.camera = cam

r = escena.render
for motor in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:
        r.engine = motor
        break
    except TypeError:
        pass
r.resolution_x, r.resolution_y = 900, 1100
r.film_transparent = False
try:
    escena.eevee.taa_render_samples = 48
except AttributeError:
    pass

VISTAS = [('frente', 0), ('espalda', 180), ('costado', 90), ('tres-cuartos', 35)]


def apuntar(az, dist=2.2, alto=0.12):
    a = math.radians(az)
    pos = Vector((math.sin(a) * dist, -math.cos(a) * dist, alto))
    cam.location = pos
    cam.rotation_euler = (Vector((0, 0, 0.0)) - pos).to_track_quat('-Z', 'Y').to_euler()
    rig.rotation_euler = (0, 0, a)


if RENDER:
    for nombre, az in VISTAS:
        apuntar(az)
        r.filepath = os.path.join(SHOT_DIR, f'remera-{nombre}.png')
        bpy.ops.render.render(write_still=True)
apuntar(35)

# ---------------------------------------------------------------- guardar y exportar
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, 'remera.blend'))
for o in bpy.context.view_layer.objects:
    o.select_set(o is obj)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT_DIR, 'remera.glb'), export_format='GLB', use_selection=True,
                          export_apply=True, export_cameras=False, export_lights=False, export_materials='EXPORT',
                          export_yup=True)
print('LISTO')
