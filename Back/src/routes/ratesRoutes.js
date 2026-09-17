const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/auth');
router.use(authorize(['board']));
const {
  getRates,
  getRate,
  createRate,
  updateRate,
  deleteRate
} = require('../controllers/ratesController');

router.get('/', getRates);
router.get('/:id', getRate);
router.post('/', createRate);
router.put('/:id', updateRate);
router.delete('/:id', deleteRate);

module.exports = router;
