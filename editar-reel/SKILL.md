---
name: editar-reel
description: Edita un vídeo en el que el usuario habla a cámara y lo convierte en un reel vertical 1080×1920 listo para Instagram/TikTok con un estilo basado en los reels de Erik Taveras (subtítulos karaoke, tarjetas tipo app, capítulos, sellos), con todo el texto sacado de lo que dice el usuario, sin inventar nada, todo con código y en local - Remotion para montarlo, ffmpeg para cortar y tratar el audio, whisper.cpp para transcribir. Corta silencios con voz y boca sincronizadas, música y efectos generados con código y volumen a -14 LUFS. Úsala cuando el usuario pase un vídeo para editar, pida un reel, o quiera cambios en un reel ya editado.
---

# Editar un reel

Convierte un vídeo hablando a cámara en un reel profesional sin abrir ningún editor.
Sigue la receta del documento "Pront claude editar videos" que el usuario trajo, con las
herramientas ya construidas en el **motor** (`<proyecto>/motor-reel`, un proyecto de Remotion).

**Estilo**: toma como **base** el vídeo de referencia que eligió el usuario (`vd/referencias/estilo-ejemplo.mp4`,
un reel de Erik Taveras), descrito en [referencia/estilo.md](referencia/estilo.md). Es la forma de editar
(cómo se ven y se mueven las cosas), **no un calco**: las piezas y sus textos salen de lo que dice el usuario
en *su* vídeo, nunca de lo que se dice en el ejemplo. Lo que **no** quiere: el vídeo encogido en una tarjeta
con panel de color, titulares gigantes de portada, subtítulos con una palabra fija resaltada, y elementos
copiados del ejemplo que él no dijo (p. ej. un "COMENTA X" cuando no pide comentarios).

Habla con el usuario en español claro y sin tecnicismos. Nunca le pidas contraseñas ni claves.

## Lo que necesitas del usuario

1. **El vídeo**: la ruta del archivo.
2. **Llamada a la acción, solo si existe**: si en el vídeo dice algo como "comenta X" o "sígueme", se anima
   eso. Si no lo dice, no hay `cta` salvo que el usuario te dé una explícitamente. **Nunca la inventes.**
3. **Colores y letras.** Por defecto, los del estilo de referencia (`motor-reel/public/marca.json`:
   crema `#efefea`, tinta `#0c1014`, verde `#007656`, menta `#58caad`; Anton / Barlow Condensed / Inter /
   JetBrains Mono). Si quiere otros (p. ej. Duralon: verde→`#0d57a4`, menta→`#ffd200`), van en `plan.json` → `marca`.

Si el usuario dice que sigas sin preguntar, decide tú lo que falte y díselo al entregar; pero lo que
decidas tiene que salir de lo que él dice en el vídeo (nada de llamadas a la acción ni datos inventados).

Si falta alguno, pregúntalo antes de empezar. Si quiere el formato antes/después, ver más abajo.

## Flujo (enséñale cada paso y espera su OK donde se indica)

Todos los comandos se ejecutan **desde `motor-reel/`**. `<slug>` es el nombre corto del vídeo
(lo imprime `preparar.py`). Todo lo de cada vídeo vive en `motor-reel/public/videos/<slug>/`.

### 1. Preparar
```bash
python ../.claude/skills/editar-reel/instalar.py     # crea/actualiza el motor; es seguro repetirlo
python herramientas/preparar.py "<ruta del vídeo>" [--slug nombre]
```
`instalar.py` comprueba Node y ffmpeg (si falta algo, explica cómo instalarlo y espera),
copia el código de la plantilla de esta skill al motor y descarga lo que falte.
`preparar.py` copia el vídeo y lo normaliza a 30 fps (`original.mp4` + `info.json`).

### 2. Transcribir → **espera su OK del texto**
```bash
node herramientas/transcribir.mjs <slug> [--idioma es] [--modelo medium]
python herramientas/texto.py <slug> --original
```
- whisper.cpp en local, modelo medium, con el tiempo de cada palabra. En este equipo (i3) tarda
  ~2× la duración del vídeo; la primera vez descarga el modelo (1,5 GB).
- `afinar.py` se ejecuta solo: corrige el retraso de las marcas de tiempo usando los silencios reales.
- Si avisa de que la última palabra se alargó sobre el silencio, vuelve a transcribir solo ese tramo
  con `--desde <s>` (y `--hasta <s>` si hace falta).
- **Corrige nombres propios y erratas** en `public/videos/<slug>/correcciones.json`
  (`{"Cloud": "Claude", "duralon": "Duralon"}`) y aplica con `python herramientas/afinar.py <slug>`.
  Para algo que no sea una palabra suelta, edita `transcripcion.json` directamente (solo `text`).
- Enséñale el texto por frases y **espera su OK** antes de seguir.

### 3. Quitar silencios y limpiar la voz
```bash
python herramientas/cortar.py <slug>     # opciones: --minimo 0.3 --aire 0.1 --umbral -35
```
Quita silencios de más de 0,3 s dejando 0,1 s de aire a cada lado, sin comerse el arranque de
ninguna palabra, y tira los trocitos sin palabras (ruidos, "eh…"). Limpia la voz (paso alto 80 Hz +
compresión suave). Genera `cortado.mp4`, `cortes.json` y `subtitulos.json` (tiempos ya cortados).
**Dile cuánto duraba y cuánto dura ahora** (lo imprime). Si se come palabras en voz baja, repite con `--umbral -45`.

### 4. Encuadrar
```bash
python herramientas/cara.py <slug>
```
MediaPipe localiza los ojos cada 0,2 s y suaviza el recorrido (`cara.json`). El motor ya hace el resto:
vídeo **siempre a pantalla completa** 1080×1920 a 30 fps, la cara quieta en su sitio natural (sigue la cara
en horizontal si el original es apaisado), un cambio de zoom suave en cada corte (cada ≥ 2,5 s), color
algo más contrastado y viñeta. Los acercamientos en frases fuertes van en `plan.json` → `zooms`.
Si no es un vídeo a cámara (p. ej. pantalla con la cara en un círculo), usa `"camara": {"modo": "fijo"}`.

**Maqueta**: subtítulos en una línea fija y tarjetas justo debajo. El motor mira dónde cae la cara en todo el
vídeo: si hay sitio bajo la barbilla los pone ahí (como en el ejemplo); si no (selfies cerrados), encima de la
cabeza, sobre el pelo y la pared, nunca sobre ojos o boca. Forzar: `"diseno": {"lado": "arriba" | "abajo"}`.

### 5 y 6. Subtítulos y plan de animaciones → **espera su OK del plan**
```bash
python herramientas/texto.py <slug> --palabras      # índice y ms de cada palabra (línea de tiempo cortada)
```
Los subtítulos son automáticos (karaoke: bloque de ≤ 4 palabras en blanco y la palabra que suena en menta).
Escribe `public/videos/<slug>/plan.json` siguiendo [referencia/plan.md](referencia/plan.md): capítulos,
animaciones y zooms. Cada pieza entra en la palabra exacta (`desdeMs` = ms de esa palabra en `--palabras`).
Antes de renderizar nada, **enséñale el plan como tabla frase → animación y espera su OK**.

Reglas del plan (como en el ejemplo):
- Cuando nombra un producto o herramienta → `insignia`. Cuando enumera → `lista` (se marca al nombrar cada cosa).
  Pasos o "A → B" → `flujo`. Mensajes → `chat`. Una palabra fuerte o una advertencia → `sello`.
- Vídeos largos con varias partes → `capitulos` (uno por parte, 1,3–2 s, sobre una frase de transición).
  En vídeos de menos de ~40 s, sin capítulos.
- `cta` **solo si en el vídeo pide algo** ("comenta X", "sígueme", "escríbeme") o el usuario te la da:
  "borde" donde lo dice o a mitad, "lleno" al final. Sin llamada a la acción, cierra con otra pieza
  (p. ej. un `sello` con la idea final que él dice).
- **No inventes cifras, datos ni frases**: todo texto de una pieza resume algo que dice en el vídeo.
  Si no dice ningún número, no hay `cifra`.
- Nada se solapa; deja ≥ 300 ms entre piezas. Que haya tarjeta casi siempre, pero con huecos de solo cara.

### 7. Música y efectos
```bash
python herramientas/audio.py <slug> [--estilo lofi|tranquila|alegre] [--bpm 100] [--semilla 7]
```
Todo generado con código, sin bancos de sonidos: base lo-fi ~100 BPM muy por debajo de la voz (baja aún
más cuando habla) y efectos sutiles (whoosh, pop, tic, tecleo) atados a cada animación. **Vuelve a
ejecutarlo cada vez que cambies tiempos en `plan.json`**, o los efectos quedarán desfasados.

### 8. Revisar antes de entregar
```bash
node herramientas/revisar.mjs <slug> [--ms 4200,9800]   # --ms: momentos extra que quieras ver
```
Genera `public/videos/<slug>/revision/hoja.jpg`: un fotograma de cada animación más algunos solo con
subtítulos, con las franjas de Instagram en rojo. **Ábrela con Read y mírala**: ojos y boca libres, textos
legibles, nada cortado ni dentro de lo rojo, la palabra en menta es la que suena. Corrige y repite hasta que esté bien.
Compárala con el estilo de referencia ([referencia/estilo.md](referencia/estilo.md)): si algo no se parece, arréglalo.
Para ver el vídeo en movimiento: `npm run dev` (Remotion Studio; cambia `SLUG_POR_DEFECTO` en `src/Root.tsx`).

Luego renderiza:
```bash
node herramientas/renderizar.mjs <slug>              # → out/<slug>.mp4 (~20× la duración en este equipo)
node herramientas/renderizar.mjs <slug> --borrador   # mitad de resolución, más rápido
```
El audio final queda a -14 LUFS (el de Instagram) con `masterizar.py`.

### 9. Entregar
Copia el vídeo a `vd/reel terminado/` (ahí los busca el usuario) y dile dónde está; dale un resumen: cuánto se cortó,
qué animación va en cada frase y cómo pedir cambios (ver [referencia/cambios.md](referencia/cambios.md)).
Recuérdale que lo **escuche entero antes de publicarlo**.

## Formato antes/después

Si lo pide (normalmente graba en horizontal): todo igual, y al final
```bash
node herramientas/renderizar.mjs <slug> --antes-despues
node herramientas/revisar.mjs <slug> --antes-despues
```
Original arriba con la etiqueta "Original" y el reel editado debajo con "Editado por Claude",
sincronizados y sin pausas (los dos salen de `cortado.mp4`). Solo el de abajo lleva encuadre, color,
subtítulos y animaciones. El de abajo es el reel completo a escala, así que sus subtítulos quedan en la
franja inferior de Instagram: avísale de que en este formato los subtítulos pueden quedar medio tapados.

## Dónde tocar cada cosa

| Quiero cambiar… | Dónde |
|---|---|
| Colores y fuentes de un vídeo | `plan.json` → `marca` |
| Colores y fuentes por defecto | `motor-reel/public/marca.json` |
| Silencio mínimo, aire, zonas seguras, zooms por corte, tamaño de subtítulos, volúmenes | `plantilla/src/constantes.json` (y `instalar.py`) |
| Aspecto de una animación | `plantilla/src/animaciones/*.tsx` (y `instalar.py`) |
| Subtítulos (tamaño, palabras por bloque) | `plantilla/src/constantes.json` → `subtitulos`; estilo en `plantilla/src/Subtitulos.tsx` |
| Iconos disponibles | `plantilla/src/animaciones/iconos.tsx` |

El código fuente vive en `.claude/skills/editar-reel/plantilla/`; `instalar.py` lo copia al motor.
Si cambias algo del motor, cámbialo en la plantilla y vuelve a ejecutar `instalar.py`, o se perderá.

## Notas técnicas

- whisper.cpp 1.6 en Windows: `--split-on-word` es un interruptor sin valor; `transcribir.mjs` lo pasa
  en `additionalArgs` (la opción `splitOnWord` de Remotion añade "true" y rompe la llamada) y usa ruta
  absoluta al wav (whisper se ejecuta desde su carpeta).
- Con una palabra por elemento, los offsets de whisper reparten el tiempo a ciegas; por eso `afinar.py`
  usa la marca DTW, le descuenta el retraso medido contra los silencios y nunca deja empezar una palabra
  dentro de un silencio.
- Sincronía voz/boca: `cortar.py` corta la imagen por número de fotograma y el audio en bloques de
  1/10 de fotograma (`asetnsamples`), con los cortes alineados a fotogramas, y recorta al tramo que tiene
  imagen y audio (los vídeos de WhatsApp traen ~0,4 s más de audio). Con `between(t)` en los dos y bloques
  de audio por defecto (~21 ms) el audio acababa 0,5 s más largo que la imagen y la boca se desfasaba.
  Tras cortar, comprueba con ffprobe que las duraciones de vídeo y audio de `cortado.mp4` difieren < 30 ms.
- Licencia de Remotion: gratis para particulares y empresas de hasta 3 personas; si la empresa tiene más,
  necesita licencia de empresa (remotion.pro/license). Recuérdalo si el vídeo es para una empresa.
- No toques `vd/reel/`: es otra edición hecha a mano, independiente de esta skill.
