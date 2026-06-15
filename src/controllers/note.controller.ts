// src/controllers/note.controller.ts
import { Request, Response, NextFunction } from 'express';
import { NoteService } from '../services/note.service';

const service = new NoteService();

export const uploadNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No se adjuntó ningún archivo' });
      return;
    }
    const { title, description, subjectId } = req.body;
    if (!title || !subjectId) {
      res.status(400).json({ message: 'Título y materia son requeridos' });
      return;
    }
    const result = await service.upload({
      title,
      description,
      subjectId: parseInt(subjectId),
      uploaderId: req.user!.userId,
      file: req.file,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const listNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId, semester, careerId, search } = req.query;
    const notes = await service.list({
      subjectId: subjectId ? parseInt(subjectId as string) : undefined,
      semester:  semester  ? parseInt(semester  as string) : undefined,
      careerId:  careerId  ? parseInt(careerId  as string) : undefined,
      search:    search    ? (search as string)            : undefined,
    });
    res.json(notes);
  } catch (err) { next(err); }
};

export const downloadNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { filePath, originalName, mimetype } = await service.getFilePath(parseInt(id));
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', mimetype);
    res.sendFile(filePath, { root: '.' });
  } catch (err) { next(err); }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.delete(
      parseInt(req.params.id),
      req.user!.userId,
      req.user!.role
    );
    res.json(result);
  } catch (err) { next(err); }
};

export const listSubjects = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await service.getSubjects();
    res.json(subjects);
  } catch (err) { next(err); }
};
