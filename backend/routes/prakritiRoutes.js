const express = require('express');
const router = express.Router();
const {
  getQuestions,
  createAssessment,
  getLatestAssessment,
  getAssessmentHistory,
  getAssessmentById,
} = require('../controllers/prakritiController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/prakriti/questions - Get questionnaire structure
router.get('/questions', protect, getQuestions);

// POST /api/prakriti/assessments - Submit assessment
// GET  /api/prakriti/assessments - Get assessment history
router.route('/assessments')
  .post(protect, createAssessment)
  .get(protect, getAssessmentHistory);

// GET /api/prakriti/assessments/latest - Get latest assessment
router.get('/assessments/latest', protect, getLatestAssessment);

// GET /api/prakriti/assessments/:id - Get specific assessment by ID
router.get('/assessments/:id', protect, getAssessmentById);

module.exports = router;
