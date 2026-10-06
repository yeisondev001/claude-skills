# Pedir cambios a un reel ya editado

Frases que el usuario puede usar (dáselas en el resumen final) y qué hacer con cada una.
Después de cualquier cambio de tiempos: `audio.py` → `revisar.mjs` (mira la hoja) → `renderizar.mjs`.

| El usuario dice | Qué hacer |
|---|---|
| "La tarjeta de [frase] entra tarde: que aparezca justo cuando digo [palabra]." | `texto.py <slug> --palabras`, busca la palabra y pon su ms en `desdeMs` (mueve `hastaMs` lo mismo). Regenera el audio. |
| "En el segundo [X] algo me tapa la cara." | Revisa con `revisar.mjs <slug> --ms X000`. Prueba `"diseno": {"lado": "arriba"}` (o `"abajo"`), o quita el zoom de ese tramo. |
| "Corrige el subtítulo de [frase]: tiene que decir [texto]." | Palabra suelta: `correcciones.json` + `afinar.py` + `cortar.py` (rehace `subtitulos.json`; luego `cara.py`). Varias palabras: edita `text` en `subtitulos.json` directamente. |
| "Los subtítulos más grandes / más palabras por línea." | `constantes.json` → `subtitulos.tamano` / `palabrasPorBloque` (en la plantilla) e `instalar.py`. |
| "Cambia la música por una más [tranquila/rápida/alegre] y bájala un poco." | `audio.py <slug> --estilo tranquila` (o `--bpm 116`, o otra `--semilla`) y en `plan.json` → `musica.volumen: 0.7`. |
| "Que no corte tanto" / "que corte más". | `cortar.py <slug> --minimo 0.5` (o `--aire 0.15`); luego `cara.py`, rehaz los ms del plan (cambian) y `audio.py`. |
| "Ponle otro color / mis colores." | `plan.json` → `marca.colores` (`verde`, `menta`…). |
| "Quiero el antes/después." | `renderizar.mjs <slug> --antes-despues`. |
| "Que la palabra del final sea [X]." | `plan.json` → `cta.palabra`, y `audio.py` (el tecleo depende del largo de la palabra). |

Si cambias el corte de silencios (`cortar.py`), **todos los ms cambian**: vuelve a sacar
`texto.py --palabras` y rehaz `desdeMs`/`hastaMs`/`ms` del plan antes de renderizar.
