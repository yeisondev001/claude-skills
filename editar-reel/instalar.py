"""Crea o actualiza el motor de reels (proyecto Remotion) a partir de la plantilla de esta skill.

Uso: python instalar.py [--motor RUTA]   (por defecto: <carpeta del proyecto>/motor-reel)

Es seguro repetirlo: solo instala lo que falta y vuelve a copiar el código de la plantilla
(src/ y herramientas/). No toca public/videos ni out/.
"""
import argparse
import json
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

SKILL = Path(__file__).resolve().parent
PLANTILLA = SKILL / "plantilla"
VERSION = "4.0.533"
PAQUETES = ["@remotion/renderer", "@remotion/bundler", "@remotion/google-fonts", "@remotion/captions",
            "@remotion/install-whisper-cpp", "@remotion/media-utils"]
MODELO_CARA = ("https://storage.googleapis.com/mediapipe-models/face_detector/"
               "blaze_face_short_range/float16/latest/blaze_face_short_range.tflite")

sys.stdout.reconfigure(encoding="utf-8")
p = argparse.ArgumentParser()
p.add_argument("--motor", default=str(SKILL.parents[2] / "motor-reel"))
motor = Path(p.parse_args().motor).resolve()


def correr(cmd, cwd):
    print("  $", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True, shell=sys.platform == "win32")


for herramienta in ("node", "npx", "ffmpeg", "ffprobe"):
    if not shutil.which(herramienta):
        sys.exit(f"Falta {herramienta}. Instálalo antes de seguir.")

if not (motor / "package.json").exists():
    print(f"Creando el proyecto de Remotion en {motor}…")
    correr(["npx", "-y", f"create-video@{VERSION}", "--yes", "--blank", "--no-tailwind", motor.name], motor.parent)
(motor / "src" / "Composition.tsx").unlink(missing_ok=True)  # el ejemplo de la plantilla en blanco

deps = json.loads((motor / "package.json").read_text(encoding="utf-8")).get("dependencies", {})
faltan = [f"{x}@{VERSION}" for x in PAQUETES if x not in deps]
if faltan:
    print("Instalando paquetes de Remotion…")
    correr(["npm", "i", "--loglevel=error", *faltan], motor)

print("Copiando el código de la plantilla…")
# src/ y herramientas/ son de la plantilla: se reemplazan enteros para no dejar archivos viejos.
for sub in ("src", "herramientas"):
    shutil.rmtree(motor / sub, ignore_errors=True)
    shutil.copytree(PLANTILLA / sub, motor / sub)
(motor / "public").mkdir(exist_ok=True)
shutil.copy(PLANTILLA / "public" / "marca.json", motor / "public" / "marca.json")  # cambios por vídeo: plan.json → marca

tsconfig = motor / "tsconfig.json"
cfg = json.loads(tsconfig.read_text(encoding="utf-8"))
cfg.setdefault("compilerOptions", {})["resolveJsonModule"] = True
tsconfig.write_text(json.dumps(cfg, indent=2), encoding="utf-8")

gitignore = motor / ".gitignore"
lineas = gitignore.read_text(encoding="utf-8").splitlines() if gitignore.exists() else []
for extra in ("public/videos", "out", "whisper.cpp", "modelos", "temp"):
    if extra not in lineas:
        lineas.append(extra)
gitignore.write_text("\n".join(lineas) + "\n", encoding="utf-8")

modelo = motor / "modelos" / "blaze_face_short_range.tflite"
if not modelo.exists():
    print("Descargando el modelo de detección de caras de MediaPipe…")
    modelo.parent.mkdir(exist_ok=True)
    urllib.request.urlretrieve(MODELO_CARA, modelo)

try:
    import mediapipe  # noqa: F401
except ImportError:
    correr([sys.executable, "-m", "pip", "install", "--quiet", "mediapipe"], motor)

print(f"\nMotor listo en {motor}")
if not (motor / "whisper.cpp").exists():
    print("whisper.cpp y el modelo (1,5 GB) se descargarán la primera vez que transcribas.")
