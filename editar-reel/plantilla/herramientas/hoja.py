"""Monta la hoja de revisión: fotogramas en rejilla con las franjas que tapa Instagram marcadas en rojo.

Uso: python herramientas/hoja.py <slug>   (normalmente lo llama revisar.mjs)
"""
import argparse

from PIL import Image, ImageDraw, ImageFont

from comun import CONSTANTES, carpeta, leer_json

p = argparse.ArgumentParser()
p.add_argument("slug")
args = p.parse_args()

rev = carpeta(args.slug) / "revision"
indice = leer_json(rev / "indice.json")
ANCHO, ALTO = 360, 640
COLUMNAS = 4
ROTULO = 54
z = CONSTANTES["zonaSegura"]
esc = ANCHO / CONSTANTES["ancho"]
try:  # con tildes; la fuente por defecto de Pillow no las tiene
    fuente = ImageFont.truetype("arial.ttf", 17)
except OSError:
    fuente = ImageFont.load_default(size=17)

filas = (len(indice) + COLUMNAS - 1) // COLUMNAS
hoja = Image.new("RGB", (COLUMNAS * (ANCHO + 12) + 12, filas * (ALTO + ROTULO + 12) + 12), "#1b1f24")
for n, item in enumerate(indice):
    img = Image.open(rev / item["archivo"]).convert("RGB").resize((ANCHO, ALTO))
    capa = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    rojo = (255, 40, 40, 70)
    d.rectangle([0, 0, ANCHO, z["arriba"] * esc], fill=rojo)
    d.rectangle([0, ALTO - z["abajo"] * esc, ANCHO, ALTO], fill=rojo)
    d.rectangle([ANCHO - z["derecha"] * esc, z["derechaDesde"] * esc, ANCHO, ALTO - z["abajo"] * esc], fill=rojo)
    img = Image.alpha_composite(img.convert("RGBA"), capa).convert("RGB")

    x = 12 + (n % COLUMNAS) * (ANCHO + 12)
    y = 12 + (n // COLUMNAS) * (ALTO + ROTULO + 12)
    hoja.paste(img, (x, y))
    texto = ImageDraw.Draw(hoja)
    texto.text((x + 4, y + ALTO + 6), f"{item['ms'] / 1000:.2f}s · f{item['frame']}", fill="#ffd200", font=fuente)
    texto.text((x + 4, y + ALTO + 28), item["etiqueta"][:38], fill="#e6e6e6", font=fuente)

salida = rev / "hoja.jpg"
hoja.save(salida, quality=85)
print(f"Hoja de revisión: {salida}")
