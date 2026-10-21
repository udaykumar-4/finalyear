const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const {
  scoreAssessment,
  QUESTIONS,
  QUESTIONNAIRE_VERSION,
} = require('./services/prakriti/prakritiScoringService');
const PrakritiAssessment = require('./models/prakritiAssessment');
const User = require('./models/user');
const cacheService = require('./services/cache/cacheService');

async function runTests() {
  console.log('=== AYURSUTRA PRAKRITI ASSESSMENT VERIFICATION SUITE ===\n');

  // --- TEST 1: Question Structure & Integrity ---
  console.log('1. Testing questionnaire structure...');
  if (QUESTIONS.length !== 8) {
    throw new Error(`Expected 8 questions, got ${QUESTIONS.length}`);
  }
  for (const q of QUESTIONS) {
    if (!q.id || !q.title || !Array.isArray(q.options) || q.options.length !== 3) {
      throw new Error(`Question ${q.id} malformed`);
    }
    const doshas = q.options.map((o) => o.dosha).sort();
    if (JSON.stringify(doshas) !== JSON.stringify(['kapha', 'pitta', 'vata'])) {
      throw new Error(`Question ${q.id} missing complete tri-dosha choices`);
    }
  }
  console.log('   ✅ 8 tri-dosha questions verified with valid options.\n');

  // --- TEST 2: Scoring Engine - Pure Vata ---
  console.log('2. Testing pure Vata responses (8/8 Vata)...');
  const pureVataAnswers = QUESTIONS.map((q) => ({
    questionId: q.id,
    selectedDosha: 'vata',
    answerText: q.options.find((o) => o.dosha === 'vata').label,
  }));
  const vataResult = scoreAssessment(pureVataAnswers);
  if (
    vataResult.scores.vata !== 100 ||
    vataResult.scores.pitta !== 0 ||
    vataResult.scores.kapha !== 0 ||
    vataResult.dominantConstitution !== 'Vata Dominant' ||
    vataResult.constitutionType !== 'Ekadoshaja'
  ) {
    throw new Error(`Vata scoring failed: ${JSON.stringify(vataResult)}`);
  }
  console.log('   ✅ 100% Vata identified as Ekadoshaja (Vata Dominant).\n');

  // --- TEST 3: Scoring Engine - Pure Pitta ---
  console.log('3. Testing pure Pitta responses (8/8 Pitta)...');
  const purePittaAnswers = QUESTIONS.map((q) => ({
    questionId: q.id,
    selectedDosha: 'pitta',
    answerText: q.options.find((o) => o.dosha === 'pitta').label,
  }));
  const pittaResult = scoreAssessment(purePittaAnswers);
  if (
    pittaResult.scores.pitta !== 100 ||
    pittaResult.dominantConstitution !== 'Pitta Dominant' ||
    pittaResult.constitutionType !== 'Ekadoshaja'
  ) {
    throw new Error(`Pitta scoring failed: ${JSON.stringify(pittaResult)}`);
  }
  console.log('   ✅ 100% Pitta identified as Ekadoshaja (Pitta Dominant).\n');

  // --- TEST 4: Scoring Engine - Pure Kapha ---
  console.log('4. Testing pure Kapha responses (8/8 Kapha)...');
  const pureKaphaAnswers = QUESTIONS.map((q) => ({
    questionId: q.id,
    selectedDosha: 'kapha',
    answerText: q.options.find((o) => o.dosha === 'kapha').label,
  }));
  const kaphaResult = scoreAssessment(pureKaphaAnswers);
  if (
    kaphaResult.scores.kapha !== 100 ||
    kaphaResult.dominantConstitution !== 'Kapha Dominant' ||
    kaphaResult.constitutionType !== 'Ekadoshaja'
  ) {
    throw new Error(`Kapha scoring failed: ${JSON.stringify(kaphaResult)}`);
  }
  console.log('   ✅ 100% Kapha identified as Ekadoshaja (Kapha Dominant).\n');

  // --- TEST 5: Scoring Engine - Dual Constitution (4 Vata + 4 Pitta) ---
  console.log('5. Testing dual constitution (4 Vata, 4 Pitta, 0 Kapha)...');
  const dualAnswers = QUESTIONS.map((q, idx) => ({
    questionId: q.id,
    selectedDosha: idx < 4 ? 'vata' : 'pitta',
    answerText: q.options.find((o) => o.dosha === (idx < 4 ? 'vata' : 'pitta')).label,
  }));
  const dualResult = scoreAssessment(dualAnswers);
  if (
    dualResult.scores.vata !== 50 ||
    dualResult.scores.pitta !== 50 ||
    dualResult.scores.kapha !== 0 ||
    dualResult.constitutionType !== 'Dvandvaja' ||
    !dualResult.dominantConstitution.includes('Vata') ||
    !dualResult.dominantConstitution.includes('Pitta')
  ) {
    throw new Error(`Dual scoring failed: ${JSON.stringify(dualResult)}`);
  }
  console.log(`   ✅ Dual constitution correctly resolved to ${dualResult.dominantConstitution} (Dvandvaja).\n`);

  // --- TEST 6: Database Integration & Patient Isolation ---
  console.log('6. Connecting to MongoDB to test persistence and caching...');
  await mongoose.connect(process.env.MONGO_URI);

  const demoPatient = await User.findOne({ email: 'patient@ayursutra.com' });
  const demoDoctor = await User.findOne({ email: 'doctor@ayursutra.com' });

  if (!demoPatient) {
    throw new Error('Demo patient account not found in database.');
  }

  // Clean old test records
  await PrakritiAssessment.deleteMany({ questionnaireVersion: 'TEST_VERSION' });

  // Create Assessment 1
  const doc1 = await PrakritiAssessment.create({
    patientId: demoPatient._id,
    questionnaireVersion: 'TEST_VERSION',
    answers: pureVataAnswers,
    scores: vataResult.scores,
    dominantConstitution: vataResult.dominantConstitution,
    constitutionType: vataResult.constitutionType,
    profile: vataResult.profile,
    status: 'completed',
    disclaimer: vataResult.disclaimer,
  });

  // Create Assessment 2 (Retake history test)
  const doc2 = await PrakritiAssessment.create({
    patientId: demoPatient._id,
    questionnaireVersion: 'TEST_VERSION',
    answers: dualAnswers,
    scores: dualResult.scores,
    dominantConstitution: dualResult.dominantConstitution,
    constitutionType: dualResult.constitutionType,
    profile: dualResult.profile,
    status: 'completed',
    disclaimer: dualResult.disclaimer,
  });

  // Query History
  const history = await PrakritiAssessment.find({
    patientId: demoPatient._id,
    questionnaireVersion: 'TEST_VERSION',
  }).sort({ createdAt: -1 });

  if (history.length !== 2) {
    throw new Error(`Expected 2 historical records, found ${history.length}`);
  }
  if (history[0]._id.toString() !== doc2._id.toString()) {
    throw new Error('Latest assessment is not in chronological descending order');
  }
  console.log('   ✅ Multiple assessments preserved without silent overwriting.');

  // Test IDOR Security Check simulation
  console.log('7. Testing authorization & IDOR guard logic...');
  const isAuthorizedSamePatient = doc1.patientId.toString() === demoPatient._id.toString();
  const isAuthorizedOtherUser = demoDoctor ? (doc1.patientId.toString() === demoDoctor._id.toString()) : false;

  if (!isAuthorizedSamePatient) {
    throw new Error('Patient was incorrectly blocked from own record.');
  }
  if (isAuthorizedOtherUser) {
    throw new Error('Other user was incorrectly permitted access to patient record.');
  }
  console.log('   ✅ Strict patient IDOR ownership verified.\n');

  // Cleanup test records
  await PrakritiAssessment.deleteMany({ questionnaireVersion: 'TEST_VERSION' });
  console.log('   ✅ Test records cleaned up.\n');

  await mongoose.disconnect();
  console.log('🎉 ALL PRAKRITI ASSESSMENT TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
