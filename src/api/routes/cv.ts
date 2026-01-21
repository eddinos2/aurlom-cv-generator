import { Router, Request, Response } from 'express';
import { CVGenerator } from '../../cv/generator';
import { CVSchema } from '../../cv/types';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();
const cvGenerator = new CVGenerator();

// Middleware d'authentification optionnel pour les tests
import { NextFunction } from 'express';

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Si pas de token, on continue quand même (pour les tests)
  // En production, vous pouvez forcer l'authentification
  if (req.headers.authorization) {
    return authenticateToken(req, res, next);
  }
  next();
};

// POST /api/cv/generate - Générer un CV
router.post('/generate', optionalAuth, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      cvData: CVSchema,
      templateName: z.string().default('modern'),
      outputFormat: z.enum(['pdf', 'html']).default('pdf'),
    });

    const { cvData, templateName, outputFormat } = schema.parse(req.body);

    // Générer le CV
    const result = await cvGenerator.generate({
      cvData,
      templateName,
      outputFormat,
    });

    if (outputFormat === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="cv-${cvData.personalInfo.firstName}-${cvData.personalInfo.lastName}.pdf"`);
      res.send(result);
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.send(result);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error generating CV', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate CV',
      message: error.message,
    });
  }
});

// GET /api/cv/templates - Liste des templates disponibles
router.get('/templates', optionalAuth, async (req: Request, res: Response) => {
  try {
    const templates = await cvGenerator.listTemplates();
    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    logger.error('Error listing templates', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list templates',
    });
  }
});

// POST /api/cv/preview - Prévisualiser un CV (retourne HTML)
router.post('/preview', optionalAuth, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      cvData: CVSchema,
      templateName: z.string().default('modern'),
    });

    const { cvData, templateName } = schema.parse(req.body);

    // Générer le HTML
    const html = await cvGenerator.generate({
      cvData,
      templateName,
      outputFormat: 'html',
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error previewing CV', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to preview CV',
      message: error.message,
    });
  }
});

export default router;
