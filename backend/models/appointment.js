const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Links to the User model
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  therapistId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  treatment: {
    type: String,
    required: true
  },
  appointment_date: {
    type: Date,
    required: true
  },
  appointment_time: {
    type: String, // e.g., "10:00"
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'in-progress', 'confirmed'],
    default: 'scheduled'
  },
  specialRequirements: {
    type: String
  },
  cost: { type: Number },
  isPaid: { type: Boolean, default: false }
}, { timestamps: true });

appointmentSchema.index({ appointment_date: -1 }, { background: true, name: 'idx_appointments_date_desc' });
appointmentSchema.index({ patientId: 1, appointment_date: -1, status: 1 }, { background: true, name: 'idx_appointments_patient_date_status' });
appointmentSchema.index({ doctorId: 1, appointment_date: -1, status: 1 }, { background: true, name: 'idx_appointments_doctor_date_status' });
appointmentSchema.index({ therapistId: 1, appointment_date: -1, status: 1 }, { background: true, name: 'idx_appointments_therapist_date_status' });

// Lifecycle hooks for automated cache invalidation
appointmentSchema.post('save', function(doc) {
  try {
    const cacheService = require('../services/cache/cacheService');
    cacheService.delPattern('analytics:global*');
    if (doc.doctorId) {
      cacheService.del(`analytics:doctor:${doc.doctorId}`);
      cacheService.delPattern(`availability:${doc.doctorId}:*`);
      cacheService.delPattern(`scheduling:recs:${doc.doctorId}:*`);
    }
    if (doc.therapistId) {
      cacheService.del(`analytics:therapist:${doc.therapistId}`);
      cacheService.delPattern(`availability:${doc.therapistId}:*`);
      cacheService.delPattern(`scheduling:recs:${doc.therapistId}:*`);
    }
    if (doc.patientId) {
      cacheService.del(`analytics:patient:${doc.patientId}`);
    }
  } catch {}
});

appointmentSchema.post(['deleteOne', 'findOneAndDelete'], function() {
  try {
    const cacheService = require('../services/cache/cacheService');
    cacheService.delPattern('analytics:global*');
    cacheService.delPattern('availability:*');
    cacheService.delPattern('scheduling:recs:*');
  } catch {}
});

module.exports = mongoose.model('Appointment', appointmentSchema);