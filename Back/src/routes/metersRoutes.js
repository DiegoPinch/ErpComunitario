const express = require('express');
const router = express.Router();
const {
  getMeters,
  getMeter,
  createMeter,
  updateMeter,
  deleteMeter
} = require('../controllers/metersController');

router.get('/', getMeters);
router.get('/:id', getMeter);
router.post('/', createMeter);
router.put('/:id', updateMeter);
router.delete('/:id', deleteMeter);

module.exports = router;
