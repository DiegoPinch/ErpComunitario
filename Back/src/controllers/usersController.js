const usersModel = require('../models/usersModel');
const systemUsersModel = require('../models/systemUsersModel');

const getUsers = async (req, res, next) => {
  try {
    const users = await usersModel.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await usersModel.getUserById(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const id = await usersModel.createUser(userData);

    const created = await usersModel.getUserById(id);
    const cedula = created && (created.national_id || created.cedula || created.dni || created.id_number);
    if (!cedula) return res.status(400).json({ message: 'Cédula (national_id) requerida para crear system user' });

    // Usar la cédula como username y password en system_users
    await systemUsersModel.createSystemUser({
      user_id: id,
      username: String(cedula),
      password: String(cedula),
      role: 'user'
    });

    res.status(201).json({ user_id: id });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await usersModel.updateUser(id, req.body);
    if (!rows) return res.status(404).json({ message: 'Usuario no encontrado o sin cambios' });
    res.json({ updated: rows });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await usersModel.deleteUser(id);
    if (!rows) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ deleted: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
