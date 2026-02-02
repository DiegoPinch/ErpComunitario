const express = require('express');
const router = express.Router();
const {
  getSystemUsers,
  getSystemUser,
  createSystemUser,
  updateSystemUser,
  deleteSystemUser
} = require('../controllers/systemUsersController');

router.get('/', getSystemUsers);
router.get('/:id', getSystemUser);
router.post('/', createSystemUser);
router.put('/:id', updateSystemUser);
router.delete('/:id', deleteSystemUser);

module.exports = router;
