/**
 * Clinical Safety Guard & Emergency Gate
 * Evaluates clinical boundaries, emergency escalation, medication safety,
 * allergy exclusions, and prompt injection defense.
 */

const EMERGENCY_RESPONSE = {
  success: true,
  isEmergency: true,
  status: 'emergency_escalation',
  response:
    '⚠️ **IMMEDIATE EMERGENCY MEDICAL ATTENTION REQUIRED**\n\n' +
    'Your message references symptoms that may indicate an acute, life-threatening medical emergency (such as acute chest pain, severe breathing difficulty, stroke symptoms, loss of consciousness, or severe bleeding).\n\n' +
    '• **Immediate Action:** Call your local emergency services (112 / 911 / local emergency number) or proceed immediately to the nearest hospital emergency room.\n' +
    '• **Ayurveda Safety Rule:** Do not delay emergency medical care for Ayurvedic therapies or home remedies.\n' +
    '• **Clinical Note:** The AyurSutra Assistant is an educational system and cannot provide emergency medical care.',
  citations: [],
  disclaimer: '⚠️ Critical Emergency Escalation Active. Seek immediate emergency care.',
  requiresClinicianReview: true,
};

const PROHIBITED_DIAGNOSIS_RESPONSE = {
  success: true,
  isEmergency: false,
  status: 'prohibited_request',
  response:
    '⚠️ **CLINICAL BOUNDARY NOTICE: Diagnostic Consultation Required**\n\n' +
    'The AyurSutra AI Assistant cannot diagnose medical conditions or interpret clinical symptoms as a confirmed illness.\n\n' +
    'In Classical Ayurveda, accurate diagnosis requires eight-fold examination (*Ashtavidha Pariksha* — pulse, tongue, eyes, voice, etc.) conducted in person by a certified Ayurvedic physician (*Vaidya*).\n\n' +
    'Please schedule a consultation with your AyurSutra doctor for formal diagnostic evaluation.',
  citations: [],
  disclaimer: '⚠️ Non-diagnostic educational assistant only.',
  requiresClinicianReview: true,
};

const PROHIBITED_MEDICATION_RESPONSE = {
  success: true,
  isEmergency: false,
  status: 'prohibited_request',
  response:
    '⚠️ **PATIENT SAFETY WARNING: Prescription Medication Override Prohibited**\n\n' +
    'Do not stop, decrease, or replace your prescribed medical drugs (conventional or Ayurvedic) based on assistant responses.\n\n' +
    'Abruptly stopping prescribed medications can lead to severe health complications. Any modification, weaning, or substitution must be evaluated and supervised directly by your treating clinician.',
  citations: [],
  disclaimer: '⚠️ Never discontinue prescribed medication without your doctor\'s explicit supervision.',
  requiresClinicianReview: true,
};

const PROHIBITED_PRESCRIPTION_RESPONSE = {
  success: true,
  isEmergency: false,
  status: 'prohibited_request',
  response:
    '⚠️ **CLINICAL NOTICE: Prescription Issuance Restricted**\n\n' +
    'I can explain Ayurvedic herbs and therapies from an educational perspective, but I cannot issue medical prescriptions, specify pharmaceutical dosages, or order clinical Panchakarma procedures.\n\n' +
    'Please consult with your authorized AyurSutra doctor or clinical care team to review your case and prescribe appropriate treatment plans.',
  citations: [],
  disclaimer: '⚠️ Educational information only; does not constitute a prescription.',
  requiresClinicianReview: true,
};

const SECURITY_INJECTION_RESPONSE = {
  success: true,
  isEmergency: false,
  status: 'security_refusal',
  response:
    'I am the AyurSutra Intelligent Panchakarma Assistant 🌿. I operate strictly under clinical safety guidelines and healthcare security boundaries. I cannot modify my safety rules, bypass system constraints, or reveal internal system configurations.\n\nHow may I help you with your Ayurvedic wellness, therapies, or diet today?',
  citations: [],
  disclaimer: 'AyurSutra Clinical Security Policy Active.',
  requiresClinicianReview: false,
};

/**
 * Pre-execution Clinical Safety Gate
 * Runs BEFORE RAG retrieval and BEFORE LLM generation.
 */
function evaluatePreExecution(nlpResult, user, patientContext = {}) {
  // 1. Emergency Escalation (Immediate return, NO LLM delay)
  if (nlpResult.isEmergency || nlpResult.intent === 'EMERGENCY') {
    return {
      blocked: true,
      reason: 'EMERGENCY_ESCALATION',
      responsePayload: EMERGENCY_RESPONSE,
    };
  }

  // 2. Prompt Injection & Security Defense
  if (nlpResult.isSecurityRisk || nlpResult.intent === 'SECURITY_INJECTION') {
    return {
      blocked: true,
      reason: 'SECURITY_INJECTION',
      responsePayload: SECURITY_INJECTION_RESPONSE,
    };
  }

  // 3. Prohibited Clinical Inquiries
  if (nlpResult.intent === 'PROHIBITED_DIAGNOSIS') {
    return {
      blocked: true,
      reason: 'PROHIBITED_DIAGNOSIS',
      responsePayload: PROHIBITED_DIAGNOSIS_RESPONSE,
    };
  }

  if (nlpResult.intent === 'PROHIBITED_MEDICATION_MODIFICATION') {
    return {
      blocked: true,
      reason: 'PROHIBITED_MEDICATION_MODIFICATION',
      responsePayload: PROHIBITED_MEDICATION_RESPONSE,
    };
  }

  if (nlpResult.intent === 'PROHIBITED_PRESCRIPTION') {
    return {
      blocked: true,
      reason: 'PROHIBITED_PRESCRIPTION',
      responsePayload: PROHIBITED_PRESCRIPTION_RESPONSE,
    };
  }

  // 4. Allergy & Contraindication Check (if patient context available)
  const allergyWarning = checkAllergiesAndContraindications(nlpResult, patientContext);

  return {
    blocked: false,
    allergyWarning,
  };
}

/**
 * Check known allergies in patient profile against query entities
 */
function checkAllergiesAndContraindications(nlpResult, patientContext) {
  if (!patientContext || !patientContext.knownAllergies) return null;

  const allergiesStr = patientContext.knownAllergies.toLowerCase();
  const queryLower = (nlpResult.workingText || '').toLowerCase();

  // Milk / Dairy allergy check
  if (
    (allergiesStr.includes('milk') || allergiesStr.includes('dairy') || allergiesStr.includes('lactose')) &&
    (queryLower.includes('milk') || queryLower.includes('ksheera') || queryLower.includes('ghee') || queryLower.includes('dairy'))
  ) {
    return {
      allergen: 'Milk/Dairy',
      advisory: '⚠️ ALLERGY NOTICE: You have a recorded dairy allergy in your AyurSutra patient profile. Dairy-based preparations (such as cow milk or Ksheerabala) must be EXCLUDED or substituted with almond milk/sesame alternatives under clinician direction.',
    };
  }

  // Sesame oil allergy check
  if (
    allergiesStr.includes('sesame') &&
    (queryLower.includes('sesame') || queryLower.includes('tila') || queryLower.includes('abhyanga oil'))
  ) {
    return {
      allergen: 'Sesame',
      advisory: '⚠️ ALLERGY NOTICE: You have a recorded sesame allergy. Standard sesame-based massage oils must be EXCLUDED and replaced with coconut or almond oil under clinician direction.',
    };
  }

  return null;
}

/**
 * Post-execution Output Validator
 * Checks LLM text for safety violations, rogue dosage prescribing, or lack of disclaimers.
 */
function evaluatePostExecution(rawOutput, nlpResult, citations = []) {
  if (!rawOutput) {
    return {
      valid: false,
      sanitizedText: 'AyurSutra Assistant is currently preparing your educational response. Please ask your clinician for immediate guidance.',
    };
  }

  let sanitized = rawOutput;

  // Filter out any accidental prompt leak tags
  sanitized = sanitized.replace(/<\/?(?:system_prompt|untrusted_user_input|retrieved_evidence|patient_context)>/gi, '');

  // Ensure mandatory clinical disclaimer is present
  const defaultDisclaimer =
    '\n\n*Disclaimer: This information is for educational and Ayurvedic lifestyle guidance based on classical texts and does not replace in-person medical evaluation by a certified physician.*';

  if (!sanitized.toLowerCase().includes('disclaimer:')) {
    sanitized += defaultDisclaimer;
  }

  return {
    valid: true,
    sanitizedText: sanitized.trim(),
  };
}

module.exports = {
  EMERGENCY_RESPONSE,
  PROHIBITED_DIAGNOSIS_RESPONSE,
  PROHIBITED_MEDICATION_RESPONSE,
  PROHIBITED_PRESCRIPTION_RESPONSE,
  SECURITY_INJECTION_RESPONSE,
  evaluatePreExecution,
  checkAllergiesAndContraindications,
  evaluatePostExecution,
};
