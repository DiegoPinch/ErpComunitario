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

const updateAttendanceBulk = async (req, res, next) => {
  try {
    const meetingId = req.params.meetingId;
    const result = await attendanceModel.updateAttendanceBulk(meetingId, req.body.records, req.user.id,
      {application_month:req.body.application_month, reason:req.body.reason, preview:Boolean(req.previewAttendance)});
    res.json({ ...result, message: req.previewAttendance ? 'Revisión completada' : 'Asistencia registrada y facturas actualizadas con éxito' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAttendance,
  getAttendanceById,
  getAttendanceByMeeting,
  updateAttendanceBulk,
};
