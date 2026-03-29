'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
type Level = (typeof LEVELS)[number];

function formatMessage(text: string) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function Home() {
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState<Level>('Beginner');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [langError, setLangError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const startSession = () => {
    const trimmedLang = language.trim();
    if (!trimmedLang) {
      setLangError(true);
      return;
    }
    setLangError(false);

    const welcomeMsg: Message = {
      role: 'assistant',
      content: `Welcome! I'm your personal **${trimmedLang}** tutor.\n\nWe'll be working at the **${level}** level. Feel free to write in ${trimmedLang} or ask me anything in English — I'll gently correct any mistakes and give you exercises along the way.\n\nLet's start! How are you doing today? Try responding in ${trimmedLang}!`,
    };
    setMessages([welcomeMsg]);
    setSessionStarted(true);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const sendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
          language,
          level,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error(data.error ?? 'Unknown error');
      }
    } catch {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: '❌ Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  const resetSession = () => {
    setSessionStarted(false);
    setMessages([]);
    setLanguage('');
    setLevel('Beginner');
    setInputValue('');
  };

  // ── SETUP VIEW ──────────────────────────────────────────────────────────────
  if (!sessionStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="w-full max-w-md relative z-10">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-icon mb-6">
              <span className="text-3xl">🌐</span>
            </div>
            <h1 className="hero-title">Language Learning<br />Companion</h1>
            <p className="hero-subtitle">
              Pick a language, choose your level, and start<br />
              practicing with your AI tutor.
            </p>
          </div>

          {/* Setup card */}
          <div className="glass-card rounded-3xl p-8 space-y-6">
            {/* Language input */}
            <div className="space-y-2">
              <label className="setup-label">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setLangError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && startSession()}
                placeholder="e.g. Spanish, Japanese, French…"
                className={`glass-input w-full ${langError ? 'glass-input-error' : ''}`}
                autoFocus
              />
              {langError && (
                <p className="text-red-400 text-xs mt-1 pl-1">Please enter a language to continue.</p>
              )}
            </div>

            {/* Level selector */}
            <div className="space-y-2">
              <label className="setup-label">Level</label>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`level-btn ${level === l ? 'level-btn-active' : 'level-btn-inactive'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button onClick={startSession} className="start-btn w-full mt-2">
              <span>Start Session</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline ml-2">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-white/20 text-xs mt-6">
            Powered by LLaMA 3.1 via Groq
          </p>
        </div>
      </div>
    );
  }

  // ── CHAT VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Header */}
      <header className="chat-header flex-shrink-0 flex items-center justify-between px-5 py-3.5 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl glass-icon-sm flex items-center justify-center">
            <span className="text-base">🌐</span>
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm leading-tight">Language Tutor</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="badge-language">{language}</span>
              <span className="badge-dot">·</span>
              <span className="badge-level">{level}</span>
            </div>
          </div>
        </div>
        <button onClick={resetSession} className="reset-btn">
          End session
        </button>
      </header>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 relative z-10 messages-scroll"
        id="messages-container"
      >
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bot-avatar flex items-center justify-center text-xs flex-shrink-0 mb-0.5">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'message-user' : 'message-bot'
                }`}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {formatMessage(msg.content)}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full user-avatar flex items-center justify-center text-xs flex-shrink-0 mb-0.5">
                  👤
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-end gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bot-avatar flex items-center justify-center text-xs flex-shrink-0">
                🤖
              </div>
              <div className="message-bot px-4 py-3.5">
                <div className="flex gap-1 items-center">
                  <div className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
                  <div className="typing-dot w-2 h-2 rounded-full bg-violet-400" style={{ animationDelay: '0.2s' }} />
                  <div className="typing-dot w-2 h-2 rounded-full bg-violet-400" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-5 pt-3 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="chat-input-wrap flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Write in your target language or ask a question…"
              className="flex-1 chat-textarea resize-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="send-btn flex-shrink-0"
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="text-center text-white/20 text-[11px] mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
