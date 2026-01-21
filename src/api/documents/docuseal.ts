import { DocuSealDocumentGenerator, DocuSealDocumentRequest } from '../../../integrations/docuseal/document-generator';
import { candidateModel } from '../../index';
import { logger } from '../../utils/logger';

const documentGenerator = new DocuSealDocumentGenerator();

/**
 * Générer un document DocuSeal pour un candidat
 */
export async function generateDocuSealDocument(options: {
  candidateId: number;
  documentType: string;
  templateId?: string;
  fields?: Record<string, any>;
}): Promise<any> {
  try {
    // Récupérer le candidat
    const candidate = await candidateModel.findById(options.candidateId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Déterminer le template ID si non fourni
    let templateId = options.templateId;
    if (!templateId) {
      // Utiliser le template par défaut selon le type de document
      templateId = getDefaultTemplateId(options.documentType);
    }

    if (!templateId) {
      throw new Error(`No template ID provided for document type: ${options.documentType}`);
    }

    // Préparer la requête
    const request: DocuSealDocumentRequest = {
      templateId,
      candidate,
      fields: options.fields || {},
      submitterEmail: candidate.email,
      submitterName: `${candidate.first_name} ${candidate.last_name}`,
    };

    // Générer le document
    const docuSealDoc = await documentGenerator.generateDocument(request);

    logger.info('DocuSeal document generated', {
      candidateId: candidate.id,
      documentId: docuSealDoc.id,
      documentType: options.documentType,
    });

    return docuSealDoc;
  } catch (error: any) {
    logger.error('Error generating DocuSeal document', {
      error: error.message,
      candidateId: options.candidateId,
    });
    throw error;
  }
}

/**
 * Obtenir le template ID par défaut selon le type de document
 */
function getDefaultTemplateId(documentType: string): string | undefined {
  // Ces IDs doivent être configurés dans les variables d'environnement
  const templateMap: Record<string, string> = {
    'contrat_alternance': process.env.DOCUSEAL_TEMPLATE_CONTRAT_ALTERNANCE || '',
    'dossier_admission': process.env.DOCUSEAL_TEMPLATE_DOSSIER_ADMISSION || '',
    'convention_stage': process.env.DOCUSEAL_TEMPLATE_CONVENTION_STAGE || '',
  };

  return templateMap[documentType];
}
