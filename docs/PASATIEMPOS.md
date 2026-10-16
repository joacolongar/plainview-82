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
  **BATIDO** = envío gratis).
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
  mantener apretado, anotás candidatos chiquitos (modo lápiz).
- **Próximas ediciones:** otras palabras de 6 letras distintas, o 4×4 para una edición
  "fácil" (por ejemplo RICK).

## III. Crucigrama del Valle

Crucigrama cruzado (no denso) de 11×13, con 12 palabras. Es el tamaño máximo cómodo a 375 px:
celdas de unos 30 px.

- **Pistas:** escritas desde dentro del mundo del diario, con doble lectura. El largo de la
  palabra va entre paréntesis.
- **Cómo se juega:** tocar una celda resalta la palabra y muestra su pista en una **barra fija
  arriba del teclado** (como el mini del NYT). Tocar de nuevo cambia entre horizontal y
  vertical. Se escribe con el teclado nativo, usando un `<input>` oculto.
- **Ancla:** PLAINVIEW siempre entra (`"ancla": true`). Las palabras que no encajan quedan en
  `descartadas` y se pueden usar en la próxima edición.

### Edición 1 — palabras

Horizontales: MIRAR, RICK, PREDICADOR, RANAS, PLAINVIEW, BOMBAY.
Verticales: MAGNOLIA, TIGRE, PIANISTA, CASABLANCA, ROCKY, SIETE.

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
- **Ojo:** las soluciones están en el JSON, así que cualquiera que mire el código las puede ver.
  Para una marca chica alcanza, y el cupón se controla a mano por WhatsApp. Si el repo es
  público, conviene no anunciar los cupones con premios grandes.
- El progreso (letras puestas, sellos, tiempos) se guarda en `localStorage` con try/catch,
  con clave `pv82-pasatiempos-NN`.

## Orden de implementación

1. **Marco de la página Pasatiempos** + Carnet de lector + carga del JSON (1 sesión)
2. **El Cifrado** (1-2 sesiones): el más simple de programar y el que da el cupón
3. **Cinedoku** (1-2 sesiones): grilla, teclado de 6, modo lápiz, verificación
4. **Crucigrama** (2 sesiones): selección de palabra, input oculto, barra de pista
5. **Sellos, tiempos y compartir** (1 sesión)
6. Mirá de Cerca y La Función del Día, cuando haya ilustraciones
