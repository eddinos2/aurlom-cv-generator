import { Database } from '../../backend/db/schema';
import { databaseConfig } from '../../config/integrations';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const db = new Database(databaseConfig.url);
  
  try {
    console.log('Testing database connection...');
    const connected = await db.testConnection();
    
    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }
    
    console.log('Database connected successfully');
    console.log('Running migrations...');
    
    await db.runMigrations();
    
    console.log('Migrations completed successfully');
    await db.close();
    process.exit(0);
  } catch (error: any) {
    console.error('Migration failed:', error);
    await db.close();
    process.exit(1);
  }
}

migrate();
