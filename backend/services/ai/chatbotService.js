/**
 * AyurSutra Advanced AI Chatbot Service
 * Modular Architecture:
 * User Message ➔ Input Validation ➔ NLP Preprocessing ➔ Intent & Entity Recognition
 * ➔ Safety & Emergency Gate ➔ Contextual Memory ➔ Authorized Patient Personalization
 * ➔ Hybrid RAG Retrieval ➔ LLM Orchestration / Safe Fallback ➔ Output Validation
 * ➔ Telemetry & Audit Logging
 */

const nlp = require('./nlp');
const safetyGuard = require('./safety/clinicalSafetyGuard');
const hybridRetriever = require('./rag/hybridRetriever');
const contextManager = require('./context/conversationContextManager');
const llmService = require('./llm/llmService');
const ChatConversation = require('../../models/chatConversation');
const AIAuditLog = require('../../models/aiAuditLog');

const userRateLimits = new Map();

class ChatbotService {
  /**
   * Check rate limiting (Max 20 requests per 15 minutes per user)
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 20;

    let timestamps = userRateLimits.get(userId.toString()) || [];
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return false;
    }

    timestamps.push(now);
    userRateLimits.set(userId.toString(), timestamps);
    return true;
  }

  /**
   * Main Chat Processing Pipeline
   * @param {Object} user - Authenticated user model
   * @param {string} messageText - Raw user query
   * @param {string|null} conversationId - Optional conversation ID
   */
  async processChatMessage(user, messageText, conversationId = null) {
    const pipelineStartTime = Date.now();

    // 1. Rate Limiting Check
    if (!this.checkRateLimit(user._id)) {
      return {
        success: false,
        status: 'rate_limited',
        isEmergency: false,
        response:
          'You have reached the maximum rate limit (20 messages per 15 minutes). Please wait a few minutes before asking another question.',
        isPersonalized: false,
        citations: [],
      };
    }

    // 2. Input Length & Type Validation
    if (!messageText || typeof messageText !== 'string' || messageText.trim().length === 0) {
      throw new Error('Message text cannot be empty');
    }

    if (messageText.length > 1000) {
      return {
        success: false,
        status: 'validation_error',
        isEmergency: false,
        response:
          'Message length exceeds the maximum limit of 1000 characters. Please shorten your question.',
        isPersonalized: false,
        citations: [],
      };
    }

    // 3. Conversation History Retrieval (Sliding window)
    const { conversation: existingConv, recentMessages } =
      await contextManager.getRecentConversationHistory(user._id, conversationId);

    // 4. Authorized Patient Context Retrieval (Scoped strictly by role)
    const { isPatient, contextData: patientContext } =
      await contextManager.buildAuthorizedPatientContext(user);

    // 5. NLP Preprocessing (Normalization, Typos, Entities, Intent, Reference Resolution)
    const nlpResult = nlp.process(messageText, recentMessages);

    // 6. Early Clinical Safety & Emergency Gate (Deterministic, Pre-RAG, Pre-LLM)
    const safetyCheck = safetyGuard.evaluatePreExecution(nlpResult, user, patientContext);

    if (safetyCheck.blocked) {
      const blockedPayload = safetyCheck.responsePayload;

      // Persist conversation even on safety blocks for clinician auditability
      const savedConv = await this.saveMessageExchange(
        user,
        conversationId,
        existingConv,
        messageText,
        blockedPayload.response,
        false
      );

      // Audit Log
      await this.logAudit({
        userId: user._id,
        role: user.role,
        conversationId: savedConv._id,
        intent: nlpResult.intent,
        isEmergency: !!blockedPayload.isEmergency,
        safetyTriggered: safetyCheck.reason,
      });

      return {
        ...blockedPayload,
        conversationId: savedConv._id,
        structured: {
          intent: nlpResult.intent,
          confidence: nlpResult.intentConfidence,
          safetyStatus: safetyCheck.reason,
          timing: { totalMs: Date.now() - pipelineStartTime },
        },
      };
    }

    // Attach allergy advisory to NLP result if detected
    if (safetyCheck.allergyWarning) {
      nlpResult.allergyAdvisory = safetyCheck.allergyWarning.advisory;
    }

    // 7. Hybrid RAG Knowledge Retrieval
    const retrievalQuery = nlpResult.workingText || messageText;
    const retrievedData = hybridRetriever.retrieve(retrievalQuery, nlpResult.entities, 3);

    // 8. LLM Response Generation (with timeout, retries, and offline fallback)
    const conversationHistoryText = contextManager.formatHistoryForPrompt(recentMessages);

    const llmResult = await llmService.generateResponse({
      userQuery: retrievalQuery,
      nlpResult,
      retrievedData,
      conversationHistoryText,
      patientContext,
    });

    // 9. Post-Execution Safety Validation & Output Sanitization
    const validatedOutput = safetyGuard.evaluatePostExecution(
      llmResult.answer,
      nlpResult,
      retrievedData.citations
    );

    // 10. Persist Conversation in Database
    const isPersonalized = isPatient && Object.keys(patientContext).length > 0;
    const finalAnswerText = validatedOutput.sanitizedText;

    const savedConv = await this.saveMessageExchange(
      user,
      conversationId,
      existingConv,
      messageText,
      finalAnswerText,
      isPersonalized
    );

    // 11. Performance Telemetry & Audit Logging (No PII)
    const totalDurationMs = Date.now() - pipelineStartTime;
    const timingTelemetry = {
      nlpMs: nlpResult.latencyMs,
      retrievalMs: retrievedData.retrievalLatencyMs,
      llmMs: llmResult.latencyMs,
      totalMs: totalDurationMs,
    };

    await this.logAudit({
      userId: user._id,
      role: user.role,
      conversationId: savedConv._id,
      intent: nlpResult.intent,
      isEmergency: false,
      safetyTriggered: null,
      provider: llmResult.provider,
      citationsCount: retrievedData.citations.length,
      latencyMs: totalDurationMs,
    });

    return {
      success: true,
      conversationId: savedConv._id,
      response: finalAnswerText,
      isEmergency: false,
      isPersonalized,
      disclaimer: '🌿 AyurSutra Intelligent Guidance System',
      citations: retrievedData.citations || [],
      entities: nlpResult.entities,
      intent: nlpResult.intent,
      wasContextuallyResolved: nlpResult.wasContextuallyResolved,
      provider: llmResult.provider,
      timing: timingTelemetry,
      structured: {
        intent: nlpResult.intent,
        confidence: nlpResult.intentConfidence,
        entities: nlpResult.entities,
        citations: retrievedData.citations,
        timing: timingTelemetry,
        evidenceSufficient: retrievedData.evidenceSufficient,
      },
    };
  }

  /**
   * Helper: Save exchange into ChatConversation
   */
  async saveMessageExchange(user, conversationId, existingConv, userText, assistantText, isPersonalized) {
    let conversation = existingConv;

    if (!conversation && conversationId) {
      conversation = await ChatConversation.findOne({ _id: conversationId, userId: user._id });
    }

    if (!conversation) {
      conversation = new ChatConversation({
        userId: user._id,
        role: user.role,
        title: userText.slice(0, 32) + (userText.length > 32 ? '...' : ''),
        messages: [],
      });
    }

    conversation.messages.push({
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    });

    conversation.messages.push({
      sender: 'assistant',
      text: assistantText,
      timestamp: new Date(),
      isPersonalized,
    });

    await conversation.save();
    return conversation;
  }

  /**
   * Helper: Log Non-PII Audit Telemetry
   */
  async logAudit({ userId, role, conversationId, intent, isEmergency, safetyTriggered, provider, citationsCount, latencyMs }) {
    try {
      await AIAuditLog.create({
        userId,
        role,
        action: 'AI_CHATBOT_MESSAGE',
        metadata: {
          conversationId,
          intent,
          isEmergency,
          safetyTriggered,
          provider: provider || 'unknown',
          citationsCount: citationsCount || 0,
          latencyMs: latencyMs || 0,
        },
      });
    } catch (err) {
      console.warn('Failed to record AI audit log:', err.message);
    }
  }

  /**
   * Get User Chat Conversation History
   */
  async getUserHistory(userId) {
    return await ChatConversation.find({ userId }).sort({ updatedAt: -1 });
  }

  /**
   * Delete Specific Chat Conversation
   */
  async deleteConversation(userId, conversationId) {
    const deleted = await ChatConversation.findOneAndDelete({ _id: conversationId, userId });
    return {
      success: !!deleted,
      message: deleted ? 'Conversation deleted successfully' : 'Conversation not found',
    };
  }
}

module.exports = new ChatbotService();
