const jwt = require('jsonwebtoken');

/**
 * Middleware de Autenticación General (Solo valida que el JWT sea válido)
 */
const authenticateToken = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authentication || req.headers.authorization;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  // Permitir token por query (para descargas de archivos/PDFs)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) return res.status(401).json({ message: 'No token proporcionado' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload; // Contiene: id, user_id, username, role, board_role
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Sesión expirada o token inválido' });
  }
};

/**
 * Middleware de Autorización por Rol Técnico (System Users)
 * @param {Array} roles - Lista de roles permitidos (ej: ['admin', 'board'])
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });

    // Los admins técnicos siempre tienen acceso a todo
    if (req.user.role === 'admin') return next();

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tiene permisos para esta acción' });
    }

    next();
  };
};

/**
 * Middleware de Autorización por Cargo en Directiva (Board Members)
 * @param {Array} boardRoles - Lista de cargos permitidos (ej: ['Tesorero', 'Presidente'])
 */
const authorizeBoard = (boardRoles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });

    // Los admins técnicos o presidentes suelen tener acceso total
    if (req.user.role === 'admin' || req.user.board_role === 'Presidente') return next();

    if (boardRoles.length && !boardRoles.includes(req.user.board_role)) {
      return res.status(403).json({ message: 'Acceso restringido a cargos específicos de la directiva' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorize,
  authorizeBoard
};