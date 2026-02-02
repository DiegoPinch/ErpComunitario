const systemUsersModel = require('../models/systemUsersModel');

const getSystemUsers = async (req, res, next) => {
  try {
    const users = await systemUsersModel.getAllSystemUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const getSystemUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await systemUsersModel.getSystemUserById(id);
    if (!user) return res.status(404).json({ message: 'Usuario del sistema no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const createSystemUser = async (req, res, next) => {
  try {
    const id = await systemUsersModel.createSystemUser(req.body);
    res.status(201).json({ system_user_id: id });
  } catch (err) {
    next(err);
  }
};

const updateSystemUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await systemUsersModel.updateSystemUser(id, req.body);
    if (!rows) return res.status(404).json({ message: 'Usuario del sistema no encontrado o sin cambios' });
    res.json({ updated: rows });
  } catch (err) {
    next(err);
  }
};

const deleteSystemUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await systemUsersModel.deleteSystemUser(id);
    if (!rows) return res.status(404).json({ message: 'Usuario del sistema no encontrado' });
    res.json({ deleted: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSystemUsers,
  getSystemUser,
  createSystemUser,
  updateSystemUser,
  deleteSystemUser,
};