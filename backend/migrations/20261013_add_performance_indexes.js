/**
 * Migration: 20261013_add_performance_indexes.js
 *
 * Purpose:
 *   Prepare AyurSutra MongoDB database for high user and data volume without changing
 *   application behavior. Adds targeted single-column and compound B-tree indexes strictly
 *   for columns used in WHERE filters, populate/JOIN lookups, and ORDER BY (.sort()) clauses.
 *
 * Non-Blocking Execution (Live Production Safety):
 *   - Uses `{ background: true }` (MongoDB 4.2+ hybrid non-blocking index build), which
 *     allows concurrent reads and writes while indexes build, matching the behavior of
 *     PostgreSQL's `CREATE INDEX CONCURRENTLY`.
 *   - Equivalent PostgreSQL DDL statements are included in comments alongside each index
 *     for cross-database architectural review.
 *
 * Usage:
 *   Apply migration:    node migrations/20261013_add_performance_indexes.js up
 *   Rollback migration: node migrations/20261013_add_performance_indexes.js down
 *   Check status:       node migrations/20261013_add_performance_indexes.js status
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

/**
 * Targeted Index Specifications
 * Following the ESR (Equality, Sort, Range) and leftmost-prefix rules to minimize total indexes.
 */
const INDEX_DEFINITIONS = [
  // 1. USERS COLLECTION
  {
    collection: 'users',
    name: 'idx_users_role',
    key: { role: 1 },
    options: { background: true, name: 'idx_users_role' },
    queryTarget: "User.find({ role }) in getAllUsers (userController.js) & getGlobalOutcomes (outcomeAnalyticsService.js)",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_users_role ON users (role);"
  },

  // 2. APPOINTMENTS COLLECTION
  {
    collection: 'appointments',
    name: 'idx_appointments_date_desc',
    key: { appointment_date: -1 },
    options: { background: true, name: 'idx_appointments_date_desc' },
    queryTarget: "Appointment.find({}).sort({ appointment_date: -1 }) in getAppointments (Admin view)",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_appointments_date_desc ON appointments (appointment_date DESC);"
  },
  {
    collection: 'appointments',
    name: 'idx_appointments_patient_date_status',
    key: { patientId: 1, appointment_date: -1, status: 1 },
    options: { background: true, name: 'idx_appointments_patient_date_status' },
    queryTarget: "Appointment.find({ patientId }).sort({ appointment_date: -1 }), Appointment.findOne({ patientId, status: 'scheduled' }).sort({ appointment_date: 1 }), and Appointment.exists({ patientId, doctorId/therapistId })",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_appointments_patient_date_status ON appointments (patient_id, appointment_date DESC, status);"
  },
  {
    collection: 'appointments',
    name: 'idx_appointments_doctor_date_status',
    key: { doctorId: 1, appointment_date: -1, status: 1 },
    options: { background: true, name: 'idx_appointments_doctor_date_status' },
    queryTarget: "Appointment.find({ doctorId }).sort({ appointment_date: -1 }) and $or doctorId branch in smartSchedulingService.checkConflict & getAvailability",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_appointments_doctor_date_status ON appointments (doctor_id, appointment_date DESC, status);"
  },
  {
    collection: 'appointments',
    name: 'idx_appointments_therapist_date_status',
    key: { therapistId: 1, appointment_date: -1, status: 1 },
    options: { background: true, name: 'idx_appointments_therapist_date_status' },
    queryTarget: "Appointment.find({ therapistId }).sort({ appointment_date: -1 }) and $or therapistId branch in smartSchedulingService.checkConflict & getAvailability",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_appointments_therapist_date_status ON appointments (therapist_id, appointment_date DESC, status);"
  },

  // 3. PRESCRIPTIONS COLLECTION
  {
    collection: 'prescriptions',
    name: 'idx_prescriptions_patient_created_status',
    key: { patientId: 1, createdAt: -1, status: 1 },
    options: { background: true, name: 'idx_prescriptions_patient_created_status' },
    queryTarget: "Prescription.find({ patientId }).sort({ createdAt: -1 }), Prescription.findOne({ patientId, status: 'in-progress' }), and Prescription.exists({ patientId, doctorId/therapistId })",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_prescriptions_patient_created_status ON prescriptions (patient_id, created_at DESC, status);"
  },
  {
    collection: 'prescriptions',
    name: 'idx_prescriptions_doctor',
    key: { doctorId: 1 },
    options: { background: true, name: 'idx_prescriptions_doctor' },
    queryTarget: "Prescription.find({ doctorId }) in getPrescriptionsForDoctor & getDoctorOutcomes",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_prescriptions_doctor ON prescriptions (doctor_id);"
  },
  {
    collection: 'prescriptions',
    name: 'idx_prescriptions_therapist',
    key: { therapistId: 1 },
    options: { background: true, name: 'idx_prescriptions_therapist' },
    queryTarget: "Prescription.find({ therapistId }) in getPrescriptionsForTherapist & getTherapistOutcomes",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_prescriptions_therapist ON prescriptions (therapist_id);"
  },

  // 4. FEEDBACKS COLLECTION
  {
    collection: 'feedbacks',
    name: 'idx_feedbacks_doctor_created',
    key: { doctorId: 1, createdAt: -1 },
    options: { background: true, name: 'idx_feedbacks_doctor_created' },
    queryTarget: "Feedback.find({ doctorId }).sort({ createdAt: -1 }) in getFeedbackForDoctor & getDoctorOutcomes",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_feedbacks_doctor_created ON feedbacks (doctor_id, created_at DESC);"
  },
  {
    collection: 'feedbacks',
    name: 'idx_feedbacks_therapist_created',
    key: { therapistId: 1, createdAt: -1 },
    options: { background: true, name: 'idx_feedbacks_therapist_created' },
    queryTarget: "Feedback.find({ therapistId }).sort({ createdAt: -1 }) in getFeedbackForTherapist & getTherapistOutcomes",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_feedbacks_therapist_created ON feedbacks (therapist_id, created_at DESC);"
  },
  {
    collection: 'feedbacks',
    name: 'idx_feedbacks_patient',
    key: { patientId: 1 },
    options: { background: true, name: 'idx_feedbacks_patient' },
    queryTarget: "Feedback.find({ patientId }) in outcomeAnalyticsService.getPatientOutcomes",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_feedbacks_patient ON feedbacks (patient_id);"
  },

  // 5. NOTES COLLECTION
  {
    collection: 'notes',
    name: 'idx_notes_patient_created',
    key: { patientId: 1, createdAt: -1 },
    options: { background: true, name: 'idx_notes_patient_created' },
    queryTarget: "Note.find({ patientId }).sort({ createdAt: -1 }) in getNotesForPatient, getPatientReport, & diseasePredictionService",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_notes_patient_created ON notes (patient_id, created_at DESC);"
  },

  // 6. DOCUMENTS COLLECTION
  {
    collection: 'documents',
    name: 'idx_documents_patient_created',
    key: { patientId: 1, createdAt: -1 },
    options: { background: true, name: 'idx_documents_patient_created' },
    queryTarget: "Document.find({ patientId }).sort({ createdAt: -1 }) in GET /api/documents",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_documents_patient_created ON documents (patient_id, created_at DESC);"
  },

  // 7. CHAT CONVERSATIONS COLLECTION
  {
    collection: 'chatconversations',
    name: 'idx_chatconversations_user_updated',
    key: { userId: 1, updatedAt: -1 },
    options: { background: true, name: 'idx_chatconversations_user_updated' },
    queryTarget: "ChatConversation.find({ userId }).sort({ updatedAt: -1 }) in chatbotService.getUserHistory",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_chatconversations_user_updated ON chatconversations (user_id, updated_at DESC);"
  },

  // 8. AI PREDICTIONS COLLECTION
  {
    collection: 'aipredictions',
    name: 'idx_aipredictions_patient_created',
    key: { patientId: 1, createdAt: -1 },
    options: { background: true, name: 'idx_aipredictions_patient_created' },
    queryTarget: "AIPrediction.find({ patientId }).sort({ createdAt: -1 }) in diseasePredictionService.getPatientPredictions",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_aipredictions_patient_created ON aipredictions (patient_id, created_at DESC);"
  },

  // 9. AI RECOMMENDATIONS COLLECTION
  {
    collection: 'airecommendations',
    name: 'idx_airecommendations_patient_created',
    key: { patientId: 1, createdAt: -1 },
    options: { background: true, name: 'idx_airecommendations_patient_created' },
    queryTarget: "AIRecommendation.find({ patientId }).sort({ createdAt: -1 }) in treatmentRecommendationService.getPatientRecommendations",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_airecommendations_patient_created ON airecommendations (patient_id, created_at DESC);"
  },

  // 10. PATIENT TREATMENT RECOMMENDATIONS COLLECTION
  // Replaces redundant single-column index `patientId_1` with compound `{ patientId: 1, createdAt: -1 }`
  {
    collection: 'patienttreatmentrecommendations',
    name: 'idx_patienttreatmentrecs_patient_created',
    key: { patientId: 1, createdAt: -1 },
    options: { background: true, name: 'idx_patienttreatmentrecs_patient_created' },
    queryTarget: "PatientTreatmentRecommendation.find({ patientId }).sort({ createdAt: -1 }) in getPatientRecommendations",
    sqlEquivalent: "CREATE INDEX CONCURRENTLY idx_patienttreatmentrecs_patient_created ON patienttreatmentrecommendations (patient_id, created_at DESC);"
  }
];

// Redundant/unused single-column index superseded by compound prefix index
const OBSOLETE_INDEXES = [
  {
    collection: 'patienttreatmentrecommendations',
    name: 'patientId_1',
    key: { patientId: 1 },
    reason: '0 index accesses recorded in $indexStats and superseded by compound index idx_patienttreatmentrecs_patient_created ({ patientId: 1, createdAt: -1 })'
  }
];

async function up(existingDb = null) {
  const shouldClose = !existingDb;
  if (!existingDb) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  const db = existingDb || mongoose.connection.db;

  console.log('--- Applying Database Index Migration (UP) ---');

  // 1. Create all targeted performance indexes non-blockingly
  for (const def of INDEX_DEFINITIONS) {
    const col = db.collection(def.collection);
    await col.createIndex(def.key, def.options);
    console.log(`[CREATED] ${def.collection}.${def.name} -> ${JSON.stringify(def.key)}`);
  }

  // 2. Drop redundant/unused single-column indexes that are now covered by compound prefixes
  for (const obs of OBSOLETE_INDEXES) {
    const col = db.collection(obs.collection);
    const existing = await col.indexes();
    if (existing.some(i => i.name === obs.name)) {
      await col.dropIndex(obs.name);
      console.log(`[DROPPED REDUNDANT] ${obs.collection}.${obs.name} (${obs.reason})`);
    }
  }

  console.log('--- Migration UP Complete ---');

  if (shouldClose) {
    await mongoose.disconnect();
  }
}

async function down(existingDb = null) {
  const shouldClose = !existingDb;
  if (!existingDb) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  const db = existingDb || mongoose.connection.db;

  console.log('--- Rolling Back Database Index Migration (DOWN) ---');

  // 1. Restore previously dropped single-column index
  for (const obs of OBSOLETE_INDEXES) {
    const col = db.collection(obs.collection);
    await col.createIndex(obs.key, { background: true, name: obs.name });
    console.log(`[RESTORED] ${obs.collection}.${obs.name} -> ${JSON.stringify(obs.key)}`);
  }

  // 2. Drop all indexes added by this migration
  for (const def of INDEX_DEFINITIONS) {
    const col = db.collection(def.collection);
    const existing = await col.indexes();
    if (existing.some(i => i.name === def.name)) {
      await col.dropIndex(def.name);
      console.log(`[DROPPED] ${def.collection}.${def.name}`);
    }
  }

  console.log('--- Migration DOWN Complete ---');

  if (shouldClose) {
    await mongoose.disconnect();
  }
}

async function status(existingDb = null) {
  const shouldClose = !existingDb;
  if (!existingDb) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  const db = existingDb || mongoose.connection.db;

  console.log('--- Database Index Migration Status ---');
  for (const def of INDEX_DEFINITIONS) {
    const col = db.collection(def.collection);
    const existing = await col.indexes();
    const present = existing.some(i => i.name === def.name);
    console.log(`${present ? '[APPLIED]' : '[PENDING]'} ${def.collection}.${def.name} ${JSON.stringify(def.key)}`);
  }

  if (shouldClose) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  const action = (process.argv[2] || 'status').toLowerCase();
  const runner = action === 'up' ? up : action === 'down' ? down : status;
  runner().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
}

module.exports = { up, down, status, INDEX_DEFINITIONS, OBSOLETE_INDEXES };
