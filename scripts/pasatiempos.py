#!/usr/bin/env python3
"""Generador y validador de los pasatiempos de THE PLAINVIEW.

Uso:
    python scripts/pasatiempos.py generar 1      # crea web/src/data/pasatiempos/edicion-01.json
    python scripts/pasatiempos.py validar 1      # verifica un JSON existente

Garantías:
  * Cinedoku: solución única y resoluble solo con lógica (singles), sin adivinar.
  * Crucigrama: todas las palabras se cruzan, ninguna se toca de costado
    y no aparecen "palabras fantasma".
  * Cifrado: sustitución biyectiva, ninguna letra se cifra en sí misma.
"""
from __future__ import annotations
import json, random, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "src" / "data" / "pasatiempos"

# ----------------------------------------------------------------- utilidades
def normalizar(s: str) -> str:
    """Mayúsculas sin tildes (la Ñ se conserva)."""
    s = s.upper().replace("Ñ", "\0")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return s.replace("\0", "Ñ")

# =================================================================== CIFRADO
ALFABETO = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"
# 27 símbolos estilo carta cifrada; Code los dibuja como SVG propios.
SIMBOLOS = list("ΔΘΛΞΠΣΦΨΩ⊕⊗◇△▽○●□■◁▷♁♃♄♆☊☋⊥")

def cifrar(mensaje: str, rng: random.Random) -> dict:
    texto = normalizar(mensaje)
    while True:
        perm = SIMBOLOS[:]
        rng.shuffle(perm)
        clave = dict(zip(ALFABETO, perm))
        # ningún símbolo "parecido" a su letra (Δ≠A, Σ≠E…)
        parecidos = {"A": "Δ", "E": "Σ", "O": "○", "P": "Π", "W": "Ω", "F": "Φ"}
        if all(clave[k] != v for k, v in parecidos.items()):
            break
    usadas = sorted({c for c in texto if c in ALFABETO})
    return {
        "texto": texto,
        "clave": {k: clave[k] for k in usadas},
        "letrasUsadas": len(usadas),
    }

def validar_cifrado(c: dict) -> list[str]:
    err = []
    vals = list(c["clave"].values())
    if len(set(vals)) != len(vals):
        err.append("cifrado: dos letras comparten símbolo")
    faltan = {ch for ch in c["texto"] if ch in ALFABETO} - set(c["clave"])
    if faltan:
        err.append(f"cifrado: letras sin símbolo {faltan}")
    return err

# ================================================================== CINEDOKU
# 6x6, cajas de 2 filas x 3 columnas.
def cajas6(r, c): return (r // 2, c // 3)

def candidatos(g, r, c, letras):
    usados = set(g[r]) | {g[i][c] for i in range(6)}
    br, bc = (r // 2) * 2, (c // 3) * 3
    usados |= {g[i][j] for i in range(br, br + 2) for j in range(bc, bc + 3)}
    return [x for x in letras if x not in usados]

def contar_soluciones(g, letras, limite=2):
    for r in range(6):
        for c in range(6):
            if g[r][c] == ".":
                n = 0
                for x in candidatos(g, r, c, letras):
                    g[r][c] = x
                    n += contar_soluciones(g, letras, limite - n)
                    g[r][c] = "."
                    if n >= limite:
                        return n
                return n
    return 1

def resolver_con_logica(g, letras):
    """Solo singles desnudos y ocultos. Devuelve (grilla, pasos) o (None, pasos)."""
    g = [row[:] for row in g]
    unidades = [[(r, c) for c in range(6)] for r in range(6)]
    unidades += [[(r, c) for r in range(6)] for c in range(6)]
    unidades += [[(br + i, bc + j) for i in range(2) for j in range(3)]
                 for br in (0, 2, 4) for bc in (0, 3)]
    pasos = 0
    while any("." in row for row in g):
        avance = False
        for r in range(6):
            for c in range(6):
                if g[r][c] == "." and len(cs := candidatos(g, r, c, letras)) == 1:
                    g[r][c] = cs[0]; pasos += 1; avance = True
        for u in unidades:
            for x in letras:
                lugares = [(r, c) for r, c in u if g[r][c] == "." and x in candidatos(g, r, c, letras)]
                if len(lugares) == 1 and x not in [g[r][c] for r, c in u]:
                    r, c = lugares[0]; g[r][c] = x; pasos += 1; avance = True
        if not avance:
            return None, pasos
    return g, pasos

def generar_cinedoku(palabra: str, fila_oculta: int, rng: random.Random, objetivo=11):
    letras = list(palabra)
    assert len(set(letras)) == 6
    # 1) solución completa con la palabra en la fila oculta
    def llenar(g, k=0):
        if k == 36: return True
        r, c = divmod(k, 6)
        if g[r][c] != ".": return llenar(g, k + 1)
        cs = candidatos(g, r, c, letras); rng.shuffle(cs)
        for x in cs:
            g[r][c] = x
            if llenar(g, k + 1): return True
        g[r][c] = "."
        return False
    mejor = None
    for _ in range(400):
        sol = [["."] * 6 for _ in range(6)]
        sol[fila_oculta] = letras[:]
        if not llenar(sol): continue
        # 2) quitar pistas: la fila oculta arranca vacía
        puzzle = [row[:] for row in sol]
        puzzle[fila_oculta] = ["."] * 6
        celdas = [(r, c) for r in range(6) for c in range(6) if r != fila_oculta]
        rng.shuffle(celdas)
        for r, c in celdas:
            x = puzzle[r][c]; puzzle[r][c] = "."
            ok = contar_soluciones([row[:] for row in puzzle], letras) == 1 \
                 and resolver_con_logica(puzzle, letras)[0] is not None
            if not ok: puzzle[r][c] = x
        pistas = sum(ch != "." for row in puzzle for ch in row)
        if mejor is None or pistas < mejor[2]:
            mejor = (puzzle, sol, pistas)
        if pistas <= objetivo: break
    puzzle, sol, pistas = mejor
    return {
        "letras": letras,
        "filaOculta": fila_oculta,
        "cajas": [2, 3],
        "inicio": ["".join(r) for r in puzzle],
        "solucion": ["".join(r) for r in sol],
        "pistas": pistas,
    }

def validar_cinedoku(d: dict) -> list[str]:
    letras = d["letras"]; err = []
    g = [list(r) for r in d["inicio"]]; sol = [list(r) for r in d["solucion"]]
    if contar_soluciones([r[:] for r in g], letras) != 1: err.append("cinedoku: no tiene solución única")
    res, _ = resolver_con_logica(g, letras)
    if res is None: err.append("cinedoku: requiere adivinar")
    elif res != sol: err.append("cinedoku: la solución no coincide")
    if "".join(sol[d["filaOculta"]]) != "".join(letras): err.append("cinedoku: la fila oculta no deletrea la palabra")
    return err

# ================================================================ CRUCIGRAMA
def ubicar(grid, palabra, r, c, d):
    """d = (dr, dc). Devuelve cruces o -1 si no entra."""
    dr, dc = d; L = len(palabra); cruces = 0
    pr, pc = r - dr, c - dc
    if (pr, pc) in grid: return -1
    if (r + dr * L, c + dc * L) in grid: return -1
    for i, ch in enumerate(palabra):
        rr, cc = r + dr * i, c + dc * i
        if (rr, cc) in grid:
            if grid[(rr, cc)] != ch: return -1
            cruces += 1
        else:
            # vecinos laterales vacíos
            for s in (1, -1):
                if (rr + dc * s, cc + dr * s) in grid: return -1
    return cruces

def armar_crucigrama(entradas, rng, ancho_max=11, alto_max=13, intentos=4000):
    mejor = None
    for _ in range(intentos):
        orden = entradas[:]; rng.shuffle(orden)
        orden.sort(key=lambda e: -len(e["palabra"]) + rng.random() * 3)
        # la palabra marcada como "ancla" siempre entra primero (ej. PLAINVIEW)
        orden.sort(key=lambda e: not e.get("ancla", False))
        grid = {}; puestas = []
        p0 = orden[0]
        for i, ch in enumerate(p0["palabra"]): grid[(0, i)] = ch
        puestas.append((p0, 0, 0, (0, 1)))
        for e in orden[1:]:
            w = e["palabra"]; opciones = []
            for (gr, gc), gch in list(grid.items()):
                for i, ch in enumerate(w):
                    if ch != gch: continue
                    for d in ((0, 1), (1, 0)):
                        r, c = gr - d[0] * i, gc - d[1] * i
                        x = ubicar(grid, w, r, c, d)
                        if x > 0:
                            celdas = list(grid) + [(r + d[0] * k, c + d[1] * k) for k in range(len(w))]
                            rs = [a for a, _ in celdas]; cs = [b for _, b in celdas]
                            alto, ancho = max(rs) - min(rs) + 1, max(cs) - min(cs) + 1
                            if ancho <= ancho_max and alto <= alto_max:
                                opciones.append((x * 10 - ancho * alto / 20 + rng.random(), r, c, d))
            if opciones:
                _, r, c, d = max(opciones)
                for k, ch in enumerate(w): grid[(r + d[0] * k, c + d[1] * k)] = ch
                puestas.append((e, r, c, d))
        cruces = sum(1 for (r, c) in grid
                     if sum(1 for _, pr, pc, d in puestas
                            if any((pr + d[0] * k, pc + d[1] * k) == (r, c) for k in range(len(_["palabra"])))) > 1)
        rs = [a for a, _ in grid]; cs = [b for _, b in grid]
        area = (max(rs) - min(rs) + 1) * (max(cs) - min(cs) + 1)
        puntaje = len(puestas) * 100 + cruces * 12 - area
        if mejor is None or puntaje > mejor[0]:
            mejor = (puntaje, puestas, grid)
    _, puestas, grid = mejor
    r0 = min(a for a, _ in grid); c0 = min(b for _, b in grid)
    alto = max(a for a, _ in grid) - r0 + 1; ancho = max(b for _, b in grid) - c0 + 1
    filas = [["#"] * ancho for _ in range(alto)]
    for (r, c), ch in grid.items(): filas[r - r0][c - c0] = ch
    # numeración estándar
    inicios = {}
    for e, r, c, d in puestas: inicios.setdefault((r - r0, c - c0), []).append((e, d))
    numeros = {}; n = 0
    for r in range(alto):
        for c in range(ancho):
            if (r, c) in inicios: n += 1; numeros[(r, c)] = n
    horizontales, verticales = [], []
    for (r, c), lst in inicios.items():
        for e, d in lst:
            item = {"n": numeros[(r, c)], "fila": r, "col": c, "respuesta": e["palabra"],
                    "pista": e["pista"], "largo": len(e["palabra"])}
            (horizontales if d == (0, 1) else verticales).append(item)
    usadas = {e["palabra"] for e, *_ in puestas}
    return {
        "ancho": ancho, "alto": alto,
        "grilla": ["".join(f) for f in filas],
        "horizontales": sorted(horizontales, key=lambda x: x["n"]),
        "verticales": sorted(verticales, key=lambda x: x["n"]),
        "descartadas": [e["palabra"] for e in entradas if e["palabra"] not in usadas],
    }

def validar_crucigrama(x: dict) -> list[str]:
    err = []; g = x["grilla"]; H, W = x["alto"], x["ancho"]
    declaradas = {(i["fila"], i["col"], "h") for i in x["horizontales"]} | \
                 {(i["fila"], i["col"], "v") for i in x["verticales"]}
    for item, d in [(i, "h") for i in x["horizontales"]] + [(i, "v") for i in x["verticales"]]:
        r, c = item["fila"], item["col"]
        leida = "".join(g[r + (k if d == "v" else 0)][c + (k if d == "h" else 0)] for k in range(item["largo"]))
        if leida != item["respuesta"]: err.append(f"crucigrama: {item['n']}{d} dice {leida}")
    # palabras fantasma: toda secuencia de 2+ letras debe estar declarada
    for r in range(H):
        c = 0
        while c < W:
            if g[r][c] != "#":
                s = c
                while c < W and g[r][c] != "#": c += 1
                if c - s >= 2 and (r, s, "h") not in declaradas: err.append(f"crucigrama: fantasma horizontal en {r},{s}")
            c += 1
    for c in range(W):
        r = 0
        while r < H:
            if g[r][c] != "#":
                s = r
                while r < H and g[r][c] != "#": r += 1
                if r - s >= 2 and (s, c, "v") not in declaradas: err.append(f"crucigrama: fantasma vertical en {s},{c}")
            r += 1
    return err

# ================================================================== EDICIONES
EDICION_01 = {
    "numero": 1,
    "titulo": "Pasatiempos — Edición N° 1",
    "cifrado": {
        "titulo": "El Cifrado",
        "entradilla": "Esta carta llegó a la redacción sin firma. El remitente exige que se publique en primera plana.",
        "mensaje": ("Señor editor: el pianista sabe más de lo que toca, el petrolero cava más de lo que dice "
                    "y la lluvia del valle no es lo que parece. Quien lea esto miró de cerca. "
                    "Escriba la palabra BATIDO en su boleta de pedido y el envío corre por nuestra cuenta."),
        "cupon": "BATIDO",
        "pistasGratis": 3,
    },
    "cinedoku": {"titulo": "Cinedoku", "palabra": "ZODIAC", "filaOculta": 3,
                 "entradilla": "Complete la grilla con Z, O, D, I, A, C. Una fila guarda un nombre que la redacción prefiere no imprimir."},
    "crucigrama": {
        "titulo": "Crucigrama del Valle",
        "entradas": [
            {"palabra": "PLAINVIEW", "ancla": True, "pista": "Apellido del petrolero que llegó a Little Boston con su hijo y una promesa"},
            {"palabra": "CASABLANCA", "pista": "Ciudad donde un café se niega a tomar partido"},
            {"palabra": "RICK", "pista": "Dueño de ese café, que no se mete en política"},
            {"palabra": "ROCKY", "pista": "Campeón de Filadelfia que pierde el ojo… del tigre"},
            {"palabra": "MAGNOLIA", "pista": "Flor, calle y película de tres horas en el Valle"},
            {"palabra": "RANAS", "pista": "Precipitación poco habitual pronosticada para ese mismo valle"},
            {"palabra": "BATIDO", "pista": "Según un desafío en una bolera, se lo toma el que tiene la pajita más larga"},
            {"palabra": "SIETE", "pista": "Pecados, días o cajas: el número de Somerset"},
            {"palabra": "BOMBAY", "pista": "Ciudad del muchacho que conocía todas las respuestas"},
            {"palabra": "FINCHER", "pista": "Director que convirtió una carta cifrada en obsesión"},
            {"palabra": "PREDICADOR", "pista": "Oficio de Eli, el rival más joven de Little Boston"},
            {"palabra": "MIRAR", "pista": "Lo que hay que hacer de cerca, según el lema de este diario"},
            {"palabra": "PIANISTA", "pista": "Le prohibieron una canción, pero la sabe de memoria"},
            {"palabra": "TIGRE", "pista": "El ojo que Rocky tiene que recuperar"},
        ],
    },
}
EDICIONES = {1: EDICION_01}

def generar(numero: int, semilla: int | None = None):
    e = EDICIONES[numero]; rng = random.Random(semilla if semilla is not None else numero * 82)
    ci = e["cifrado"]; cz = e["cinedoku"]; cr = e["crucigrama"]
    data = {
        "numero": e["numero"], "titulo": e["titulo"],
        "cifrado": {"titulo": ci["titulo"], "entradilla": ci["entradilla"], "cupon": ci["cupon"],
                    "pistasGratis": ci["pistasGratis"], **cifrar(ci["mensaje"], rng)},
        "cinedoku": {"titulo": cz["titulo"], "entradilla": cz["entradilla"],
                     **generar_cinedoku(cz["palabra"], cz["filaOculta"], rng)},
        "crucigrama": {"titulo": cr["titulo"],
                       **armar_crucigrama([{**x, "palabra": normalizar(x["palabra"])} for x in cr["entradas"]], rng)},
    }
    return data

def validar(data) -> list[str]:
    return validar_cifrado(data["cifrado"]) + validar_cinedoku(data["cinedoku"]) + validar_crucigrama(data["crucigrama"])

if __name__ == "__main__":
    accion, numero = sys.argv[1], int(sys.argv[2])
    ruta = OUT / f"edicion-{numero:02d}.json"
    if accion == "generar":
        data = generar(numero)
        errores = validar(data)
        if errores: sys.exit("\n".join(errores))
        OUT.mkdir(parents=True, exist_ok=True)
        ruta.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"OK → {ruta.relative_to(ROOT)}  (cinedoku: {data['cinedoku']['pistas']} pistas, "
              f"crucigrama {data['crucigrama']['ancho']}x{data['crucigrama']['alto']}, "
              f"descartadas: {data['crucigrama']['descartadas']})")
    elif accion == "validar":
        errores = validar(json.loads(ruta.read_text(encoding="utf-8")))
        print("\n".join(errores) or "OK: todo valida")
        sys.exit(1 if errores else 0)
