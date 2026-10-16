# Pasatiempos — diseño

La sección de pasatiempos de **THE PLAINVIEW**. Este documento define qué es cada juego, las reglas que
comparten y el orden en que se programan. Las sesiones viven en `ROADMAP.md` (Etapa 3, P1–P6).

## 1. Concepto

- Cada pasatiempo es **una página del diario** con URL propia (`/pasatiempos/cifrado`, `/pasatiempos/cinedoku`, …)
  y se llega pasando de página como en el resto del sitio. `/pasatiempos` es la portada de la sección, con el
  carnet de lector y el sumario de la semana. `/juego` redirige ahí.
- Tono: irónico, de diario de época, escrito **desde dentro del mundo del diario** (las películas son noticias).
- Cada pasatiempo termina llevando a una remera (link a la ficha o al índice de avisos).
- Rigen las reglas de CLAUDE.md: **pistas propias**, sin citas textuales, sin fotogramas ni afiches, spoilers mínimos.
- **El tema Zodiac** sale de la película de Fincher, donde el diario de San Francisco publica cifrados. Se usa
  como juego de redacción y de criptografía: nunca se nombra a víctimas reales ni se glorifica al asesino.

## 2. Reglas comunes

### Edición semanal
- Los acertijos salen en **ediciones semanales** de lunes a domingo (semana ISO, hora de Córdoba,
  `America/Argentina/Cordoba`). Id de edición: `AAAA-Wss` (por ejemplo `2026-W43`).
- La página elige la edición que corresponde a la fecha de hoy. Si no hay una para esta semana, muestra
  **la última publicada**: la sección nunca queda vacía.
- No confundir con la "Edición N°" de los drops de remeras (`editions.ts`, S2b): son dos numeraciones distintas.

### Archivos de datos
- Un JSON por semana: `web/src/data/pasatiempos/AAAA-Wss.json`, con un objeto por pasatiempo.
- Tipos en `web/src/data/pasatiempos/types.ts`. El front carga todos los JSON con `import.meta.glob` (Vite).
- Se usa JSON (y no TS) para que el validador de Python los pueda leer sin trucos.
- No todos los pasatiempos tienen que estar todas las semanas: si falta uno, su página dice "Esta semana no
  salió" y muestra el de la edición anterior.

```json
{
  "semana": "2026-W43",
  "cifrado": { "...": "ver §3.1" },
  "cinedoku": { "...": "ver §3.2" },
  "crucigrama": { "...": "ver §3.3" },
  "miraDeCerca": { "...": "ver §3.4" }
}
```

### Validador en Python
- `scripts/validar_pasatiempos.py`, **solo librería estándar** (sin `pip install`).
- Recorre todos los JSON, aplica las reglas de cada juego (detalladas en §3) e imprime un error por línea
  con archivo y campo. Termina con código ≠ 0 si algo falla.
- Se corre **antes de commitear acertijos nuevos**: `python scripts/validar_pasatiempos.py`.
  Más adelante, GitHub Actions lo corre en cada PR (idea ya anotada en IDEAS.md).

### Progreso en localStorage
- Una sola clave: `pv82-pasatiempos`, con versión para poder migrar:
  `{ v: 1, ediciones: { "2026-W43": { cifrado: {...}, cinedoku: {...} } }, carnet: [...] }`.
- Lectura y escritura con try/catch, igual que `load()` en `web/src/context/CartContext.tsx`: si el storage
  no está disponible, se juega igual y el progreso vive solo en memoria.
- Se guarda **lo que hizo el jugador** (celdas completadas, letras asignadas, diferencias encontradas), nunca
  las soluciones.

### Carnet de lector
- Cada pasatiempo resuelto pone **un sello** en el carnet: nombre del juego, semana y fecha.
- El carnet se ve en `/pasatiempos` como una tarjeta de cartón con casilleros por semana.
- Pedir "Ver solución" resuelve el juego **sin sello**.
- Premio por juntar sellos: **a definir** con el dueño (por ejemplo, un cupón al completar los cuatro de una semana).

### Cupones
- El Cifrado revela el **cupón de la semana**.
- El código viaja dentro del JavaScript del sitio: cualquiera que sepa mirar lo encuentra. Por eso los cupones
  son **descuentos chicos**, **vencen con la edición** y se validan **a mano** cuando llega el pedido por WhatsApp.
- En S6 la boleta de pedido suma un campo de cupón que viaja en el mensaje.

### Mobile-first (además de las reglas de CLAUDE.md)
- Celdas, símbolos y teclas de **44px o más**. A 375px: Cinedoku 6×6 ≈ 54px por celda, Crucigrama 5×5 ≈ 65px.
- **Teclado en pantalla propio** con solo las letras que hacen falta: el teclado del sistema tapa medio
  tablero. En la compu también se puede tipear con el teclado físico.
- Nada depende solo de hover.
- Dentro de los tableros se **desactiva el deslizamiento** para pasar de página (`data-no-swipe`) y las flechas
  mueven el cursor del tablero, no la página.

### Accesibilidad
- Los tableros se recorren con flechas y cada celda tiene `aria-label` ("Fila 2, columna 4, vacía").
- Los errores **no se marcan solo con rojo**: llevan además un ícono o un texto.
- Al resolver, un mensaje en una región `aria-live` anuncia el resultado.

## 3. Los pasatiempos

### 3.1 El Cifrado
**Qué es:** cifrado por sustitución al estilo Zodiac. Cada letra del mensaje se reemplaza por un símbolo
propio. Al descifrarlo aparecen un mensaje del mundo del diario y el cupón de la semana.

- **Símbolos:** set SVG propio de la marca (cruces, círculos, triángulos, el 8:2…). Mientras no exista, se usan
  símbolos Unicode geométricos. **No se copian los cifrados reales.**
- **Cómo se juega:** tocás un símbolo, elegís una letra en el teclado y se completan **todas** sus apariciones.
  Empieza con 1–2 letras de pista ya puestas. Cuando todas las asignaciones son correctas, se revela el mensaje y
  el cupón.
- **Mensaje:** de 40 a 80 letras, en español, sin tildes (Ñ permitida). Ejemplo de tono:
  "EL DIARIO RECIBIO OTRA CARTA. DICE QUE MIRE DE CERCA LA PAGINA DE AVISOS".
- **Datos:**
  ```json
  { "mensaje": "…", "simbolos": { "A": "s07", "B": "s12" }, "pistas": ["E", "A"], "cupon": "CIFRADO43" }
  ```
- **El validador revisa:** que `simbolos` sea biyectivo (dos letras nunca comparten símbolo), que todas las letras
  del mensaje tengan símbolo, que las pistas estén en el mensaje, el largo (40–80 letras), que no haya tildes y
  que el cupón tenga formato `MAYUSCULAS` + número de semana.

### 3.2 Cinedoku
**Qué es:** sudoku de 6×6 con bloques de 2×3 y las seis letras **Z O D I A C** en lugar de números.

- **Cómo se juega:** tocás una celda y elegís en un teclado de 6 letras (más "borrar"). Una **fila oculta**,
  que no se marca de antemano, deletrea **ZODIAC** de izquierda a derecha en la solución. Al resolver, esa
  fila se ilumina como revelación final.
- **Datos:**
  ```json
  { "dadas": ["Z....C", "…"], "solucion": ["ZODIAC", "…"], "filaZodiac": 0 }
  ```
  `dadas`: 6 filas de 6 caracteres, `.` = celda vacía.
- **El validador revisa:**
  - que la solución sea un sudoku válido (filas, columnas y bloques sin repetir);
  - que cada letra dada coincida con la solución;
  - **solución única**: un solver por backtracking cuenta soluciones y corta en 2;
  - que `solucion[filaZodiac]` sea `ZODIAC` y que esa fila tenga **2 letras dadas o menos** (si no, no está oculta);
  - dificultad: entre **10 y 16** celdas dadas.

### 3.3 Crucigrama Mini
**Qué es:** crucigrama de 5×5 con casillas negras y pistas escritas **desde dentro del mundo del diario**.

- **Pistas, ejemplos de tono:**
  - "Lo que el petrolero de la primera plana halló en Little Boston (5)" → CRUDO
  - "Lo que reabre en Casablanca, según Espectáculos (4)" → CAFE
- **Cómo se juega:** tocás una celda para escribir; si la volvés a tocar, cambia la dirección (horizontal ↔ vertical).
  La pista activa se muestra fija arriba del teclado. Teclado en pantalla A–Z + Ñ. Se puede verificar
  una palabra o todo el crucigrama.
- **Datos:**
  ```json
  { "grilla": ["CRUDO", "A#…", "…"], "pistas": { "horizontales": { "1": "…" }, "verticales": { "1": "…" } } }
  ```
  `#` = casilla negra. La numeración **no se escribe**: el front y el validador la calculan con la misma regla.
- **El validador revisa:** grilla de 5×5, numeración calculada, que cada palabra tenga **exactamente una** pista
  y que no sobren pistas, palabras de **3 letras o más**, sin tildes (Ñ permitida). Que las pistas no citen
  películas textualmente se revisa a mano.

### 3.4 Mirá de Cerca
**Qué es:** siete diferencias entre dos versiones de una estampa de la marca: la original y una alterada.

- **Arte:** siempre **ilustraciones propias** (nunca fotogramas). Es el cuello de botella: cada edición necesita
  dos imágenes nuevas, aunque se puede repetir estampa con otras diferencias.
- **Cómo se juega:** tocás sobre la imagen alterada donde ves una diferencia. Si acertás, aparece un círculo y
  la descripción. En mobile las dos imágenes van **una arriba de la otra**; desde `md`, lado a lado. Los toques
  errados se cuentan pero no penalizan. Al terminar, link a la remera de esa estampa.
- **Datos:**
  ```json
  {
    "productSlug": "magnolia",
    "original": "/pasatiempos/2026-W43-original.webp",
    "alterada": "/pasatiempos/2026-W43-alterada.webp",
    "diferencias": [{ "x": 42.5, "y": 30, "r": 7, "descripcion": "Falta una gota" }]
  }
  ```
  `x`, `y` y `r` son **porcentajes del ancho/alto**, para que funcione en cualquier tamaño.
- **El validador revisa:** exactamente **7** diferencias, todas dentro de la imagen, `r ≥ 6,5` (a 343px de ancho
  el área tocable mide 44px o más), que no se superpongan, que los archivos existan en `web/public/` y pesen
  **menos de 150 KB**, y que `productSlug` exista.

### 3.5 La Función del Día
**Qué es:** el juego que ya existe (`web/src/data/game.ts`, `web/src/pages/Game.tsx`): ¿de qué película es
esta pista?

- Mantiene su **ritmo diario** dentro de la edición semanal: una pista por día, igual para todos (elegida por fecha).
- Mejoras: intentos limitados, pistas progresivas (texto → detalle de la estampa → paleta de colores), racha y
  resultado para compartir con emojis.
- **Ojo con la portada:** si las películas del juego salen en las noticias del día, la portada no muestra la pista
  (ya resuelto en S2).

## 4. Orden de implementación

| Sesión | Qué | Por qué en este orden |
|---|---|---|
| P1 | Base común: `/pasatiempos`, edición semanal, JSON + tipos, validador base, progreso, carnet; La Función del Día mudada tal cual | Los cuatro juegos nuevos la necesitan |
| P2 | **El Cifrado** | El más simple de programar; trae el cupón |
| P3 | **Cinedoku** | Grilla + teclado reutilizables; el validador de solución única es el ejercicio fuerte de Python |
| P4 | **Crucigrama Mini** | Reusa grilla y teclado; suma direcciones y numeración |
| P5 | **Mirá de Cerca** | Depende del arte; se programa cuando las imágenes estén listas |
| P6 | La Función del Día mejorada | Ya funciona; se pule al final |
