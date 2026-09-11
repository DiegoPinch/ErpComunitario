const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const algorithm = 'aes-256-cbc';
const secretKey = (process.env.BACKUP_SECRET || 'secreto_temporal_cambiar_urgente').padEnd(32, '0').slice(0, 32);

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Uso: node decryptBackup.js <archivo.enc>');
  process.exit(1);
}

const outputFile = inputFile.replace('.enc', '.sql');

try {
  // Leer los primeros 16 bytes que son el Vector de Inicialización (IV)
  const fd = fs.openSync(inputFile, 'r');
  const iv = Buffer.alloc(16);
  fs.readSync(fd, iv, 0, 16, 0);
  
  // El resto del archivo es el contenido encriptado
  const readStream = fs.createReadStream(inputFile, { start: 16 });
  const writeStream = fs.createWriteStream(outputFile);

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);

  console.log(`Desencriptando ${inputFile} -> ${outputFile}...`);

  readStream.pipe(decipher).pipe(writeStream);

  writeStream.on('finish', () => {
    console.log(`¡Éxito! Archivo SQL desencriptado guardado como: ${outputFile}`);
    console.log(`Puedes restaurarlo con: mysql -u root -p water_system < ${outputFile}`);
  });

  writeStream.on('error', (err) => {
    console.error('Error escribiendo archivo:', err);
  });

  decipher.on('error', (err) => {
    console.error('Error desencriptando (¿Contraseña incorrecta?):', err);
  });

} catch (error) {
  console.error('Error procesando el archivo:', error);
}
