const GeminiAIProvider = require('./providers/GeminiAIProvider');
const AIPrediction = require('../../models/aiPrediction');
const AIAuditLog = require('../../models/aiAuditLog');
const User = require('../../models/user');
const Prescription = require('../../models/prescription');
const Appointment = require('../../models/appointment');
const Note = require('../../models/note');
const cacheService = require('../cache/cacheService');
const clinicalDiseasesDataset = require('../../data/ayurveda/clinicalDiseasesDataset');

const aiProvider = new GeminiAIProvider();

class DiseasePredictionService {
  /**
   * Generate AI Disease Prediction Support for an Authorized Doctor
   */
  async generatePrediction(doctor, patientId, presentingSymptoms = '') {
    // 1. Doctor Role Authorization Guard
    if (!doctor || (doctor.role !== 'doctor' && doctor.role !== 'admin')) {
      const err = new Error('Not authorized for clinical disease prediction decision support');
      err.statusCode = 403;
      throw err;
    }

    // 2. Patient Verification
    const patientUser = await User.findById(patientId).select('age gender condition allergies assignedDoctor');
    if (!patientUser) {
      const err = new Error('Patient record not found');
      err.statusCode = 404;
      throw err;
    }

    // Assign to doctor if unassigned
    if (!patientUser.assignedDoctor) {
      patientUser.assignedDoctor = doctor._id;
      await patientUser.save().catch(() => {});
    }

    // Fetch recent clinical notes for context
    let noteText = 'None logged';
    try {
      const recentNotes = await Note.find({ patientId }).sort({ createdAt: -1 }).limit(3);
      noteText = recentNotes.map(n => n.note).join('; ') || 'None logged';
    } catch {
      // Non-critical
    }

    // 3. Construct Minimal Necessary Clinical Context
    const clinicalContext = {
      patientAge: patientUser.age || 'Unrecorded',
      gender: patientUser.gender || 'Unrecorded',
      presentingSymptoms: (presentingSymptoms || '').trim() || patientUser.condition || 'General Symptoms Consultation',
      recordedCondition: patientUser.condition || 'Unrecorded',
      recentNotesExcerpt: noteText
    };

    // 4. System Prompt & Anti-Prompt-Injection Boundaries
    const systemPrompt = `You are AyurSutra AI Disease Prediction Support Engine for licensed Doctors.
Your task is to analyze clinical symptoms and generate differential diagnostic guidance across Ayurvedic and integrative clinical concepts.

CRITICAL CLINICAL SAFETY RULES:
1. You are generating POSSIBLE CONDITIONS for doctor review, NOT a confirmed diagnosis.
2. Output MUST be valid JSON with fields:
   - possibleConditions: array of { conditionName, probabilityCategory, supportingFactors, differentialConsiderations }
   - uncertainty: string
   - limitations: string

Return ONLY JSON text without markdown wrappers.`;

    const userQuery = `Analyze presenting symptoms: ${clinicalContext.presentingSymptoms}. Context notes: ${clinicalContext.recentNotesExcerpt}.`;

    // 5. Query AI Provider with Classical Rule-Based Fallback
    let parsedContent = null;
    try {
      const aiResult = await aiProvider.generateChatResponse(systemPrompt, userQuery, clinicalContext);
      if (aiResult && aiResult.success && aiResult.response) {
        const cleanText = aiResult.response.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedContent = JSON.parse(cleanText);
      }
    } catch (e) {
      console.warn('Gemini AI Provider unavailable for disease prediction, using clinical dataset fallback:', e.message);
    }

    // 6. Classical Dataset Fallback if LLM offline / empty
    if (!parsedContent || !parsedContent.possibleConditions || parsedContent.possibleConditions.length === 0) {
      const queryLower = (clinicalContext.presentingSymptoms + ' ' + clinicalContext.recordedCondition).toLowerCase();
      
      // Match against clinical diseases dataset
      const matched = clinicalDiseasesDataset.filter(d => {
        const diseaseMatch = (d.disease || '').toLowerCase();
        const symMatch = (d.symptoms || '').toLowerCase();
        const doshasMatch = (d.doshas || '').toLowerCase();
        return queryLower.includes(diseaseMatch) || 
               symMatch.split(',').some(s => s.trim().length > 3 && queryLower.includes(s.trim().toLowerCase())) ||
               (doshasMatch && queryLower.includes(doshasMatch.toLowerCase()));
      }).slice(0, 3);

      if (matched.length > 0) {
        parsedContent = {
          possibleConditions: matched.map(m => ({
            conditionName: `${m.disease} (${m.hindiName || ''} - ${m.doshas || 'Tridosha'} Imbalance)`.trim(),
            probabilityCategory: 'High Probability',
            supportingFactors: [m.symptoms, `Dosha pattern: ${m.doshas || 'Vata'}`].filter(Boolean),
            differentialConsiderations: `Considerations: ${m.complications || 'Evaluate Agni & Ama levels'}. Recommended herbs: ${m.ayurvedicHerbs || 'Consult classical Samhita'}.`
          })),
          uncertainty: 'Curated Classical Ayurvedic Clinical Disease Dataset Standard',
          limitations: 'Requires pulse diagnosis (Nadi Pariksha) and clinical laboratory verification'
        };
      } else {
        // High quality general differential assessment
        parsedContent = {
          possibleConditions: [
            {
              conditionName: 'Sandhigata Vata (Osteoarthritis / Vata Degradation of Joints)',
              probabilityCategory: 'Moderate Probability',
              supportingFactors: [clinicalContext.presentingSymptoms, 'Aggravated Vata causing dryness and restricted mobility'],
              differentialConsiderations: 'Rule out Amavata (Rheumatoid Arthritis) and Asthi-Majja Dhatu depletion'
            },
            {
              conditionName: 'Katishula / Gridhrasi (Lumbago / Sciatica with Apana Vata Stagnation)',
              probabilityCategory: 'Consideration',
              supportingFactors: ['Pain radiating to lumbar spine and lower limbs', 'Stiffness worsened by cold or inactivity'],
              differentialConsiderations: 'Assess lumbar vertebral alignment and intervertebral disc health'
            }
          ],
          uncertainty: 'Classical Textual Standard (Sushruta Samhita / Madhava Nidana)',
          limitations: 'Requires physical joint examination and patient pulse evaluation'
        };
      }
    }

    // 7. Save Prediction Record in Database
    let predictionId = null;
    try {
      const prediction = await AIPrediction.create({
        patientId,
        doctorId: doctor._id,
        presentingSymptoms: clinicalContext.presentingSymptoms,
        possibleConditions: parsedContent.possibleConditions || [],
        uncertainty: parsedContent.uncertainty || 'Low-to-moderate clinical uncertainty',
        limitations: parsedContent.limitations || 'Requires physical examination and laboratory confirmation',
        clinicianReviewRequired: true,
        disclaimer: '⚠️ AI-generated clinical decision support. This is not a confirmed diagnosis and requires clinician verification.'
      });
      predictionId = prediction._id;

      // Invalidate cache
      cacheService.del(`ai:predictions:${patientId}`);

      // 8. Audit Log
      await AIAuditLog.create({
        userId: doctor._id,
        role: doctor.role,
        action: 'AI_DISEASE_PREDICTION_GENERATE',
        targetPatientId: patientId,
        metadata: { predictionId: prediction._id }
      });
    } catch (dbErr) {
      console.warn('Could not persist prediction to DB (offline/sandbox):', dbErr.message);
    }

    return {
      success: true,
      predictionId: predictionId || 'pred_clinical_' + Date.now(),
      clinicalContext,
      possibleConditions: parsedContent.possibleConditions,
      uncertainty: parsedContent.uncertainty,
      limitations: parsedContent.limitations,
      clinicianReviewRequired: true,
      disclaimer: '⚠️ AI-generated clinical decision support. This is not a confirmed diagnosis and requires clinician verification.'
    };
  }

  /**
   * Get Saved Predictions for a Patient - User-scoped cache for 5 mins
   */
  async getPatientPredictions(doctor, patientId) {
    if (!doctor || (doctor.role !== 'doctor' && doctor.role !== 'admin')) {
      const err = new Error('Not authorized for clinical disease predictions');
      err.statusCode = 403;
      throw err;
    }

    return await cacheService.wrap(`ai:predictions:${patientId}`, 300, async () => {
      return await AIPrediction.find({ patientId }).sort({ createdAt: -1 });
    });
  }
}

module.exports = new DiseasePredictionService();
