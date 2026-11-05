# Primera plana: la remera en tapa y el tendedero del kiosco

Referencia visual: `portada-maqueta.html` y `capturas/`. Los recuadros azules marcan lo nuevo. El lema
bajo el nombre del diario y las notas de la maqueta son de muestra: **en esta etapa se implementan
solo la tapa (idea 1) y el tendedero (idea 2)**. La remera de la maqueta es un dibujo plano.

## Objetivo
Que en la primera pantalla se vea una remera con su precio. Hoy la portada no muestra ningún producto
hasta el aviso del final.

## Orden de la portada
1. Cabecera y navegación, como hoy.
2. **La tapa** (idea 1).
3. Dos notas, nada más (en escritorio, en la columna de al lado de la tapa).
4. **El tendedero** (idea 2), a todo el ancho de la hoja.
5. El resto de las notas y avisos de la edición, como hoy.

## 1. La remera es la tapa
- Arriba, chico: la sección y el número de artículo ("ESPECTÁCULOS · ART. N° 001").
- **El titular**, que es una noticia del universo de esa remera ("Llueven ranas sobre el Valle").
- **Sin bajada, sin texto de nota y sin la etiqueta "foto de tapa".**
- **La foto de tapa es la remera girando**: una vuelta completa en loop, renderizada en Blender
  con la luz de estudio (`estudio.hdr`), no 3D en vivo, para que la portada siga liviana.
  - Formato a decidir midiendo (video corto WebM/MP4 sin sonido, o secuencia de imágenes), con
    una imagen fija de la primera vista como `poster`, que es lo que pinta primero.
  - Se descarga después de lo demás. Con `prefers-reduced-motion`, solo la imagen fija.
- **Epígrafe**: el nombre, el detalle y el precio ("El frame de Magnolia — Remera negra oversize
  · $ 32.000") y el botón **VER LA REMERA ▸**, que lleva a la ficha.
- **Cuál remera va en tapa:** rota con la edición del día, entre los productos que tienen la vuelta
  renderizada. Hoy hay una sola (Magnolia), así que es siempre esa hasta que haya más. Cada
  producto necesita su titular de tapa en los datos (`tituloTapa`), con las reglas de contenido de
  siempre (alusiones sí, citas textuales y spoilers no).
- Si un día la remera de tapa es la misma que la noticia principal actual, la noticia principal
  pasa a ser una de las dos notas de abajo.

## 2. El tendedero del kiosco
- Título chico "COLGADAS EN EL KIOSCO". En celular, "deslizá ⟷" y una fila que se desliza con el
  dedo (`scroll-snap`); en escritorio, centradas si entran.
- Una cuerda de lado a lado y **cada remera colgada con dos broches**, con un vaivén suave y
  desfasado entre ellas (CSS, solo `transform`; sin vaivén con movimiento reducido).
- Cada remera: **imagen renderizada en Blender** de la remera colgada (no 3D en vivo), WebP liviano
  con fondo transparente, con la misma luz de estudio. El modelo colgado ya existió (commit
  235fb01, "Remera 3D colgada en percha"): sirve de punto de partida, pero colgada de broches.
- **Etiqueta de precio** de cartón colgando ("N° 001 · $ 32.000") y el nombre debajo, en itálica.
- Toda la remera es un link a su ficha. Con teclado, foco visible.
- **Remeras sin render todavía** (hoy Casablanca y Pecados): cuelgan como un paquete envuelto en
  papel de diario con bramante, con su etiqueta y su nombre, y también llevan a su ficha. Cuando
  tengan render, se reemplazan solas.
- Orden: el del catálogo.
- Las ambientaciones no caen sobre el tendedero.

## Peso
- La portada es la página más visitada: nada de `<model-viewer>` ni three.js acá.
- Objetivo: el tendedero completo por debajo de unos 150 KB y la vuelta de tapa por debajo de
  unos 500 KB, cargando después del contenido. Medir con Lighthouse en celular antes y después.
