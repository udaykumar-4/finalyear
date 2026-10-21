/**
 * Hybrid Knowledge Retriever
 * Combines tokenized TF-IDF lexical matching, entity-weighted boosting,
 * symptom awareness, provenance tracking, and citation construction.
 */

const { buildKnowledgeIndex } = require('./knowledgeRepository');
const { tokenize, normalizeText } = require('../nlp/textNormalizer');

/**
 * Perform hybrid retrieval on user query
 * @param {string} query - Processed / resolved query
 * @param {Object} entities - Extracted clinical entities
 * @param {number} topK - Maximum chunks to return
 * @returns {Object} Scored chunks, citations, and confidence status
 */
function retrieve(query, entities = {}, topK = 3) {
  const startTime = Date.now();
  const allChunks = buildKnowledgeIndex();

  if (!query || query.trim().length === 0) {
    return {
      chunks: [],
      citations: [],
      evidenceSufficient: false,
      confidence: 'LOW',
      retrievalLatencyMs: Date.now() - startTime,
    };
  }

  const queryTokens = tokenize(query, true);
  const normalizedQuery = normalizeText(query);

  if (queryTokens.length === 0) {
    return {
      chunks: [],
      citations: [],
      evidenceSufficient: false,
      confidence: 'LOW',
      retrievalLatencyMs: Date.now() - startTime,
    };
  }

  const isEmergencyQuery = !!entities.isEmergency || normalizedQuery.includes('emergency') || normalizedQuery.includes('unconscious') || normalizedQuery.includes('cannot breathe');

  // Filter chunks to prevent safety benchmarks from returning as standard answers for innocent inquiries
  const eligibleChunks = allChunks.filter((chunk) => {
    if (chunk.category === 'PROMPT_INJECTION') return false;
    if (chunk.category === 'EMERGENCY_SAFETY' && !isEmergencyQuery) return false;
    if (chunk.category === 'DIAGNOSIS_SAFETY' && entities.intent !== 'PROHIBITED_DIAGNOSIS') return false;
    if (chunk.category === 'MEDICATION_SAFETY' && entities.intent !== 'PROHIBITED_MEDICATION') return false;
    return true;
  });

  // Calculate scores for each knowledge chunk
  const scoredChunks = eligibleChunks.map((chunk) => {
    let score = 0;
    const chunkTitle = normalizeText(chunk.title);
    const chunkContent = normalizeText(chunk.content);
    const chunkKeywords = (chunk.keywords || []).map((k) => normalizeText(k));

    // 1. Direct Entity Matching Boost (High Precision)
    if (entities.therapies && entities.therapies.length > 0) {
      entities.therapies.forEach((th) => {
        const normTh = normalizeText(th);
        if (chunkTitle.includes(normTh)) score += 100;
        if (chunkKeywords.some((k) => k.includes(normTh))) score += 70;
        if (chunkContent.includes(normTh)) score += 30;
      });
    }

    if (entities.herbs && entities.herbs.length > 0) {
      entities.herbs.forEach((hb) => {
        const normHb = normalizeText(hb);
        if (chunkTitle.includes(normHb)) score += 100;
        if (chunkKeywords.some((k) => k.includes(normHb))) score += 70;
        if (chunkContent.includes(normHb)) score += 30;
      });
    }

    if (entities.doshas && entities.doshas.length > 0) {
      entities.doshas.forEach((d) => {
        const normD = normalizeText(d);
        if (chunkTitle.includes(normD)) score += 50;
        if (chunkKeywords.some((k) => k.includes(normD))) score += 30;
        if (chunkContent.includes(normD)) score += 15;
      });
    }

    // 2. Symptom & Clinical Need Boost
    if (entities.symptoms && entities.symptoms.length > 0) {
      entities.symptoms.forEach((sym) => {
        const normSym = normalizeText(sym);
        if (chunkTitle.includes(normSym)) score += 90;
        if (chunkKeywords.some((k) => k.includes(normSym))) score += 70;
        if (chunkContent.includes(normSym)) score += 40;
      });
    }

    // 3. Lexical Token Overlap (TF-IDF style weighting)
    queryTokens.forEach((token) => {
      if (token.length <= 2) return;

      if (chunkTitle.includes(token)) score += 35;
      if (chunkKeywords.some((k) => k.includes(token))) score += 25;
      if (chunkContent.includes(token)) score += 8;
    });

    // 4. Exact Phrase Match Bonus
    if (chunkContent.includes(normalizedQuery)) {
      score += 50;
    }

    return {
      chunk,
      score,
    };
  });

  // Filter out low-relevance results and sort descending
  const relevantResults = scoredChunks
    .filter((item) => item.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const durationMs = Date.now() - startTime;

  if (relevantResults.length === 0) {
    return {
      chunks: [],
      citations: [],
      evidenceSufficient: false,
      confidence: 'LOW',
      retrievalLatencyMs: durationMs,
    };
  }

  const topScore = relevantResults[0].score;
  const confidence = topScore >= 60 ? 'HIGH' : 'MEDIUM';

  // Format citations from retrieved chunks
  const citations = [];
  const seenCitations = new Set();

  relevantResults.forEach(({ chunk }) => {
    if (chunk.classicalReferences && Array.isArray(chunk.classicalReferences)) {
      chunk.classicalReferences.forEach((ref) => {
        const citationKey = `${ref.samhita}-${ref.sthana}-${ref.chapter}-${ref.verse}`;
        if (!seenCitations.has(citationKey)) {
          seenCitations.add(citationKey);
          citations.push({
            samhita: ref.samhita,
            sthana: ref.sthana,
            chapter: ref.chapter,
            verse: ref.verse,
            translation: ref.translation || '',
            sourceUrl: ref.sourceUrl || '',
            verified: ref.verified !== false,
            citationLabel: `${ref.samhita} ${ref.sthana || ''} Ch. ${ref.chapter} Verse ${ref.verse}`.trim(),
          });
        }
      });
    }
  });

  return {
    chunks: relevantResults.map((r) => ({
      id: r.chunk.id,
      title: r.chunk.title,
      category: r.chunk.category,
      content: r.chunk.content,
      sourceTitle: r.chunk.sourceTitle,
      relevanceScore: r.score,
      contraindications: r.chunk.contraindications || [],
      precautions: r.chunk.precautions || [],
    })),
    citations,
    evidenceSufficient: true,
    confidence,
    retrievalLatencyMs: durationMs,
  };
}

module.exports = {
  retrieve,
};
