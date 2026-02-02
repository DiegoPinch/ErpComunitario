require('dotenv').config();
// Configuración principal de Express robusta y ordenada
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middlewares globales
app.use(cors()); // Permite peticiones desde cualquier origen
app.use(express.json()); // Parseo de JSON
app.use(morgan('dev')); // Logs de peticiones

// Rutas públicas
//app.use('/api/auth', require('./routes/authRoutes'));

// Protegemos todas las rutas siguientes con JWT
//const auth = require('./middlewares/auth');
//app.use(auth.authenticateToken);

// Rutas (protegidas)
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/meters', require('./routes/metersRoutes'));
app.use('/api/meter-history', require('./routes/meterHistoryRoutes'));
app.use('/api/readings', require('./routes/readingsRoutes'));
app.use('/api/rates', require('./routes/ratesRoutes'));
app.use('/api/invoices', require('./routes/invoicesRoutes'));
app.use('/api/additional-concepts', require('./routes/additionalConceptsRoutes'));
app.use('/api/invoice-concepts', require('./routes/invoiceConceptRoutes'));
app.use('/api/payments', require('./routes/paymentsRoutes'));
app.use('/api/meetings', require('./routes/meetingsRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/board-members', require('./routes/boardMembersRoutes'));
app.use('/api/system-users', require('./routes/systemUsersRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
