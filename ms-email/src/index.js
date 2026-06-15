require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendNoteNotification } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

// Endpoint de prueba de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'MS-Email' });
});

// Endpoint principal para enviar notificación de nuevo apunte
app.post('/notify', async (req, res) => {
  const { to, uploaderName, noteTitle, subjectName } = req.body;

  // Validar datos requeridos
  if (!to || !noteTitle) {
    return res.status(400).json({
      error: 'Campos requeridos: "to" (email destino) y "noteTitle"',
    });
  }

  try {
    const result = await sendNoteNotification({
      to,
      uploaderName: uploaderName || 'Un compañero',
      noteTitle,
      subjectName: subjectName || 'Sin especificar',
    });

    console.log(`✅ Email enviado a ${to} | MessageID: ${result.messageId}`);
    if (result.previewUrl) {
      console.log(`   🔗 Preview: ${result.previewUrl}`);
    }

    res.status(200).json({
      message: 'Notificación enviada exitosamente',
      ...result,
    });
  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    res.status(500).json({ error: 'Error interno al enviar la notificación' });
  }
});

app.listen(PORT, () => {
  console.log(`📧 MS-Email (Microservicio de Notificaciones) corriendo en el puerto ${PORT}`);
});
