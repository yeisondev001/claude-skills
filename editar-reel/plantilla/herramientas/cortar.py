"""Paso 3: quita los silencios largos sin cortar palabras y limpia la voz.

Uso: python herramientas/cortar.py <slug> [--minimo 0.3] [--aire 0.1] [--umbral -35]

Combina dos fuentes: el volumen real del audio (silencedetect de ffmpeg) y el
inicio de cada palabra según whisper. Solo corta donde hay silencio de verdad y
nunca se come el arranque de una palabra.

Genera: cortado.mp4, cortes.json y subtitulos.json (transcripción en la nueva línea de tiempo).
"""
import argparse
import bisect
import re

from comun import CONSTANTES, carpeta, ejecutar, escribir_json, leer_json, mmss, sondear

cfg = CONSTANTES["cortes"]
p = argparse.ArgumentParser()
p.add_argument("slug")
p.add_argument("--minimo", type=float, default=cfg["silencioMinimo"], help="silencio mínimo a quitar (s)")
p.add_argument("--aire", type=float, default=cfg["aire"], help="aire que se deja junto a la voz (s)")
p.add_argument("--umbral", type=float, default=cfg["umbralDb"], help="volumen por debajo del cual es silencio (dB)")
args = p.parse_args()

c = carpeta(args.slug)
original = c / "original.mp4"
fps = CONSTANTES["fps"]
# Muchos móviles (p. ej. WhatsApp) graban más audio que imagen: trabajamos solo con el tramo que tiene las dos.
flujos = sondear(original)["streams"]
dur = min(float(s["duration"]) for s in flujos if s["codec_type"] in ("video", "audio"))
dur = int(dur * fps) / fps
frecuencia = int(next(s for s in flujos if s["codec_type"] == "audio")["sample_rate"])
palabras = leer_json(c / "transcripcion.json")
inicios = sorted(w["startMs"] / 1000 for w in palabras)


def a_fotograma(t: float) -> float:
    return round(t * fps) / fps


# 1. Silencios según el volumen real.
r = ejecutar([
    "ffmpeg", "-v", "info", "-nostats", "-i", str(original), "-vn",
    "-af", f"silencedetect=noise={args.umbral}dB:d={args.minimo}", "-f", "null", "-",
])
silencios, abierto = [], None
for linea in r.stderr.splitlines():
    if m := re.search(r"silence_start: (-?[\d.]+)", linea):
        abierto = max(0.0, float(m.group(1)))
    elif (m := re.search(r"silence_end: ([\d.]+)", linea)) and abierto is not None:
        silencios.append((abierto, float(m.group(1))))
        abierto = None
if abierto is not None:
    silencios.append((abierto, dur))

# 2. Zonas a quitar: el silencio menos el aire, sin pisar el inicio de ninguna palabra.
quitar = []
for a, b in silencios:
    ini = 0.0 if a <= 0.01 else a + args.aire
    fin = dur if b >= dur - 0.01 else b - args.aire
    j = bisect.bisect_left(inicios, ini)
    if j < len(inicios) and inicios[j] < fin + args.aire and b - inicios[j] < 0.3:
        # whisper oye una palabra justo antes de que vuelva la voz: puede ser un arranque suave, se respeta.
        # (si cae en mitad del silencio es un error de tiempos: manda el volumen real)
        fin = inicios[j] - args.aire
    ini, fin = a_fotograma(ini), a_fotograma(fin)
    if fin - ini >= 0.1:
        quitar.append((ini, fin))

# 3. Tramos que se quedan.
segmentos, cursor = [], 0.0
for a, b in quitar:
    if a - cursor >= 2 / fps:
        segmentos.append((cursor, a))
    cursor = b
if a_fotograma(dur) - cursor >= 2 / fps:
    segmentos.append((cursor, a_fotograma(dur)))
# Fuera los trocitos sin ninguna palabra (ruidos, respiraciones, "eh…" que whisper no transcribe).
segmentos = [
    (a, b) for a, b in segmentos
    if b - a >= 0.6 or any(a - args.aire <= s < b for s in inicios)
]
if not segmentos:
    raise SystemExit("No queda nada tras cortar: revisa el umbral (--umbral -45).")

# 4. Render con select/aselect (una sola pasada) + limpieza de voz.
# Para que voz y boca no se desfasen, imagen y sonido se cortan exactamente en los mismos instantes:
# la imagen por número de fotograma y el sonido en bloques de 1/10 de fotograma, que caen justo en
# los bordes (aselect decide por bloque; con los bloques por defecto, ~21 ms, cada corte desfasaba un poco).
bloque = frecuencia // (fps * 10)
cond_v = "+".join(f"between(n,{round(a * fps)},{round(b * fps) - 1})" for a, b in segmentos)
cond_a = "+".join(f"between(t,{a:.6f},{b - 0.5 / frecuencia:.6f})" for a, b in segmentos)
grafo = (
    f"[0:v]select='{cond_v}',setpts=N/FRAME_RATE/TB[v];"
    f"[0:a]asetnsamples=n={bloque}:p=0,aselect='{cond_a}',asetpts=N/SR/TB,"
    "highpass=f=80,acompressor=threshold=0.1:ratio=2.5:attack=15:release=250:makeup=1.5[a]"
)
script = c / "cortes.ffgraph"
script.write_text(grafo, encoding="utf-8")
salida = c / "cortado.mp4"
print(f"Cortando {len(segmentos)} tramos… (recodifica el vídeo, tarda un poco)")
ejecutar([
    "ffmpeg", "-y", "-v", "error", "-i", str(original), "-/filter_complex", str(script),
    "-map", "[v]", "-map", "[a]", "-r", str(fps),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "17",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(salida),
])
script.unlink()

# 5. Mapa de tiempos viejo -> nuevo.
tabla, nuevo = [], 0.0
for a, b in segmentos:
    tabla.append({"inicio": round(a, 4), "fin": round(b, 4), "nuevoInicio": round(nuevo, 4)})
    nuevo += b - a
dur_nueva = nuevo
ini_tramos = [s["inicio"] for s in tabla]


def mapear(t: float, final: bool = False) -> float:
    i = bisect.bisect_right(ini_tramos, t) - 1
    if i >= 0 and t < tabla[i]["fin"]:
        return tabla[i]["nuevoInicio"] + t - tabla[i]["inicio"]
    if final and i >= 0:  # termina dentro de un hueco quitado: se cierra al final del tramo
        return tabla[i]["nuevoInicio"] + tabla[i]["fin"] - tabla[i]["inicio"]
    if i + 1 < len(tabla):  # empieza en un hueco: se mueve al siguiente tramo
        return tabla[i + 1]["nuevoInicio"]
    return dur_nueva


subtitulos = []
for w in palabras:
    ini = mapear(w["startMs"] / 1000)
    fin = max(mapear(w["endMs"] / 1000, final=True), ini + 0.05)
    subtitulos.append({
        **w,
        "startMs": round(ini * 1000),
        "endMs": round(fin * 1000),
        "timestampMs": None if w.get("timestampMs") is None else round(mapear(w["timestampMs"] / 1000) * 1000),
    })

escribir_json(c / "subtitulos.json", subtitulos)
escribir_json(c / "cortes.json", {
    "duracionOriginal": round(dur, 3),
    "duracionNueva": round(dur_nueva, 3),
    "segmentos": tabla,
    "cortes": [s["nuevoInicio"] for s in tabla[1:]],
})

print(f"Antes: {mmss(dur)}  ->  Ahora: {mmss(dur_nueva)}  (quitados {dur - dur_nueva:.1f} s en {len(quitar)} silencios)")
