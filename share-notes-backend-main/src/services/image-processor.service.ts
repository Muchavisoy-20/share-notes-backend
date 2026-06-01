// src/services/image-processor.service.ts
//
// Comunica el backend principal con el microservicio de procesamiento de imágenes.
// El frontend NUNCA llama directamente al microservicio; siempre pasa por aquí.

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const MICROSERVICE_URL = process.env.IMAGE_MICROSERVICE_URL || 'http://localhost:8001';
const TIMEOUT_MS       = 15_000; // 15 segundos máximo de espera

export class ImageProcessorService {

  /**
   * Envía una imagen al microservicio de Python para que la procese
   * (redimensionar + marca de agua + comprimir).
   *
   * @param filePath  Ruta local del archivo original subido por Multer
   * @param mimetype  MIME type original (image/jpeg o image/png)
   * @returns         Buffer con la imagen procesada en JPEG
   */
  async processImage(filePath: string, mimetype: string): Promise<Buffer> {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      contentType: mimetype,
      filename: 'upload.jpg',
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${MICROSERVICE_URL}/process-image`, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Microservicio respondió ${response.status}: ${error}`);
      }

      const buffer = await response.buffer();
      return buffer;

    } catch (err: any) {
      // Si el microservicio no responde, lanzamos error descriptivo
      if (err.name === 'AbortError') {
        throw new Error('El microservicio de imágenes no respondió a tiempo (timeout).');
      }
      throw new Error(`Error al contactar el microservicio de imágenes: ${err.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Verifica si el microservicio está disponible.
   * Útil para el health-check del backend principal.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${MICROSERVICE_URL}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
