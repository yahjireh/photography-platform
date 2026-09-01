import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Icons } from '../components/ui/icons';
import { ChatMessage } from '../types';

const PhotographerAI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Welcome to Studio Command AI. I can assist with client communication drafts, contract terms, posing guides, or technical troubleshooting. How can I support your workflow today?',
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY; 
      if (!apiKey) {
        // Fallback simulation if no key provided
        setTimeout(() => {
             const simResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "I'm running in demo mode. For that lighting situation, I'd recommend ISO 400, f/2.8, and 1/200s. Would you like me to draft a message to the client explaining the golden hour timing?",
                timestamp: Date.now()
             }
             setMessages(prev => [...prev, simResponse]);
             setIsLoading(false);
        }, 1500);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const context = `You are a professional studio assistant for a high-end photographer using the LensCreate app. 
      You help with:
      1. Drafting professional replies to clients regarding bookings, delays, or pricing.
      2. Suggesting creative pose ideas or lighting setups.
      3. Explaining technical camera settings.
      4. Providing business advice for growing a photography studio.
      
      Be concise, professional, and adopt a "Studio Manager" persona.
      User request: ${userMsg.text}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: context,
      });

      const text = response.text;
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text || "I'm having trouble accessing the studio database. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "System error. Please verify your connection.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 pb-20">
      <div className="bg-gray-800 p-6 pt-8 rounded-b-[30px] shadow-lg border-b border-gray-700 mb-2">
        <div className="flex items-center space-x-3 text-white">
            <div className="bg-brand-DEFAULT p-2 rounded-xl text-gray-900">
                <Icons.Aperture size={24} />
            </div>
            <div>
                <h1 className="font-bold text-lg font-serif italic tracking-wide">Studio Assistant</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI Command Center</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gray-100 text-gray-900 rounded-tr-none font-medium'
                  : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2 border border-gray-700">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about contracts, lighting, posing..."
            className="w-full bg-gray-800 border border-gray-700 text-white py-3.5 pl-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-DEFAULT focus:border-transparent text-sm placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-brand-DEFAULT text-gray-900 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-light transition-colors"
          >
            <Icons.Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotographerAI;