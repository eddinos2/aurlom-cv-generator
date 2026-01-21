import { Pool, QueryResult } from 'pg';
import { z } from 'zod';

export const CandidateStatus = z.enum([
  'Nouveau',
  'Contacté',
  'RDV fixé',
  'Admis',
  'No-show',
  'Contrat en cours',
  'Contrat signé'
]);

export const CandidateSchema = z.object({
  id: z.number().optional(),
  hubspot_contact_id: z.string().nullable().optional(),
  hubspot_deal_id: z.string().nullable().optional(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  program: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  campus: z.string().nullable().optional(),
  status: CandidateStatus.default('Nouveau'),
  appointment_date: z.date().nullable().optional(),
  meta_lead_id: z.string().nullable().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  synced_with_hubspot_at: z.date().nullable().optional(),
  synced_with_dashboard_at: z.date().nullable().optional(),
});

export type Candidate = z.infer<typeof CandidateSchema>;

export class CandidateModel {
  constructor(private db: Pool) {}

  async create(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
    const query = `
      INSERT INTO candidates (
        hubspot_contact_id, hubspot_deal_id, first_name, last_name, email, phone,
        program, source, campus, status, appointment_date, meta_lead_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      candidate.hubspot_contact_id || null,
      candidate.hubspot_deal_id || null,
      candidate.first_name,
      candidate.last_name,
      candidate.email,
      candidate.phone || null,
      candidate.program || null,
      candidate.source || null,
      candidate.campus || null,
      candidate.status,
      candidate.appointment_date || null,
      candidate.meta_lead_id || null,
    ];

    const result: QueryResult<Candidate> = await this.db.query(query, values);
    return result.rows[0];
  }

  async findById(id: number): Promise<Candidate | null> {
    const result = await this.db.query('SELECT * FROM candidates WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<Candidate | null> {
    const result = await this.db.query('SELECT * FROM candidates WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findByHubSpotContactId(contactId: string): Promise<Candidate | null> {
    const result = await this.db.query('SELECT * FROM candidates WHERE hubspot_contact_id = $1', [contactId]);
    return result.rows[0] || null;
  }

  async findByMetaLeadId(leadId: string): Promise<Candidate | null> {
    const result = await this.db.query('SELECT * FROM candidates WHERE meta_lead_id = $1', [leadId]);
    return result.rows[0] || null;
  }

  async update(id: number, updates: Partial<Candidate>): Promise<Candidate> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id) as Promise<Candidate>;
    }

    values.push(id);
    const query = `UPDATE candidates SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result: QueryResult<Candidate> = await this.db.query(query, values);
    return result.rows[0];
  }

  async updateStatus(id: number, newStatus: string, changedBy?: string, changeSource?: string, notes?: string): Promise<Candidate> {
    const candidate = await this.findById(id);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Enregistrer l'historique
    await this.db.query(
      `INSERT INTO status_history (candidate_id, old_status, new_status, changed_by, change_source, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, candidate.status, newStatus, changedBy || null, changeSource || null, notes || null]
    );

    // Mettre à jour le statut
    return this.update(id, { status: newStatus as any });
  }

  async findAll(filters?: {
    status?: string;
    campus?: string;
    program?: string;
    limit?: number;
    offset?: number;
  }): Promise<Candidate[]> {
    let query = 'SELECT * FROM candidates WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters?.campus) {
      query += ` AND campus = $${paramIndex}`;
      values.push(filters.campus);
      paramIndex++;
    }

    if (filters?.program) {
      query += ` AND program = $${paramIndex}`;
      values.push(filters.program);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(filters.offset);
    }

    const result: QueryResult<Candidate> = await this.db.query(query, values);
    return result.rows;
  }

  async getStatusHistory(candidateId: number): Promise<any[]> {
    const result = await this.db.query(
      'SELECT * FROM status_history WHERE candidate_id = $1 ORDER BY created_at DESC',
      [candidateId]
    );
    return result.rows;
  }
}
