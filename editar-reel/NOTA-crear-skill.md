# Nota para agentes: cómo crear la skill "editar-reel"

Esta nota explica cómo construir desde cero una skill que convierte un vídeo de alguien hablando a
cámara en un reel vertical profesional (1080×1920, 30 fps), **todo con código y en local**. Incluye la
arquitectura, el estilo visual exacto y los errores que ya se cometieron y cómo evitarlos.

La carpeta donde está esta nota (`editar-reel/`) es la implementación de referencia de todo lo que se
describe aquí: cópiala a `.claude/skills/` del proyecto y ejecuta
`python .claude/skills/editar-reel/instalar.py`. Si quieres construirla tú, sigue esta nota.

---

## 1. Qué hace

1. Transcribe el vídeo en local con tiempo por palabra.
2. Quita silencios largos **sin desincronizar voz y boca** y limpia la voz.
3. Encuadra en vertical y localiza la cara.
4. Pone subtítulos tipo karaoke y grafismo sincronizado con lo que se dice.
5. Genera música y efectos de sonido **con código** (sin bancos de sonidos ni derechos).
6. Saca una hoja de fotogramas para revisar y renderiza con el audio a -14 LUFS (nivel de Instagram).

El usuario aprueba en tres puntos: el texto transcrito, el plan de animaciones y el vídeo final.
Si el usuario dice "no me preguntes", decide tú y avísale al entregar, pero siempre a partir de lo que él dice en el vídeo.

**Regla de oro del contenido**: todo texto que aparezca en pantalla resume algo que el usuario dice en su
vídeo. Nada de datos, cifras ni llamadas a la acción inventadas. Si no dice "comenta X", no hay "COMENTA X".

## 2. Herramientas (todas gratis)

| Herramienta | Para qué |
|---|---|
| **Remotion** (React → MP4) | Montar el vídeo, grafismo y render. Licencia: gratis hasta 3 empleados; empresas mayores, licencia de pago. |
| **FFmpeg / ffprobe** | Normalizar, cortar, tratar audio, loudness. |
| **whisper.cpp** vía `@remotion/install-whisper-cpp` | Transcripción local, modelo `medium`, idioma del vídeo. |
| **MediaPipe** (Python, `FaceDetector` de `mediapipe.tasks`, modelo `blaze_face_short_range.tflite`) | Ojos y cara cada 0,2 s. Respaldo: Haar de OpenCV. |
| **Python + numpy + Pillow** | Pipeline, síntesis de audio, hoja de revisión. |
| **Node 22+** | Remotion. Paquetes: `@remotion/renderer`, `bundler`, `google-fonts`, `captions`, `install-whisper-cpp`, `media-utils` (misma versión que `remotion`). |

## 3. Arquitectura

```
.claude/skills/editar-reel/
  SKILL.md                 instrucciones (flujo + reglas)
  instalar.py              crea/actualiza el "motor" (proyecto Remotion) y copia la plantilla
  referencia/plan.md       formato de plan.json
  referencia/estilo.md     especificación visual
  referencia/cambios.md    cómo atender peticiones de cambio
  plantilla/
    herramientas/*.py|mjs  pipeline (se copia al motor)
    src/*.tsx|ts|json      composición Remotion (se copia al motor)
    public/marca.json      colores y fuentes por defecto
motor-reel/                proyecto Remotion generado (npx create-video --blank)
  public/videos/<slug>/    todo lo de cada vídeo
```

- La **fuente de verdad es la plantilla** de la skill; `instalar.py` borra y vuelve a copiar `src/` y
  `herramientas/` del motor (para que no queden archivos viejos) y nunca toca `public/videos` ni `out/`.
- Ejecuta todos los comandos desde el motor.

## 4. Pipeline (scripts y detalles que importan)

### preparar.py
Copia y normaliza a **30 fps constantes** (`fps=30`, libx264 crf 17, AAC 48 kHz estéreo) → `original.mp4` + `info.json`.

### transcribir.mjs
- `transcribe()` con `tokenLevelTimestamps: true`, `tokensPerItem: 1`, **`additionalArgs: ["--split-on-word"]`**.
  ⚠️ No uses la opción `splitOnWord`: añade el valor "true" y whisper.cpp 1.6 lo toma como un archivo y falla.
- Pasa el wav con **ruta absoluta** (whisper se ejecuta desde su propia carpeta).
- Guarda `transcripcion-cruda.json` y llama a `afinar.py`.
- Permite re-transcribir un tramo (`--desde/--hasta`) y fusionarlo (whisper a veces alarga la última palabra sobre el silencio final).

### afinar.py (imprescindible)
Con una palabra por elemento, los offsets de whisper.cpp **se reparten el tiempo a ciegas** (una palabra
"empieza" en mitad de un silencio). Solución:
1. Usa la marca DTW (`timestampMs`), que tiene un **retraso casi constante** (~400 ms).
2. Mide ese retraso: mediana de (primera DTW después de cada fin de silencio − fin de silencio), con `silencedetect -35dB d=0.12`.
3. Inicio = DTW − retraso; si cae dentro de un silencio o < 250 ms tras él, se lleva al fin del silencio; orden monótono (≥ 60 ms entre palabras).
4. Fin = mínimo entre el inicio de la siguiente y el próximo silencio.
5. Aplica `correcciones.json` (`{"Cloud": "Claude"}`) para nombres propios.

### cortar.py (aquí estaba el error de voz/boca)
- Silencios con `silencedetect -35dB d=0.3`; quita cada silencio dejando 0,1 s de aire a cada lado;
  respeta el arranque de una palabra solo si cae < 0,3 s antes de que vuelva la voz; descarta trocitos < 0,6 s sin palabras.
- **Alinea todos los cortes a fotogramas** y trabaja solo hasta `min(duración vídeo, duración audio)` (WhatsApp trae ~0,4 s más de audio).
- Un solo paso de ffmpeg con `-/filter_complex`:
  - vídeo: `select='between(n,f0,f1-1)+…',setpts=N/FRAME_RATE/TB` (**por número de fotograma**, no por tiempo)
  - audio: `asetnsamples=n=<SR/300>:p=0,aselect='between(t,a,b-ε)+…',asetpts=N/SR/TB` (bloques de 1/10 de fotograma que caen justo en los bordes)
  - limpieza de voz: `highpass=f=80,acompressor=threshold=0.1:ratio=2.5:attack=15:release=250:makeup=1.5`
- ⚠️ Con `between(t)` en ambos y bloques de audio por defecto (~21 ms) el audio acababa 0,5 s más largo que la imagen y la boca se desfasaba.
  **Comprueba siempre con ffprobe que vídeo y audio de `cortado.mp4` difieren < 30 ms.**
- Escribe `cortes.json` (tramos, duración nueva, instantes de corte) y `subtitulos.json` (palabras en la nueva línea de tiempo).

### cara.py
MediaPipe cada 0,2 s sobre `cortado.mp4`: ojos (media de los dos keypoints) y caja (cejas→barbilla), normalizados; rellena huecos y suaviza (gaussiana σ = 0,5 s) → `cara.json`.

### audio.py
- Música lo-fi ~96 BPM sintetizada (acordes maj7 con armónicos y trémolo, bajo, bombo/caja/charles con swing, crujido de vinilo, paso bajo por FFT).
- Efectos sintetizados y colocados en los mismos ms que las animaciones: whoosh (ruido con filtro que barre), pop (seno con caída de tono), tic, tecleo, golpe (sello).
- La música baja cuando se habla (volumen por fotograma calculado de las palabras y suavizado).
- **Vuelve a generarlo cada vez que cambien tiempos del plan.**

### revisar.mjs + hoja.py
Empaqueta una vez, abre un navegador y renderiza fotogramas a media resolución: primer fotograma, cada
capítulo (barrido y montado), cada animación ya marcada y huecos solo con subtítulos. Monta una rejilla con
las franjas que tapa Instagram en rojo. **El agente debe abrir la hoja y mirarla** antes de renderizar.

### renderizar.mjs + masterizar.py
`renderMedia` h264 crf 18 → `loudnorm` en dos pasadas a I=-14, TP=-1, LRA=11 (copiando el vídeo).
Deja una copia en `reel terminado/`. En un i3 tarda ~20× la duración del vídeo.

## 5. Estilo visual (basado en un reel de Erik Taveras elegido por el usuario)

El reel de referencia es la **base, no un calco**: se toma la forma (maqueta, paleta, tipografía, tipos de
pieza, ritmo); las animaciones no tienen que ser idénticas y su contenido sale del vídeo del usuario.

**Principios**
- Vídeo **siempre a pantalla completa**. Nunca se encoge en una tarjeta.
- Todo el grafismo en una franja: **subtítulos en una línea fija y la tarjeta del momento justo debajo**.
- Casi siempre hay una tarjeta, sincronizada con la palabra exacta.
- Color del vídeo: `contrast(1.08) saturate(0.94) brightness(0.96)` + viñeta radial.

**Paleta**: crema `#efefea`, tinta `#0c1014`, verde `#007656`, menta `#58caad`, rojo `#8a2820` (sellos y alertas), crema de sello `#f3e6dc`, amarillo `#f6e5b8` (cintas).
**Fuentes** (Google Fonts, cargadas con `getAvailableFonts().load()` + `delayRender`): Anton (titulares y números), Barlow Condensed 700 (subtítulos), Inter (texto de tarjetas), JetBrains Mono (etiquetas en mayúsculas con espaciado).

**Maqueta según la cara**: calcula la caja de la cara (cejas→barbilla) en todo el vídeo. Si bajo la barbilla
caben subtítulos + ~320 px, todo va abajo; si no (selfies cerrados), encima de la cabeza, empezando bajo la
franja superior de Instagram. Se puede tapar el pelo, nunca ojos ni boca. Franjas de Instagram:
arriba 250 px, abajo 420 px, columna derecha de 150 px solo desde y = 900.

**Piezas**
| Pieza | Aspecto |
|---|---|
| Subtítulos | Karaoke: bloques de ≤ 4 palabras (corta en pausas > 400 ms o fin de frase), 1–2 líneas, mayúsculas, blanco con borde y sombra suaves, mucho espacio entre palabras; la palabra que suena en menta. |
| Tarjeta base | Crema, radio 18, sombra, **escuadras menta en las 4 esquinas**, cabecera mono "01 TÍTULO ··· 3 / 8", entrada con pop corto (escala 0,94→1). |
| `lista` | Casillas discontinuas que pasan a borde negro + check verde al nombrar cada una; contador. |
| `flujo` | Iconos en cajas unidas por flechas que se dibujan; check verde en la esquina al activarse. |
| `chat` | Cabecera con avatar "Activo ahora" y burbujas (mías en verde) que aparecen en su ms. |
| `sello` | Texto Anton rojo en caja crema con doble borde, girado -4°, cae de 1,7× a 1× con temblor. |
| `insignia` | Icono de app blanco redondeado + nombre en blanco (Inter 800) + línea mono. |
| `cta` (solo si el usuario pide algo en su vídeo) "borde" | Recuadro menta claro con borde verde "COMENTA X" + línea mono, girado -2,5°. |
| `cta` "lleno" | Caja verde: "COMENTA" en mono + palabra en Anton que se escribe con cursor "_", escuadras, firma opcional. |
| `cifra` | Número Anton verde que cuenta, en tarjeta. Solo si se dice el número. |
| Capítulo | Pantalla crema completa: "CAPÍTULO ▬▬▬ QUEDAN N", número gigante (Anton 360), título en 2 líneas (la 2.ª en verde) + raya, icono en baldosa verde, cinta amarilla de adelanto, barra verde inferior. Entra con barrido desde la derecha con franja verde delante; sale deslizando hacia arriba. Variante "alerta": fondo oscuro con rejilla, rojo, "!" y "VEREDICTO". Sin subtítulos mientras tapa. |
| Etiqueta fija | Arriba a la izquierda: número (Anton, blanco) + caja blanca con texto mono, hasta el siguiente capítulo. |

Iconos: dibújalos a mano en SVG de trazo (24×24). No uses logos de marcas ajenas.

**Lo que el usuario rechazó (no lo hagas)**: vídeo recogido en una tarjeta con panel de color, titulares
o portadas gigantes, palabra tachada que cae, caja de comentario imitando Instagram, papel a pantalla
completa, subtítulos monoespaciados con una palabra fija resaltada, voz y boca desfasadas.

## 6. plan.json (lo escribe el agente por vídeo)

Ejemplo real (vídeo de 20 s: "Ya con Claude podemos editar videos, haciendo animaciones, cortando
silencios… ya podemos ahorrar ese tiempo… ya no tienen problema con eso"). No pide comentarios, así que no hay `cta`:

```json
{
  "marca": { "colores": { "verde": "#0d57a4" } },
  "capitulos": [{ "titulo": ["Cortar", "silencios"], "etiqueta": "Cortes", "desdeMs": 5600, "hastaMs": 7400, "icono": "tijeras", "aviso": "En el 02: animaciones" }],
  "zooms": [{ "desdeMs": 16400, "hastaMs": 17300, "escala": 1.12 }],
  "animaciones": [
    { "tipo": "insignia", "desdeMs": 672, "hastaMs": 3000, "props": { "nombre": "Claude", "sub": "edita tus vídeos", "icono": "chispa" } },
    { "tipo": "lista", "desdeMs": 3705, "hastaMs": 10500, "props": { "titulo": "Lo que hace Claude",
      "items": [{ "texto": "Animaciones", "ms": 4172 }, { "texto": "Cortar silencios", "ms": 5898 }] } },
    { "tipo": "sello", "desdeMs": 12425, "hastaMs": 14600, "props": { "texto": "Ahorra tiempo" } },
    { "tipo": "sello", "desdeMs": 18865, "hastaMs": 20500, "props": { "texto": "Sin problema" } }
  ]
}
```

Reglas: todos los ms en la línea de tiempo **ya cortada** y en la palabra exacta; nada se solapa (≥ 300 ms
entre piezas); producto nombrado → insignia; enumeración → lista; pasos → flujo; palabra fuerte → sello;
`cta` solo si el usuario pide algo en el vídeo o te la da ("borde" donde lo dice, "lleno" al final);
capítulos solo en vídeos largos (> ~40 s); **nunca inventes cifras, datos ni frases que no se digan en el vídeo**.

## 7. Comprobaciones antes de entregar

- [ ] `cortado.mp4`: duraciones de vídeo y audio con < 30 ms de diferencia.
- [ ] Texto revisado (nombres propios corregidos).
- [ ] Hoja de revisión abierta y mirada: ojos y boca libres, nada en las franjas rojas, la palabra en menta es la que suena.
- [ ] Audio final ≈ -14 LUFS, pico ≤ -1 dB.
- [ ] Copia en `reel terminado/` y resumen al usuario: cuánto se cortó, qué pieza va en cada frase, cómo pedir cambios, y que lo escuche antes de publicar.
