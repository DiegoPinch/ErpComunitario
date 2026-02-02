const conceptsModel = require('../models/additionalConceptsModel');

const getConcepts = async (req, res, next) => {
  try {
    const concepts = await conceptsModel.getAllConcepts();
    res.json(concepts);
  } catch (err) {
    next(err);
  }
};

const getConcept = async (req, res, next) => {
  try {
    const id = req.params.id;
    const concept = await conceptsModel.getConceptById(id);
    if (!concept) return res.status(404).json({ message: 'Concepto no encontrado' });
    res.json(concept);
  } catch (err) {
    next(err);
  }
};

const createConcept = async (req, res, next) => {
  try {
    const data = req.body;
    const id = await conceptsModel.createConcept(data);
    res.status(201).json({ concept_id: id });
  } catch (err) {
    next(err);
  }
};

const updateConcept = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await conceptsModel.updateConcept(id, req.body);
    if (!rows) return res.status(404).json({ message: 'Concepto no encontrado o sin cambios' });
    res.json({ updated: rows });
  } catch (err) {
    next(err);
  }
};

const deleteConcept = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await conceptsModel.deleteConcept(id);
    if (!rows) return res.status(404).json({ message: 'Concepto no encontrado' });
    res.json({ deleted: rows });
  } catch (err) {
    next(err);
  }
};

const getAssignedUsers = async (req, res, next) => {
  try {
    const id = req.params.id;
    const users = await conceptsModel.getAssignedUsers(id);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConcepts,
  getConcept,
  createConcept,
  updateConcept,
  deleteConcept,
  getAssignedUsers,
};