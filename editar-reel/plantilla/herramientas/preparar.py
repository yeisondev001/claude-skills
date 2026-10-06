"""Paso 1: copia el vídeo al motor y lo normaliza a 30 fps constantes.

Uso: python herramientas/preparar.py <ruta-del-video> [--slug nombre]
"""
import argparse
from pathlib import Path

from comun import CONSTANTES, VIDEOS, ejecutar, escribir_json, mmss, slugificar, sondear

p = argparse.ArgumentParser()
p.add_argument("video")
p.add_argument("--slug")
args = p.parse_args()

origen = Path(args.video).expanduser().resolve()
if not origen.is_file():
    raise SystemExit(f"No encuentro el vídeo: {origen}")

slug = args.slug or slugificar(origen.stem)
destino = VIDEOS / slug
destino.mkdir(parents=True, exist_ok=True)

info = sondear(origen)
video = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
audio = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
if not video:
    raise SystemExit("El archivo no tiene imagen.")
if not audio:
    raise SystemExit("El archivo no tiene sonido: sin voz no puedo transcribir ni cortar silencios.")

# Rotación de móviles: ffmpeg la aplica al recodificar, así que medimos tras normalizar.
fps = CONSTANTES["fps"]
salida = destino / "original.mp4"
print(f"Normalizando a {fps} fps… (puede tardar un poco)")
ejecutar([
    "ffmpeg", "-y", "-v", "error", "-i", str(origen),
    "-vf", f"fps={fps},format=yuv420p",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "17",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart", str(salida),
])

final = sondear(salida)
v = next(s for s in final["streams"] if s["codec_type"] == "video")
ancho, alto = int(v["width"]), int(v["height"])
dur = float(final["format"]["duration"])
datos = {
    "slug": slug,
    "origen": str(origen),
    "ancho": ancho,
    "alto": alto,
    "duracion": dur,
    "orientacion": "vertical" if alto > ancho else "horizontal",
}
escribir_json(destino / "info.json", datos)

print(f"Listo: {slug}")
print(f"  Duración: {mmss(dur)}  ·  {ancho}×{alto}  ·  {datos['orientacion']}")
print(f"  Carpeta: {destino}")
