require('dotenv').config();

const pool = require('../src/config/db');

const apply = process.argv.includes('--apply');

async function main() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [accounts] = await connection.query(`
      SELECT su.system_user_id, su.username, su.role, su.status,
             CONCAT_WS(' ', u.first_name, u.last_name) AS person_name
      FROM system_users su
      LEFT JOIN users u ON u.user_id = su.user_id
      ORDER BY su.system_user_id
      FOR UPDATE
    `);
    const admins = accounts.filter(account => account.role === 'admin');
    const candidates = accounts.filter(account => account.role !== 'admin');

    if (admins.length === 0) {
      throw new Error('Operación cancelada: no existe ninguna cuenta con rol admin.');
    }

    const [foreignKeys] = await connection.query(`
      SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME = 'system_users'
    `);

    const referencedIds = new Set();
    for (const foreignKey of foreignKeys) {
      const table = connection.escapeId(foreignKey.table_name);
      const column = connection.escapeId(foreignKey.column_name);
      const [rows] = await connection.query(
        `SELECT DISTINCT ${column} AS system_user_id FROM ${table} WHERE ${column} IS NOT NULL`
      );
      rows.forEach(row => referencedIds.add(Number(row.system_user_id)));
    }

    const removable = candidates.filter(account => !referencedIds.has(Number(account.system_user_id)));
    const historical = candidates.filter(account => referencedIds.has(Number(account.system_user_id)));

    console.table(accounts.map(account => ({
      id: account.system_user_id,
      usuario: account.username,
      rol: account.role,
      estado: account.status ? 'activo' : 'inactivo',
      persona: account.person_name || '',
      accion: account.role === 'admin'
        ? 'CONSERVAR'
        : referencedIds.has(Number(account.system_user_id)) ? 'DESACTIVAR (tiene historial)' : 'ELIMINAR'
    })));

    if (apply) {
      if (removable.length) {
        await connection.query(
          'DELETE FROM system_users WHERE system_user_id IN (?)',
          [removable.map(account => account.system_user_id)]
        );
      }
      if (historical.length) {
        await connection.query(
          'UPDATE system_users SET status = 0 WHERE system_user_id IN (?)',
          [historical.map(account => account.system_user_id)]
        );
      }
      await connection.commit();
    } else {
      await connection.rollback();
    }

    console.log(`Administradores conservados: ${admins.length}`);
    console.log(`Cuentas eliminadas: ${removable.length}`);
    console.log(`Cuentas históricas desactivadas: ${historical.length}`);
    console.log(apply ? 'Limpieza aplicada correctamente.' : 'Simulación terminada. Use --apply para aplicar.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
