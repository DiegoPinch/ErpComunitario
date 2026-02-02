const express = require('express');
const router = express.Router();
const {
  getBoardMembers,
  getBoardMember,
  createBoardMember,
  updateBoardMember,
  deleteBoardMember
} = require('../controllers/boardMembersController');

router.get('/', getBoardMembers);
router.get('/:id', getBoardMember);
router.post('/', createBoardMember);
router.put('/:id', updateBoardMember);
router.delete('/:id', deleteBoardMember);

module.exports = router;
