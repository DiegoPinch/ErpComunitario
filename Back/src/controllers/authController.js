const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const systemUsersModel = require('../models/systemUsersModel');
const db = require('../config/db'); // Necesario para consulta directa de board_members

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username y password requeridos' });

    const user = await systemUsersModel.getSystemUserByUsername(username);
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Lógica de Doble Verificación para Miembros de la Directiva
    let boardRole = null;
    if (user.role === 'board') {
      const [boardRows] = await db.query(
        'SELECT role FROM board_members WHERE user_id = ? AND active = 1 LIMIT 1',
        [user.user_id]
      );
      if (boardRows && boardRows.length > 0) {
        boardRole = boardRows[0].role;
      } else {
        // Si es 'board' en system_users pero no está activo en board_members
        // lo degradamos a 'user' básico temporalmente para este login
        user.role = 'user';
      }
    }

    const payload = {
      id: user.system_user_id,
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      board_role: boardRole // Ejemplo: 'Presidente', 'Tesorero', etc.
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '2h' });

    res.json({
      token,
      role: user.role,
      board_role: boardRole,
      username: user.username,
      user_id: user.user_id
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login };