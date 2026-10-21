const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recommendationOptionSchema = new Schema({
  therapyName: { type: String, required: true },
  category: { type: String, default: 'Panchakarma Procedure' },
  objective: { type: String },
  traditionalRationale: { type: String },
  suggestedDuration: { type: String },
  suggestedSessions: { type: String },
  precautions: [{ type: String }],
  contraindications: [{ type: String }],
  confidence: { type: String, default: 'high' },
  educationalOnly: { type: Boolean, default: true },
  requiresClinicianReview: { type: Boolean, default: true }
}, { _id: false });

const classicalReferenceSchema = new Schema({
  source: { type: String },
  title: { type: String },
  text: { type: String },
  evidenceLevel: { type: String }
}, { _id: false });

const patientTreatmentRecommendationSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  quickSelections: [{ type: String }],
  recommendations: [recommendationOptionSchema],
  safetyWarnings: [{ type: String }],
  contraindications: [{ type: String }],
  classicalReferences: [classicalReferenceSchema],
  educationalOnly: {
    type: Boolean,
    default: true
  },
  requiresClinicianReview: {
    type: Boolean,
    default: true
  },
  disclaimer: {
    type: String,
    default: '⚠️ AI-generated educational treatment recommendations. Requires clinician evaluation prior to starting therapy.'
  }
}, { timestamps: true });

patientTreatmentRecommendationSchema.index({ patientId: 1, createdAt: -1 }, { background: true, name: 'idx_patienttreatmentrecs_patient_created' });

module.exports = mongoose.model('PatientTreatmentRecommendation', patientTreatmentRecommendationSchema);
