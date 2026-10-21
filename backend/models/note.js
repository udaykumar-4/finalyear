const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  authorId: { // Doctor or Therapist who wrote the note
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  note: {
    type: String,
    required: true
  }
}, { timestamps: true }); // 'createdAt' will be the note date

noteSchema.index({ patientId: 1, createdAt: -1 }, { background: true, name: 'idx_notes_patient_created' });

module.exports = mongoose.model('Note', noteSchema);