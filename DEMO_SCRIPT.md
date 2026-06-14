# 🎬 Script de Demo - Microservicio de Notificaciones

Este archivo contiene ejemplos listos para copiar/pegar para demostrar el microservicio en tu presentación.

## ⚡ Paso 1: Iniciar los servicios (en dos terminales diferentes)

### Terminal 1: Microservicio
```bash
cd d:\notifications-microservice-main
npm install
npm run dev
```

Deberías ver:
```
╔════════════════════════════════════════╗
║  📧 NOTIFICATIONS MICROSERVICE RUNNING  ║
║  Puerto: 3001                          ║
╚════════════════════════════════════════╝
```

### Terminal 2: Backend Principal
```bash
cd d:\share-notes-backend-main
npm install  # Si no lo has hecho
npm install axios  # IMPORTANTE: agregar axios
npm run dev
```

---

## ✅ Paso 2: Verificar que funciona

### Health Check del Microservicio

```bash
curl http://localhost:3001/notify/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "service": "notifications-microservice",
  "timestamp": "2024-01-01T10:30:45.123Z"
}
```

---

## 🧪 Paso 3: Pruebas Manuales

### Test 1: Enviar Email de Prueba (Directo)

```bash
curl -X POST http://localhost:3001/notify/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "name": "Juan Demo"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "messageId": "email-msg-id-123",
  "timestamp": "2024-01-01T10:31:00.000Z"
}
```

**En DEMO_MODE**: Verás algo como:
```
📧 Preview: https://ethereal.email/message/SGVsbG8gV29ybGQ=
```
Haz click en ese link para VER EL EMAIL en el navegador 📧

---

### Test 2: Registrar Usuario (Dispara Email Automático)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carlos García",
    "email": "carlos@example.com",
    "password": "MyPassword123"
  }'
```

**Respuesta inmediata:**
```json
{
  "message": "Registro exitoso",
  "user": {
    "id": 1,
    "name": "Carlos García",
    "email": "carlos@example.com",
    "role": "student"
  }
}
```

**En los logs del backend:**
```
✅ Welcome email sent to carlos@example.com
```

**En los logs del microservicio:**
```
✅ Email enviado: <messageId>
📧 Preview: https://ethereal.email/message/...
```

---

### Test 3: Responder en un Foro

Primero, crear un hilo (necesitas estar autenticado):

```bash
# Obtener token de login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos@example.com",
    "password": "MyPassword123"
  }'
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

Luego, crear un hilo:

```bash
curl -X POST http://localhost:3000/forum/threads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -d '{
    "title": "¿Cómo estudiar para el examen?",
    "body": "Algún consejo para el examen de TypeScript",
    "subjectId": 1
  }'
```

Ahora, responder al hilo (como otro usuario):

```bash
curl -X POST http://localhost:3000/forum/threads/1/reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OTRO_TOKEN" \
  -d '{
    "body": "Yo recomiendo estudiar los decoradores primero"
  }'
```

**Resultado:**
- El autor del hilo original recibe un email notificando la respuesta
- En logs: `✅ Forum reply notification sent to carlos@example.com`
- En Ethereal: Puedes VER el email con el contenido

---

## 📊 Comparativa: Con vs Sin Microservicio

### ❌ Sin Microservicio (Problema)
```
Usuario registra
│
├─ Backend envía email (bloquea)
├─ Espera respuesta SMTP (2-5 segundos)
├─ Si falla SMTP, usuario recibe error 500
└─ Tiempo total respuesta: 3-10 segundos
```

### ✅ Con Microservicio (Solución)
```
Usuario registra
│
├─ Backend guarda usuario en BD (rápido)
├─ Devuelve respuesta 201 (< 100ms)
├─ En background: llama microservicio
├─ Si falla, reintentar 3 veces
└─ Usuario NUNCA espera por emails
```

**Diferencia:** 3-10 segundos → < 100ms ⚡

---

## 🎬 Script Completo para Demo (COPY & PASTE)

```bash
# Terminal 1: Microservicio
cd d:\notifications-microservice-main && npm run dev &

# Terminal 2: Backend
cd d:\share-notes-backend-main && npm run dev &

# Esperar 5 segundos a que ambos inicien

# Test 1: Health check
echo "=== Test 1: Health Check ==="
curl -s http://localhost:3001/notify/health | jq

# Test 2: Email directo
echo "=== Test 2: Email Directo ==="
curl -s -X POST http://localhost:3001/notify/welcome \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","name":"Juan"}' | jq

# Test 3: Registrar usuario
echo "=== Test 3: Registrar Usuario ==="
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"testuser@example.com",
    "password":"Password123"
  }' | jq

echo "✅ Demo completada! Revisa los logs arriba."
```

---

## 🎨 Visualización para la Presentación

### Diapositiva 1: El Problema
```
Generación de Emails en Backend Principal
─────────────────────────────────────────
❌ Bloquea la respuesta del API
❌ Si el servidor de email está lento, todos los usuarios esperan
❌ Si falla, el usuario ve error (aunque el registro fue exitoso)
❌ No escala bien bajo alta carga
```

### Diapositiva 2: La Solución
```
Microservicio Independiente de Notificaciones
──────────────────────────────────────────────
✅ Backend responde rápido (< 100ms)
✅ Email se envía en background (sin bloquear)
✅ Si falla, reintentar automáticamente
✅ Puede escalarse independientemente
✅ Mantenimiento separado
```

### Diapositiva 3: Arquitectura

```
        Internet
            │
            ▼
    ┌─────────────┐
    │  Cliente    │
    │  (Browser)  │
    └──────┬──────┘
           │
    POST /auth/register
           │
           ▼
    ┌──────────────────┐         HTTP (Async)
    │ Backend Principal├─────────────────────┐
    │ TypeScript/      │                     │
    │ Express.js       │                     │
    └──────────────────┘                     │
                                              ▼
                                    ┌─────────────────┐
                                    │  Notifications  │
                                    │  Microservice   │
                                    │  TypeScript/    │
                                    │  Express.js     │
                                    └────────┬────────┘
                                             │
                                        SMTP │
                                             ▼
                                    ┌──────────────────┐
                                    │  SMTP Server     │
                                    │  (Gmail/SendGrid)│
                                    └──────────────────┘
```

### Diapositiva 4: Tecnología

```
Componentes del Microservicio:
─────────────────────────────
• Node.js + Express.js   → API REST
• TypeScript             → Type safety
• Nodemailer            → Envío de emails
• Reintentos automáticos → Resiliencia
• Templates HTML         → Emails bonitos
• Modo DEMO              → Testing sin credenciales
```

### Diapositiva 5: Demo

Mostrar en vivo:
1. Terminal con logs del microservicio
2. Registrar usuario en Postman
3. Mostrar email en Ethereal (click en Preview URL)
4. Logs mostrando "✅ Email enviado"

---

## 🔗 Recursos

- Repositorio Microservicio: `d:\notifications-microservice-main`
- Documentación: `d:\share-notes-backend-main\MICROSERVICE_INTEGRATION.md`
- Cliente TypeScript: `d:\share-notes-backend-main\src\utils\notification.client.ts`

---

## 📝 Notas para la Presentación

✨ **Puntos a destacar:**
1. **Separación de responsabilidades**: El microservicio solo hace UNA cosa bien
2. **Escalabilidad**: Puede crecer independientemente del backend
3. **Resiliencia**: Si el microservicio cae, el backend sigue funcionando
4. **Mantenibilidad**: Cambios en emails no afectan el backend
5. **Tecnología compartida**: Ambos usan TypeScript/Node.js

💡 **Preguntas posibles:**
- "¿Qué pasa si el microservicio no responde?" → Reintentos automáticos
- "¿Por qué necesitamos un microservicio?" → Ver slide "El Problema"
- "¿Qué otros servicios podrían separarse?" → Procesamiento de imágenes, reportes, etc.

🎯 **Tiempo estimado de demo:** 5 minutos
