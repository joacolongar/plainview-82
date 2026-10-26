"""Genera las imágenes Open Graph (1200×630, JPG) de THE PLAINVIEW en web/public/og/.

Uso (desde la raíz, con `npm run dev` corriendo en web/):
    python3 -I scripts/og/generar.py              # portada + todas las remeras
    python3 -I scripts/og/generar.py magnolia     # solo algunas
    python3 -I scripts/og/generar.py --puerto 5180

Cómo funciona: copia la plantilla (plantilla.html/.css/.js) un rato a web/public/ como __og.*, le saca una captura
con Edge headless por cada imagen y convierte cada PNG a JPG con el canvas de Edge (no hay cwebp ni Pillow).
Va en JPG y no en WebP porque WhatsApp no siempre muestra WebP en las vistas previas. Al final borra los temporales.
"""

import base64
import html
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
WEB = RAIZ / "web"
PUBLIC = WEB / "public"
SALIDA = PUBLIC / "og"
EDGE = "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
TEMP_WIN = Path("/mnt/c/Windows/Temp/plainview-og")
ANCHO, ALTO = 1200, 630
CALIDAD_JPG = 0.85


def slugs() -> list[str]:
    """Los slugs del catálogo, leídos de products.ts (Python no puede importar TypeScript)."""
    texto = (WEB / "src/data/products.ts").read_text(encoding="utf-8")
    return re.findall(r"^\s*slug: '([a-z0-9-]+)'", texto, re.M)


def edge(*args: str, timeout: int = 90) -> str:
    perfil = f"C:\\Windows\\Temp\\plainview-og-perfil"
    r = subprocess.run([EDGE, "--headless", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
                        f"--user-data-dir={perfil}", *args], capture_output=True, text=True, timeout=timeout)
    return r.stdout


def main() -> None:
    args = sys.argv[1:]
    puerto = "5173"
    if "--puerto" in args:
        i = args.index("--puerto")
        puerto = args[i + 1]
        del args[i : i + 2]
    ids = args or ["portada", *slugs()]
    base = f"http://localhost:{puerto}"

    temporales = [PUBLIC / "__og.html", PUBLIC / "__og.css", PUBLIC / "__og.js",
                  PUBLIC / "__og-jpg.html", PUBLIC / "__og-jpg.js", PUBLIC / "__og-png"]
    try:
        for ext in ("html", "css", "js"):
            shutil.copyfile(RAIZ / f"scripts/og/plantilla.{ext}", PUBLIC / f"__og.{ext}")
        TEMP_WIN.mkdir(parents=True, exist_ok=True)
        (PUBLIC / "__og-png").mkdir(exist_ok=True)

        # 1. Una captura por imagen
        for id_ in ids:
            png = TEMP_WIN / f"{id_}.png"
            png.unlink(missing_ok=True)
            edge(f"--window-size={ANCHO},{ALTO}", f"--screenshot=C:\\Windows\\Temp\\plainview-og\\{id_}.png",
                 "--virtual-time-budget=10000", f"{base}/__og.html?id={id_}")
            if not png.exists():
                sys.exit(f"Edge no generó la captura de {id_} (¿está corriendo npm run dev en el puerto {puerto}?)")
            shutil.copyfile(png, PUBLIC / "__og-png" / f"{id_}.png")

        # 2. PNG → JPG con el canvas de Edge
        (PUBLIC / "__og-jpg.html").write_text('<!doctype html><meta charset="utf-8"><pre id="out"></pre>'
                                              '<script type="module" src="/__og-jpg.js"></script>', encoding="utf-8")
        (PUBLIC / "__og-jpg.js").write_text(
            "const ids = new URLSearchParams(location.search).get('ids').split(',')\n"
            "const out = {}\n"
            "for (const id of ids) {\n"
            # onload y no decode(): decode() no termina en el reloj virtual de Edge headless
            "  const i = new Image()\n"
            "  await new Promise((ok, mal) => { i.onload = ok; i.onerror = () => mal(new Error(id)); i.src = `/__og-png/${id}.png` })\n"
            f"  const c = document.createElement('canvas'); c.width = {ANCHO}; c.height = {ALTO}\n"
            "  c.getContext('2d').drawImage(i, 0, 0)\n"
            f"  out[id] = c.toDataURL('image/jpeg', {CALIDAD_JPG})\n"
            "}\n"
            "document.getElementById('out').textContent = JSON.stringify(out)\n", encoding="utf-8")
        # Si algo falla en la conversión, que se vea el error en vez de un JSON vacío
        dom = edge("--dump-dom", "--virtual-time-budget=15000", f"{base}/__og-jpg.html?ids={','.join(ids)}")
        crudo = html.unescape(re.search(r'<pre id="out">(.*?)</pre>', dom, re.S).group(1))
        if not crudo:
            sys.exit("La conversión a JPG no devolvió nada (Edge no llegó a cargar las capturas)")
        datos = json.loads(crudo)

        SALIDA.mkdir(exist_ok=True)
        for id_, url in datos.items():
            assert url.startswith("data:image/jpeg;base64,"), id_
            jpg = base64.b64decode(url.split(",", 1)[1])
            (SALIDA / f"{id_}.jpg").write_bytes(jpg)
            print(f"og/{id_}.jpg  {len(jpg) // 1024} KB")
    finally:
        for t in temporales:
            if t.is_dir():
                shutil.rmtree(t, ignore_errors=True)
            else:
                t.unlink(missing_ok=True)
        shutil.rmtree(TEMP_WIN, ignore_errors=True)


if __name__ == "__main__":
    main()
