// src/services/note.service.ts  ← versión actualizada con microservicio de imágenes
import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';
import fs from 'fs';
import path from 'path';
import { ImageProcessorService } from './image-processor.service';

interface NoteRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  filename: string;
  original_name: string;
  mimetype: string;
  file_size: number;
  subject_id: number;
  subject_name: string;
  semester: number;
  career_name: string;
  uploader_id: number;
  uploader_name: string;
  is_active: boolean;
  created_at: Date;
}

const IMAGE_MIMETYPES = new Set(['image/jpeg', 'image/png']);
const imageProcessor  = new ImageProcessorService();

export class NoteService {

  async upload(data: {
    title: string;
    description?: string;
    subjectId: number;
    uploaderId: number;
    file: Express.Multer.File;
  }) {
    // Verificar que la materia existe
    const [subj] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM subjects WHERE id = ?',
      [data.subjectId]
    );
    if (!subj[0]) throw new AppError(404, 'Materia no encontrada');

    let finalFilename = data.file.filename;
    let finalMimetype = data.file.mimetype;
    let finalSize     = data.file.size;

    // ── Si es imagen, enviarla al microservicio para procesarla ──────────────
    if (IMAGE_MIMETYPES.has(data.file.mimetype)) {
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      const originalPath = path.join(uploadDir, data.file.filename);

      try {
        const processedBuffer = await imageProcessor.processImage(
          originalPath,
          data.file.mimetype
        );

        // Guardar la imagen procesada, reemplazando la original
        // (el nombre ya tiene UUID, solo cambiamos extensión a .jpg)
        const processedFilename = data.file.filename.replace(/\.[^.]+$/, '') + '_processed.jpg';
        const processedPath     = path.join(uploadDir, processedFilename);

        fs.writeFileSync(processedPath, processedBuffer);

        // Eliminar el archivo original para ahorrar espacio
        fs.unlinkSync(originalPath);

        finalFilename = processedFilename;
        finalMimetype = 'image/jpeg';
        finalSize     = processedBuffer.length;

      } catch (err: any) {
        // ── Manejo de errores: si el microservicio falla, guardamos la imagen original ──
        console.error('[NoteService] Microservicio de imágenes no disponible:', err.message);
        console.warn('[NoteService] Guardando imagen original sin procesar como fallback.');
        // finalFilename, finalMimetype y finalSize ya tienen los valores originales
      }
    }
    // ── PDFs pasan directo, sin tocar ────────────────────────────────────────

    await pool.query(
      `INSERT INTO notes (title, description, filename, original_name, mimetype, file_size, subject_id, uploader_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description || null,
        finalFilename,
        data.file.originalname,
        finalMimetype,
        finalSize,
        data.subjectId,
        data.uploaderId,
      ]
    );

    return { message: 'Apunte subido correctamente' };
  }

  // ── Los demás métodos no cambian ──────────────────────────────────────────

  async list(filters: { subjectId?: number; semester?: number; careerId?: number; search?: string }) {
    let query = `
      SELECT n.id, n.title, n.description, n.original_name, n.mimetype,
             n.file_size, n.created_at,
             s.name AS subject_name, s.semester,
             c.name AS career_name,
             u.name AS uploader_name
      FROM notes n
      JOIN subjects s ON n.subject_id = s.id
      JOIN careers  c ON s.career_id  = c.id
      JOIN users    u ON n.uploader_id = u.id
      WHERE n.is_active = TRUE
    `;
    const params: (string | number)[] = [];

    if (filters.subjectId) { query += ' AND n.subject_id = ?'; params.push(filters.subjectId); }
    if (filters.semester)  { query += ' AND s.semester = ?';   params.push(filters.semester);  }
    if (filters.careerId)  { query += ' AND s.career_id = ?';  params.push(filters.careerId);  }
    if (filters.search) {
      query += ' AND (n.title LIKE ? OR n.description LIKE ?)';
      const like = `%${filters.search}%`;
      params.push(like, like);
    }

    query += ' ORDER BY n.created_at DESC';
    const [rows] = await pool.query<NoteRow[]>(query, params);
    return rows;
  }

  async getFilePath(noteId: number): Promise<{ filePath: string; originalName: string; mimetype: string }> {
    const [rows] = await pool.query<NoteRow[]>(
      'SELECT filename, original_name, mimetype FROM notes WHERE id = ? AND is_active = TRUE',
      [noteId]
    );
    const note = rows[0];
    if (!note) throw new AppError(404, 'Apunte no encontrado');

    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const filePath  = path.join(uploadDir, note.filename);

    if (!fs.existsSync(filePath)) throw new AppError(404, 'Archivo no disponible');

    return { filePath, originalName: note.original_name, mimetype: note.mimetype };
  }

  async delete(noteId: number, requesterId: number, requesterRole: string) {
    const [rows] = await pool.query<NoteRow[]>(
      'SELECT uploader_id FROM notes WHERE id = ? AND is_active = TRUE',
      [noteId]
    );
    const note = rows[0];
    if (!note) throw new AppError(404, 'Apunte no encontrado');

    if (requesterRole !== 'admin' && note.uploader_id !== requesterId) {
      throw new AppError(403, 'No tienes permiso para eliminar este apunte');
    }

    await pool.query('UPDATE notes SET is_active = FALSE WHERE id = ?', [noteId]);
    return { message: 'Apunte eliminado' };
  }

  async getSubjects() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.name, s.semester, c.name AS career_name
       FROM subjects s JOIN careers c ON s.career_id = c.id
       ORDER BY s.semester, s.name`
    );
    return rows;
  }
}
