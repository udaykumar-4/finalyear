/**
 * Ayurvedic Entity Extractor
 * Extracts typed clinical and Ayurvedic entities with spelling variation and typo resilience.
 */

const { normalizeText, fuzzyMatch, tokenize } = require('./textNormalizer');

const DOSHA_DICTIONARY = [
  'vata', 'pitta', 'kapha', 'tridosha', 'vata-pitta', 'pitta-kapha', 'vata-kapha', 'samadosha'
];

const THERAPY_DICTIONARY = [
  'abhyanga', 'shirodhara', 'swedana', 'basti', 'nasya', 'vamana', 'virechana',
  'raktamokshana', 'pizhichil', 'kizhi', 'udvartana', 'shirobasti', 'kati basti',
  'janu basti', 'greeva basti', 'netra tarpana', 'mukha lepa', 'karna poorana',
  'snehana', 'panchakarma'
];

const HERB_DICTIONARY = [
  'ashwagandha', 'triphala', 'brahmi', 'tulsi', 'shatavari', 'turmeric', 'haridra',
  'guggulu', 'neem', 'amla', 'amalaki', 'giloy', 'guduchi', 'chyawanprash',
  'mahanarayan', 'ksheerabala', 'dashamoola', 'arjuna', 'manjistha', 'licorice',
  'yashtimadhu', 'ginger', 'shunthi', 'cumin', 'jeera', 'fennel', 'cardamom',
  'castor oil', 'haritaki', 'bibhitaki'
];

const CONCEPT_DICTIONARY = [
  'agni', 'ama', 'ojas', 'prakriti', 'vikriti', 'dinacharya', 'ritucharya',
  'pathya', 'apathya', 'koshta', 'dhatu', 'rasa', 'virya', 'vipaka', 'prabhava',
  'sattva', 'rajas', 'tamas', 'gunas'
];

const SYMPTOM_DICTIONARY = [
  'acidity', 'bloating', 'constipation', 'diarrhea', 'indigestion', 'gas',
  'insomnia', 'sleep', 'fatigue', 'lethargy', 'stress', 'anxiety',
  'joint pain', 'stiffness', 'arthritis', 'back pain', 'skin dryness', 'rash',
  'headache', 'migraine', 'cough', 'cold', 'weight gain', 'weight loss'
];

// Common typo corrections map
const COMMON_TYPOS = {
  'abyanga': 'abhyanga',
  'abhyangam': 'abhyanga',
  'abhyangha': 'abhyanga',
  'abhyang': 'abhyanga',
  'shirodara': 'shirodhara',
  'sirodhara': 'shirodhara',
  'shirodhar': 'shirodhara',
  'swedan': 'swedana',
  'svedana': 'swedana',
  'sweadana': 'swedana',
  'ashwaganda': 'ashwagandha',
  'aswagandha': 'ashwagandha',
  'ashwagand': 'ashwagandha',
  'triphla': 'triphala',
  'trifala': 'triphala',
  'thriphala': 'triphala',
  'tulasi': 'tulsi',
  'thulasi': 'tulsi',
  'satavari': 'shatavari',
  'vaata': 'vata',
  'vatha': 'vata',
  'pitha': 'pitta',
  'pittha': 'pitta',
  'kapfa': 'kapha',
  'kafa': 'kapha',
  'prakruthi': 'prakriti',
  'prakruti': 'prakriti',
  'vikruti': 'vikriti',
  'panchakarm': 'panchakarma',
  'panchkarma': 'panchakarma'
};

/**
 * Extract typed entities from normalized text
 */
function extractEntities(text) {
  const normalized = normalizeText(text);
  const tokens = tokenize(normalized, false);

  const entities = {
    doshas: new Set(),
    therapies: new Set(),
    herbs: new Set(),
    concepts: new Set(),
    symptoms: new Set(),
    unmappedTerms: [],
  };

  // 1. Direct Multi-word check (e.g. "kati basti", "joint pain")
  for (const therapy of THERAPY_DICTIONARY) {
    if (therapy.includes(' ') && normalized.includes(therapy)) {
      entities.therapies.add(therapy);
    }
  }
  for (const symptom of SYMPTOM_DICTIONARY) {
    if (symptom.includes(' ') && normalized.includes(symptom)) {
      entities.symptoms.add(symptom);
    }
  }

  // 2. Single token and typo check
  tokens.forEach((token) => {
    // Check known typo map first
    const correctedToken = COMMON_TYPOS[token] || token;

    if (DOSHA_DICTIONARY.includes(correctedToken)) {
      entities.doshas.add(correctedToken);
      return;
    }
    if (THERAPY_DICTIONARY.includes(correctedToken)) {
      entities.therapies.add(correctedToken);
      return;
    }
    if (HERB_DICTIONARY.includes(correctedToken)) {
      entities.herbs.add(correctedToken);
      return;
    }
    if (CONCEPT_DICTIONARY.includes(correctedToken)) {
      entities.concepts.add(correctedToken);
      return;
    }
    if (SYMPTOM_DICTIONARY.includes(correctedToken)) {
      entities.symptoms.add(correctedToken);
      return;
    }

    // Fuzzy check for longer tokens (length >= 5) to catch unexpected typos
    if (token.length >= 5) {
      const therapyFuzzy = fuzzyMatch(token, THERAPY_DICTIONARY, 2);
      if (therapyFuzzy) {
        entities.therapies.add(therapyFuzzy.match);
        return;
      }
      const herbFuzzy = fuzzyMatch(token, HERB_DICTIONARY, 2);
      if (herbFuzzy) {
        entities.herbs.add(herbFuzzy.match);
        return;
      }
      const conceptFuzzy = fuzzyMatch(token, CONCEPT_DICTIONARY, 2);
      if (conceptFuzzy) {
        entities.concepts.add(conceptFuzzy.match);
        return;
      }
    }
  });

  return {
    doshas: Array.from(entities.doshas),
    therapies: Array.from(entities.therapies),
    herbs: Array.from(entities.herbs),
    concepts: Array.from(entities.concepts),
    symptoms: Array.from(entities.symptoms),
    hasClinicalEntity: entities.therapies.size > 0 || entities.herbs.size > 0 || entities.doshas.size > 0,
    primaryEntity: entities.therapies.values().next().value ||
                   entities.herbs.values().next().value ||
                   entities.doshas.values().next().value ||
                   entities.concepts.values().next().value ||
                   null,
  };
}

module.exports = {
  DOSHA_DICTIONARY,
  THERAPY_DICTIONARY,
  HERB_DICTIONARY,
  CONCEPT_DICTIONARY,
  SYMPTOM_DICTIONARY,
  COMMON_TYPOS,
  extractEntities,
};
