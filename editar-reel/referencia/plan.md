# plan.json

Vive en `motor-reel/public/videos/<slug>/plan.json`. Todos los tiempos en **milisegundos de la línea
de tiempo ya cortada** (los que da `python herramientas/texto.py <slug> --palabras`).
Los subtítulos no van en el plan: salen solos de `subtitulos.json` (karaoke).

```json
{
  "cta": { "palabra": "CATÁLOGO", "texto": "Comenta" },
  "marca": { "colores": { "verde": "#0d57a4", "menta": "#ffd200" } },
  "camara": { "modo": "cara" },
  "diseno": { "lado": "abajo" },
  "capitulos": [
    { "titulo": ["Actividad de", "Instagram"], "etiqueta": "Tu actividad", "desdeMs": 12400, "hastaMs": 14100,
      "icono": "imagen", "aviso": "En el 04: un caso real" }
  ],
  "zooms": [{ "desdeMs": 16400, "hastaMs": 17300, "escala": 1.12 }],
  "animaciones": [
    { "tipo": "insignia", "frase": "…", "desdeMs": 1200, "hastaMs": 3400, "props": { "nombre": "Muse", "sub": "el agente de Meta" } }
  ],
  "musica": { "estilo": "lofi", "bpm": 96, "semilla": 7, "volumen": 1.0 }
}
```

| Campo | Qué es |
|---|---|
| `cta` | Llamada a la acción por defecto de las piezas `cta`. Solo si existe (la dice o te la dan); si no, omítelo. |
| `marca` | Opcional. Sobrescribe colores (`fondo`, `tinta`, `verde`, `menta`, `rojo`, `crema`, `amarillo`) o fuentes (`titulos`, `subtitulos`, `ui`, `mono`; cualquier familia de Google Fonts). |
| `camara.modo` | `"cara"` (por defecto) o `"fijo"` (grabaciones de pantalla). |
| `diseno.lado` | Opcional. Fuerza subtítulos+tarjetas `"abajo"` (bajo la barbilla) o `"arriba"` (sobre la cabeza). Por defecto lo decide el motor según el hueco libre. |
| `capitulos` | Separadores a pantalla completa (ver abajo). Solo en vídeos largos con partes. |
| `zooms` | Acercamientos en frases fuertes. `escala` 1.08–1.15. |
| `animaciones` | Piezas en orden, sin solaparse. Campos comunes abajo. |
| `musica` | Opcional. `estilo`: `lofi` / `tranquila` / `alegre`; `volumen` multiplica el nivel (0.5 = la mitad). |

## Capítulos

`{ "titulo": ["línea 1", "línea 2"], "etiqueta", "desdeMs", "hastaMs", "icono"?, "aviso"?, "variante"? }`

- Pantalla crema: "CAPÍTULO ▬▬▬ QUEDAN N", número gigante, título (la 2.ª línea en verde), icono en
  baldosa verde y cinta amarilla `aviso` (adelanto de lo que viene). Entra con barrido desde la derecha y
  sale subiendo. Dura 1300–2000 ms. Mientras tapa, no hay subtítulos (la voz sigue).
- `etiqueta`: texto corto que queda fijo arriba a la izquierda ("01 TU ACTIVIDAD") hasta el siguiente capítulo.
- `variante: "alerta"`: fondo oscuro con rejilla, rojo, "!" y "VEREDICTO" (para "lo que preocupa", riesgos).
  No cuenta para "QUEDAN N".

## Campos comunes de cada animación

- `tipo`: uno de los de abajo.
- `desdeMs`: el ms de la palabra en la que entra (exacto, de `--palabras`).
- `hastaMs`: cuándo sale. Mínimo ~1500 ms para que se lea.
- `frase`: la frase que la dispara (para el plan y la hoja de revisión).
- `sfx`: opcional, para forzar un efecto (`whoosh`, `pop`, `tic`, `tecleo`, `golpe`) o `"ninguno"`.
- `props`: lo específico de cada tipo.

## Tipos

| tipo | Cuándo | props | Efectos |
|---|---|---|---|
| `insignia` | Nombra un producto, app o herramienta | `nombre`, `sub?` (línea mono pequeña), `icono?` o `imagen?` (archivo en `public/`), `color?` | pop |
| `lista` | Enumera cosas | `titulo`, `items: [{ "texto", "ms" }]` — se marca cada una en su `ms`; contador "3 / 8" | pop + tic por item |
| `flujo` | Pasos, "A → B → C", o varias métricas | `titulo?`, `pasos: [{ "texto", "icono", "ms" }]`, `flechas?: false` para métricas sin flechas | pop + tic por paso |
| `chat` | Cuenta una conversación o un mensaje | `nombre?`, `mensajes: [{ "texto", "de": "yo"\|"otro", "ms" }]` | pop por mensaje |
| `sello` | Palabra fuerte, advertencia, conclusión | `texto` (1–3 palabras), `sub?` | golpe |
| `cta` | Llamada a la acción, **solo si la dice en el vídeo o el usuario te la da** | `estilo`: `"borde"` (a mitad: recuadro "COMENTA X") o `"lleno"` (al final: caja verde que escribe la palabra), `palabra?`, `texto?`, `sub?`, `firma?` | pop (+ tecleo en "lleno") |
| `cifra` | Dice un número | `valor` (número), `prefijo?`, `sufijo?`, `etiqueta?`, `decimales?` | pop + tic mientras cuenta |

Iconos (`icono`): check, play, video, tijeras, texto, chispa, chat, imagen, corazon, ojo, reloj, usuario,
rayo, musica, lapiz, enviar, grafica, carpeta, estrella, candado, buscar, mas, microfono, caja, alerta,
o `"letra:X"` para una letra. No uses logos de marcas ajenas como imagen.

Cifras: `valor` como número (`1500`, no `"1.500"`). Nunca una cifra que no se diga en el vídeo.
