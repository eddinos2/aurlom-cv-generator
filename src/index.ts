import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { join } from 'path';
import { Database } from '../backend/db/schema';
import { databaseConfig, serverConfig } from '../config/integrations';
import { CandidateModel } from '../backend/db/models/candidate';
import { DocumentModel } from '../backend/db/models/document';
import candidatesRouter from './api/routes/candidates';
import webhooksRouter from './api/routes/webhooks';
import documentsRouter from './api/routes/documents';
import cvRouter from './api/routes/cv';
import { logger } from './utils/logger';

const app: Express = express();
// Initialiser la DB de manière lazy pour éviter les blocages au démarrage
let db: Database | null = null;

function getDatabase(): Database {
  if (!db) {
    db = new Database(databaseConfig.url);
  }
  return db;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (frontend, data, templates)
app.use('/frontend', express.static(join(process.cwd(), 'frontend')));
app.use('/data', express.static(join(process.cwd(), 'data')));
app.use('/templates', express.static(join(process.cwd(), 'templates')));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    const database = getDatabase();
    const dbConnected = await database.testConnection();
    res.status(200).json({
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      cvGenerator: 'available',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(200).json({
      status: 'healthy',
      database: 'disconnected',
      cvGenerator: 'available',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/candidates', candidatesRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/cv', cvRouter);

// Route pour servir l'interface de génération de CV
app.get('/cv-generator', (req: Request, res: Response) => {
  res.sendFile(join(process.cwd(), 'frontend/cv-generator.html'));
});

// Sync status endpoint
app.get('/api/sync/status', async (req: Request, res: Response) => {
  try {
    const database = getDatabase();
    const pool = database.getPool();
    const result = await pool.query(`
      SELECT 
        sync_type,
        direction,
        status,
        COUNT(*) as count
      FROM sync_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY sync_type, direction, status
      ORDER BY sync_type, direction, status
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error fetching sync status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync status',
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: serverConfig.nodeEnv === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Initialize database and start server
async function start() {
  // Démarrer le serveur immédiatement (sans attendre la DB)
  app.listen(serverConfig.port, () => {
    logger.info(`🚀 Server running on port ${serverConfig.port}`);
    logger.info(`Environment: ${serverConfig.nodeEnv}`);
    logger.info(`API Base URL: ${serverConfig.apiBaseUrl}`);
    logger.info(`📄 CV Generator UI: http://localhost:${serverConfig.port}/cv-generator`);
    logger.info(`💚 Health check: http://localhost:${serverConfig.port}/health`);
  });

  // Essayer de se connecter à la DB en arrière-plan (non bloquant)
  setTimeout(async () => {
    try {
      const database = getDatabase();
      const connected = await database.testConnection();
      if (!connected) {
        logger.warn('⚠️  Database not connected - CV generator will still work');
      } else {
        logger.info('✅ Database connected successfully');
        // Run migrations only if DB is connected
        try {
          await database.runMigrations();
          logger.info('✅ Migrations completed');
        } catch (migrationError: any) {
          logger.warn('⚠️  Migration error (continuing anyway):', migrationError.message);
        }
      }
    } catch (error: any) {
      logger.warn('⚠️  Database connection failed (continuing without DB):', error.message);
    }
  }, 100);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (db) {
    await db.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (db) {
    await db.close();
  }
  process.exit(0);
});

start();

// Export db instance for use in routes (lazy initialization)
export { getDatabase as getDb };

// Modèles lazy pour éviter les erreurs si DB n'est pas disponible
let _candidateModel: CandidateModel | null = null;
let _documentModel: DocumentModel | null = null;

export function getCandidateModel(): CandidateModel {
  if (!_candidateModel) {
    _candidateModel = new CandidateModel(getDatabase().getPool());
  }
  return _candidateModel;
}

export function getDocumentModel(): DocumentModel {
  if (!_documentModel) {
    _documentModel = new DocumentModel(getDatabase().getPool());
  }
  return _documentModel;
}

// Exports pour compatibilité
export const candidateModel = {
  get findAll() { return getCandidateModel().findAll.bind(getCandidateModel()); },
  get findById() { return getCandidateModel().findById.bind(getCandidateModel()); },
  get create() { return getCandidateModel().create.bind(getCandidateModel()); },
  get update() { return getCandidateModel().update.bind(getCandidateModel()); },
  get updateStatus() { return getCandidateModel().updateStatus.bind(getCandidateModel()); },
  get getStatusHistory() { return getCandidateModel().getStatusHistory.bind(getCandidateModel()); },
};

export const documentModel = {
  get create() { return getDocumentModel().create.bind(getDocumentModel()); },
  get findById() { return getDocumentModel().findById.bind(getDocumentModel()); },
  get findByCandidateId() { return getDocumentModel().findByCandidateId.bind(getDocumentModel()); },
  get update() { return getDocumentModel().update.bind(getDocumentModel()); },
  get updateStatus() { return getDocumentModel().updateStatus.bind(getDocumentModel()); },
};
