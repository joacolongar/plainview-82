/**
 * La clave del Cifrado viaja en el JSON como base64 de un JSON { símbolo: letra } (ver scripts/pasatiempos.py).
 * `atob` devuelve bytes sueltos ("binary string"); como la Ñ y los símbolos ocupan varios bytes en UTF-8,
 * hay que pasarlos por TextDecoder para recuperar el texto bien.
 */
export function decodificarClave(base64: string): Record<string, string> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

/** Símbolos distintos del texto cifrado, en orden de primera aparición (así se recorren y se numeran) */
export function simbolosEnOrden(cifrado: string, clave: Record<string, string>): string[] {
  const vistos: string[] = []
  for (const ch of cifrado) if (ch in clave && !vistos.includes(ch)) vistos.push(ch)
  return vistos
}
