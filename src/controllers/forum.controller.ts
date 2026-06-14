// src/controllers/forum.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ForumService } from '../services/forum.service';
import { notificationClient } from '../utils/notification.client';

const service = new ForumService();

export const createThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body, subjectId } = req.body;
    if (!title || !body || !subjectId) {
      res.status(400).json({ message: 'Título, cuerpo y materia son requeridos' });
      return;
    }
    const result = await service.createThread({
      title, body,
      subjectId: parseInt(subjectId),
      authorId: req.user!.userId,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const listThreads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.query;
    const threads = await service.listThreads(subjectId ? parseInt(subjectId as string) : undefined);
    res.json(threads);
  } catch (err) { next(err); }
};

export const getThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getThread(parseInt(req.params.id));
    res.json(data);
  } catch (err) { next(err); }
};

export const createReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req.body;
    if (!body) {
      res.status(400).json({ message: 'El cuerpo de la respuesta es requerido' });
      return;
    }
    const result = await service.createReply({
      body,
      threadId: parseInt(req.params.id),
      authorId: req.user!.userId,
    });

    // Enviar notificación del foro de forma asíncrona
    try {
      const threadData = await service.getThread(parseInt(req.params.id));
      if (threadData && threadData.thread) {
        const thread = threadData.thread as any;
        const authorName = (req.user as any)?.name || 'Un usuario';
        if (thread.authorId) {
          // Aquí simplemente registramos la notificación sin los detalles del autor
          // En producción, obtendrías el email del autor desde la BD
          notificationClient.sendForumReply(
            'admin@sharenotes.com', // Placeholder - implementar según BD
            thread.title || 'Sin título',
            authorName,
            body.substring(0, 100),
            `${process.env.APP_URL || 'http://localhost:3000'}/forum/${parseInt(req.params.id)}`
          ).catch(err => {
            console.error('Failed to send forum reply notification:', err);
          });
        }
      }
    } catch (notificationErr) {
      console.error('Error sending forum notification:', notificationErr);
    }

    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const reportContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) {
      res.status(400).json({ message: 'targetType, targetId y reason son requeridos' });
      return;
    }
    const result = await service.report({
      reporterId: req.user!.userId,
      targetType,
      targetId: parseInt(targetId),
      reason,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};
