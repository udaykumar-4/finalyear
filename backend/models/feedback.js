const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  // --- Doctor Feedback ---
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorRating: {
    type: Number,
    min: 1,
    max: 5
  },
  doctorFeedback: {
    type: String,
    trim: true
  },
  // --- Therapist Feedback ---
  therapistId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  therapistRating: {
    type: Number,
    min: 1,
    max: 5
  },
  therapistFeedback: {
    type: String,
    trim: true
  },
  // --- Overall Feedback ---
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  overallFeedback: {
    type: String,
    trim: true
  },
}, { timestamps: true });

feedbackSchema.index({ doctorId: 1, createdAt: -1 }, { background: true, name: 'idx_feedbacks_doctor_created' });
feedbackSchema.index({ therapistId: 1, createdAt: -1 }, { background: true, name: 'idx_feedbacks_therapist_created' });
feedbackSchema.index({ patientId: 1 }, { background: true, name: 'idx_feedbacks_patient' });

// Lifecycle hooks for automated cache invalidation
feedbackSchema.post('save', function(doc) {
  try {
    const cacheService = require('../services/cache/cacheService');
    cacheService.delPattern('analytics:global*');
    if (doc.doctorId) cacheService.del(`analytics:doctor:${doc.doctorId}`);
    if (doc.therapistId) cacheService.del(`analytics:therapist:${doc.therapistId}`);
    if (doc.patientId) cacheService.del(`analytics:patient:${doc.patientId}`);
  } catch {}
});

feedbackSchema.post(['deleteOne', 'findOneAndDelete'], function(doc) {
  try {
    const cacheService = require('../services/cache/cacheService');
    cacheService.delPattern('analytics:global*');
    if (doc) {
      if (doc.doctorId) cacheService.del(`analytics:doctor:${doc.doctorId}`);
      if (doc.therapistId) cacheService.del(`analytics:therapist:${doc.therapistId}`);
      if (doc.patientId) cacheService.del(`analytics:patient:${doc.patientId}`);
    }
  } catch {}
});

module.exports = mongoose.model('Feedback', feedbackSchema);