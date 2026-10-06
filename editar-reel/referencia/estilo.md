# Estilo de referencia

Sacado fotograma a fotograma del reel que eligió el usuario (`vd/referencias/estilo-ejemplo.mp4`,
Erik Taveras, 98 s). Es la **base** del estilo, no un calco: se copia la forma (maqueta, paleta,
tipografía, tipos de pieza, ritmo), y el contenido de cada pieza sale siempre de lo que dice el usuario en
su propio vídeo. No es necesario que las animaciones sean idénticas a las del ejemplo.

## Principios
- El vídeo **siempre a pantalla completa**. Nunca se encoge ni se recoge en una tarjeta.
- Todo el grafismo vive en una franja: **subtítulos en una línea fija** y, justo debajo, la tarjeta del momento.
- Casi siempre hay una tarjeta en pantalla, sincronizada con lo que dice; cambia en cuanto cambia el tema.
- Paleta sobria: crema `#efefea`, tinta `#0c1014`, verde `#007656`, menta `#58caad`; rojo `#8a2820` solo
  para sellos/alertas; amarillo `#f6e5b8` solo para cintas de aviso.
- Tipografías: condensada en mayúsculas para subtítulos (Barlow Condensed) y titulares (Anton);
  monoespaciada en mayúsculas con espaciado para etiquetas (JetBrains Mono); Inter para el texto de las tarjetas.

## Piezas
- **Subtítulos karaoke**: 3–4 palabras, 1–2 líneas, blancas con borde/sombra suave, mayúsculas, mucho
  espacio entre palabras; la palabra que suena en menta. Sin animación de escala.
- **Tarjetas tipo app**: crema, esquinas redondeadas, sombra, **escuadras menta** en las cuatro esquinas,
  cabecera mono "01 LO QUE PUEDE CONSULTAR ··· 3 / 8". Las casillas pasan de discontinuas a marcadas
  (check verde) cuando lo nombra. Entran con un pop corto.
- **Capítulos**: pantalla crema completa con barra de progreso, número gigante, título de dos líneas
  (segunda en verde), icono en baldosa y cinta amarilla con adelanto. Barrido de entrada con franja verde;
  salida deslizando hacia arriba. Variante oscura con rejilla y rojo para "lo que preocupa".
- **Etiqueta fija** arriba a la izquierda: número de capítulo + caja blanca con texto mono.
- **Insignia** al nombrar un producto: icono de app blanco + nombre en blanco + línea mono.
- **Sello** rojo de goma, girado, que cae de golpe.
- **CTA** (solo si el usuario pide algo en su vídeo): recuadro menta "COMENTA X" con línea mono; al final,
  caja verde que escribe la palabra con cursor "_" y firma debajo.

## Lo que el usuario rechazó (no volver a hacerlo)
- El vídeo recogido en una tarjeta con panel azul debajo.
- Titulares/portadas gigantes, palabra tachada que cae, caja de comentario tipo Instagram, papel a pantalla completa.
- Subtítulos monoespaciados con una palabra fija resaltada.
- Voz y boca desfasadas (resuelto en `cortar.py`).
- Copiar del ejemplo cosas que él no dice: un "COMENTA CLAUDE" sin que pidiera comentarios no tiene sentido.
