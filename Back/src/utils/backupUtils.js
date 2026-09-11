const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Algoritmo de encriptación
const algorithm = 'aes-256-cbc';
// Contraseña secreta desde el .env (debe tener 32 caracteres para aes-256)
// Si no existe o es muy corta, la rellenamos hasta 32.
const secretKey = (process.env.BACKUP_SECRET || 'secreto_temporal_cambiar_urgente').padEnd(32, '0').slice(0, 32);

/**
 * Genera el respaldo, lo encripta al vuelo y lo guarda en la ruta indicada.
 * @param {string} outputPath Ruta final del archivo .enc
 * @returns {Promise<void>}
 */
const createEncryptedBackup = (outputPath) => {
  return new Promise((resolve, reject) => {
    // Vector de inicialización (IV) de 16 bytes
    const iv = crypto.randomBytes(16);
    
    // Creamos el encriptador
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);

    // Stream de escritura al archivo final
    const outputStream = fs.createWriteStream(outputPath);
    
    // Guardamos el IV al principio del archivo (lo necesitaremos para desencriptar)
    outputStream.write(iv);

    // Argumentos para mysqldump
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'water_system';

    const dumpArgs = [
      `-h${host}`,
      `-u${user}`,
      '--routines',
      '--triggers',
      '--events',
      '--set-gtid-purged=OFF',
      database
    ];
    if (password) {
      dumpArgs.splice(2, 0, `-p${password}`);
    }
    
    // Lógica dinámica para la ruta de mysqldump (Preparado para Docker/Linux y Windows)
    let mysqldumpCommand = 'mysqldump'; // Por defecto funciona en Docker, Linux, Mac y Windows (si está en PATH)
    
    if (process.env.MYSQLDUMP_PATH) {
      // Si el usuario especifica la ruta en el .env, manda esa
      mysqldumpCommand = process.env.MYSQLDUMP_PATH;
    } else if (process.platform === 'win32') {
      // Solo si estamos en Windows y no hay .env, intentamos adivinar la ruta de tu máquina
      const localWindowsPath = 'C:\\Program Files\\MySQL\\MySQL Server 9.6\\bin\\mysqldump.exe';
      if (require('fs').existsSync(localWindowsPath)) {
        mysqldumpCommand = localWindowsPath;
      }
    }

    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        console.log(`Respaldo encriptado finalizado en: ${outputPath}`);
        resolve();
      }
    };

    const mysqldump = spawn(mysqldumpCommand, dumpArgs);

    console.log('mysqldump spawn iniciado.');

    // Encriptamos y escribimos en el archivo
    mysqldump.stdout.pipe(cipher).pipe(outputStream);

    mysqldump.stderr.on('data', (data) => {
      console.log(`Mensaje de mysqldump: ${data.toString().trim()}`);
    });

    outputStream.on('finish', finish);
    outputStream.on('close', finish);

    outputStream.on('error', (err) => {
      if (!resolved) { resolved = true; reject(err); }
    });

    mysqldump.on('error', (err) => {
      if (!resolved) { resolved = true; reject(err); }
    });

    mysqldump.on('close', (code) => {
      console.log(`mysqldump finalizó con código ${code}`);
      // Esperamos a que los streams terminen naturalmente, pero si falla, rechazamos.
      if (code !== 0 && code !== null) {
        if (!resolved) { resolved = true; reject(new Error(`mysqldump falló con código ${code}`)); }
      }
    });
  });
};

module.exports = {
  createEncryptedBackup
};
