const fs = require('node:fs');
const path = require('node:path');

// These SQL files use one top-level statement per delimiter-terminated line.
function splitSql(source) {
  let delimiter = ';';
  let pending = '';
  const statements = [];
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*--/.test(line) || !line.trim()) continue;
    const command = /^\s*DELIMITER\s+(\S+)\s*$/i.exec(line);
    if (command) {
      if (pending.trim()) throw new Error('SQL incompleto antes de DELIMITER');
      delimiter = command[1];
      continue;
    }
    pending += line + '\n';
    if (pending.trimEnd().endsWith(delimiter)) {
      statements.push(pending.trimEnd().slice(0, -delimiter.length));
      pending = '';
    }
  }
  if (pending.trim()) throw new Error('SQL incompleto al final del archivo');
  return statements;
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
  const expected = process.argv.find(arg => arg.startsWith('--database='))?.slice(11);
  if (!expected || !process.argv.includes('--apply')) {
    throw new Error('Uso: node scripts/run-accounting-migration.js --database=NOMBRE_VERIFICADO --apply');
  }
  const pool = require('../src/config/db');
  const connection = await pool.getConnection();
  try {
    const [[target]] = await connection.query('SELECT DATABASE() AS name');
    if (target.name !== expected) throw new Error('La base conectada no coincide con --database');
    const files = process.argv.includes('--attendance-only') ? ['scripts/attendance_safety.sql'] :
      ['scripts/accounting_integrity_migration.sql', 'routines_only.sql', 'scripts/attendance_safety.sql'];
    for (const file of files) {
      const sql = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      const statements = splitSql(sql);
      for (let index = 0; index < statements.length; index++) {
        try { await connection.query(statements[index]); }
        catch (error) {
          throw new Error(`${file}, sentencia ${index + 1}: ${error.code}: ${error.sqlMessage}`);
        }
      }
      console.log(`${file}: ${statements.length} sentencias aplicadas en ${target.name}`);
    }
  } finally {
    connection.release();
    await pool.end();
  }
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { splitSql };
