"""Utilidades compartidas por las herramientas del motor de reels."""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

MOTOR = Path(__file__).resolve().parent.parent
PUBLIC = MOTOR / "public"
VIDEOS = PUBLIC / "videos"
CONSTANTES = json.loads((MOTOR / "src" / "constantes.json").read_text(encoding="utf-8"))

# La consola de Windows usa cp1252 y revienta con tildes o flechas.
for flujo in (sys.stdout, sys.stderr):
    try:
        flujo.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


def carpeta(slug: str) -> Path:
    c = VIDEOS / slug
    if not c.is_dir():
        sys.exit(f"No existe el vídeo '{slug}'. Primero: python herramientas/preparar.py <vídeo>")
    return c


def slugificar(texto: str) -> str:
    texto = texto.lower()
    for a, b in zip("áéíóúüñ", "aeiouun"):
        texto = texto.replace(a, b)
    texto = re.sub(r"[^a-z0-9]+", "-", texto).strip("-")
    return texto or "video"


def leer_json(ruta: Path):
    return json.loads(ruta.read_text(encoding="utf-8"))


def escribir_json(ruta: Path, datos) -> None:
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")


def ejecutar(cmd: list[str], capturar: bool = False) -> subprocess.CompletedProcess:
    if not shutil.which(cmd[0]):
        sys.exit(f"No encuentro '{cmd[0]}'. Instálalo y vuelve a intentarlo.")
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        print(r.stderr[-3000:], file=sys.stderr)
        sys.exit(f"Falló: {' '.join(cmd[:3])} …")
    return r


def sondear(ruta: Path) -> dict:
    r = ejecutar(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(ruta)])
    return json.loads(r.stdout)


def duracion(ruta: Path) -> float:
    return float(sondear(ruta)["format"]["duration"])


def mmss(segundos: float) -> str:
    m, s = divmod(segundos, 60)
    return f"{int(m)}:{s:04.1f}"
