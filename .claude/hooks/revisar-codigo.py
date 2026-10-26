"""Hook PreToolUse de Claude Code: frena ediciones que rompen las reglas de seguridad de CLAUDE.md.

Claude Code le pasa por stdin un JSON con la herramienta (Edit, Write, MultiEdit) y lo que quiere escribir.
Si este script sale con código 2, la edición no se hace y el mensaje de stderr le llega a Claude como motivo.
"""

import json
import os
import re
import sys
from pathlib import Path

# Solo se revisa el código del sitio y de las Functions: CLAUDE.md y docs pueden nombrar estas APIs.
CARPETAS_REVISADAS = ("web/src/", "web/functions/")

PROHIBIDAS = [
    (re.compile(r"dangerouslySetInnerHTML"), "dangerouslySetInnerHTML"),
    (re.compile(r"\b(inner|outer)HTML\b"), "innerHTML / outerHTML"),
    (re.compile(r"\binsertAdjacentHTML\b"), "insertAdjacentHTML"),
    (re.compile(r"\beval\s*\("), "eval()"),
    (re.compile(r"\bnew\s+Function\s*\("), "new Function()"),
    (re.compile(r"\bdocument\.write(ln)?\b"), "document.write"),
]

# En index.html solo se revisan los scripts en línea: la CSP de _headers los bloquea en producción.
INDEX_HTML = "web/index.html"
SCRIPTS_EN_LINEA = [
    # <script> sin src (el JSON-LD no se ejecuta, así que se permite)
    (re.compile(r"<script\b(?![^>]*\bsrc\s*=)(?![^>]*application/ld\+json)[^>]*>", re.I), "<script> en línea"),
    (re.compile(r"\son[a-z]+\s*=", re.I), "atributo on… (onclick, onload…)"),
    (re.compile(r"javascript:", re.I), "link javascript:"),
]

# Archivos con secretos (las claves reales viven ahí). .env.example sí se puede editar: es la plantilla sin claves.
SECRETOS = {".env", ".dev.vars"}


def es_secreto(nombre: str) -> bool:
    if nombre == ".env.example":
        return False
    return nombre in SECRETOS or nombre.startswith(".env.")


def texto_nuevo(herramienta: str, entrada: dict) -> str:
    if herramienta == "Write":
        return entrada.get("content", "")
    if herramienta == "Edit":
        return entrada.get("new_string", "")
    if herramienta == "MultiEdit":
        return "\n".join(e.get("new_string", "") for e in entrada.get("edits", []))
    return ""


def frenar(motivo: str) -> None:
    print(motivo, file=sys.stderr)
    sys.exit(2)


def main() -> None:
    datos = json.load(sys.stdin)
    herramienta = datos.get("tool_name", "")
    entrada = datos.get("tool_input", {})
    ruta = Path(entrada.get("file_path", ""))
    # La raíz del proyecto (no el cwd, que cambia si una sesión hace `cd web`).
    proyecto = Path(os.environ.get("CLAUDE_PROJECT_DIR") or datos.get("cwd") or ".").resolve()

    if es_secreto(ruta.name):
        frenar(f"Bloqueado: {ruta.name} guarda secretos y no se edita desde Claude (CLAUDE.md, Seguridad). "
               "Pedile al dueño que lo cambie a mano; .env.example sí se puede editar.")

    try:
        relativa = ruta.resolve().relative_to(proyecto).as_posix()
    except ValueError:
        return  # fuera del proyecto: no es asunto de este hook

    texto = texto_nuevo(herramienta, entrada)
    if relativa == INDEX_HTML:
        encontradas = [nombre for patron, nombre in SCRIPTS_EN_LINEA if patron.search(texto)]
        if encontradas:
            frenar(f"Bloqueado en {relativa}: {', '.join(encontradas)}. CLAUDE.md (Seguridad): nada de scripts en "
                   "línea en index.html (la CSP los bloquea); el código va en un archivo aparte con src.")
        return
    if not relativa.startswith(CARPETAS_REVISADAS):
        return

    encontradas = [nombre for patron, nombre in PROHIBIDAS if patron.search(texto)]
    if encontradas:
        frenar(f"Bloqueado en {relativa}: {', '.join(encontradas)}. CLAUDE.md (Seguridad) prohíbe armar HTML o "
               "código con texto: mostrá el texto con JSX, que lo escapa.")


if __name__ == "__main__":
    main()
