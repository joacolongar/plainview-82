# Pasatiempos — THE PLAINVIEW

La página de pasatiempos del diario. Tiene que ser **divertida pero no regalada**: el lector
tiene que sentir que *miró de cerca* para ganar. Los textos son siempre propios y nunca citan
diálogos de las películas.

Maqueta de referencia: `docs/pasatiempos-maqueta.png` (390 px, celular).

---

## Principios de dificultad

1. **Justo, nunca imposible.** Todo se resuelve con lógica o con cultura cinéfila, sin adivinar.
   El script lo garantiza para el Cinedoku (solución única y solo con lógica) y el Crucigrama
   (sin palabras fantasma).
2. **Las pistas cuestan.** Cada juego da 3 **pistas del editor** (◆◆◆). Usarlas no te deja
   trabado, pero baja el sello que ganás.
3. **Sin verificar a cada rato.** El botón "Verificar" marca los errores, pero cada uso cuenta.
   Así no se puede resolver probando letras al azar.
4. **El que mira de cerca gana más.** Las pistas del crucigrama tienen doble lectura, el cifrado
   tiene palabras repetidas que lo destraban y el Cinedoku esconde una palabra.
5. **"Me rindo" siempre existe**, pero muestra la solución y deja el sello en blanco.

### Sellos (por juego)

| Sello | Condición |
|---|---|
| **Primera plana** (oro) | Sin pistas y con 1 verificación como máximo |
| **Página central** (plata) | Hasta 1 pista o 3 verificaciones |
| **Clasificados** (bronce) | Resuelto de cualquier forma |
| — | "Me rindo" |

Los sellos se ven en el **Carnet de lector**, al pie de la página. Completar los tres juegos de
la edición desbloquea el mensaje del Cifrado (el cupón) y un resultado para compartir:

```
THE PLAINVIEW · Pasatiempos N° 1
Cifrado      ★★★  4:12
Cinedoku     ★★☆  6:40
Crucigrama   ★☆☆  11:05
Watch closer. plainview-82.pages.dev/pasatiempos
```

---

## I. El Cifrado

Homenaje a las cartas cifradas que obsesionan al diario de *Zodiac*. Es una **sustitución
simple**: cada letra tiene un símbolo fijo.

- **Cómo se juega:** tocás un símbolo y elegís la letra en un teclado. Se completa en **todas**
  las apariciones de ese símbolo a la vez.
- **Dificultad:** ninguna letra viene dada (19 símbolos distintos en la Edición 1). Se respetan
  los espacios y la puntuación: es lo que lo hace jugable en celular. Lo que lo destraba son las
  palabras repetidas ("DE", "LO QUE", "MAS DE LO QUE") y la estructura de carta ("SEÑOR EDITOR").
- **Pista del editor:** revela una letra a elección.
- **Premio:** al resolverlo, el mensaje dice qué palabra escribir en la boleta (Edición 1:
  **TORRE** = envío gratis). Ver "Cupones" más abajo.
- **En el JSON** no va el mensaje en claro ni el cupón: solo `cifrado` (el texto ya cifrado, con
  espacios y puntuación) y `clave` (JSON símbolo → letra, en base64). El front decodifica la clave
  para verificar lo que pone el lector.
- **Símbolos:** dibujarlos como **SVG propios** en `web/src/components/pasatiempos/glyphs/`.
  Los caracteres Unicode del JSON son solo identificadores, porque varios no tienen fuente en
  todos los celulares.

## II. Cinedoku

Sudoku de 6×6 (cajas de 2×3) que se completa con las letras **Z O D I A C**.

- **Truco:** la **fila oculta** (sombreada, la 4ª) arranca vacía y, resuelta, deletrea
  **ZODIAC**. Un lector atento lo deduce y gana tiempo.
- **Dificultad:** 10 pistas iniciales, el mínimo práctico para 6×6. Garantizado: solución
  única y resoluble solo con *singles* (sin prueba y error).
- **Cómo se juega:** tocás la celda y después la letra en el teclado de 6 botones. Con
  mantener apretado, anotás candidatos chiquitos (modo lápiz). Como un gesto solo no alcanza
  (regla mobile-first), también hay un interruptor **Lápiz**, y en la compu Shift + letra.
- **No marca conflictos solo** (sería verificar gratis): resalta la fila, la columna y la caja de la
  celda elegida y las celdas con la misma letra. Errores, solo con "Verificar".
- **Pistas del editor:** 3 (`pistasGratis` en el JSON); cada una revela la celda elegida.
- **Próximas ediciones:** otras palabras de 6 letras distintas, o 4×4 para una edición
  "fácil" (por ejemplo RICK).

## III. Crucigrama del Valle

Crucigrama cruzado (no denso) de **8 columnas** como máximo (15 filas en la Edición 1). Con 8
columnas, a 375 px cada celda mide unos **42 px**, casi el mínimo de 44 px de la regla mobile-first.
Las palabras de más de 8 letras, incluida el ancla PLAINVIEW, **solo van en vertical**
(el script lo garantiza al armar y al validar).

- **Pistas:** escritas desde dentro del mundo del diario, con doble lectura. El largo de la
  palabra va entre paréntesis.
- **Cómo se juega:** tocar una celda resalta la palabra y muestra su pista en una **barra fija
  arriba del teclado** (como el mini del NYT), con botones **"‹ anterior"** y **"siguiente ›"** para
  pasar de pista sin apuntarle a celdas chicas. Tocar de nuevo cambia entre horizontal y
  vertical. Se escribe con el teclado nativo, usando un `<input>` oculto.
- **Pistas del editor:** 3 (`pistasGratis` en el JSON); cada una revela la celda elegida, que queda fija
  y se saltea al escribir. "Verificar" marca las letras equivocadas; "Me rindo" completa todo sin sello.
- **Ancla:** PLAINVIEW siempre entra (`"ancla": true`). Las palabras que no encajan quedan en
  `descartadas` y se pueden usar en la próxima edición.

### Edición 1 — palabras

Grilla de 8×15 con 11 palabras.
Horizontales: RICK, BATIDO, ROCKY, PIANISTA, TIGRE.
Verticales: SIETE, BOMBAY, CONCURSO, PLAINVIEW, MAGNOLIA, MIRAR.
No entraron (quedan para otra edición): CASABLANCA, PREDICADOR, FINCHER.
RANAS se sacó: era el final de Magnolia escrito como respuesta (ver la regla de spoilers en CLAUDE.md).
Ninguna pista puede nombrar una respuesta de la grilla (ni la suya ni otra): `validar` lo controla.

---

## Próximos juegos (sin contenido todavía)

### IV. Mirá de Cerca
Dos versiones de una estampa propia con **7 diferencias**. Se tocan sobre la imagen.
Dificultad: diferencias chicas y temáticas (un número de página, una sombra, un objeto de la
película). Necesita las ilustraciones (PNG original + PNG modificada + coordenadas de las 7
diferencias).

### V. La Función del Día
Una película por día, igual para todos (se elige por la fecha). Seis intentos, con una pista
nueva tras cada error:
1. Titular de THE PLAINVIEW sobre la película (en el tono de la portada)
2. Un objeto clave
3. Década
4. Paleta de 5 colores de la película (generada por nosotros, sin usar fotogramas)
5. Iniciales del director
6. Una noticia de la sección policiales o deportes

El campo de respuesta autocompleta con una lista de películas, así no se pierde por un error
de tipeo.

---

## Datos y validación

- Las ediciones viven en `web/src/data/pasatiempos/edicion-NN.json`. El front solo las lee.
- `scripts/pasatiempos.py` genera y valida:
  ```bash
  python scripts/pasatiempos.py generar 1   # escribe edicion-01.json
  python scripts/pasatiempos.py validar 1   # falla si algo no cierra
  ```
- Para una edición nueva, se agrega `EDICION_02` en el script (mensaje, palabra del Cinedoku y
  entradas del crucigrama con pistas) y se genera.
- **Ojo:** las soluciones del Cinedoku y del Crucigrama están en el JSON, así que cualquiera que
  mire el código las puede ver. Para una marca chica alcanza.

### Cupones
- El cupón sale **solo** del mensaje del Cifrado. En el JSON está cifrado y con la clave en base64:
  eso evita leerlo de un vistazo, **no es seguridad**. Además, el mensaje en claro está en
  `scripts/pasatiempos.py`, que es público en GitHub.
- Por eso el cupón es siempre **de bajo valor**, vale **uno por pedido** y **cambia en cada edición**.
- Se valida **a mano** cuando llega el pedido por WhatsApp (la boleta suma un campo de cupón en S6).
- El cupón **no puede ser palabra de ningún juego** de la edición: `validar` falla si aparece en
  claro en cualquier parte del JSON.
- El progreso (letras puestas, sellos, tiempos) se guarda en `localStorage` con try/catch,
  con clave `pv82-pasatiempos-NN`.

## Orden de implementación

1. **Marco de la página Pasatiempos** + Carnet de lector + carga del JSON (1 sesión)
2. **El Cifrado** (1-2 sesiones): el más simple de programar y el que da el cupón
3. **Cinedoku** (1-2 sesiones): grilla, teclado de 6, modo lápiz, verificación
4. **Crucigrama** (2 sesiones): selección de palabra, input oculto, barra de pista
5. **Sellos, tiempos y compartir** (1 sesión)
6. Mirá de Cerca y La Función del Día, cuando haya ilustraciones
