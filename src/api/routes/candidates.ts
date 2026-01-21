import { Router, Request, Response } from 'express';
import { candidateModel } from '../../index';
import { CandidateSchema } from '../../backend/db/models/candidate';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();

// GET /api/candidates - Liste des candidats
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      campus: req.query.campus as string | undefined,
      program: req.query.program as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };

    const candidates = await candidateModel.findAll(filters);

    res.json({
      success: true,
      data: candidates,
      count: candidates.length,
    });
  } catch (error: any) {
    logger.error('Error fetching candidates', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidates',
    });
  }
});

// GET /api/candidates/:id - Détails d'un candidat
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid candidate ID',
      });
    }

    const candidate = await candidateModel.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    // Récupérer l'historique des statuts
    const statusHistory = await candidateModel.getStatusHistory(id);

    res.json({
      success: true,
      data: {
        ...candidate,
        statusHistory,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching candidate', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidate',
    });
  }
});

// PUT /api/candidates/:id/status - Mettre à jour le statut
router.put('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid candidate ID',
      });
    }

    const updateSchema = z.object({
      status: z.string().min(1),
      notes: z.string().optional(),
    });

    const { status, notes } = updateSchema.parse(req.body);
    const changedBy = req.user?.email || 'system';
    const changeSource = 'dashboard';

    const candidate = await candidateModel.updateStatus(id, status, changedBy, changeSource, notes);

    res.json({
      success: true,
      data: candidate,
      message: 'Status updated successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error updating candidate status', { 
      error: error.message, 
      id: req.params.id 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update candidate status',
    });
  }
});

// POST /api/candidates - Créer un candidat
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const candidateData = CandidateSchema.parse(req.body);
    const candidate = await candidateModel.create(candidateData);

    res.status(201).json({
      success: true,
      data: candidate,
      message: 'Candidate created successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error creating candidate', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create candidate',
    });
  }
});

// PUT /api/candidates/:id - Mettre à jour un candidat
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid candidate ID',
      });
    }

    const updates = req.body;
    const candidate = await candidateModel.update(id, updates);

    res.json({
      success: true,
      data: candidate,
      message: 'Candidate updated successfully',
    });
  } catch (error: any) {
    logger.error('Error updating candidate', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to update candidate',
    });
  }
});

export default router;
