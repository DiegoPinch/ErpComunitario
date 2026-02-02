const boardModel = require('../models/boardMembersModel');

const getBoardMembers = async (req, res, next) => {
  try {
    const items = await boardModel.getAllBoardMembers();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const getBoardMember = async (req, res, next) => {
  try {
    const id = req.params.id;
    const item = await boardModel.getBoardMemberById(id);
    if (!item) return res.status(404).json({ message: 'Miembro de directiva no encontrado' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const createBoardMember = async (req, res, next) => {
  try {
    const id = await boardModel.createBoardMember(req.body);
    res.status(201).json({ board_id: id });
  } catch (err) {
    next(err);
  }
};

const updateBoardMember = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await boardModel.updateBoardMember(id, req.body);
    if (!rows) return res.status(404).json({ message: 'Miembro de directiva no encontrado o sin cambios' });
    res.json({ updated: rows });
  } catch (err) {
    next(err);
  }
};

const deleteBoardMember = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await boardModel.deleteBoardMember(id);
    if (!rows) return res.status(404).json({ message: 'Miembro de directiva no encontrado' });
    res.json({ deleted: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBoardMembers,
  getBoardMember,
  createBoardMember,
  updateBoardMember,
  deleteBoardMember,
};