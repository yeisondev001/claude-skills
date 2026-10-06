"""Afina el tiempo de cada palabra y aplica las correcciones de texto.

Uso: python herramientas/afinar.py <slug>   (lo llama transcribir.mjs; repítelo tras editar correcciones.json)

Por qué: con una palabra por elemento, los "offsets" de whisper.cpp 1.6 se reparten el tiempo
a ciegas (una palabra puede "empezar" en mitad de un silencio). La marca DTW es mucho mejor
pero llega con un retraso casi constante. Aquí se mide ese retraso contra los silencios reales
del audio, se descuenta, y cada palabra se ajusta para no empezar dentro de un silencio.

Entrada: transcripcion-cruda.json (+ correcciones.json opcional: {"Cloud": "Claude", ...})
Salida:  transcripcion.json
"""
import argparse
import re
import statistics

from comun import carpeta, ejecutar, escribir_json, leer_json

p = argparse.ArgumentParser()
p.add_argument("slug")
args = p.parse_args()

c = carpeta(args.slug)
crudas = leer_json(c / "transcripcion-cruda.json")
dur_ms = leer_json(c / "info.json")["duracion"] * 1000

# Silencios cortos también (0,12 s): sirven para encontrar el arranque de cada palabra.
r = ejecutar(["ffmpeg", "-v", "info", "-nostats", "-i", str(c / "original.mp4"), "-vn",
              "-af", "silencedetect=noise=-35dB:d=0.12", "-f", "null", "-"])
silencios, abierto = [], None
for linea in r.stderr.splitlines():
    if m := re.search(r"silence_start: (-?[\d.]+)", linea):
        abierto = max(0.0, float(m.group(1))) * 1000
    elif (m := re.search(r"silence_end: ([\d.]+)", linea)) and abierto is not None:
        silencios.append((abierto, float(m.group(1)) * 1000))
        abierto = None
if abierto is not None:
    silencios.append((abierto, dur_ms))

marca = [w["timestampMs"] if w.get("timestampMs") is not None else w["startMs"] for w in crudas]

# Retraso típico de DTW: distancia entre el fin de cada silencio y la primera palabra que viene después.
difs = []
for _, fin in silencios:
    siguiente = next((m for m in marca if m > fin), None)
    if siguiente is not None and siguiente - fin < 900:
        difs.append(siguiente - fin)
retraso = statistics.median(difs) if difs else 300

inicios = []
for i, m in enumerate(marca):
    s = m - retraso
    for a, b in silencios:
        if a <= s < b or 0 <= s - b < 250:  # cae en un silencio o justo después: empieza cuando acaba
            s = b
            break
    if inicios:
        s = max(s, inicios[-1] + 60)
    inicios.append(min(max(0.0, s), dur_ms - 60))

correcciones = leer_json(c / "correcciones.json") if (c / "correcciones.json").exists() else {}


def corregir(texto: str) -> str:
    nucleo = texto.strip()
    limpio = nucleo.strip(".,;:!?¿¡…\"'")
    if limpio in correcciones:
        nucleo = nucleo.replace(limpio, correcciones[limpio])
    return (" " if texto.startswith(" ") else "") + nucleo


palabras = []
for i, w in enumerate(crudas):
    ini = inicios[i]
    sig = inicios[i + 1] if i + 1 < len(inicios) else dur_ms
    corte = next((a for a, _ in silencios if a > ini + 60), dur_ms)
    fin = max(ini + 80, min(sig, corte))
    palabras.append({**w, "text": corregir(w["text"]), "startMs": round(ini), "endMs": round(fin)})

escribir_json(c / "transcripcion.json", palabras)
print(f"Tiempos afinados (retraso DTW medido: {retraso:.0f} ms) · {len(correcciones)} correcciones aplicadas")
