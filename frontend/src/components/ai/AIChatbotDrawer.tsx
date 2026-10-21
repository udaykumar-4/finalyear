import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Trash2,
  Bot,
  User as UserIcon,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { aiService, ChatMessage } from '../../services/aiService';
import Button from '../common/Button';

export interface AIChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userName?: string;
  onOpenTreatmentRecommendation?: () => void;
}

interface FormattedMessageProps {
  text: string;
  isUser: boolean;
  onOpenRecommendations?: () => void;
}

/**
 * Clean markdown-aware formatter that parses bold (**...**), bullet lists (•),
 * and classical section headers without displaying raw asterisk syntax.
 */
const FormattedMessage: React.FC<FormattedMessageProps> = ({
  text = '',
  isUser,
  onOpenRecommendations,
}) => {
  if (isUser) {
    return <span>{text || ''}</span>;
  }

  const safeText = typeof text === 'string' ? text : String(text || '');
  if (!safeText) return null;

  // Detect whether text mentions therapies/recommendations
  const mentionsTherapy =
    onOpenRecommendations &&
    (safeText.toLowerCase().includes('basti') ||
      safeText.toLowerCase().includes('panchakarma') ||
      safeText.toLowerCase().includes('therapy') ||
      safeText.toLowerCase().includes('treatment') ||
      safeText.toLowerCase().includes('recommend'));

  const lines = safeText.split('\n');

  const renderFormattedLine = (line: string, lineIndex: number) => {
    if (!line.trim()) {
      return <div key={lineIndex} style={{ height: '0.5rem' }} />;
    }

    // Parse **bold** parts in the line
    const parts = line.split(/(\*\*[^*]+\*\*)/g);

    const formattedParts = parts.map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2);
        return (
          <strong key={partIndex} style={{ fontWeight: 700, color: 'var(--color-slate-900)' }}>
            {innerText}
          </strong>
        );
      }
      return <span key={partIndex}>{part}</span>;
    });

    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
    const isHeader = line.includes('🌿 **') || line.includes('🥗 **') || line.includes('🧘 **');

    return (
      <div
        key={lineIndex}
        style={{
          marginTop: isHeader ? '0.5rem' : isBullet ? '0.25rem' : '0.125rem',
          paddingLeft: isBullet ? '0.5rem' : 0,
          lineHeight: 1.55,
        }}
      >
        {formattedParts}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div>{lines.map((l, i) => renderFormattedLine(l, i))}</div>

      {mentionsTherapy && (
        <div
          style={{
            marginTop: '0.875rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--color-slate-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.6875rem', color: '#4A6B56', fontWeight: 600 }}>
            Want tailored options for your symptoms?
          </span>
          <button
            type="button"
            onClick={onOpenRecommendations}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: '#E8F5E9',
              color: '#1E3F2B',
              border: '1px solid #C8E6C9',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={12} />
            <span>AI Treatment Recommendations</span>
            <ArrowRight size={10} />
          </button>
        </div>
      )}
    </div>
  );
};

interface SuggestionItem {
  label: string;
  query: string;
  icon: string;
}

export const AIChatbotDrawer: React.FC<AIChatbotDrawerProps> = ({
  isOpen,
  onClose,
  userRole = 'patient',
  userName = '',
  onOpenTreatmentRecommendation,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize Welcome Message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText =
        userRole === 'patient'
          ? `Namaste${userName ? ` ${userName}` : ''}! 🌿 I am your AyurSutra Ayurvedic Wellness Assistant.\n\nPowered by AyurSutra's Curated Knowledge Engine, I can guide you on classical Panchakarma therapies, therapeutic diets (Pathya), therapy preparation & aftercare, and answer questions about your active health profile.`
          : `Hello${userName ? ` Dr. ${userName}` : ''}! 🌿 I am your AyurSutra Clinical Decision & Protocol Assistant.\n\nAsk me about classical Panchakarma indications, contraindications, classical Samhita references, aftercare regimens, or clinic operational guidance.`;

      setMessages([
        {
          sender: 'assistant',
          text: welcomeText,
          timestamp: new Date().toISOString(),
          isPersonalized: false,
        },
      ]);
    }
  }, [isOpen, userRole, userName]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await aiService.sendMessage(text, conversationId);

      if (res.conversationId) {
        setConversationId(res.conversationId);
      }

      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: res.response,
        timestamp: new Date().toISOString(),
        isPersonalized: res.isPersonalized,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to Ayurvedic Assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (conversationId) {
      try {
        await aiService.deleteConversation(conversationId);
      } catch {
        // Non-critical
      }
    }
    setConversationId(undefined);
    setMessages([
      {
        sender: 'assistant',
        text: 'Conversation history cleared. What questions can I answer about your Ayurvedic wellness plan?',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const roleSuggestions: SuggestionItem[] =
    userRole === 'patient'
      ? [
          { label: 'Back Pain Relief', query: 'What treatments are recommended for back pain & stiffness?', icon: '🌿' },
          { label: 'Post-Therapy Diet', query: 'What diet should I follow after therapy?', icon: '🥗' },
          { label: 'Abhyanga Preparation', query: 'How do I prepare for Abhyanga massage?', icon: '💆' },
          { label: 'Ashwagandha Benefits', query: 'What are the benefits of Ashwagandha?', icon: '🌱' },
          { label: 'The Three Doshas', query: 'What are the three doshas and how do they balance health?', icon: '🧘' },
        ]
      : [
          { label: 'Basti Indications', query: 'What are the classical indications for Basti therapy?', icon: '🌿' },
          { label: 'Aftercare Protocols', query: 'Summarize standard Panchakarma aftercare protocols.', icon: '📋' },
          { label: 'Shirodhara Objectives', query: 'Explain the therapeutic objectives of Shirodhara.', icon: '💆' },
          { label: 'Samhita Citations', query: 'Show classical Samhita citations on Agni and Ama.', icon: '📖' },
        ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 110,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '460px',
          height: '100vh',
          backgroundColor: 'var(--color-white)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 120,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--color-slate-200)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.125rem 1.25rem',
            borderBottom: '1px solid var(--color-slate-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAF7F2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #1E3F2B 0%, #10B981 100%)',
                color: 'var(--color-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E3F2B', margin: 0 }}>
                AyurSutra Assistant
              </h2>
              <span style={{ fontSize: '0.6875rem', color: '#4A6B56', fontWeight: 600 }}>
                Powered by Curated Knowledge Engine
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <button
              type="button"
              onClick={clearChat}
              title="Clear conversation"
              style={{
                padding: '0.375rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-slate-400)',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)',
                border: 'none',
                background: 'none',
              }}
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.375rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-slate-400)',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div
          style={{
            backgroundColor: '#FFFBEB',
            borderBottom: '1px solid #FDE68A',
            padding: '0.5rem 1rem',
            fontSize: '0.6875rem',
            color: '#92400E',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <ShieldCheck size={13} color="#D97706" />
          <span>Educational & Clinical Guidance • Clinician verification required.</span>
        </div>

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: '#FAF7F2',
          }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  gap: '0.625rem',
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#E8F5E9',
                      color: '#1E3F2B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.25rem',
                    }}
                  >
                    <Bot size={16} />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: '14px',
                    backgroundColor: isUser ? '#1E3F2B' : 'var(--color-white)',
                    color: isUser ? 'var(--color-white)' : 'var(--color-slate-800)',
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    border: isUser ? 'none' : '1px solid #E2EBE4',
                  }}
                >
                  {msg.isPersonalized && !isUser && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: '#1E3F2B',
                        backgroundColor: '#E8F5E9',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span>💡 Personalized using your AyurSutra record</span>
                    </div>
                  )}

                  <FormattedMessage
                    text={msg.text}
                    isUser={isUser}
                    onOpenRecommendations={onOpenTreatmentRecommendation}
                  />

                  {/* Starter Topics on Initial Welcome Message */}
                  {idx === 0 && !isUser && messages.length === 1 && (
                    <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid #E2EBE4' }}>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: '#4A6B56',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                        }}
                      >
                        <Sparkles size={12} color="#10B981" />
                        <span>Quick Starter Topics</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {roleSuggestions.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendMessage(sug.query)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.3125rem 0.625rem',
                              borderRadius: '20px',
                              backgroundColor: '#FAF7F2',
                              color: '#1E3F2B',
                              border: '1px solid #D5E2D8',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3125rem',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#E8F5E9';
                              e.currentTarget.style.borderColor = '#1E3F2B';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FAF7F2';
                              e.currentTarget.style.borderColor = '#D5E2D8';
                            }}
                          >
                            <span>{sug.icon}</span>
                            <span>{sug.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {isUser && (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-slate-200)',
                      color: 'var(--color-slate-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '0.25rem',
                    }}
                  >
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4A6B56', fontSize: '0.75rem' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  animation: 'pulse 1s infinite',
                }}
              />
              <span>Consulting classical Ayurvedic knowledge base...</span>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '0.625rem 0.875rem',
                backgroundColor: 'var(--color-error-bg)',
                border: '1px solid var(--color-error-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-error)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Optional Collapsible Quick Prompts bar (toggled via Sparkles button) */}
        {showQuickPrompts && (
          <div
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#FAF7F2',
              borderTop: '1px solid #E2EBE4',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                flex: 1,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                paddingBottom: '2px',
              }}
            >
              {roleSuggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    handleSendMessage(sug.query);
                    setShowQuickPrompts(false);
                  }}
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '20px',
                    backgroundColor: 'var(--color-white)',
                    color: '#1E3F2B',
                    border: '1px solid #D5E2D8',
                    cursor: 'pointer',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    flexShrink: 0,
                  }}
                >
                  <span>{sug.icon}</span>
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowQuickPrompts(false)}
              title="Close suggested prompts"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-slate-400)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-white)' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <button
              type="button"
              onClick={() => setShowQuickPrompts((prev) => !prev)}
              title={showQuickPrompts ? 'Hide prompt ideas' : 'Show prompt ideas'}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: showQuickPrompts ? '#E8F5E9' : '#F1F5F9',
                border: showQuickPrompts ? '1.5px solid #10B981' : '1px solid var(--color-slate-200)',
                color: showQuickPrompts ? '#1E3F2B' : 'var(--color-slate-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={16} />
            </button>
            <input
              type="text"
              placeholder="Ask about therapies, back pain, diet, or doshas..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-slate-200)',
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputText.trim() || isLoading}
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AIChatbotDrawer;
