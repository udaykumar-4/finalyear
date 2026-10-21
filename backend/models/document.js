const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  fileData: {
    type: String,
    required: true
  }
}, { timestamps: true });

documentSchema.index({ patientId: 1, createdAt: -1 }, { background: true, name: 'idx_documents_patient_created' });

module.exports = mongoose.model('Document', documentSchema);
