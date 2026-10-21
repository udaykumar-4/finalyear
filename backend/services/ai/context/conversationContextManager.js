/**
 * Conversation Context Manager
 * Manages authorized patient profile context, sliding-window conversation turns,
 * token budgeting, and session boundaries.
 */

const ChatConversation = require('../../../models/chatConversation');
const User = require('../../../models/user');
const Prescription = require('../../../models/prescription');
const Appointment = require('../../../models/appointment');
const PrakritiAssessment = require('../../../models/prakritiAssessment');

const MAX_HISTORY_TURNS = 6; // Sliding window: last 6 turns (3 exchanges)
const MAX_CONTEXT_TOKENS_APPROX = 800;

/**
 * Retrieve recent turns for the active conversation
 */
async function getRecentConversationHistory(userId, conversationId = null, maxTurns = MAX_HISTORY_TURNS) {
  if (!conversationId) return { conversation: null, recentMessages: [] };

  try {
    const conversation = await ChatConversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation || !conversation.messages) {
      return { conversation: null, recentMessages: [] };
    }

    const messages = conversation.messages;
    const recentMessages = messages.slice(-maxTurns).map((m) => ({
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp,
    }));

    return {
      conversation,
      recentMessages,
    };
  } catch (err) {
    console.warn('Failed to retrieve conversation history:', err.message);
    return { conversation: null, recentMessages: [] };
  }
}

/**
 * Build authorized, minimal patient context strictly for authenticated patients
 */
async function buildAuthorizedPatientContext(user) {
  if (!user || user.role !== 'patient') {
    return {
      isPatient: false,
      contextData: {},
    };
  }

  try {
    const [patientUser, activeRx, nextAppt, latestPrakriti] = await Promise.all([
      User.findById(user._id).select('age gender condition allergies full_name').lean(),
      Prescription.findOne({ patientId: user._id, status: 'in-progress' }).lean(),
      Appointment.findOne({ patientId: user._id, status: 'scheduled' })
        .sort({ appointment_date: 1 })
        .lean(),
      PrakritiAssessment.findOne({ patientId: user._id })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const contextData = {};

    if (patientUser) {
      contextData.patientName = patientUser.full_name || 'Patient';
      contextData.age = patientUser.age || 'N/A';
      contextData.gender = patientUser.gender || 'N/A';
      contextData.recordedCondition = patientUser.condition || 'General Wellness';
      contextData.knownAllergies = patientUser.allergies || 'None Recorded';
    }

    if (activeRx) {
      contextData.activeTherapyPlan = activeRx.treatment;
      contextData.sessionProgress = `${activeRx.progressCompleted || 0} of ${activeRx.duration} sessions completed`;
      if (activeRx.notes) {
        contextData.doctorInstructionSummary = activeRx.notes;
      }
    }

    if (nextAppt) {
      contextData.nextUpcomingAppointment = `${nextAppt.treatment} on ${new Date(
        nextAppt.appointment_date
      ).toLocaleDateString()} at ${nextAppt.appointment_time}`;
    }

    if (latestPrakriti) {
      contextData.prakritiConstitution = latestPrakriti.dominantConstitution;
      contextData.constitutionType = latestPrakriti.constitutionType;
      contextData.doshaScores = `Vata: ${latestPrakriti.scores?.vata || 0}%, Pitta: ${latestPrakriti.scores?.pitta || 0}%, Kapha: ${latestPrakriti.scores?.kapha || 0}%`;
    }

    return {
      isPatient: true,
      contextData,
    };
  } catch (err) {
    console.warn('Error constructing patient context:', err.message);
    return {
      isPatient: true,
      contextData: {},
    };
  }
}

/**
 * Format conversation history into compact text for LLM prompt
 */
function formatHistoryForPrompt(recentMessages) {
  if (!recentMessages || recentMessages.length === 0) return 'No prior conversation in this session.';

  return recentMessages
    .map((m) => `${m.sender === 'user' ? 'Patient/User' : 'AyurSutra Assistant'}: ${m.text}`)
    .join('\n');
}

module.exports = {
  MAX_HISTORY_TURNS,
  MAX_CONTEXT_TOKENS_APPROX,
  getRecentConversationHistory,
  buildAuthorizedPatientContext,
  formatHistoryForPrompt,
};
