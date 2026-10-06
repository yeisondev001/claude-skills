"""Paso 4: detecta dónde están los ojos cada 0,2 s (MediaPipe) y suaviza el recorrido.

Uso: python herramientas/cara.py <slug> [--intervalo 0.2]

Trabaja sobre cortado.mp4 y genera cara.json con coordenadas normalizadas (0-1).
"""
import argparse

import cv2
import numpy as np

from comun import CONSTANTES, MOTOR, carpeta, escribir_json

cfg = CONSTANTES["cara"]
p = argparse.ArgumentParser()
p.add_argument("slug")
p.add_argument("--intervalo", type=float, default=cfg["intervalo"])
args = p.parse_args()

c = carpeta(args.slug)
cap = cv2.VideoCapture(str(c / "cortado.mp4"))
if not cap.isOpened():
    raise SystemExit("No puedo abrir cortado.mp4. ¿Ejecutaste cortar.py?")
fps = cap.get(cv2.CAP_PROP_FPS) or CONSTANTES["fps"]
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
ancho = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
alto = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
paso = max(1, round(args.intervalo * fps))


def detector_mediapipe():
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision

    modelo = MOTOR / "modelos" / "blaze_face_short_range.tflite"
    det = vision.FaceDetector.create_from_options(
        vision.FaceDetectorOptions(base_options=BaseOptions(model_asset_path=str(modelo)), min_detection_confidence=0.5)
    )

    def detectar(bgr):
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        caras = det.detect(img).detections
        if not caras:
            return None
        d = max(caras, key=lambda d: d.bounding_box.width * d.bounding_box.height)
        b = d.bounding_box
        ojo_d, ojo_i = d.keypoints[0], d.keypoints[1]
        return {
            "ojosX": (ojo_d.x + ojo_i.x) / 2,
            "ojosY": (ojo_d.y + ojo_i.y) / 2,
            "x": b.origin_x / ancho,
            "y": b.origin_y / alto,
            "w": b.width / ancho,
            "h": b.height / alto,
        }

    return detectar


def detector_opencv():
    cascada = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    def detectar(bgr):
        gris = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        caras = cascada.detectMultiScale(gris, 1.1, 6, minSize=(ancho // 12, ancho // 12))
        if len(caras) == 0:
            return None
        x, y, w, h = max(caras, key=lambda r: r[2] * r[3])
        return {"ojosX": (x + w / 2) / ancho, "ojosY": (y + h * 0.4) / alto,
                "x": x / ancho, "y": y / alto, "w": w / ancho, "h": h / alto}

    return detectar


try:
    detectar, motor = detector_mediapipe(), "MediaPipe"
except Exception as e:  # sin modelo o sin mediapipe: plan B con OpenCV
    print(f"MediaPipe no disponible ({e}); uso OpenCV.")
    detectar, motor = detector_opencv(), "OpenCV"

print(f"Buscando la cara cada {args.intervalo} s con {motor}…")
crudas, n = [], 0
while True:
    ok = cap.grab()
    if not ok:
        break
    if n % paso == 0:
        _, frame = cap.retrieve()
        crudas.append((n / fps, detectar(frame)))
    n += 1
cap.release()

encontradas = sum(1 for _, d in crudas if d)
if encontradas == 0:
    raise SystemExit("No encontré ninguna cara. Usa la cámara fija: \"camara\": {\"modo\": \"fijo\"} en plan.json")

# Rellena huecos con la detección más cercana y suaviza con una gaussiana.
claves = ["ojosX", "ojosY", "x", "y", "w", "h"]
serie = {k: np.array([d[k] if d else np.nan for _, d in crudas], dtype=float) for k in claves}
idx = np.arange(len(crudas))
for k, v in serie.items():
    validos = ~np.isnan(v)
    serie[k] = np.interp(idx, idx[validos], v[validos])

sigma = cfg["suavizado"] / args.intervalo
radio = int(3 * sigma) + 1
nucleo = np.exp(-0.5 * (np.arange(-radio, radio + 1) / sigma) ** 2)
nucleo /= nucleo.sum()
for k in claves:
    relleno = np.pad(serie[k], radio, mode="edge")
    serie[k] = np.convolve(relleno, nucleo, mode="valid")

muestras = [
    {"t": round(t, 3), **{k: round(float(serie[k][i]), 4) for k in claves}, "detectada": d is not None}
    for i, (t, d) in enumerate(crudas)
]
escribir_json(c / "cara.json", {"intervalo": args.intervalo, "ancho": ancho, "alto": alto, "motor": motor, "muestras": muestras})
print(f"Cara encontrada en {encontradas}/{len(crudas)} muestras ({100 * encontradas / len(crudas):.0f} %). Guardado cara.json")
