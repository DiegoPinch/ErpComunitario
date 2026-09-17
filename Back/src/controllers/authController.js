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

    if (user.status === 0 || user.status === false) {
      return res.status(403).json({ message: 'Usuario desactivado. Comuníquese con el administrador.' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Lógica de Doble Verificación Dinámica para Miembros de la Directiva
    let boardRole = null;
    if (user.role !== 'admin') {
      const [boardRows] = await db.query(
        'SELECT role FROM board_members WHERE user_id = ? AND active = 1 LIMIT 1',
        [user.user_id]
      );
      if (boardRows && boardRows.length > 0) {
        boardRole = boardRows[0].role;
        user.role = 'board';
      } else if (user.role !== 'treasurer') {
        user.role = 'user';
      }
    }

    const payload = {
      id: user.system_user_id,
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      board_role: boardRole,
      first_name: user.first_name || 'Admin',
      last_name: user.last_name || 'Técnico'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '3h' });

    res.json({
      token,
      role: user.role,
      board_role: boardRole,
      username: user.username,
      user_id: user.user_id,
      first_name: user.first_name || 'Admin',
      last_name: user.last_name || 'Técnico'
    });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña antigua y nueva requeridas' });
    }

    const systemUserId = req.user.id;
    
    // Obtener el usuario actual (usamos pool directo para evitar conflictos)
    const [rows] = await db.query('SELECT * FROM system_users WHERE system_user_id = ?', [systemUserId]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña antigua
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Hashear y actualizar
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE system_users SET password = ? WHERE system_user_id = ?', [hashed, systemUserId]);

    res.json({ message: 'Contraseña actualizada con éxito' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, changePassword };
