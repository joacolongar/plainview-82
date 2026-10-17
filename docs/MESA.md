# La mesa: fondo de madera en la compu

En pantallas anchas, el diario está apoyado sobre una mesa de madera oscura en vez del fondo negro.
Maqueta: `docs/mesa-maqueta.png`. Textura: `web/public/texturas/mesa-madera.webp` (1600×1200, ~28 KB,
generada por nosotros: sin licencias de terceros).

## Cómo aplicarla

- Solo desde **768 px de ancho** (`@media (min-width: 768px)`). En celular el diario ocupa toda la
  pantalla y el fondo actual queda igual.
- `body`: color de respaldo `#1a100b` + la textura con `background-size: cover`. Que la textura
  quede **quieta mientras se scrollea**: con `background-attachment: fixed` o, mejor, una capa
  `position: fixed` detrás de todo (anda mejor en todos los navegadores).
- Encima de la madera, una capa fija con:
  - una **luz cálida muy suave** arriba al centro, como una lámpara sobre la mesa
    (`radial-gradient` de un tono crema casi transparente);
  - una **viñeta** que oscurece los bordes de la pantalla.
- El diario (la hoja) lleva una **sombra en capas**, como un papel apoyado:
  `0 1px 1px rgba(0,0,0,.25), 0 10px 18px rgba(0,0,0,.35), 0 28px 60px rgba(0,0,0,.45)`.
- **No rotar la hoja entera** (en la maqueta está girada 0,6° solo para mostrar la idea): rotar todo
  el texto lo vuelve un poco borroso. Si se quiere ese efecto, se gira una capa de fondo detrás de la
  hoja (un `::before` con el color del papel y la sombra), no el contenido.
- Al pasar de página, la transición de hoja ocurre sobre la madera, que no se mueve.
- Agregar la textura a la CSP si hiciera falta (es `img-src 'self'`, así que ya está permitida).
