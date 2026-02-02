const meetingsModel = require('../models/meetingsModel');

const getMeetings = async (req, res, next) => {
  try {
    const items = await meetingsModel.getAllMeetings();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const getMeeting = async (req, res, next) => {
  try {
    const id = req.params.id;
    const item = await meetingsModel.getMeetingById(id);
    if (!item) return res.status(404).json({ message: 'Reunión no encontrada' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const createMeeting = async (req, res, next) => {
  try {
    const id = await meetingsModel.createMeeting(req.body);
    res.status(201).json({ meeting_id: id });
  } catch (err) {
    next(err);
  }
};

const updateMeeting = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await meetingsModel.updateMeeting(id, req.body);
    if (!rows) return res.status(404).json({ message: 'Reunión no encontrada o sin cambios' });
    res.json({ updated: rows });
  } catch (err) {
    next(err);
  }
};

const deleteMeeting = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await meetingsModel.deleteMeeting(id);
    if (!rows) return res.status(404).json({ message: 'Reunión no encontrada' });
    res.json({ deleted: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
};