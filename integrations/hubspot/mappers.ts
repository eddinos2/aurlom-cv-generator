import { Candidate } from '../../backend/db/models/candidate';

/**
 * Mapping des données HubSpot vers le format Dashboard
 */
export function mapHubSpotToCandidate(hubspotContact: any, hubspotDeal?: any): Partial<Candidate> {
  const properties = hubspotContact.properties || {};

  return {
    hubspot_contact_id: hubspotContact.id,
    hubspot_deal_id: hubspotDeal?.id || null,
    first_name: properties.firstname || '',
    last_name: properties.lastname || '',
    email: properties.email || '',
    phone: properties.phone || null,
    program: properties.program || properties.admiss_program || null,
    source: properties.source || properties.admiss_source || null,
    campus: properties.campus || properties.admiss_campus || null,
    status: properties.admiss_flow_status || 'Nouveau',
    appointment_date: properties.appointment_date 
      ? new Date(properties.appointment_date) 
      : null,
  };
}

/**
 * Mapping des données Dashboard vers le format HubSpot
 */
export function mapCandidateToHubSpot(candidate: Candidate): {
  properties: Record<string, any>;
  dealProperties?: Record<string, any>;
} {
  const contactProperties: Record<string, any> = {
    email: candidate.email,
    firstname: candidate.first_name,
    lastname: candidate.last_name,
    phone: candidate.phone || '',
    admiss_flow_status: candidate.status,
  };

  if (candidate.program) {
    contactProperties.program = candidate.program;
    contactProperties.admiss_program = candidate.program;
  }

  if (candidate.source) {
    contactProperties.source = candidate.source;
    contactProperties.admiss_source = candidate.source;
  }

  if (candidate.campus) {
    contactProperties.campus = candidate.campus;
    contactProperties.admiss_campus = candidate.campus;
  }

  if (candidate.appointment_date) {
    contactProperties.appointment_date = candidate.appointment_date.toISOString();
  }

  const dealProperties: Record<string, any> = {
    dealname: `${candidate.first_name} ${candidate.last_name} - ${candidate.program || 'Admission'}`,
    pipeline: 'admission_pipeline',
    dealstage: mapStatusToDealStage(candidate.status),
    admiss_flow_status: candidate.status,
  };

  return {
    properties: contactProperties,
    dealProperties,
  };
}

/**
 * Mapping du statut vers le stage du Deal HubSpot
 */
function mapStatusToDealStage(status: string): string {
  const statusMap: Record<string, string> = {
    'Nouveau': 'appointmentscheduled',
    'Contacté': 'qualifiedtobuy',
    'RDV fixé': 'appointmentscheduled',
    'Admis': 'closedwon',
    'No-show': 'closedlost',
    'Contrat en cours': 'presentationscheduled',
    'Contrat signé': 'closedwon',
  };

  return statusMap[status] || 'appointmentscheduled';
}

/**
 * Mapping du stage HubSpot vers le statut Dashboard
 */
export function mapDealStageToStatus(dealStage: string): string {
  const stageMap: Record<string, string> = {
    'appointmentscheduled': 'RDV fixé',
    'qualifiedtobuy': 'Contacté',
    'presentationscheduled': 'Contrat en cours',
    'closedwon': 'Admis',
    'closedlost': 'No-show',
  };

  return stageMap[dealStage] || 'Nouveau';
}
