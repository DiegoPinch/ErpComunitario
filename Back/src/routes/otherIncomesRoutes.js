const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/auth');
router.use(authorize(['board', 'treasurer']));
const controller = require('../controllers/otherIncomesController');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.voidIncome);

module.exports = router;
