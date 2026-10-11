import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Trash2, Bot, User, AlertCircle } from 'lucide-react';
import { aiService, ChatMessage } from '../../services/aiService';
import Button from '../common/Button';

export interface AIChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SUGGESTIONS = [
  'What are the five actions of Panchakarma?',
  'How should I prepare for Abhyanga therapy?',
  'What diet balances aggravated Pitta dosha?',
  'What are the guidelines after Shirodhara?',
];

export const AIChatbotDrawer: React.FC<AIChatbotDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Namaste! I am your AyurSutra Ayurvedic Wellness Assistant. How may I assist your Panchakarma therapy journey today?',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await aiService.sendMessage(text);
      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: res.response,
        isPersonalized: res.isPersonalized,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to Ayurvedic Assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: 'Chat history cleared. What questions can I answer about your Ayurvedic wellness plan?',
      },
    ]);
  };

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
          zIndex: 80,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '440px',
          height: '100vh',
          backgroundColor: 'var(--color-white)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--color-slate-200)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-slate-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-slate-50)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-emerald) 0%, var(--color-forest) 100%)',
                color: 'var(--color-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-forest)' }}>
                Ayurvedic Assistant
              </h2>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', fontWeight: 600 }}>
                Clinical Knowledge & Wellness Guidance
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
                transition: 'color var(--transition-fast)',
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
              }}
            >
              <X size={18} />
            </button>
          </div>
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
            backgroundColor: 'var(--color-cream)',
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
                      backgroundColor: 'var(--color-sage)',
                      color: 'var(--color-forest)',
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
                    maxWidth: '82%',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isUser ? 'var(--color-forest)' : 'var(--color-white)',
                    color: isUser ? 'var(--color-white)' : 'var(--color-slate-800)',
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    boxShadow: 'var(--shadow-xs)',
                    border: isUser ? 'none' : '1px solid var(--color-slate-200)',
                  }}
                >
                  {msg.text}
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
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-slate-400)', fontSize: '0.75rem' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-emerald)',
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

        {/* Suggestion Chips */}
        <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--color-white)', borderTop: '1px solid var(--color-slate-100)', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {DEFAULT_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(sug)}
              style={{
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-slate-100)',
                color: 'var(--color-slate-700)',
                border: '1px solid var(--color-slate-200)',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
              }}
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-white)' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              placeholder="Ask about therapies, diet, or doshas..."
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
