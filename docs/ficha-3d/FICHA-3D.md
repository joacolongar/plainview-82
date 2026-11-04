# Ficha de producto con fotos y remera 3D

Referencia visual y de comportamiento. La maqueta (`ficha-3d-maqueta.html`) se puede tocar: figuras,
GIRALA, Frente / Espalda / Detalle, los números rojos y los colores. **La remera de la maqueta es un
dibujo plano que ocupa el lugar del modelo 3D**, y las fotos son marcadores de lugar.

## Idea
La galería es una **lámina** del diario con figuras numeradas. Las fotos con modelo van primero
(es lo que vende y es la imagen de Open Graph); el 3D es la última figura, para el que quiere mirar
de cerca.

## La lámina
- Marco con borde de tinta, proporción 4:5.
- **Tira de figuras:** Fig. 1, 2, 3… (fotos) y al final **Fig. 4 en 3D**, con fondo de tinta, el
  dibujo de una remera y "360°". En celular va debajo del marco (4 columnas); en escritorio, en una
  columna a la izquierda del marco.
- Sobre la foto, abajo a la derecha, un sello **GIRALA** que abre el 3D.
- **Pie de foto** que cambia con la figura. En las fotos con modelo dice quién es, cuánto mide y qué
  talle usa: "Fig. 1 — El lector Tomás mide 1,80 m y usa talle M." Es información de compra, no
  decoración.

## El visor 3D (Fig. 4)
- Se carga **solo al elegir la Fig. 4 o tocar GIRALA**. Antes no se descarga nada del 3D.
- Fondo de papel con luz al centro. Pista "Arrastrá para girarla" abajo, que se va al primer uso.
- Barra inferior: **FRENTE · ESPALDA · DETALLE** (mínimo 44 px de alto). Detalle acerca la cámara
  a la estampa principal.
- **Puntos de la Fe de erratas** (círculos rojos numerados) al lado de cada parte de la estampa, sin
  taparla. Al tocar uno, se abre una nota arriba: "FE DE ERRATAS · 1 — Donde dice…, debió decir…".
  Los números coinciden con la lista de la Fe de erratas de la ficha. En el modelo real, cada punto
  se ancla a una posición 3D y se oculta cuando esa cara no se ve.
- **El color elegido cambia la prenda en vivo** (y el color de las estampas que dependen de él).
- Al abrir, una vuelta lenta y se detiene; con `prefers-reduced-motion`, quieta.
- Dentro del visor, el deslizamiento gira la remera y **no** pasa de página. Las ambientaciones no
  caen sobre el marco.
- Si no hay WebGL o falla la carga, se queda en la foto y la Fig. 4 no aparece.

## Datos (sugerido)
Por producto en `products.ts`: lista de fotos con su pie (modelo, altura, talle, color), el diseño
3D (`.glb`) y los puntos de la Fe de erratas con su posición 3D. Un producto sin 3D no muestra la
Fig. 4 ni el sello. Si hay fotos por color, al cambiar el color se muestran las de ese color.

## El modelo
- Una sola remera base; cada diseño es su textura (`scripts/blender/aplicar-diseno.sh`).
- Para la web, **textura de 2048 px** (la de 4096 queda para renders): 4096 ocupa unos 64 MB en la
  memoria del celular. GLB comprimido (Draco o Meshopt).
- La herramienta (`<model-viewer>` o React Three Fiber) se decide en el plan, con el dueño: es una
  dependencia nueva. Tiene que instalarse en el proyecto, no por CDN (CSP).

## Capturas
`resumen-celular.jpg` (fotos, 3D, nota abierta), `resumen-compu.jpg` (fotos y 3D) y `capturas/`.
