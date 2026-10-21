/**
 * NLP Processing Pipeline Index
 */

const { normalizeText, segmentSentences, tokenize, levenshteinDistance, fuzzyMatch } = require('./textNormalizer');
const { extractEntities } = require('./ayurvedicEntityExtractor');
const { classifyIntent } = require('./intentClassifier');
const { resolveContextualReference } = require('./referenceResolver');

/**
 * Process a message through the NLP pipeline
 * @param {string} rawMessage - User's raw text
 * @param {Array<{ sender: string, text: string }>} recentTurns - Recent conversation messages
 * @returns {Object} Structured NLP analysis result
 */
function process(rawMessage, recentTurns = []) {
  const startTime = Date.now();

  const normalizedText = normalizeText(rawMessage);
  const sentences = segmentSentences(rawMessage);
  const tokens = tokenize(normalizedText, true);

  // Contextual Reference Resolution
  const { resolvedQuery, wasResolved, resolvedEntity } = resolveContextualReference(rawMessage, recentTurns);
  const workingText = wasResolved ? resolvedQuery : rawMessage;

  // Entity Extraction (from resolved query)
  const entities = extractEntities(workingText);

  // Intent Classification (with entity awareness)
  const intentResult = classifyIntent(workingText, entities);

  const durationMs = Date.now() - startTime;

  return {
    rawMessage,
    workingText,
    normalizedText,
    tokens,
    sentences,
    wasContextuallyResolved: wasResolved,
    resolvedEntity,
    entities,
    intent: intentResult.intent,
    intentConfidence: intentResult.confidence,
    intentCategory: intentResult.category,
    isEmergency: !!intentResult.isEmergency,
    isSecurityRisk: !!intentResult.isSecurityRisk,
    matchedPattern: intentResult.matchedPattern || null,
    latencyMs: durationMs,
  };
}

module.exports = {
  process,
  normalizeText,
  segmentSentences,
  tokenize,
  extractEntities,
  classifyIntent,
  resolveContextualReference,
};
