/**
 * NLP Text Normalizer
 * Provides typo-tolerant cleaning, sentence segmentation, tokenization,
 * and diacritic/transliteration normalization for Ayurvedic terms.
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further',
  'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
  'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these',
  'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
  'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Remove accents and normalize Sanskrit diacritics
 */
function removeDiacritics(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[āĀ]/g, 'a')
    .replace(/[īĪ]/g, 'i')
    .replace(/[ūŪ]/g, 'u')
    .replace(/[ṛṚ]/g, 'ri')
    .replace(/[ṣṢśŚ]/g, 'sh')
    .replace(/[ñÑ]/g, 'n')
    .replace(/[ḍḌ]/g, 'd')
    .replace(/[ṭṬ]/g, 't');
}

/**
 * Normalize and clean input string
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\w\s\-\?\.\!\,\']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Segment text into sentences
 */
function segmentSentences(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Tokenize string into meaningful words
 */
function tokenize(text, removeStopWords = true) {
  const normalized = normalizeText(text);
  const words = normalized
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (!removeStopWords) return words;
  return words.filter(w => !STOP_WORDS.has(w));
}

/**
 * Calculate Levenshtein Distance for typo tolerance
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Fuzzy match term against known dictionary (returns best canonical term if distance <= maxDistance)
 */
function fuzzyMatch(term, dictionary, maxDistance = 2) {
  const cleanTerm = term.toLowerCase().trim();
  let bestMatch = null;
  let minDistance = Infinity;

  for (const canonical of dictionary) {
    const dist = levenshteinDistance(cleanTerm, canonical.toLowerCase());
    if (dist < minDistance && dist <= maxDistance) {
      minDistance = dist;
      bestMatch = canonical;
    }
  }

  return minDistance <= maxDistance ? { match: bestMatch, distance: minDistance } : null;
}

module.exports = {
  STOP_WORDS,
  removeDiacritics,
  normalizeText,
  segmentSentences,
  tokenize,
  levenshteinDistance,
  fuzzyMatch,
};
