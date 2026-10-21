/**
 * Contextual Reference Resolver
 * Resolves pronouns ("it", "its", "that", "this") and elided references
 * using the immediate preceding conversation turns.
 */

const { extractEntities } = require('./ayurvedicEntityExtractor');
const { normalizeText } = require('./textNormalizer');

const PRONOUN_PATTERNS = [
  /\b(it|its|this|that|these|those)\b/i,
  /\b(that therapy|this therapy|that herb|this herb|that procedure|this procedure)\b/i,
  /\b(its benefits|its side effects|its contraindications|its oil|its procedure)\b/i,
  /\b(how do i prepare for it|can i take it|is it safe|what are its)\b/i,
];

/**
 * Check if the message contains an unresolved reference or pronoun
 */
function hasUnresolvedReference(text) {
  return PRONOUN_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Extract active topic/entity from the most recent user and assistant turns
 * @param {Array<{ sender: string, text: string }>} recentMessages
 */
function extractActiveContextEntity(recentMessages) {
  if (!recentMessages || recentMessages.length === 0) return null;

  // Walk backwards from the most recent messages to find the last mentioned clinical entity
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const msg = recentMessages[i];
    if (!msg || !msg.text) continue;

    const entities = extractEntities(msg.text);

    if (entities.therapies && entities.therapies.length > 0) {
      return {
        type: 'therapy',
        name: entities.therapies[0],
      };
    }
    if (entities.herbs && entities.herbs.length > 0) {
      return {
        type: 'herb',
        name: entities.herbs[0],
      };
    }
    if (entities.doshas && entities.doshas.length > 0) {
      return {
        type: 'dosha',
        name: entities.doshas[0],
      };
    }
    if (entities.concepts && entities.concepts.length > 0) {
      return {
        type: 'concept',
        name: entities.concepts[0],
      };
    }
  }

  return null;
}

/**
 * Resolve contextual reference in user's query
 * E.g., User asks "What are its benefits?" after asking "What is Abhyanga?"
 * -> Resolves query to "What are the benefits of Abhyanga?"
 *
 * @param {string} userMessage
 * @param {Array<{ sender: string, text: string }>} recentTurns
 * @returns {{ resolvedQuery: string, wasResolved: boolean, resolvedEntity: Object|null }}
 */
function resolveContextualReference(userMessage, recentTurns = []) {
  if (!userMessage) {
    return { resolvedQuery: userMessage, wasResolved: false, resolvedEntity: null };
  }

  // If the user already mentions an explicit clinical entity, no pronoun resolution needed
  const directEntities = extractEntities(userMessage);
  if (directEntities.hasClinicalEntity) {
    return {
      resolvedQuery: userMessage,
      wasResolved: false,
      resolvedEntity: directEntities.primaryEntity,
    };
  }

  // Check if user is asking a follow-up with a pronoun
  const needsResolution = hasUnresolvedReference(userMessage);
  if (!needsResolution) {
    return { resolvedQuery: userMessage, wasResolved: false, resolvedEntity: null };
  }

  // Find entity from conversation history
  const activeEntity = extractActiveContextEntity(recentTurns);
  if (!activeEntity) {
    return { resolvedQuery: userMessage, wasResolved: false, resolvedEntity: null };
  }

  // Format capitalized entity name
  const formattedEntity = activeEntity.name.charAt(0).toUpperCase() + activeEntity.name.slice(1);

  // Substitute pronouns into a self-contained query
  let resolvedQuery = userMessage;

  if (/\bwhat are its benefits\b/i.test(resolvedQuery)) {
    resolvedQuery = resolvedQuery.replace(/\bwhat are its benefits\b/i, `What are the benefits of ${formattedEntity}`);
  } else if (/\bits benefits\b/i.test(resolvedQuery)) {
    resolvedQuery = resolvedQuery.replace(/\bits benefits\b/i, `the benefits of ${formattedEntity}`);
  } else if (/\bits contraindications\b/i.test(resolvedQuery)) {
    resolvedQuery = resolvedQuery.replace(/\bits contraindications\b/i, `the contraindications of ${formattedEntity}`);
  } else if (/\bits side effects\b/i.test(resolvedQuery)) {
    resolvedQuery = resolvedQuery.replace(/\bits side effects\b/i, `the side effects of ${formattedEntity}`);
  } else if (/\bfor it\b/i.test(resolvedQuery)) {
    resolvedQuery = resolvedQuery.replace(/\bfor it\b/i, `for ${formattedEntity}`);
  } else if (/\btake it\b/i.test(resolvedQuery)) {
    resolvedQuery = resolvedQuery.replace(/\btake it\b/i, `take ${formattedEntity}`);
  } else if (/\b(this|that) (therapy|herb|procedure)\b/i.test(resolvedQuery)) {
    resolvedQuery = resolvedQuery.replace(/\b(this|that) (therapy|herb|procedure)\b/i, formattedEntity);
  } else if (/\bis it safe\b/i.test(resolvedQuery)) {
    resolvedQuery = resolvedQuery.replace(/\bis it safe\b/i, `Is ${formattedEntity} safe`);
  } else if (/\babout it\b/i.test(resolvedQuery)) {
    resolvedQuery = resolvedQuery.replace(/\babout it\b/i, `about ${formattedEntity}`);
  } else {
    // Append context tag for knowledge retrieval disambiguation
    resolvedQuery = `${userMessage} (referring to ${formattedEntity})`;
  }

  return {
    resolvedQuery,
    wasResolved: true,
    resolvedEntity: activeEntity,
  };
}

module.exports = {
  hasUnresolvedReference,
  extractActiveContextEntity,
  resolveContextualReference,
};
