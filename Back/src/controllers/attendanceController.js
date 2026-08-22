const attendanceModel = require('../models/attendanceModel');

const getAttendance = async (req, res, next) => {
  try {
    const items = await attendanceModel.getAllAttendance();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const getAttendanceById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const item = await attendanceModel.getAttendanceById(id);
    if (!item) return res.status(404).json({ message: 'Asistencia no encontrada' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const getAttendanceByMeeting = async (req, res, next) => {
  try {
    const meetingId = req.params.meetingId;
    const list = await attendanceModel.getAttendanceByMeetingId(meetingId);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

const createAttendance = async (req, res, next) => {
  try {
    const id = await attendanceModel.createAttendance(req.body);
    res.status(201).json({ attendance_id: id });
  } catch (err) {
    next(err);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await attendanceModel.updateAttendance(id, req.body);
    if (!rows) return res.status(404).json({ message: 'Asistencia no encontrada o sin cambios' });
    res.json({ updated: rows });
  } catch (err) {
    next(err);
  }
};

const deleteAttendance = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await attendanceModel.deleteAttendance(id);
    if (!rows) return res.status(404).json({ message: 'Asistencia no encontrada' });
    res.json({ deleted: rows });
  } catch (err) {
    next(err);
  }
};

const updateAttendanceBulk = async (req, res, next) => {
  try {
    const meetingId = req.params.meetingId;
    const list = req.body;
    await attendanceModel.updateAttendanceBulk(meetingId, list);
    res.json({ message: 'Asistencia registrada y facturas actualizadas con éxito' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAttendance,
  getAttendanceById,
  getAttendanceByMeeting,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  updateAttendanceBulk,
};