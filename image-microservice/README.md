# 🖼️ Microservicio de Procesamiento de Imágenes — Share-Notes

Microservicio independiente en **Python + FastAPI** que recibe imágenes
subidas por los estudiantes, las comprime, redimensiona y agrega la
marca de agua de Share-Notes.

---

## ¿Por qué existe este microservicio?

Procesar imágenes (redimensionar, comprimir, aplicar filtros) es una
tarea intensiva en CPU y memoria. Si esto se hiciera dentro del backend
principal de Node.js, cada imagen bloquearía el hilo de eventos y
ralentizaría todas las demás peticiones.

Al separarlo en un microservicio Python/Pillow:
- El backend principal nunca se bloquea por imágenes.
- Se puede escalar este servicio de forma independiente.
- Se puede cambiar la lógica de procesamiento sin tocar el backend.

---

## Estructura

```
image-microservice/
├── main.py           ← Toda la lógica del microservicio
├── requirements.txt  ← Dependencias Python
├── Dockerfile        ← Para correrlo en contenedor
└── README.md
```

Archivos que se modificaron en el **backend principal**:
```
src/
├── services/
│   ├── image-processor.service.ts  ← NUEVO: cliente HTTP al microservicio
│   └── note.service.ts             ← MODIFICADO: llama al microservicio al subir imágenes
```

---

## Instalación y ejecución local

### 1. Levantar el microservicio

```bash
cd image-microservice

# Crear entorno virtual
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Instalar dependencias
pip install -r requirements.txt

# Correr el servidor (puerto 8001)
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

El microservicio queda disponible en: http://localhost:8001
Documentación automática en: http://localhost:8001/docs

### 2. Configurar el backend principal

Agrega al `.env` del backend:

```env
IMAGE_MICROSERVICE_URL=http://localhost:8001
```

Instala las dependencias nuevas de Node:

```bash
npm install node-fetch form-data
npm install --save-dev @types/node-fetch @types/form-data
```

Reemplaza los archivos:
- `src/services/note.service.ts` con el nuevo `note.service.ts`
- Agrega `src/services/image-processor.service.ts`

### 3. Con Docker (opcional)

```bash
cd image-microservice
docker build -t share-notes-image-processor .
docker run -p 8001:8001 share-notes-image-processor
```

---

## Flujo completo

```
Usuario sube imagen (JPG/PNG)
         │
         ▼
  Frontend (React)
         │  POST /api/notes  (multipart/form-data)
         ▼
Backend Node.js (Express)
  1. Multer guarda el archivo temporalmente
  2. NoteService detecta que es imagen
  3. Llama al microservicio con la imagen
         │  POST http://localhost:8001/process-image
         ▼
  Microservicio Python (FastAPI)
  1. Redimensiona si > 1200×1600 px
  2. Agrega marca de agua
  3. Comprime a JPEG 82%
  4. Devuelve el buffer procesado
         │
         ▼
Backend Node.js
  4. Guarda la imagen procesada en disco
  5. Elimina la imagen original
  6. Guarda metadatos en MySQL
  7. Responde { message: "Apunte subido" }
         │
         ▼
  Frontend muestra éxito ✓
```

---

## Manejo de errores

Si el microservicio **no está disponible**, el backend principal NO falla.
En su lugar, guarda la imagen original sin procesar y registra el error
en los logs. El usuario nunca nota la diferencia.

Esto cumple el requisito del taller: *"Implementar qué sucede si el
microservicio no responde."*

---

## Endpoints del microservicio

| Método | Ruta              | Descripción                        |
|--------|-------------------|------------------------------------|
| GET    | `/health`         | Health check (usado por el backend)|
| POST   | `/process-image`  | Procesa una imagen y la devuelve   |
| GET    | `/docs`           | Documentación Swagger automática   |
