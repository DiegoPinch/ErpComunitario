const { execSync } = require('child_process');
const mysqlCommand = '"C:\\Program Files\\MySQL\\MySQL Server 9.6\\bin\\mysql.exe"';
const mysqldumpCommand = '"C:\\Program Files\\MySQL\\MySQL Server 9.6\\bin\\mysqldump.exe"';

try {
  console.log('Dumping routines...');
  execSync(`${mysqldumpCommand} -uroot -pPinchita411@ --no-create-info --no-data --routines --set-gtid-purged=OFF water_system > routines_only.sql`);
  
  console.log('Importing routines to PROD...');
  execSync(`${mysqlCommand} -uroot -pPinchita411@ water_system_prod < routines_only.sql`);
  
  console.log('EXITO');
} catch (e) {
  console.error('Error:', e.message);
}
