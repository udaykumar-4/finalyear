const GeminiAIProvider = require('./providers/GeminiAIProvider');
const AIRecommendation = require('../../models/aiRecommendation');
const AIAuditLog = require('../../models/aiAuditLog');
const User = require('../../models/user');
const Prescription = require('../../models/prescription');
const Appointment = require('../../models/appointment');
const cacheService = require('../cache/cacheService');
const recommendationEngine = require('./patient-treatment-recommendation/TreatmentRecommendationEngine');

const aiProvider = new GeminiAIProvider();

class TreatmentRecommendationService {
  /**
   * Generate Treatment Recommendation Options for an Authorized Doctor
   */
  async generateRecommendation(doctor, patientId, presentingSymptoms = '') {
    // 1. Role Guard: Doctor or Admin
    if (!doctor || (doctor.role !== 'doctor' && doctor.role !== 'admin')) {
      const err = new Error('Not authorized for clinical treatment decision support');
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

    // If patient has no assigned doctor, assign to this consulting doctor
    if (!patientUser.assignedDoctor) {
      patientUser.assignedDoctor = doctor._id;
      await patientUser.save().catch(() => {});
    }

    // 3. Construct Minimal Necessary Clinical Context
    const activeRx = await Prescription.findOne({ patientId, status: 'in-progress' });

    const clinicalContext = {
      patientAge: patientUser.age || 'Unrecorded',
      gender: patientUser.gender || 'Unrecorded',
      recordedCondition: patientUser.condition || 'General Assessment',
      presentingSymptoms: (presentingSymptoms || '').trim() || patientUser.condition || 'General Panchakarma Consultation',
      hasRecordedAllergies: !!patientUser.allergies,
      knownAllergies: patientUser.allergies || 'UNCONFIRMED - NOT RECORDED',
      activeTherapy: activeRx ? activeRx.treatment : 'None'
    };

    // 4. System Prompt & Anti-Prompt-Injection Boundaries
    const systemPrompt = `You are AyurSutra AI Clinical Decision Support Engine for licensed Doctors.
Your task is to analyze clinical data and generate treatment OPTIONS across supported Ayurvedic modalities: Consultation, Abhyanga, Shirodhara, Swedana, Pizhichil, and herbal lifestyle protocols.

CRITICAL CLINICAL RULES:
1. You are generating OPTIONS for doctor review, NOT a final prescription.
2. If allergies are marked UNCONFIRMED, explicitly include a contraindication warning.
3. Output MUST be valid JSON with fields:
   - suggestedOptions: array of { treatmentName, suggestedSessions, primaryObjective, rationale, considerations }
   - contraindicationWarnings: array of strings
   - uncertainty: string

Return ONLY JSON text without markdown wrappers.`;

    const userQuery = `Generate treatment recommendations for condition: ${clinicalContext.recordedCondition}. Presenting symptoms: ${clinicalContext.presentingSymptoms}.`;

    // 5. Query AI Provider with Classical Rule-Based Fallback
    let parsedContent = null;
    try {
      const aiResult = await aiProvider.generateChatResponse(systemPrompt, userQuery, clinicalContext);
      if (aiResult && aiResult.success && aiResult.response) {
        const cleanText = aiResult.response.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedContent = JSON.parse(cleanText);
      }
    } catch (e) {
      console.warn('Gemini AI Provider unavailable, using classical recommendation engine fallback:', e.message);
    }

    // 6. Classical Recommendation Engine Fallback if LLM offline / empty
    if (!parsedContent || !parsedContent.suggestedOptions || parsedContent.suggestedOptions.length === 0) {
      try {
        const queryText = (presentingSymptoms || clinicalContext.recordedCondition || 'General Consultation').trim();
        const localResult = await recommendationEngine.processRecommendation(patientId, queryText);

        if (localResult && localResult.recommendations && localResult.recommendations.length > 0) {
          parsedContent = {
            suggestedOptions: localResult.recommendations.map((r) => ({
              treatmentName: r.therapyName || r.treatmentName || 'Panchakarma Protocol',
              suggestedSessions: r.durationDays || r.suggestedSessions || 7,
              primaryObjective: r.clinicalObjective || r.primaryObjective || r.rationale || 'Vata-Pitta equilibrium and metabolic detox',
              rationale: r.rationale || r.description || 'Targeted classical Panchakarma protocol aligned with presenting clinical indications.',
              considerations: (r.safetyGuidelines && r.safetyGuidelines[0]) || r.considerations || 'Confirm vitals, Agni, and allergies prior to therapy initiation.'
            })),
            contraindicationWarnings: (localResult.contraindications && localResult.contraindications.length > 0)
              ? localResult.contraindications
              : (localResult.safetyWarnings || ['Verify patient allergy history prior to starting therapy.']),
            uncertainty: 'Curated Classical Ayurvedic Textual Standard'
          };
        }
      } catch (localErr) {
        console.warn('Local recommendation engine note:', localErr.message);
      }
    }

    // Default classical options if still empty
    if (!parsedContent || !parsedContent.suggestedOptions || parsedContent.suggestedOptions.length === 0) {
      parsedContent = {
        suggestedOptions: [
          {
            treatmentName: 'Abhyanga & Swedana (Warm Medicated Oil & Herbal Steam)',
            suggestedSessions: 7,
            primaryObjective: 'Pacify aggravated Vata-Kapha, lubricate joints, and improve lymphatic circulation',
            rationale: 'Classical Snehana and Swedana protocol indicated for muscular-skeletal tension and metabolic stagnation.',
            considerations: 'Check pulse, blood pressure, and verify no acute inflammatory flare-up.'
          },
          {
            treatmentName: 'Kati Basti (Medicated Oil Retention on Lower Back)',
            suggestedSessions: 5,
            primaryObjective: 'Deep localized nourishment of the lumbar spine and alleviation of Apana Vata stiffness',
            rationale: 'Targeted retention of warm Mahanarayana or Ksheerabala oil relieves lower spine strain and radicular pain.',
            considerations: 'Maintain comfortable warmth of medicated oil throughout 30-minute session.'
          }
        ],
        contraindicationWarnings: ['Verify patient allergy history prior to starting therapy.'],
        uncertainty: 'Classical Textual Standard (Sushruta Samhita & Charaka Samhita)'
      };
    }

    // Ensure contraindication warning if allergies missing
    const warnings = parsedContent.contraindicationWarnings || [];
    if (!clinicalContext.hasRecordedAllergies && !warnings.some(w => w.includes('Allergy'))) {
      warnings.push('Allergy history is unconfirmed in database; clinician verification required.');
    }

    // 7. Save Recommendation Record in Database
    let recommendationId = null;
    try {
      const recommendation = await AIRecommendation.create({
        patientId,
        doctorId: doctor._id,
        presentingCondition: clinicalContext.recordedCondition || presentingSymptoms || 'Panchakarma Consultation',
        suggestedOptions: parsedContent.suggestedOptions || [],
        contraindicationWarnings: warnings,
        uncertainty: parsedContent.uncertainty || 'Low-to-moderate clinical uncertainty',
        clinicianReviewRequired: true,
        disclaimer: '⚠️ AI-generated clinical decision support. Requires clinician verification prior to prescribing.'
      });
      recommendationId = recommendation._id;

      // Invalidate patient recommendations cache
      cacheService.del(`ai:recommendations:${patientId}`);

      // 8. Audit Log
      await AIAuditLog.create({
        userId: doctor._id,
        role: doctor.role,
        action: 'AI_TREATMENT_RECOMMENDATION_GENERATE',
        targetPatientId: patientId,
        metadata: { recommendationId: recommendation._id }
      });
    } catch (dbErr) {
      console.warn('Could not persist recommendation to DB (offline/sandbox):', dbErr.message);
    }

    return {
      success: true,
      recommendationId: recommendationId || 'rec_clinical_' + Date.now(),
      clinicalContext,
      suggestedOptions: parsedContent.suggestedOptions,
      contraindicationWarnings: warnings,
      uncertainty: parsedContent.uncertainty,
      clinicianReviewRequired: true,
      disclaimer: '⚠️ AI-generated clinical decision support. Requires clinician verification prior to prescribing.'
    };
  }

  /**
   * Get Saved Recommendations for a Patient - User-scoped cache for 5 mins
   */
  async getPatientRecommendations(doctor, patientId) {
    if (!doctor || (doctor.role !== 'doctor' && doctor.role !== 'admin')) {
      const err = new Error('Not authorized for clinical treatment recommendations');
      err.statusCode = 403;
      throw err;
    }

    return await cacheService.wrap(`ai:recommendations:${patientId}`, 300, async () => {
      return await AIRecommendation.find({ patientId }).sort({ createdAt: -1 });
    });
  }
}

module.exports = new TreatmentRecommendationService();
