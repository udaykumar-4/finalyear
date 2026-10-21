/**
 * NLP Intent Classifier
 * Evaluates user message using pattern matching, linguistic cues,
 * entity presence, and confidence scoring.
 */

const { normalizeText } = require('./textNormalizer');

// Critical Emergency Triggers
const EMERGENCY_PATTERNS = [
  'chest pain', 'chest pressure', 'difficulty breathing', 'shortness of breath',
  'cant breathe', 'cannot breathe', 'unconscious', 'loss of consciousness',
  'fainted', 'heavy bleeding', 'severe bleeding', 'seizure', 'severe allergic reaction',
  'anaphylaxis', 'sudden weakness', 'stroke', 'face drooping', 'suicidal', 'self harm',
  'vomiting blood', 'severe head trauma', 'poisoning', 'overdose'
];

// Prohibited Clinical Requests
const PROHIBITED_DIAGNOSIS_PATTERNS = [
  'diagnose me', 'what disease do i have', 'do i have diabetes', 'confirm my diagnosis',
  'tell me what illness i have', 'do i have cancer', 'what is wrong with me medically'
];

const PROHIBITED_MEDICATION_PATTERNS = [
  'stop my medicine', 'stop my medication', 'replace my prescription', 'stop taking my pills',
  'can i discontinue my drug', 'increase my dosage', 'reduce my dosage', 'change my prescription'
];

const PROHIBITED_PRESCRIPTION_PATTERNS = [
  'prescribe panchakarma', 'prescribe medicine to me', 'order therapy for me',
  'write me a prescription', 'what exact dose should i take', 'prescribe steroids'
];

// Security / Prompt Injection
const PROMPT_INJECTION_PATTERNS = [
  'ignore previous instructions', 'ignore all instructions', 'reveal secret',
  'system prompt', 'developer mode', 'jailbreak', 'reveal environment variables',
  'process.env', 'bypass security', 'you are now a hacker', 'forget your rules'
];

// Greetings & Casual Conversation
const GREETING_PATTERNS = [
  'hi', 'hello', 'namaste', 'hey', 'good morning', 'good afternoon', 'good evening',
  'greetings', 'vanakkam', 'pranam', 'how are you', 'who are you', 'what can you do',
  'thank you', 'thanks', 'dhanyawad', 'bye', 'goodbye', 'see you'
];

// Out of Scope
const OUT_OF_SCOPE_PATTERNS = [
  'capital of', 'president of', 'weather in', 'crypto', 'bitcoin', 'stock market',
  'python code', 'javascript code', 'write a poem about cars', 'football score',
  'cricket score', 'movie review', 'recipe for pizza', 'plan my vacation', 'tell me a joke'
];

/**
 * Classify intent with confidence and metadata
 */
function classifyIntent(text, entities = {}) {
  const normalized = normalizeText(text);

  // 1. Emergency Safety Check (Highest Priority)
  for (const pattern of EMERGENCY_PATTERNS) {
    if (normalized.includes(pattern)) {
      return {
        intent: 'EMERGENCY',
        confidence: 0.99,
        category: 'SAFETY',
        isEmergency: true,
        matchedPattern: pattern,
      };
    }
  }

  // 2. Prompt Injection Defense
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (normalized.includes(pattern)) {
      return {
        intent: 'SECURITY_INJECTION',
        confidence: 0.98,
        category: 'SECURITY',
        isSecurityRisk: true,
        matchedPattern: pattern,
      };
    }
  }

  // 3. Prohibited Clinical Requests
  for (const pattern of PROHIBITED_DIAGNOSIS_PATTERNS) {
    if (normalized.includes(pattern)) {
      return {
        intent: 'PROHIBITED_DIAGNOSIS',
        confidence: 0.95,
        category: 'SAFETY_PROHIBITED',
        matchedPattern: pattern,
      };
    }
  }

  const isMedicationStop =
    (normalized.includes('stop') || normalized.includes('discontinue') || normalized.includes('replace') || normalized.includes('quit')) &&
    (normalized.includes('medicine') || normalized.includes('medication') || normalized.includes('prescription') || normalized.includes('pills') || normalized.includes('drugs'));

  for (const pattern of PROHIBITED_MEDICATION_PATTERNS) {
    if (normalized.includes(pattern) || isMedicationStop) {
      return {
        intent: 'PROHIBITED_MEDICATION_MODIFICATION',
        confidence: 0.95,
        category: 'SAFETY_PROHIBITED',
        matchedPattern: pattern,
      };
    }
  }

  for (const pattern of PROHIBITED_PRESCRIPTION_PATTERNS) {
    if (normalized.includes(pattern)) {
      return {
        intent: 'PROHIBITED_PRESCRIPTION',
        confidence: 0.95,
        category: 'SAFETY_PROHIBITED',
        matchedPattern: pattern,
      };
    }
  }

  // 4. Out of Scope Check
  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (normalized.includes(pattern)) {
      return {
        intent: 'OUT_OF_SCOPE',
        confidence: 0.90,
        category: 'OUT_OF_SCOPE',
        matchedPattern: pattern,
      };
    }
  }

  // 5. Greetings & Conversation
  for (const pattern of GREETING_PATTERNS) {
    if (normalized === pattern || normalized.startsWith(pattern + ' ') || normalized.endsWith(' ' + pattern)) {
      return {
        intent: 'GREETING_OR_CONVERSATION',
        confidence: 0.95,
        category: 'CONVERSATION',
        matchedPattern: pattern,
      };
    }
  }

  // 6. Patient Personalized Context Inquiries
  if (
    (normalized.includes('my') || normalized.includes('i have') || normalized.includes('when is')) &&
    (normalized.includes('appointment') || normalized.includes('booking') || normalized.includes('session time') || normalized.includes('doctor name') || normalized.includes('therapist'))
  ) {
    return {
      intent: 'PATIENT_APPOINTMENT_INQUIRY',
      confidence: 0.88,
      category: 'PATIENT_OPERATIONAL',
    };
  }

  if (
    (normalized.includes('my') || normalized.includes('current') || normalized.includes('active')) &&
    (normalized.includes('plan') || normalized.includes('prescription') || normalized.includes('progress') || normalized.includes('treatment course'))
  ) {
    return {
      intent: 'PATIENT_THERAPY_STATUS',
      confidence: 0.88,
      category: 'PATIENT_OPERATIONAL',
    };
  }

  // 7. Prakriti Assessment Inquiries
  if (
    normalized.includes('prakriti') ||
    normalized.includes('constitution') ||
    normalized.includes('my dosha') ||
    normalized.includes('assess my constitution') ||
    (entities.concepts && entities.concepts.includes('prakriti'))
  ) {
    return {
      intent: 'PRAKRITI_INQUIRY',
      confidence: 0.90,
      category: 'AYURVEDA_CONSTITUTION',
    };
  }

  // 8. Therapy Preparation & Aftercare Inquiries
  if (
    normalized.includes('prepare') ||
    normalized.includes('preparation') ||
    normalized.includes('before therapy') ||
    normalized.includes('before session') ||
    normalized.includes('what should i do before') ||
    normalized.includes('purvakarma')
  ) {
    return {
      intent: 'THERAPY_PREPARATION',
      confidence: 0.88,
      category: 'THERAPY_PROTOCOL',
    };
  }

  if (
    normalized.includes('aftercare') ||
    normalized.includes('after therapy') ||
    normalized.includes('post therapy') ||
    normalized.includes('after session') ||
    normalized.includes('shower after') ||
    normalized.includes('paschatkarma')
  ) {
    return {
      intent: 'THERAPY_AFTERCARE',
      confidence: 0.88,
      category: 'THERAPY_PROTOCOL',
    };
  }

  // 9. Herb Inquiries
  if (
    entities.herbs && entities.herbs.length > 0 ||
    normalized.includes('herb') || normalized.includes('plant') || normalized.includes('churna') ||
    normalized.includes('vati') || normalized.includes('oil') || normalized.includes('taila')
  ) {
    return {
      intent: 'HERB_INQUIRY',
      confidence: entities.herbs && entities.herbs.length > 0 ? 0.92 : 0.78,
      category: 'AYURVEDIC_MATERIA_MEDICA',
    };
  }

  // 10. Therapy Inquiries
  if (
    entities.therapies && entities.therapies.length > 0 ||
    normalized.includes('panchakarma') || normalized.includes('therapy') ||
    normalized.includes('massage') || normalized.includes('treatment')
  ) {
    return {
      intent: 'THERAPY_INQUIRY',
      confidence: entities.therapies && entities.therapies.length > 0 ? 0.92 : 0.80,
      category: 'THERAPY_PROTOCOL',
    };
  }

  // 11. Diet & Lifestyle
  if (
    normalized.includes('diet') || normalized.includes('eat') || normalized.includes('food') ||
    normalized.includes('dinacharya') || normalized.includes('ritucharya') || normalized.includes('sleep') ||
    normalized.includes('digestion') || normalized.includes('kitchari') || normalized.includes('pathya') ||
    (entities.concepts && (entities.concepts.includes('dinacharya') || entities.concepts.includes('ritucharya') || entities.concepts.includes('pathya')))
  ) {
    return {
      intent: 'DIET_LIFESTYLE',
      confidence: 0.85,
      category: 'LIFESTYLE_DIET',
    };
  }

  // 12. General Ayurveda Inquiries
  if (
    (entities.doshas && entities.doshas.length > 0) ||
    normalized.includes('dosha') || normalized.includes('ayurveda') ||
    normalized.includes('classical') || normalized.includes('samhita')
  ) {
    return {
      intent: 'GENERAL_AYURVEDA',
      confidence: 0.82,
      category: 'GENERAL_EDUCATION',
    };
  }

  // 13. Very short or uninterpretable input
  if (normalized.length < 3 || !/[a-zA-Z]/.test(normalized)) {
    return {
      intent: 'CLARIFICATION_NEEDED',
      confidence: 0.40,
      category: 'AMBIGUOUS',
    };
  }

  // Default fallback
  return {
    intent: 'GENERAL_AYURVEDA',
    confidence: 0.65,
    category: 'GENERAL_EDUCATION',
  };
}

module.exports = {
  EMERGENCY_PATTERNS,
  PROHIBITED_DIAGNOSIS_PATTERNS,
  PROHIBITED_MEDICATION_PATTERNS,
  PROHIBITED_PRESCRIPTION_PATTERNS,
  PROMPT_INJECTION_PATTERNS,
  GREETING_PATTERNS,
  OUT_OF_SCOPE_PATTERNS,
  classifyIntent,
};
