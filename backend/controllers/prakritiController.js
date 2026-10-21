const PrakritiAssessment = require('../models/prakritiAssessment');
const AIAuditLog = require('../models/aiAuditLog');
const cacheService = require('../services/cache/cacheService');
const {
  QUESTIONS,
  QUESTIONNAIRE_VERSION,
  METHODOLOGY_VERSION,
  DISCLAIMER_TEXT,
  scoreAssessment,
} = require('../services/prakriti/prakritiScoringService');

/**
 * @desc    Get structured Prakriti questionnaire metadata and questions
 * @route   GET /api/prakriti/questions
 * @access  Private (Authenticated users)
 */
const getQuestions = async (req, res) => {
  try {
    return res.json({
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      scoringMethodologyVersion: METHODOLOGY_VERSION,
      disclaimer: DISCLAIMER_TEXT,
      totalQuestions: QUESTIONS.length,
      questions: QUESTIONS,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to retrieve questionnaire' });
  }
};

/**
 * @desc    Submit answers and calculate Prakriti constitutional profile
 * @route   POST /api/prakriti/assessments
 * @access  Private (Patient only)
 */
const createAssessment = async (req, res) => {
  try {
    // 1. Role Guard: Patients only
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({
        message: 'Access restricted to patients. Only patients can complete self-assessments.',
      });
    }

    const { answers } = req.body;

    // 2. Validate input answers array
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        message: 'A complete set of answers is required to evaluate Prakriti.',
      });
    }

    // Check that all required questions are answered
    if (answers.length < QUESTIONS.length) {
      return res.status(400).json({
        message: `Incomplete questionnaire. Answered ${answers.length} of ${QUESTIONS.length} required questions.`,
      });
    }

    // 3. Score the responses using the classical methodology engine
    const scoredResult = scoreAssessment(answers);

    // 4. Enrich answers with category and title for historical clarity
    const questionMap = new Map(QUESTIONS.map((q) => [q.id, q]));
    const enrichedAnswers = answers.map((ans) => {
      const qMeta = questionMap.get(ans.questionId);
      return {
        questionId: ans.questionId,
        category: qMeta?.category || 'General',
        title: qMeta?.title || ans.questionId,
        selectedDosha: ans.selectedDosha.toLowerCase(),
        answerText: ans.answerText || 'Selected response',
      };
    });

    // 5. Persist isolated assessment record
    const record = await PrakritiAssessment.create({
      patientId: req.user._id,
      questionnaireVersion: scoredResult.questionnaireVersion,
      scoringMethodologyVersion: scoredResult.scoringMethodologyVersion,
      answers: enrichedAnswers,
      scores: scoredResult.scores,
      dominantConstitution: scoredResult.dominantConstitution,
      constitutionType: scoredResult.constitutionType,
      profile: scoredResult.profile,
      status: 'completed',
      disclaimer: scoredResult.disclaimer,
    });

    // 6. Explicitly invalidate cached patient assessment keys
    cacheService.del(`prakriti:patient:${req.user._id}:latest`);
    cacheService.del(`prakriti:patient:${req.user._id}:history`);

    // 7. Audit log the assessment completion
    try {
      await AIAuditLog.create({
        userId: req.user._id,
        role: req.user.role,
        action: 'PRAKRITI_ASSESSMENT_COMPLETED',
        targetPatientId: req.user._id,
        metadata: {
          assessmentId: record._id,
          dominantConstitution: record.dominantConstitution,
          constitutionType: record.constitutionType,
        },
      });
    } catch {}

    return res.status(201).json(record);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'An error occurred while evaluating your Prakriti assessment.',
    });
  }
};

/**
 * @desc    Get latest Prakriti assessment for authenticated patient
 * @route   GET /api/prakriti/assessments/latest
 * @access  Private (Patient only)
 */
const getLatestAssessment = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access restricted to patients.' });
    }

    const latest = await cacheService.wrap(
      `prakriti:patient:${req.user._id}:latest`,
      300,
      async () => {
        return await PrakritiAssessment.findOne({ patientId: req.user._id }).sort({ createdAt: -1 });
      }
    );

    return res.json({ assessment: latest || null });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch latest assessment.' });
  }
};

/**
 * @desc    Get all historical Prakriti assessments for authenticated patient
 * @route   GET /api/prakriti/assessments
 * @access  Private (Patient only)
 */
const getAssessmentHistory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access restricted to patients.' });
    }

    const history = await cacheService.wrap(
      `prakriti:patient:${req.user._id}:history`,
      300,
      async () => {
        return await PrakritiAssessment.find({ patientId: req.user._id }).sort({ createdAt: -1 });
      }
    );

    return res.json(history || []);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch assessment history.' });
  }
};

/**
 * @desc    Get single Prakriti assessment by ID with strict IDOR verification
 * @route   GET /api/prakriti/assessments/:id
 * @access  Private (Patient only for own records)
 */
const getAssessmentById = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access restricted to patients.' });
    }

    const assessment = await PrakritiAssessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ message: 'Prakriti assessment record not found.' });
    }

    // Strict IDOR Ownership Check
    if (assessment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to access another patient's Prakriti assessment.",
      });
    }

    return res.json(assessment);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to retrieve assessment.' });
  }
};

module.exports = {
  getQuestions,
  createAssessment,
  getLatestAssessment,
  getAssessmentHistory,
  getAssessmentById,
};
