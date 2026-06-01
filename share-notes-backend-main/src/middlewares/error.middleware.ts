// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Errores de multer (subida de archivos)
  if (err.name === 'MulterError') {
    res.status(400).json({ message: `Error de archivo: ${err.message}` });
    return;
  }

  console.error('❌  Error no controlado:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
}
