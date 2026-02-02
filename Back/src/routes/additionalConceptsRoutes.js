const express = require('express');
const router = express.Router();
const {
  getConcepts,
  getConcept,
  createConcept,
  updateConcept,
  deleteConcept,
  getAssignedUsers
} = require('../controllers/additionalConceptsController');

router.get('/', getConcepts);
router.get('/:id', getConcept);
router.get('/assigned-users/:id', getAssignedUsers);
router.post('/', createConcept);
router.put('/:id', updateConcept);
router.delete('/:id', deleteConcept);

module.exports = router;
