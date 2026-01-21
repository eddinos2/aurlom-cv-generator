import { Router, Request, Response } from 'express';
import { documentModel } from '../../index';
import { authenticateToken } from '../middleware/auth';
import { generateDocuSealDocument } from '../../api/documents/docuseal';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();

// POST /api/documents/generate - Générer un document DocuSeal
router.post('/generate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      candidate_id: z.number(),
      document_type: z.string(),
      template_id: z.string().optional(),
    });

    const { candidate_id, document_type, template_id } = schema.parse(req.body);

    // Générer le document via DocuSeal
    const docuSealDoc = await generateDocuSealDocument({
      candidateId: candidate_id,
      documentType: document_type,
      templateId: template_id,
    });

    // Enregistrer dans la base de données
    const document = await documentModel.create({
      candidate_id,
      docuseal_document_id: docuSealDoc.id,
      docuseal_submitter_id: docuSealDoc.submitter_id || null,
      document_type,
      template_id: template_id || null,
      status: 'sent',
      file_url: docuSealDoc.file_url || null,
    });

    res.status(201).json({
      success: true,
      data: document,
      docuSeal: docuSealDoc,
      message: 'Document generated and sent successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error generating document', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate document',
    });
  }
});

// GET /api/documents/candidate/:candidateId - Liste des documents d'un candidat
router.get('/candidate/:candidateId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.candidateId, 10);
    if (isNaN(candidateId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid candidate ID',
      });
    }

    const documents = await documentModel.findByCandidateId(candidateId);

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error: any) {
    logger.error('Error fetching documents', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
    });
  }
});

// GET /api/documents/:id - Détails d'un document
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document ID',
      });
    }

    const document = await documentModel.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    logger.error('Error fetching document', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document',
    });
  }
});

export default router;
