const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

// Ruta para descargar el respaldo manual
router.get('/download', backupController.downloadBackup);

// Ruta para enviar por correo
router.post('/send-email', backupController.sendBackupEmail);

module.exports = router;
