const express = require('express');
const router = express.Router();
const {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting
} = require('../controllers/meetingsController');

router.get('/', getMeetings);
router.get('/:id', getMeeting);
router.post('/', createMeeting);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

module.exports = router;
