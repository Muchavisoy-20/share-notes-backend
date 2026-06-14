# 📋 Integración: Microservicio de Notificaciones

## Archivos Modificados

### Backend Principal (share-notes-backend)

#### 1. **src/utils/notification.client.ts** (NUEVO)
Cliente TypeScript con reintentos automáticos para comunicarse con el microservicio.

```typescript
import { notificationClient } from '../utils/notification.client';

// Uso básico:
await notificationClient.sendWelcome('user@example.com', 'Juan');
```

#### 2. **src/controllers/auth.controller.ts** (MODIFICADO)
Se agregó llamada al microservicio después del registro:

```typescript
const user = await service.register(name, email, password);

// Enviar email de bienvenida (asíncrono, no bloquea)
notificationClient.sendWelcome(email, name);
```

#### 3. **src/controllers/forum.controller.ts** (MODIFICADO)
Se agregó notificación cuando alguien responde un hilo:

```typescript
const result = await service.createReply({...});

// Notificar al autor del hilo
notificationClient.sendForumReply(
  threadData.author.email,
  threadData.title,
  authorName,
  body,
  forumLink
);
```

---

## 🚀 Instalación

### 1. Instalar dependencias en el backend principal

```bash
npm install axios
```

### 2. Agregar variable de entorno en .env

```env
# URL del microservicio de notificaciones
NOTIFICATION_SERVICE_URL=http://localhost:3001
```

### 3. Instalar microservicio en carpeta separada

```bash
cd ../notifications-microservice-main
npm install
```

---

## 🔄 Flujo de Operación

```
1. Cliente registra en ShareNotes
   │
   └─> Backend valida datos
       │
       └─> Guarda usuario en BD
       │
       └─> Responde 201 al cliente (rápido)
           │
           └─> Llama al microservicio (asíncrono)
               │
               └─> Microservicio envía email
```

**Ventaja**: El cliente recibe respuesta rápida. El email se envía en background.

---

## 📊 Manejo de Errores

### Caso 1: Microservicio no responde
```
- Reintenta 3 veces con backoff exponencial
- Si falla después de reintentos, solo registra el error
- La operación principal continúa (el usuario se registra)
```

### Caso 2: Email inválido
```
- El microservicio rechaza la solicitud
- Backend captura el error y lo registra
- Respuesta al cliente no se ve afectada
```

---

## ✅ Testing Manual

### 1. Iniciar el microservicio

```bash
cd notifications-microservice-main
npm run dev
# Debe mostrar:
# ╔════════════════════════════════════════╗
# ║  📧 NOTIFICATIONS MICROSERVICE RUNNING  ║
# ║  Puerto: 3001                          ║
# ╚════════════════════════════════════════╝
```

### 2. Health check

```bash
curl http://localhost:3001/notify/health

# Respuesta esperada:
# {
#   "status": "healthy",
#   "service": "notifications-microservice",
#   "timestamp": "2024-01-01T00:00:00.000Z"
# }
```

### 3. Enviar notificación de prueba

```bash
curl -X POST http://localhost:3001/notify/welcome \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Juan"}'

# En DEMO_MODE=true, recibirás un URL para ver el email:
# 📧 Preview: https://ethereal.email/message/...
```

### 4. Registrar usuario en ShareNotes (esto dispara el email)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carlos",
    "email": "carlos@example.com",
    "password": "Password123"
  }'

# El backend devuelve respuesta inmediata
# El microservicio envía email en background
```

---

## 🎯 Casos de Uso Implementados

### ✅ Welcome (Bienvenida)
**Cuándo**: Usuario se registra
```
POST /auth/register
→ Automáticamente envía email de bienvenida
```

### ✅ Forum Reply (Respuesta en Foro)
**Cuándo**: Alguien responde un hilo
```
POST /forum/:threadId/reply
→ Notifica al autor del hilo sobre la respuesta
```

### 🔜 Note Shared (Nota Compartida)
**Cuándo**: Nota se comparte con otro usuario
```
POST /note/:noteId/share
→ Notificaría al usuario que recibe la nota
(Requiere implementar endpoint de compartir)
```

---

## 📈 Métricas y Logs

### Backend Principal
```
✅ Welcome email sent to user@example.com
❌ Failed to send welcome email to user@example.com: [error details]
⚠️ Reintentando notificación (1/3)...
```

### Microservicio
```
✅ Email enviado: <messageId>
❌ Error enviando email: [error]
📧 Preview: https://ethereal.email/message/...
```

---

## 🔐 Seguridad

1. **Backend-to-Backend**: Solo el backend principal puede llamar al microservicio
2. **No requiere autenticación** (en esta versión, agregar en producción)
3. **Validación**: Microservicio valida emails y templates
4. **Reintentos**: Solo se reintentan errores temporales

---

## 🛠️ Para Producción

### 1. Configurar SMTP real (Gmail, SendGrid, etc.)

```env
# En .env del microservicio
DEMO_MODE=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=app_password_generada_por_gmail
```

### 2. Agregar autenticación

```typescript
// En notify.routes.ts
router.post('/email', authenticateMicroservice, async (req, res) => {
  // Verificar que la llamada viene del backend principal
});
```

### 3. Agregar cola de mensajería (Optativo)

Para mayor resiliencia, usar Redis + Bull:

```typescript
import Bull from 'bull';
const emailQueue = new Bull('emails');

// Si falla, la cola reintentar después
emailQueue.process(async (job) => {
  await sendEmail(job.data);
});
```

---

## 📞 Resolución de Problemas

### Problema: "ECONNREFUSED localhost:3001"
**Solución**: Asegúrate que el microservicio está corriendo en otra terminal

### Problema: Email no se recibe
**Solución**: 
- Si `DEMO_MODE=true`, los emails van a Ethereal (check el preview URL)
- Si `DEMO_MODE=false`, valida credenciales SMTP

### Problema: Lentitud en registro
**Solución**: Es normal un pequeño retraso el primer envío. Los reintentos usan backoff exponencial.

---

## 🎓 Diagrama Final

```
┌─────────────────────────────────────────────────────┐
│         CLIENTE (Navegador)                         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP POST /auth/register
                       ▼
┌─────────────────────────────────────────────────────┐
│     BACKEND PRINCIPAL (Express + TypeScript)        │
│  ┌─────────────────────────────────────────────┐   │
│  │  auth.controller.ts                         │   │
│  │  ├─ Valida datos                            │   │
│  │  ├─ service.register(...)                   │   │
│  │  └─ notificationClient.sendWelcome()        │   │
│  └────────────────┬────────────────────────────┘   │
│                   │ (Asíncrono, no bloquea)        │
│                   │ HTTP POST /notify/welcome       │
│                   ▼                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  utils/notification.client.ts               │   │
│  │  ├─ Reintenta 3 veces                       │   │
│  │  ├─ Backoff exponencial                     │   │
│  │  └─ Registra errores silenciosamente        │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP POST
                       ▼
┌─────────────────────────────────────────────────────┐
│  NOTIFICATIONS MICROSERVICE (Express + TypeScript)  │
│  ┌─────────────────────────────────────────────┐   │
│  │  POST /notify/welcome                       │   │
│  │  ├─ Valida email                            │   │
│  │  ├─ Carga template                          │   │
│  │  └─ Envía con Nodemailer                    │   │
│  └────────────────┬────────────────────────────┘   │
│                   │ SMTP                           │
│                   ▼                                 │
│           [Email Service]                          │
│           (Gmail/Ethereal/Etc)                     │
└─────────────────────────────────────────────────────┘
```

---

¡Todo listo! 🎉 El microservicio está completamente integrado.
