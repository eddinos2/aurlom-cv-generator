import { documentModel } from '../../index';
import { candidateModel } from '../../index';
import { db } from '../../index';
import { syncCandidateToHubSpot } from '../sync/db-to-hubspot';
import { logger } from '../../utils/logger';

export async function docusealWebhookHandler(payload: any): Promise<void> {
  try {
    const event = payload.event; // document.completed, document.signed, etc.
    const documentId = payload.data?.id || payload.document_id;

    if (!documentId) {
      logger.warn('DocuSeal webhook missing document ID', { payload });
      return;
    }

    logger.info('Processing DocuSeal webhook', { event, documentId });

    // Récupérer le document depuis la base de données
    const document = await documentModel.findByDocuSealDocumentId(documentId);

    if (!document) {
      logger.warn('Document not found in database', { documentId });
      return;
    }

    // Traiter selon le type d'événement
    switch (event) {
      case 'document.viewed':
        await handleDocumentViewed(document.id!);
        break;

      case 'document.signed':
        await handleDocumentSigned(document.id!);
        break;

      case 'document.completed':
        await handleDocumentCompleted(document.id!);
        break;

      case 'document.declined':
        await handleDocumentDeclined(document.id!);
        break;

      default:
        logger.warn('Unhandled DocuSeal event', { event, documentId });
    }
  } catch (error: any) {
    logger.error('Error in DocuSeal webhook handler', { error: error.message });
    throw error;
  }
}

async function handleDocumentViewed(documentId: number): Promise<void> {
  await documentModel.updateStatus(documentId, 'viewed');
  logger.info('Document marked as viewed', { documentId });
}

async function handleDocumentSigned(documentId: number): Promise<void> {
  const document = await documentModel.findById(documentId);
  if (!document) return;

  await documentModel.updateStatus(documentId, 'signed', new Date());

  // Mettre à jour le statut du candidat
  const candidate = await candidateModel.findById(document.candidate_id);
  if (candidate) {
    await candidateModel.updateStatus(
      candidate.id!,
      'Contrat en cours',
      'docuseal',
      'docuseal',
      'Document signé'
    );
  }

  logger.info('Document marked as signed', { documentId });
}

async function handleDocumentCompleted(documentId: number): Promise<void> {
  const document = await documentModel.findById(documentId);
  if (!document) return;

  await documentModel.updateStatus(documentId, 'completed', undefined, new Date());

  // Mettre à jour le statut du candidat
  const candidate = await candidateModel.findById(document.candidate_id);
  if (candidate) {
    // Mettre à jour le statut à "Contrat signé"
    await candidateModel.updateStatus(
      candidate.id!,
      'Contrat signé',
      'docuseal',
      'docuseal',
      'Document complété et signé'
    );

    // Synchroniser avec HubSpot
    try {
      await syncCandidateToHubSpot(candidate.id!);
    } catch (error: any) {
      logger.error('Error syncing candidate to HubSpot after document completion', {
        error: error.message,
        candidateId: candidate.id,
      });
    }

    // Enregistrer le log
    await db.getPool().query(
      `INSERT INTO sync_logs (
        candidate_id, sync_type, direction, status, source_system, target_system, data_snapshot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        candidate.id,
        'docuseal_to_hubspot',
        'outbound',
        'success',
        'docuseal',
        'hubspot',
        JSON.stringify({ documentId, event: 'completed' }),
      ]
    );
  }

  logger.info('Document marked as completed', { documentId });
}

async function handleDocumentDeclined(documentId: number): Promise<void> {
  await documentModel.updateStatus(documentId, 'declined');
  
  const document = await documentModel.findById(documentId);
  if (document) {
    const candidate = await candidateModel.findById(document.candidate_id);
    if (candidate) {
      await candidateModel.updateStatus(
        candidate.id!,
        candidate.status, // Garder le statut actuel
        'docuseal',
        'docuseal',
        'Document refusé'
      );
    }
  }

  logger.info('Document marked as declined', { documentId });
}
