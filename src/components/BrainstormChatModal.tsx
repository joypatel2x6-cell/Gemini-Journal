import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  ArrowDownToLine,
  RefreshCw,
  MessageSquareHeart,
  ShieldCheck,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface BrainstormChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToJournal?: (text: string) => void;
  context?: {
    currentEntryTitle?: string;
    currentEntryContent?: string;
    mood?: string;
    tags?: string[];
  };
}

const STARTER_PROMPTS = [
  'Help me explore what caused my mood shift today.',
  'Brainstorm 3 creative themes for my evening journal.',
  'Help me unpack a challenging conversation with compassion.',
  'Ask me 3 thoughtful questions to help me write deeply.',
];

export const BrainstormChatModal: React.FC<BrainstormChatModalProps> = ({
  isOpen,
  onClose,
  onInsertToJournal,
  context,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      role: 'model',
      content: `Hello! I'm your Gemini journaling companion. What thoughts, experiences, or feelings would you like to explore together today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
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
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Send conversation history to server-side Gemini endpoint
      const payload = {
        messages: newMessages.map((m) => ({
          role: m.role === 'model' ? 'model' : 'user',
          content: m.content,
        })),
        context,
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok && !data.reply) {
        throw new Error(data.error || 'Could not reach Gemini conversational companion. Please try again.');
      }

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply || 'I am reflecting on your thoughts. What aspect of this feels most meaningful right now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Error interacting with Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'initial-reset',
        role: 'model',
        content: `Fresh slate! What would you like to reflect on or brainstorm next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="brainstorm-chat-modal"
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col h-[640px] max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-white flex items-center justify-center shadow-xs">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-title font-semibold text-stone-900 dark:text-stone-100 text-base">
                  Gemini Brainstorm & Reflection Partner
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                  Multi-Turn AI
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Explore thoughts, unblock ideas, and process emotions interactively
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              title="Reset conversation"
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="close-brainstorm-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/40 dark:bg-stone-950/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-amber-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700/70 rounded-bl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                <div
                  className={`flex items-center justify-between pt-1 text-[10px] ${
                    msg.role === 'user' ? 'text-amber-200' : 'text-stone-400 dark:text-stone-500'
                  }`}
                >
                  <span>{msg.timestamp}</span>

                  {msg.role === 'model' && onInsertToJournal && (
                    <button
                      onClick={() => onInsertToJournal(msg.content)}
                      className="ml-3 px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-50 dark:bg-stone-700 dark:hover:bg-amber-950/60 text-stone-600 hover:text-amber-800 dark:text-stone-300 dark:hover:text-amber-300 transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <ArrowDownToLine className="w-3 h-3 text-amber-600" />
                      <span>Insert to draft</span>
                    </button>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-stone-500 dark:text-stone-400 text-xs py-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span>Gemini is reflecting and formulating thoughts...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900/60">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Conversation Starters (when only initial message exists) */}
        {messages.length <= 1 && (
          <div className="px-6 py-2 bg-stone-100/60 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap">Starters:</span>
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-300 whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="brainstorm-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for writing ideas, explore a feeling, or unpack a moment..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <button
              id="send-brainstorm-btn"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 disabled:hover:bg-amber-600 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-stone-400 dark:text-stone-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Server-side private proxy · Zero client secrets</span>
            </span>
            <span>Powered by Gemini</span>
          </div>
        </div>
      </div>
    </div>
  );
};
