const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system_prod' });
  
  // Reunión/minga ID=3 (MINGA DEL AGUA) - ver facturas pagadas con esta multa
  const [paid] = await pool.query(`
    SELECT ic.id, ic.invoice_id, i.status, i.billing_month, i.user_id,
           CONCAT(u.last_name, ' ', u.first_name) as user_name
    FROM invoice_concept ic
    JOIN invoices i ON ic.invoice_id = i.invoice_id
    JOIN users u ON i.user_id = u.user_id
    WHERE ic.concept_id = 8
    ORDER BY i.status, i.billing_month
  `);
  console.log('=== Facturas vinculadas a MINGA DEL AGUA (concept_id=8) ===');
  const paid_count = paid.filter(r => r.status === 'paid').length;
  const pending_count = paid.filter(r => r.status === 'pending').length;
  console.log(`Total: ${paid.length} | Pagadas: ${paid_count} | Pendientes: ${pending_count}`);
  
  // Ver si alguna factura pendiente tiene mes diferente a 2026-08
  const wrongMonth = paid.filter(r => r.billing_month !== '2026-08' && r.status === 'pending');
  if (wrongMonth.length > 0) {
    console.log('\n=== FACTURAS PENDIENTES EN MES INCORRECTO ===');
    console.log(JSON.stringify(wrongMonth, null, 2));
  } else {
    console.log('\nTodas las facturas pendientes son de 2026-08. OK.');
  }
  
  process.exit();
})();
