// d:\share-notes-backend-main\src\utils\notification.client.ts
import axios, { AxiosInstance } from 'axios';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001';

interface SendNotificationOptions {
  maxRetries?: number;
  timeout?: number;
}

export class NotificationClient {
  private client: AxiosInstance;
  private maxRetries = 3;
  private timeout = 5000;

  constructor(options?: SendNotificationOptions) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.timeout = options?.timeout ?? 5000;

    this.client = axios.create({
      baseURL: NOTIFICATION_SERVICE_URL,
      timeout: this.timeout,
    });
  }

  /**
   * Reintenta una llamada al microservicio
   */
  private async retryRequest(fn: () => Promise<any>, retries = 0): Promise<any> {
    try {
      return await fn();
    } catch (error) {
      if (retries < this.maxRetries) {
        console.warn(`⚠️ Reintentando notificación (${retries + 1}/${this.maxRetries})...`);
        // Esperar un poco antes de reintentar (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        return this.retryRequest(fn, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Enviar notificación de bienvenida
   */
  async sendWelcome(email: string, name: string): Promise<boolean> {
    try {
      await this.retryRequest(() =>
        this.client.post('/notify/welcome', { email, name })
      );
      console.log(`✅ Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error);
      // No lanzar error - el registro debe completarse aunque falle el email
      return false;
    }
  }

  /**
   * Enviar notificación de respuesta en foro
   */
  async sendForumReply(
    email: string,
    threadTitle: string,
    authorName: string,
    reply: string,
    link: string
  ): Promise<boolean> {
    try {
      await this.retryRequest(() =>
        this.client.post('/notify/forum-reply', {
          email,
          threadTitle,
          authorName,
          reply,
          link,
        })
      );
      console.log(`✅ Forum reply notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send forum reply notification to ${email}:`, error);
      return false;
    }
  }

  /**
   * Enviar notificación de nota compartida
   */
  async sendNoteShared(
    email: string,
    senderName: string,
    noteName: string,
    message: string,
    link: string
  ): Promise<boolean> {
    try {
      await this.retryRequest(() =>
        this.client.post('/notify/note-shared', {
          email,
          senderName,
          noteName,
          message,
          link,
        })
      );
      console.log(`✅ Note shared notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send note shared notification to ${email}:`, error);
      return false;
    }
  }

  /**
   * Health check del microservicio
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/notify/health', { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      console.warn('⚠️ Notification service is not available');
      return false;
    }
  }
}

// Instancia singleton
export const notificationClient = new NotificationClient();
