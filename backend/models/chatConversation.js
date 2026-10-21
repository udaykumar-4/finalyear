const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isPersonalized: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const chatConversationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'AyurSutra Consultation'
  },
  messages: [messageSchema]
}, { timestamps: true });

chatConversationSchema.index({ userId: 1, updatedAt: -1 }, { background: true, name: 'idx_chatconversations_user_updated' });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
