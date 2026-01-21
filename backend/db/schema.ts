import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export class Database {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Gestion des erreurs de connexion
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  getPool(): Pool {
    return this.pool;
  }

  async query(text: string, params?: any[]): Promise<any> {
    return this.pool.query(text, params);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.pool.query('SELECT NOW()');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async runMigrations(): Promise<void> {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await this.pool.query(sql);
        console.log(`✓ Migration ${file} completed`);
      } catch (error: any) {
        // Ignorer les erreurs "already exists" pour les migrations idempotentes
        if (error.code === '42P07' || error.message.includes('already exists')) {
          console.log(`- Migration ${file} already applied (skipped)`);
        } else {
          console.error(`✗ Migration ${file} failed:`, error.message);
          throw error;
        }
      }
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
