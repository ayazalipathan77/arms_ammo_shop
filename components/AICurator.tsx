import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { getArtRecommendation } from '../services/geminiService';
import { ChatMessage } from '../types';

export const AICurator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Welcome to Arms & Ammo Shop. I am your personal gear advisor. Tell me what you are looking for, or ask about our latest firearms and gear.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await getArtRecommendation(input);

    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white p-4 rounded-full shadow-lg shadow-black/50 transition-all hover:scale-105 flex items-center justify-center gap-2 group"
        >
          <Bot size={20} className="group-hover:animate-spin" />
          <span className="font-serif italic hidden group-hover:block pr-2">AI Curator</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl w-80 sm:w-96 flex flex-col h-[500px] overflow-hidden">
          <div className="bg-stone-800 p-4 border-b border-stone-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="text-amber-500" size={18} />
              <h3 className="font-serif text-lg text-stone-100">AI Curator</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-tangerine">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-900/95">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user'
                    ? 'bg-amber-900/40 text-stone-100 border border-amber-800/50'
                    : 'bg-stone-800 text-stone-300 border border-stone-700'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-stone-800 p-3 rounded-lg text-xs text-stone-500 animate-pulse">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-stone-800 border-t border-stone-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about art..."
                className="flex-1 bg-stone-900 border border-stone-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-md disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
