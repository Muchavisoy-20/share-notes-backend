// src/utils/microservicesClient.ts
// Cliente centralizado para comunicación backend-to-backend con los microservicios.
// Implementa timeouts y manejo de errores para que el backend principal
// no se bloquee si un microservicio está caído.

const MS_PDF_URL = process.env.MS_PDF_URL || 'http://localhost:4001';
const MS_EMAIL_URL = process.env.MS_EMAIL_URL || 'http://localhost:4002';
const MS_TIMEOUT = parseInt(process.env.MS_TIMEOUT || '10000'); // 10 segundos por defecto

/**
 * Wrapper de fetch con timeout incorporado.
 * Si el microservicio no responde dentro del tiempo límite, se aborta la petición.
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─────────────────────────────────────────────────────────
// MS-PDF: Generación de reportes PDF
// ─────────────────────────────────────────────────────────

interface PdfRequestData {
  username: string;
  notes: Array<{
    title: string;
    subject: string;
    createdAt: string | Date;
  }>;
}

/**
 * Solicita al microservicio MS-PDF la generación de un reporte.
 * Retorna el Buffer del PDF o null si el servicio no está disponible.
 */
export async function generatePdfReport(data: PdfRequestData): Promise<Buffer | null> {
  try {
    console.log(`[MS-Client] Solicitando PDF a ${MS_PDF_URL}/generate ...`);

    const response = await fetchWithTimeout(`${MS_PDF_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, MS_TIMEOUT);

    if (!response.ok) {
      console.error(`[MS-Client] MS-PDF respondió con estado ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`[MS-Client] PDF generado exitosamente (${arrayBuffer.byteLength} bytes)`);
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[MS-Client] ⏰ Timeout: MS-PDF no respondió en ${MS_TIMEOUT}ms`);
    } else {
      console.error(`[MS-Client] ❌ MS-PDF no disponible: ${error.message}`);
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// MS-Email: Notificaciones por correo
// ─────────────────────────────────────────────────────────

interface EmailNotificationData {
  to: string;
  uploaderName: string;
  noteTitle: string;
  subjectName?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
}

/**
 * Solicita al microservicio MS-Email que envíe una notificación.
 * Retorna el resultado o un objeto con success=false si falla.
 * IMPORTANTE: Esta función NO lanza excepciones — el flujo principal
 * del backend continúa aunque el email no se envíe.
 */
export async function sendEmailNotification(data: EmailNotificationData): Promise<EmailResult> {
  try {
    console.log(`[MS-Client] Solicitando envío de email a ${MS_EMAIL_URL}/notify ...`);

    const response = await fetchWithTimeout(`${MS_EMAIL_URL}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, MS_TIMEOUT);

    if (!response.ok) {
      console.error(`[MS-Client] MS-Email respondió con estado ${response.status}`);
      return { success: false };
    }

    const result = await response.json() as any;
    console.log(`[MS-Client] ✅ Email enviado: ${result.messageId}`);
    if (result.previewUrl) {
      console.log(`[MS-Client] 🔗 Preview: ${result.previewUrl}`);
    }

    return {
      success: true,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[MS-Client] ⏰ Timeout: MS-Email no respondió en ${MS_TIMEOUT}ms`);
    } else {
      console.error(`[MS-Client] ❌ MS-Email no disponible: ${error.message}`);
    }
    return { success: false };
  }
}

// ─────────────────────────────────────────────────────────
// Health Checks
// ─────────────────────────────────────────────────────────

export async function checkMicroservicesHealth(): Promise<{
  msPdf: boolean;
  msEmail: boolean;
}> {
  const checkHealth = async (url: string): Promise<boolean> => {
    try {
      const res = await fetchWithTimeout(`${url}/health`, { method: 'GET' }, 3000);
      return res.ok;
    } catch {
      return false;
    }
  };

  const [msPdf, msEmail] = await Promise.all([
    checkHealth(MS_PDF_URL),
    checkHealth(MS_EMAIL_URL),
  ]);

  return { msPdf, msEmail };
}
