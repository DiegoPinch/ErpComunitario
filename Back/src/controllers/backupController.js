const path = require('path');
const fs = require('fs');
const { createEncryptedBackup } = require('../utils/backupUtils');

const downloadBackup = async (req, res) => {
  try {
    // Generamos un nombre de archivo único con fecha
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `respaldo_${dateStr}.enc`;
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    
    // Asegurarse de que el directorio temporal exista
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, fileName);

    // 1. Crear el respaldo encriptado
    await createEncryptedBackup(tempFilePath);

    // 2. Enviar el archivo para descargar
    res.download(tempFilePath, fileName, (err) => {
      // 3. Eliminar el archivo temporal una vez descargado o si hay error
      if (err) {
        console.error('Error al enviar el archivo:', err);
      }
      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error al eliminar archivo temporal:', unlinkErr);
      });
    });

  } catch (error) {
    console.error('Error al generar el respaldo:', error);
    res.status(500).json({ error: 'Error interno al generar el respaldo' });
  }
};

const sendBackupEmail = async (req, res) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailDestino = process.env.EMAIL_DESTINO || emailUser;

    // Verificamos si el usuario ya configuró su correo
    if (!emailUser || !emailPass) {
      return res.status(501).json({ 
        message: 'Falta configurar el correo electrónico', 
        details: 'Agrega EMAIL_USER y EMAIL_PASS a tu archivo .env' 
      });
    }

    // 1. Crear el respaldo encriptado temporalmente
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `respaldo_erp_${dateStr}.enc`;
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempFilePath = path.join(tempDir, fileName);
    await createEncryptedBackup(tempFilePath);

    // 2. Configurar Nodemailer
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Por defecto usamos Gmail
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    // 3. Enviar el correo
    console.log('Enviando respaldo por correo a:', emailDestino);
    await transporter.sendMail({
      from: `"Respaldos YakuGest" <${emailUser}>`,
      to: emailDestino,
      subject: `Respaldo de Base de Datos - ${new Date().toLocaleDateString()}`,
      text: 'Adjunto encontrarás el archivo encriptado (.enc) con el respaldo de la base de datos de tu sistema ERP.\n\nRecuerda guardar bien tu contraseña (BACKUP_SECRET) para poder desencriptarlo en el futuro.',
      attachments: [
        {
          filename: fileName,
          path: tempFilePath
        }
      ]
    });

    // 4. Limpiar el archivo temporal
    fs.unlinkSync(tempFilePath);
    console.log(`Correo enviado exitosamente.`);

    res.json({ 
      message: 'Respaldo enviado a tu correo exitosamente'
    });

  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ error: 'Hubo un error al intentar enviar el correo' });
  }
};

module.exports = {
  downloadBackup,
  sendBackupEmail
};
