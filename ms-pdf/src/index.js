const express = require('express');
const cors = require('cors');
const { generatePDF } = require('./pdfGenerator');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Endpoint de prueba de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'MS-PDF' });
});

// Endpoint principal para generar PDFs
app.post('/generate', (req, res) => {
  const data = req.body;
  
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Datos no proporcionados para generar el PDF' });
  }

  generatePDF(
    data,
    (pdfBuffer) => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte.pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    },
    (error) => {
      res.status(500).json({ error: 'Error interno al generar el PDF' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`🚀 MS-PDF (Microservicio de PDFs) corriendo en el puerto ${PORT}`);
});
