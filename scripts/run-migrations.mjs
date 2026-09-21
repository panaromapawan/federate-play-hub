import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from '../src/lib/db.server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, 'migrations');

async function main() {
  console.log('🚀 Starting Federation Management Upgrade Migrations...\n');
  const pool = getPool();

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') || f.endsWith('.mjs'))
    .sort();

  console.log(`Found ${files.length} migration file(s) in ${migrationsDir}:`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log('');

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`▶ Running migration: ${file}...`);

    if (file.endsWith('.mjs')) {
      const mod = await import(`file://${filePath}`);
      if (typeof mod.up === 'function') {
        await mod.up(pool);
      } else if (typeof mod.default === 'function') {
        await mod.default(pool);
      }
    } else {
      const sql = fs.readFileSync(filePath, 'utf-8');
      // Split by double newline or custom marker, or execute statements
      // To safely handle stored procedures and normal queries:
      // We can use a custom delimiter marker like `-- SPLIT` or execute procedure blocks cleanly
      const chunks = sql.split(/--\s*SPLIT\s*\r?\n/);
      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (!trimmed) continue;
        try {
          await pool.query(trimmed);
        } catch (err) {
          console.error(`Error in ${file} executing:\n${trimmed.slice(0, 150)}...\nMessage:`, err.message);
          throw err;
        }
      }
    }
    console.log(`✔ Finished migration: ${file}\n`);
  }

  console.log('🎉 All migrations completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
