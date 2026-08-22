const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getAttendanceById,
  getAttendanceByMeeting,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  updateAttendanceBulk
} = require('../controllers/attendanceController');

router.get('/', getAttendance);
router.get('/:id', getAttendanceById);
router.get('/meeting/:meetingId', getAttendanceByMeeting);
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);
router.post('/bulk/:meetingId', updateAttendanceBulk);

module.exports = router;
