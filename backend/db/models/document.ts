import { Pool, QueryResult } from 'pg';
import { z } from 'zod';

export const DocumentStatus = z.enum([
  'draft',
  'sent',
  'viewed',
  'signed',
  'completed',
  'declined'
]);

export const DocumentSchema = z.object({
  id: z.number().optional(),
  candidate_id: z.number(),
  docuseal_document_id: z.string(),
  docuseal_submitter_id: z.string().nullable().optional(),
  document_type: z.string(),
  template_id: z.string().nullable().optional(),
  status: DocumentStatus.default('draft'),
  file_url: z.string().nullable().optional(),
  signed_at: z.date().nullable().optional(),
  completed_at: z.date().nullable().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

export class DocumentModel {
  constructor(private db: Pool) {}

  async create(document: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
    const query = `
      INSERT INTO documents (
        candidate_id, docuseal_document_id, docuseal_submitter_id,
        document_type, template_id, status, file_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      document.candidate_id,
      document.docuseal_document_id,
      document.docuseal_submitter_id || null,
      document.document_type,
      document.template_id || null,
      document.status,
      document.file_url || null,
    ];

    const result: QueryResult<Document> = await this.db.query(query, values);
    return result.rows[0];
  }

  async findById(id: number): Promise<Document | null> {
    const result = await this.db.query('SELECT * FROM documents WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByDocuSealDocumentId(docId: string): Promise<Document | null> {
    const result = await this.db.query('SELECT * FROM documents WHERE docuseal_document_id = $1', [docId]);
    return result.rows[0] || null;
  }

  async findByCandidateId(candidateId: number): Promise<Document[]> {
    const result = await this.db.query(
      'SELECT * FROM documents WHERE candidate_id = $1 ORDER BY created_at DESC',
      [candidateId]
    );
    return result.rows;
  }

  async update(id: number, updates: Partial<Document>): Promise<Document> {
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
      return this.findById(id) as Promise<Document>;
    }

    values.push(id);
    const query = `UPDATE documents SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result: QueryResult<Document> = await this.db.query(query, values);
    return result.rows[0];
  }

  async updateStatus(id: number, status: string, signedAt?: Date, completedAt?: Date): Promise<Document> {
    const updates: any = { status };
    if (signedAt) updates.signed_at = signedAt;
    if (completedAt) updates.completed_at = completedAt;
    return this.update(id, updates);
  }
}
