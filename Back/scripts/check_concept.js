const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system_prod' });
  
  // Ver el concept_id=8 de la minga
  const [concept] = await pool.query('SELECT * FROM additional_concepts WHERE concept_id = 8');
  console.log('=== Concepto de Minga ===');
  console.log(JSON.stringify(concept, null, 2));

  // Facturas incorrectas: julio con multa de minga agosto
  const [wrong] = await pool.query(`
    SELECT i.invoice_id, i.billing_month, i.status, i.user_id
    FROM invoice_concept ic
    JOIN invoices i ON ic.invoice_id = i.invoice_id
    WHERE ic.concept_id = 8 AND i.billing_month != '2026-08'
  `);
  console.log('\n=== Facturas en mes equivocado ===');
  console.log(JSON.stringify(wrong, null, 2));
  
  process.exit();
})();
