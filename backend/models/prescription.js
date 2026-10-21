const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const prescriptionSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  therapistId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  treatment: {
    type: String,
    required: true
  },
  duration: { // in days
    type: Number,
    required: true
  },
  plan: { // Detailed plan
    type: String
  },
  notes: { // Doctor's notes
    type: String
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  progressCompleted: { // Number of sessions done
    type: Number,
    default: 0
  }
}, { timestamps: true });

prescriptionSchema.index({ patientId: 1, createdAt: -1, status: 1 }, { background: true, name: 'idx_prescriptions_patient_created_status' });
prescriptionSchema.index({ doctorId: 1 }, { background: true, name: 'idx_prescriptions_doctor' });
prescriptionSchema.index({ therapistId: 1 }, { background: true, name: 'idx_prescriptions_therapist' });

// Lifecycle hooks for automated cache invalidation
prescriptionSchema.post('save', function(doc) {
  try {
    const cacheService = require('../services/cache/cacheService');
    cacheService.delPattern('analytics:global*');
    if (doc.doctorId) cacheService.del(`analytics:doctor:${doc.doctorId}`);
    if (doc.therapistId) cacheService.del(`analytics:therapist:${doc.therapistId}`);
    if (doc.patientId) cacheService.del(`analytics:patient:${doc.patientId}`);
  } catch {}
});

prescriptionSchema.post(['deleteOne', 'findOneAndDelete'], function(doc) {
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

module.exports = mongoose.model('Prescription', prescriptionSchema);