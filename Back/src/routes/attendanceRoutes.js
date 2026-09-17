const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getAttendanceById,
  getAttendanceByMeeting,
  updateAttendanceBulk
} = require('../controllers/attendanceController');

router.get('/', getAttendance);
router.get('/:id', getAttendanceById);
router.get('/meeting/:meetingId', getAttendanceByMeeting);
// Todas las escrituras pasan por la operación transaccional validada.
router.post('/preview/:meetingId', (req, res, next) => { req.previewAttendance = true; return updateAttendanceBulk(req,res,next); });
router.post('/bulk/:meetingId', updateAttendanceBulk);

module.exports = router;
