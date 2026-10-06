"""Muestra la transcripción en frases, con el índice y el tiempo de cada palabra.

Uso:
  python herramientas/texto.py <slug>              # texto limpio por frases (para enseñárselo al usuario)
  python herramientas/texto.py <slug> --palabras   # cada palabra con índice y ms (para planificar animaciones)
  python herramientas/texto.py <slug> --original   # sobre la transcripción antes de cortar

Por defecto usa subtitulos.json (línea de tiempo ya cortada) si existe.
"""
import argparse

from comun import carpeta, leer_json

p = argparse.ArgumentParser()
p.add_argument("slug")
p.add_argument("--palabras", action="store_true")
p.add_argument("--original", action="store_true")
args = p.parse_args()

c = carpeta(args.slug)
archivo = c / "transcripcion.json" if args.original or not (c / "subtitulos.json").exists() else c / "subtitulos.json"
palabras = leer_json(archivo)
print(f"# {archivo.name} · {len(palabras)} palabras\n")

# Agrupa en frases: corta tras puntuación final o pausas de más de 0,6 s.
frases, actual = [], []
for i, w in enumerate(palabras):
    actual.append((i, w))
    siguiente = palabras[i + 1] if i + 1 < len(palabras) else None
    pausa = siguiente is not None and siguiente["startMs"] - w["endMs"] > 600
    if w["text"].strip().endswith((".", "?", "!", "…")) or pausa or siguiente is None:
        frases.append(actual)
        actual = []

for frase in frases:
    ini = frase[0][1]["startMs"] / 1000
    if args.palabras:
        detalle = "  ".join(f"[{i}]{w['text'].strip()}@{w['startMs']}" for i, w in frase)
        print(f"{ini:7.2f}s  {detalle}")
    else:
        print(f"{ini:7.2f}s  {''.join(w['text'] for _, w in frase).strip()}")
