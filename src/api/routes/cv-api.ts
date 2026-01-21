import { Router, Request, Response } from 'express';
import { CVGenerator } from '../../cv/generator';
import { CVSchema } from '../../cv/types';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();
const cvGenerator = new CVGenerator();

// Cache simple en mémoire pour éviter les régénérations identiques
const cache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum 50 CVs en cache

/**
 * Nettoie le cache des entrées expirées
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
  
  // Si le cache est trop grand, supprimer les plus anciens
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => cache.delete(key));
  }
}

// Nettoyer le cache toutes les 5 minutes
setInterval(cleanCache, 5 * 60 * 1000);

/**
 * Génère une clé de cache à partir des données du CV
 */
function generateCacheKey(cvData: any, templateName: string): string {
  const keyData = {
    firstName: cvData.personalInfo?.firstName,
    lastName: cvData.personalInfo?.lastName,
    email: cvData.personalInfo?.email,
    template: templateName,
    // Hash simple des données principales
    hash: JSON.stringify({
      experience: cvData.experience?.length || 0,
      education: cvData.education?.length || 0,
      skills: cvData.skills?.length || 0,
    }),
  };
  return Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 100);
}

/**
 * POST /api/cv/pdf
 * API optimisée pour générer un CV en PDF à partir d'un JSON
 * 
 * Body:
 * {
 *   "cvData": { ... }, // Données du CV (voir docs/JSON_EXAMPLES.md)
 *   "templateName": "montemplate-v2" // Optionnel, défaut: "montemplate-v2"
 * }
 * 
 * Response: PDF file (application/pdf)
 */
router.post('/pdf', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Validation du schéma
    const schema = z.object({
      cvData: CVSchema,
      templateName: z.string().default('montemplate-v2'),
    });

    const { cvData, templateName } = schema.parse(req.body);

    // Vérifier le cache
    const cacheKey = generateCacheKey(cvData, templateName);
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info('CV served from cache', { 
        firstName: cvData.personalInfo.firstName,
        lastName: cvData.personalInfo.lastName 
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 
        `attachment; filename="cv-${cvData.personalInfo.firstName}-${cvData.personalInfo.lastName}.pdf"`);
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Generation-Time', `${Date.now() - startTime}ms`);
      return res.send(cached.buffer);
    }

    // Générer le PDF
    logger.info('Generating CV PDF', { 
      firstName: cvData.personalInfo.firstName,
      lastName: cvData.personalInfo.lastName,
      template: templateName 
    });

    const pdfBuffer = await cvGenerator.generate({
      cvData,
      templateName,
      outputFormat: 'pdf',
    }) as Buffer;

    // Mettre en cache
    cache.set(cacheKey, {
      buffer: pdfBuffer,
      timestamp: Date.now(),
    });

    const generationTime = Date.now() - startTime;
    logger.info('CV PDF generated successfully', { 
      firstName: cvData.personalInfo.firstName,
      lastName: cvData.personalInfo.lastName,
      size: `${(pdfBuffer.length / 1024).toFixed(2)}KB`,
      time: `${generationTime}ms`
    });

    // Headers optimisés
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="cv-${cvData.personalInfo.firstName}-${cvData.personalInfo.lastName}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Generation-Time', `${generationTime}ms`);
    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes
    
    res.send(pdfBuffer);

  } catch (error: any) {
    const generationTime = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logger.warn('CV generation validation error', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        time: `${generationTime}ms`,
      });
    }

    logger.error('Error generating CV PDF', { 
      error: error.message,
      stack: error.stack,
      time: `${generationTime}ms`
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate CV PDF',
      message: error.message,
      time: `${generationTime}ms`,
    });
  }
});

/**
 * GET /api/cv/pdf/health
 * Vérifie l'état de l'API et du cache
 */
router.get('/pdf/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cache: {
      size: cache.size,
      maxSize: MAX_CACHE_SIZE,
      ttl: CACHE_TTL / 1000, // en secondes
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/cv/pdf/clear-cache
 * Vide le cache (utile pour le développement)
 */
router.post('/pdf/clear-cache', (req: Request, res: Response) => {
  const sizeBefore = cache.size;
  cache.clear();
  res.json({
    success: true,
    message: 'Cache cleared',
    cleared: sizeBefore,
  });
});

export default router;
