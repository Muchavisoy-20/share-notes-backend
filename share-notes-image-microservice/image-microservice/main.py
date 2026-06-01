from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from PIL import Image, ImageDraw, ImageFont
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Share-Notes Image Microservice",
    description="Procesa imágenes de apuntes: comprime, redimensiona y agrega marca de agua.",
    version="1.0.0"
)

# ─── Configuración ────────────────────────────────────────────────────────────
MAX_WIDTH  = 1200   # px — ancho máximo permitido
MAX_HEIGHT = 1600   # px — alto máximo permitido
JPEG_QUALITY = 82   # calidad de compresión (0-95)
WATERMARK_TEXT = "share-notes.app"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def resize_image(img: Image.Image) -> Image.Image:
    """Redimensiona manteniendo proporción si supera el máximo."""
    w, h = img.size
    if w <= MAX_WIDTH and h <= MAX_HEIGHT:
        return img
    ratio = min(MAX_WIDTH / w, MAX_HEIGHT / h)
    new_size = (int(w * ratio), int(h * ratio))
    return img.resize(new_size, Image.LANCZOS)


def add_watermark(img: Image.Image) -> Image.Image:
    """Agrega marca de agua semitransparente en la esquina inferior derecha."""
    # Trabajamos sobre una copia en RGBA para soportar transparencia
    base = img.convert("RGBA")
    overlay = Image.new("RGBA", base.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    # Intentar fuente del sistema; si no existe, usar la default
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    except OSError:
        font = ImageFont.load_default()

    # Medir el texto
    bbox = draw.textbbox((0, 0), WATERMARK_TEXT, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    margin = 14
    x = base.width  - text_w  - margin
    y = base.height - text_h  - margin

    # Sombra suave
    draw.text((x + 1, y + 1), WATERMARK_TEXT, font=font, fill=(0, 0, 0, 90))
    # Texto principal en blanco semitransparente
    draw.text((x, y), WATERMARK_TEXT, font=font, fill=(255, 255, 255, 180))

    watermarked = Image.alpha_composite(base, overlay)
    return watermarked.convert("RGB")


def process_image(raw_bytes: bytes, mimetype: str) -> bytes:
    """Pipeline completo: abrir → redimensionar → marca de agua → comprimir."""
    img = Image.open(io.BytesIO(raw_bytes))

    # Convertir modos raros (CMYK, P, etc.) a RGB antes de procesar
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    img = resize_image(img)
    img = add_watermark(img)

    output = io.BytesIO()
    # Siempre guardar como JPEG para consistencia y compresión
    img.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return output.getvalue()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """El backend principal usa este endpoint para saber si el microservicio está vivo."""
    return {"status": "ok", "service": "image-processor"}


@app.post("/process-image", response_class=Response)
async def process_image_endpoint(file: UploadFile = File(...)):
    """
    Recibe una imagen (JPEG o PNG), la procesa y devuelve el JPEG resultante.

    - Redimensiona si supera 1200×1600 px
    - Agrega marca de agua 'share-notes.app'
    - Comprime al 82% de calidad JPEG

    Usado exclusivamente por el backend principal de Share-Notes.
    """
    ALLOWED = {"image/jpeg", "image/png"}
    if file.content_type not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no soportado: {file.content_type}. Solo JPEG y PNG."
        )

    raw = await file.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")

    logger.info(f"Procesando imagen: {file.filename} ({len(raw)} bytes)")

    try:
        processed = process_image(raw, file.content_type)
    except Exception as e:
        logger.error(f"Error procesando imagen: {e}")
        raise HTTPException(status_code=500, detail="Error interno al procesar la imagen.")

    logger.info(f"Imagen procesada: {len(raw)} → {len(processed)} bytes")

    return Response(
        content=processed,
        media_type="image/jpeg",
        headers={"X-Original-Size": str(len(raw)), "X-Processed-Size": str(len(processed))}
    )
