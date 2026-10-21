const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const prakritiAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    category: { type: String },
    title: { type: String },
    selectedDosha: { type: String, enum: ['vata', 'pitta', 'kapha'], required: true },
    answerText: { type: String, required: true },
  },
  { _id: false }
);

const prakritiAssessmentSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionnaireVersion: {
      type: String,
      default: '1.0.0',
    },
    scoringMethodologyVersion: {
      type: String,
      default: 'classical-samhita-v1',
    },
    answers: {
      type: [prakritiAnswerSchema],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        'Assessment must contain recorded answers.',
      ],
    },
    scores: {
      vata: { type: Number, required: true, min: 0, max: 100 },
      pitta: { type: Number, required: true, min: 0, max: 100 },
      kapha: { type: Number, required: true, min: 0, max: 100 },
      rawCounts: {
        vata: { type: Number, default: 0 },
        pitta: { type: Number, default: 0 },
        kapha: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
    },
    dominantConstitution: {
      type: String,
      required: true,
    },
    constitutionType: {
      type: String,
      enum: ['Ekadoshaja', 'Dvandvaja', 'Sama'],
      default: 'Ekadoshaja',
    },
    profile: {
      element: { type: String },
      qualities: { type: String },
      summary: { type: String },
      diet: [{ type: String }],
      lifestyle: [{ type: String }],
      seasonal: { type: String },
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'completed',
    },
    disclaimer: {
      type: String,
    },
  },
  { timestamps: true }
);

// High-speed compound queries for patient's chronological history
prakritiAssessmentSchema.index(
  { patientId: 1, createdAt: -1 },
  { background: true, name: 'idx_prakriti_patient_created' }
);

// Automated Cache Invalidation on Save / Delete
prakritiAssessmentSchema.post('save', function (doc) {
  try {
    const cacheService = require('../services/cache/cacheService');
    cacheService.del(`prakriti:patient:${doc.patientId}:latest`);
    cacheService.del(`prakriti:patient:${doc.patientId}:history`);
    cacheService.delPattern('analytics:global*');
  } catch {}
});

prakritiAssessmentSchema.post(['deleteOne', 'findOneAndDelete'], function (doc) {
  try {
    const cacheService = require('../services/cache/cacheService');
    if (doc && doc.patientId) {
      cacheService.del(`prakriti:patient:${doc.patientId}:latest`);
      cacheService.del(`prakriti:patient:${doc.patientId}:history`);
    }
    cacheService.delPattern('analytics:global*');
  } catch {}
});

module.exports = mongoose.model('PrakritiAssessment', prakritiAssessmentSchema);
