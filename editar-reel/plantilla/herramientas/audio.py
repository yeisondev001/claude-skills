"""Paso 7: genera con código la música (lo-fi suave) y los efectos atados a cada animación.

Uso: python herramientas/audio.py <slug> [--bpm 100] [--semilla 7] [--estilo lofi|tranquila|alegre]

Sin bancos de sonidos: todo sale de osciladores y ruido, así que no hay derechos.
Lee plan.json y cortes.json; escribe musica.wav y sfx.wav en la carpeta del vídeo.
Los tiempos de los efectos usan las mismas constantes que las animaciones (src/constantes.json).
"""
import argparse
import wave

import numpy as np

from comun import CONSTANTES, carpeta, leer_json

SR = 48000
p = argparse.ArgumentParser()
p.add_argument("slug")
p.add_argument("--bpm", type=float)
p.add_argument("--semilla", type=int)
p.add_argument("--estilo", choices=["lofi", "tranquila", "alegre"])
args = p.parse_args()

c = carpeta(args.slug)
plan = leer_json(c / "plan.json")
dur = leer_json(c / "cortes.json")["duracionNueva"] + 0.5
cfg_musica = {**CONSTANTES["musica"], **plan.get("musica", {})}
estilo = args.estilo or cfg_musica.get("estilo", "lofi")
bpm = args.bpm or cfg_musica.get("bpm") or {"lofi": 100, "tranquila": 80, "alegre": 116}[estilo]
rng = np.random.default_rng(args.semilla if args.semilla is not None else cfg_musica.get("semilla", 7))
N = int(dur * SR)


def t_(segundos: float) -> np.ndarray:
    return np.arange(int(segundos * SR)) / SR


def poner(buf: np.ndarray, sonido: np.ndarray, en: float, pan: float = 0.0, gan: float = 1.0) -> None:
    i = int(en * SR)
    if i >= buf.shape[1] or i + len(sonido) <= 0:
        return
    s = sonido[: buf.shape[1] - i] * gan
    buf[0, i:i + len(s)] += s * np.sqrt((1 - pan) / 2)
    buf[1, i:i + len(s)] += s * np.sqrt((1 + pan) / 2)


def paso_bajo(x: np.ndarray, corte: float, pendiente: float = 2.0) -> np.ndarray:
    f = np.fft.rfftfreq(x.shape[-1], 1 / SR)
    return np.fft.irfft(np.fft.rfft(x) / np.sqrt(1 + (f / corte) ** (2 * pendiente)), n=x.shape[-1])


def nota(f: float, segundos: float, armonicos=(1, 0.35, 0.12), tau: float = 1.2) -> np.ndarray:
    t = t_(segundos)
    s = sum(a * np.sin(2 * np.pi * f * (k + 1) * t + rng.uniform(0, 6)) for k, a in enumerate(armonicos))
    env = np.minimum(1, t / 0.012) * np.exp(-t / tau)
    return s * env * (1 + 0.15 * np.sin(2 * np.pi * 5 * t))


def hz(midi: float) -> float:
    return 440 * 2 ** ((midi - 69) / 12)


# ── Música ───────────────────────────────────────────────────────────────────
PROGRESIONES = {
    "lofi": [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],      # Fmaj7 Em7 Dm7 Cmaj7
    "tranquila": [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]],  # C Am F G abiertos
    "alegre": [[48, 52, 55, 60], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]],     # C G Am F
}
prog = PROGRESIONES[estilo]
beat = 60 / bpm
compas = 4 * beat
musica = np.zeros((2, N))

nc = int(np.ceil(dur / compas))
for b in range(nc):
    acorde = prog[b % len(prog)]
    t0 = b * compas
    golpes = [(0, 0.5), (1.5, 0.3)] if estilo != "tranquila" else [(0, 0.45)]
    for desfase, gan in golpes:
        for m in acorde:
            poner(musica, nota(hz(m) * 2 ** (rng.uniform(-3, 3) / 1200), compas), t0 + desfase * beat,
                  pan=rng.uniform(-0.3, 0.3), gan=gan / len(acorde))
    raiz = hz(acorde[0] - 12 if acorde[0] >= 48 else acorde[0])
    for desfase in (0, 2):
        poner(musica, nota(raiz / 2, beat * 1.8, (1, 0.25), tau=0.6), t0 + desfase * beat, gan=0.32)

    if estilo == "tranquila":
        continue
    # Batería suave con swing
    for k in range(4):
        tb = t0 + k * beat
        if k in (0, 2):
            tk = t_(0.3)
            bombo = np.sin(2 * np.pi * np.cumsum(45 + 75 * np.exp(-tk / 0.04)) / SR) * np.exp(-tk / 0.12)
            poner(musica, bombo, tb, gan=0.42)
        else:
            ts = t_(0.2)
            caja = rng.normal(0, 1, len(ts)) * np.exp(-ts / 0.05) * 0.5 + np.sin(2 * np.pi * 190 * ts) * np.exp(-ts / 0.04)
            poner(musica, caja, tb, gan=0.12)
        for octavo in (0, 1):
            th = t_(0.05)
            hat = np.diff(rng.normal(0, 1, len(th) + 1)) * np.exp(-th / 0.012)
            poner(musica, hat, tb + octavo * beat * 0.56, pan=0.25, gan=rng.uniform(0.04, 0.07))

musica = paso_bajo(musica, 3200 if estilo == "lofi" else 6000)
# Crujido de vinilo
crujido = np.zeros(N)
idx = rng.integers(0, N, int(dur * 9))
crujido[idx] = rng.uniform(-1, 1, len(idx))
musica += paso_bajo(crujido, 4000) * 0.12 + paso_bajo(rng.normal(0, 1, N), 1500) * 0.004
env = np.minimum(1, np.arange(N) / (SR * 1.0)) * np.minimum(1, (N - np.arange(N)) / (SR * 1.5))
musica *= env
musica *= 0.6 / (np.abs(musica).max() + 1e-9)

# ── Efectos ──────────────────────────────────────────────────────────────────
def whoosh(segundos=0.45, sube=True) -> np.ndarray:
    n = int(segundos * SR)
    ruido = rng.normal(0, 1, n)
    x = np.linspace(0, 1, n)
    corte = 300 + 3700 * (np.sin(np.pi * x) if sube else 1 - x)
    a = 1 - np.exp(-2 * np.pi * corte / SR)
    y, z = np.zeros(n), 0.0
    for i in range(n):
        z += a[i] * (ruido[i] - z)
        y[i] = z
    return y * np.sin(np.pi * x) ** 2 * 1.6


def pop() -> np.ndarray:
    t = t_(0.12)
    f = 350 + 550 * np.exp(-t / 0.02)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03)


def tic() -> np.ndarray:
    t = t_(0.03)
    return (np.sin(2 * np.pi * 1900 * t) + 0.3 * rng.normal(0, 1, len(t))) * np.exp(-t / 0.006) * 0.5


def tecla() -> np.ndarray:
    t = t_(0.025)
    r = np.diff(rng.normal(0, 1, len(t) + 1)) * np.exp(-t / 0.005)
    return (r + 0.4 * np.sin(2 * np.pi * rng.uniform(2200, 3400) * t) * np.exp(-t / 0.004)) * 0.45


def tachar() -> np.ndarray:
    t = t_(0.28)
    r = np.diff(rng.normal(0, 1, len(t) + 1)) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * t))
    return r * np.sin(np.pi * t / t[-1]) * 0.5


def golpe() -> np.ndarray:
    """Sello de goma: golpe sordo grave más un chasquido corto."""
    t = t_(0.25)
    grave = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.07)
    chasquido = np.diff(rng.normal(0, 1, len(t) + 1)) * np.exp(-t / 0.008) * 0.6
    return grave + chasquido


GENERADORES = {"whoosh": whoosh, "pop": pop, "tic": tic, "tecleo": tecla, "tachar": tachar, "golpe": golpe}
A = CONSTANTES["animaciones"]
sfx = np.zeros((2, N))


def efecto(nombre: str, ms: float, gan: float = 1.0, pan: float = 0.0) -> None:
    if nombre in GENERADORES:
        poner(sfx, GENERADORES[nombre](), ms / 1000, pan=pan, gan=gan)


for cap in plan.get("capitulos", []):
    efecto("whoosh", cap["desdeMs"] - 80)  # barrido de entrada
    efecto("pop", cap["desdeMs"] + A["capitulo"]["barridoMs"] + 120, 0.6)
    efecto("whoosh", cap["hastaMs"] - A["capitulo"]["salidaMs"], 0.6)  # sale hacia arriba

for anim in plan.get("animaciones", []):
    d = anim["desdeMs"]
    props = anim.get("props", {})
    if "sfx" in anim:  # el plan manda: "ninguno" o un efecto concreto
        if anim["sfx"] != "ninguno":
            efecto(anim["sfx"], d)
        continue
    tipo = anim["tipo"]
    if tipo == "cifra":
        efecto("pop", d)
        for ms in np.arange(d, d + A["cifra"]["cuentaMs"], A["cifra"]["ticCadaMs"]):
            efecto("tic", ms, 0.7)
    elif tipo == "lista":
        efecto("pop", d, 0.7)
        for item in props.get("items", []):
            if "ms" in item:
                efecto("tic", item["ms"], 1.2)
    elif tipo == "flujo":
        efecto("pop", d, 0.7)
        for paso in props.get("pasos", []):
            if "ms" in paso:
                efecto("tic", paso["ms"], 1.2)
    elif tipo == "chat":
        efecto("pop", d, 0.6)
        for m in props.get("mensajes", []):
            if "ms" in m:
                efecto("pop", m["ms"], 0.8, 0.2 if m.get("de") != "otro" else -0.2)
    elif tipo == "sello":
        efecto("golpe", d + 120)
    elif tipo == "insignia":
        efecto("pop", d)
    elif tipo == "cta":
        efecto("pop", d)
        if props.get("estilo") == "lleno":
            palabra = props.get("palabra") or plan.get("cta", {}).get("palabra", "")
            inicio = d + A["cta"]["retrasoMs"]
            for i in range(len(palabra)):
                efecto("tecleo", inicio + i * A["cta"]["msPorLetra"], 1.0, rng.uniform(-0.2, 0.2))

pico = np.abs(sfx).max()
if pico > 0:
    sfx *= 0.8 / pico


def guardar(ruta, datos):
    pcm = (np.clip(datos.T, -1, 1) * 32767).astype("<i2")
    with wave.open(str(ruta), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


guardar(c / "musica.wav", musica)
guardar(c / "sfx.wav", sfx)
print(f"Música {estilo} a {bpm:.0f} BPM y efectos generados ({dur:.1f} s): musica.wav, sfx.wav")
