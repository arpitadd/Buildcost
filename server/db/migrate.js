import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  console.log(`Checking migrations in ${migrationsDir}...`);

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No SQL migration files found.');
    return;
  }

  const client = await pool.connect();
  try {
    // Create migrations tracker table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const file of files) {
      const res = await client.query('SELECT id FROM schema_migrations WHERE filename = $1', [file]);
      if (res.rows.length === 0) {
        console.log(`Executing migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✓ Migration applied successfully: ${file}`);
      } else {
        console.log(`- Migration already applied: ${file}`);
      }
    }
    console.log('All migrations completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
}

export default runMigrations;
