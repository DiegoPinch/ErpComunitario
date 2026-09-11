const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system_prod' });

  // Ver todas las reuniones
  const [meetings] = await pool.query("SELECT m.*, ac.description, ac.amount, ac.application_month FROM meetings m LEFT JOIN additional_concepts ac ON m.concept_id = ac.concept_id ORDER BY m.meeting_date DESC");
  console.log('=== REUNIONES ===');
  console.log(JSON.stringify(meetings, null, 2));

  // Ver los invoice_concept asociados a reuniones
  const [concepts] = await pool.query(`
    SELECT ic.*, ac.description, ac.amount, ac.application_month, ac.concept_type
    FROM invoice_concept ic
    JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
    WHERE ac.concept_type = 'fine'
    ORDER BY ac.application_month DESC
  `);
  console.log('\n=== CONCEPTOS EN FACTURAS ===');
  console.log(JSON.stringify(concepts, null, 2));

  process.exit();
})();
