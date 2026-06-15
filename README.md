# 📚 ShareNotes — Backend & Microservicios

![CI Status](https://img.shields.io/github/actions/workflow/status/Muchavisoy-20/share-notes-backend/ci.yml?branch=main&label=CI%20Tests)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)

**ShareNotes** es una plataforma de apuntes universitarios. Este repositorio funciona como un **Monorepo** que contiene la API principal y sus microservicios asociados, desarrollados para la asignatura de Proyecto de Software II.

---

## 🏛️ Arquitectura del Sistema

El proyecto está dividido en tres componentes principales que se comunican a través de HTTP:

1. **`backend/` (API Principal)**
   - Orquesta la lógica de negocio, autenticación (JWT), roles, foro y base de datos (MySQL).
   - Desarrollado en TypeScript + Express.
   - Puerto por defecto: `3000`

2. **`ms-pdf/` (Microservicio de Reportes)**
   - Se encarga exclusivamente de la generación de documentos PDF (con `pdfkit`).
   - Desarrollado en JavaScript puro + Express.
   - Puerto por defecto: `4001`

3. **`ms-email/` (Microservicio de Notificaciones)**
   - Gestiona el envío de correos electrónicos transaccionales asíncronos (con `nodemailer`).
   - Soporta servidores SMTP reales y modo de pruebas con Ethereal.
   - Puerto por defecto: `4002`

---

## 🚀 Cómo ejecutar localmente

### 1. Requisitos Previos
- Node.js v20 o superior
- MySQL Server corriendo en el puerto `3306`

### 2. Base de Datos
En la carpeta `backend`, asegúrate de tener tu archivo `.env` configurado. Luego ejecuta:
```bash
cd backend
npm run db:migrate
```

### 3. Iniciar los servicios (requiere 3 terminales)

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Microservicio PDF):**
```bash
cd ms-pdf
npm install
npm start
```

**Terminal 3 (Microservicio Email):**
```bash
cd ms-email
npm install
npm start
```

---

## 🧪 Pruebas y Calidad (CI)

Este proyecto cuenta con **44 pruebas unitarias** desarrolladas en Jest que validan reglas de negocio, modelos, controladores y servicios.

Las pruebas se ejecutan automáticamente en la nube a través de **GitHub Actions** cada vez que se sube nuevo código al branch `main`.

Para correr las pruebas localmente:
```bash
cd backend
npm test
```

---

## 📖 Documentación Interactiva
Con el backend corriendo, puedes probar la API y ver todos los endpoints accediendo a la documentación autogenerada con Swagger UI:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**
