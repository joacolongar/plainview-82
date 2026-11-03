# Entrada — el diario con faja

Referencia visual y de comportamiento para la entrada al sitio. La maqueta (`entrada-maqueta.html`)
se abre en el navegador; abajo a la derecha tiene "Lento ×3", "Movimiento reducido" y "Ver de nuevo"
(esos controles son solo de la maqueta). **La portada de la maqueta es una imitación:** en el sitio,
el diario doblado tiene que ser la portada real de la edición del día (mismo componente).

## Qué se ve
- La primera plana de hoy, doblada al medio: se ve la mitad de arriba (cabecera, nav y titular).
  Sombra en el pliegue y sombra sobre la mesa.
- Escritorio (≥ 768 px): sobre la mesa de madera, girado −2,5°, unos 700 px de ancho. La hoja doblada
  tiene proporción de diario (alto ≈ 1,3 × ancho), no la de la pantalla.
- Celular: fondo oscuro con un foco de luz al centro, girado −1°, casi todo el ancho.
- **Faja roja** (el rojo del 8:2) que envuelve el diario, con las puntas dobladas por detrás.
  **Lleva solo el botón INGRESAR, sin otros textos.**
  - Va en la parte baja de la mitad visible (74 % en escritorio, 86 % en celular), para que se lean
    la cabecera y el titular.
  - Vive a escala de pantalla (no dentro del diario escalado): el botón siempre tiene tamaño legible
    y al menos 48 px de alto.

## La apertura (≈ 2 s)
1. **La faja se corta al medio.** Cerrada es **una sola faja entera**, sin ningún rastro del corte.
   Al tocar, en el mismo cuadro se reemplaza por dos mitades idénticas con el borde del corte en
   zigzag (`clip-path`). No dejar las mitades visibles en reposo: el antialias y la sombra del borde
   dibujan una línea en el botón. El botón está dibujado en la faja, así que **se corta con ella**.
   El `<button>` real es invisible, va encima y recibe el toque y el foco.
   - Tensión: las mitades se separan 6 px (0,12 s) y se ve el papel por el corte.
   - Cada mitad sale despedida hacia su lado, girando y cayendo, y se desvanece (0,6 s, sin
     "anticipación" hacia adentro: si no, las mitades se pisan).
2. A los 0,4 s del corte, la mitad de abajo se despliega con `rotateX` de −180° a 0° (0,7 s); el diario
   se endereza y se re-centra mientras tanto.
3. El diario se agranda hasta coincidir exactamente con la página real (0,55 s, técnica FLIP con
   `getBoundingClientRect`) y la capa se desvanece (0,3 s). No hay corte: lo que queda es el sitio.

Solo se animan `transform` y `opacity`. Sin video ni librerías.

## Reglas
- Aparece solo al entrar por `/` en una pestaña nueva (`sessionStorage`, clave sugerida
  `pv82-entrada`, con try/catch). No aparece al navegar, al tocar el logo, al recargar ni al entrar
  directo a otra ruta (links compartidos de remeras).
- La página se renderiza debajo desde el principio; la entrada es una capa encima. Si falla
  JavaScript o el almacenamiento, se ve la página normal.
- `prefers-reduced-motion`: solo fundido, sin corte ni despliegue.
- Foco inicial en INGRESAR (funciona con Enter), pero el anillo de foco aparece solo si la persona
  usa el teclado; es del tamaño del botón dibujado.
  Mientras está la capa, el fondo no scrollea.
- No romper CSP, Open Graph ni Lighthouse.

## Capturas
- `secuencia-celular.jpg` y `secuencia-compu.jpg`: cerrado, corte, mitades saliendo, abriendo,
  abierto y sitio.
- `capturas/`: cada momento por separado, en celular (375 px) y escritorio (1440 px).
