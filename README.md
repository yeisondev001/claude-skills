# claude-skills

Skills para [Claude Code](https://code.claude.com/docs).

| Skill | Qué hace |
|---|---|
| [editar-reel](editar-reel/) | Convierte un vídeo hablando a cámara en un reel vertical 1080×1920 listo para Instagram/TikTok, todo con código y en local: transcribe con whisper.cpp, corta silencios con voz y boca sincronizadas, subtítulos karaoke, tarjetas animadas sincronizadas con lo que dices, música y efectos generados con código y audio a -14 LUFS. Montaje con Remotion. |

## Instalar una skill

1. Copia la carpeta de la skill dentro de `.claude/skills/` de tu proyecto
   (o en `~/.claude/skills/` para tenerla en todos tus proyectos).
2. Abre Claude Code en ese proyecto y pídele lo que hace la skill (p. ej. "edítame este vídeo").

### editar-reel

Requisitos: Node 22+, FFmpeg (con ffprobe), Python 3.10+ con `numpy`, `opencv-python` y `Pillow`.
La primera vez:

```bash
python .claude/skills/editar-reel/instalar.py
```

Crea el proyecto de Remotion (`motor-reel/`, junto a `.claude/`), instala MediaPipe y descarga el modelo de
caras. La primera transcripción descarga whisper.cpp y su modelo (1,5 GB).

- Instrucciones de la skill: [editar-reel/SKILL.md](editar-reel/SKILL.md)
- Estilo visual: [editar-reel/referencia/estilo.md](editar-reel/referencia/estilo.md)
- Guía para que cualquier agente la construya desde cero: [editar-reel/NOTA-crear-skill.md](editar-reel/NOTA-crear-skill.md)

El estilo está basado en la forma de editar de los reels de Erik Taveras (@erik.py); el repositorio no
incluye ningún vídeo suyo. Remotion es gratis para personas y empresas de hasta 3 empleados; empresas
mayores necesitan [licencia de empresa](https://www.remotion.pro/license).
