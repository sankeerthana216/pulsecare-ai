import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { 
  Bot, 
  Send, 
  AlertTriangle, 
  Loader2, 
  HeartHandshake 
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'pt', label: 'Português' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ur', label: 'اردو' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
];

const AiAssistant: React.FC = () => {
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll chat to bottom when messages append
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, submitting]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query || submitting) return;

    // Append user message
    const userMsg: ChatMessage = {
      role: 'user',
      parts: [{ text: query }],
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setSubmitting(true);

    try {
      const response = await apiRequest('/chat', {
        method: 'POST',
        bodyData: {
          messages: updatedMessages,
          language,
        },
      });

      // Append assistant response
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error('Chat endpoint failed:', err);
      // Append fallback warning error message
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          parts: [{ text: '⚠️ Failed to connect to AI triage engine. Please check your connectivity and try again.' }],
        },
      ]);
    } finally {
      setSubmitting(false);
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/20 p-4 border border-white/5 rounded-2xl shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Bot className="h-5.5 w-5.5 text-primary" />
            AI Symptom Triage Assistant
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Informational only — not a substitute for clinical diagnostics</p>
        </div>

        {/* Language Triage Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-900 border border-white/5 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-primary"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Emergency Disclaimer Banner */}
      <div className="flex items-start gap-2.5 bg-yellow-500/10 border border-yellow-500/25 p-3 rounded-xl shrink-0 text-xs text-warning-foreground">
        <AlertTriangle className="h-4.5 w-4.5 text-warning shrink-0 mt-0.5" />
        <p>
          <strong>Emergency Warning:</strong> If you are experiencing a life-threatening emergency (e.g. chest pressure, sudden numbness, severe breathing difficulty), call your local emergency number (e.g. 911) immediately.
        </p>
      </div>

      {/* Chat History Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-slate-950/45 border border-white/5 rounded-3xl p-5 space-y-4 shadow-glass min-h-0"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 max-w-sm mx-auto space-y-4">
            <HeartHandshake className="h-10 w-10 text-primary/40 animate-pulse" />
            <div className="space-y-1">
              <h4 className="font-semibold text-white text-sm">Start Symptom Triage</h4>
              <p className="text-xs">
                Describe how you feel (e.g. <em>"I have a sore throat, cough, and slight temperature since yesterday."</em>) to receive AI recommendations.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const text = msg.parts.map((p) => p.text).join(' ');

          return (
            <div
              key={index}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-primary text-white shadow-md shadow-primary/10 rounded-tr-none'
                    : 'bg-slate-900 border border-white/5 text-slate-100 rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{text}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-white prose-p:my-1 prose-ul:my-1">
                    <ReactMarkdown>{text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {submitting && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              PulseCare AI is analyzing symptoms...
            </div>
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSend} className="flex gap-2 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Describe symptoms here..."
          className="flex-1 bg-slate-900 border border-white/5 rounded-2xl py-3 px-5 text-sm text-white focus:outline-none focus:border-primary transition-all duration-200 shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || submitting}
          className="h-12 w-12 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 transition-all duration-200 shrink-0"
        >
          <Send className="h-4.5 w-4.5 fill-white" />
        </button>
      </form>
    </div>
  );
};

export default AiAssistant;
