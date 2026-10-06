"""Deja el audio del vídeo final a -14 LUFS (el nivel de Instagram) en dos pasadas.

Uso: python herramientas/masterizar.py <entrada.mp4> <salida.mp4>
"""
import json
import re
import sys

from comun import CONSTANTES, ejecutar

if len(sys.argv) != 3:
    raise SystemExit(__doc__)
entrada, salida = sys.argv[1], sys.argv[2]
L = CONSTANTES["loudness"]
objetivo = f"I={L['lufs']}:TP={L['picoDb']}:LRA={L['rango']}"

r = ejecutar(["ffmpeg", "-hide_banner", "-nostats", "-i", entrada, "-vn",
              "-af", f"loudnorm={objetivo}:print_format=json", "-f", "null", "-"])
medido = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S).group(0))

filtro = (
    f"loudnorm={objetivo}:measured_I={medido['input_i']}:measured_TP={medido['input_tp']}"
    f":measured_LRA={medido['input_lra']}:measured_thresh={medido['input_thresh']}"
    f":offset={medido['target_offset']}:linear=true"
)
ejecutar(["ffmpeg", "-y", "-v", "error", "-i", entrada, "-c:v", "copy", "-af", filtro,
          "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", salida])

r = ejecutar(["ffmpeg", "-hide_banner", "-nostats", "-i", salida, "-vn",
              "-af", "loudnorm=print_format=json", "-f", "null", "-"])
final = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S).group(0))
print(f"Volumen: {medido['input_i']} LUFS -> {final['input_i']} LUFS (pico {final['input_tp']} dB)")
